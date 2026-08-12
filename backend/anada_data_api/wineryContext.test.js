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

// Phase 9.5 stage 3 (Batch 1): movements + movementLegs - the first child
// table. A leg has no independent identity on the browser side (the id is
// synthesized as `${movementId}-${side}-${index}` in App.tsx), and every
// synced leg carries its own denormalized WineryID so syncTable's existing
// authorization check (wineryIds.includes(row.wineryId)) works unchanged -
// no child-table-specific authorization code was needed.
function movementFixture(overrides = {}) {
  return {
    id: 'movement-1', wineryId: 'winery-default', code: 'MOV-26-001', kind: 'transfer', wineType: 'tinto',
    grossSourceVolume: 5000, receivedVolume: 4950, lossVolume: 50, lossPercentage: 1,
    performedAt: '2026-08-12T10:00:00.000Z', recordedAt: '2026-08-12T10:00:05.000Z',
    operator: 'Sergio Castañares', notes: '', storageMode: 'browser-local', ...overrides,
  }
}

function movementLegFixture(overrides = {}) {
  return {
    id: 'movement-1-source-0', wineryId: 'winery-default', movementId: 'movement-1', side: 'source', sequence: 0,
    lotId: 'T-26-017', lotName: 'Ladera del Iregua', vesselId: 'D-12', volumeBefore: 5000, movementVolume: 5000, volumeAfter: 0,
    ...overrides,
  }
}

test('syncWineryData creates a movement alongside its child legs in one call', async () => {
  const tableRows = { ...membershipFixture(), Anada_WineMovements: [], Anada_MovementLegs: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    movements: [movementFixture()],
    movementLegs: [
      movementLegFixture(),
      movementLegFixture({ id: 'movement-1-destination-0', side: 'destination', vesselId: 'D-14', volumeBefore: 0, movementVolume: 4950, volumeAfter: 4950 }),
    ],
  })
  assert.equal(result.movements.written.length, 1)
  assert.equal(result.movements.written[0].code, 'MOV-26-001')
  assert.equal(result.movementLegs.written.length, 2)
  const [sourceLeg, destinationLeg] = result.movementLegs.written
  assert.equal(sourceLeg.side, 'source')
  assert.equal(sourceLeg.movementId, 'movement-1')
  assert.equal(destinationLeg.side, 'destination')
  assert.equal(destinationLeg.volumeAfter, 4950)
})

test('syncWineryData authorizes movement legs the same way as any other row - by their own denormalized wineryId', async () => {
  const tableRows = { ...membershipFixture(), Anada_MovementLegs: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    movementLegs: [movementLegFixture({ id: 'leg-not-mine', wineryId: 'winery-not-mine' })],
  })
  assert.equal(result.movementLegs.written.length, 0)
  assert.deepEqual(tableRows.Anada_MovementLegs, [])
})

// Phase 9.5 stage 3 (Batch 1): lots + readings + activities - the last and
// most complex slice of this batch. `process`/`productionDetails` use the
// new 'json' wireType (a JSON.stringify'd blob in a plain text column,
// since Catalyst has no native JSON type). `image`/`readings`/`activities`
// are deliberately not lot columns - readings/activities sync as their own
// child tables instead (below), with no fixed size unlike ProductionEvent's
// flattened metrics.
function lotFixture(overrides = {}) {
  return {
    id: 'L-2026-001', wineryId: 'winery-default', name: 'Ladera del Iregua', type: 'tinto', varieties: 'Tempranillo',
    origin: 'Alberite', vintage: 2026, volume: 7850, vessel: 'D-12', stage: 'Fermentación alcohólica y maceración',
    progress: 40, attention: 'normal', nextAction: 'Registrar densidad', nextTime: '16:00',
    process: [{ id: 'recepcion', label: 'Recepción', shortLabel: 'Recepción', status: 'complete' }],
    productionDetails: { receivedKg: 9340, receptionDate: '2026-08-01', initialDensity: 1.098, receptionTemperature: 17.8 },
    day: 4, temperature: 24.8, density: 1.046, attentionText: '', operationalStatus: 'active',
    campaignId: 'campaign-2026', currentVesselId: 'D-12', ...overrides,
  }
}

function readingFixture(overrides = {}) {
  return {
    id: 'L-2026-001::2026-08-12T10:00:00.000Z', wineryId: 'winery-default', lotId: 'L-2026-001',
    recordedAt: '2026-08-12T10:00:00.000Z', temperature: 24.8, density: 1.046, volume: 7850, note: 'Probe reading', ...overrides,
  }
}

function activityFixture(overrides = {}) {
  return {
    id: 'activity-1', wineryId: 'winery-default', lotId: 'L-2026-001', title: 'Lote creado',
    person: 'Sergio Castañares', detail: '9340 kg recibidos', recordedAt: '2026-08-12T10:00:00.000Z', ...overrides,
  }
}

test('syncWineryData round-trips a lot\'s process/productionDetails through the json wireType', async () => {
  const tableRows = { ...membershipFixture(), Anada_WineLots: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { lots: [lotFixture()] })
  assert.equal(created.lots.written.length, 1)
  const writtenLot = created.lots.written[0]
  assert.deepEqual(writtenLot.process, [{ id: 'recepcion', label: 'Recepción', shortLabel: 'Recepción', status: 'complete' }])
  assert.equal(writtenLot.productionDetails.receivedKg, 9340)
  // Flat Catalyst storage really did receive a JSON string, not a nested object.
  assert.equal(typeof tableRows.Anada_WineLots[0].ProcessJSON, 'string')
  assert.equal(JSON.parse(tableRows.Anada_WineLots[0].ProductionJSON).receivedKg, 9340)

  const currentRev = writtenLot._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    lots: [lotFixture({ process: [{ id: 'recepcion', label: 'Recepción', shortLabel: 'Recepción', status: 'complete' }, { id: 'encubado', label: 'Encubado', shortLabel: 'Encubado', status: 'current' }], _rev: currentRev })],
  })
  assert.equal(updated.lots.conflicts.length, 0)
  assert.equal(updated.lots.written[0].process.length, 2)
})

test('syncWineryData creates a lot\'s readings and activities as independent child collections', async () => {
  const tableRows = { ...membershipFixture(), Anada_Readings: [], Anada_Activities: [] }
  const app = fakeCatalystApp(tableRows)
  const result = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    readings: [readingFixture()],
    activities: [activityFixture()],
  })
  assert.equal(result.readings.written.length, 1)
  assert.equal(result.readings.written[0].lotId, 'L-2026-001')
  assert.equal(result.readings.written[0].temperature, 24.8)
  assert.equal(result.activities.written.length, 1)
  assert.equal(result.activities.written[0].title, 'Lote creado')
})

// Batch 2 (Harvest slice): deliveries. scheduledDate/scheduledTime are plain
// form strings ('2026-09-17', '09:00'), not full ISO timestamps - only
// receivedAt is a real datetime.
function deliveryFixture(overrides = {}) {
  return {
    id: 'delivery-1', wineryId: 'winery-default', code: 'ENT-26-041', parcelId: 'PAR-ALB-014', grower: 'Viñedos Iregua',
    varieties: 'Tempranillo', origin: 'Alberite · Rioja Oriental', scheduledDate: '2026-09-17', scheduledTime: '09:00',
    expectedKg: 9340, status: 'received', vehicle: '1234ABC', processingDestination: 'Mesa de selección',
    receivedAt: '2026-08-12T13:00:00.000Z', grossKg: 9500, tareKg: 160, netKg: 9340, temperature: 17.8,
    potentialAlcohol: 13.4, condition: 'excellent', notes: '', growerId: 'grower-vinedos-iregua', campaignId: 'campaign-2026',
    ...overrides,
  }
}

test('syncWineryData round-trips a delivery, including its plain-string scheduledDate/scheduledTime', async () => {
  const tableRows = { ...membershipFixture(), Anada_Deliveries: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { deliveries: [deliveryFixture()] })
  assert.equal(created.deliveries.written.length, 1)
  const written = created.deliveries.written[0]
  assert.equal(written.scheduledDate, '2026-09-17')
  assert.equal(written.scheduledTime, '09:00')
  assert.equal(written.netKg, 9340)
  assert.equal(written.condition, 'excellent')

  const currentRev = written._rev
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    deliveries: [deliveryFixture({ status: 'received', notes: 'Uva sana', _rev: currentRev })],
  })
  assert.equal(updated.deliveries.conflicts.length, 0)
  assert.equal(updated.deliveries.written[0].notes, 'Uva sana')
})

// Batch 2 (Lab slice): samples. requestedAnalyses/results round-trip
// through the 'json' wireType (arrays with no independent identity);
// dueAt is a plain time-of-day string, not a real datetime.
function labSampleFixture(overrides = {}) {
  return {
    id: 'sample-1', wineryId: 'winery-default', code: 'LAB-26-001', sourceType: 'lot', sourceId: 'T-26-017',
    sourceName: 'Ladera del Iregua', wineType: 'tinto', profile: 'fermentation', collectedAt: '2026-08-12T15:00:00.000Z',
    collectedBy: 'Lucía Sáenz', assignedTo: 'Lucía Sáenz', dueAt: '17:00', priority: 'today', status: 'queued',
    requestedAnalyses: ['temperature', 'density', 'potential_alcohol'], results: [], notes: '', ...overrides,
  }
}

test('syncWineryData round-trips a lab sample\'s requestedAnalyses/results through the json wireType', async () => {
  const tableRows = { ...membershipFixture(), Anada_LabSamples: [] }
  const app = fakeCatalystApp(tableRows)
  const created = await syncWineryData(app, { emailId: 'sergio@example.com' }, { samples: [labSampleFixture()] })
  assert.equal(created.samples.written.length, 1)
  const written = created.samples.written[0]
  assert.deepEqual(written.requestedAnalyses, ['temperature', 'density', 'potential_alcohol'])
  assert.equal(written.dueAt, '17:00')
  assert.equal(typeof tableRows.Anada_LabSamples[0].RequestedAnalysesJSON, 'string')

  const currentRev = written._rev
  const results = [{ analysis: 'temperature', value: 24.8, unit: '°C', status: 'normal' }]
  const updated = await syncWineryData(app, { emailId: 'sergio@example.com' }, {
    samples: [labSampleFixture({ status: 'validated', results, validatedAt: '2026-08-12T16:00:00.000Z', _rev: currentRev })],
  })
  assert.equal(updated.samples.conflicts.length, 0)
  assert.deepEqual(updated.samples.written[0].results, results)
})
