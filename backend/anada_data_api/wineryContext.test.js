'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { getContextForUser, provisionFirstWinery, syncWineryData, queryRows, ProvisionError, SyncError, escapeZcqlString, toCatalystDatetime, fromCatalystDatetime, TABLE_FIELDS, WINERY_SCOPED_TABLES } = require('./wineryContext')

function matchesWhere(row, whereSql) {
  if (!whereSql) return true
  return whereSql.split(/\s+AND\s+/i).every((clause) => {
    const inMatch = clause.match(/^(\w+)\s+IN\s+\(([^)]*)\)$/i)
    if (inMatch) {
      const values = inMatch[2].split(',').map((v) => v.trim().replace(/^'|'$/g, '').replace(/''/g, "'"))
      return values.includes(String(row[inMatch[1]]))
    }
    const eqMatch = clause.match(/^(\w+)\s*=\s*'((?:[^']|'')*)'$/)
    if (eqMatch) return String(row[eqMatch[1]]) === eqMatch[2].replace(/''/g, "'")
    return true
  })
}

let fakeRevCounter = 0
const nextFakeRev = () => `rev-${++fakeRevCounter}`

function fakeCatalystApp(tableRows) {
  return {
    zcql: () => ({
      executeZCQLQuery: async (sql) => {
        const tableName = sql.match(/FROM (\w+)/)[1]
        const whereMatch = sql.match(/WHERE (.+)$/i)
        const rows = (tableRows[tableName] || []).filter((row) => matchesWhere(row, whereMatch ? whereMatch[1] : null))
        if (sql.startsWith('SELECT COUNT(ROWID)')) return [{ [tableName]: { 'COUNT(ROWID)': String(rows.length) } }]
        return rows.map((row) => ({ [tableName]: row }))
      },
    }),
    datastore: () => ({
      table: (tableName) => ({
        insertRow: async (row) => {
          const stored = { ...row, ROWID: nextFakeRev(), MODIFIEDTIME: nextFakeRev() }
          ;(tableRows[tableName] ||= []).push(stored)
          return stored
        },
        insertRows: async (rows) => {
          const stored = rows.map((row) => ({ ...row, ROWID: nextFakeRev(), MODIFIEDTIME: nextFakeRev() }))
          ;(tableRows[tableName] ||= []).push(...stored)
          return stored
        },
        updateRow: async (row) => {
          const rows = tableRows[tableName] || []
          const index = rows.findIndex((existing) => existing.ROWID === row.ROWID)
          const updated = { ...rows[index], ...row, MODIFIEDTIME: nextFakeRev() }
          rows[index] = updated
          return updated
        },
      }),
    }),
  }
}

test('every winery-scoped table name has a matching field map', () => {
  for (const tableName of Object.values(WINERY_SCOPED_TABLES)) {
    assert.ok(TABLE_FIELDS[tableName], `${tableName} is missing a field map`)
  }
})

// Regression test for a real bug caught live: ZCQL rejects any SELECT with
// more than 30 columns ("More than 30 select columns are not allowed").
// Anada_ProductionEvents has 41 app columns, so queryRows must split the
// SELECT into chunks and re-join the results by ROWID - this fake simulates
// Catalyst's own column-count enforcement and column projection (unlike the
// generic fakeCatalystApp below, which returns full rows regardless of what
// was actually selected and so can't catch this class of bug).
function fakeZcqlColumnLimitedApp(rows) {
  return {
    zcql: () => ({
      executeZCQLQuery: async (sql) => {
        const selectMatch = sql.match(/^SELECT (.+) FROM (\w+)/)
        const columns = selectMatch[1].split(',').map((c) => c.trim())
        const tableName = selectMatch[2]
        if (columns.length > 30) throw new Error('More than 30 select columns are not allowed')
        return rows.map((row) => {
          const projected = {}
          for (const column of columns) projected[column] = row[column]
          return { [tableName]: projected }
        })
      },
    }),
  }
}

test('queryRows splits a wide table\'s SELECT into ZCQL-legal chunks and re-joins them by ROWID', async () => {
  assert.ok(TABLE_FIELDS.Anada_ProductionEvents.length > 30, 'this test only proves something if the table actually needs chunking')
  const app = fakeZcqlColumnLimitedApp([{
    ROWID: 'row-1', MODIFIEDTIME: '2026-08-11 09:00:00', ProductionEventID: 'pe-1', WineryID: 'winery-default',
    LotID: 'T-26-017', Temperature: 24.8, Density: 1.046, SeparateWeightsConfirmed: 'true', MixingAfterWeighing: 'false',
  }])
  const rows = await queryRows(app, 'Anada_ProductionEvents', "WineryID = 'winery-default'")
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, 'pe-1')
  assert.equal(rows[0].metrics.temperature, 24.8)
  assert.equal(rows[0].metrics.density, 1.046)
  assert.equal(rows[0].metrics.separateWeightsConfirmed, true)
  assert.equal(rows[0]._rev, '2026-08-11 09:00:00')
})

test('escapeZcqlString neutralizes embedded quotes', () => {
  assert.equal(escapeZcqlString("O'Brien"), "O''Brien")
})

// Catalyst datetime columns reject ISO 8601 outright ("datetime value
// expected") and both store and return "yyyy-MM-dd HH:mm:ss" - verified
// empirically against a live insert+read round trip. Regression coverage
// for the exact bug that broke the first live provisioning attempt.
test("toCatalystDatetime converts ISO timestamps (any offset) to Catalyst's UTC wall-clock format", () => {
  assert.equal(toCatalystDatetime('2026-07-31T16:30:00+02:00'), '2026-07-31 14:30:00')
  assert.equal(toCatalystDatetime('2026-08-10T15:00:00.000Z'), '2026-08-10 15:00:00')
})

test('toCatalystDatetime omits empty or invalid values rather than sending something Catalyst would reject', () => {
  assert.equal(toCatalystDatetime(''), undefined)
  assert.equal(toCatalystDatetime(undefined), undefined)
  assert.equal(toCatalystDatetime('not a date'), undefined)
})

test("fromCatalystDatetime/toCatalystDatetime round-trip through Catalyst's wire format", () => {
  const catalystValue = '2026-08-10 16:26:35'
  const iso = fromCatalystDatetime(catalystValue)
  assert.equal(iso, '2026-08-10T16:26:35.000Z')
  assert.equal(toCatalystDatetime(iso), catalystValue)
})

test('an unmatched email with zero wineries reports bootstrap availability', async () => {
  const app = fakeCatalystApp({ Anada_Users: [], Anada_Wineries: [] })
  const context = await getContextForUser(app, { emailId: 'new@example.com' })
  assert.deepEqual(context, { status: 'unprovisioned', bootstrapAvailable: true })
})

test('an unmatched email with existing wineries reports no bootstrap access', async () => {
  const app = fakeCatalystApp({ Anada_Users: [], Anada_Wineries: [{ WineryID: 'w1' }] })
  const context = await getContextForUser(app, { emailId: 'second@example.com' })
  assert.deepEqual(context, { status: 'unprovisioned', bootstrapAvailable: false })
})

test('a matched user with no active membership reports unprovisioned, not bootstrap-available', async () => {
  const app = fakeCatalystApp({
    Anada_Users: [{ UserID: 'u1', Name: 'Sergio', Email: 'sergio@example.com', Status: 'active', CreatedAt: 't', UpdatedAt: 't', CreatedBy: 'u1', UpdatedBy: 'u1' }],
    Anada_Memberships: [],
  })
  const context = await getContextForUser(app, { emailId: 'sergio@example.com' })
  assert.deepEqual(context, { status: 'unprovisioned', bootstrapAvailable: false })
})

test('a matched user with an active membership resolves their full winery context', async () => {
  const app = fakeCatalystApp({
    Anada_Users: [{ UserID: 'u1', Name: 'Sergio', Email: 'sergio@example.com', Status: 'active', CreatedAt: 't', UpdatedAt: 't', CreatedBy: 'u1', UpdatedBy: 'u1' }],
    Anada_Memberships: [{ MembershipID: 'm1', WineryID: 'w1', UserID: 'u1', Role: 'owner', Status: 'active', CreatedAt: 't', UpdatedAt: 't', CreatedBy: 'u1', UpdatedBy: 'u1' }],
    Anada_Wineries: [{ WineryID: 'w1', Code: 'BVR', Name: 'Bodega Valdeiregua', LegalName: '', Municipality: '', Province: '', Designation: '', Timezone: 'Europe/Madrid', Status: 'active', Notes: '', CreatedAt: 't', UpdatedAt: 't', CreatedBy: 'u1', UpdatedBy: 'u1' }],
    Anada_Campaigns: [{ CampaignID: 'c1', WineryID: 'w1', Code: 'V26', Name: 'Vendimia 2026', Vintage: '2026', Status: 'active', StartsAt: 't', ExpectedHarvestStart: '', ExpectedEndAt: '', ClosedAt: '', IsDefault: 'true', Notes: '', CreatedAt: 't', UpdatedAt: 't', CreatedBy: 'u1', UpdatedBy: 'u1', ReopenedAt: '', ReopenedBy: '' }],
    Anada_Growers: [], Anada_Vineyards: [], Anada_VineyardParcels: [], Anada_CampaignParcelPlans: [],
    Anada_WineryLocations: [], Anada_Vessels: [], Anada_VesselAllocations: [],
  })
  const context = await getContextForUser(app, { emailId: 'sergio@example.com' })
  assert.equal(context.status, 'authenticated_with_membership')
  assert.equal(context.user.id, 'u1')
  assert.equal(context.memberships.length, 1)
  assert.equal(context.wineries.length, 1)
  assert.equal(context.wineries[0].name, 'Bodega Valdeiregua')
  assert.equal(context.campaigns.length, 1)
  assert.equal(context.campaigns[0].vintage, 2026)
  assert.equal(context.campaigns[0].isDefault, true)
  assert.deepEqual(context.growers, [])
})

test('a caller with no resolvable email is treated as unprovisioned without touching the datastore', async () => {
  const app = fakeCatalystApp({})
  const context = await getContextForUser(app, { emailId: null })
  assert.deepEqual(context, { status: 'unprovisioned', bootstrapAvailable: false })
})

const backfillPayload = {
  winery: {
    id: 'winery-default', code: 'BVR', name: 'Bodega Valdeiregua', legalName: 'Bodega Valdeiregua SL',
    municipality: 'Alberite', province: 'La Rioja', designation: 'DOCa Rioja', timezone: 'Europe/Madrid',
    status: 'active', notes: '', createdAt: 't', updatedAt: 't', createdBy: 'demo', updatedBy: 'demo',
  },
  campaigns: [{ id: 'campaign-1', wineryId: 'winery-default', code: 'V26', name: 'Vendimia 2026', vintage: 2026, status: 'active', startsAt: 't', isDefault: true, notes: '', createdAt: 't', updatedAt: 't', createdBy: 'demo', updatedBy: 'demo' }],
  growers: [], vineyards: [], parcels: [], campaignParcels: [], locations: [], vessels: [], vesselAllocations: [],
}

test('provisionFirstWinery bootstraps a real winery from the caller\'s own local data exactly once', async () => {
  const tableRows = { Anada_Users: [], Anada_Wineries: [] }
  const app = fakeCatalystApp(tableRows)
  const identity = { emailId: 'sergio@example.com', firstName: 'Sergio', lastName: 'Castañares' }
  const context = await provisionFirstWinery(app, identity, backfillPayload)
  assert.equal(context.status, 'authenticated_with_membership')
  assert.equal(context.user.name, 'Sergio Castañares')
  assert.equal(context.user.email, 'sergio@example.com')
  assert.equal(context.wineries.length, 1)
  assert.equal(context.wineries[0].id, 'winery-default')
  assert.equal(context.memberships.length, 1)
  assert.equal(context.memberships[0].role, 'owner')
  assert.equal(context.campaigns.length, 1)
  assert.equal(context.campaigns[0].id, 'campaign-1')
})

test('provisionFirstWinery refuses when the caller already has a user record', async () => {
  const tableRows = { Anada_Users: [{ UserID: 'u1', Email: 'sergio@example.com' }], Anada_Wineries: [] }
  const app = fakeCatalystApp(tableRows)
  await assert.rejects(
    () => provisionFirstWinery(app, { emailId: 'sergio@example.com' }, backfillPayload),
    (error) => error instanceof ProvisionError && error.code === 'already_provisioned',
  )
})

test('provisionFirstWinery refuses once any winery already exists, even for a brand new user', async () => {
  const tableRows = { Anada_Users: [], Anada_Wineries: [{ WineryID: 'w1' }] }
  const app = fakeCatalystApp(tableRows)
  await assert.rejects(
    () => provisionFirstWinery(app, { emailId: 'second@example.com' }, backfillPayload),
    (error) => error instanceof ProvisionError && error.code === 'not_first',
  )
})

test('provisionFirstWinery rejects a payload with no valid winery', async () => {
  const tableRows = { Anada_Users: [], Anada_Wineries: [] }
  const app = fakeCatalystApp(tableRows)
  await assert.rejects(
    () => provisionFirstWinery(app, { emailId: 'sergio@example.com' }, { winery: { id: 'w' } }),
    (error) => error instanceof ProvisionError && error.code === 'invalid_payload',
  )
})

function membershipFixture() {
  return {
    Anada_Users: [{ UserID: 'u1', Email: 'sergio@example.com' }],
    Anada_Memberships: [{ MembershipID: 'm1', WineryID: 'winery-default', UserID: 'u1', Role: 'owner', Status: 'active' }],
  }
}

function campaignFixture(overrides = {}) {
  return {
    id: 'campaign-1', wineryId: 'winery-default', code: 'V26', name: 'Vendimia 2026', vintage: 2026, status: 'active',
    startsAt: '2026-08-20T00:00:00.000Z', isDefault: true, notes: '', createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z', createdBy: 'user-x', updatedBy: 'user-x', ...overrides,
  }
}

test('syncWineryData refuses a caller with no active winery membership', async () => {
  const app = fakeCatalystApp({ Anada_Users: [], Anada_Memberships: [] })
  await assert.rejects(
    () => syncWineryData(app, { emailId: 'nobody@example.com' }, { campaigns: [campaignFixture()] }),
    (error) => error instanceof SyncError && error.code === 'no_access',
  )
})

test('syncWineryData creates a brand-new row and returns it with a revision', async () => {
  const tableRows = { ...membershipFixture(), Anada_Campaigns: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, { campaigns: [campaignFixture()] })
  assert.equal(result.campaigns.conflicts.length, 0)
  assert.equal(result.campaigns.written.length, 1)
  assert.equal(result.campaigns.written[0].id, 'campaign-1')
  assert.ok(result.campaigns.written[0]._rev)
})

test('syncWineryData updates an existing row when the caller\'s _rev matches the current one', async () => {
  const tableRows = { ...membershipFixture(), Anada_Campaigns: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { campaigns: [campaignFixture()] })
  const currentRev = created.campaigns.written[0]._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    campaigns: [campaignFixture({ name: 'Vendimia 2026 (renamed)', _rev: currentRev })],
  })
  assert.equal(updated.campaigns.conflicts.length, 0)
  assert.equal(updated.campaigns.written[0].name, 'Vendimia 2026 (renamed)')
})

test('syncWineryData reports a conflict instead of overwriting when the caller\'s _rev is stale', async () => {
  const tableRows = { ...membershipFixture(), Anada_Campaigns: [] }
  const app = fakeCatalystApp(tableRows)
  await syncWineryData(app, { emailId: 'sergio@example.com' }, { campaigns: [campaignFixture()] })
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    campaigns: [campaignFixture({ name: 'Conflicting edit', _rev: 'a-stale-revision' })],
  })
  assert.equal(result.campaigns.written.length, 0)
  assert.equal(result.campaigns.conflicts.length, 1)
  assert.equal(result.campaigns.conflicts[0].id, 'campaign-1')
  assert.equal(result.campaigns.conflicts[0].name, 'Vendimia 2026')
})

test('syncWineryData silently drops rows outside the caller\'s own winery membership rather than writing them', async () => {
  const tableRows = { ...membershipFixture(), Anada_Campaigns: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    campaigns: [campaignFixture({ id: 'campaign-2', wineryId: 'winery-not-mine' })],
  })
  assert.equal(result.campaigns.written.length, 0)
  assert.equal(result.campaigns.conflicts.length, 0)
  assert.deepEqual(tableRows.Anada_Campaigns, [])
})

test('syncWineryData writes across multiple tables in a single call and skips empty ones', async () => {
  const tableRows = { ...membershipFixture(), Anada_Campaigns: [], Anada_Growers: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    campaigns: [campaignFixture()],
    growers: [{ id: 'grower-1', wineryId: 'winery-default', code: 'VIT-001', name: 'Test Grower', legalName: 'Test Grower', growerType: 'unknown', country: 'España', status: 'active', notes: '' }],
    vineyards: [],
  })
  assert.equal(result.campaigns.written.length, 1)
  assert.equal(result.growers.written.length, 1)
  assert.equal(result.vineyards, undefined)
})

// Phase 9.5 stage 3 (Batch 1): tanks - first core cellar-operations table,
// no audit quartet (Tank has no createdAt/updatedAt/createdBy/updatedBy).
function tankFixture(overrides = {}) {
  return {
    id: 'tank-1', wineryId: 'winery-default', capacity: 5000, volume: 3200, usableCapacity: 4800,
    lot: 'T-26-017', type: 'tinto', stage: 'Fermentación alcohólica', temperature: 24.5, attention: 'normal', ...overrides,
  }
}

test('syncWineryData creates and updates a tank with no audit-quartet fields', async () => {
  const tableRows = { ...membershipFixture(), Anada_Tanks: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { tanks: [tankFixture()] })
  assert.equal(created.tanks.written.length, 1)
  assert.equal(created.tanks.written[0].capacity, 5000)
  assert.equal(created.tanks.written[0].usableCapacity, 4800)
  const currentRev = created.tanks.written[0]._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    tanks: [tankFixture({ temperature: 18.2, _rev: currentRev })],
  })
  assert.equal(updated.tanks.conflicts.length, 0)
  assert.equal(updated.tanks.written[0].temperature, 18.2)
})

// Phase 9.5 stage 3 (Batch 1): tasks. CellarTask.time is a free-text
// display string ('Hoy', '16:00'), not a real timestamp - regression
// coverage for the exact bug that broke the legacy Anada_Tasks.TaskDueAt
// column (a datetime column silently rejecting a non-ISO string).
function taskFixture(overrides = {}) {
  return {
    id: 'task-1', wineryId: 'winery-default', lot: 'T-26-017', title: 'Registrar densidad',
    time: 'Hoy', assignee: 'Sergio Castañares', priority: 'media', complete: false, ...overrides,
  }
}

test('syncWineryData round-trips CellarTask.time (a display string, not a datetime) unchanged', async () => {
  const tableRows = { ...membershipFixture(), Anada_Tasks: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { tasks: [taskFixture({ time: 'Hoy' })] })
  assert.equal(created.tasks.written.length, 1)
  assert.equal(created.tasks.written[0].time, 'Hoy')
  const currentRev = created.tasks.written[0]._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    tasks: [taskFixture({ time: '16:00', complete: true, _rev: currentRev })],
  })
  assert.equal(updated.tasks.conflicts.length, 0)
  assert.equal(updated.tasks.written[0].time, '16:00')
  assert.equal(updated.tasks.written[0].complete, true)
})

// Phase 9.5 stage 3 (Batch 1): productionEvents. ProductionEventMetrics (27
// optional scalar fields) is flattened onto flat Catalyst columns via dotted
// TABLE_FIELDS keys ('metrics.temperature', etc.) but stays a nested object
// on the browser side - this is the first table exercising getPath/setPath.
function productionEventFixture(overrides = {}) {
  return {
    id: 'production-event-1', wineryId: 'winery-default', lotId: 'L-2026-001', wineType: 'tinto', kind: 'operation',
    stageId: 'fermentacion', operationType: 'remontado', performedAt: '2026-08-11T09:00:00.000Z',
    recordedAt: '2026-08-11T09:00:05.000Z', operator: 'Sergio Castañares', notes: '', storageMode: 'browser-local',
    metrics: { temperature: 24.5, density: 1.0421, durationMinutes: 15 },
    ...overrides,
  }
}

test('syncWineryData round-trips ProductionEvent.metrics through dotted-path flattened columns', async () => {
  const tableRows = { ...membershipFixture(), Anada_ProductionEvents: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { productionEvents: [productionEventFixture()] })
  assert.equal(created.productionEvents.written.length, 1)
  const writtenEvent = created.productionEvents.written[0]
  assert.equal(writtenEvent.metrics.temperature, 24.5)
  assert.equal(writtenEvent.metrics.density, 1.0421)
  assert.equal(writtenEvent.metrics.durationMinutes, 15)
  // Metrics fields never set on this event come back null (Catalyst has no
  // concept of "unset column"), not absent - the browser-side equality fix
  // in wineryDiff.ts is what tolerates this, not this layer.
  assert.equal(writtenEvent.metrics.malicAcid, null)
  // Flat Catalyst storage really did receive dotted columns, not a nested object.
  assert.equal(tableRows.Anada_ProductionEvents[0].Temperature, 24.5)
  assert.equal(tableRows.Anada_ProductionEvents[0].metrics, undefined)

  const currentRev = writtenEvent._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    productionEvents: [productionEventFixture({ metrics: { temperature: 26.1, colorIntensity: 0.82 }, _rev: currentRev })],
  })
  assert.equal(updated.productionEvents.conflicts.length, 0)
  assert.equal(updated.productionEvents.written[0].metrics.temperature, 26.1)
  assert.equal(updated.productionEvents.written[0].metrics.colorIntensity, 0.82)
})
