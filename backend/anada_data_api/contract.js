'use strict'

const SCHEMA_VERSION = 2

const TABLES = Object.freeze([
  Object.freeze({ name: 'Anada_Wineries', id: '11922000000093921' }),
  Object.freeze({ name: 'Anada_WineLots', id: '11922000000096178' }),
  Object.freeze({ name: 'Anada_Tanks', id: '11922000000094860' }),
  Object.freeze({ name: 'Anada_Tasks', id: '11922000000095587' }),
  Object.freeze({ name: 'Anada_Readings', id: '11922000000097280' }),
  Object.freeze({ name: 'Anada_Activities', id: '11922000000096537' }),
  Object.freeze({ name: 'Anada_SyncState', id: '11922000000098219' }),
])

function healthPayload(checks = []) {
  return {
    status: checks.every((check) => check.available) ? 'ready' : 'degraded',
    service: 'anada_data_api',
    mode: 'schema-health-only',
    schemaVersion: SCHEMA_VERSION,
    tableCount: TABLES.length,
    tables: checks,
    remoteWritesEnabled: false,
  }
}

module.exports = { SCHEMA_VERSION, TABLES, healthPayload }
