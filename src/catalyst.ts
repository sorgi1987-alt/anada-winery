export type CatalystConnectionState = 'not-configured' | 'not-checked' | 'ready' | 'unavailable'

export interface CatalystTableContract {
  name: string
  id: string
  record: string
}

export interface CatalystConnectionResult {
  state: CatalystConnectionState
  checkedAt?: string
  schemaVersion?: number
  tableCount?: number
  message?: string
}

export const CATALYST_SCHEMA_VERSION = 1

export const CATALYST_TABLES: readonly CatalystTableContract[] = [
  { name: 'Anada_Wineries', id: '11922000000093921', record: 'winery' },
  { name: 'Anada_WineLots', id: '11922000000096178', record: 'wine lot' },
  { name: 'Anada_Tanks', id: '11922000000094860', record: 'tank' },
  { name: 'Anada_Tasks', id: '11922000000095587', record: 'task' },
  { name: 'Anada_Readings', id: '11922000000097280', record: 'reading' },
  { name: 'Anada_Activities', id: '11922000000096537', record: 'activity' },
  { name: 'Anada_SyncState', id: '11922000000098219', record: 'sync state' },
] as const

const readApiUrl = (import.meta.env.VITE_CATALYST_READ_API_URL ?? '').trim().replace(/\/$/, '')

export const catalystFoundation = {
  projectId: import.meta.env.VITE_CATALYST_PROJECT_ID ?? '11922000000094785',
  organisationId: import.meta.env.VITE_CATALYST_ORG_ID ?? '20117369913',
  region: import.meta.env.VITE_CATALYST_REGION ?? 'EU',
  environment: import.meta.env.VITE_CATALYST_ENVIRONMENT ?? 'Development',
  projectDomain: import.meta.env.VITE_CATALYST_PROJECT_DOMAIN ?? 'https://anada-winery-20117369913.development.catalystserverless.eu',
  readApiUrl,
  schemaVersion: CATALYST_SCHEMA_VERSION,
  tables: CATALYST_TABLES,
  schemaProvisioned: true,
  remoteWritesEnabled: false,
} as const

function isHealthPayload(value: unknown): value is { status: string; schemaVersion: number; tableCount: number } {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  return payload.status === 'ready' && typeof payload.schemaVersion === 'number' && typeof payload.tableCount === 'number'
}

export async function checkCatalystReadService(): Promise<CatalystConnectionResult> {
  if (!readApiUrl) return { state: 'not-configured' }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)
  try {
    const response = await fetch(`${readApiUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) return { state: 'unavailable', checkedAt: new Date().toISOString(), message: `HTTP ${response.status}` }
    const payload: unknown = await response.json()
    if (!isHealthPayload(payload)) return { state: 'unavailable', checkedAt: new Date().toISOString(), message: 'Unexpected health response' }
    return {
      state: 'ready',
      checkedAt: new Date().toISOString(),
      schemaVersion: payload.schemaVersion,
      tableCount: payload.tableCount,
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'Connection timed out' : 'Connection failed'
    return { state: 'unavailable', checkedAt: new Date().toISOString(), message }
  } finally {
    window.clearTimeout(timeout)
  }
}
