import { barrelOperations, barrels, blendCandidates, blendTrials, bottlingOrders, deliveries, initialTasks, labSamples, lots, movementReserveTanks, packagingMaterials, parcels, productLots, productMasters, productStockTransactions, productionEvents, recallSimulations, roseLot, roseTank, roseTask, suppliers, tanks, traceabilityEntities, traceabilityLinks, winerySettings, wineMovements } from './data'
import { buildCanonicalRelationshipModel } from './relationships'
import { normalizeCampaigns } from './campaigns'
import { normalizeGrowers } from './growers'
import { deriveVineyardsFromParcels, normalizeVineyards } from './vineyards'
import { deriveCampaignParcelPlans, normalizeParcels } from './parcels'
import { deriveDefaultWineryMembership, normalizeMemberships, normalizeUsers, normalizeWineries, withWineryId } from './winery'
import type { WineryState } from './types'

const STORAGE_KEY = 'anada-winery-state-v27'
const LEGACY_V26_STORAGE_KEY = 'anada-winery-state-v26'
const LEGACY_V25_STORAGE_KEY = 'anada-winery-state-v25'
const LEGACY_V24_STORAGE_KEY = 'anada-winery-state-v24'
const LEGACY_V23_STORAGE_KEY = 'anada-winery-state-v23'
const LEGACY_V22_STORAGE_KEY = 'anada-winery-state-v22'
const LEGACY_V21_STORAGE_KEY = 'anada-winery-state-v21'
const LEGACY_V20_STORAGE_KEY = 'anada-winery-state-v20'
const LEGACY_V19_STORAGE_KEY = 'anada-winery-state-v19'
const LEGACY_V18_STORAGE_KEY = 'anada-winery-state-v18'
const LEGACY_V17_STORAGE_KEY = 'anada-winery-state-v17'
const LEGACY_V16_STORAGE_KEY = 'anada-winery-state-v16'
const LEGACY_V15_STORAGE_KEY = 'anada-winery-state-v15'
const LEGACY_V14_STORAGE_KEY = 'anada-winery-state-v14'
const LEGACY_V13_STORAGE_KEY = 'anada-winery-state-v13'
const LEGACY_V12_STORAGE_KEY = 'anada-winery-state-v12'
const LEGACY_V11_STORAGE_KEY = 'anada-winery-state-v11'
const LEGACY_V10_STORAGE_KEY = 'anada-winery-state-v10'
const LEGACY_V9_STORAGE_KEY = 'anada-winery-state-v9'
const LEGACY_V8_STORAGE_KEY = 'anada-winery-state-v8'
const LEGACY_V7_STORAGE_KEY = 'anada-winery-state-v7'
const LEGACY_V6_STORAGE_KEY = 'anada-winery-state-v6'
const LEGACY_V5_STORAGE_KEY = 'anada-winery-state-v5'
const LEGACY_V4_STORAGE_KEY = 'anada-winery-state-v4'
const LEGACY_V3_STORAGE_KEY = 'anada-winery-state-v3'
const LEGACY_V2_STORAGE_KEY = 'anada-winery-state-v2'
const LEGACY_V1_STORAGE_KEY = 'anada-winery-state-v1'

export const seedState = (): WineryState => {
  const canonical = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  const vineyards = deriveVineyardsFromParcels(canonical.parcels, canonical.growers)
  const normalizedParcels = normalizeParcels(canonical.parcels, vineyards, canonical.growers)
  const { winery, user, membership } = deriveDefaultWineryMembership(winerySettings)
  const scope = <T extends { wineryId?: string }>(items: T[]) => withWineryId(items, winery.id)
  const secondaryDemoWineryAt = '2026-01-15T00:00:00.000Z'
  const secondaryDemoWinery: WineryState['wineries'][number] = {
    id: 'winery-demo-secondary', code: 'DEMO-02', name: 'Bodega Ejemplo Dos', legalName: 'Bodega Ejemplo Dos, S.L.',
    municipality: 'Fuenmayor', province: 'La Rioja', designation: 'DOCa Rioja', timezone: 'Europe/Madrid', status: 'active',
    notes: 'Demo winery seeded to prove multi-winery isolation (Phase 9.2).',
    createdAt: secondaryDemoWineryAt, updatedAt: secondaryDemoWineryAt, createdBy: 'System migration', updatedBy: 'System migration',
  }
  const secondaryDemoMembership: WineryState['memberships'][number] = {
    id: `membership-${secondaryDemoWinery.id}-${user.id}`, wineryId: secondaryDemoWinery.id, userId: user.id, role: 'owner', status: 'active',
    createdAt: secondaryDemoWineryAt, updatedAt: secondaryDemoWineryAt, createdBy: 'System migration', updatedBy: 'System migration',
  }
  const secondaryDemoGrowers: WineryState['growers'] = [
    { id: 'grower-demo-secondary-1', wineryId: secondaryDemoWinery.id, code: 'VIT-D01', name: 'Viñedos Fuenmayor', legalName: 'Viñedos Fuenmayor SAT', growerType: 'cooperative', country: 'España', status: 'active', notes: '', createdAt: secondaryDemoWineryAt, updatedAt: secondaryDemoWineryAt, createdBy: 'System migration', updatedBy: 'System migration' },
    { id: 'grower-demo-secondary-2', wineryId: secondaryDemoWinery.id, code: 'VIT-D02', name: 'Familia Ochoa', legalName: 'Familia Ochoa Bodegas SL', growerType: 'company', country: 'España', status: 'active', notes: '', createdAt: secondaryDemoWineryAt, updatedAt: secondaryDemoWineryAt, createdBy: 'System migration', updatedBy: 'System migration' },
  ]
  return {
  schemaVersion: 27,
  wineries: [winery, secondaryDemoWinery],
  users: [user],
  memberships: [membership, secondaryDemoMembership],
  campaigns: scope(canonical.campaigns),
  growers: [...scope(canonical.growers), ...secondaryDemoGrowers],
  vineyards: scope(vineyards),
  campaignParcels: scope(deriveCampaignParcelPlans(normalizedParcels, canonical.campaigns.find((c) => c.isDefault)?.id ?? canonical.campaigns[0].id)),
  locations: scope(canonical.locations),
  vessels: scope(canonical.vessels),
  vesselAllocations: scope(canonical.vesselAllocations),
  vineyardSamples: scope(canonical.vineyardSamples),
  lots: scope(canonical.lots),
  tasks: scope(structuredClone(initialTasks)),
  tanks: scope(structuredClone(tanks)),
  productionEvents: scope(structuredClone(productionEvents)),
  movements: scope(structuredClone(wineMovements)),
  parcels: scope(normalizedParcels),
  deliveries: scope(canonical.deliveries),
  samples: scope(structuredClone(labSamples)),
  barrels: scope(structuredClone(barrels)),
  barrelOperations: scope(structuredClone(barrelOperations)),
  blendCandidates: scope(structuredClone(blendCandidates)),
  blendTrials: scope(structuredClone(blendTrials)),
  packagingMaterials: scope(structuredClone(packagingMaterials)),
  bottlingOrders: scope(structuredClone(bottlingOrders)),
  traceabilityEntities: scope(structuredClone(traceabilityEntities)),
  traceabilityLinks: scope(structuredClone(traceabilityLinks)),
  recallSimulations: scope(structuredClone(recallSimulations)),
  suppliers: scope(structuredClone(suppliers)),
  productMasters: scope(structuredClone(productMasters)),
  productLots: scope(structuredClone(productLots)),
  productStockTransactions: scope(structuredClone(productStockTransactions)),
  weatherSnapshots: [],
  settings: structuredClone(winerySettings),
  }
}

export interface WineryRepository {
  load(): WineryState
  save(state: WineryState): void
  clear(): WineryState
}

const isWineryState = (value: unknown): value is WineryState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WineryState>
  return candidate.schemaVersion === 27
    && Array.isArray(candidate.wineries)
    && Array.isArray(candidate.users)
    && Array.isArray(candidate.memberships)
    && Array.isArray(candidate.campaigns)
    && Array.isArray(candidate.growers)
    && Array.isArray(candidate.vineyards)
    && Array.isArray(candidate.campaignParcels)
    && Array.isArray(candidate.locations)
    && Array.isArray(candidate.vessels)
    && Array.isArray(candidate.vesselAllocations)
    && Array.isArray(candidate.vineyardSamples)
    && Array.isArray(candidate.lots)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.tanks)
    && Array.isArray(candidate.productionEvents)
    && Array.isArray(candidate.movements)
    && Array.isArray(candidate.parcels)
    && Array.isArray(candidate.deliveries)
    && Array.isArray(candidate.samples)
    && Array.isArray(candidate.barrels)
    && Array.isArray(candidate.barrelOperations)
    && Array.isArray(candidate.blendCandidates)
    && Array.isArray(candidate.blendTrials)
    && Array.isArray(candidate.packagingMaterials)
    && Array.isArray(candidate.bottlingOrders)
    && Array.isArray(candidate.traceabilityEntities)
    && Array.isArray(candidate.traceabilityLinks)
    && Array.isArray(candidate.recallSimulations)
    && Array.isArray(candidate.suppliers)
    && Array.isArray(candidate.productMasters)
    && Array.isArray(candidate.productLots)
    && Array.isArray(candidate.productStockTransactions)
    && Array.isArray(candidate.weatherSnapshots)
    && !!candidate.settings
    && typeof candidate.settings === 'object'
}

const withRoseDemo = (legacyLots: WineryState['lots'], legacyTasks: WineryState['tasks'], legacyTanks: WineryState['tanks']) => {
  const canAddDemo = !legacyLots.some((lot) => lot.type === 'rosado') && !legacyTanks.some((tank) => tank.id === roseTank.id)
  return canAddDemo
    ? { lots: [...legacyLots, structuredClone(roseLot)], tasks: [...legacyTasks, structuredClone(roseTask)], tanks: [...legacyTanks, structuredClone(roseTank)] }
    : { lots: legacyLots, tasks: legacyTasks, tanks: legacyTanks }
}

const withWhiteProcessDemo = (legacyEvents: WineryState['productionEvents']) => {
  if (legacyEvents.some((event) => event.wineType === 'blanco')) return legacyEvents
  const whiteEvents = productionEvents.filter((event) => event.wineType === 'blanco')
  return [...legacyEvents, ...structuredClone(whiteEvents)]
}

const withRoseProcessDemo = (legacyEvents: WineryState['productionEvents']) => {
  if (legacyEvents.some((event) => event.wineType === 'rosado')) return legacyEvents
  const roseEvents = productionEvents.filter((event) => event.wineType === 'rosado')
  return [...legacyEvents, ...structuredClone(roseEvents)]
}

const withMovementReserveTanks = (legacyTanks: WineryState['tanks']) => {
  const existingIds = new Set(legacyTanks.map((tank) => tank.id))
  const missing = movementReserveTanks.filter((tank) => !existingIds.has(tank.id))
  return missing.length ? [...legacyTanks, ...structuredClone(missing)] : legacyTanks
}

const normalizePackagingMaterials = (legacyMaterials: unknown[]) => legacyMaterials.map((value) => {
  const material = value as Record<string, unknown>
  const { riojaSeries, ...current } = material
  return {
    ...current,
    ...(typeof current.controlledSeries === 'string' ? {} : typeof riojaSeries === 'string' ? { controlledSeries: riojaSeries } : {}),
  }
}) as unknown as WineryState['packagingMaterials']

const normalizeBottlingOrders = (legacyOrders: unknown[]) => legacyOrders.map((value) => {
  const order = value as Record<string, unknown>
  const { ageingMention, originMention, completion, ...current } = order
  const legacyCompletion = completion && typeof completion === 'object' ? completion as Record<string, unknown> : undefined
  let normalizedCompletion: Record<string, unknown> | undefined
  if (legacyCompletion) {
    const { backLabelFrom, backLabelTo, ...completionCurrent } = legacyCompletion
    normalizedCompletion = {
      ...completionCurrent,
      ...(completionCurrent.labelSerialFrom !== undefined ? {} : typeof backLabelFrom === 'number' ? { labelSerialFrom: backLabelFrom } : {}),
      ...(completionCurrent.labelSerialTo !== undefined ? {} : typeof backLabelTo === 'number' ? { labelSerialTo: backLabelTo } : {}),
    }
  }
  return {
    ...current,
    ...(typeof current.labelClaim === 'string' ? {} : typeof ageingMention === 'string' ? { labelClaim: ageingMention } : {}),
    ...(typeof current.originClaim === 'string' ? {} : typeof originMention === 'string' ? { originClaim: originMention } : {}),
    ...(normalizedCompletion ? { completion: normalizedCompletion } : {}),
  }
}) as unknown as WineryState['bottlingOrders']

export const migrateLegacyState = (value: unknown): WineryState | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  const version = candidate.schemaVersion as number
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26].includes(version) || !Array.isArray(candidate.lots) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.tanks)) return null
  const core = withRoseDemo(candidate.lots as WineryState['lots'], candidate.tasks as WineryState['tasks'], candidate.tanks as WineryState['tanks'])
  const migratedSettings = version >= 8 && candidate.settings && typeof candidate.settings === 'object' ? { ...structuredClone(winerySettings), ...(candidate.settings as WineryState['settings']) } : structuredClone(winerySettings)
  const migratedParcels = version >= 2 && Array.isArray(candidate.parcels) ? candidate.parcels as WineryState['parcels'] : structuredClone(parcels)
  const migratedDeliveries = version >= 2 && Array.isArray(candidate.deliveries) ? candidate.deliveries as WineryState['deliveries'] : structuredClone(deliveries)
  const canonical = buildCanonicalRelationshipModel(migratedSettings, migratedParcels, migratedDeliveries, core.lots, withMovementReserveTanks(core.tanks))
  const migratedGrowers = version >= 24 && Array.isArray(candidate.growers) ? normalizeGrowers(candidate.growers as Array<Partial<WineryState['growers'][number]>>) : canonical.growers
  const migratedVineyards = version >= 26 && Array.isArray(candidate.vineyards) ? normalizeVineyards(candidate.vineyards as Array<Partial<WineryState['vineyards'][number]>>) : deriveVineyardsFromParcels(canonical.parcels, migratedGrowers)
  const normalizedParcels = normalizeParcels(canonical.parcels, migratedVineyards, migratedGrowers)
  const migratedCampaigns = version >= 23 && Array.isArray(candidate.campaigns) ? normalizeCampaigns(candidate.campaigns as Array<Partial<WineryState['campaigns'][number]> & { id: string; code: string }>, migratedSettings.campaignYear) : canonical.campaigns
  const fallbackCampaignId = migratedCampaigns.find((c) => c.isDefault)?.id ?? migratedCampaigns[0]?.id ?? `campaign-${migratedSettings.campaignYear}`

  const defaultWineryMembership = deriveDefaultWineryMembership(migratedSettings)
  const migratedWineries = version >= 27 && Array.isArray(candidate.wineries) && candidate.wineries.length
    ? normalizeWineries(candidate.wineries as Array<Partial<WineryState['wineries'][number]>>)
    : [defaultWineryMembership.winery]
  const migratedUsers = version >= 27 && Array.isArray(candidate.users) && candidate.users.length
    ? normalizeUsers(candidate.users as Array<Partial<WineryState['users'][number]>>)
    : [defaultWineryMembership.user]
  const migratedMemberships = version >= 27 && Array.isArray(candidate.memberships) && candidate.memberships.length
    ? normalizeMemberships(candidate.memberships as Array<Partial<WineryState['memberships'][number]>>)
    : [defaultWineryMembership.membership]
  const primaryWineryId = migratedWineries[0]?.id ?? defaultWineryMembership.winery.id
  const scope = <T extends { wineryId?: string }>(items: T[]) => withWineryId(items, primaryWineryId)

  return {
    schemaVersion: 27,
    wineries: migratedWineries,
    users: migratedUsers,
    memberships: migratedMemberships,
    campaigns: scope(migratedCampaigns),
    growers: scope(migratedGrowers),
    vineyards: scope(migratedVineyards),
    campaignParcels: scope(version >= 26 && Array.isArray(candidate.campaignParcels) ? candidate.campaignParcels as WineryState['campaignParcels'] : deriveCampaignParcelPlans(normalizedParcels, fallbackCampaignId)),
    locations: scope(version >= 24 && Array.isArray(candidate.locations) ? candidate.locations as WineryState['locations'] : canonical.locations),
    vessels: scope(version >= 24 && Array.isArray(candidate.vessels) ? candidate.vessels as WineryState['vessels'] : canonical.vessels),
    vesselAllocations: scope(version >= 24 && Array.isArray(candidate.vesselAllocations) ? candidate.vesselAllocations as WineryState['vesselAllocations'] : canonical.vesselAllocations),
    vineyardSamples: scope(version >= 24 && Array.isArray(candidate.vineyardSamples) ? candidate.vineyardSamples as WineryState['vineyardSamples'] : canonical.vineyardSamples),
    lots: scope(canonical.lots),
    tasks: scope(core.tasks),
    tanks: scope(withMovementReserveTanks(core.tanks)),
    productionEvents: scope(version >= 10 && Array.isArray(candidate.productionEvents)
      ? withRoseProcessDemo(withWhiteProcessDemo(candidate.productionEvents as WineryState['productionEvents']))
      : structuredClone(productionEvents)),
    movements: scope(version >= 13 && Array.isArray(candidate.movements) ? candidate.movements as WineryState['movements'] : structuredClone(wineMovements)),
    parcels: scope(normalizedParcels),
    deliveries: scope(canonical.deliveries),
    samples: scope(version >= 3 && Array.isArray(candidate.samples) ? candidate.samples as WineryState['samples'] : structuredClone(labSamples)),
    barrels: scope(version >= 4 && Array.isArray(candidate.barrels) ? candidate.barrels as WineryState['barrels'] : structuredClone(barrels)),
    barrelOperations: scope(version >= 4 && Array.isArray(candidate.barrelOperations) ? candidate.barrelOperations as WineryState['barrelOperations'] : structuredClone(barrelOperations)),
    blendCandidates: scope(version >= 5 && Array.isArray(candidate.blendCandidates) ? candidate.blendCandidates as WineryState['blendCandidates'] : structuredClone(blendCandidates)),
    blendTrials: scope(version >= 5 && Array.isArray(candidate.blendTrials) ? candidate.blendTrials as WineryState['blendTrials'] : structuredClone(blendTrials)),
    packagingMaterials: scope(version >= 6 && Array.isArray(candidate.packagingMaterials) ? normalizePackagingMaterials(candidate.packagingMaterials) : structuredClone(packagingMaterials)),
    bottlingOrders: scope(version >= 6 && Array.isArray(candidate.bottlingOrders) ? normalizeBottlingOrders(candidate.bottlingOrders) : structuredClone(bottlingOrders)),
    traceabilityEntities: scope(version >= 7 && Array.isArray(candidate.traceabilityEntities) ? candidate.traceabilityEntities as WineryState['traceabilityEntities'] : structuredClone(traceabilityEntities)),
    traceabilityLinks: scope(version >= 7 && Array.isArray(candidate.traceabilityLinks) ? candidate.traceabilityLinks as WineryState['traceabilityLinks'] : structuredClone(traceabilityLinks)),
    recallSimulations: scope(version >= 7 && Array.isArray(candidate.recallSimulations) ? candidate.recallSimulations as WineryState['recallSimulations'] : structuredClone(recallSimulations)),
    suppliers: scope(version >= 16 && Array.isArray(candidate.suppliers) ? candidate.suppliers as WineryState['suppliers'] : structuredClone(suppliers)),
    productMasters: scope(version >= 16 && Array.isArray(candidate.productMasters) ? candidate.productMasters as WineryState['productMasters'] : structuredClone(productMasters)),
    productLots: scope(version >= 16 && Array.isArray(candidate.productLots) ? (candidate.productLots as WineryState['productLots']).map((lot) => ({ ...lot, locationBalances: lot.locationBalances?.length ? lot.locationBalances : [{ location: lot.location, quantity: lot.quantityOnHand }] })) : structuredClone(productLots).map((lot) => ({ ...lot, locationBalances: lot.locationBalances?.length ? lot.locationBalances : [{ location: lot.location, quantity: lot.quantityOnHand }] }))),
    productStockTransactions: scope(version >= 16 && Array.isArray(candidate.productStockTransactions) ? candidate.productStockTransactions as WineryState['productStockTransactions'] : structuredClone(productStockTransactions)),
    weatherSnapshots: scope(version >= 21 && Array.isArray(candidate.weatherSnapshots) ? candidate.weatherSnapshots as WineryState['weatherSnapshots'] : []),
    settings: migratedSettings,
  }
}

// A now-fixed sync-merge bug (adopting a remote parcel change used to
// replace the whole local row, not just the fields Catalyst tracks) could
// have already dropped `sample`/`image` - both required, local-only fields
// - from an install before this fix shipped, leaving `parcel.sample`
// `undefined` and crashing anything that reads it (e.g. Harvest.tsx). This
// backfills a sane default for any parcel already missing them; harmless
// no-op for every parcel that still has its real value.
export const repairParcelsMissingLocalOnlyFields = (state: WineryState): WineryState => {
  if (!state.parcels.some((parcel) => !parcel.sample || !parcel.image)) return state
  return {
    ...state,
    parcels: state.parcels.map((parcel) => (parcel.sample && parcel.image) ? parcel : ({
      ...parcel,
      sample: parcel.sample ?? { sampledAt: new Date().toISOString().slice(0, 10), potentialAlcohol: 0, ph: 0, totalAcidity: 0, health: 0 },
      image: parcel.image ?? '',
    })),
  }
}

export const browserWineryRepository: WineryRepository = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        return isWineryState(parsed) ? repairParcelsMissingLocalOnlyFields(parsed) : seedState()
      }
      const legacy = localStorage.getItem(LEGACY_V26_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V25_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V24_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V23_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V22_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V21_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V20_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V19_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V18_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V17_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V16_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V15_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V14_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V13_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V12_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V11_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V10_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V9_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V8_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V7_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V6_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V5_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V4_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V3_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V2_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V1_STORAGE_KEY)
      if (!legacy) return seedState()
      return migrateLegacyState(JSON.parse(legacy)) ?? seedState()
    } catch {
      return seedState()
    }
  },
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_V26_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V25_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V24_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V23_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V22_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V21_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V20_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V19_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V18_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V17_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V16_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V15_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V14_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V13_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V12_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V11_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V10_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V9_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V8_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V7_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V6_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V5_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V4_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V3_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V2_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V1_STORAGE_KEY)
    return seedState()
  },
}
