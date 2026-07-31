import { initialTasks, lots, tanks } from './data'
import type { WineryState } from './types'

const STORAGE_KEY = 'anada-winery-state-v1'

const seedState = (): WineryState => ({
  schemaVersion: 1,
  lots: structuredClone(lots),
  tasks: structuredClone(initialTasks),
  tanks: structuredClone(tanks),
})

export interface WineryRepository {
  load(): WineryState
  save(state: WineryState): void
  clear(): WineryState
}

const isWineryState = (value: unknown): value is WineryState => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WineryState>
  return candidate.schemaVersion === 1
    && Array.isArray(candidate.lots)
    && Array.isArray(candidate.tasks)
    && Array.isArray(candidate.tanks)
}

export const browserWineryRepository: WineryRepository = {
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return seedState()
      const parsed: unknown = JSON.parse(stored)
      return isWineryState(parsed) ? parsed : seedState()
    } catch {
      return seedState()
    }
  },
  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
    return seedState()
  },
}
