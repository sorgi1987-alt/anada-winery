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
}

const apiBase = (import.meta.env.VITE_CATALYST_READ_API_URL ?? '').trim().replace(/\/$/, '')
  || `${(import.meta.env.VITE_CATALYST_PROJECT_DOMAIN ?? 'https://anada-winery-20117369913.development.catalystserverless.eu').trim().replace(/\/$/, '')}/server/anada_data_api`

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
