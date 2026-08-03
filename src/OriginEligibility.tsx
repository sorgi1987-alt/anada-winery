import { AlertTriangle, Check, CircleDashed, ExternalLink, FileCheck2, X } from 'lucide-react'
import { useLanguage } from './i18n'
import { emptyOriginInput, evaluateRiojaOrigin, RIOJA_ORIGIN_RULESET, type OriginCheckGroup, type OriginEligibilityCheck, type RiojaOriginCategory, type RiojaOriginInput } from './riojaOriginRules'
import type { RiojaStillWineType } from './riojaRules'

const categories: RiojaOriginCategory[] = ['rioja', 'zone', 'village', 'single_vineyard']
const wineTypes: RiojaStillWineType[] = ['tinto', 'blanco', 'rosado']
const categoryKey = { rioja: 'origin.rioja', zone: 'origin.zone', village: 'origin.village', single_vineyard: 'origin.singleVineyard' } as const
const wineKey = { tinto: 'wine.red', blanco: 'wine.white', rosado: 'wine.rose' } as const
const groupKey = { provenance: 'origin.group.provenance', operation: 'origin.group.operation', document: 'origin.group.document' } as const
const checkLabels = {
  authorized_grapes: 'origin.check.authorizedGrapes', origin_percentage: 'origin.check.originPercentage', adjacent_origin: 'origin.check.adjacentOrigin', adjacent_link_years: 'origin.check.adjacentLinkYears',
  same_area_process: 'origin.check.sameAreaProcess', same_winery_process: 'origin.check.sameWineryProcess', traceability: 'origin.check.traceability', prior_communication: 'origin.check.priorCommunication',
  harvest_notice: 'origin.check.harvestNotice', wine_declaration: 'origin.check.wineDeclaration', qualification: 'origin.check.qualification', differentiated_movements: 'origin.check.differentiatedMovements',
  guarantee_seal: 'origin.check.guaranteeSeal', specific_back_label: 'origin.check.specificBackLabel', vineyard_age: 'origin.check.vineyardAge', manual_harvest: 'origin.check.manualHarvest',
  exclusive_tenure: 'origin.check.exclusiveTenure', maximum_yield: 'origin.check.maximumYield', transformation_yield: 'origin.check.transformationYield', second_tasting: 'origin.check.secondTasting',
  intent_before_june_30: 'origin.check.intentBeforeJune30', grower_card: 'origin.check.growerCard', exclusive_brand: 'origin.check.exclusiveBrand',
} as const

interface OriginEligibilityWorkspaceProps {
  draft: RiojaOriginInput
  onChange: (draft: RiojaOriginInput) => void
}

export function OriginEligibilityWorkspace({ draft, onChange }: OriginEligibilityWorkspaceProps) {
  const { t } = useLanguage()
  const result = evaluateRiojaOrigin(draft)
  const setNumber = (key: keyof RiojaOriginInput, value: string) => onChange({ ...draft, [key]: value === '' ? null : Number(value) })
  const exceptionUsed = (draft.category === 'zone' || draft.category === 'village') && draft.originPercent != null && draft.originPercent < 100
  const booleanFields = draft.category === 'rioja'
    ? ['authorizedGrapes', 'sameAreaProcess', 'harvestNotice', 'wineDeclaration', 'qualificationPassed', 'guaranteeSealAssigned', 'traceabilityComplete'] as const
    : draft.category === 'zone' || draft.category === 'village'
      ? ['sameAreaProcess', ...(exceptionUsed ? ['adjacentOrigin'] as const : []), 'priorCommunication', 'wineDeclaration', 'qualificationPassed', 'differentiatedMovements', 'specificBackLabel', 'traceabilityComplete'] as const
      : ['sameWineryProcess', 'manualHarvest', 'secondTastingExcellent', 'intentBeforeJune30', 'growerCard', 'specificBackLabel', 'exclusiveBrand', 'traceabilityComplete'] as const

  return <section className="origin-workspace">
    <div className="origin-form eligibility-form"><header><span className="eyebrow">{t('origin.planningTool')}</span><h2>{t('origin.checkTitle')}</h2><p>{t('origin.checkText')}</p><a className="origin-rule-source" href={RIOJA_ORIGIN_RULESET.sources[draft.category]} target="_blank" rel="noreferrer"><ExternalLink /> {t('origin.officialRequirements')}</a></header>
      <div className="eligibility-segment origin-category"><span>{t('origin.claim')}</span><div>{categories.map((category) => <button key={category} className={draft.category === category ? 'active' : ''} onClick={() => onChange(emptyOriginInput(category, draft.wineType))}>{t(categoryKey[category])}</button>)}</div></div>
      {draft.category === 'single_vineyard' && <div className="eligibility-segment"><span>{t('compliance.wineType')}</span><div>{wineTypes.map((type) => <button key={type} className={draft.wineType === type ? 'active' : ''} onClick={() => onChange({ ...draft, wineType: type })}>{t(wineKey[type])}</button>)}</div></div>}
      <div className="origin-number-grid"><OriginNumber label={t('origin.originPercentage')} value={draft.originPercent} unit="%" onChange={(value) => setNumber('originPercent', value)} />
        {draft.category === 'zone' && exceptionUsed && <OriginNumber label={t('origin.adjacentLinkYears')} value={draft.adjacentLinkYears} unit={t('origin.years')} onChange={(value) => setNumber('adjacentLinkYears', value)} />}
        {draft.category === 'single_vineyard' && <><OriginNumber label={t('origin.vineyardAge')} value={draft.vineyardAgeYears} unit={t('origin.years')} onChange={(value) => setNumber('vineyardAgeYears', value)} /><OriginNumber label={t('origin.exclusiveTenure')} value={draft.exclusiveTenureYears} unit={t('origin.years')} onChange={(value) => setNumber('exclusiveTenureYears', value)} /><OriginNumber label={t('origin.yield')} value={draft.yieldKgHa} unit="kg/ha" onChange={(value) => setNumber('yieldKgHa', value)} /><OriginNumber label={t('origin.transformationYield')} value={draft.transformationYieldPercent} unit="%" onChange={(value) => setNumber('transformationYieldPercent', value)} /></>}
      </div>
      <div className="origin-evidence"><header><span><FileCheck2 /> {t('origin.evidence')}</span><button onClick={() => onChange(eligibleExample(draft.category, draft.wineType))}>{t('origin.loadExample')}</button></header><div>{booleanFields.map((field) => <EvidenceToggle key={field} label={t(fieldLabel[field])} value={draft[field]} onChange={(value) => onChange({ ...draft, [field]: value })} />)}</div></div>
    </div>
    <OriginAssessment result={result} />
  </section>
}

const fieldLabel = {
  authorizedGrapes: 'origin.check.authorizedGrapes', sameAreaProcess: 'origin.check.sameAreaProcess', harvestNotice: 'origin.check.harvestNotice', wineDeclaration: 'origin.check.wineDeclaration', qualificationPassed: 'origin.check.qualification', guaranteeSealAssigned: 'origin.check.guaranteeSeal', traceabilityComplete: 'origin.check.traceability', adjacentOrigin: 'origin.check.adjacentOrigin', priorCommunication: 'origin.check.priorCommunication', differentiatedMovements: 'origin.check.differentiatedMovements', specificBackLabel: 'origin.check.specificBackLabel', sameWineryProcess: 'origin.check.sameWineryProcess', manualHarvest: 'origin.check.manualHarvest', secondTastingExcellent: 'origin.check.secondTasting', intentBeforeJune30: 'origin.check.intentBeforeJune30', growerCard: 'origin.check.growerCard', exclusiveBrand: 'origin.check.exclusiveBrand',
} as const

function eligibleExample(category: RiojaOriginCategory, wineType: RiojaStillWineType): RiojaOriginInput {
  const base = emptyOriginInput(category, wineType)
  if (category === 'rioja') return { ...base, originPercent: 100, authorizedGrapes: true, sameAreaProcess: true, harvestNotice: true, wineDeclaration: true, qualificationPassed: true, guaranteeSealAssigned: true, traceabilityComplete: true }
  if (category === 'zone' || category === 'village') return { ...base, originPercent: 85, adjacentOrigin: true, adjacentLinkYears: category === 'zone' ? 10 : null, sameAreaProcess: true, priorCommunication: true, wineDeclaration: true, qualificationPassed: true, differentiatedMovements: true, specificBackLabel: true, traceabilityComplete: true }
  return { ...base, originPercent: 100, sameWineryProcess: true, vineyardAgeYears: 42, manualHarvest: true, exclusiveTenureYears: 10, yieldKgHa: wineType === 'tinto' ? 4800 : 6500, transformationYieldPercent: 65, secondTastingExcellent: true, intentBeforeJune30: true, growerCard: true, specificBackLabel: true, exclusiveBrand: true, traceabilityComplete: true }
}

function OriginNumber({ label, value, unit, onChange }: { label: string; value: number | null; unit: string; onChange: (value: string) => void }) { return <label><span>{label}</span><div><input type="number" min="0" step="0.1" value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder="—" /><i>{unit}</i></div></label> }

function EvidenceToggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  const { t } = useLanguage()
  return <div className="evidence-toggle"><span>{label}</span><div><button className={value == null ? 'active unknown' : ''} onClick={() => onChange(null)}>{t('origin.unknown')}</button><button className={value === true ? 'active yes' : ''} onClick={() => onChange(true)}>{t('origin.yes')}</button><button className={value === false ? 'active no' : ''} onClick={() => onChange(false)}>{t('origin.no')}</button></div></div>
}

function OriginAssessment({ result }: { result: ReturnType<typeof evaluateRiojaOrigin> }) {
  const { t } = useLanguage()
  const groups: OriginCheckGroup[] = ['provenance', 'operation', 'document']
  return <aside className={`origin-result eligibility-result ${result.status}`}><header><span>{result.status === 'eligible' ? <Check /> : result.status === 'blocked' ? <X /> : <CircleDashed />}</span><div><small>{t('origin.assessment')}</small><h2>{t(`compliance.status.${result.status}`)}</h2><p>{t(`origin.status.${result.status}Text`)}</p></div><em>{result.passed}/{result.required}</em></header>{groups.map((group) => { const checks = result.checks.filter((check) => check.group === group); return checks.length ? <section key={group}><h3>{t(groupKey[group])}</h3><div>{checks.map((check) => <OriginCheckRow key={check.id} check={check} />)}</div></section> : null })}<footer><AlertTriangle /><span><strong>{t('compliance.internalOnly')}</strong><small>{t('origin.internalOnlyText')}</small></span></footer></aside>
}

function OriginCheckRow({ check }: { check: OriginEligibilityCheck }) {
  const { t } = useLanguage()
  const actual = typeof check.actual === 'boolean' ? check.actual ? t('origin.confirmed') : t('origin.notConfirmed') : check.actual == null ? t('compliance.missing') : `${check.actual} ${check.unit ?? ''}`
  const required = check.comparison === 'confirmed' ? t('origin.requiredConfirmed') : check.comparison === 'range' ? `${check.required}–${check.maximum} ${check.unit ?? ''}` : `${check.comparison === 'minimum' ? '≥' : check.comparison === 'maximum' ? '≤' : '='} ${check.required} ${check.unit ?? ''}`
  return <span className={check.status}><i>{check.status === 'pass' ? <Check /> : check.status === 'fail' ? <X /> : <CircleDashed />}</i><span><strong>{t(checkLabels[check.id])}</strong><small>{actual}</small></span><em>{required}</em></span>
}
