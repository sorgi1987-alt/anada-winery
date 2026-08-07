import type { Grower, NewVineyardInput, VineyardEstate } from './types'

export type VineyardUpdateInput = Partial<Omit<NewVineyardInput, 'operator'>> & { operator: string }
export class VineyardValidationError extends Error { constructor(message: string) { super(message); this.name = 'VineyardValidationError' } }
const text = (value: unknown) => String(value ?? '').trim()
const key = (value: unknown) => text(value).toLocaleLowerCase('es')
const stableId = (code: string) => `vineyard-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export const normalizeVineyards = (values: Array<Partial<VineyardEstate> & { id?: string; code?: string; name?: string; growerId?: string }>): VineyardEstate[] => {
  const now = new Date().toISOString()
  return values.map((value, index) => ({
    id: text(value.id) || stableId(text(value.code) || `VIN-${index + 1}`),
    code: text(value.code) || `VIN-${String(index + 1).padStart(3, '0')}`,
    name: text(value.name) || `Viñedo ${index + 1}`,
    growerId: text(value.growerId),
    municipality: text(value.municipality),
    province: text(value.province) || undefined,
    country: text(value.country) || 'España',
    locationId: text(value.locationId) || undefined,
    status: value.status === 'inactive' ? 'inactive' : 'active',
    notes: text(value.notes),
    createdAt: text(value.createdAt) || now,
    updatedAt: text(value.updatedAt) || text(value.createdAt) || now,
    createdBy: text(value.createdBy) || 'System migration',
    updatedBy: text(value.updatedBy) || text(value.createdBy) || 'System migration',
  }))
}

const validate = (vineyards: VineyardEstate[], growers: Grower[], input: { code: string; name: string; growerId: string }, excludeId?: string) => {
  if (!text(input.code)) throw new VineyardValidationError('Vineyard code is required.')
  if (!text(input.name)) throw new VineyardValidationError('Vineyard name is required.')
  if (!growers.some((g) => g.id === input.growerId && g.status === 'active')) throw new VineyardValidationError('An active grower is required.')
  if (vineyards.some((v) => v.id !== excludeId && key(v.code) === key(input.code))) throw new VineyardValidationError('Vineyard code already exists.')
}

export const createVineyard = (vineyards: VineyardEstate[], growers: Grower[], input: NewVineyardInput): VineyardEstate[] => {
  validate(vineyards, growers, input)
  const now = new Date().toISOString()
  const item: VineyardEstate = { id: stableId(`${input.code}-${Date.now()}`), code: text(input.code), name: text(input.name), growerId: input.growerId, municipality: text(input.municipality), province: text(input.province) || undefined, country: text(input.country) || 'España', status: 'active', notes: text(input.notes), createdAt: now, updatedAt: now, createdBy: input.operator, updatedBy: input.operator }
  return [...vineyards, item]
}

export const updateVineyard = (vineyards: VineyardEstate[], growers: Grower[], id: string, input: VineyardUpdateInput): VineyardEstate[] => {
  const current = vineyards.find((v) => v.id === id); if (!current) throw new VineyardValidationError('Vineyard not found.')
  const next = { code: text(input.code ?? current.code), name: text(input.name ?? current.name), growerId: input.growerId ?? current.growerId }
  validate(vineyards, growers, next, id)
  return vineyards.map((v) => v.id === id ? { ...v, ...next, municipality: text(input.municipality ?? v.municipality), province: text(input.province ?? v.province) || undefined, country: text(input.country ?? v.country) || 'España', notes: text(input.notes ?? v.notes), updatedAt: new Date().toISOString(), updatedBy: input.operator } : v)
}

export const setVineyardStatus = (vineyards: VineyardEstate[], id: string, status: 'active' | 'inactive', operator: string, parcelCount = 0): VineyardEstate[] => {
  if (!vineyards.some((v) => v.id === id)) throw new VineyardValidationError('Vineyard not found.')
  if (status === 'inactive' && parcelCount > 0) throw new VineyardValidationError('Deactivate or reassign active parcels first.')
  return vineyards.map((v) => v.id === id ? { ...v, status, updatedAt: new Date().toISOString(), updatedBy: operator } : v)
}

export const deriveVineyardsFromParcels = (parcels: Array<{ growerId?: string; grower: string; municipality: string; locationId?: string }>, growers: Grower[]): VineyardEstate[] => {
  const now = new Date().toISOString()
  const seen = new Map<string, VineyardEstate>()
  parcels.forEach((parcel, index) => {
    const grower = growers.find((g) => g.id === parcel.growerId) ?? growers.find((g) => key(g.name) === key(parcel.grower))
    if (!grower) return
    const groupKey = `${grower.id}|${key(parcel.municipality)}`
    if (seen.has(groupKey)) return
    const count = seen.size + 1
    seen.set(groupKey, {
      id: `vineyard-${grower.id}-${key(parcel.municipality).replace(/[^a-z0-9]+/g, '-') || index + 1}`,
      code: `VIN-${String(count).padStart(3, '0')}`,
      name: `${grower.name} · ${parcel.municipality}`,
      growerId: grower.id,
      municipality: parcel.municipality,
      country: 'España',
      locationId: parcel.locationId,
      status: 'active', notes: '', createdAt: now, updatedAt: now, createdBy: 'System migration', updatedBy: 'System migration',
    })
  })
  return [...seen.values()]
}
