import { catalystFoundation } from './catalyst'
import type { Campaign, CampaignParcelPlan, Grower, Membership, User, Vessel, VesselAllocation, VineyardEstate, VineyardParcel, Winery, WineryLocation } from './types'

export interface WineryContextData {
  user: User
  memberships: Membership[]
  wineries: Winery[]
  campaigns: Campaign[]
  growers: Grower[]
  vineyards: VineyardEstate[]
  parcels: VineyardParcel[]
  campaignParcels: CampaignParcelPlan[]
  locations: WineryLocation[]
  vessels: Vessel[]
  vesselAllocations: VesselAllocation[]
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
}

async function callWineryApi(path: string, init?: RequestInit): Promise<WineryContextResult> {
  try {
    const response = await fetch(`${catalystFoundation.readApiUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
      ...init,
    })
    if (response.status === 401) return { status: 'unauthenticated' }
    if (!response.ok) return { status: 'unavailable' }
    return await response.json() as WineryContextResult
  } catch {
    return { status: 'unavailable' }
  }
}

// GET /me/context: read-only, scoped to the caller's own winery membership.
export function fetchWineryContext(): Promise<WineryContextResult> {
  return callWineryApi('/me/context')
}

// POST /me/provision: the one narrow bootstrap write for Phase 9.5 stage 1.
// Only succeeds once, ever - for the very first authenticated caller with no
// existing Anada_Users row and zero Anada_Wineries rows anywhere. Backfills
// the caller's own current local winery data remotely, keeping every local
// id exactly as-is so existing cross-references stay valid. See
// backend/anada_data_api/wineryContext.js for the server-side conditions.
export function provisionWinery(payload: WineryBootstrapPayload): Promise<WineryContextResult> {
  return callWineryApi('/me/provision', { method: 'POST', body: JSON.stringify(payload) })
}
