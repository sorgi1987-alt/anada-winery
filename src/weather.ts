import type { WeatherSnapshot } from './types'

export interface WineryWeatherForecast48h {
  precipitationMm: number
  maxWindSpeedKmh: number
  minTemperatureC: number
  maxTemperatureC: number
  rainyHours: number
  startsAt: string
  endsAt: string
}

export interface WineryWeather {
  temperatureC: number
  apparentTemperatureC: number
  relativeHumidity: number
  windSpeedKmh: number
  precipitationMm: number
  weatherCode: number
  observedAt: string
  fetchedAt: string
  source: 'Open-Meteo'
  cached: boolean
  stale?: boolean
  forecast48h?: WineryWeatherForecast48h
}

export interface HarvestWeatherAssessment {
  level: 'favourable' | 'caution' | 'adverse' | 'unavailable'
  title: string
  detail: string
}

const viteEnv = import.meta.env ?? {}

const apiBase = (viteEnv.VITE_CATALYST_READ_API_URL ?? '').trim().replace(/\/$/, '')
  || `${(viteEnv.VITE_CATALYST_PROJECT_DOMAIN ?? 'https://anada-winery-20117369913.development.catalystserverless.eu').trim().replace(/\/$/, '')}/server/anada_data_api`

export async function fetchWineryWeather(latitude: number, longitude: number, timeZone: string, signal?: AbortSignal): Promise<WineryWeather> {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), timezone: timeZone })
  const response = await fetch(`${apiBase}/weather?${params}`, { headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(`weather-http-${response.status}`)
  const payload = await response.json() as Partial<WineryWeather>
  if (typeof payload.temperatureC !== 'number' || typeof payload.windSpeedKmh !== 'number' || typeof payload.precipitationMm !== 'number') throw new Error('weather-invalid-response')
  return payload as WineryWeather
}

export function weatherCondition(code: number, locale: string) {
  const es = locale.startsWith('es')
  if (code === 0) return es ? 'Despejado' : 'Clear'
  if ([1,2].includes(code)) return es ? 'Poco nuboso' : 'Partly cloudy'
  if (code === 3) return es ? 'Cubierto' : 'Overcast'
  if ([45,48].includes(code)) return es ? 'Niebla' : 'Fog'
  if ([51,53,55,56,57].includes(code)) return es ? 'Llovizna' : 'Drizzle'
  if ([61,63,65,66,67,80,81,82].includes(code)) return es ? 'Lluvia' : 'Rain'
  if ([71,73,75,77,85,86].includes(code)) return es ? 'Nieve' : 'Snow'
  if ([95,96,99].includes(code)) return es ? 'Tormenta' : 'Thunderstorm'
  return es ? 'Variable' : 'Variable'
}

export function assessHarvestWeather(weather: WineryWeather | null, locale: string): HarvestWeatherAssessment {
  const es = locale.startsWith('es')
  const forecast = weather?.forecast48h
  if (!forecast) return { level: 'unavailable', title: es ? 'Previsión no disponible' : 'Forecast unavailable', detail: es ? 'No se emite recomendación sin datos de las próximas 48 horas.' : 'No recommendation is made without a 48-hour forecast.' }
  const rain = forecast.precipitationMm
  const wind = forecast.maxWindSpeedKmh
  const heat = forecast.maxTemperatureC
  if (rain >= 8 || wind >= 45) return { level: 'adverse', title: es ? 'Condiciones adversas' : 'Adverse conditions', detail: es ? `${rain.toFixed(1)} mm previstos · viento máximo ${Math.round(wind)} km/h.` : `${rain.toFixed(1)} mm forecast · peak wind ${Math.round(wind)} km/h.` }
  if (rain >= 1 || wind >= 30 || heat >= 35) return { level: 'caution', title: es ? 'Planificar con precaución' : 'Plan with caution', detail: es ? `${rain.toFixed(1)} mm previstos · viento máximo ${Math.round(wind)} km/h · máxima ${Math.round(heat)}°.` : `${rain.toFixed(1)} mm forecast · peak wind ${Math.round(wind)} km/h · high ${Math.round(heat)}°.` }
  return { level: 'favourable', title: es ? 'Condiciones favorables' : 'Favourable conditions', detail: es ? `Sin lluvia significativa · viento máximo ${Math.round(wind)} km/h · máxima ${Math.round(heat)}°.` : `No significant rain · peak wind ${Math.round(wind)} km/h · high ${Math.round(heat)}°.` }
}

export function weatherSnapshotFromWeather(entityType: WeatherSnapshot['entityType'], entityId: string, latitude: number, longitude: number, weather: WineryWeather): WeatherSnapshot {
  return { id: `weather-${entityType}-${entityId}-${Date.now()}`, entityType, entityId, capturedAt: new Date().toISOString(), observedAt: weather.observedAt, latitude, longitude, temperatureC: weather.temperatureC, apparentTemperatureC: weather.apparentTemperatureC, relativeHumidity: weather.relativeHumidity, windSpeedKmh: weather.windSpeedKmh, precipitationMm: weather.precipitationMm, weatherCode: weather.weatherCode, source: 'Open-Meteo', status: weather.cached ? 'cached' : 'live' }
}

export function unavailableWeatherSnapshot(entityType: WeatherSnapshot['entityType'], entityId: string, latitude: number, longitude: number, notes?: string): WeatherSnapshot {
  return { id: `weather-${entityType}-${entityId}-${Date.now()}`, entityType, entityId, capturedAt: new Date().toISOString(), latitude, longitude, source: 'unavailable', status: 'unavailable', notes }
}
