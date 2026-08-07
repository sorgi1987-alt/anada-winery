import test from 'node:test'
import assert from 'node:assert/strict'
import { createVineyard, deriveVineyardsFromParcels } from '../src/vineyards'
import { createParcel, deriveCampaignParcelPlans, normalizeParcels } from '../src/parcels'
import type { Grower, VineyardParcel } from '../src/types'

const growers: Grower[] = [{ id:'grower-1', code:'VIT-001', name:'Grower One', legalName:'Grower One', growerType:'company', country:'España', status:'active', notes:'', createdAt:'2026-01-01', updatedAt:'2026-01-01', createdBy:'test', updatedBy:'test' }]
const legacy: VineyardParcel[] = [{ id:'PAR-1', name:'North Block', grower:'Grower One', growerId:'grower-1', municipality:'Alberite', zone:'Rioja Oriental', varieties:'Tempranillo', hectares:2, estimatedKg:10000, harvestWindow:'20 sept', readiness:'ready', sample:{ sampledAt:'2026-09-01', potentialAlcohol:13, ph:3.4, totalAcidity:5.5, health:98 }, image:'', campaignId:'campaign-2026' }]

test('legacy parcels normalize into stable vineyard masters and campaign plans', () => {
  const vineyards = deriveVineyardsFromParcels(legacy, growers)
  const parcels = normalizeParcels(legacy, vineyards, growers)
  const plans = deriveCampaignParcelPlans(parcels, 'campaign-2026')
  assert.equal(vineyards.length, 1)
  assert.equal(parcels[0].estateId, vineyards[0].id)
  assert.equal(plans[0].parcelId, parcels[0].id)
  assert.equal(plans[0].expectedKg, 10000)
})

test('new parcels require grower-vineyard ownership consistency and can join the active campaign', () => {
  const vineyards = createVineyard([], growers, { code:'VIN-001', name:'Estate One', growerId:'grower-1', municipality:'Alberite', operator:'test' })
  const result = createParcel([], growers, vineyards, { code:'PAR-001', name:'Parcel One', growerId:'grower-1', estateId:vineyards[0].id, varieties:'Tempranillo', hectares:1.5, campaignId:'campaign-2027', operator:'test' })
  assert.equal(result.parcel.growerId, 'grower-1')
  assert.equal(result.parcel.estateId, vineyards[0].id)
  assert.equal(result.plan?.campaignId, 'campaign-2027')
})

test('v25 migration preserves parcel identity, derives vineyards and campaign plans, and tolerates a missing campaign reference', async () => {
  const { migrateLegacyState } = await import('../src/store')
  const { lots, tanks, winerySettings, deliveries } = await import('../src/data')
  const legacyParcels: VineyardParcel[] = [
    { id: 'PAR-LEGACY-1', name: 'Legacy Block', grower: 'Legacy Grower', growerId: 'grower-legacy', municipality: 'Cenicero', zone: 'Rioja Alta', varieties: 'Garnacha', hectares: 3, estimatedKg: 15000, harvestWindow: '15 sept', readiness: 'ready', sample: { sampledAt: '2025-09-01', potentialAlcohol: 12.5, ph: 3.3, totalAcidity: 5.8, health: 95 }, image: '', locationId: 'location-vineyard-cenicero', campaignId: 'campaign-2025' },
    { id: 'PAR-LEGACY-2', name: 'Undated Block', grower: 'Legacy Grower', municipality: 'Cenicero', zone: 'Rioja Alta', varieties: 'Garnacha', hectares: 1, estimatedKg: 4000, harvestWindow: '18 sept', readiness: 'sampling', sample: { sampledAt: '2025-09-01', potentialAlcohol: 12, ph: 3.2, totalAcidity: 6, health: 90 }, image: '' },
  ]
  const legacy = {
    schemaVersion: 25,
    lots: structuredClone(lots), tasks: [], tanks: structuredClone(tanks),
    productionEvents: [], movements: [], parcels: legacyParcels, deliveries: structuredClone(deliveries), samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [],
    settings: structuredClone(winerySettings),
    campaigns: [{ id: 'campaign-2025', code: '2025', year: 2025, startsAt: '2025-08-01', endsAt: '2025-12-31', status: 'active' }],
  }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 27)

  const migratedFirst = migrated.parcels.find((parcel) => parcel.id === 'PAR-LEGACY-1')
  assert.ok(migratedFirst, 'parcel id must survive migration unchanged')
  assert.equal(migratedFirst?.growerId, 'grower-legacy')
  assert.equal(migratedFirst?.locationId, 'location-vineyard-cenicero')
  assert.equal(migratedFirst?.campaignId, 'campaign-2025', 'campaignId is deprecated, not deleted, by this migration')
  assert.ok(migratedFirst?.estateId && migrated.vineyards.some((vineyard) => vineyard.id === migratedFirst.estateId))
  assert.ok(migrated.campaignParcels.some((plan) => plan.parcelId === 'PAR-LEGACY-1' && plan.campaignId === 'campaign-2025'), 'a CampaignParcelPlan must be derived from the legacy campaignId')

  const migratedSecond = migrated.parcels.find((parcel) => parcel.id === 'PAR-LEGACY-2')
  assert.ok(migratedSecond, 'a parcel with no campaign reference at all must survive migration')
  assert.ok(migrated.campaignParcels.some((plan) => plan.parcelId === 'PAR-LEGACY-2'), 'a parcel with no campaignId still resolves to a fallback plan rather than being dropped')
})

test('vineyard and parcel master management is exposed as a routed administration workspace', async () => {
  const { readFile } = await import('node:fs/promises')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const admin = await readFile(new URL('../src/Administration.tsx', import.meta.url), 'utf8')
  assert.match(app, /\/admin\/vineyards/)
  assert.match(app, /\/admin\/parcels/)
  assert.match(admin, /function VineyardManager/)
  assert.match(admin, /function ParcelManager/)
  assert.doesNotMatch(admin, /window\.prompt/)
})
