import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMembership, createUser, createWinery, deriveDefaultWineryMembership, DEFAULT_USER_ID, DEFAULT_WINERY_ID,
  MembershipValidationError, normalizeMemberships, normalizeUsers, normalizeWineries, setMembershipStatus, setUserStatus,
  setWineryStatus, updateUser, updateWinery, UserValidationError, validateMemberships, withWineryId, WineryValidationError,
} from '../src/winery'
import { migrateLegacyState, seedState } from '../src/store'
import { lots, tanks, winerySettings } from '../src/data'

test('createWinery and updateWinery enforce unique codes', () => {
  const wineries = createWinery([], { code: 'BV-01', name: 'Bodega Uno', legalName: 'Bodega Uno SL', municipality: 'Alberite', province: 'La Rioja', timezone: 'Europe/Madrid', operator: 'Sergio' })
  assert.equal(wineries.length, 1)
  assert.throws(() => createWinery(wineries, { code: 'BV-01', name: 'Otra', legalName: 'Otra', municipality: 'Nalda', province: 'La Rioja', timezone: 'Europe/Madrid', operator: 'Sergio' }), WineryValidationError)
  const updated = updateWinery(wineries, wineries[0].id, { name: 'Bodega Uno Renovada', operator: 'Sergio' })
  assert.equal(updated[0].name, 'Bodega Uno Renovada')
  const deactivated = setWineryStatus(updated, wineries[0].id, 'inactive', 'Sergio')
  assert.equal(deactivated[0].status, 'inactive')
})

test('createUser rejects duplicate emails and setUserStatus toggles lifecycle', () => {
  const users = createUser([], { name: 'Elena Martín', email: 'elena@bodega.es', operator: 'Sergio' })
  assert.throws(() => createUser(users, { name: 'Otro', email: 'ELENA@bodega.es', operator: 'Sergio' }), UserValidationError)
  const updated = updateUser(users, users[0].id, { email: 'elena.martin@bodega.es', operator: 'Sergio' })
  assert.equal(updated[0].email, 'elena.martin@bodega.es')
  const inactive = setUserStatus(updated, users[0].id, 'inactive', 'Sergio')
  assert.equal(inactive[0].status, 'inactive')
})

test('createMembership requires a real winery and user, and rejects duplicate active membership', () => {
  const wineries = createWinery([], { code: 'BV-01', name: 'Bodega Uno', legalName: 'Bodega Uno SL', municipality: 'Alberite', province: 'La Rioja', timezone: 'Europe/Madrid', operator: 'Sergio' })
  const users = createUser([], { name: 'Elena Martín', operator: 'Sergio' })
  assert.throws(() => createMembership([], wineries, users, { wineryId: 'winery-missing', userId: users[0].id, role: 'winemaker', operator: 'Sergio' }), MembershipValidationError)
  const memberships = createMembership([], wineries, users, { wineryId: wineries[0].id, userId: users[0].id, role: 'winemaker', operator: 'Sergio' })
  assert.equal(memberships.length, 1)
  assert.throws(() => createMembership(memberships, wineries, users, { wineryId: wineries[0].id, userId: users[0].id, role: 'viewer', operator: 'Sergio' }), MembershipValidationError)
  assert.deepEqual(validateMemberships(memberships, wineries, users), [])

  const deactivated = setMembershipStatus(memberships, memberships[0].id, 'inactive', 'Sergio')
  const rejoined = createMembership(deactivated, wineries, users, { wineryId: wineries[0].id, userId: users[0].id, role: 'viewer', operator: 'Sergio' })
  assert.equal(rejoined.filter((m) => m.status === 'active').length, 1)
})

test('deriveDefaultWineryMembership produces a stable winery, user and membership for the hardcoded operator', () => {
  const first = deriveDefaultWineryMembership(winerySettings)
  const second = deriveDefaultWineryMembership(winerySettings)
  assert.equal(first.winery.id, DEFAULT_WINERY_ID)
  assert.equal(first.user.id, DEFAULT_USER_ID)
  assert.equal(first.user.name, 'Elena Martín')
  assert.equal(first.membership.wineryId, first.winery.id)
  assert.equal(first.membership.userId, first.user.id)
  assert.equal(first.membership.role, 'winemaker')
  assert.deepEqual(first, second, 'derivation must be deterministic for the same settings')
})

test('withWineryId stamps only records missing a wineryId', () => {
  const scoped = withWineryId([{ id: 'a' }, { id: 'b', wineryId: 'winery-other' }], 'winery-default')
  assert.equal(scoped[0].wineryId, 'winery-default')
  assert.equal(scoped[1].wineryId, 'winery-other')
})

test('v26 migration introduces wineries, users and memberships and scopes every collection', () => {
  const legacy = {
    schemaVersion: 26,
    lots: structuredClone(lots), tasks: [], tanks: structuredClone(tanks),
    productionEvents: [], movements: [], parcels: [], deliveries: [], samples: [], barrels: [], barrelOperations: [], blendCandidates: [], blendTrials: [], packagingMaterials: [], bottlingOrders: [], traceabilityEntities: [], traceabilityLinks: [], recallSimulations: [], suppliers: [], productMasters: [], productLots: [], productStockTransactions: [], weatherSnapshots: [],
    settings: structuredClone(winerySettings),
  }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 27)
  assert.equal(migrated.wineries.length, 1)
  assert.equal(migrated.users.length, 1)
  assert.equal(migrated.memberships.length, 1)
  assert.equal(migrated.memberships[0].wineryId, migrated.wineries[0].id)
  assert.equal(migrated.memberships[0].userId, migrated.users[0].id)

  const wineryId = migrated.wineries[0].id
  assert.equal(migrated.lots.length, legacy.lots.length)
  assert.ok(migrated.lots.every((lot) => lot.wineryId === wineryId), 'every lot must carry the default winery id')
  assert.ok(migrated.campaigns.every((campaign) => campaign.wineryId === wineryId))
  assert.ok(migrated.growers.every((grower) => grower.wineryId === wineryId))
  assert.ok(migrated.vessels.every((vessel) => vessel.wineryId === wineryId))
  assert.ok(migrated.suppliers.every((supplier) => supplier.wineryId === wineryId))
})

test('normalizeWineries, normalizeUsers and normalizeMemberships preserve well-formed custom records unchanged', () => {
  const winery = { id: 'winery-custom', code: 'CUS', name: 'Custom Winery', legalName: 'Custom Winery SL', municipality: 'Nalda', province: 'La Rioja', country: 'España', designation: '', timezone: 'Europe/Madrid', status: 'active' as const, notes: '', createdAt: '2026-01-01', updatedAt: '2026-01-01', createdBy: 'test', updatedBy: 'test' }
  const user = { id: 'user-custom', name: 'Custom User', status: 'active' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01', createdBy: 'test', updatedBy: 'test' }
  const membership = { id: 'membership-custom', wineryId: winery.id, userId: user.id, role: 'owner' as const, status: 'active' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01', createdBy: 'test', updatedBy: 'test' }
  const [normalizedWinery] = normalizeWineries([winery])
  const [normalizedUser] = normalizeUsers([user])
  const [normalizedMembership] = normalizeMemberships([membership])
  assert.equal(normalizedWinery.id, 'winery-custom')
  assert.equal(normalizedUser.id, 'user-custom')
  assert.equal(normalizedMembership.wineryId, 'winery-custom')
  assert.equal(normalizedMembership.userId, 'user-custom')
  assert.deepEqual(validateMemberships([normalizedMembership], [normalizedWinery], [normalizedUser]), [])
})

test('seedState produces two isolated wineries proving cross-winery scoping (Phase 9.2 completion gate)', () => {
  const state = seedState()
  assert.equal(state.wineries.length, 2, 'seed data must include a second winery to prove isolation')
  const [primaryWinery, secondaryWinery] = state.wineries
  assert.notEqual(primaryWinery.id, secondaryWinery.id)

  const sameUserMemberships = state.memberships.filter((membership) => membership.userId === state.users[0].id)
  assert.equal(sameUserMemberships.length, 2, 'the demo user is a member of both wineries')
  assert.deepEqual(new Set(sameUserMemberships.map((membership) => membership.wineryId)), new Set([primaryWinery.id, secondaryWinery.id]))

  const primaryGrowers = state.growers.filter((grower) => grower.wineryId === primaryWinery.id)
  const secondaryGrowers = state.growers.filter((grower) => grower.wineryId === secondaryWinery.id)
  assert.ok(primaryGrowers.length > 0, 'the primary winery must have its own growers')
  assert.ok(secondaryGrowers.length > 0, 'the secondary winery must have its own growers')

  const primaryGrowerIds = new Set(primaryGrowers.map((grower) => grower.id))
  const secondaryGrowerIds = new Set(secondaryGrowers.map((grower) => grower.id))
  assert.equal([...primaryGrowerIds].filter((id) => secondaryGrowerIds.has(id)).length, 0, 'no grower id may appear under both wineries')

  assert.ok(state.campaigns.every((campaign) => campaign.wineryId === primaryWinery.id), 'operational demo data (campaigns, lots, etc.) belongs entirely to the primary winery')
  assert.ok(state.lots.every((lot) => lot.wineryId === primaryWinery.id))
  assert.equal(state.campaigns.some((campaign) => campaign.wineryId === secondaryWinery.id), false, 'the secondary winery must not see the primary winery operational records')
})
