'use strict'

const express = require('express')
const catalyst = require('zcatalyst-sdk-node')
const { TABLES, healthPayload } = require('./contract')
const { resolveUser } = require('./identity')
const { getContextForUser, provisionFirstWinery, syncWineryData, ProvisionError, SyncError } = require('./wineryContext')

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '256kb' }))
app.use((_request, response, next) => {
  response.set('Cache-Control', 'no-store')
  response.set('Content-Type', 'application/json; charset=utf-8')
  next()
})

app.get('/health', async (request, response) => {
  try {
    const catalystApp = catalyst.initialize(request, { scope: 'admin' })
    const datastore = catalystApp.datastore()
    const checks = await Promise.all(TABLES.map(async (table) => {
      try {
        await datastore.table(table.name).getPagedRows({ maxRows: 1 })
        return { name: table.name, available: true }
      } catch {
        return { name: table.name, available: false }
      }
    }))
    const payload = healthPayload(checks)
    response.status(payload.status === 'ready' ? 200 : 503).json(payload)
  } catch {
    response.status(503).json({
      ...healthPayload(TABLES.map((table) => ({ name: table.name, available: false }))),
      message: 'Catalyst Data Store could not be checked.',
    })
  }
})

app.get('/whoami', async (request, response) => {
  const user = await resolveUser(request)
  if (!user) {
    response.status(401).json({ status: 'unauthenticated', message: 'No authenticated Catalyst session was found.' })
    return
  }
  response.status(200).json({
    status: 'authenticated',
    user: { user_id: user.userId, zuid: user.zuid, email_id: user.emailId, first_name: user.firstName, last_name: user.lastName },
  })
})

app.get('/me/context', async (request, response) => {
  const identity = await resolveUser(request)
  if (!identity) {
    response.status(401).json({ status: 'unauthenticated', message: 'No authenticated Catalyst session was found.' })
    return
  }
  try {
    const catalystApp = catalyst.initialize(request, { scope: 'admin' })
    const context = await getContextForUser(catalystApp, identity)
    response.status(200).json(context)
  } catch {
    response.status(503).json({ status: 'context_unavailable', message: 'Winery context could not be resolved.' })
  }
})

app.post('/me/provision', async (request, response) => {
  const identity = await resolveUser(request)
  if (!identity) {
    response.status(401).json({ status: 'unauthenticated', message: 'No authenticated Catalyst session was found.' })
    return
  }
  try {
    const catalystApp = catalyst.initialize(request, { scope: 'admin' })
    const context = await provisionFirstWinery(catalystApp, identity, request.body)
    response.status(201).json(context)
  } catch (error) {
    if (error instanceof ProvisionError) {
      response.status(error.code === 'invalid_payload' ? 400 : 409).json({ status: error.code, message: error.message })
      return
    }
    response.status(503).json({ status: 'provision_failed', message: 'Provisioning could not be completed.' })
  }
})

app.post('/me/sync', async (request, response) => {
  const identity = await resolveUser(request)
  if (!identity) {
    response.status(401).json({ status: 'unauthenticated', message: 'No authenticated Catalyst session was found.' })
    return
  }
  try {
    const catalystApp = catalyst.initialize(request, { scope: 'admin' })
    const result = await syncWineryData(catalystApp, identity, request.body)
    response.status(200).json({ status: 'synced', ...result })
  } catch (error) {
    if (error instanceof SyncError) {
      response.status(403).json({ status: error.code, message: error.message })
      return
    }
    response.status(503).json({ status: 'sync_failed', message: 'Sync could not be completed.' })
  }
})

const weatherCache = new Map()
app.get('/weather', async (request, response) => {
  const latitude = Number(request.query.latitude)
  const longitude = Number(request.query.longitude)
  const timezone = typeof request.query.timezone === 'string' ? request.query.timezone : 'Europe/Madrid'
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return response.status(400).json({ status: 'invalid_location', message: 'Valid latitude and longitude are required.' })
  }
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)},${timezone}`
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAtMs < 15 * 60 * 1000) return response.json({ ...cached.payload, cached: true })
  try {
    const query = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', hourly: 'temperature_2m,precipitation,wind_speed_10m', forecast_hours: '48', timezone })
    const upstream = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { headers: { Accept: 'application/json', 'User-Agent': 'Anada-Winery/0.30' } })
    if (!upstream.ok) throw new Error(`upstream-${upstream.status}`)
    const data = await upstream.json()
    const current = data.current || {}
    const hourly = data.hourly || {}
    const temperatures = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m.map(Number).filter(Number.isFinite).slice(0, 48) : []
    const precipitation = Array.isArray(hourly.precipitation) ? hourly.precipitation.map(Number).filter(Number.isFinite).slice(0, 48) : []
    const winds = Array.isArray(hourly.wind_speed_10m) ? hourly.wind_speed_10m.map(Number).filter(Number.isFinite).slice(0, 48) : []
    const times = Array.isArray(hourly.time) ? hourly.time.slice(0, 48) : []
    const forecast48h = temperatures.length && precipitation.length && winds.length ? { precipitationMm: precipitation.reduce((sum, value) => sum + value, 0), maxWindSpeedKmh: Math.max(...winds), minTemperatureC: Math.min(...temperatures), maxTemperatureC: Math.max(...temperatures), rainyHours: precipitation.filter((value) => value >= 0.1).length, startsAt: times[0], endsAt: times[times.length - 1] } : undefined
    const payload = { temperatureC: Number(current.temperature_2m), apparentTemperatureC: Number(current.apparent_temperature), relativeHumidity: Number(current.relative_humidity_2m), windSpeedKmh: Number(current.wind_speed_10m), precipitationMm: Number(current.precipitation), weatherCode: Number(current.weather_code), observedAt: current.time, fetchedAt: new Date().toISOString(), source: 'Open-Meteo', cached: false, forecast48h }
    if (![payload.temperatureC, payload.windSpeedKmh, payload.precipitationMm, payload.weatherCode].every(Number.isFinite)) throw new Error('invalid-upstream-payload')
    weatherCache.set(cacheKey, { fetchedAtMs: Date.now(), payload })
    return response.json(payload)
  } catch {
    if (cached) return response.status(200).json({ ...cached.payload, cached: true, stale: true })
    return response.status(503).json({ status: 'weather_unavailable', message: 'Weather data is temporarily unavailable.' })
  }
})

app.all('*', (_request, response) => {
  response.status(404).json({
    status: 'not_found',
    message: 'Unknown route. Operational reads are GET /me/context; writes are POST /me/provision (one-time bootstrap) and POST /me/sync (campaigns/growers/vineyards/parcels/campaign-parcel plans only, scoped to the caller\'s own winery membership).',
  })
})

module.exports = app
