'use strict'
/**
 * Phase 9.5 stage 1: protected reads of the Catalyst Schema v2 tables,
 * scoped to the authenticated caller's own winery membership(s).
 *
 * Column-to-field maps mirror the Catalyst Schema v2 table definitions in
 * CATALYST_SCHEMA.md exactly (column name, browser field name, wire type).
 * `wireType` drives coercion only - Catalyst's REST/ZCQL responses are not
 * guaranteed to already be JS booleans/numbers.
 */

const str = (v) => (v === null || v === undefined ? null : String(v))
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const bool = (v) => v === true || v === 'true' || v === 1 || v === '1'

// Catalyst datetime columns store and return "yyyy-MM-dd HH:mm:ss" (UTC wall
// clock, no milliseconds, no offset) - verified empirically against a live
// insert+read round trip. ISO 8601 (what the browser and JS Date use
// everywhere else) is rejected outright ("datetime value expected").
const fromCatalystDatetime = (v) => (v ? `${String(v).replace(' ', 'T')}.000Z` : null)
const toCatalystDatetime = (v) => {
  if (!v) return undefined
  const date = new Date(v)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

const coerce = { string: str, number: num, boolean: bool, datetime: fromCatalystDatetime }

const TABLE_FIELDS = {
  Anada_Users: [
    ['UserID', 'id', 'string'], ['Name', 'name', 'string'], ['Email', 'email', 'string'], ['Status', 'status', 'string'],
    ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Memberships: [
    ['MembershipID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['UserID', 'userId', 'string'], ['Role', 'role', 'string'], ['Status', 'status', 'string'],
    ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Wineries: [
    ['WineryID', 'id', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'], ['LegalName', 'legalName', 'string'],
    ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Designation', 'designation', 'string'],
    ['Timezone', 'timezone', 'string'], ['Status', 'status', 'string'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Campaigns: [
    ['CampaignID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['Vintage', 'vintage', 'number'], ['Status', 'status', 'string'], ['StartsAt', 'startsAt', 'datetime'],
    ['ExpectedHarvestStart', 'expectedHarvestStart', 'datetime'], ['ExpectedEndAt', 'expectedEndAt', 'datetime'], ['ClosedAt', 'closedAt', 'datetime'],
    ['IsDefault', 'isDefault', 'boolean'], ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'],
    ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'], ['ReopenedAt', 'reopenedAt', 'datetime'], ['ReopenedBy', 'reopenedBy', 'string'],
  ],
  Anada_Growers: [
    ['GrowerID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['LegalName', 'legalName', 'string'], ['TradeName', 'tradeName', 'string'], ['GrowerType', 'growerType', 'string'], ['TaxID', 'taxId', 'string'],
    ['ContactName', 'contactName', 'string'], ['Email', 'email', 'string'], ['Phone', 'phone', 'string'], ['Address', 'address', 'string'],
    ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Country', 'country', 'string'], ['Status', 'status', 'string'],
    ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Vineyards: [
    ['VineyardID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['GrowerID', 'growerId', 'string'], ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Country', 'country', 'string'],
    ['LocationID', 'locationId', 'string'], ['Status', 'status', 'string'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_VineyardParcels: [
    ['ParcelID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['GrowerID', 'growerId', 'string'], ['LocationID', 'locationId', 'string'], ['CampaignID', 'campaignId', 'string'], ['EstateID', 'estateId', 'string'],
    ['Varieties', 'varieties', 'string'], ['Hectares', 'hectares', 'number'], ['Status', 'status', 'string'], ['Clone', 'clone', 'string'],
    ['Rootstock', 'rootstock', 'string'], ['PlantingYear', 'plantingYear', 'number'], ['TrainingSystem', 'trainingSystem', 'string'],
    ['Irrigation', 'irrigation', 'boolean'], ['AltitudeM', 'altitudeM', 'number'], ['Orientation', 'orientation', 'string'], ['Organic', 'organic', 'boolean'],
    ['Latitude', 'latitude', 'number'], ['Longitude', 'longitude', 'number'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_CampaignParcelPlans: [
    ['PlanID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['CampaignID', 'campaignId', 'string'], ['ParcelID', 'parcelId', 'string'],
    ['ExpectedKg', 'expectedKg', 'number'], ['ExpectedHarvestDate', 'expectedHarvestDate', 'datetime'], ['HarvestWindow', 'harvestWindow', 'string'],
    ['Status', 'status', 'string'], ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'datetime'], ['UpdatedAt', 'updatedAt', 'datetime'],
    ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_WineryLocations: [
    ['LocationID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['Type', 'type', 'string'], ['ParentLocationID', 'parentLocationId', 'string'], ['Active', 'active', 'boolean'],
  ],
  Anada_Vessels: [
    ['VesselID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['Type', 'type', 'string'], ['Material', 'material', 'string'], ['NominalCapacity', 'nominalCapacity', 'number'], ['UsableCapacity', 'usableCapacity', 'number'],
    ['Unit', 'unit', 'string'], ['LocationID', 'locationId', 'string'], ['Status', 'status', 'string'], ['CoolingJacket', 'coolingJacket', 'boolean'],
    ['Heating', 'heating', 'boolean'], ['VariableLid', 'variableLid', 'boolean'], ['PressureRated', 'pressureRated', 'boolean'], ['Active', 'active', 'boolean'],
  ],
  Anada_VesselAllocations: [
    ['AllocationID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['VesselID', 'vesselId', 'string'], ['WineLotID', 'wineLotId', 'string'],
    ['CampaignID', 'campaignId', 'string'], ['Volume', 'volume', 'number'], ['Unit', 'unit', 'string'], ['StartedAt', 'startedAt', 'datetime'],
    ['EndedAt', 'endedAt', 'datetime'], ['Status', 'status', 'string'],
  ],
}

// Winery-scoped tables read after membership is known, keyed by the
// response field name they're returned under.
const WINERY_SCOPED_TABLES = {
  campaigns: 'Anada_Campaigns',
  growers: 'Anada_Growers',
  vineyards: 'Anada_Vineyards',
  parcels: 'Anada_VineyardParcels',
  campaignParcels: 'Anada_CampaignParcelPlans',
  locations: 'Anada_WineryLocations',
  vessels: 'Anada_Vessels',
  vesselAllocations: 'Anada_VesselAllocations',
}

function escapeZcqlString(value) {
  return String(value).replace(/'/g, "''")
}

function mapRow(tableName, raw) {
  const fields = TABLE_FIELDS[tableName]
  const out = {}
  for (const [column, key, wireType] of fields) out[key] = coerce[wireType](raw[column])
  return out
}

async function queryRows(catalystApp, tableName, whereSql) {
  const fields = TABLE_FIELDS[tableName]
  const columns = fields.map(([column]) => column).join(', ')
  const sql = `SELECT ${columns} FROM ${tableName}${whereSql ? ` WHERE ${whereSql}` : ''}`
  const result = await catalystApp.zcql().executeZCQLQuery(sql)
  return result.map((entry) => mapRow(tableName, entry[tableName]))
}

async function countRows(catalystApp, tableName) {
  const result = await catalystApp.zcql().executeZCQLQuery(`SELECT COUNT(ROWID) FROM ${tableName}`)
  const row = result[0] && result[0][tableName]
  const value = row ? Object.values(row)[0] : 0
  return Number(value) || 0
}

/**
 * Resolves the authenticated caller's own winery context: their `User` row
 * (matched by email, since Catalyst identity carries no stable app user ID),
 * their active `Membership`(s), and every winery-scoped Phase 9.3 table
 * filtered to just the winery IDs those memberships grant.
 *
 * Returns `{ status: 'unprovisioned', bootstrapAvailable }` when no `User`
 * row matches - `bootstrapAvailable` is true only when nobody has ever been
 * provisioned yet (zero `Anada_Wineries` rows total), so a second person
 * logging in with no membership gets a clear "no access" result instead of
 * silently bootstrapping a second, disconnected winery.
 */
async function getContextForUser(catalystApp, identity) {
  if (!identity.emailId) return { status: 'unprovisioned', bootstrapAvailable: false }

  const users = await queryRows(catalystApp, 'Anada_Users', `Email = '${escapeZcqlString(identity.emailId)}'`)
  const user = users[0]
  if (!user) {
    const wineryCount = await countRows(catalystApp, 'Anada_Wineries')
    return { status: 'unprovisioned', bootstrapAvailable: wineryCount === 0 }
  }

  const memberships = await queryRows(catalystApp, 'Anada_Memberships', `UserID = '${escapeZcqlString(user.id)}' AND Status = 'active'`)
  if (memberships.length === 0) return { status: 'unprovisioned', bootstrapAvailable: false }

  const wineryIds = [...new Set(memberships.map((membership) => membership.wineryId))]
  const wineryIdList = wineryIds.map((id) => `'${escapeZcqlString(id)}'`).join(', ')

  const wineries = await queryRows(catalystApp, 'Anada_Wineries', `WineryID IN (${wineryIdList})`)
  const scoped = {}
  for (const [field, tableName] of Object.entries(WINERY_SCOPED_TABLES)) {
    scoped[field] = await queryRows(catalystApp, tableName, `WineryID IN (${wineryIdList})`)
  }

  return { status: 'authenticated_with_membership', user, memberships, wineries, ...scoped }
}

class ProvisionError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'user'
const asArray = (value) => (Array.isArray(value) ? value : [])

function toRow(tableName, obj) {
  const fields = TABLE_FIELDS[tableName]
  const row = {}
  for (const [column, key, wireType] of fields) {
    if (obj[key] === undefined) continue
    if (wireType === 'datetime') {
      const value = toCatalystDatetime(obj[key])
      if (value !== undefined) row[column] = value
      continue
    }
    row[column] = obj[key]
  }
  return row
}

/**
 * Bootstraps the very first real Winery/User/Membership from the caller's
 * own local browser data, on their first authenticated request with no
 * existing `Anada_Users` row. Re-verifies both bootstrap conditions itself
 * (no existing user for this identity, zero `Anada_Wineries` rows anywhere)
 * rather than trusting the client's prior `/me/context` read, since that
 * read could be stale by the time this call lands.
 *
 * Every entity keeps the exact `id` the browser already uses locally (the
 * winery and its 8 scoped collections), so existing cross-references
 * (`growerId`, `locationId`, `campaignId`, etc.) stay valid without
 * remapping. Only the new `User`/`Membership` rows get server-generated
 * IDs, since the caller's real identity has no local counterpart to reuse.
 *
 * Not transactional - Catalyst Data Store has no cross-table transactions.
 * A failure partway through leaves a partial bootstrap (rare, single-tenant
 * today; would need a manual fix via the Catalyst console if it happened).
 */
async function provisionFirstWinery(catalystApp, identity, payload) {
  if (!identity.emailId) throw new ProvisionError('no_email', 'The authenticated identity has no email address.')

  const existingUsers = await queryRows(catalystApp, 'Anada_Users', `Email = '${escapeZcqlString(identity.emailId)}'`)
  if (existingUsers.length > 0) throw new ProvisionError('already_provisioned', 'A user already exists for this identity.')

  const wineryCount = await countRows(catalystApp, 'Anada_Wineries')
  if (wineryCount > 0) throw new ProvisionError('not_first', 'A winery already exists; this identity has no membership to it.')

  const winery = payload && payload.winery
  if (!winery || !winery.id || !winery.code || !winery.name) {
    throw new ProvisionError('invalid_payload', 'A winery with id, code and name is required.')
  }

  const now = new Date().toISOString()
  const userId = `user-${slug(identity.emailId)}`
  const userName = [identity.firstName, identity.lastName].filter(Boolean).join(' ') || identity.emailId

  const datastore = catalystApp.datastore()
  await datastore.table('Anada_Users').insertRow(toRow('Anada_Users', {
    id: userId, name: userName, email: identity.emailId, status: 'active',
    createdAt: now, updatedAt: now, createdBy: userId, updatedBy: userId,
  }))
  await datastore.table('Anada_Wineries').insertRow(toRow('Anada_Wineries', {
    ...winery, status: winery.status || 'active', createdBy: userId, updatedBy: userId,
  }))
  await datastore.table('Anada_Memberships').insertRow(toRow('Anada_Memberships', {
    id: `membership-${winery.id}-${userId}`, wineryId: winery.id, userId, role: 'owner', status: 'active',
    createdAt: now, updatedAt: now, createdBy: userId, updatedBy: userId,
  }))

  for (const [field, tableName] of Object.entries(WINERY_SCOPED_TABLES)) {
    const rows = asArray(payload[field]).map((item) => toRow(tableName, item))
    if (rows.length > 0) await datastore.table(tableName).insertRows(rows)
  }

  return getContextForUser(catalystApp, identity)
}

module.exports = { getContextForUser, provisionFirstWinery, ProvisionError, queryRows, countRows, escapeZcqlString, toCatalystDatetime, fromCatalystDatetime, TABLE_FIELDS, WINERY_SCOPED_TABLES }
