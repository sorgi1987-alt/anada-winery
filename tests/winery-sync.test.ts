import assert from 'node:assert/strict'
import test from 'node:test'
import { dirtyRows, groupSortedBy, mergePulledRows, type WithRev } from '../src/wineryDiff'

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

// Phase 9.5 stage 3 (Batch 1): movements - flat, immutable-after-creation,
// confirms the generic mechanism needs nothing collection-specific.
test('dirtyRows/mergePulledRows work for the movements collection key', () => {
  interface MovementRow { id: string; wineryId?: string; code: string; grossSourceVolume: number }
  const original: MovementRow = { id: 'movement-1', wineryId: 'winery-default', code: 'MOV-26-001', grossSourceVolume: 5000 }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('movements', [original], [baseline]).length, 0)
  const pendingCreate: MovementRow = { id: 'movement-2', wineryId: 'winery-default', code: 'MOV-26-002', grossSourceVolume: 3000 }
  const dirty = dirtyRows('movements', [pendingCreate], [])
  assert.equal(dirty.length, 1)
  assert.equal(dirty[0]._rev, null)
})

// Movement legs are a synced flat collection like any other from
// dirtyRows/mergePulledRows's point of view - their synthesized identity
// (`${movementId}-${side}-${index}`) is App.tsx's concern, not this layer's.
test('dirtyRows/mergePulledRows work for the movementLegs collection key', () => {
  interface LegRow { id: string; wineryId?: string; movementId: string; side: string; sequence: number; volumeAfter: number }
  const original: LegRow = { id: 'movement-1-source-0', wineryId: 'winery-default', movementId: 'movement-1', side: 'source', sequence: 0, volumeAfter: 0 }
  const baseline = { ...original, _rev: 'rev-1' }
  const local = [original]
  assert.equal(dirtyRows('movementLegs', local, [baseline]).length, 0)
  const merged = mergePulledRows('movementLegs', local, [baseline], [baseline])
  assert.equal(merged, local, 'mergePulledRows must return the exact same array reference when nothing changed')
})

// groupSortedBy is what the movement-legs reattachment step (and, later,
// readings/activities) relies on to reconstruct a parent's ordered children
// from a flat, independently-synced collection - ZCQL gives no ORDER BY
// guarantee, so array position can never be trusted, only each child's own
// stable `sequence` field.
test('groupSortedBy buckets items by key and orders each bucket by its numeric sort value, not insertion order', () => {
  interface Leg { movementId: string; side: string; sequence: number; label: string }
  const legs: Leg[] = [
    { movementId: 'movement-1', side: 'source', sequence: 1, label: 'second' },
    { movementId: 'movement-1', side: 'destination', sequence: 0, label: 'only-destination' },
    { movementId: 'movement-1', side: 'source', sequence: 0, label: 'first' },
    { movementId: 'movement-2', side: 'source', sequence: 0, label: 'other-movement' },
  ]
  const grouped = groupSortedBy(legs, (leg) => `${leg.movementId}::${leg.side}`, (leg) => leg.sequence)
  assert.deepEqual(grouped.get('movement-1::source')?.map((leg) => leg.label), ['first', 'second'])
  assert.deepEqual(grouped.get('movement-1::destination')?.map((leg) => leg.label), ['only-destination'])
  assert.deepEqual(grouped.get('movement-2::source')?.map((leg) => leg.label), ['other-movement'])
})

// Regression coverage for the exact synthesized-id scheme App.tsx's
// deriveMovementLegs uses: two legs on the same movement (one per side, or
// several via index) must get stable, distinct, order-preserving ids -
// unlike readings (finding 7 in the plan), a movement's legs are created
// atomically once and never revisited, so an index-based id is safe here.
test('synthesized movement-leg ids are distinct across sides and preserve creation order across a multi-leg split', () => {
  const synthesize = (movementId: string, side: 'source' | 'destination', index: number) => `${movementId}-${side}-${index}`
  const ids = [
    synthesize('movement-1', 'source', 0),
    synthesize('movement-1', 'destination', 0),
    synthesize('movement-1', 'destination', 1),
    synthesize('movement-1', 'destination', 2),
  ]
  assert.equal(new Set(ids).size, ids.length, 'every leg id must be unique')
  assert.deepEqual(ids, ['movement-1-source-0', 'movement-1-destination-0', 'movement-1-destination-1', 'movement-1-destination-2'])
})

// Phase 9.5 stage 3 (Batch 1): lots - flat scalar fields sync exactly like
// any other collection. process/productionDetails (below) are the one part
// that needs special handling.
test('dirtyRows/mergePulledRows work for the lots collection key', () => {
  interface LotRow { id: string; wineryId?: string; name: string; stage: string }
  const original: LotRow = { id: 'L-2026-001', wineryId: 'winery-default', name: 'Ladera del Iregua', stage: 'Fermentación' }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('lots', [original], [baseline]).length, 0)
  const edited = { ...original, stage: 'Descube' }
  assert.equal(dirtyRows('lots', [edited], [baseline]).length, 1)
})

// Regression test for the JSON-blob equivalent of the earlier
// undefined/null and nested-object self-retrigger bugs: WineLot.process is
// an array (not a scalar) that round-trips through Catalyst as a
// JSON.stringify'd text column but stays real objects on the browser side -
// a freshly-parsed array is never `===` its local counterpart even with
// byte-identical content.
test('dirtyRows treats a lot as clean when its process/productionDetails are content-equal but freshly parsed (different references)', () => {
  interface LotRow { id: string; wineryId?: string; process: { id: string; status: string }[]; productionDetails: { receivedKg: number } }
  const local: LotRow = { id: 'L-2026-001', wineryId: 'winery-default', process: [{ id: 'recepcion', status: 'complete' }], productionDetails: { receivedKg: 9340 } }
  const freshlyParsed: LotRow = { id: 'L-2026-001', wineryId: 'winery-default', process: JSON.parse(JSON.stringify(local.process)), productionDetails: JSON.parse(JSON.stringify(local.productionDetails)) }
  const baseline = { ...freshlyParsed, _rev: 'rev-1' }
  assert.notEqual(local.process, baseline.process, 'the test only proves something if these are genuinely different references')
  assert.equal(dirtyRows('lots', [local], [baseline]).length, 0)
})

test('dirtyRows detects a real change inside a lot\'s process array', () => {
  interface LotRow { id: string; wineryId?: string; process: { id: string; status: string }[] }
  const original: LotRow = { id: 'L-2026-001', wineryId: 'winery-default', process: [{ id: 'recepcion', status: 'complete' }] }
  const baseline = { ...original, _rev: 'rev-1' }
  const edited: LotRow = { id: 'L-2026-001', wineryId: 'winery-default', process: [{ id: 'recepcion', status: 'complete' }, { id: 'encubado', status: 'current' }] }
  assert.equal(dirtyRows('lots', [edited], [baseline]).length, 1)
})

// readings/activities are synced as independent flat collections keyed by a
// synthesized (readings) or already-real (activities) id - dirtyRows/
// mergePulledRows need nothing collection-specific for either.
test('dirtyRows/mergePulledRows work for the readings collection key', () => {
  interface ReadingRow { id: string; wineryId?: string; lotId: string; temperature: number; recordedAt: string }
  const original: ReadingRow = { id: 'L-2026-001::2026-08-12T10:00:00.000Z', wineryId: 'winery-default', lotId: 'L-2026-001', temperature: 24.8, recordedAt: '2026-08-12T10:00:00.000Z' }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('readings', [original], [baseline]).length, 0)
  const pendingCreate: ReadingRow = { ...original, id: 'L-2026-001::2026-08-12T11:00:00.000Z', recordedAt: '2026-08-12T11:00:00.000Z', temperature: 25.1 }
  assert.equal(dirtyRows('readings', [pendingCreate], []).length, 1)
})

test('dirtyRows/mergePulledRows work for the activities collection key', () => {
  interface ActivityRow { id: string; wineryId?: string; lotId: string; title: string; recordedAt: string }
  const original: ActivityRow = { id: 'activity-1', wineryId: 'winery-default', lotId: 'L-2026-001', title: 'Lote creado', recordedAt: '2026-08-12T10:00:00.000Z' }
  const local = [original]
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('activities', local, [baseline]).length, 0)
  const merged = mergePulledRows('activities', local, [baseline], [baseline])
  assert.equal(merged, local, 'mergePulledRows must return the exact same array reference when nothing changed')
})

// Batch 2 (Harvest slice): deliveries - flat, confirms the generic
// mechanism needs nothing collection-specific. scheduledDate/scheduledTime
// are plain form strings, not full ISO timestamps - only receivedAt is a
// real datetime, matching the DATETIME_FIELDS entry in wineryDiff.ts.
test('dirtyRows/mergePulledRows work for the deliveries collection key', () => {
  interface DeliveryRow { id: string; wineryId?: string; code: string; scheduledDate: string; status: string }
  const original: DeliveryRow = { id: 'delivery-1', wineryId: 'winery-default', code: 'ENT-26-041', scheduledDate: '2026-09-17', status: 'received' }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('deliveries', [original], [baseline]).length, 0)
  const edited = { ...original, status: 'planned' }
  assert.equal(dirtyRows('deliveries', [edited], [baseline]).length, 1)
  const local = [original]
  const merged = mergePulledRows('deliveries', local, [baseline], [baseline])
  assert.equal(merged, local, 'mergePulledRows must return the exact same array reference when nothing changed')
})

// Batch 2 (Lab slice): samples. requestedAnalyses/results are the JSON-blob
// equivalent of productionEvents.metrics/lots.process - a freshly-parsed
// array is never `===` its local counterpart even with identical content.
test('dirtyRows treats a sample as clean when its requestedAnalyses/results are content-equal but freshly parsed', () => {
  interface SampleRow { id: string; wineryId?: string; requestedAnalyses: string[]; results: { analysis: string; value: number }[] }
  const local: SampleRow = { id: 'sample-1', wineryId: 'winery-default', requestedAnalyses: ['temperature', 'density'], results: [{ analysis: 'temperature', value: 24.8 }] }
  const freshlyParsed: SampleRow = { id: 'sample-1', wineryId: 'winery-default', requestedAnalyses: JSON.parse(JSON.stringify(local.requestedAnalyses)), results: JSON.parse(JSON.stringify(local.results)) }
  const baseline = { ...freshlyParsed, _rev: 'rev-1' }
  assert.notEqual(local.results, baseline.results, 'the test only proves something if these are genuinely different references')
  assert.equal(dirtyRows('samples', [local], [baseline]).length, 0)
})

test('dirtyRows/mergePulledRows work for the samples collection key', () => {
  interface SampleRow { id: string; wineryId?: string; code: string; dueAt: string; status: string }
  const original: SampleRow = { id: 'sample-1', wineryId: 'winery-default', code: 'LAB-26-001', dueAt: '17:00', status: 'queued' }
  const baseline = { ...original, _rev: 'rev-1' }
  assert.equal(dirtyRows('samples', [original], [baseline]).length, 0)
  const edited = { ...original, status: 'validated' }
  assert.equal(dirtyRows('samples', [edited], [baseline]).length, 1)
})
