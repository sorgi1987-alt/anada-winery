import assert from 'node:assert/strict'
import test from 'node:test'
import { initialTasks, lots, productionEvents, tanks } from '../src/data'
import { advanceWhiteStage, recordWhiteOperation, whiteStageGate } from '../src/domain'
import { migrateLegacyState } from '../src/store'
import type { WineLot } from '../src/types'

const seedWhiteLot = () => structuredClone(lots.find((lot) => lot.id === 'B-26-006')!)
const cellarTanks = () => structuredClone(tanks)

const whiteAt = (stageId: string, overrides: Partial<WineLot> = {}): WineLot => {
  const source = seedWhiteLot()
  const stageIndex = source.process.findIndex((stage) => stage.id === stageId)
  return {
    ...source,
    productionDetails: {
      receivedKg: 8000,
      receptionDate: '2026-09-19',
      initialDensity: 1.09,
      receptionTemperature: 12.4,
      white: { pressFraction: 'Mosto yema', turbidityTarget: 100, protection: 'Inertizado con CO₂' },
    },
    process: source.process.map((stage, index) => ({ ...stage, status: index < stageIndex ? 'complete' : index === stageIndex ? 'current' : 'upcoming' })),
    stage: source.process[stageIndex].label,
    ...overrides,
  }
}

test('cool alcoholic fermentation is gated until the newest density is dry', () => {
  const lot = seedWhiteLot()
  const initialGate = whiteStageGate(lot, structuredClone(productionEvents))
  assert.equal(initialGate.stageId, 'af')
  assert.equal(initialGate.eligible, false)
  assert.equal(initialGate.value, 1.018)

  const recorded = recordWhiteOperation([lot], cellarTanks(), [], structuredClone(productionEvents), {
    lotId: lot.id,
    type: 'density_check',
    performedAt: '2026-08-01T17:30:00+02:00',
    operator: 'Elena Martín',
    notes: 'Fermentación seca.',
    metrics: { density: 0.994, temperature: 15.1 },
  })
  assert.equal(recorded.gate.eligible, true)
  assert.equal(recorded.lot.density, 0.994)

  const advanced = advanceWhiteStage(recorded.lots, recorded.tanks, recorded.tasks, recorded.events, {
    lotId: lot.id,
    performedAt: '2026-08-01T17:40:00+02:00',
    operator: 'Elena Martín',
    notes: 'Densidad confirmada.',
  })
  assert.equal(advanced.lot.process.find((stage) => stage.status === 'current')?.id, 'lees')
  assert.equal(advanced.events[0].kind, 'transition')
})

test('pressing reconciles fractions and enforces the internal 70 L per 100 kg checkpoint', () => {
  const lot = whiteAt('press', { volume: 6000 })
  const common = {
    lotId: lot.id,
    type: 'pressing' as const,
    performedAt: '2026-09-19T11:00:00+02:00',
    operator: 'Elena Martín',
    notes: 'Fracciones separadas.',
  }
  assert.throws(() => recordWhiteOperation([lot], cellarTanks(), [], [], {
    ...common,
    metrics: { freeRunVolume: 5000, pressVolume: 601, pressFraction: 'Yema + primera prensa' },
  }), /70 L\/100 kg/i)

  const recorded = recordWhiteOperation([lot], cellarTanks(), [], [], {
    ...common,
    metrics: { freeRunVolume: 4700, pressVolume: 500, pressFraction: 'Yema + primera prensa' },
  })
  assert.equal(recorded.lot.volume, 5200)
  assert.equal(recorded.event.metrics.volumeBefore, 6000)
  assert.equal(recorded.event.metrics.volumeAfter, 5200)
  assert.equal(recorded.gate.eligible, true)
})

test('settling requires both target turbidity and a clean-must racking without creating volume', () => {
  const lot = whiteAt('settling', { volume: 5200 })
  const cloudy = recordWhiteOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id, type: 'turbidity_check', performedAt: '2026-09-20T08:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { turbidity: 135 },
  })
  assert.equal(cloudy.gate.reason, 'turbidity_required')

  const clear = recordWhiteOperation(cloudy.lots, cloudy.tanks, cloudy.tasks, cloudy.events, {
    lotId: lot.id, type: 'turbidity_check', performedAt: '2026-09-20T12:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { turbidity: 82 },
  })
  assert.equal(clear.gate.reason, 'racking_required')
  assert.throws(() => recordWhiteOperation(clear.lots, clear.tanks, clear.tasks, clear.events, {
    lotId: lot.id, type: 'clean_must_racking', performedAt: '2026-09-20T12:30:00+02:00', operator: 'Elena Martín', notes: '', metrics: { volumeAfter: 5250, settlingHours: 24 },
  }), /reconciled volume/i)

  const racked = recordWhiteOperation(clear.lots, clear.tanks, clear.tasks, clear.events, {
    lotId: lot.id, type: 'clean_must_racking', performedAt: '2026-09-20T12:35:00+02:00', operator: 'Elena Martín', notes: '', metrics: { volumeAfter: 5050, settlingHours: 24 },
  })
  assert.equal(racked.gate.eligible, true)
  assert.equal(racked.lot.volume, 5050)
})

test('lees and tartaric-stability stages use separate explicit decisions', () => {
  const leesLot = whiteAt('lees')
  const continueLees = recordWhiteOperation([leesLot], cellarTanks(), [], [], {
    lotId: leesLot.id, type: 'lees_decision', performedAt: '2026-10-05T10:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { leesDecision: 'continue' },
  })
  assert.equal(continueLees.gate.eligible, false)
  const completeLees = recordWhiteOperation(continueLees.lots, continueLees.tanks, continueLees.tasks, continueLees.events, {
    lotId: leesLot.id, type: 'lees_decision', performedAt: '2026-10-12T10:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { leesDecision: 'complete' },
  })
  assert.equal(completeLees.gate.eligible, true)

  const stabilityLot = whiteAt('stability')
  const unstable = recordWhiteOperation([stabilityLot], cellarTanks(), [], [], {
    lotId: stabilityLot.id, type: 'cold_stability_check', performedAt: '2026-10-15T09:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { conductivityDrop: 42 },
  })
  assert.equal(unstable.gate.reason, 'stability_required')
  const stable = recordWhiteOperation(unstable.lots, unstable.tanks, unstable.tasks, unstable.events, {
    lotId: stabilityLot.id, type: 'cold_stability_check', performedAt: '2026-10-16T09:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { conductivityDrop: 25 },
  })
  assert.equal(stable.gate.eligible, true)
})

test('white-only operations cannot be recorded on a red lot', () => {
  const redLot = structuredClone(lots.find((lot) => lot.id === 'T-26-017')!)
  assert.throws(() => recordWhiteOperation([redLot], cellarTanks(), [], [], {
    lotId: redLot.id, type: 'inoculation', performedAt: '2026-09-24T09:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { product: 'Levadura', additionAmount: 1, additionUnit: 'kg' },
  }), /white lot/i)
})

test('the v11 migration preserves v10 process history and adds only missing white demo events', () => {
  const redHistory = structuredClone(productionEvents.filter((event) => event.wineType === 'tinto'))
  const migrated = migrateLegacyState({ schemaVersion: 10, lots: structuredClone(lots), tasks: structuredClone(initialTasks), tanks: structuredClone(tanks), productionEvents: redHistory })
  assert.equal(migrated?.schemaVersion, 11)
  assert.equal(migrated?.productionEvents.filter((event) => event.wineType === 'tinto').length, redHistory.length)
  assert.equal(migrated?.productionEvents.filter((event) => event.wineType === 'blanco').length, 3)
})
