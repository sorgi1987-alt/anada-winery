import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyOriginInput, evaluateRiojaOrigin, RIOJA_ORIGIN_RULESET } from '../src/riojaOriginRules'

test('origin rules are versioned and link every official origin category', () => {
  assert.equal(RIOJA_ORIGIN_RULESET.id, 'DOCa-RIOJA-ORIGIN-2026-08')
  assert.deepEqual(Object.keys(RIOJA_ORIGIN_RULESET.sources), ['rioja', 'zone', 'village', 'single_vineyard'])
})

test('Vino de Zona allows at most fifteen percent from adjacent municipalities with ten-year linkage', () => {
  const input = { ...emptyOriginInput('zone'), originPercent: 85, adjacentOrigin: true, adjacentLinkYears: 10, sameAreaProcess: true, traceabilityComplete: true, priorCommunication: true, wineDeclaration: true, qualificationPassed: true, differentiatedMovements: true, specificBackLabel: true }
  assert.equal(evaluateRiojaOrigin(input).status, 'eligible')
  assert.equal(evaluateRiojaOrigin({ ...input, adjacentLinkYears: 9 }).status, 'blocked')
  assert.equal(evaluateRiojaOrigin({ ...input, originPercent: 101 }).status, 'blocked')
})

test('Vino de Pueblo accepts the fifteen-percent adjacent origin exception without inventing a tenure rule', () => {
  const input = { ...emptyOriginInput('village'), originPercent: 85, adjacentOrigin: true, sameAreaProcess: true, traceabilityComplete: true, priorCommunication: true, wineDeclaration: true, qualificationPassed: true, differentiatedMovements: true, specificBackLabel: true }
  const result = evaluateRiojaOrigin(input)
  assert.equal(result.status, 'eligible')
  assert.equal(result.checks.some((check) => check.id === 'adjacent_link_years'), false)
})

test('Viñedo Singular applies distinct red and white maximum vineyard yields', () => {
  const red = evaluateRiojaOrigin({ ...emptyOriginInput('single_vineyard', 'tinto'), yieldKgHa: 5001 })
  const white = evaluateRiojaOrigin({ ...emptyOriginInput('single_vineyard', 'blanco'), yieldKgHa: 5001 })
  assert.equal(red.checks.find((check) => check.id === 'maximum_yield')?.status, 'fail')
  assert.equal(white.checks.find((check) => check.id === 'maximum_yield')?.status, 'pass')
})

test('a complete Viñedo Singular dossier passes all encoded internal checks', () => {
  const result = evaluateRiojaOrigin({ ...emptyOriginInput('single_vineyard', 'tinto'), originPercent: 100, sameWineryProcess: true, vineyardAgeYears: 35, manualHarvest: true, exclusiveTenureYears: 10, yieldKgHa: 4800, transformationYieldPercent: 65, secondTastingExcellent: true, intentBeforeJune30: true, growerCard: true, specificBackLabel: true, exclusiveBrand: true, traceabilityComplete: true })
  assert.equal(result.status, 'eligible')
  assert.equal(result.passed, result.required)
})

test('missing documentary evidence remains incomplete while a known breach blocks', () => {
  assert.equal(evaluateRiojaOrigin(emptyOriginInput('rioja')).status, 'incomplete')
  assert.equal(evaluateRiojaOrigin({ ...emptyOriginInput('rioja'), originPercent: 90 }).status, 'blocked')
})
