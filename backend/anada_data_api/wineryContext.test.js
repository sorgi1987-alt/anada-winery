'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { getContextForUser, escapeZcqlString, TABLE_FIELDS, WINERY_SCOPED_TABLES } = require('./wineryContext')

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
