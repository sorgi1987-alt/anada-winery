import test from 'node:test'
import assert from 'node:assert/strict'
import { assessHarvestWeather, type WineryWeather } from '../src/weather'

const weather = (precipitationMm: number, maxWindSpeedKmh: number, maxTemperatureC = 28): WineryWeather => ({
  temperatureC: 24, apparentTemperatureC: 24, relativeHumidity: 48, windSpeedKmh: 8, precipitationMm: 0,
  weatherCode: 1, observedAt: '2026-08-06T12:00', fetchedAt: '2026-08-06T12:01:00Z', source: 'Open-Meteo', cached: false,
  forecast48h: { precipitationMm, maxWindSpeedKmh, minTemperatureC: 14, maxTemperatureC, rainyHours: precipitationMm > 0 ? 3 : 0, startsAt: '2026-08-06T12:00', endsAt: '2026-08-08T11:00' },
})

test('harvest assessment is factual and threshold based', () => {
  assert.equal(assessHarvestWeather(weather(0, 18), 'es-ES').level, 'favourable')
  assert.equal(assessHarvestWeather(weather(2, 18), 'es-ES').level, 'caution')
  assert.equal(assessHarvestWeather(weather(9, 18), 'es-ES').level, 'adverse')
  assert.equal(assessHarvestWeather(weather(0, 48), 'es-ES').level, 'adverse')
})

test('harvest assessment refuses to recommend without forecast evidence', () => {
  assert.equal(assessHarvestWeather(null, 'en-GB').level, 'unavailable')
})
