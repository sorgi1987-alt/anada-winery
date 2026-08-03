import type { EligibilityCheckStatus, RiojaStillWineType } from './riojaRules'

export type RiojaOriginCategory = 'rioja' | 'zone' | 'village' | 'single_vineyard'
export type OriginCheckGroup = 'provenance' | 'operation' | 'document'

export type OriginCheckId =
  | 'authorized_grapes' | 'origin_percentage' | 'adjacent_origin' | 'adjacent_link_years'
  | 'same_area_process' | 'same_winery_process' | 'traceability' | 'prior_communication'
  | 'harvest_notice' | 'wine_declaration' | 'qualification' | 'differentiated_movements'
  | 'guarantee_seal' | 'specific_back_label' | 'vineyard_age' | 'manual_harvest'
  | 'exclusive_tenure' | 'maximum_yield' | 'transformation_yield' | 'second_tasting'
  | 'intent_before_june_30' | 'grower_card' | 'exclusive_brand'

export interface RiojaOriginInput {
  category: RiojaOriginCategory
  wineType: RiojaStillWineType
  originPercent: number | null
  authorizedGrapes: boolean | null
  adjacentOrigin: boolean | null
  adjacentLinkYears: number | null
  sameAreaProcess: boolean | null
  sameWineryProcess: boolean | null
  traceabilityComplete: boolean | null
  priorCommunication: boolean | null
  harvestNotice: boolean | null
  wineDeclaration: boolean | null
  qualificationPassed: boolean | null
  differentiatedMovements: boolean | null
  guaranteeSealAssigned: boolean | null
  specificBackLabel: boolean | null
  vineyardAgeYears: number | null
  manualHarvest: boolean | null
  exclusiveTenureYears: number | null
  yieldKgHa: number | null
  transformationYieldPercent: number | null
  secondTastingExcellent: boolean | null
  intentBeforeJune30: boolean | null
  growerCard: boolean | null
  exclusiveBrand: boolean | null
}

export interface OriginEligibilityCheck {
  id: OriginCheckId
  group: OriginCheckGroup
  status: EligibilityCheckStatus
  actual: boolean | number | null
  comparison: 'confirmed' | 'minimum' | 'maximum' | 'exact' | 'range'
  required?: number
  maximum?: number
  unit?: '%' | 'years' | 'kg/ha'
}

export interface RiojaOriginAssessment {
  status: 'eligible' | 'blocked' | 'incomplete'
  checks: OriginEligibilityCheck[]
  passed: number
  required: number
}

export const RIOJA_ORIGIN_RULESET = {
  id: 'DOCa-RIOJA-ORIGIN-2026-08',
  reviewedAt: '2026-08-03',
  sources: {
    rioja: 'https://riojawine.com/es/doca-rioja/denominacion-de-origen-calificada/vino-amparado-por-la-doca/',
    zone: 'https://riojawine.com/es/doca-rioja/denominacion-de-origen-calificada/vino-de-zona/',
    village: 'https://riojawine.com/es/doca-rioja/denominacion-de-origen-calificada/vino-de-pueblo/',
    single_vineyard: 'https://riojawine.com/es/doca-rioja/denominacion-de-origen-calificada/vino-de-vinedo-singular/',
  },
} as const

export const emptyOriginInput = (category: RiojaOriginCategory = 'rioja', wineType: RiojaStillWineType = 'tinto'): RiojaOriginInput => ({
  category, wineType, originPercent: null, authorizedGrapes: null, adjacentOrigin: null, adjacentLinkYears: null,
  sameAreaProcess: null, sameWineryProcess: null, traceabilityComplete: null, priorCommunication: null,
  harvestNotice: null, wineDeclaration: null, qualificationPassed: null, differentiatedMovements: null,
  guaranteeSealAssigned: null, specificBackLabel: null, vineyardAgeYears: null, manualHarvest: null,
  exclusiveTenureYears: null, yieldKgHa: null, transformationYieldPercent: null, secondTastingExcellent: null,
  intentBeforeJune30: null, growerCard: null, exclusiveBrand: null,
})

const confirmed = (id: OriginCheckId, group: OriginCheckGroup, actual: boolean | null): OriginEligibilityCheck => ({
  id, group, actual, comparison: 'confirmed', status: actual == null ? 'missing' : actual ? 'pass' : 'fail',
})

const numberCheck = (id: OriginCheckId, group: OriginCheckGroup, actual: number | null, comparison: 'minimum' | 'maximum' | 'exact', required: number, unit: OriginEligibilityCheck['unit']): OriginEligibilityCheck => ({
  id, group, actual, comparison, required, unit,
  status: actual == null ? 'missing' : comparison === 'minimum' ? actual >= required ? 'pass' : 'fail' : comparison === 'maximum' ? actual <= required ? 'pass' : 'fail' : actual === required ? 'pass' : 'fail',
})

const rangeCheck = (id: OriginCheckId, group: OriginCheckGroup, actual: number | null, required: number, maximum: number, unit: OriginEligibilityCheck['unit']): OriginEligibilityCheck => ({
  id, group, actual, comparison: 'range', required, maximum, unit,
  status: actual == null ? 'missing' : actual >= required && actual <= maximum ? 'pass' : 'fail',
})

const documentaryChecks = (input: RiojaOriginInput): OriginEligibilityCheck[] => [
  confirmed('prior_communication', 'document', input.priorCommunication),
  confirmed('wine_declaration', 'document', input.wineDeclaration),
  confirmed('qualification', 'document', input.qualificationPassed),
  confirmed('differentiated_movements', 'document', input.differentiatedMovements),
  confirmed('specific_back_label', 'document', input.specificBackLabel),
]

export function evaluateRiojaOrigin(input: RiojaOriginInput): RiojaOriginAssessment {
  let checks: OriginEligibilityCheck[]
  if (input.category === 'rioja') {
    checks = [
      confirmed('authorized_grapes', 'provenance', input.authorizedGrapes),
      numberCheck('origin_percentage', 'provenance', input.originPercent, 'exact', 100, '%'),
      confirmed('same_area_process', 'operation', input.sameAreaProcess),
      confirmed('harvest_notice', 'document', input.harvestNotice),
      confirmed('wine_declaration', 'document', input.wineDeclaration),
      confirmed('qualification', 'document', input.qualificationPassed),
      confirmed('guarantee_seal', 'document', input.guaranteeSealAssigned),
      confirmed('traceability', 'document', input.traceabilityComplete),
    ]
  } else if (input.category === 'zone' || input.category === 'village') {
    checks = [
      rangeCheck('origin_percentage', 'provenance', input.originPercent, 85, 100, '%'),
      confirmed('same_area_process', 'operation', input.sameAreaProcess),
      confirmed('traceability', 'document', input.traceabilityComplete),
      ...documentaryChecks(input),
    ]
    if (input.originPercent != null && input.originPercent < 100) {
      checks.splice(1, 0, confirmed('adjacent_origin', 'provenance', input.adjacentOrigin))
      if (input.category === 'zone') checks.splice(2, 0, numberCheck('adjacent_link_years', 'provenance', input.adjacentLinkYears, 'minimum', 10, 'years'))
    }
  } else {
    checks = [
      numberCheck('origin_percentage', 'provenance', input.originPercent, 'exact', 100, '%'),
      confirmed('same_winery_process', 'operation', input.sameWineryProcess),
      numberCheck('vineyard_age', 'provenance', input.vineyardAgeYears, 'minimum', 35, 'years'),
      confirmed('manual_harvest', 'provenance', input.manualHarvest),
      numberCheck('exclusive_tenure', 'document', input.exclusiveTenureYears, 'minimum', 10, 'years'),
      numberCheck('maximum_yield', 'provenance', input.yieldKgHa, 'maximum', input.wineType === 'tinto' ? 5000 : 6922, 'kg/ha'),
      numberCheck('transformation_yield', 'operation', input.transformationYieldPercent, 'maximum', 65, '%'),
      confirmed('second_tasting', 'document', input.secondTastingExcellent),
      confirmed('intent_before_june_30', 'document', input.intentBeforeJune30),
      confirmed('grower_card', 'document', input.growerCard),
      confirmed('specific_back_label', 'document', input.specificBackLabel),
      confirmed('exclusive_brand', 'document', input.exclusiveBrand),
      confirmed('traceability', 'document', input.traceabilityComplete),
    ]
  }
  const failed = checks.some((check) => check.status === 'fail')
  const missing = checks.some((check) => check.status === 'missing')
  return { status: failed ? 'blocked' : missing ? 'incomplete' : 'eligible', checks, passed: checks.filter((check) => check.status === 'pass').length, required: checks.length }
}
