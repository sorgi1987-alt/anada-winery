import assert from 'node:assert/strict'
import test from 'node:test'
import { lots, parcels, deliveries, tanks, winerySettings } from '../src/data'
import { buildCanonicalRelationshipModel } from '../src/relationships'
import { assertVesselCanReceive, deriveCellarOccupancy, validateCellarAssets } from '../src/cellar'
import { migrateLegacyState } from '../src/store'

test('canonical vessels expose usable capacity and derived occupancy', () => {
  const model = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  assert.equal(validateCellarAssets(model.vessels, model.vesselAllocations).length, 0)
  const occupancy = deriveCellarOccupancy(model.vessels, model.vesselAllocations)
  const occupied = occupancy.find((item) => item.vesselId === 'D-04')
  assert.ok(occupied)
  assert.equal(occupied.status, 'occupied')
  assert.equal(occupied.wineLotId, 'B-26-006')
  assert.equal(occupied.allocatedVolume, 5200)
  assert.equal(occupied.remainingCapacity, 800)
  assert.equal(occupied.fillPercentage, 86.67)

  const orphanLegacyTank = occupancy.find((item) => item.vesselId === 'D-02')
  assert.ok(orphanLegacyTank)
  assert.equal(orphanLegacyTank.status, 'available')
  assert.equal(orphanLegacyTank.allocatedVolume, 0)
})

test('vessel receiving validation uses usable capacity and operational status', () => {
  const model = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  const empty = model.vessels.find((item) => item.id === 'D-01')!
  assert.doesNotThrow(() => assertVesselCanReceive(empty, model.vesselAllocations, 9500))
  assert.throws(() => assertVesselCanReceive(empty, model.vesselAllocations, 10001), /usable capacity/)
  assert.throws(() => assertVesselCanReceive({ ...empty, status: 'maintenance' }, model.vesselAllocations, 100), /maintenance/)
})

test('v22 migration enriches vessels without changing operational records', () => {
  const legacy = { schemaVersion: 22, lots: structuredClone(lots), tasks: [], tanks: structuredClone(tanks), productionEvents: [], movements: [], parcels: structuredClone(parcels), deliveries: structuredClone(deliveries), samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [], settings: structuredClone(winerySettings) }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 24)
  assert.equal(migrated.lots.length, legacy.lots.length)
  assert.ok(migrated.vessels.every((vessel) => vessel.usableCapacity > 0 && vessel.nominalCapacity >= vessel.usableCapacity))
})
