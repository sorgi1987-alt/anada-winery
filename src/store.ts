import { barrelOperations, barrels, blendCandidates, blendTrials, bottlingOrders, deliveries, initialTasks, labSamples, lots, movementReserveTanks, packagingMaterials, parcels, productLots, productMasters, productStockTransactions, productionEvents, recallSimulations, roseLot, roseTank, roseTask, suppliers, tanks, traceabilityEntities, traceabilityLinks, winerySettings, wineMovements } from './data'
import { buildCanonicalRelationshipModel } from './relationships'
import { normalizeCampaigns } from './campaigns'
import { normalizeGrowers } from './growers'
import { deriveVineyardsFromParcels, normalizeVineyards } from './vineyards'
import { deriveCampaignParcelPlans, normalizeParcels } from './parcels'
import type { WineryState } from './types'

const STORAGE_KEY = 'anada-winery-state-v26'
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

const seedState = (): WineryState => {
  const canonical = buildCanonicalRelationshipModel(winerySettings, structuredClone(parcels), structuredClone(deliveries), structuredClone(lots), structuredClone(tanks))
  const vineyards = deriveVineyardsFromParcels(canonical.parcels, canonical.growers)
  const normalizedParcels = normalizeParcels(canonical.parcels, vineyards, canonical.growers)
  return {
  schemaVersion: 26,
  campaigns: canonical.campaigns,
  growers: canonical.growers,
  vineyards,
  campaignParcels: deriveCampaignParcelPlans(normalizedParcels, canonical.campaigns.find((c) => c.isDefault)?.id ?? canonical.campaigns[0].id),
  locations: canonical.locations,
  vessels: canonical.vessels,
  vesselAllocations: canonical.vesselAllocations,
  vineyardSamples: canonical.vineyardSamples,
  lots: canonical.lots,
  tasks: structuredClone(initialTasks),
  tanks: structuredClone(tanks),
  productionEvents: structuredClone(productionEvents),
  movements: structuredClone(wineMovements),
  parcels: normalizedParcels,
  deliveries: canonical.deliveries,
  samples: structuredClone(labSamples),
  barrels: structuredClone(barrels),
  barrelOperations: structuredClone(barrelOperations),
  blendCandidates: structuredClone(blendCandidates),
  blendTrials: structuredClone(blendTrials),
  packagingMaterials: structuredClone(packagingMaterials),
  bottlingOrders: structuredClone(bottlingOrders),
  traceabilityEntities: structuredClone(traceabilityEntities),
  traceabilityLinks: structuredClone(traceabilityLinks),
  recallSimulations: structuredClone(recallSimulations),
  suppliers: structuredClone(suppliers),
  productMasters: structuredClone(productMasters),
  productLots: structuredClone(productLots),
  productStockTransactions: structuredClone(productStockTransactions),
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
  return candidate.schemaVersion === 26
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
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].includes(version) || !Array.isArray(candidate.lots) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.tanks)) return null
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
  return {
    schemaVersion: 26,
    campaigns: migratedCampaigns,
    growers: migratedGrowers,
    vineyards: migratedVineyards,
    campaignParcels: version >= 26 && Array.isArray(candidate.campaignParcels) ? candidate.campaignParcels as WineryState['campaignParcels'] : deriveCampaignParcelPlans(normalizedParcels, fallbackCampaignId),
    locations: version >= 24 && Array.isArray(candidate.locations) ? candidate.locations as WineryState['locations'] : canonical.locations,
    vessels: version >= 24 && Array.isArray(candidate.vessels) ? candidate.vessels as WineryState['vessels'] : canonical.vessels,
    vesselAllocations: version >= 24 && Array.isArray(candidate.vesselAllocations) ? candidate.vesselAllocations as WineryState['vesselAllocations'] : canonical.vesselAllocations,
    vineyardSamples: version >= 24 && Array.isArray(candidate.vineyardSamples) ? candidate.vineyardSamples as WineryState['vineyardSamples'] : canonical.vineyardSamples,
    lots: canonical.lots,
    tasks: core.tasks,
    tanks: withMovementReserveTanks(core.tanks),
    productionEvents: version >= 10 && Array.isArray(candidate.productionEvents)
      ? withRoseProcessDemo(withWhiteProcessDemo(candidate.productionEvents as WineryState['productionEvents']))
      : structuredClone(productionEvents),
    movements: version >= 13 && Array.isArray(candidate.movements) ? candidate.movements as WineryState['movements'] : structuredClone(wineMovements),
    parcels: normalizedParcels,
    deliveries: canonical.deliveries,
    samples: version >= 3 && Array.isArray(candidate.samples) ? candidate.samples as WineryState['samples'] : structuredClone(labSamples),
    barrels: version >= 4 && Array.isArray(candidate.barrels) ? candidate.barrels as WineryState['barrels'] : structuredClone(barrels),
    barrelOperations: version >= 4 && Array.isArray(candidate.barrelOperations) ? candidate.barrelOperations as WineryState['barrelOperations'] : structuredClone(barrelOperations),
    blendCandidates: version >= 5 && Array.isArray(candidate.blendCandidates) ? candidate.blendCandidates as WineryState['blendCandidates'] : structuredClone(blendCandidates),
    blendTrials: version >= 5 && Array.isArray(candidate.blendTrials) ? candidate.blendTrials as WineryState['blendTrials'] : structuredClone(blendTrials),
    packagingMaterials: version >= 6 && Array.isArray(candidate.packagingMaterials) ? normalizePackagingMaterials(candidate.packagingMaterials) : structuredClone(packagingMaterials),
    bottlingOrders: version >= 6 && Array.isArray(candidate.bottlingOrders) ? normalizeBottlingOrders(candidate.bottlingOrders) : structuredClone(bottlingOrders),
    traceabilityEntities: version >= 7 && Array.isArray(candidate.traceabilityEntities) ? candidate.traceabilityEntities as WineryState['traceabilityEntities'] : structuredClone(traceabilityEntities),
    traceabilityLinks: version >= 7 && Array.isArray(candidate.traceabilityLinks) ? candidate.traceabilityLinks as WineryState['traceabilityLinks'] : structuredClone(traceabilityLinks),
    recallSimulations: version >= 7 && Array.isArray(candidate.recallSimulations) ? candidate.recallSimulations as WineryState['recallSimulations'] : structuredClone(recallSimulations),
    suppliers: version >= 16 && Array.isArray(candidate.suppliers) ? candidate.suppliers as WineryState['suppliers'] : structuredClone(suppliers),
    productMasters: version >= 16 && Array.isArray(candidate.productMasters) ? candidate.productMasters as WineryState['productMasters'] : structuredClone(productMasters),
    productLots: version >= 16 && Array.isArray(candidate.productLots) ? (candidate.productLots as WineryState['productLots']).map((lot) => ({ ...lot, locationBalances: lot.locationBalances?.length ? lot.locationBalances : [{ location: lot.location, quantity: lot.quantityOnHand }] })) : structuredClone(productLots).map((lot) => ({ ...lot, locationBalances: lot.locationBalances?.length ? lot.locationBalances : [{ location: lot.location, quantity: lot.quantityOnHand }] })),
    productStockTransactions: version >= 16 && Array.isArray(candidate.productStockTransactions) ? candidate.productStockTransactions as WineryState['productStockTransactions'] : structuredClone(productStockTransactions),
    weatherSnapshots: version >= 21 && Array.isArray(candidate.weatherSnapshots) ? candidate.weatherSnapshots as WineryState['weatherSnapshots'] : [],
    settings: migratedSettings,
  }
}

export const browserWineryRepository: WineryRepository = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        return isWineryState(parsed) ? parsed : seedState()
      }
      const legacy = localStorage.getItem(LEGACY_V25_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V24_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V23_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V22_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V21_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V20_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V19_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V18_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V17_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V16_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V15_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V14_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V13_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V12_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V11_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V10_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V9_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V8_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V7_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V6_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V5_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V4_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V3_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V2_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V1_STORAGE_KEY)
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
