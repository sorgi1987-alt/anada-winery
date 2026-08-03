import type { RiojaAgeingMention } from './types'

export type RiojaStillWineType = 'tinto' | 'blanco' | 'rosado'
export type EligibilityCheckStatus = 'pass' | 'fail' | 'missing'

export interface RiojaAgeingInput {
  wineType: RiojaStillWineType
  mention: RiojaAgeingMention
  alcohol: number | null
  totalMonths: number | null
  oakMonths: number | null
  bottleMonths: number | null
  oakCapacityLitres: number | null
}

export interface EligibilityCheck {
  id: 'alcohol' | 'total_ageing' | 'oak_ageing' | 'bottle_ageing' | 'oak_capacity'
  status: EligibilityCheckStatus
  actual: number | null
  required: number
  unit: '% vol' | 'months' | 'L'
  comparison: 'minimum' | 'exact'
}

export interface RiojaAgeingAssessment {
  status: 'eligible' | 'blocked' | 'incomplete'
  checks: EligibilityCheck[]
  passed: number
  required: number
}

export const RIOJA_RULESET = {
  id: 'DOCa-RIOJA-2025-08',
  label: 'DOCa Rioja · control interno 2025-08',
  reviewedAt: '2026-08-03',
  classificationSource: 'https://riojawine.com/es/doca-rioja/denominacion-de-origen-calificada/',
  alcoholSource: 'https://riojawine.com/en-gb/news/the-regulatory-council-approves-new-labeling-mentions-and-lower-alcohol-wines/',
} as const

interface AgeingThresholds {
  alcohol: number
  totalMonths?: number
  oakMonths?: number
  bottleMonths?: number
  oakCapacityLitres?: number
}

const family = (wineType: RiojaStillWineType) => wineType === 'tinto' ? 'red' : 'light'

export function ageingThresholds(wineType: RiojaStillWineType, mention: RiojaAgeingMention): AgeingThresholds {
  const red = family(wineType) === 'red'
  if (mention === 'generic') return { alcohol: red ? 10 : 9 }
  if (mention === 'crianza') return { alcohol: red ? 11.5 : 10.5, totalMonths: 24, oakMonths: red ? 12 : 6, oakCapacityLitres: 225 }
  if (mention === 'reserva') return { alcohol: red ? 12 : 11, totalMonths: red ? 36 : 24, oakMonths: red ? 12 : 6, bottleMonths: red ? 6 : undefined, oakCapacityLitres: 225 }
  return { alcohol: red ? 12 : 11, totalMonths: red ? 60 : 48, oakMonths: red ? 24 : 6, bottleMonths: red ? 24 : undefined, oakCapacityLitres: 225 }
}

function minimumCheck(id: EligibilityCheck['id'], actual: number | null, required: number, unit: EligibilityCheck['unit']): EligibilityCheck {
  return { id, actual, required, unit, comparison: 'minimum', status: actual == null ? 'missing' : actual >= required ? 'pass' : 'fail' }
}

function exactCheck(id: EligibilityCheck['id'], actual: number | null, required: number, unit: EligibilityCheck['unit']): EligibilityCheck {
  return { id, actual, required, unit, comparison: 'exact', status: actual == null ? 'missing' : actual === required ? 'pass' : 'fail' }
}

export function evaluateRiojaAgeing(input: RiojaAgeingInput): RiojaAgeingAssessment {
  const thresholds = ageingThresholds(input.wineType, input.mention)
  const checks: EligibilityCheck[] = [minimumCheck('alcohol', input.alcohol, thresholds.alcohol, '% vol')]
  if (thresholds.totalMonths != null) checks.push(minimumCheck('total_ageing', input.totalMonths, thresholds.totalMonths, 'months'))
  if (thresholds.oakMonths != null) checks.push(minimumCheck('oak_ageing', input.oakMonths, thresholds.oakMonths, 'months'))
  if (thresholds.bottleMonths != null) checks.push(minimumCheck('bottle_ageing', input.bottleMonths, thresholds.bottleMonths, 'months'))
  if (thresholds.oakCapacityLitres != null) checks.push(exactCheck('oak_capacity', input.oakCapacityLitres, thresholds.oakCapacityLitres, 'L'))
  const failed = checks.some((check) => check.status === 'fail')
  const missing = checks.some((check) => check.status === 'missing')
  return {
    status: failed ? 'blocked' : missing ? 'incomplete' : 'eligible',
    checks,
    passed: checks.filter((check) => check.status === 'pass').length,
    required: checks.length,
  }
}
