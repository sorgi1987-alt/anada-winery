import assert from 'node:assert/strict'
import test from 'node:test'
import { createGrower, normalizeGrowers, setGrowerStatus, updateGrower, validateGrowerMaster, GrowerValidationError } from '../src/growers'
import { migrateLegacyState } from '../src/store'
import { lots, initialTasks, tanks, winerySettings } from '../src/data'

test('grower master creates, updates and deactivates permanent records', () => {
  const initial = normalizeGrowers([{ id: 'grower-1', code: 'VIT-001', name: 'Viticultor Uno', status: 'active' }])
  const created = createGrower(initial, {
    code: 'VIT-002', legalName: 'Bodegas Hermanos Pérez SL', tradeName: 'Hermanos Pérez', growerType: 'company', taxId: 'B12345678', municipality: 'Alberite', province: 'La Rioja', operator: 'Elena Martín',
  })
  assert.equal(created.length, 2)
  const grower = created[1]
  assert.equal(grower.legalName, 'Bodegas Hermanos Pérez SL')
  assert.equal(grower.status, 'active')
  const updated = updateGrower(created, grower.id, { phone: '+34 941 000 000', operator: 'Elena Martín' })
  assert.equal(updated[1].phone, '+34 941 000 000')
  const inactive = setGrowerStatus(updated, grower.id, 'inactive', 'Elena Martín')
  assert.equal(inactive[1].status, 'inactive')
  assert.deepEqual(validateGrowerMaster(inactive), [])
})

test('grower master rejects duplicate codes and fiscal identities', () => {
  const growers = normalizeGrowers([{ id: 'grower-1', code: 'VIT-001', name: 'Viticultor Uno', legalName: 'Viticultor Uno', taxId: '12345678A', status: 'active' }])
  assert.throws(() => createGrower(growers, { code: 'VIT-001', legalName: 'Otro', growerType: 'individual', operator: 'Elena' }), GrowerValidationError)
  assert.throws(() => createGrower(growers, { code: 'VIT-002', legalName: 'Otro', taxId: '12345678-A', growerType: 'individual', operator: 'Elena' }), GrowerValidationError)
})

test('v24 migration preserves grower identity while enriching the master record', () => {
  const legacy = { schemaVersion: 24, lots: structuredClone(lots), tasks: structuredClone(initialTasks), tanks: structuredClone(tanks), settings: structuredClone(winerySettings), growers: [{ id: 'grower-legacy', code: 'VIT-099', name: 'Viñas Legacy', taxId: 'A00000001', status: 'active' }] }
  const migrated = migrateLegacyState(legacy)
  assert.ok(migrated)
  assert.equal(migrated.schemaVersion, 25)
  const grower = migrated.growers.find((item) => item.id === 'grower-legacy')
  assert.ok(grower)
  assert.equal(grower.legalName, 'Viñas Legacy')
  assert.equal(grower.taxId, 'A00000001')
  assert.equal(grower.country, 'España')
  assert.equal(grower.createdBy, 'System migration')
})

test('grower management is exposed as a routed administration workspace', async () => {
  const { readFile } = await import('node:fs/promises')
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const admin = await readFile(new URL('../src/Administration.tsx', import.meta.url), 'utf8')
  assert.match(app, /\/admin\/growers/)
  assert.match(admin, /function GrowerManager/)
  assert.match(admin, /function GrowerEditor/)
  assert.doesNotMatch(admin, /window\.prompt/)
})
