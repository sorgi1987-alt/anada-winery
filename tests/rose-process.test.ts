import assert from 'node:assert/strict'
import test from 'node:test'
import { initialTasks, lots, productionEvents, roseLot, roseProcesses, tanks } from '../src/data'
import { advanceRoseStage, recordRoseOperation, roseOperationsForLot, roseStageGate } from '../src/domain'
import { migrateLegacyState } from '../src/store'
import type { RoseMethod, WineLot } from '../src/types'

const cellarTanks = () => structuredClone(tanks)

const roseAt = (method: RoseMethod, stageId: string, overrides: Partial<WineLot> = {}): WineLot => {
  const source = structuredClone(roseLot)
  const process = structuredClone(roseProcesses[method])
  const stageIndex = process.findIndex((stage) => stage.id === stageId)
  return {
    ...source,
    id: `R-${method}-${stageId}`,
    volume: 4450,
    stage: process[stageIndex].label,
    process: process.map((stage, index) => ({ ...stage, status: index < stageIndex ? 'complete' : index === stageIndex ? 'current' : 'upcoming' })),
    productionDetails: {
      receivedKg: 6500,
      receptionDate: '2026-09-18',
      initialDensity: 1.093,
      receptionTemperature: 14.1,
      rose: {
        style: method === 'cofermentation' ? 'clarete' : 'rosado', method, redGrapePercentage: method === 'cofermentation' ? 40 : 100,
        blendAfterWeighing: true, macerationHours: method === 'direct_press' ? 0 : 18, pressFraction: 'Mosto yema + primera prensada',
        turbidityTarget: 110, protection: 'Inertizado con CO₂', targetColorIntensity: 0.8,
      },
    },
    ...overrides,
  }
}

test('each rosado route exposes only its stage-specific operations', () => {
  const direct = roseAt('direct_press', 'press')
  assert.ok(roseOperationsForLot(direct).includes('direct_pressing'))
  assert.ok(!roseOperationsForLot(direct).includes('gentle_cap_management'))

  const clarete = roseAt('cofermentation', 'cofermentation')
  assert.ok(roseOperationsForLot(clarete).includes('gentle_cap_management'))
  assert.ok(!roseOperationsForLot(clarete).includes('direct_pressing'))

  const saignee = roseAt('saignee', 'saignee')
  assert.deepEqual(roseOperationsForLot(saignee), ['saignee_separation', 'color_check', 'sample'])
})

test('traditional clarete co-fermentation requires planned contact and target colour before separation', () => {
  const lot = roseAt('cofermentation', 'cofermentation')
  assert.equal(roseStageGate(lot, []).reason, 'contact_required')

  const short = recordRoseOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id, type: 'color_check', performedAt: '2026-09-19T12:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { skinContactHours: 12, colorIntensity: 0.82 },
  })
  assert.equal(short.gate.reason, 'contact_required')

  const ready = recordRoseOperation(short.lots, short.tanks, short.tasks, short.events, {
    lotId: lot.id, type: 'color_check', performedAt: '2026-09-19T18:00:00+02:00', operator: 'Elena Martín', notes: 'Objetivo alcanzado.', metrics: { skinContactHours: 18, colorIntensity: 0.82 },
  })
  assert.equal(ready.gate.eligible, true)

  const advanced = advanceRoseStage(ready.lots, ready.tanks, ready.tasks, ready.events, {
    lotId: lot.id, performedAt: '2026-09-19T18:10:00+02:00', operator: 'Elena Martín', notes: 'Separar ahora.',
  })
  assert.equal(advanced.lot.process.find((stage) => stage.status === 'current')?.id, 'press')
})

test('clarete reception keeps composition and separate weighbridge evidence distinct', () => {
  const lot = roseAt('cofermentation', 'reception')
  const composition = recordRoseOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id, type: 'composition_check', performedAt: '2026-09-18T09:00:00+02:00', operator: 'Elena Martín', notes: '',
    metrics: { redGrapePercentage: 40, colorIntensity: 0.8, mixingAfterWeighing: true },
  })
  assert.equal(composition.gate.reason, 'weighing_required')
  const weighed = recordRoseOperation(composition.lots, composition.tanks, composition.tasks, composition.events, {
    lotId: lot.id, type: 'separate_weighing', performedAt: '2026-09-18T09:10:00+02:00', operator: 'Elena Martín', notes: '',
    metrics: { separateWeightsConfirmed: true, mixingAfterWeighing: true },
  })
  assert.equal(weighed.gate.eligible, true)
})

test('short maceration uses its configured contact time and colour target', () => {
  const lot = roseAt('short_maceration', 'maceration')
  const outsideTarget = recordRoseOperation([lot], cellarTanks(), [], [], {
    lotId: lot.id, type: 'skin_contact_check', performedAt: '2026-09-18T18:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { skinContactHours: 18, colorIntensity: 1.1 },
  })
  assert.equal(outsideTarget.gate.reason, 'color_required')
  const ready = recordRoseOperation(outsideTarget.lots, outsideTarget.tanks, outsideTarget.tasks, outsideTarget.events, {
    lotId: lot.id, type: 'color_check', performedAt: '2026-09-18T18:10:00+02:00', operator: 'Elena Martín', notes: '', metrics: { skinContactHours: 18, colorIntensity: 0.78 },
  })
  assert.equal(ready.gate.eligible, true)
})

test('direct press and saignée reconcile output without exceeding grapes or available volume', () => {
  for (const [method, stageId, operation] of [
    ['direct_press', 'press', 'direct_pressing'],
    ['saignee', 'saignee', 'saignee_separation'],
  ] as const) {
    const lot = roseAt(method, stageId)
    assert.throws(() => recordRoseOperation([lot], cellarTanks(), [], [], {
      lotId: lot.id, type: operation, performedAt: '2026-09-19T10:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { freeRunVolume: 4200, pressVolume: 300 },
    }), /available lot volume/i)
    const recorded = recordRoseOperation([lot], cellarTanks(), [], [], {
      lotId: lot.id, type: operation, performedAt: '2026-09-19T10:10:00+02:00', operator: 'Elena Martín', notes: '', metrics: { freeRunVolume: 3900, pressVolume: 350 },
    })
    assert.equal(recorded.lot.volume, 4250)
    assert.equal(recorded.gate.eligible, true)
  }
})

test('settling and cool fermentation retain their own rosado gates', () => {
  const settling = roseAt('direct_press', 'settling')
  const clear = recordRoseOperation([settling], cellarTanks(), [], [], {
    lotId: settling.id, type: 'turbidity_check', performedAt: '2026-09-20T09:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { turbidity: 95 },
  })
  assert.equal(clear.gate.reason, 'racking_required')
  const racked = recordRoseOperation(clear.lots, clear.tanks, clear.tasks, clear.events, {
    lotId: settling.id, type: 'clean_must_racking', performedAt: '2026-09-20T10:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { volumeAfter: 4320, settlingHours: 24 },
  })
  assert.equal(racked.gate.eligible, true)

  const fermenting = roseAt('direct_press', 'af', { density: 1.014 })
  const dry = recordRoseOperation([fermenting], cellarTanks(), [], [], {
    lotId: fermenting.id, type: 'density_check', performedAt: '2026-09-28T17:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { density: 0.994, temperature: 15.5 },
  })
  assert.equal(dry.gate.eligible, true)
})

test('rosado-only operations cannot be recorded on red or white lots', () => {
  for (const lot of lots.filter((item) => item.type === 'tinto' || item.type === 'blanco')) {
    assert.throws(() => recordRoseOperation([structuredClone(lot)], cellarTanks(), [], [], {
      lotId: lot.id, type: 'color_check', performedAt: '2026-09-20T10:00:00+02:00', operator: 'Elena Martín', notes: '', metrics: { colorIntensity: 0.8 },
    }), /rosado or clarete lot/i)
  }
})

test('the current migration preserves v11 events and adds rosado history only when missing', () => {
  const priorEvents = structuredClone(productionEvents.filter((event) => event.wineType !== 'rosado'))
  const migrated = migrateLegacyState({ schemaVersion: 11, lots: structuredClone(lots), tasks: structuredClone(initialTasks), tanks: structuredClone(tanks), productionEvents: priorEvents })
  assert.equal(migrated?.schemaVersion, 19)
  assert.equal(migrated?.productionEvents.filter((event) => event.wineType === 'tinto').length, priorEvents.filter((event) => event.wineType === 'tinto').length)
  assert.equal(migrated?.productionEvents.filter((event) => event.wineType === 'blanco').length, priorEvents.filter((event) => event.wineType === 'blanco').length)
  assert.equal(migrated?.productionEvents.filter((event) => event.wineType === 'rosado').length, 3)
})
