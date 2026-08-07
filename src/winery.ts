import type { Membership, MembershipRole, NewMembershipInput, NewUserInput, NewWineryInput, User, Winery, WinerySettings } from './types'

export class WineryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WineryValidationError'
  }
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserValidationError'
  }
}

export class MembershipValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MembershipValidationError'
  }
}

const normalizeText = (value: unknown) => String(value ?? '').trim()
const normalizeKey = (value: unknown) => normalizeText(value).toLocaleLowerCase('es')
const normalizeEmail = (value: unknown) => normalizeText(value).toLowerCase()

const stableWineryId = (code: string) => `winery-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
const stableUserId = (name: string) => `user-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export type WineryUpdateInput = Partial<Omit<NewWineryInput, 'operator'>> & { operator: string }
export type UserUpdateInput = Partial<Omit<NewUserInput, 'operator'>> & { operator: string }

export const DEFAULT_WINERY_ID = 'winery-default'
export const DEFAULT_USER_ID = 'user-elena-martin'

export const deriveDefaultWineryMembership = (settings: WinerySettings, operatorName = 'Elena Martín'): { winery: Winery; user: User; membership: Membership } => {
  const at = `${settings.campaignStart}T00:00:00.000Z`
  const winery: Winery = {
    id: DEFAULT_WINERY_ID,
    code: settings.wineryCode,
    name: settings.wineryName,
    legalName: settings.legalName,
    municipality: settings.municipality,
    province: settings.province,
    designation: settings.designation,
    timezone: settings.timezone,
    status: 'active',
    notes: '',
    createdAt: at,
    updatedAt: at,
    createdBy: 'System migration',
    updatedBy: 'System migration',
  }
  const user: User = {
    id: DEFAULT_USER_ID,
    name: operatorName,
    status: 'active',
    createdAt: at,
    updatedAt: at,
    createdBy: 'System migration',
    updatedBy: 'System migration',
  }
  const membership: Membership = {
    id: `membership-${winery.id}-${user.id}`,
    wineryId: winery.id,
    userId: user.id,
    role: 'winemaker',
    status: 'active',
    createdAt: at,
    updatedAt: at,
    createdBy: 'System migration',
    updatedBy: 'System migration',
  }
  return { winery, user, membership }
}

export const withWineryId = <T extends { wineryId?: string }>(items: T[], wineryId: string): T[] =>
  items.map((item) => item.wineryId ? item : { ...item, wineryId })

export const normalizeWineries = (values: Array<Partial<Winery> & { id?: string; code?: string; name?: string }>): Winery[] => {
  const now = new Date().toISOString()
  return values.map((value, index) => ({
    id: normalizeText(value.id) || stableWineryId(normalizeText(value.code) || `WIN-${index + 1}`),
    code: normalizeText(value.code) || `WIN-${String(index + 1).padStart(3, '0')}`,
    name: normalizeText(value.name) || `Bodega ${index + 1}`,
    legalName: normalizeText(value.legalName) || normalizeText(value.name) || `Bodega ${index + 1}`,
    municipality: normalizeText(value.municipality),
    province: normalizeText(value.province),
    designation: normalizeText(value.designation),
    timezone: normalizeText(value.timezone) || 'Europe/Madrid',
    status: value.status === 'inactive' ? 'inactive' : 'active',
    notes: normalizeText(value.notes),
    createdAt: normalizeText(value.createdAt) || now,
    updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || now,
    createdBy: normalizeText(value.createdBy) || 'System migration',
    updatedBy: normalizeText(value.updatedBy) || normalizeText(value.createdBy) || 'System migration',
  }))
}

const validateWineryIdentity = (wineries: Winery[], input: { code: string; name: string }, excludeId?: string) => {
  const code = normalizeKey(input.code)
  if (!code) throw new WineryValidationError('Winery code is required.')
  if (!normalizeText(input.name)) throw new WineryValidationError('Winery name is required.')
  if (wineries.some((winery) => winery.id !== excludeId && normalizeKey(winery.code) === code)) throw new WineryValidationError('Winery code already exists.')
}

export const createWinery = (wineries: Winery[], input: NewWineryInput): Winery[] => {
  validateWineryIdentity(wineries, { code: input.code, name: input.name })
  const now = new Date().toISOString()
  const winery: Winery = {
    id: stableWineryId(`${input.code}-${Date.now()}`),
    code: normalizeText(input.code),
    name: normalizeText(input.name),
    legalName: normalizeText(input.legalName) || normalizeText(input.name),
    municipality: normalizeText(input.municipality),
    province: normalizeText(input.province),
    designation: normalizeText(input.designation),
    timezone: normalizeText(input.timezone) || 'Europe/Madrid',
    status: 'active',
    notes: normalizeText(input.notes),
    createdAt: now,
    updatedAt: now,
    createdBy: input.operator,
    updatedBy: input.operator,
  }
  return [...wineries, winery]
}

export const updateWinery = (wineries: Winery[], id: string, input: WineryUpdateInput): Winery[] => {
  const current = wineries.find((winery) => winery.id === id)
  if (!current) throw new WineryValidationError('Winery not found.')
  const code = normalizeText(input.code ?? current.code)
  const name = normalizeText(input.name ?? current.name)
  validateWineryIdentity(wineries, { code, name }, id)
  return wineries.map((winery) => winery.id === id ? {
    ...winery,
    code,
    name,
    legalName: normalizeText(input.legalName ?? winery.legalName) || name,
    municipality: normalizeText(input.municipality ?? winery.municipality),
    province: normalizeText(input.province ?? winery.province),
    designation: normalizeText(input.designation ?? winery.designation),
    timezone: normalizeText(input.timezone ?? winery.timezone) || 'Europe/Madrid',
    notes: normalizeText(input.notes ?? winery.notes),
    updatedAt: new Date().toISOString(),
    updatedBy: input.operator,
  } : winery)
}

export const setWineryStatus = (wineries: Winery[], id: string, status: 'active' | 'inactive', operator: string): Winery[] => {
  if (!wineries.some((winery) => winery.id === id)) throw new WineryValidationError('Winery not found.')
  return wineries.map((winery) => winery.id === id ? { ...winery, status, updatedAt: new Date().toISOString(), updatedBy: operator } : winery)
}

export const validateWineryMaster = (wineries: Winery[]): string[] => {
  const errors: string[] = []
  const codes = new Set<string>()
  wineries.forEach((winery) => {
    const code = normalizeKey(winery.code)
    if (!code) errors.push(`Winery ${winery.id} has no code.`)
    else if (codes.has(code)) errors.push(`Duplicate winery code: ${winery.code}.`)
    else codes.add(code)
  })
  return errors
}

export const normalizeUsers = (values: Array<Partial<User> & { id?: string; name?: string }>): User[] => {
  const now = new Date().toISOString()
  return values.map((value, index) => ({
    id: normalizeText(value.id) || stableUserId(normalizeText(value.name) || `User ${index + 1}`),
    name: normalizeText(value.name) || `User ${index + 1}`,
    email: normalizeEmail(value.email) || undefined,
    status: value.status === 'inactive' ? 'inactive' : 'active',
    createdAt: normalizeText(value.createdAt) || now,
    updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || now,
    createdBy: normalizeText(value.createdBy) || 'System migration',
    updatedBy: normalizeText(value.updatedBy) || normalizeText(value.createdBy) || 'System migration',
  }))
}

const validateUserIdentity = (users: User[], input: { name: string; email?: string }, excludeId?: string) => {
  if (!normalizeText(input.name)) throw new UserValidationError('User name is required.')
  const email = normalizeEmail(input.email)
  if (email && users.some((user) => user.id !== excludeId && normalizeEmail(user.email) === email)) throw new UserValidationError('Email already exists.')
}

export const createUser = (users: User[], input: NewUserInput): User[] => {
  validateUserIdentity(users, { name: input.name, email: input.email })
  const now = new Date().toISOString()
  const user: User = {
    id: stableUserId(`${input.name}-${Date.now()}`),
    name: normalizeText(input.name),
    email: normalizeEmail(input.email) || undefined,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    createdBy: input.operator,
    updatedBy: input.operator,
  }
  return [...users, user]
}

export const updateUser = (users: User[], id: string, input: UserUpdateInput): User[] => {
  const current = users.find((user) => user.id === id)
  if (!current) throw new UserValidationError('User not found.')
  const name = normalizeText(input.name ?? current.name)
  validateUserIdentity(users, { name, email: input.email ?? current.email }, id)
  return users.map((user) => user.id === id ? {
    ...user,
    name,
    email: normalizeEmail(input.email ?? user.email) || undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: input.operator,
  } : user)
}

export const setUserStatus = (users: User[], id: string, status: 'active' | 'inactive', operator: string): User[] => {
  if (!users.some((user) => user.id === id)) throw new UserValidationError('User not found.')
  return users.map((user) => user.id === id ? { ...user, status, updatedAt: new Date().toISOString(), updatedBy: operator } : user)
}

export const normalizeMemberships = (values: Array<Partial<Membership> & { id?: string; wineryId?: string; userId?: string }>): Membership[] => {
  const now = new Date().toISOString()
  return values.filter((value) => value.wineryId && value.userId).map((value) => ({
    id: normalizeText(value.id) || `membership-${value.wineryId}-${value.userId}`,
    wineryId: normalizeText(value.wineryId),
    userId: normalizeText(value.userId),
    role: (['owner', 'winemaker', 'cellar', 'laboratory', 'viewer'] as const).includes(value.role as MembershipRole) ? value.role as MembershipRole : 'viewer',
    status: value.status === 'inactive' ? 'inactive' : 'active',
    createdAt: normalizeText(value.createdAt) || now,
    updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || now,
    createdBy: normalizeText(value.createdBy) || 'System migration',
    updatedBy: normalizeText(value.updatedBy) || normalizeText(value.createdBy) || 'System migration',
  }))
}

export const createMembership = (memberships: Membership[], wineries: Winery[], users: User[], input: NewMembershipInput): Membership[] => {
  if (!wineries.some((winery) => winery.id === input.wineryId)) throw new MembershipValidationError('Winery not found.')
  if (!users.some((user) => user.id === input.userId)) throw new MembershipValidationError('User not found.')
  if (memberships.some((membership) => membership.wineryId === input.wineryId && membership.userId === input.userId && membership.status === 'active')) {
    throw new MembershipValidationError('An active membership already exists for this user and winery.')
  }
  const now = new Date().toISOString()
  const membership: Membership = {
    id: `membership-${input.wineryId}-${input.userId}-${Date.now()}`,
    wineryId: input.wineryId,
    userId: input.userId,
    role: input.role,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    createdBy: input.operator,
    updatedBy: input.operator,
  }
  return [...memberships, membership]
}

export const setMembershipRole = (memberships: Membership[], id: string, role: MembershipRole, operator: string): Membership[] => {
  if (!memberships.some((membership) => membership.id === id)) throw new MembershipValidationError('Membership not found.')
  return memberships.map((membership) => membership.id === id ? { ...membership, role, updatedAt: new Date().toISOString(), updatedBy: operator } : membership)
}

export const setMembershipStatus = (memberships: Membership[], id: string, status: 'active' | 'inactive', operator: string): Membership[] => {
  if (!memberships.some((membership) => membership.id === id)) throw new MembershipValidationError('Membership not found.')
  return memberships.map((membership) => membership.id === id ? { ...membership, status, updatedAt: new Date().toISOString(), updatedBy: operator } : membership)
}

export const validateMemberships = (memberships: Membership[], wineries: Winery[], users: User[]): string[] => {
  const errors: string[] = []
  const wineryIds = new Set(wineries.map((winery) => winery.id))
  const userIds = new Set(users.map((user) => user.id))
  const activePairs = new Set<string>()
  memberships.forEach((membership) => {
    if (!wineryIds.has(membership.wineryId)) errors.push(`Membership ${membership.id} has no valid winery.`)
    if (!userIds.has(membership.userId)) errors.push(`Membership ${membership.id} has no valid user.`)
    if (membership.status === 'active') {
      const key = `${membership.wineryId}|${membership.userId}`
      if (activePairs.has(key)) errors.push(`Duplicate active membership for user ${membership.userId} in winery ${membership.wineryId}.`)
      activePairs.add(key)
    }
  })
  return errors
}
