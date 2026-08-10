'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { getContextForUser, provisionFirstWinery, ProvisionError, escapeZcqlString, toCatalystDatetime, fromCatalystDatetime, TABLE_FIELDS, WINERY_SCOPED_TABLES } = require('./wineryContext')

function fakeCatalystApp(tableRows) {
  return {
    zcql: () => ({
      executeZCQLQuery: async (sql) => {
        const tableName = sql.match(/FROM (\w+)/)[1]
        const rows = tableRows[tableName] || []
        if (sql.startsWith('SELECT COUNT(ROWID)')) return [{ [tableName]: { 'COUNT(ROWID)': String(rows.length) } }]
        return rows.map((row) => ({ [tableName]: row }))
      },
    }),
    datastore: () => ({
      table: (tableName) => ({
        insertRow: async (row) => { (tableRows[tableName] ||= []).push(row); return row },
        insertRows: async (rows) => { (tableRows[tableName] ||= []).push(...rows); return rows },
      }),
    }),
  }
}

test('every winery-scoped table name has a matching field map', () => {
  for (const tableName of Object.values(WINERY_SCOPED_TABLES)) {
    assert.ok(TABLE_FIELDS[tableName], `${tableName} is missing a field map`)
  }
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
