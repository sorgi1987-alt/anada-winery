import { barrelOperations, barrels, blendCandidates, blendTrials, bottlingOrders, deliveries, initialTasks, labSamples, lots, packagingMaterials, parcels, recallSimulations, tanks, traceabilityEntities, traceabilityLinks } from './data'
import type { WineryState } from './types'

const STORAGE_KEY = 'anada-winery-state-v7'
const LEGACY_V6_STORAGE_KEY = 'anada-winery-state-v6'
const LEGACY_V5_STORAGE_KEY = 'anada-winery-state-v5'
const LEGACY_V4_STORAGE_KEY = 'anada-winery-state-v4'
const LEGACY_V3_STORAGE_KEY = 'anada-winery-state-v3'
const LEGACY_V2_STORAGE_KEY = 'anada-winery-state-v2'
const LEGACY_V1_STORAGE_KEY = 'anada-winery-state-v1'

const seedState = (): WineryState => ({
  schemaVersion: 7,
  lots: structuredClone(lots),
  tasks: structuredClone(initialTasks),
  tanks: structuredClone(tanks),
  parcels: structuredClone(parcels),
  deliveries: structuredClone(deliveries),
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
})

export interface WineryRepository {
  load(): WineryState
  save(state: WineryState): void
  clear(): WineryState
}

const isWineryState = (value: unknown): value is WineryState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WineryState>
  return candidate.schemaVersion === 7
    && Array.isArray(candidate.lots)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.tanks)
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
}

const migrateLegacyState = (value: unknown): WineryState | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (![1, 2, 3, 4, 5, 6].includes(candidate.schemaVersion as number) || !Array.isArray(candidate.lots) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.tanks)) return null
  return {
    schemaVersion: 7,
    lots: candidate.lots as WineryState['lots'],
    tasks: candidate.tasks as WineryState['tasks'],
    tanks: candidate.tanks as WineryState['tanks'],
    parcels: [2, 3, 4, 5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.parcels) ? candidate.parcels as WineryState['parcels'] : structuredClone(parcels),
    deliveries: [2, 3, 4, 5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.deliveries) ? candidate.deliveries as WineryState['deliveries'] : structuredClone(deliveries),
    samples: [3, 4, 5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.samples) ? candidate.samples as WineryState['samples'] : structuredClone(labSamples),
    barrels: [4, 5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.barrels) ? candidate.barrels as WineryState['barrels'] : structuredClone(barrels),
    barrelOperations: [4, 5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.barrelOperations) ? candidate.barrelOperations as WineryState['barrelOperations'] : structuredClone(barrelOperations),
    blendCandidates: [5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.blendCandidates) ? candidate.blendCandidates as WineryState['blendCandidates'] : structuredClone(blendCandidates),
    blendTrials: [5, 6].includes(candidate.schemaVersion as number) && Array.isArray(candidate.blendTrials) ? candidate.blendTrials as WineryState['blendTrials'] : structuredClone(blendTrials),
    packagingMaterials: candidate.schemaVersion === 6 && Array.isArray(candidate.packagingMaterials) ? candidate.packagingMaterials as WineryState['packagingMaterials'] : structuredClone(packagingMaterials),
    bottlingOrders: candidate.schemaVersion === 6 && Array.isArray(candidate.bottlingOrders) ? candidate.bottlingOrders as WineryState['bottlingOrders'] : structuredClone(bottlingOrders),
    traceabilityEntities: structuredClone(traceabilityEntities),
    traceabilityLinks: structuredClone(traceabilityLinks),
    recallSimulations: structuredClone(recallSimulations),
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
      const legacy = localStorage.getItem(LEGACY_V6_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V5_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V4_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V3_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V2_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V1_STORAGE_KEY)
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
    localStorage.removeItem(LEGACY_V6_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V5_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V4_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V3_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V2_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V1_STORAGE_KEY)
    return seedState()
  },
}
