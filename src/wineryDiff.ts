// Pure sync-diffing logic for Phase 9.5 stage 2, deliberately kept free of
// any fetch/environment dependency (see wineryRemote.ts, which needs
// import.meta.env and so can't be imported from plain Node test runs) so it
// stays directly unit-testable.

// Every row read from Catalyst carries `_rev` (its MODIFIEDTIME) - the
// optimistic-concurrency token that tells "nobody else touched this since I
// last read it" apart from "this changed remotely, don't blindly overwrite
// it". See backend/anada_data_api/wineryContext.js.
export type WithRev<T> = T & { _rev?: string | null }

interface Identified {
  id: string
  wineryId?: string
}

// Which fields on each synced collection are Catalyst datetime columns.
// Catalyst's wire format truncates to whole seconds (no milliseconds, no
// offset - see toCatalystDatetime/fromCatalystDatetime in
// backend/anada_data_api/wineryContext.js), but the browser stamps
// `new Date().toISOString()` on every edit, which always has milliseconds.
// Without normalizing before comparison, every row that was ever synced
// would look "dirty" forever after its first round trip, even with no real
// change - an infinite, pointless resync loop.
const DATETIME_FIELDS: Record<string, readonly string[]> = {
  campaigns: ['startsAt', 'expectedHarvestStart', 'expectedEndAt', 'closedAt', 'createdAt', 'updatedAt', 'reopenedAt'],
  growers: ['createdAt', 'updatedAt'],
  vineyards: ['createdAt', 'updatedAt'],
  parcels: ['createdAt', 'updatedAt'],
  campaignParcels: ['expectedHarvestDate', 'createdAt', 'updatedAt'],
  // Phase 9.5 stage 3 (Batch 1): Tank has no datetime-typed field at all.
  tanks: [],
}

function truncateToSeconds(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 19)
}

const isAbsent = (v: unknown) => v === null || v === undefined

// `null` and `undefined` both mean "not set" but are not `===` each other.
// A field the browser never set is `undefined` locally; the exact same
// field read back from Catalyst (which has no concept of `undefined`, only
// an empty column) comes back as `null`. Without treating them as equal,
// every row with any unset optional field would compare "changed" forever
// on every single sync cycle - not just once, but every 3s/20s tick,
// permanently, since the field can never actually become equal by either
// definition. Caught live: a real, continuous ~3s self-retrigger loop.
function fieldEqual(collection: string, key: string, a: unknown, b: unknown): boolean {
  if (DATETIME_FIELDS[collection]?.includes(key)) return truncateToSeconds(a) === truncateToSeconds(b)
  if (isAbsent(a) && isAbsent(b)) return true
  return a === b
}

// Two rows are equal, for sync purposes, if every field Catalyst actually
// stores matches - comparing only `Object.keys(reference)` (never the full
// local object) is what keeps this correct for types like `VineyardParcel`
// that carry extra legacy/local-only fields (`grower`, `image`, `sample`,
// etc.) no Catalyst column maps to; those must never make a row look dirty.
function rowsEqual(collection: string, row: Record<string, unknown>, reference: Record<string, unknown>): boolean {
  return Object.keys(reference).every((key) => key === '_rev' || fieldEqual(collection, key, row[key], reference[key]))
}

// Rows in `local` that differ from their last-known-synced counterpart in
// `baseline` (or have no counterpart at all - a pending local create) are
// "dirty": they need to be pushed. Each dirty row is stamped with the
// `_rev` its baseline counterpart last carried, so the server can tell a
// clean update from a stale one.
export function dirtyRows<T extends Identified>(collection: string, local: T[], baseline: WithRev<T>[]): WithRev<T>[] {
  const baselineById = new Map(baseline.map((row) => [row.id, row]))
  return local
    .filter((row) => {
      const base = baselineById.get(row.id)
      return !base || !rowsEqual(collection, row as Record<string, unknown>, base as Record<string, unknown>)
    })
    .map((row) => ({ ...row, _rev: baselineById.get(row.id)?._rev ?? null }))
}

// Merges a fresh remote pull into local state. A row with no pending local
// edit (unchanged since the last known baseline) simply adopts the fresh
// remote value - that's how another device's changes actually arrive here.
// A row with a pending local edit is left untouched by this merge; it is
// not this function's job to resolve that conflict - the next push attempt
// will either succeed (if the fresh remote value turns out to match what
// the edit was based on) or come back as a server-side conflict, which the
// caller resolves by adopting the server's row and discarding the local
// edit, the same "never silently guess at a merge" policy used everywhere
// else in this sync design.
//
// Returns the exact same `local` array reference when nothing actually
// changed. This matters beyond a micro-optimization: the sync loop compares
// this function's output by reference to decide whether to touch React
// state at all, and every one of the app's `set*` setters unconditionally
// builds a fresh array - so a "merge" that always returns a new array,
// even one with identical contents, would look like a state change forever
// and turn what should be an idle 20s heartbeat into a tight self-retrigger
// loop.
export function mergePulledRows<T extends Identified>(collection: string, local: T[], baseline: WithRev<T>[], fresh: WithRev<T>[]): T[] {
  const baselineById = new Map(baseline.map((row) => [row.id, row]))
  const freshById = new Map(fresh.map((row) => [row.id, row]))
  const localIds = new Set(local.map((row) => row.id))
  let changed = false
  const merged = local.map((row) => {
    const base = baselineById.get(row.id)
    const isDirty = !base || !rowsEqual(collection, row as Record<string, unknown>, base as Record<string, unknown>)
    if (isDirty) return row
    const freshRow = freshById.get(row.id)
    if (!freshRow || rowsEqual(collection, row as Record<string, unknown>, freshRow as Record<string, unknown>)) return row
    changed = true
    const { _rev: _unused, ...rest } = freshRow
    return rest as T
  })
  const additions: T[] = []
  for (const row of fresh) {
    if (localIds.has(row.id)) continue
    changed = true
    const { _rev: _unused, ...rest } = row
    additions.push(rest as T)
  }
  return changed ? [...merged, ...additions] : local
}
