import { catalystFoundation } from './catalyst'
import type { WithRev } from './wineryDiff'
import type { Campaign, CampaignParcelPlan, CellarTask, GrapeDelivery, Grower, LabSample, LotActivity, Membership, ProductionEvent, ReadingPoint, Tank, User, Vessel, VesselAllocation, VineyardEstate, VineyardParcel, Winery, WineryLocation, WineLot, WineMovement, WineMovementLeg } from './types'

export type { WithRev } from './wineryDiff'
export { dirtyRows, mergePulledRows } from './wineryDiff'

// A movement's legs have no independent identity in `WineMovementLeg` (it's
// a plain value object nested in `WineMovement.sourceLegs`/`.destinationLegs`).
// The browser synthesizes one before syncing - see App.tsx's
// deriveMovementLegs/reattachMovementLegs - so this table's rows can be
// diffed, pushed and pulled through the exact same generic
// dirtyRows/mergePulledRows mechanism every other collection uses.
export interface SyncedMovementLeg extends WineMovementLeg {
  id: string
  wineryId?: string
  movementId: string
  side: 'source' | 'destination'
  sequence: number
}

// ReadingPoint has no identity of its own either - the browser synthesizes
// `${lotId}::${recordedAt}` (App.tsx's deriveReadings), never index-based,
// since readings append repeatedly and potentially from multiple devices
// with diverged local array lengths. `time` (a display string like 'Ahora')
// is intentionally excluded here - it isn't a Catalyst column, and is
// reconstructed client-side from `recordedAt` on reattachment.
export interface SyncedReading extends Omit<ReadingPoint, 'time'> {
  id: string
  wineryId?: string
  lotId: string
  recordedAt: string
}

// LotActivity does carry its own `id`, unlike a reading, so no synthesized
// identity is needed - just the denormalized wineryId/lotId every child
// table needs for syncTable's authorization check.
export interface SyncedActivity extends LotActivity {
  wineryId?: string
  lotId: string
}

export interface WineryContextData {
  user: WithRev<User>
  memberships: WithRev<Membership>[]
  wineries: WithRev<Winery>[]
  campaigns: WithRev<Campaign>[]
  growers: WithRev<Grower>[]
  vineyards: WithRev<VineyardEstate>[]
  parcels: WithRev<VineyardParcel>[]
  campaignParcels: WithRev<CampaignParcelPlan>[]
  locations: WithRev<WineryLocation>[]
  vessels: WithRev<Vessel>[]
  vesselAllocations: WithRev<VesselAllocation>[]
  tanks: WithRev<Tank>[]
  tasks: WithRev<CellarTask>[]
  productionEvents: WithRev<ProductionEvent>[]
  movements: WithRev<WineMovement>[]
  movementLegs: WithRev<SyncedMovementLeg>[]
  lots: WithRev<WineLot>[]
  readings: WithRev<SyncedReading>[]
  activities: WithRev<SyncedActivity>[]
  deliveries: WithRev<GrapeDelivery>[]
  samples: WithRev<LabSample>[]
}

export type WineryContextResult =
  | ({ status: 'authenticated_with_membership' } & WineryContextData)
  | { status: 'unprovisioned'; bootstrapAvailable: boolean }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' }

export interface WineryBootstrapPayload {
  winery: Winery
  campaigns: Campaign[]
  growers: Grower[]
  vineyards: VineyardEstate[]
  parcels: VineyardParcel[]
  campaignParcels: CampaignParcelPlan[]
  locations: WineryLocation[]
  vessels: Vessel[]
  vesselAllocations: VesselAllocation[]
  tanks: Tank[]
  tasks: CellarTask[]
  productionEvents: ProductionEvent[]
  movements: WineMovement[]
  movementLegs: SyncedMovementLeg[]
  lots: WineLot[]
  readings: SyncedReading[]
  activities: SyncedActivity[]
  deliveries: GrapeDelivery[]
  samples: LabSample[]
}

async function callWineryApi<T>(path: string, init: RequestInit | undefined, onUnauthenticated: T, onUnavailable: T): Promise<T> {
  try {
    const response = await fetch(`${catalystFoundation.readApiUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
      ...init,
    })
    if (response.status === 401) return onUnauthenticated
    if (!response.ok) return onUnavailable
    return await response.json() as T
  } catch {
    return onUnavailable
  }
}

// GET /me/context: read-only, scoped to the caller's own winery membership.
export function fetchWineryContext(): Promise<WineryContextResult> {
  return callWineryApi('/me/context', undefined, { status: 'unauthenticated' }, { status: 'unavailable' })
}

// POST /me/provision: the one narrow bootstrap write for Phase 9.5 stage 1.
// Only succeeds once, ever - for the very first authenticated caller with no
// existing Anada_Users row and zero Anada_Wineries rows anywhere. Backfills
// the caller's own current local winery data remotely, keeping every local
// id exactly as-is so existing cross-references stay valid. See
// backend/anada_data_api/wineryContext.js for the server-side conditions.
export function provisionWinery(payload: WineryBootstrapPayload): Promise<WineryContextResult> {
  return callWineryApi('/me/provision', { method: 'POST', body: JSON.stringify(payload) }, { status: 'unauthenticated' }, { status: 'unavailable' })
}

export interface SyncTableResult<T> {
  written: WithRev<T>[]
  conflicts: WithRev<T>[]
}

export interface SyncPushPayload {
  campaigns?: WithRev<Campaign>[]
  growers?: WithRev<Grower>[]
  vineyards?: WithRev<VineyardEstate>[]
  parcels?: WithRev<VineyardParcel>[]
  campaignParcels?: WithRev<CampaignParcelPlan>[]
  tanks?: WithRev<Tank>[]
  tasks?: WithRev<CellarTask>[]
  productionEvents?: WithRev<ProductionEvent>[]
  movements?: WithRev<WineMovement>[]
  movementLegs?: WithRev<SyncedMovementLeg>[]
  lots?: WithRev<WineLot>[]
  readings?: WithRev<SyncedReading>[]
  activities?: WithRev<SyncedActivity>[]
  deliveries?: WithRev<GrapeDelivery>[]
  samples?: WithRev<LabSample>[]
}

export interface SyncPushResponse {
  status: 'synced'
  campaigns?: SyncTableResult<Campaign>
  growers?: SyncTableResult<Grower>
  vineyards?: SyncTableResult<VineyardEstate>
  parcels?: SyncTableResult<VineyardParcel>
  campaignParcels?: SyncTableResult<CampaignParcelPlan>
  tanks?: SyncTableResult<Tank>
  tasks?: SyncTableResult<CellarTask>
  productionEvents?: SyncTableResult<ProductionEvent>
  movements?: SyncTableResult<WineMovement>
  movementLegs?: SyncTableResult<SyncedMovementLeg>
  lots?: SyncTableResult<WineLot>
  readings?: SyncTableResult<SyncedReading>
  activities?: SyncTableResult<SyncedActivity>
  deliveries?: SyncTableResult<GrapeDelivery>
  samples?: SyncTableResult<LabSample>
}

// POST /me/sync: Phase 9.5 stage 2 - pushes locally-dirty rows for the 5
// tables the app actually has live edit UI for. Returns null on any
// network/auth failure so the caller can just skip this cycle and retry
// later, rather than needing its own separate error branch.
export function pushWinerySync(payload: SyncPushPayload): Promise<SyncPushResponse | null> {
  return callWineryApi('/me/sync', { method: 'POST', body: JSON.stringify(payload) }, null, null)
}
