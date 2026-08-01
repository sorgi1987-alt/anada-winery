import assert from 'node:assert/strict'
import test from 'node:test'
import { lots, productionEvents, tanks } from '../src/data'
import { advanceRedStage, recordRedOperation, redStageGate } from '../src/domain'
import type { WineLot } from '../src/types'

const redLot = () => structuredClone(lots.find((lot) => lot.id === 'T-26-017')!)
const whiteLot = () => structuredClone(lots.find((lot) => lot.id === 'B-26-006')!)
const cellarTanks = () => structuredClone(tanks)

test('alcoholic fermentation remains gated above the completion density', () => {
  const lot = redLot()
  const gate = redStageGate(lot, structuredClone(productionEvents))
  assert.equal(gate.stageId, 'af')
  assert.equal(gate.eligible, false)
  assert.equal(gate.reason, 'density_required')
  assert.equal(gate.value, 1.046)
})

test('a qualifying density check unlocks and advances the lot to devatting', () => {
  const lot = redLot()
  const recorded = recordRedOperation([lot], cellarTanks(), [], structuredClone(productionEvents), {
    lotId: lot.id,
    type: 'density_check',
    performedAt: '2026-08-01T14:10:00+02:00',
    operator: 'Elena Martín',
    notes: 'Fermentación alcohólica terminada.',
    metrics: { density: 0.994, temperature: 24.1 },
  })
  assert.equal(recorded.gate.eligible, true)
  assert.equal(recorded.lot.density, 0.994)

  const advanced = advanceRedStage(recorded.lots, recorded.tanks, recorded.tasks, recorded.events, {
    lotId: lot.id,
    performedAt: '2026-08-01T14:20:00+02:00',
    operator: 'Elena Martín',
    notes: 'Cierre confirmado por densidad.',
  })
  assert.equal(advanced.lot.process.find((stage) => stage.status === 'current')?.id, 'devat')
  assert.equal(advanced.lot.stage, 'Descube y prensado')
  assert.equal(advanced.events[0].kind, 'transition')
  assert.equal(advanced.tasks[0].lot, lot.id)
})

test('red-only operations cannot be recorded on a white lot', () => {
  const lot = whiteLot()
  assert.throws(() => recordRedOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id,
    type: 'pump_over',
    performedAt: '2026-09-24T09:00:00+02:00',
    operator: 'Elena Martín',
    notes: '',
    metrics: { durationMinutes: 15 },
  }), /red lot/i)
})

test('devatting reconciles free-run and press wine without creating volume', () => {
  const source = redLot()
  const lot: WineLot = {
    ...source,
    volume: 7000,
    stage: 'Descube y prensado',
    process: source.process.map((stage, index) => ({ ...stage, status: index < 3 ? 'complete' : index === 3 ? 'current' : 'upcoming' })),
  }
  assert.throws(() => recordRedOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id,
    type: 'devatting_pressing',
    performedAt: '2026-09-24T10:00:00+02:00',
    operator: 'Elena Martín',
    notes: '',
    metrics: { freeRunVolume: 6200, pressVolume: 900 },
  }), /exceeds available lot volume/i)

  const recorded = recordRedOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id,
    type: 'devatting_pressing',
    performedAt: '2026-09-24T10:05:00+02:00',
    operator: 'Elena Martín',
    notes: 'Prensa separada para valoración.',
    metrics: { freeRunVolume: 5700, pressVolume: 850 },
  })
  assert.equal(recorded.lot.volume, 6550)
  assert.equal(recorded.gate.eligible, true)
  assert.equal(recorded.event.metrics.volumeBefore, 7000)
  assert.equal(recorded.event.metrics.volumeAfter, 6550)
})
