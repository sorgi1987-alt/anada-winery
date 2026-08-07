import type { CampaignParcelPlan, Grower, NewParcelInput, VineyardEstate, VineyardParcel } from './types'

export type ParcelUpdateInput = Partial<Omit<NewParcelInput, 'operator' | 'campaignId'>> & { operator: string }
export class ParcelValidationError extends Error { constructor(message: string) { super(message); this.name = 'ParcelValidationError' } }
const text = (value: unknown) => String(value ?? '').trim()
const key = (value: unknown) => text(value).toLocaleLowerCase('es')
const stableId = (code: string) => `parcel-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export const normalizeParcels = (parcels: VineyardParcel[], vineyards: VineyardEstate[], growers: Grower[]): VineyardParcel[] => parcels.map((parcel) => {
  const grower = growers.find((g) => g.id === parcel.growerId) ?? growers.find((g) => key(g.name) === key(parcel.grower))
  const estate = vineyards.find((v) => v.id === parcel.estateId) ?? vineyards.find((v) => v.growerId === grower?.id && key(v.municipality) === key(parcel.municipality))
  return { ...parcel, code: text(parcel.code) || parcel.id, growerId: parcel.growerId ?? grower?.id, estateId: parcel.estateId ?? estate?.id, status: parcel.status === 'inactive' ? 'inactive' : 'active' }
})

export const deriveCampaignParcelPlans = (parcels: VineyardParcel[], fallbackCampaignId: string): CampaignParcelPlan[] => {
  const now = new Date().toISOString()
  return parcels.map((parcel) => ({
    id: `campaign-parcel-${parcel.campaignId ?? fallbackCampaignId}-${parcel.id}`,
    campaignId: parcel.campaignId ?? fallbackCampaignId,
    parcelId: parcel.id,
    expectedKg: parcel.estimatedKg,
    harvestWindow: parcel.harvestWindow,
    status: parcel.readiness,
    notes: '', createdAt: now, updatedAt: now, createdBy: 'System migration', updatedBy: 'System migration',
  }))
}

const validate = (parcels: VineyardParcel[], growers: Grower[], vineyards: VineyardEstate[], input: { code: string; name: string; growerId: string; estateId: string; hectares: number }, excludeId?: string) => {
  if (!text(input.code)) throw new ParcelValidationError('Parcel code is required.')
  if (!text(input.name)) throw new ParcelValidationError('Parcel name is required.')
  if (!(input.hectares > 0)) throw new ParcelValidationError('Surface must be greater than zero.')
  const grower = growers.find((g) => g.id === input.growerId && g.status === 'active'); if (!grower) throw new ParcelValidationError('An active grower is required.')
  const estate = vineyards.find((v) => v.id === input.estateId && v.status === 'active'); if (!estate) throw new ParcelValidationError('An active vineyard is required.')
  if (estate.growerId !== grower.id) throw new ParcelValidationError('The selected vineyard belongs to a different grower.')
  if (parcels.some((p) => p.id !== excludeId && key(p.code ?? p.id) === key(input.code))) throw new ParcelValidationError('Parcel code already exists.')
}

export const createParcel = (parcels: VineyardParcel[], growers: Grower[], vineyards: VineyardEstate[], input: NewParcelInput) => {
  validate(parcels, growers, vineyards, input)
  const grower = growers.find((g) => g.id === input.growerId)!
  const estate = vineyards.find((v) => v.id === input.estateId)!
  const now = new Date().toISOString()
  const parcel: VineyardParcel = {
    id: stableId(`${input.code}-${Date.now()}`), code: text(input.code), name: text(input.name), grower: grower.name, growerId: grower.id, estateId: estate.id,
    municipality: estate.municipality, zone: estate.province ?? '', varieties: text(input.varieties), hectares: input.hectares,
    estimatedKg: 0, harvestWindow: 'Pendiente', readiness: 'sampling', sample: { sampledAt: now.slice(0, 10), potentialAlcohol: 0, ph: 0, totalAcidity: 0, health: 0 }, image: '',
    status: 'active', clone: text(input.clone) || undefined, rootstock: text(input.rootstock) || undefined, plantingYear: input.plantingYear, trainingSystem: text(input.trainingSystem) || undefined,
    irrigation: input.irrigation ?? false, altitudeM: input.altitudeM, orientation: text(input.orientation) || undefined, organic: input.organic ?? false, latitude: input.latitude, longitude: input.longitude, notes: text(input.notes),
    createdAt: now, updatedAt: now, createdBy: input.operator, updatedBy: input.operator,
  }
  const plan: CampaignParcelPlan | undefined = input.campaignId ? { id: `campaign-parcel-${input.campaignId}-${parcel.id}`, campaignId: input.campaignId, parcelId: parcel.id, status: 'planned', notes: '', createdAt: now, updatedAt: now, createdBy: input.operator, updatedBy: input.operator } : undefined
  return { parcels: [...parcels, parcel], parcel, plan }
}

export const updateParcel = (parcels: VineyardParcel[], growers: Grower[], vineyards: VineyardEstate[], id: string, input: ParcelUpdateInput): VineyardParcel[] => {
  const current = parcels.find((p) => p.id === id); if (!current) throw new ParcelValidationError('Parcel not found.')
  const next = { code: text(input.code ?? current.code ?? current.id), name: text(input.name ?? current.name), growerId: input.growerId ?? current.growerId ?? '', estateId: input.estateId ?? current.estateId ?? '', hectares: input.hectares ?? current.hectares }
  validate(parcels, growers, vineyards, next, id)
  const grower = growers.find((g) => g.id === next.growerId)!, estate = vineyards.find((v) => v.id === next.estateId)!
  return parcels.map((p) => p.id === id ? { ...p, ...next, grower: grower.name, municipality: estate.municipality, zone: estate.province ?? p.zone, varieties: text(input.varieties ?? p.varieties), clone: text(input.clone ?? p.clone) || undefined, rootstock: text(input.rootstock ?? p.rootstock) || undefined, plantingYear: input.plantingYear ?? p.plantingYear, trainingSystem: text(input.trainingSystem ?? p.trainingSystem) || undefined, irrigation: input.irrigation ?? p.irrigation, altitudeM: input.altitudeM ?? p.altitudeM, orientation: text(input.orientation ?? p.orientation) || undefined, organic: input.organic ?? p.organic, latitude: input.latitude ?? p.latitude, longitude: input.longitude ?? p.longitude, notes: text(input.notes ?? p.notes), updatedAt: new Date().toISOString(), updatedBy: input.operator } : p)
}

export const setParcelStatus = (parcels: VineyardParcel[], id: string, status: 'active' | 'inactive', operator: string): VineyardParcel[] => parcels.map((p) => p.id === id ? { ...p, status, updatedAt: new Date().toISOString(), updatedBy: operator } : p)

export const setParcelCampaignMembership = (plans: CampaignParcelPlan[], campaignId: string, parcelId: string, included: boolean, operator: string): CampaignParcelPlan[] => {
  const existing = plans.find((plan) => plan.campaignId === campaignId && plan.parcelId === parcelId)
  const now = new Date().toISOString()
  if (existing) return plans.map((plan) => plan.id === existing.id ? { ...plan, status: included ? (plan.status === 'cancelled' ? 'planned' : plan.status) : 'cancelled', updatedAt: now, updatedBy: operator } : plan)
  if (!included) return plans
  return [...plans, { id: `campaign-parcel-${campaignId}-${parcelId}`, campaignId, parcelId, status: 'planned', notes: '', createdAt: now, updatedAt: now, createdBy: operator, updatedBy: operator }]
}
