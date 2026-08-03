import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, BookOpen, Check, CircleDashed, Clock3, FileCheck2, Grape, ShieldCheck, Wine, X } from 'lucide-react'
import { useLanguage } from './i18n'
import { OriginEligibilityWorkspace } from './OriginEligibility'
import { emptyOriginInput, type RiojaOriginCategory, type RiojaOriginInput } from './riojaOriginRules'
import { ageingThresholds, evaluateRiojaAgeing, RIOJA_RULESET, type EligibilityCheck, type RiojaAgeingInput, type RiojaStillWineType } from './riojaRules'
import type { BottlingOrder, RiojaAgeingMention } from './types'

interface RiojaCompliancePageProps { orders: BottlingOrder[] }

const mentions: RiojaAgeingMention[] = ['generic', 'crianza', 'reserva', 'gran_reserva']
const wineTypes: RiojaStillWineType[] = ['tinto', 'blanco', 'rosado']
const mentionKey = { generic: 'compliance.generic', crianza: 'compliance.crianza', reserva: 'compliance.reserva', gran_reserva: 'compliance.granReserva' } as const
const wineKey = { tinto: 'wine.red', blanco: 'wine.white', rosado: 'wine.rose' } as const
const checkKey = { alcohol: 'compliance.alcohol', total_ageing: 'compliance.totalAgeing', oak_ageing: 'compliance.oakAgeing', bottle_ageing: 'compliance.bottleAgeing', oak_capacity: 'compliance.oakCapacity' } as const

const emptyAssessment = (wineType: RiojaStillWineType = 'tinto', mention: RiojaAgeingMention = 'crianza'): RiojaAgeingInput => ({ wineType, mention, alcohol: null, totalMonths: null, oakMonths: null, bottleMonths: null, oakCapacityLitres: null })

export function RiojaCompliancePage({ orders }: RiojaCompliancePageProps) {
  const { t, locale } = useLanguage()
  const [view, setView] = useState<'portfolio' | 'checker' | 'origin' | 'rulebook'>('portfolio')
  const [draft, setDraft] = useState<RiojaAgeingInput>(() => ({ wineType: 'tinto', mention: 'crianza', alcohol: 11.5, totalMonths: 24, oakMonths: 12, bottleMonths: 6, oakCapacityLitres: 225 }))
  const [originDraft, setOriginDraft] = useState<RiojaOriginInput>(() => emptyOriginInput('village', 'blanco'))
  const result = useMemo(() => evaluateRiojaAgeing(draft), [draft])
  const protectedOrders = orders.filter((order) => order.ageingMention !== 'generic').length
  const specificOrigin = orders.filter((order) => order.originMention !== 'rioja').length

  const assessOrder = (order: BottlingOrder) => {
    setDraft(emptyAssessment(order.type, order.ageingMention))
    setView('checker')
  }
  const assessOriginOrder = (order: BottlingOrder) => {
    const category: RiojaOriginCategory = order.originMention === 'vino_de_pueblo' ? 'village' : order.originMention === 'vinedo_singular' ? 'single_vineyard' : 'rioja'
    setOriginDraft(emptyOriginInput(category, order.type))
    setView('origin')
  }

  return <main className="compliance-page">
    <header className="page-header"><div><span className="eyebrow">{t('compliance.kicker')}</span><h1>{t('compliance.title')}</h1><p>{t('compliance.description')}</p></div><div className="compliance-version"><ShieldCheck /><span><strong>{RIOJA_RULESET.id}</strong><small>{t('compliance.reviewed')}</small></span></div></header>
    <section className="compliance-hero"><div><span className="compliance-hero-mark"><Grape /></span><span className="eyebrow">{t('compliance.internalControl')}</span><h2>{t('compliance.heroTitle')}</h2><p>{t('compliance.heroText')}</p></div><aside><AlertTriangle /><span><strong>{t('compliance.notCertification')}</strong><small>{t('compliance.notCertificationText')}</small></span></aside></section>
    <section className="compliance-metrics"><Metric icon={<FileCheck2 />} value={String(orders.length)} label={t('compliance.orders')} detail={t('compliance.inPortfolio')} /><Metric icon={<Wine />} value={String(protectedOrders)} label={t('compliance.protectedMentions')} detail={t('compliance.requireEvidence')} /><Metric icon={<Grape />} value={String(specificOrigin)} label={t('compliance.originClaims')} detail={t('compliance.nextCheckpoint')} /><Metric icon={<CircleDashed />} value="0" label={t('compliance.completeDossiers')} detail={t('compliance.evidenceDeferred')} /></section>
    <div className="compliance-tabs" role="tablist">{(['portfolio', 'checker', 'origin', 'rulebook'] as const).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item === 'portfolio' ? <FileCheck2 /> : item === 'checker' || item === 'origin' ? <ShieldCheck /> : <BookOpen />}{t(`compliance.${item}`)}</button>)}</div>
    {view === 'portfolio' && <Portfolio orders={orders} onAssess={assessOrder} onAssessOrigin={assessOriginOrder} />}
    {view === 'checker' && <EligibilityChecker draft={draft} result={result} onChange={setDraft} />}
    {view === 'origin' && <OriginEligibilityWorkspace draft={originDraft} onChange={setOriginDraft} />}
    {view === 'rulebook' && <Rulebook wineType={draft.wineType} onWineType={(wineType) => setDraft({ ...draft, wineType })} />}
    <footer className="compliance-source-note"><BookOpen /><span><strong>{t('compliance.sources')}</strong><small>{t('compliance.sourcesText')}</small></span><nav><a href={RIOJA_RULESET.classificationSource} target="_blank" rel="noreferrer">{t('compliance.classificationSource')}</a><a href={RIOJA_RULESET.alcoholSource} target="_blank" rel="noreferrer">{t('compliance.alcoholSource')}</a></nav><time>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${RIOJA_RULESET.reviewedAt}T12:00:00`))}</time></footer>
  </main>
}

function Metric({ icon, value, label, detail }: { icon: ReactNode; value: string; label: string; detail: string }) { return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article> }

function Portfolio({ orders, onAssess, onAssessOrigin }: { orders: BottlingOrder[]; onAssess: (order: BottlingOrder) => void; onAssessOrigin: (order: BottlingOrder) => void }) {
  const { t, locale } = useLanguage()
  return <section className="compliance-portfolio"><header><div><h2>{t('compliance.portfolioTitle')}</h2><p>{t('compliance.portfolioText')}</p></div><span><CircleDashed /> {t('compliance.awaitingEvidence', { count: orders.length })}</span></header><div>{orders.map((order) => <article key={order.id} className={order.type}><div className="compliance-order-bottle"><i /><span>{order.vintage}</span></div><div className="compliance-order-copy"><span className="eyebrow">{order.code} · {t(wineKey[order.type])}</span><h3>{order.wineName}</h3><p>{t(mentionKey[order.ageingMention])} · {order.originMention === 'rioja' ? 'DOCa Rioja' : order.originMention === 'vino_de_pueblo' ? t('compliance.villageWine') : t('compliance.singleVineyard')}</p><div><span><Clock3 /><small>{t('compliance.bottlingDate')}</small><strong>{new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(order.scheduledAt))}</strong></span><span><CircleDashed /><small>{t('compliance.ageingEvidence')}</small><strong>{t('compliance.notLinked')}</strong></span></div></div><div className="compliance-order-actions"><button onClick={() => onAssess(order)}>{t('compliance.assessAgeing')}</button><button onClick={() => onAssessOrigin(order)}>{t('compliance.assessOrigin')} <ArrowRight /></button></div></article>)}</div></section>
}

function EligibilityChecker({ draft, result, onChange }: { draft: RiojaAgeingInput; result: ReturnType<typeof evaluateRiojaAgeing>; onChange: (draft: RiojaAgeingInput) => void }) {
  const { t } = useLanguage()
  const thresholds = ageingThresholds(draft.wineType, draft.mention)
  const number = (key: keyof RiojaAgeingInput, value: string) => onChange({ ...draft, [key]: value === '' ? null : Number(value) })
  return <section className="eligibility-workspace"><div className="eligibility-form"><header><span className="eyebrow">{t('compliance.planningTool')}</span><h2>{t('compliance.checkTitle')}</h2><p>{t('compliance.checkText')}</p></header><div className="eligibility-segment"><span>{t('compliance.wineType')}</span><div>{wineTypes.map((type) => <button key={type} className={draft.wineType === type ? 'active' : ''} onClick={() => onChange({ ...draft, wineType: type })}>{t(wineKey[type])}</button>)}</div></div><div className="eligibility-segment"><span>{t('compliance.targetMention')}</span><div>{mentions.map((mention) => <button key={mention} className={draft.mention === mention ? 'active' : ''} onClick={() => onChange({ ...emptyAssessment(draft.wineType, mention), alcohol: draft.alcohol })}>{t(mentionKey[mention])}</button>)}</div></div><div className="eligibility-fields"><NumberField label={t('compliance.alcohol')} value={draft.alcohol} unit="% vol" onChange={(value) => number('alcohol', value)} />{thresholds.totalMonths != null && <NumberField label={t('compliance.totalAgeing')} value={draft.totalMonths} unit={t('compliance.months')} onChange={(value) => number('totalMonths', value)} />}{thresholds.oakMonths != null && <NumberField label={t('compliance.oakAgeing')} value={draft.oakMonths} unit={t('compliance.months')} onChange={(value) => number('oakMonths', value)} />}{thresholds.bottleMonths != null && <NumberField label={t('compliance.bottleAgeing')} value={draft.bottleMonths} unit={t('compliance.months')} onChange={(value) => number('bottleMonths', value)} />}{thresholds.oakCapacityLitres != null && <NumberField label={t('compliance.oakCapacity')} value={draft.oakCapacityLitres} unit="L" onChange={(value) => number('oakCapacityLitres', value)} />}</div></div><AssessmentResult result={result} /></section>
}

function NumberField({ label, value, unit, onChange }: { label: string; value: number | null; unit: string; onChange: (value: string) => void }) { return <label><span>{label}</span><div><input type="number" min="0" step="0.1" value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder="—" /><i>{unit}</i></div></label> }

function AssessmentResult({ result }: { result: ReturnType<typeof evaluateRiojaAgeing> }) {
  const { t } = useLanguage()
  return <aside className={`eligibility-result ${result.status}`}><header><span>{result.status === 'eligible' ? <Check /> : result.status === 'blocked' ? <X /> : <CircleDashed />}</span><div><small>{t('compliance.assessment')}</small><h2>{t(`compliance.status.${result.status}`)}</h2><p>{t(`compliance.status.${result.status}Text`)}</p></div><em>{result.passed}/{result.required}</em></header><div>{result.checks.map((check) => <CheckRow key={check.id} check={check} />)}</div><footer><AlertTriangle /><span><strong>{t('compliance.internalOnly')}</strong><small>{t('compliance.internalOnlyText')}</small></span></footer></aside>
}

function CheckRow({ check }: { check: EligibilityCheck }) {
  const { t } = useLanguage()
  const actual = check.actual == null ? t('compliance.missing') : `${check.actual} ${check.unit === 'months' ? t('compliance.months') : check.unit}`
  const required = `${check.comparison === 'minimum' ? '≥' : '='} ${check.required} ${check.unit === 'months' ? t('compliance.months') : check.unit}`
  return <span className={check.status}><i>{check.status === 'pass' ? <Check /> : check.status === 'fail' ? <X /> : <CircleDashed />}</i><span><strong>{t(checkKey[check.id])}</strong><small>{actual}</small></span><em>{required}</em></span>
}

function Rulebook({ wineType, onWineType }: { wineType: RiojaStillWineType; onWineType: (type: RiojaStillWineType) => void }) {
  const { t } = useLanguage()
  return <section className="rulebook"><header><div><h2>{t('compliance.rulebookTitle')}</h2><p>{t('compliance.rulebookText')}</p></div><div>{wineTypes.map((type) => <button key={type} className={wineType === type ? 'active' : ''} onClick={() => onWineType(type)}>{t(wineKey[type])}</button>)}</div></header><div>{mentions.map((mention) => { const rule = ageingThresholds(wineType, mention); return <article key={mention} className={mention}><span className="rulebook-number">{String(mentions.indexOf(mention) + 1).padStart(2, '0')}</span><h3>{t(mentionKey[mention])}</h3><p>{mention === 'generic' ? t('compliance.genericText') : t('compliance.ageingMentionText')}</p><div><RuleValue label={t('compliance.minimumAlcohol')} value={`${rule.alcohol}%`} />{rule.totalMonths != null && <RuleValue label={t('compliance.totalAgeing')} value={`${rule.totalMonths} ${t('compliance.months')}`} />}{rule.oakMonths != null && <RuleValue label={t('compliance.oakAgeing')} value={`${rule.oakMonths} ${t('compliance.months')}`} />}{rule.bottleMonths != null && <RuleValue label={t('compliance.bottleAgeing')} value={`${rule.bottleMonths} ${t('compliance.months')}`} />}</div></article> })}</div></section>
}

function RuleValue({ label, value }: { label: string; value: string }) { return <span><small>{label}</small><strong>{value}</strong></span> }
