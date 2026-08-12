'use strict'

const SCHEMA_VERSION = 3

const TABLES = Object.freeze([
  Object.freeze({ name: 'Anada_Wineries', id: '11922000000093921' }),
  Object.freeze({ name: 'Anada_WineLots', id: '11922000000096178' }),
  Object.freeze({ name: 'Anada_Tanks', id: '11922000000094860' }),
  Object.freeze({ name: 'Anada_Tasks', id: '11922000000095587' }),
  Object.freeze({ name: 'Anada_Readings', id: '11922000000097280' }),
  Object.freeze({ name: 'Anada_Activities', id: '11922000000096537' }),
  Object.freeze({ name: 'Anada_SyncState', id: '11922000000098219' }),
  Object.freeze({ name: 'Anada_Users', id: '11922000000124065' }),
  Object.freeze({ name: 'Anada_Memberships', id: '11922000000127104' }),
  Object.freeze({ name: 'Anada_Campaigns', id: '11922000000126495' }),
  Object.freeze({ name: 'Anada_Growers', id: '11922000000124478' }),
  Object.freeze({ name: 'Anada_Vineyards', id: '11922000000124837' }),
  Object.freeze({ name: 'Anada_VineyardParcels', id: '11922000000127505' }),
  Object.freeze({ name: 'Anada_CampaignParcelPlans', id: '11922000000126860' }),
  Object.freeze({ name: 'Anada_WineryLocations', id: '11922000000129220' }),
  Object.freeze({ name: 'Anada_Vessels', id: '11922000000128244' }),
  Object.freeze({ name: 'Anada_VesselAllocations', id: '11922000000129581' }),
  Object.freeze({ name: 'Anada_ProductionEvents', id: '11922000000127936' }),
  Object.freeze({ name: 'Anada_WineMovements', id: '11922000000125238' }),
  Object.freeze({ name: 'Anada_MovementLegs', id: '11922000000130364' }),
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
