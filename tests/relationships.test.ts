import assert from 'node:assert/strict'
import test from 'node:test'
import { deliveries, lots, parcels, tanks, winerySettings } from '../src/data'
import { buildCanonicalRelationshipModel, validateCanonicalRelationships } from '../src/relationships'
import { migrateLegacyState } from '../src/store'
import { receiveGrapeDelivery } from '../src/domain'

test('canonical relationship model creates stable masters and valid foreign keys', () => {
  const model = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  assert.equal(model.growers.length, new Set(parcels.map((parcel) => parcel.grower)).size)
  assert.equal(model.vineyardSamples.length, parcels.length)
  assert.equal(validateCanonicalRelationships(model).length, 0)
  assert.ok(model.parcels.every((parcel) => parcel.growerId && parcel.locationId && parcel.campaignId))
  assert.ok(model.deliveries.every((delivery) => delivery.growerId && delivery.campaignId))
})

test('grape intake stamps the delivery with the parcel grower relationship', () => {
  const model = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  const parcel = model.parcels[0]
  assert.ok(parcel.growerId)
  const result = receiveGrapeDelivery([], model.parcels, {
    deliveryId: '', parcelId: parcel.id, scheduledDate: '2026-09-19', scheduledTime: '14:00', expectedKg: 1000, vehicle: 'LO-0000-AA', grossKg: 1000, tareKg: 0, temperature: 18, potentialAlcohol: 12.5, condition: 'good', processingDestination: 'Mesa de selección', notes: '',
  })
  assert.equal(result.delivery.growerId, parcel.growerId)
})

test('v21 migration preserves operational data and adds canonical relationships', () => {
  const legacy = {
    schemaVersion: 21,
    lots: structuredClone(lots),
    tasks: [],
    tanks: structuredClone(tanks),
    productionEvents: [], movements: [], parcels: structuredClone(parcels), deliveries: structuredClone(deliveries), samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [], settings: structuredClone(winerySettings),
  }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 27)
  assert.equal(migrated.lots.length, legacy.lots.length)
  assert.equal(migrated.parcels.length, legacy.parcels.length)
  assert.ok(migrated.growers.length > 0)
  assert.ok(migrated.locations.length > 0)
  assert.equal(validateCanonicalRelationships({
    campaigns: migrated.campaigns,
    growers: migrated.growers,
    locations: migrated.locations,
    vessels: migrated.vessels,
    vesselAllocations: migrated.vesselAllocations,
    vineyardSamples: migrated.vineyardSamples,
    parcels: migrated.parcels,
    deliveries: migrated.deliveries,
    lots: migrated.lots,
  }).length, 0)
})
