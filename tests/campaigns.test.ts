import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { activateCampaign, archiveCampaign, CampaignValidationError, closeCampaign, createCampaign, normalizeCampaigns, reopenCampaign, setDefaultCampaign, updateCampaign, validateCampaignSet } from '../src/campaigns'
import { migrateLegacyState } from '../src/store'
import type { Campaign, WineryState } from '../src/types'

const baseCampaign: Campaign = {
  id: 'campaign-2026',
  code: '2026',
  name: 'Vendimia 2026',
  vintage: 2026,
  status: 'active',
  startsAt: '2026-08-01',
  expectedHarvestStart: '2026-09-01',
  expectedEndAt: '2026-12-31',
  isDefault: true,
  notes: '',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  createdBy: 'System',
  updatedBy: 'System',
}

test('campaign creation preserves one default and unique codes', () => {
  const campaigns = createCampaign([baseCampaign], {
    code: '2027', name: 'Vendimia 2027', vintage: 2027, startsAt: '2027-08-01', makeDefault: true, operator: 'Sergio',
  }, '2026-08-06T10:00:00.000Z')
  assert.equal(campaigns.length, 2)
  assert.equal(campaigns.filter((item) => item.isDefault).length, 1)
  assert.equal(campaigns.find((item) => item.code === '2027')?.status, 'planned')
  assert.throws(() => createCampaign(campaigns, { code: '2027', name: 'Duplicate', vintage: 2027, startsAt: '2027-08-01', operator: 'Sergio' }), CampaignValidationError)
})

test('activation enforces one active and one default campaign', () => {
  const planned: Campaign = { ...baseCampaign, id: 'campaign-2027', code: '2027', name: 'Vendimia 2027', vintage: 2027, status: 'planned', isDefault: false }
  const result = activateCampaign([baseCampaign, planned], planned.id, 'Sergio', '2027-08-01T08:00:00.000Z')
  assert.equal(result.filter((item) => item.status === 'active').length, 1)
  assert.equal(result.filter((item) => item.isDefault).length, 1)
  assert.equal(result.find((item) => item.id === planned.id)?.status, 'active')
  assert.equal(result.find((item) => item.id === baseCampaign.id)?.status, 'planned')
  assert.deepEqual(validateCampaignSet(result), [])
})

test('closing is blocked by unresolved operational records', () => {
  const state = {
    campaigns: [baseCampaign],
    lots: [{ id: 'LOT-1', campaignId: baseCampaign.id, operationalStatus: 'active' }],
    deliveries: [], bottlingOrders: [],
  } as unknown as WineryState
  assert.throws(() => closeCampaign(state, baseCampaign.id, 'Sergio'), CampaignValidationError)
})

test('closed campaign can be reopened and archived with audit attribution', () => {
  const state = { campaigns: [baseCampaign], lots: [], deliveries: [], bottlingOrders: [] } as unknown as WineryState
  const closed = closeCampaign(state, baseCampaign.id, 'Sergio', '2026-12-31T17:00:00.000Z')
  assert.equal(closed[0].status, 'closed')
  const reopened = reopenCampaign(closed, baseCampaign.id, 'Maria', '2027-01-03T09:00:00.000Z')
  assert.equal(reopened[0].status, 'planned')
  assert.equal(reopened[0].reopenedBy, 'Maria')
  const closedAgain = [{ ...reopened[0], status: 'closed' as const, closedAt: '2027-01-04T09:00:00.000Z' }]
  const archived = archiveCampaign(closedAgain, baseCampaign.id, 'Maria', '2027-01-05T09:00:00.000Z')
  assert.equal(archived[0].status, 'archived')
})

test('v23 migration enriches campaign lifecycle fields and preserves records', () => {
  const legacy = {
    schemaVersion: 23,
    campaigns: [{ id: 'campaign-2026', code: '2026', year: 2026, startsAt: '2026-08-01', endsAt: '2026-12-31', status: 'active' }],
    lots: [], tasks: [], tanks: [], productionEvents: [], movements: [], parcels: [], deliveries: [], samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [],
    settings: { campaignYear: 2026, campaignStart: '2026-08-01', campaignEnd: '2026-12-31' },
  }
  const migrated = migrateLegacyState(legacy)
  assert.equal(migrated?.schemaVersion, 24)
  assert.equal(migrated?.campaigns[0].name, 'Vendimia 2026')
  assert.equal(migrated?.campaigns[0].vintage, 2026)
  assert.equal(migrated?.campaigns[0].isDefault, true)
})

test('normalization repairs multiple active and default campaigns deterministically', () => {
  const normalized = normalizeCampaigns([
    { ...baseCampaign },
    { ...baseCampaign, id: 'campaign-2027', code: '2027', vintage: 2027, status: 'active', isDefault: true },
  ], 2026)
  assert.equal(normalized.filter((item) => item.status === 'active').length, 1)
  assert.equal(normalized.filter((item) => item.isDefault).length, 1)
})

test('campaign edits preserve identity and default selection stays unique', () => {
  const base = normalizeCampaigns([
    { id: 'campaign-2026', code: '2026', status: 'active', isDefault: true },
    { id: 'campaign-2027', code: '2027', status: 'planned', isDefault: false },
  ], 2026)
  const edited = updateCampaign(base, 'campaign-2027', { name: 'Vendimia especial 2027', expectedHarvestStart: '2027-09-10' }, 'Elena Martín', '2026-08-06T15:00:00.000Z')
  assert.equal(edited[1].id, 'campaign-2027')
  assert.equal(edited[1].name, 'Vendimia especial 2027')
  const selected = setDefaultCampaign(edited, 'campaign-2027', 'Elena Martín', '2026-08-06T15:01:00.000Z')
  assert.equal(selected.filter((campaign) => campaign.isDefault).length, 1)
  assert.equal(selected.find((campaign) => campaign.isDefault)?.id, 'campaign-2027')
})

test('campaign management UI uses in-app editor and lifecycle actions', () => {
  const source = readFileSync(new URL('../src/Administration.tsx', import.meta.url), 'utf8')
  assert.match(source, /function CampaignManager/)
  assert.match(source, /function CampaignEditor/)
  assert.match(source, /onAction\('activate'/)
  assert.match(source, /onAction\('close'/)
  assert.doesNotMatch(source, /window\.prompt/)
})
