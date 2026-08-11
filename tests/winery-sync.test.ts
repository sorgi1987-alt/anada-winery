import assert from 'node:assert/strict'
import test from 'node:test'
import { dirtyRows, mergePulledRows, type WithRev } from '../src/wineryDiff'

interface Row {
  id: string
  wineryId?: string
  name: string
  updatedAt: string
}

const baseRow = (overrides: Partial<Row> = {}): Row => ({
  id: 'campaign-1', wineryId: 'winery-default', name: 'Vendimia 2026', updatedAt: '2026-08-20T00:00:00.000Z', ...overrides,
})

const asBaseline = (row: Row, rev = 'rev-1'): WithRev<Row> => ({ ...row, _rev: rev })

test('dirtyRows treats a row with no baseline counterpart as a pending local create', () => {
  const local = [baseRow()]
  const dirty = dirtyRows('campaigns', local, [])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0]._rev, null)
})

test('dirtyRows finds nothing dirty when local exactly matches its baseline', () => {
  const row = baseRow()
  const dirty = dirtyRows('campaigns', [row], [asBaseline(row)])
  assert.equal(dirty.length, 0)
})

test('dirtyRows detects a real field change and carries the baseline revision', () => {
  const original = baseRow()
  const edited = { ...original, name: 'Vendimia 2026 (renamed)' }
  const dirty = dirtyRows('campaigns', [edited], [asBaseline(original, 'rev-7')])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0].name, 'Vendimia 2026 (renamed)')
  assert.equal(dirty[0]._rev, 'rev-7')
})

test('dirtyRows ignores millisecond-only differences on datetime fields (no infinite resync loop)', () => {
  // The browser always stamps new Date().toISOString() (with milliseconds);
  // Catalyst's wire format truncates to whole seconds. A row that round
  // tripped through sync must not look dirty again just because of that.
  const original = baseRow({ updatedAt: '2026-08-20T00:00:00.000Z' })
  const roundTripped = { ...original, updatedAt: '2026-08-20T00:00:00.000Z' }
  const dirty = dirtyRows('campaigns', [roundTripped], [asBaseline(original)])
  assert.equal(dirty.length, 0)
})

test('dirtyRows ignores fields the reference (baseline) does not carry, e.g. legacy local-only fields', () => {
  interface ParcelRow extends Row { image?: string; sample?: { note: string } }
  const original: ParcelRow = { ...baseRow(), image: 'photo.jpg', sample: { note: 'ok' } }
  const baseline = asBaseline({ id: original.id, wineryId: original.wineryId, name: original.name, updatedAt: original.updatedAt })
  const dirty = dirtyRows('parcels', [original], [baseline])
  assert.equal(dirty.length, 0)
})

test('mergePulledRows adopts a fresh remote row the caller has not locally edited', () => {
  const original = baseRow()
  const fresh = { ...original, name: 'Renamed elsewhere' }
  const merged = mergePulledRows('campaigns', [original], [asBaseline(original)], [asBaseline(fresh, 'rev-2')])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].name, 'Renamed elsewhere')
})

// Regression test for a real bug caught live: VineyardParcel.sample/.image
// are required local-only fields Catalyst has no column for. Adopting a
// fresh remote row used to replace the whole local object with only the
// server-mapped fields, silently dropping `sample` - Harvest.tsx then did
// `parcel.sample.potentialAlcohol.toFixed(1)` and crashed on `undefined`.
test('mergePulledRows preserves a local-only required field when adopting a remote change to a different field', () => {
  interface ParcelRow extends Row { sample: { potentialAlcohol: number } }
  const original: ParcelRow = { ...baseRow(), sample: { potentialAlcohol: 13.4 } }
  const fresh = { ...original, name: 'Renamed elsewhere' }
  const merged = mergePulledRows('parcels', [original], [asBaseline(original)], [asBaseline(fresh, 'rev-2')])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].name, 'Renamed elsewhere')
  assert.equal(merged[0].sample.potentialAlcohol, 13.4, 'a local-only field must survive adopting a remote change to another field')
})

test('mergePulledRows leaves a locally-dirty row alone rather than clobbering the pending edit', () => {
  const original = baseRow()
  const localEdit = { ...original, name: 'My local edit' }
  const remoteChangedToo = { ...original, name: 'Someone else changed it too' }
  const merged = mergePulledRows('campaigns', [localEdit], [asBaseline(original)], [asBaseline(remoteChangedToo, 'rev-2')])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].name, 'My local edit')
})

test('mergePulledRows adds a row that exists remotely but not locally yet (created on another device)', () => {
  const remoteOnly = asBaseline(baseRow({ id: 'campaign-2', name: 'Created elsewhere' }), 'rev-1')
  const merged = mergePulledRows('campaigns', [], [], [remoteOnly])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'campaign-2')
  assert.equal('_rev' in merged[0], false)
})

test('mergePulledRows keeps a pending local create that has not reached the server yet', () => {
  const pendingCreate = baseRow({ id: 'campaign-new' })
  const merged = mergePulledRows('campaigns', [pendingCreate], [], [])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'campaign-new')
})

test('mergePulledRows returns the exact same array reference when nothing changed - required to avoid a self-retriggering sync loop', () => {
  const original = baseRow()
  const local = [original]
  const merged = mergePulledRows('campaigns', local, [asBaseline(original)], [asBaseline(original)])
  assert.equal(merged, local)
})

test('mergePulledRows returns a new array reference when a remote change is actually adopted', () => {
  const original = baseRow()
  const local = [original]
  const fresh = { ...original, name: 'Renamed elsewhere' }
  const merged = mergePulledRows('campaigns', local, [asBaseline(original)], [asBaseline(fresh, 'rev-2')])
  assert.notEqual(merged, local)
})

// Phase 9.5 stage 3 (Batch 1): tanks - confirms the generic mechanism works
// for a collection with no datetime-typed fields at all (Tank has none).
test('dirtyRows/mergePulledRows work for the tanks collection key (no datetime fields)', () => {
  interface TankRow { id: string; wineryId?: string; capacity: number; temperature: number }
  const original: TankRow = { id: 'tank-1', wineryId: 'winery-default', capacity: 5000, temperature: 24.5 }
  const baseline = { ...original, _rev: 'rev-1' }
  const unchanged = dirtyRows('tanks', [original], [baseline])
  assert.equal(unchanged.length, 0)
  const edited = { ...original, temperature: 18.2 }
  const dirty = dirtyRows('tanks', [edited], [baseline])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0]._rev, 'rev-1')
})

// Regression test for a real bug caught live: an optional field the browser
// never set is `undefined` locally, but the exact same field read back from
// Catalyst comes back `null` (Catalyst has no concept of `undefined`, only
// an empty column). Without treating null/undefined as equal, a row with
// any unset optional field would compare "changed" forever - not once, but
// every single 3s/20s sync tick, permanently - a continuous self-retrigger
// loop observed directly against the live deployed backend.
test('dirtyRows/mergePulledRows treat an unset local field (undefined) as equal to its Catalyst round trip (null)', () => {
  interface TankRow { id: string; wineryId?: string; capacity: number; usableCapacity?: number }
  const row: TankRow = { id: 'tank-1', wineryId: 'winery-default', capacity: 5000, usableCapacity: undefined }
  const local = [row]
  const roundTripped: WithRev<TankRow> = { id: 'tank-1', wineryId: 'winery-default', capacity: 5000, usableCapacity: null as unknown as undefined, _rev: 'rev-1' }
  assert.equal(dirtyRows('tanks', local, [roundTripped]).length, 0)
  const merged = mergePulledRows('tanks', local, [roundTripped], [roundTripped])
  assert.equal(merged, local, 'mergePulledRows must return the exact same array reference, not just equal content')
})

// Phase 9.5 stage 3 (Batch 1): tasks - confirms the generic mechanism works
// for CellarTask.time, a free-text display string, not a datetime field.
test('dirtyRows/mergePulledRows work for the tasks collection key (time is a display string, not a datetime)', () => {
  interface TaskRow { id: string; wineryId?: string; title: string; time: string; complete: boolean }
  const original: TaskRow = { id: 'task-1', wineryId: 'winery-default', title: 'Registrar densidad', time: 'Hoy', complete: false }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('tasks', [original], [baseline]).length, 0)
  const edited = { ...original, time: '16:00', complete: true }
  const dirty = dirtyRows('tasks', [edited], [baseline])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0].time, '16:00')
})

// Phase 9.5 stage 3 (Batch 1): productionEvents. `metrics` is a nested
// object, not a scalar - a freshly-pulled metrics object is never `===` its
// local counterpart even with identical content. Without a tolerant deep
// comparison, every productionEvent would look "dirty" forever after any
// pull - the same self-retrigger failure class as the null/undefined bug,
// one level deeper. This is the required regression test for that fix.
test('dirtyRows treats a productionEvent as clean when its nested metrics object is content-equal but a different reference', () => {
  interface EventRow { id: string; wineryId?: string; metrics: { temperature?: number; malicAcid?: number } }
  const local: EventRow = { id: 'pe-1', wineryId: 'winery-default', metrics: { temperature: 24.5 } }
  // Simulates a freshly-pulled row: same content, but Catalyst always emits
  // every metrics.* column, so unset fields arrive as `null`, not absent.
  const pulled: EventRow = { id: 'pe-1', wineryId: 'winery-default', metrics: { temperature: 24.5, malicAcid: null as unknown as undefined } }
  const baseline = { ...pulled, _rev: 'rev-1' }
  assert.equal(dirtyRows('productionEvents', [local], [baseline]).length, 0)
})

test('dirtyRows detects a real change inside a productionEvent\'s nested metrics object', () => {
  interface EventRow { id: string; wineryId?: string; metrics: { temperature?: number } }
  const original: EventRow = { id: 'pe-1', wineryId: 'winery-default', metrics: { temperature: 24.5 } }
  const baseline = { ...original, _rev: 'rev-1' }
  const edited: EventRow = { id: 'pe-1', wineryId: 'winery-default', metrics: { temperature: 26.1 } }
  const dirty = dirtyRows('productionEvents', [edited], [baseline])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0].metrics.temperature, 26.1)
})

test('mergePulledRows returns the exact same array reference for productionEvents when nothing changed (no self-retrigger loop)', () => {
  interface EventRow { id: string; wineryId?: string; metrics: { temperature?: number } }
  const original: EventRow = { id: 'pe-1', wineryId: 'winery-default', metrics: { temperature: 24.5 } }
  const local = [original]
  const baseline = { ...original, metrics: { temperature: 24.5 }, _rev: 'rev-1' }
  const fresh = { ...original, metrics: { temperature: 24.5 }, _rev: 'rev-1' }
  const merged = mergePulledRows('productionEvents', local, [baseline], [fresh])
  assert.equal(merged, local, 'mergePulledRows must return the exact same array reference, not just equal content')
})
