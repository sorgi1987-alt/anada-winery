import assert from 'node:assert/strict'
import test from 'node:test'
import { ageingThresholds, evaluateRiojaAgeing, RIOJA_RULESET } from '../src/riojaRules'

test('the Rioja rule set is explicitly versioned and traceable to official sources', () => {
  assert.equal(RIOJA_RULESET.id, 'DOCa-RIOJA-2025-08')
  assert.match(RIOJA_RULESET.classificationSource, /^https:\/\/riojawine\.com\//)
  assert.match(RIOJA_RULESET.alcoholSource, /^https:\/\/riojawine\.com\//)
})

test('red Reserva requires 36 total, 12 oak and 6 bottle months', () => {
  assert.deepEqual(ageingThresholds('tinto', 'reserva'), {
    alcohol: 12, totalMonths: 36, oakMonths: 12, bottleMonths: 6, oakCapacityLitres: 225,
  })
})

test('red Gran Reserva passes only with the complete minimum evidence', () => {
  const result = evaluateRiojaAgeing({ wineType: 'tinto', mention: 'gran_reserva', alcohol: 13.5, totalMonths: 60, oakMonths: 24, bottleMonths: 24, oakCapacityLitres: 225 })
  assert.equal(result.status, 'eligible')
  assert.equal(result.passed, result.required)
})

test('white Crianza applies the distinct six-month oak minimum', () => {
  const result = evaluateRiojaAgeing({ wineType: 'blanco', mention: 'crianza', alcohol: 11, totalMonths: 24, oakMonths: 6, bottleMonths: 0, oakCapacityLitres: 225 })
  assert.equal(result.status, 'eligible')
  assert.equal(result.checks.find((check) => check.id === 'oak_ageing')?.required, 6)
})

test('a failed value blocks while absent evidence remains incomplete', () => {
  const blocked = evaluateRiojaAgeing({ wineType: 'tinto', mention: 'crianza', alcohol: 11, totalMonths: 24, oakMonths: 12, bottleMonths: null, oakCapacityLitres: 225 })
  assert.equal(blocked.status, 'blocked')
  const incomplete = evaluateRiojaAgeing({ wineType: 'tinto', mention: 'crianza', alcohol: null, totalMonths: 24, oakMonths: 12, bottleMonths: null, oakCapacityLitres: 225 })
  assert.equal(incomplete.status, 'incomplete')
})

test('generic lower-alcohol limits remain distinct for red and light wines', () => {
  assert.equal(ageingThresholds('tinto', 'generic').alcohol, 10)
  assert.equal(ageingThresholds('blanco', 'generic').alcohol, 9)
  assert.equal(ageingThresholds('rosado', 'generic').alcohol, 9)
})
