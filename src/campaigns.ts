import type { Campaign, NewCampaignInput, WineryState } from './types'

const canonical = (value: unknown) => String(value ?? '').trim().toLowerCase()
const campaignId = (code: string, vintage: number) => `campaign-${canonical(code).replace(/[^a-z0-9]+/g, '-') || vintage}`
const nowIso = () => new Date().toISOString()

export class CampaignValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CampaignValidationError'
  }
}

export const normalizeCampaign = (campaign: Partial<Campaign> & { id: string; code: string }, fallbackYear: number, operator = 'System migration'): Campaign => {
  const vintage = Number.isFinite(campaign.vintage) ? Number(campaign.vintage) : Number((campaign as { year?: number }).year ?? fallbackYear)
  const startsAt = campaign.startsAt || `${vintage}-08-01`
  const expectedEndAt = campaign.expectedEndAt || (campaign as { endsAt?: string }).endsAt || `${vintage}-12-31`
  const createdAt = campaign.createdAt || `${startsAt}T00:00:00.000Z`
  return {
    id: campaign.id,
    code: campaign.code,
    name: campaign.name || `Vendimia ${vintage}`,
    vintage,
    status: campaign.status === 'archived' ? 'archived' : campaign.status === 'closed' ? 'closed' : campaign.status === 'planned' ? 'planned' : 'active',
    startsAt,
    expectedHarvestStart: campaign.expectedHarvestStart || `${vintage}-09-01`,
    expectedEndAt,
    closedAt: campaign.closedAt,
    isDefault: campaign.isDefault ?? campaign.status === 'active',
    notes: campaign.notes || '',
    createdAt,
    updatedAt: campaign.updatedAt || createdAt,
    createdBy: campaign.createdBy || operator,
    updatedBy: campaign.updatedBy || operator,
    reopenedAt: campaign.reopenedAt,
    reopenedBy: campaign.reopenedBy,
  }
}

export const normalizeCampaigns = (campaigns: Array<Partial<Campaign> & { id: string; code: string }>, fallbackYear: number): Campaign[] => {
  const normalized = campaigns.map((item) => normalizeCampaign(item, fallbackYear))
  if (!normalized.length) {
    return [normalizeCampaign({ id: `campaign-${fallbackYear}`, code: String(fallbackYear), status: 'active', isDefault: true }, fallbackYear)]
  }
  let activeSeen = false
  let defaultSeen = false
  return normalized.map((campaign) => {
    const active = campaign.status === 'active' && !activeSeen
    if (active) activeSeen = true
    const makeDefault = campaign.isDefault && !defaultSeen
    if (makeDefault) defaultSeen = true
    return {
      ...campaign,
      status: campaign.status === 'active' && !active ? 'planned' : campaign.status,
      isDefault: makeDefault,
    }
  }).map((campaign, index, all) => {
    if (all.some((item) => item.isDefault)) return campaign
    return index === 0 ? { ...campaign, isDefault: true } : campaign
  })
}

export const validateCampaignSet = (campaigns: Campaign[]): string[] => {
  const errors: string[] = []
  if (campaigns.filter((item) => item.status === 'active').length > 1) errors.push('Only one campaign can be active')
  if (campaigns.filter((item) => item.isDefault).length !== 1) errors.push('Exactly one campaign must be default')
  const codes = new Set<string>()
  campaigns.forEach((campaign) => {
    const key = canonical(campaign.code)
    if (!key) errors.push(`Campaign ${campaign.id} has no code`)
    if (codes.has(key)) errors.push(`Duplicate campaign code ${campaign.code}`)
    codes.add(key)
    if (!Number.isInteger(campaign.vintage) || campaign.vintage < 1900 || campaign.vintage > 2200) errors.push(`Campaign ${campaign.id} has invalid vintage`)
    if (campaign.status === 'archived' && !campaign.closedAt) errors.push(`Archived campaign ${campaign.id} has no closure date`)
  })
  return errors
}

export const createCampaign = (campaigns: Campaign[], input: NewCampaignInput, at = nowIso()): Campaign[] => {
  if (!canonical(input.code) || !canonical(input.name)) throw new CampaignValidationError('Campaign code and name are required')
  if (!Number.isInteger(input.vintage) || input.vintage < 1900 || input.vintage > 2200) throw new CampaignValidationError('Campaign vintage is invalid')
  if (campaigns.some((item) => canonical(item.code) === canonical(input.code))) throw new CampaignValidationError('Campaign code must be unique')
  const makeDefault = input.makeDefault ?? campaigns.length === 0
  const created: Campaign = {
    id: campaignId(input.code, input.vintage),
    code: input.code.trim(),
    name: input.name.trim(),
    vintage: input.vintage,
    status: 'planned',
    startsAt: input.startsAt,
    expectedHarvestStart: input.expectedHarvestStart,
    expectedEndAt: input.expectedEndAt,
    isDefault: makeDefault,
    notes: input.notes?.trim() || '',
    createdAt: at,
    updatedAt: at,
    createdBy: input.operator,
    updatedBy: input.operator,
  }
  return [...campaigns.map((item) => makeDefault ? { ...item, isDefault: false } : item), created]
}


export interface CampaignUpdateInput {
  code?: string
  name?: string
  vintage?: number
  startsAt?: string
  expectedHarvestStart?: string
  expectedEndAt?: string
  notes?: string
}

export const updateCampaign = (campaigns: Campaign[], id: string, input: CampaignUpdateInput, operator: string, at = nowIso()): Campaign[] => {
  const target = campaigns.find((item) => item.id === id)
  if (!target) throw new CampaignValidationError('Campaign not found')
  const nextCode = (input.code ?? target.code).trim()
  const nextName = (input.name ?? target.name).trim()
  const nextVintage = input.vintage ?? target.vintage
  if (!nextCode || !nextName) throw new CampaignValidationError('Campaign code and name are required')
  if (!Number.isInteger(nextVintage) || nextVintage < 1900 || nextVintage > 2200) throw new CampaignValidationError('Campaign vintage is invalid')
  if (campaigns.some((item) => item.id !== id && canonical(item.code) === canonical(nextCode))) throw new CampaignValidationError('Campaign code must be unique')
  if (target.status === 'archived') throw new CampaignValidationError('Archived campaigns cannot be edited')
  return campaigns.map((campaign) => campaign.id === id ? {
    ...campaign,
    code: nextCode,
    name: nextName,
    vintage: nextVintage,
    startsAt: input.startsAt ?? campaign.startsAt,
    expectedHarvestStart: input.expectedHarvestStart ?? campaign.expectedHarvestStart,
    expectedEndAt: input.expectedEndAt ?? campaign.expectedEndAt,
    notes: input.notes?.trim() ?? campaign.notes,
    updatedAt: at,
    updatedBy: operator,
  } : campaign)
}

export const setDefaultCampaign = (campaigns: Campaign[], id: string, operator: string, at = nowIso()): Campaign[] => {
  const target = campaigns.find((item) => item.id === id)
  if (!target) throw new CampaignValidationError('Campaign not found')
  if (target.status === 'archived') throw new CampaignValidationError('Archived campaigns cannot be default')
  return campaigns.map((campaign) => ({
    ...campaign,
    isDefault: campaign.id === id,
    updatedAt: campaign.id === id || campaign.isDefault ? at : campaign.updatedAt,
    updatedBy: campaign.id === id || campaign.isDefault ? operator : campaign.updatedBy,
  }))
}

export const activateCampaign = (campaigns: Campaign[], id: string, operator: string, at = nowIso()): Campaign[] => {
  const target = campaigns.find((item) => item.id === id)
  if (!target) throw new CampaignValidationError('Campaign not found')
  if (target.status === 'archived') throw new CampaignValidationError('Archived campaigns cannot be activated')
  return campaigns.map((campaign) => campaign.id === id
    ? { ...campaign, status: 'active', isDefault: true, updatedAt: at, updatedBy: operator }
    : { ...campaign, status: campaign.status === 'active' ? 'planned' : campaign.status, isDefault: false, updatedAt: campaign.status === 'active' || campaign.isDefault ? at : campaign.updatedAt, updatedBy: campaign.status === 'active' || campaign.isDefault ? operator : campaign.updatedBy })
}

export interface CampaignClosureBlockers {
  activeLotIds: string[]
  pendingDeliveryIds: string[]
  unfinishedBottlingOrderIds: string[]
}

export const campaignClosureBlockers = (state: WineryState, campaignId: string): CampaignClosureBlockers => ({
  activeLotIds: state.lots.filter((lot) => lot.campaignId === campaignId && lot.operationalStatus !== 'consumed').map((lot) => lot.id),
  pendingDeliveryIds: state.deliveries.filter((delivery) => delivery.campaignId === campaignId && delivery.status !== 'received').map((delivery) => delivery.id),
  unfinishedBottlingOrderIds: state.bottlingOrders.filter((order) => (order as { campaignId?: string }).campaignId === campaignId && !(order as { completion?: unknown }).completion).map((order) => order.id),
})

export const closeCampaign = (state: WineryState, id: string, operator: string, at = nowIso()): Campaign[] => {
  const target = state.campaigns.find((item) => item.id === id)
  if (!target) throw new CampaignValidationError('Campaign not found')
  const blockers = campaignClosureBlockers(state, id)
  if (blockers.activeLotIds.length || blockers.pendingDeliveryIds.length || blockers.unfinishedBottlingOrderIds.length) {
    throw new CampaignValidationError('Campaign has unresolved operational records')
  }
  return state.campaigns.map((campaign) => campaign.id === id
    ? { ...campaign, status: 'closed', closedAt: at, updatedAt: at, updatedBy: operator }
    : campaign)
}

export const reopenCampaign = (campaigns: Campaign[], id: string, operator: string, at = nowIso()): Campaign[] => {
  const target = campaigns.find((item) => item.id === id)
  if (!target || target.status !== 'closed') throw new CampaignValidationError('Only closed campaigns can be reopened')
  return campaigns.map((campaign) => campaign.id === id
    ? { ...campaign, status: 'planned', closedAt: undefined, reopenedAt: at, reopenedBy: operator, updatedAt: at, updatedBy: operator }
    : campaign)
}

export const archiveCampaign = (campaigns: Campaign[], id: string, operator: string, at = nowIso()): Campaign[] => {
  const target = campaigns.find((item) => item.id === id)
  if (!target || target.status !== 'closed') throw new CampaignValidationError('Only closed campaigns can be archived')
  return campaigns.map((campaign) => campaign.id === id
    ? { ...campaign, status: 'archived', updatedAt: at, updatedBy: operator }
    : campaign)
}
