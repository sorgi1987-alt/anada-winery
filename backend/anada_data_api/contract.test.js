'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { SCHEMA_VERSION, TABLES, healthPayload } = require('./contract')

test('publishes the complete schema v5 contract', () => {
  assert.equal(SCHEMA_VERSION, 5)
  assert.equal(TABLES.length, 22)
  assert.equal(new Set(TABLES.map((table) => table.name)).size, TABLES.length)
})

test('health remains degraded until every table is available', () => {
  const checks = TABLES.map((table, index) => ({ name: table.name, available: index !== 0 }))
  assert.equal(healthPayload(checks).status, 'degraded')
  assert.equal(healthPayload(checks).remoteWritesEnabled, false)
})

test('health reports ready only when all tables are available', () => {
  const checks = TABLES.map((table) => ({ name: table.name, available: true }))
  const payload = healthPayload(checks)
  assert.equal(payload.status, 'ready')
  assert.equal(payload.mode, 'schema-health-only')
  assert.equal(payload.schemaVersion, 5)
  assert.equal(payload.tableCount, 22)
  assert.equal(payload.remoteWritesEnabled, false)
})
