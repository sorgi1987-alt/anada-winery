import assert from 'node:assert/strict'
import test from 'node:test'
import { initialTasks, lots, movementReserveTanks, productionEvents, tanks, wineMovements } from '../src/data'
import { mergeWine, splitWine, transferWine } from '../src/domain'
import { migrateLegacyState } from '../src/store'
import type { Tank, WineLot } from '../src/types'

const movementMeta = {
  performedAt: '2026-09-28T10:30:00+02:00',
  operator: 'Elena Martín',
  notes: 'Movimiento de control.',
}

test('a full transfer atomically clears the source, fills the destination and reconciles loss', () => {
  const result = transferWine(structuredClone(lots), structuredClone(tanks), structuredClone(wineMovements), {
    ...movementMeta, lotId: 'T-26-017', destinationTankId: 'D-01', lossVolume: 50,
  })

  assert.equal(result.lot.vessel, 'D-01')
  assert.equal(result.lot.volume, 7800)
  assert.equal(result.tanks.find((tank) => tank.id === 'D-12')?.volume, 0)
  assert.equal(result.tanks.find((tank) => tank.id === 'D-12')?.lot, undefined)
  assert.equal(result.tanks.find((tank) => tank.id === 'D-01')?.lot, 'T-26-017')
  assert.equal(result.tanks.find((tank) => tank.id === 'D-01')?.volume, 7800)
  assert.equal(result.movement.grossSourceVolume, result.movement.receivedVolume + result.movement.lossVolume)
  assert.equal(result.movement.code, 'MOV-26-003')
})

test('transfers reject occupied and undersized destinations before changing inventory', () => {
  assert.throws(() => transferWine(structuredClone(lots), structuredClone(tanks), [], {
    ...movementMeta, lotId: 'T-26-017', destinationTankId: 'D-04', lossVolume: 0,
  }), /must be empty/i)

  const cellar = structuredClone(tanks)
  cellar.push({ id: 'D-99', capacity: 3000, volume: 0, attention: 'normal' })
  assert.throws(() => transferWine(structuredClone(lots), cellar, [], {
    ...movementMeta, lotId: 'T-26-017', destinationTankId: 'D-99', lossVolume: 10,
  }), /capacity is insufficient/i)

  const inconsistent = structuredClone(tanks).map((tank) => tank.id === 'D-12' ? { ...tank, volume: tank.volume - 100 } : tank)
  assert.throws(() => transferWine(structuredClone(lots), inconsistent, [], {
    ...movementMeta, lotId: 'T-26-017', destinationTankId: 'D-01', lossVolume: 10,
  }), /volumes are inconsistent/i)
})

test('a split creates traceable child lots while preserving the residual source balance', () => {
  const result = splitWine(structuredClone(lots), structuredClone(tanks), structuredClone(wineMovements), {
    ...movementMeta,
    lotId: 'T-26-017',
    destinations: [{ tankId: 'D-01', volume: 3000 }, { tankId: 'D-05', volume: 2000 }],
    lossVolume: 50,
  })

  assert.deepEqual(result.createdLots.map((lot) => lot.id), ['T-26-017-S01', 'T-26-017-S02'])
  assert.deepEqual(result.createdLots.map((lot) => lot.volume), [3000, 2000])
  assert.equal(result.sourceLot.volume, 2800)
  assert.equal(result.sourceLot.operationalStatus, 'active')
  assert.equal(result.tanks.find((tank) => tank.id === 'D-12')?.volume, 2800)
  assert.equal(result.tanks.find((tank) => tank.id === 'D-01')?.lot, 'T-26-017-S01')
  assert.equal(result.tanks.find((tank) => tank.id === 'D-05')?.lot, 'T-26-017-S02')
  assert.equal(result.movement.sourceLegs[0].volumeBefore, result.movement.receivedVolume + result.movement.lossVolume + result.sourceLot.volume)
})

const mergeFixture = () => {
  const base = structuredClone(lots.find((lot) => lot.id === 'T-26-017')!)
  const first: WineLot = { ...base, id: 'T-26-A', name: 'Tempranillo A', vessel: 'M-01', volume: 4000, temperature: 20, density: 1.05 }
  const second: WineLot = { ...structuredClone(base), id: 'T-26-B', name: 'Tempranillo B', vessel: 'M-02', volume: 3000, temperature: 24, density: 1.03 }
  const cellar: Tank[] = [
    { id: 'M-01', capacity: 5000, volume: 4000, lot: first.id, type: first.type, stage: first.stage, temperature: first.temperature, attention: 'normal' },
    { id: 'M-02', capacity: 5000, volume: 3000, lot: second.id, type: second.type, stage: second.stage, temperature: second.temperature, attention: 'normal' },
    { id: 'M-03', capacity: 6000, volume: 0, attention: 'normal' },
  ]
  return { first, second, cellar }
}

test('a compatible merge creates a new lot and retains partial source identities', () => {
  const { first, second, cellar } = mergeFixture()
  const result = mergeWine([first, second], cellar, [], {
    ...movementMeta,
    sources: [{ lotId: first.id, volume: 2500 }, { lotId: second.id, volume: 1500 }],
    destinationTankId: 'M-03', name: 'Selección de depósitos', lossVolume: 50,
  })

  assert.equal(result.lot.id, 'M-26-001')
  assert.equal(result.lot.volume, 3950)
  assert.equal(result.lot.temperature, 21.5)
  assert.equal(result.lot.density, 1.0425)
  assert.deepEqual(result.sourceLots.map((lot) => lot.volume), [1500, 1500])
  assert.ok(result.sourceLots.every((lot) => lot.operationalStatus === 'active'))
  assert.equal(result.tanks.find((tank) => tank.id === 'M-03')?.lot, 'M-26-001')
  assert.equal(result.movement.grossSourceVolume, result.movement.receivedVolume + result.movement.lossVolume)
})

test('a merge blocks incompatible wine types, vintages and process stages', () => {
  const { first, second, cellar } = mergeFixture()
  const incompatible: WineLot = { ...second, type: 'blanco' }
  assert.throws(() => mergeWine([first, incompatible], cellar.map((tank) => tank.id === 'M-02' ? { ...tank, type: 'blanco' } : tank), [], {
    ...movementMeta,
    sources: [{ lotId: first.id, volume: 1000 }, { lotId: incompatible.id, volume: 1000 }],
    destinationTankId: 'M-03', name: 'No permitido', lossVolume: 0,
  }), /share wine type, vintage, process stage/i)
})

test('the v14 migration preserves process history and adds movement audit history and reserve vats', () => {
  const legacyEvents = structuredClone(productionEvents)
  const legacyTanks = structuredClone(tanks.filter((tank) => !movementReserveTanks.some((reserve) => reserve.id === tank.id)))
  const migrated = migrateLegacyState({
    schemaVersion: 12,
    lots: structuredClone(lots),
    tasks: structuredClone(initialTasks),
    tanks: legacyTanks,
    productionEvents: legacyEvents,
  })

  assert.equal(migrated?.schemaVersion, 14)
  assert.equal(migrated?.productionEvents.length, legacyEvents.length)
  assert.equal(migrated?.movements.length, wineMovements.length)
  assert.equal(migrated?.movements[0].storageMode, 'browser-local')
  assert.deepEqual(migrated?.tanks.slice(-4).map((tank) => tank.id), movementReserveTanks.map((tank) => tank.id))
  assert.ok(migrated?.tanks.slice(-4).every((tank) => tank.volume === 0 && !tank.lot))
})

test('the v13 migration preserves existing movements and never overwrites a known reserve vat', () => {
  const legacyTanks = structuredClone(tanks.filter((tank) => tank.id !== 'D-22' && tank.id !== 'D-23' && tank.id !== 'D-24'))
  const d21 = legacyTanks.find((tank) => tank.id === 'D-21')!
  Object.assign(d21, { volume: 1200, lot: 'TEST-LOT', type: 'tinto', stage: 'Conservación' })
  const legacyMovements = structuredClone(wineMovements)
  legacyMovements[0].notes = 'Existing user movement must survive migration.'
  const migrated = migrateLegacyState({
    schemaVersion: 13,
    lots: structuredClone(lots),
    tasks: structuredClone(initialTasks),
    tanks: legacyTanks,
    productionEvents: structuredClone(productionEvents),
    movements: legacyMovements,
  })

  assert.equal(migrated?.schemaVersion, 14)
  assert.equal(migrated?.movements[0].notes, legacyMovements[0].notes)
  assert.equal(migrated?.tanks.find((tank) => tank.id === 'D-21')?.lot, 'TEST-LOT')
  assert.deepEqual(movementReserveTanks.map((tank) => migrated?.tanks.filter((item) => item.id === tank.id).length), [1, 1, 1, 1])
})
