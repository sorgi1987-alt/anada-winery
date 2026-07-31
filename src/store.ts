import { barrelOperations, barrels, deliveries, initialTasks, labSamples, lots, parcels, tanks } from './data'
import type { WineryState } from './types'

const STORAGE_KEY = 'anada-winery-state-v4'
const LEGACY_V3_STORAGE_KEY = 'anada-winery-state-v3'
const LEGACY_V2_STORAGE_KEY = 'anada-winery-state-v2'
const LEGACY_V1_STORAGE_KEY = 'anada-winery-state-v1'

const seedState = (): WineryState => ({
  schemaVersion: 4,
  lots: structuredClone(lots),
  tasks: structuredClone(initialTasks),
  tanks: structuredClone(tanks),
  parcels: structuredClone(parcels),
  deliveries: structuredClone(deliveries),
  samples: structuredClone(labSamples),
  barrels: structuredClone(barrels),
  barrelOperations: structuredClone(barrelOperations),
})

export interface WineryRepository {
  load(): WineryState
  save(state: WineryState): void
  clear(): WineryState
}

const isWineryState = (value: unknown): value is WineryState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WineryState>
  return candidate.schemaVersion === 4
    && Array.isArray(candidate.lots)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.tanks)
    && Array.isArray(candidate.parcels)
    && Array.isArray(candidate.deliveries)
    && Array.isArray(candidate.samples)
    && Array.isArray(candidate.barrels)
    && Array.isArray(candidate.barrelOperations)
}

const migrateLegacyState = (value: unknown): WineryState | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (![1, 2, 3].includes(candidate.schemaVersion as number) || !Array.isArray(candidate.lots) || !Array.isArray(candidate.tasks) || !Array.isArray(candidate.tanks)) return null
  return {
    schemaVersion: 4,
    lots: candidate.lots as WineryState['lots'],
    tasks: candidate.tasks as WineryState['tasks'],
    tanks: candidate.tanks as WineryState['tanks'],
    parcels: (candidate.schemaVersion === 2 || candidate.schemaVersion === 3) && Array.isArray(candidate.parcels) ? candidate.parcels as WineryState['parcels'] : structuredClone(parcels),
    deliveries: (candidate.schemaVersion === 2 || candidate.schemaVersion === 3) && Array.isArray(candidate.deliveries) ? candidate.deliveries as WineryState['deliveries'] : structuredClone(deliveries),
    samples: candidate.schemaVersion === 3 && Array.isArray(candidate.samples) ? candidate.samples as WineryState['samples'] : structuredClone(labSamples),
    barrels: structuredClone(barrels),
    barrelOperations: structuredClone(barrelOperations),
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
      const legacy = localStorage.getItem(LEGACY_V3_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V2_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V1_STORAGE_KEY)
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
    localStorage.removeItem(LEGACY_V3_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V2_STORAGE_KEY)
    localStorage.removeItem(LEGACY_V1_STORAGE_KEY)
    return seedState()
  },
}
