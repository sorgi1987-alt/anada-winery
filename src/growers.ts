import type { Grower, NewGrowerInput } from './types'

export type GrowerUpdateInput = Partial<Omit<NewGrowerInput, 'operator'>> & { operator: string }

export class GrowerValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GrowerValidationError'
  }
}

const normalizeText = (value: unknown) => String(value ?? '').trim()
const normalizeKey = (value: unknown) => normalizeText(value).toLocaleLowerCase('es')
const normalizeTaxId = (value: unknown) => normalizeText(value).replace(/[\s-]+/g, '').toUpperCase()

const nextGrowerCode = (growers: Grower[]) => {
  const used = new Set(growers.map((grower) => grower.code.toUpperCase()))
  for (let index = 1; index < 10000; index += 1) {
    const candidate = `VIT-${String(index).padStart(3, '0')}`
    if (!used.has(candidate)) return candidate
  }
  return `VIT-${Date.now()}`
}

const stableGrowerId = (code: string) => `grower-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export const normalizeGrowers = (values: Array<Partial<Grower> & { id?: string; code?: string; name?: string }>): Grower[] => {
  const now = new Date().toISOString()
  const normalized: Grower[] = []
  values.forEach((value, index) => {
    const name = normalizeText(value.name || value.legalName || value.tradeName || `Viticultor ${index + 1}`)
    const code = normalizeText(value.code) || `VIT-${String(index + 1).padStart(3, '0')}`
    const status = value.status === 'blocked' ? 'blocked' : value.status === 'inactive' ? 'inactive' : 'active'
    normalized.push({
      id: normalizeText(value.id) || stableGrowerId(code),
      code,
      name,
      legalName: normalizeText(value.legalName) || name,
      tradeName: normalizeText(value.tradeName) || undefined,
      growerType: value.growerType === 'company' || value.growerType === 'cooperative' || value.growerType === 'individual' ? value.growerType : 'unknown',
      taxId: normalizeText(value.taxId) || undefined,
      contactName: normalizeText(value.contactName) || undefined,
      email: normalizeText(value.email) || undefined,
      phone: normalizeText(value.phone) || undefined,
      address: normalizeText(value.address) || undefined,
      municipality: normalizeText(value.municipality) || undefined,
      province: normalizeText(value.province) || undefined,
      country: normalizeText(value.country) || 'España',
      status,
      notes: normalizeText(value.notes),
      createdAt: normalizeText(value.createdAt) || now,
      updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || now,
      createdBy: normalizeText(value.createdBy) || 'System migration',
      updatedBy: normalizeText(value.updatedBy) || normalizeText(value.createdBy) || 'System migration',
    })
  })
  return normalized
}

const validateGrowerIdentity = (growers: Grower[], input: { code: string; legalName: string; taxId?: string }, excludeId?: string) => {
  const code = normalizeKey(input.code)
  const legalName = normalizeKey(input.legalName)
  const taxId = normalizeTaxId(input.taxId)
  if (!code) throw new GrowerValidationError('Grower code is required.')
  if (!legalName) throw new GrowerValidationError('Legal name is required.')
  if (growers.some((grower) => grower.id !== excludeId && normalizeKey(grower.code) === code)) throw new GrowerValidationError('Grower code already exists.')
  if (taxId && growers.some((grower) => grower.id !== excludeId && normalizeTaxId(grower.taxId) === taxId)) throw new GrowerValidationError('Tax ID already exists.')
}

export const createGrower = (growers: Grower[], input: NewGrowerInput): Grower[] => {
  const code = normalizeText(input.code) || nextGrowerCode(growers)
  validateGrowerIdentity(growers, { code, legalName: input.legalName, taxId: input.taxId })
  const now = new Date().toISOString()
  const grower: Grower = {
    id: stableGrowerId(`${code}-${Date.now()}`),
    code,
    name: normalizeText(input.tradeName) || normalizeText(input.legalName),
    legalName: normalizeText(input.legalName),
    tradeName: normalizeText(input.tradeName) || undefined,
    growerType: input.growerType,
    taxId: normalizeText(input.taxId) || undefined,
    contactName: normalizeText(input.contactName) || undefined,
    email: normalizeText(input.email) || undefined,
    phone: normalizeText(input.phone) || undefined,
    address: normalizeText(input.address) || undefined,
    municipality: normalizeText(input.municipality) || undefined,
    province: normalizeText(input.province) || undefined,
    country: normalizeText(input.country) || 'España',
    status: 'active',
    notes: normalizeText(input.notes),
    createdAt: now,
    updatedAt: now,
    createdBy: input.operator,
    updatedBy: input.operator,
  }
  return [...growers, grower]
}

export const updateGrower = (growers: Grower[], id: string, input: GrowerUpdateInput): Grower[] => {
  const current = growers.find((grower) => grower.id === id)
  if (!current) throw new GrowerValidationError('Grower not found.')
  const legalName = normalizeText(input.legalName ?? current.legalName)
  const code = normalizeText(input.code ?? current.code)
  const taxId = normalizeText(input.taxId ?? current.taxId)
  validateGrowerIdentity(growers, { code, legalName, taxId }, id)
  return growers.map((grower) => grower.id === id ? {
    ...grower,
    code,
    legalName,
    name: normalizeText(input.tradeName ?? grower.tradeName) || legalName,
    tradeName: normalizeText(input.tradeName ?? grower.tradeName) || undefined,
    growerType: input.growerType ?? grower.growerType,
    taxId: taxId || undefined,
    contactName: normalizeText(input.contactName ?? grower.contactName) || undefined,
    email: normalizeText(input.email ?? grower.email) || undefined,
    phone: normalizeText(input.phone ?? grower.phone) || undefined,
    address: normalizeText(input.address ?? grower.address) || undefined,
    municipality: normalizeText(input.municipality ?? grower.municipality) || undefined,
    province: normalizeText(input.province ?? grower.province) || undefined,
    country: normalizeText(input.country ?? grower.country) || 'España',
    notes: normalizeText(input.notes ?? grower.notes),
    updatedAt: new Date().toISOString(),
    updatedBy: input.operator,
  } : grower)
}

export const setGrowerStatus = (growers: Grower[], id: string, status: 'active' | 'inactive', operator: string): Grower[] => {
  if (!growers.some((grower) => grower.id === id)) throw new GrowerValidationError('Grower not found.')
  return growers.map((grower) => grower.id === id ? { ...grower, status, updatedAt: new Date().toISOString(), updatedBy: operator } : grower)
}

export const validateGrowerMaster = (growers: Grower[]) => {
  const errors: string[] = []
  const codes = new Set<string>()
  const taxIds = new Set<string>()
  growers.forEach((grower) => {
    const code = normalizeKey(grower.code)
    const taxId = normalizeTaxId(grower.taxId)
    if (!code) errors.push(`Grower ${grower.id} has no code.`)
    else if (codes.has(code)) errors.push(`Duplicate grower code: ${grower.code}.`)
    else codes.add(code)
    if (!normalizeText(grower.legalName)) errors.push(`Grower ${grower.code} has no legal name.`)
    if (taxId) {
      if (taxIds.has(taxId)) errors.push(`Duplicate grower tax ID: ${grower.taxId}.`)
      else taxIds.add(taxId)
    }
  })
  return errors
}
