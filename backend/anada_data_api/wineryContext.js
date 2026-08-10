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

const coerce = { string: str, number: num, boolean: bool }

const TABLE_FIELDS = {
  Anada_Users: [
    ['UserID', 'id', 'string'], ['Name', 'name', 'string'], ['Email', 'email', 'string'], ['Status', 'status', 'string'],
    ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Memberships: [
    ['MembershipID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['UserID', 'userId', 'string'], ['Role', 'role', 'string'], ['Status', 'status', 'string'],
    ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Wineries: [
    ['WineryID', 'id', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'], ['LegalName', 'legalName', 'string'],
    ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Designation', 'designation', 'string'],
    ['Timezone', 'timezone', 'string'], ['Status', 'status', 'string'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Campaigns: [
    ['CampaignID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['Vintage', 'vintage', 'number'], ['Status', 'status', 'string'], ['StartsAt', 'startsAt', 'string'],
    ['ExpectedHarvestStart', 'expectedHarvestStart', 'string'], ['ExpectedEndAt', 'expectedEndAt', 'string'], ['ClosedAt', 'closedAt', 'string'],
    ['IsDefault', 'isDefault', 'boolean'], ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'],
    ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'], ['ReopenedAt', 'reopenedAt', 'string'], ['ReopenedBy', 'reopenedBy', 'string'],
  ],
  Anada_Growers: [
    ['GrowerID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['LegalName', 'legalName', 'string'], ['TradeName', 'tradeName', 'string'], ['GrowerType', 'growerType', 'string'], ['TaxID', 'taxId', 'string'],
    ['ContactName', 'contactName', 'string'], ['Email', 'email', 'string'], ['Phone', 'phone', 'string'], ['Address', 'address', 'string'],
    ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Country', 'country', 'string'], ['Status', 'status', 'string'],
    ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_Vineyards: [
    ['VineyardID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['GrowerID', 'growerId', 'string'], ['Municipality', 'municipality', 'string'], ['Province', 'province', 'string'], ['Country', 'country', 'string'],
    ['LocationID', 'locationId', 'string'], ['Status', 'status', 'string'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_VineyardParcels: [
    ['ParcelID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Name', 'name', 'string'],
    ['GrowerID', 'growerId', 'string'], ['LocationID', 'locationId', 'string'], ['CampaignID', 'campaignId', 'string'], ['EstateID', 'estateId', 'string'],
    ['Varieties', 'varieties', 'string'], ['Hectares', 'hectares', 'number'], ['Status', 'status', 'string'], ['Clone', 'clone', 'string'],
    ['Rootstock', 'rootstock', 'string'], ['PlantingYear', 'plantingYear', 'number'], ['TrainingSystem', 'trainingSystem', 'string'],
    ['Irrigation', 'irrigation', 'boolean'], ['AltitudeM', 'altitudeM', 'number'], ['Orientation', 'orientation', 'string'], ['Organic', 'organic', 'boolean'],
    ['Latitude', 'latitude', 'number'], ['Longitude', 'longitude', 'number'], ['Notes', 'notes', 'string'],
    ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'], ['CreatedBy', 'createdBy', 'string'], ['UpdatedBy', 'updatedBy', 'string'],
  ],
  Anada_CampaignParcelPlans: [
    ['PlanID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['CampaignID', 'campaignId', 'string'], ['ParcelID', 'parcelId', 'string'],
    ['ExpectedKg', 'expectedKg', 'number'], ['ExpectedHarvestDate', 'expectedHarvestDate', 'string'], ['HarvestWindow', 'harvestWindow', 'string'],
    ['Status', 'status', 'string'], ['Notes', 'notes', 'string'], ['CreatedAt', 'createdAt', 'string'], ['UpdatedAt', 'updatedAt', 'string'],
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
    ['CampaignID', 'campaignId', 'string'], ['Volume', 'volume', 'number'], ['Unit', 'unit', 'string'], ['StartedAt', 'startedAt', 'string'],
    ['EndedAt', 'endedAt', 'string'], ['Status', 'status', 'string'],
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

module.exports = { getContextForUser, queryRows, countRows, escapeZcqlString, TABLE_FIELDS, WINERY_SCOPED_TABLES }
