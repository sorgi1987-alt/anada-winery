'use strict'

const express = require('express')
const catalyst = require('zcatalyst-sdk-node')
const { TABLES, healthPayload } = require('./contract')

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

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

app.all('*', (_request, response) => {
  response.status(404).json({
    status: 'not_found',
    message: 'Phase 3A exposes schema health only. Operational reads and every mutation remain disabled.',
  })
})

module.exports = app
