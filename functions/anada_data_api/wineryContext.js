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

// A 'json' column stores a JSON.stringify'd blob in a plain text column -
// Catalyst has no native JSON type. A malformed or empty value coerces to
// null rather than throwing, matching every other coerce function's
// tolerance for absent data.
const json = (v) => {
  if (v === null || v === undefined || v === '') return null
  try { return JSON.parse(v) } catch { return null }
}

const coerce = { string: str, number: num, boolean: bool, datetime: fromCatalystDatetime, json }

// Dotted key paths (e.g. 'metrics.temperature') let a flat Catalyst column
// map onto a nested browser field without any per-table special-casing.
// A plain, non-dotted key behaves exactly as direct property access did
// before these existed - every table but Anada_ProductionEvents still uses
// only plain keys.
function getPath(obj, path) {
  let value = obj
  for (const part of path.split('.')) {
    if (value == null) return undefined
    value = value[part]
  }
  return value
}

function setPath(obj, path, value) {
  const parts = path.split('.')
  let target = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (target[part] == null) target[part] = {}
    target = target[part]
  }
  target[parts[parts.length - 1]] = value
}

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
  // Phase 9.5 stage 3 (Batch 1) - core cellar operations. WineLot/Tank/
  // CellarTask/ProductionEvent/WineMovement carry no createdAt/updatedAt/
  // createdBy/updatedBy fields, unlike the Phase 9.3 master-data types -
  // no audit quartet columns here, deliberately.
  Anada_Tanks: [
    ['TankID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['CapacityLitres', 'capacity', 'number'], ['VolumeLitres', 'volume', 'number'],
    ['LotID', 'lot', 'string'], ['WineType', 'type', 'string'], ['Stage', 'stage', 'string'], ['TemperatureC', 'temperature', 'number'],
    ['Attention', 'attention', 'string'], ['UsableCapacity', 'usableCapacity', 'number'],
  ],
  // CellarTask.time is a free-text display string ('Hoy', '16:00'), not a
  // real timestamp - TaskTime is a plain varchar, not a datetime column.
  // ('Time' itself is a reserved ZCQL keyword, hence the TaskTime name.)
  Anada_Tasks: [
    ['TaskID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['LotID', 'lot', 'string'], ['Title', 'title', 'string'],
    ['TaskTime', 'time', 'string'], ['AssignedTo', 'assignee', 'string'], ['TaskPriority', 'priority', 'string'], ['CompletionState', 'complete', 'boolean'],
  ],
  // ProductionEventMetrics (27 optional scalar fields, no independent
  // identity) is flattened directly onto this table rather than given its
  // own child table - the dotted 'metrics.*' keys below are the only
  // dotted-path entries in this map.
  Anada_ProductionEvents: [
    ['ProductionEventID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['LotID', 'lotId', 'string'], ['WineType', 'wineType', 'string'],
    ['Kind', 'kind', 'string'], ['StageID', 'stageId', 'string'], ['OperationType', 'operationType', 'string'],
    ['FromStageID', 'fromStageId', 'string'], ['ToStageID', 'toStageId', 'string'], ['PerformedAt', 'performedAt', 'datetime'],
    ['RecordedAt', 'recordedAt', 'datetime'], ['Operator', 'operator', 'string'], ['Notes', 'notes', 'string'], ['StorageMode', 'storageMode', 'string'],
    ['DurationMinutes', 'metrics.durationMinutes', 'number'], ['Temperature', 'metrics.temperature', 'number'], ['Density', 'metrics.density', 'number'],
    ['VolumeBefore', 'metrics.volumeBefore', 'number'], ['VolumeAfter', 'metrics.volumeAfter', 'number'], ['FreeRunVolume', 'metrics.freeRunVolume', 'number'],
    ['PressVolume', 'metrics.pressVolume', 'number'], ['Product', 'metrics.product', 'string'], ['ProductId', 'metrics.productId', 'string'],
    ['ProductLotId', 'metrics.productLotId', 'string'], ['SupplierLot', 'metrics.supplierLot', 'string'], ['AdditionAmount', 'metrics.additionAmount', 'number'],
    ['AdditionUnit', 'metrics.additionUnit', 'string'], ['MalicAcid', 'metrics.malicAcid', 'number'], ['FreeSo2', 'metrics.freeSo2', 'number'],
    ['PotentialAlcohol', 'metrics.potentialAlcohol', 'number'], ['Turbidity', 'metrics.turbidity', 'number'], ['PressFraction', 'metrics.pressFraction', 'string'],
    ['Protection', 'metrics.protection', 'string'], ['SettlingHours', 'metrics.settlingHours', 'number'], ['LeesDecision', 'metrics.leesDecision', 'string'],
    ['ConductivityDrop', 'metrics.conductivityDrop', 'number'], ['ColorIntensity', 'metrics.colorIntensity', 'number'], ['SkinContactHours', 'metrics.skinContactHours', 'number'],
    ['RedGrapePercentage', 'metrics.redGrapePercentage', 'number'], ['SeparateWeightsConfirmed', 'metrics.separateWeightsConfirmed', 'boolean'],
    ['MixingAfterWeighing', 'metrics.mixingAfterWeighing', 'boolean'],
  ],
  Anada_WineMovements: [
    ['MovementID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Kind', 'kind', 'string'],
    ['WineType', 'wineType', 'string'], ['GrossSourceVolume', 'grossSourceVolume', 'number'], ['ReceivedVolume', 'receivedVolume', 'number'],
    ['LossVolume', 'lossVolume', 'number'], ['LossPercentage', 'lossPercentage', 'number'], ['PerformedAt', 'performedAt', 'datetime'],
    ['RecordedAt', 'recordedAt', 'datetime'], ['Operator', 'operator', 'string'], ['Notes', 'notes', 'string'], ['StorageMode', 'storageMode', 'string'],
  ],
  // A movement's legs have no independent browser-side identity of their
  // own (WineMovementLeg carries no `id`) - the browser derives this
  // table's rows from movement.sourceLegs/.destinationLegs on every sync
  // tick rather than persisting them as a top-level collection; see
  // App.tsx's deriveMovementLegs/reattachMovementLegs.
  Anada_MovementLegs: [
    ['LegID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['MovementID', 'movementId', 'string'], ['Side', 'side', 'string'],
    ['Sequence', 'sequence', 'number'], ['LotID', 'lotId', 'string'], ['LotName', 'lotName', 'string'], ['VesselID', 'vesselId', 'string'],
    ['VolumeBefore', 'volumeBefore', 'number'], ['MovementVolume', 'movementVolume', 'number'], ['VolumeAfter', 'volumeAfter', 'number'],
  ],
  // WineLot.image/.readings/.activities are deliberately not columns here -
  // image is a Vite-bundled local asset path, not portable data; readings
  // and activities are synced as their own child tables (below) since they
  // append repeatedly and have no fixed size, unlike ProductionEvent.metrics.
  Anada_WineLots: [
    ['LotID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Name', 'name', 'string'], ['WineType', 'type', 'string'],
    ['Varieties', 'varieties', 'string'], ['Origin', 'origin', 'string'], ['Vintage', 'vintage', 'number'], ['VolumeLitres', 'volume', 'number'],
    ['VesselID', 'vessel', 'string'], ['Stage', 'stage', 'string'], ['Progress', 'progress', 'number'], ['Attention', 'attention', 'string'],
    ['NextAction', 'nextAction', 'string'], ['NextTime', 'nextTime', 'string'], ['ProcessJSON', 'process', 'json'], ['ProductionJSON', 'productionDetails', 'json'],
    ['Day', 'day', 'number'], ['TemperatureC', 'temperature', 'number'], ['Density', 'density', 'number'], ['AttentionText', 'attentionText', 'string'],
    ['OperationalStatus', 'operationalStatus', 'string'], ['CampaignID', 'campaignId', 'string'], ['CurrentVesselID', 'currentVesselId', 'string'],
  ],
  // ReadingPoint has no identity of its own - App.tsx's deriveReadings
  // synthesizes `${lotId}::${recordedAt}` (never index-based: readings
  // append repeatedly, potentially from multiple devices with diverged
  // local array lengths, so an index could collide across genuinely
  // different readings). `time` (a display string like 'Ahora') is
  // deliberately not a column - it's reconstructed client-side from
  // `recordedAt` when a reading arrives from another device with no local
  // counterpart to preserve it from.
  Anada_Readings: [
    ['ReadingID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['LotID', 'lotId', 'string'], ['RecordedAt', 'recordedAt', 'datetime'],
    ['TemperatureC', 'temperature', 'number'], ['Density', 'density', 'number'], ['VolumeLitres', 'volume', 'number'], ['Note', 'note', 'string'],
  ],
  // LotActivity does have its own `id`, unlike a reading, so no synthesized
  // id is needed here - same `time`-is-not-a-column reasoning as readings.
  Anada_Activities: [
    ['ActivityID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['LotID', 'lotId', 'string'], ['Title', 'title', 'string'],
    ['Person', 'person', 'string'], ['Detail', 'detail', 'string'], ['RecordedAt', 'recordedAt', 'datetime'],
  ],
  // Batch 2 (Harvest slice). ScheduledDate/ScheduledTime are plain form
  // strings, not full ISO timestamps - deliberately not the 'datetime'
  // wireType (same reasoning as CellarTask.time/ReadingPoint.time).
  Anada_Deliveries: [
    ['DeliveryID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['ParcelID', 'parcelId', 'string'],
    ['Grower', 'grower', 'string'], ['Varieties', 'varieties', 'string'], ['Origin', 'origin', 'string'], ['ScheduledDate', 'scheduledDate', 'string'],
    ['ScheduledTime', 'scheduledTime', 'string'], ['ExpectedKg', 'expectedKg', 'number'], ['DeliveryStatus', 'status', 'string'],
    ['Vehicle', 'vehicle', 'string'], ['ProcessingDestination', 'processingDestination', 'string'], ['ReceivedAt', 'receivedAt', 'datetime'],
    ['GrossKg', 'grossKg', 'number'], ['TareKg', 'tareKg', 'number'], ['NetKg', 'netKg', 'number'], ['Temperature', 'temperature', 'number'],
    ['PotentialAlcohol', 'potentialAlcohol', 'number'], ['GrapeCondition', 'condition', 'string'], ['Notes', 'notes', 'string'],
    ['GrowerID', 'growerId', 'string'], ['CampaignID', 'campaignId', 'string'],
  ],
  // Batch 2 (Lab slice). DueAt is a plain time-of-day string ('17:00', an
  // <input type="time"> value), not a real datetime - only CollectedAt/
  // ValidatedAt are real ISO timestamps. requestedAnalyses/results are
  // arrays with no independent identity, flattened via the 'json' wireType
  // rather than given their own child table (same reasoning as
  // ProductionEvent.metrics/WineLot.process). 'Priority' is a reserved
  // ZCQL keyword (found live creating this table), hence SamplePriority;
  // SampleStatus follows the same naming for consistency, though 'Status'
  // alone has worked fine on every other table.
  Anada_LabSamples: [
    ['SampleID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['SourceType', 'sourceType', 'string'],
    ['SourceID', 'sourceId', 'string'], ['SourceName', 'sourceName', 'string'], ['WineType', 'wineType', 'string'], ['Profile', 'profile', 'string'],
    ['CollectedAt', 'collectedAt', 'datetime'], ['CollectedBy', 'collectedBy', 'string'], ['AssignedTo', 'assignedTo', 'string'],
    ['DueAt', 'dueAt', 'string'], ['SamplePriority', 'priority', 'string'], ['SampleStatus', 'status', 'string'],
    ['RequestedAnalysesJSON', 'requestedAnalyses', 'json'], ['ResultsJSON', 'results', 'json'], ['Notes', 'notes', 'string'],
    ['ValidatedAt', 'validatedAt', 'datetime'],
  ],
  // Batch 2 (Barrels slice). FilledAt is stored as a date-only string
  // ('2026-08-01', no time component) but still uses the 'datetime'
  // wireType - toCatalystDatetime/fromCatalystDatetime and the frontend's
  // truncateToSeconds comparison both normalize a date-only value and a
  // full ISO timestamp to the same "yyyy-MM-ddT00:00:00" representation,
  // so this round-trips correctly without special-casing. NextDue is a
  // free-text display string ('7 días', 'Esta semana'), not a real
  // timestamp - deliberately plain varchar, same as CellarTask.time.
  Anada_Barrels: [
    ['BarrelID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['Code', 'code', 'string'], ['Cooperage', 'cooperage', 'string'],
    ['OakOrigin', 'oakOrigin', 'string'], ['Toast', 'toast', 'string'], ['Grain', 'grain', 'string'], ['Capacity', 'capacity', 'number'],
    ['VolumeLitres', 'volume', 'number'], ['Status', 'status', 'string'], ['Room', 'room', 'string'], ['Rack', 'rack', 'string'],
    ['Position', 'position', 'string'], ['UseNumber', 'useNumber', 'number'], ['LotID', 'lotId', 'string'], ['LotName', 'lotName', 'string'],
    ['WineType', 'wineType', 'string'], ['FilledAt', 'filledAt', 'datetime'], ['PlannedMonths', 'plannedMonths', 'number'],
    ['Attention', 'attention', 'string'], ['NextAction', 'nextAction', 'string'], ['NextDue', 'nextDue', 'string'], ['Notes', 'notes', 'string'],
  ],
  // BarrelOperation.barrelIds is an array with no independent identity
  // (an operation can target several barrels at once, e.g. a batch
  // racking), flattened via the 'json' wireType rather than a child table.
  Anada_BarrelOperations: [
    ['OperationID', 'id', 'string'], ['WineryID', 'wineryId', 'string'], ['OperationType', 'type', 'string'],
    ['BarrelIDsJSON', 'barrelIds', 'json'], ['TargetLabel', 'targetLabel', 'string'], ['PerformedAt', 'performedAt', 'datetime'],
    ['Person', 'person', 'string'], ['VolumeAdded', 'volumeAdded', 'number'], ['Notes', 'notes', 'string'],
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
  tanks: 'Anada_Tanks',
  tasks: 'Anada_Tasks',
  productionEvents: 'Anada_ProductionEvents',
  movements: 'Anada_WineMovements',
  movementLegs: 'Anada_MovementLegs',
  lots: 'Anada_WineLots',
  readings: 'Anada_Readings',
  activities: 'Anada_Activities',
  deliveries: 'Anada_Deliveries',
  samples: 'Anada_LabSamples',
  barrels: 'Anada_Barrels',
  barrelOperations: 'Anada_BarrelOperations',
}

function escapeZcqlString(value) {
  return String(value).replace(/'/g, "''")
}

// Every row carries `_rev` (Catalyst's own MODIFIEDTIME, as a string) so a
// client can detect, at push time, whether the row changed remotely since
// it last read it - the optimistic-concurrency token for Phase 9.5 stage 2
// sync. No new column needed; Catalyst already maintains this on every
// table automatically.
function mapRow(tableName, raw) {
  const fields = TABLE_FIELDS[tableName]
  const out = {}
  for (const [column, key, wireType] of fields) setPath(out, key, coerce[wireType](raw[column]))
  out._rev = raw.MODIFIEDTIME !== undefined && raw.MODIFIEDTIME !== null ? String(raw.MODIFIEDTIME) : null
  return out
}

// ZCQL rejects any SELECT with more than 30 columns ("More than 30 select
// columns are not allowed") - caught live once Anada_ProductionEvents (41
// app columns) started actually being queried; every table before it fit in
// one query. A wide table's columns are split into chunks small enough to
// stay under that limit and the resulting rows re-joined on ROWID, which
// every chunk shares since they're all the same WHERE over the same table.
const ZCQL_MAX_SELECT_COLUMNS = 30
const ZCQL_COLUMN_CHUNK_SIZE = 25

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size))
  return chunks
}

async function queryRows(catalystApp, tableName, whereSql) {
  const fields = TABLE_FIELDS[tableName]
  const columns = fields.map(([column]) => column)
  const whereClause = whereSql ? ` WHERE ${whereSql}` : ''

  if (columns.length + 1 <= ZCQL_MAX_SELECT_COLUMNS) {
    const sql = `SELECT ${[...columns, 'MODIFIEDTIME'].join(', ')} FROM ${tableName}${whereClause}`
    const result = await catalystApp.zcql().executeZCQLQuery(sql)
    return result.map((entry) => mapRow(tableName, entry[tableName]))
  }

  const rowsByRowId = new Map()
  for (const [index, columnChunk] of chunk(columns, ZCQL_COLUMN_CHUNK_SIZE).entries()) {
    const extraColumns = index === 0 ? ['ROWID', 'MODIFIEDTIME'] : ['ROWID']
    const sql = `SELECT ${[...extraColumns, ...columnChunk].join(', ')} FROM ${tableName}${whereClause}`
    const result = await catalystApp.zcql().executeZCQLQuery(sql)
    for (const entry of result) {
      const row = entry[tableName]
      rowsByRowId.set(row.ROWID, { ...rowsByRowId.get(row.ROWID), ...row })
    }
  }
  return [...rowsByRowId.values()].map((raw) => mapRow(tableName, raw))
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
    const value = getPath(obj, key)
    if (value === undefined) continue
    if (wireType === 'datetime') {
      const coerced = toCatalystDatetime(value)
      if (coerced !== undefined) row[column] = coerced
      continue
    }
    if (wireType === 'json') {
      row[column] = JSON.stringify(value)
      continue
    }
    row[column] = value
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

// Phase 9.5 stage 2: general remote writes, scoped to the 5 tables the
// browser app actually has live mutation UI for today (campaigns, growers,
// vineyards, parcels, campaign-parcel plans). Wineries/Users/Memberships
// have no live edit path in the app - see CATALYST_SCHEMA.md's Phase 9.5
// stage 2 section - so they stay read-only mirrors for now.
// Phase 9.5 stage 3 (Batch 1) adds core cellar-operations tables one at a
// time - tanks first, see CATALYST_SCHEMA.md's Phase 9.5 stage 3 section.
const SYNCABLE_TABLES = {
  campaigns: 'Anada_Campaigns',
  growers: 'Anada_Growers',
  vineyards: 'Anada_Vineyards',
  parcels: 'Anada_VineyardParcels',
  campaignParcels: 'Anada_CampaignParcelPlans',
  tanks: 'Anada_Tanks',
  tasks: 'Anada_Tasks',
  productionEvents: 'Anada_ProductionEvents',
  movements: 'Anada_WineMovements',
  movementLegs: 'Anada_MovementLegs',
  lots: 'Anada_WineLots',
  readings: 'Anada_Readings',
  activities: 'Anada_Activities',
  deliveries: 'Anada_Deliveries',
  samples: 'Anada_LabSamples',
  barrels: 'Anada_Barrels',
  barrelOperations: 'Anada_BarrelOperations',
}

const ID_COLUMNS = {
  Anada_Campaigns: 'CampaignID',
  Anada_Growers: 'GrowerID',
  Anada_Vineyards: 'VineyardID',
  Anada_VineyardParcels: 'ParcelID',
  Anada_CampaignParcelPlans: 'PlanID',
  Anada_Tanks: 'TankID',
  Anada_Tasks: 'TaskID',
  Anada_ProductionEvents: 'ProductionEventID',
  Anada_WineMovements: 'MovementID',
  Anada_MovementLegs: 'LegID',
  Anada_WineLots: 'LotID',
  Anada_Readings: 'ReadingID',
  Anada_Activities: 'ActivityID',
  Anada_Deliveries: 'DeliveryID',
  Anada_LabSamples: 'SampleID',
  Anada_Barrels: 'BarrelID',
  Anada_BarrelOperations: 'OperationID',
}

class SyncError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

async function resolveMembershipWineryIds(catalystApp, identity) {
  if (!identity.emailId) return []
  const users = await queryRows(catalystApp, 'Anada_Users', `Email = '${escapeZcqlString(identity.emailId)}'`)
  const user = users[0]
  if (!user) return []
  const memberships = await queryRows(catalystApp, 'Anada_Memberships', `UserID = '${escapeZcqlString(user.id)}' AND Status = 'active'`)
  return [...new Set(memberships.map((membership) => membership.wineryId))]
}

async function findRowByAppId(catalystApp, tableName, id) {
  const idColumn = ID_COLUMNS[tableName]
  const result = await catalystApp.zcql().executeZCQLQuery(`SELECT ROWID, MODIFIEDTIME FROM ${tableName} WHERE ${idColumn} = '${escapeZcqlString(id)}'`)
  const row = result[0] && result[0][tableName]
  return row ? { rowId: row.ROWID, rev: String(row.MODIFIEDTIME) } : null
}

/**
 * Writes one table's worth of rows for a sync push. Each row must belong to
 * one of the caller's own winery IDs (checked here, not trusted from the
 * client) and, if it already exists remotely, must carry the `_rev` the
 * caller last read - otherwise it's a conflict, not a write: the row
 * changed remotely since the caller's local copy was taken, so silently
 * overwriting it would lose whoever made that other change. A missing
 * `_rev` on a row that turns out to already exist remotely (two callers
 * creating the "same" row independently) is treated the same way, not as
 * an automatic win for either side.
 */
async function syncTable(catalystApp, tableName, wineryIds, rows) {
  const datastore = catalystApp.datastore()
  const written = []
  const conflicts = []
  for (const row of rows) {
    if (!row || !row.id || !wineryIds.includes(row.wineryId)) continue
    const existing = await findRowByAppId(catalystApp, tableName, row.id)
    if (!existing) {
      const inserted = await datastore.table(tableName).insertRow(toRow(tableName, row))
      written.push(mapRow(tableName, inserted))
      continue
    }
    if (!row._rev || row._rev !== existing.rev) {
      const current = await queryRows(catalystApp, tableName, `${ID_COLUMNS[tableName]} = '${escapeZcqlString(row.id)}'`)
      conflicts.push(current[0])
      continue
    }
    const updated = await datastore.table(tableName).updateRow({ ROWID: existing.rowId, ...toRow(tableName, row) })
    written.push(mapRow(tableName, updated))
  }
  return { written, conflicts }
}

async function syncWineryData(catalystApp, identity, payload) {
  const wineryIds = await resolveMembershipWineryIds(catalystApp, identity)
  if (wineryIds.length === 0) throw new SyncError('no_access', 'No active winery membership for this identity.')
  const result = {}
  for (const [field, tableName] of Object.entries(SYNCABLE_TABLES)) {
    const rows = asArray(payload && payload[field])
    if (rows.length === 0) continue
    result[field] = await syncTable(catalystApp, tableName, wineryIds, rows)
  }
  return result
}

module.exports = { getContextForUser, provisionFirstWinery, syncWineryData, ProvisionError, SyncError, queryRows, countRows, escapeZcqlString, toCatalystDatetime, fromCatalystDatetime, TABLE_FIELDS, WINERY_SCOPED_TABLES, SYNCABLE_TABLES }
