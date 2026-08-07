import assert from 'node:assert/strict'
import test from 'node:test'
import { lots, parcels, deliveries, tanks, winerySettings, wineMovements } from '../src/data'
import { buildCanonicalRelationshipModel } from '../src/relationships'
import { assertVesselCanReceive, CellarValidationError, deriveCellarOccupancy, setTankUsableCapacity, tankUsableCapacity, validateCellarAssets } from '../src/cellar'
import { assignLotToTank, transferWine } from '../src/domain'
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

test('tank usable capacity falls back to nominal capacity when unset', () => {
  const tank = tanks.find((item) => item.id === 'D-01')!
  assert.equal(tankUsableCapacity(tank), tank.capacity)
  assert.equal(tankUsableCapacity({ ...tank, usableCapacity: 8000 }), 8000)
})

test('setTankUsableCapacity validates bounds and preserves other tanks', () => {
  const occupied = tanks.find((item) => item.id === 'D-04')!
  assert.throws(() => setTankUsableCapacity(structuredClone(tanks), 'D-04', 0), CellarValidationError)
  assert.throws(() => setTankUsableCapacity(structuredClone(tanks), 'D-04', occupied.capacity + 1), CellarValidationError)
  assert.throws(() => setTankUsableCapacity(structuredClone(tanks), 'D-04', occupied.volume - 100), CellarValidationError)
  assert.throws(() => setTankUsableCapacity(structuredClone(tanks), 'D-99', 5000), CellarValidationError)

  const reduced = setTankUsableCapacity(structuredClone(tanks), 'D-04', 5800)
  assert.equal(reduced.find((item) => item.id === 'D-04')?.usableCapacity, 5800)
  assert.equal(reduced.find((item) => item.id === 'D-01')?.usableCapacity, undefined)

  const cleared = setTankUsableCapacity(reduced, 'D-04', undefined)
  assert.equal(cleared.find((item) => item.id === 'D-04')?.usableCapacity, undefined)
})

test('assigning a new lot to a tank respects a reduced usable capacity', () => {
  const lot = { ...structuredClone(lots).find((item) => item.id === 'T-26-017')!, vessel: 'D-01' }
  const fullCapacity = assignLotToTank(structuredClone(tanks), lot)
  assert.equal(fullCapacity.find((item) => item.id === 'D-01')?.volume, lot.volume)

  const reducedCellar = structuredClone(tanks).map((tank) => tank.id === 'D-01' ? { ...tank, usableCapacity: 5000 } : tank)
  assert.throws(() => assignLotToTank(reducedCellar, lot), /usable capacity is insufficient/i)
})

test('transfers respect a reduced usable capacity even when nominal capacity would allow it', () => {
  const reducedCellar = structuredClone(tanks).map((tank) => tank.id === 'D-01' ? { ...tank, usableCapacity: 5000 } : tank)
  assert.throws(() => transferWine(structuredClone(lots), reducedCellar, structuredClone(wineMovements), {
    lotId: 'T-26-017', destinationTankId: 'D-01', lossVolume: 50,
    performedAt: '2026-09-28T10:30:00+02:00', operator: 'Elena Martín', notes: 'Movimiento de control.',
  }), /usable capacity is insufficient/i)
})

test('v22 migration enriches vessels without changing operational records', () => {
  const legacy = { schemaVersion: 22, lots: structuredClone(lots), tasks: [], tanks: structuredClone(tanks), productionEvents: [], movements: [], parcels: structuredClone(parcels), deliveries: structuredClone(deliveries), samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [], settings: structuredClone(winerySettings) }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 27)
  assert.equal(migrated.lots.length, legacy.lots.length)
  assert.ok(migrated.vessels.every((vessel) => vessel.usableCapacity > 0 && vessel.nominalCapacity >= vessel.usableCapacity))
})
