import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, Beaker, Check, CheckCircle2, ChevronRight,
  Clock3, Droplets, FlaskConical, Grape, MapPin, Plus, Search, ShieldCheck,
  Sparkles, Thermometer, Wine, X,
} from 'lucide-react'
import { images } from './data'
import { labAnalysisProfiles, labAnalysisUnits } from './domain'
import { useLanguage } from './i18n'
import type {
  GrapeDelivery, LabAnalysisKey, LabProfile, LabResultsInput, LabSample,
  LabSampleSource, NewLabSampleInput, VineyardParcel, WineLot,
} from './types'

const sampleStatusKeys = {
  queued: 'lab.statusQueued', in_analysis: 'lab.statusInAnalysis', review: 'lab.statusReview', validated: 'lab.statusValidated',
} as const

const priorityKeys = { urgent: 'lab.priorityUrgent', today: 'lab.priorityToday', routine: 'lab.priorityRoutine' } as const
const profileKeys: Record<LabProfile, 'lab.profileMaturity' | 'lab.profileFermentation' | 'lab.profileMalolactic' | 'lab.profileBottling'> = {
  maturity: 'lab.profileMaturity', fermentation: 'lab.profileFermentation', malolactic: 'lab.profileMalolactic', bottling: 'lab.profileBottling',
}
const analysisKeys: Record<LabAnalysisKey, 'lab.analysisTemperature' | 'lab.analysisDensity' | 'lab.analysisPh' | 'lab.analysisTotalAcidity' | 'lab.analysisVolatileAcidity' | 'lab.analysisPotentialAlcohol' | 'lab.analysisMalicAcid' | 'lab.analysisFreeSo2' | 'lab.analysisTotalSo2' | 'lab.analysisTurbidity' | 'lab.analysisResidualSugar'> = {
  temperature: 'lab.analysisTemperature', density: 'lab.analysisDensity', ph: 'lab.analysisPh', total_acidity: 'lab.analysisTotalAcidity',
  volatile_acidity: 'lab.analysisVolatileAcidity', potential_alcohol: 'lab.analysisPotentialAlcohol', malic_acid: 'lab.analysisMalicAcid',
  free_so2: 'lab.analysisFreeSo2', total_so2: 'lab.analysisTotalSo2', turbidity: 'lab.analysisTurbidity', residual_sugar: 'lab.analysisResidualSugar',
}

const formatSampleDate = (value: string, locale: string) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

interface LaboratoryPageProps {
  samples: LabSample[]
  lots: WineLot[]
  deliveries: GrapeDelivery[]
  parcels: VineyardParcel[]
  onCreate: (input: NewLabSampleInput) => void
  onRecordResults: (input: LabResultsInput) => void
}

export function LaboratoryPage({ samples, lots, deliveries, parcels, onCreate, onRecordResults }: LaboratoryPageProps) {
  const [view, setView] = useState<'queue' | 'results'>('queue')
  const [filter, setFilter] = useState<'all' | 'pending' | 'review'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newSampleOpen, setNewSampleOpen] = useState(false)
  const [resultSampleId, setResultSampleId] = useState<string | null>(null)
  const { t } = useLanguage()
  const pending = samples.filter((sample) => sample.status === 'queued' || sample.status === 'in_analysis')
  const reviews = samples.filter((sample) => sample.status === 'review')
  const validated = samples.filter((sample) => sample.status === 'validated')
  const selected = samples.find((sample) => sample.id === selectedId)
  const resultSample = samples.find((sample) => sample.id === resultSampleId)
  const filtered = samples.filter((sample) => filter === 'all' || (filter === 'pending' ? sample.status === 'queued' || sample.status === 'in_analysis' : sample.status === 'review'))

  return (
    <main className="laboratory-page">
      <header className="page-header">
        <div><span className="eyebrow">{t('lab.kicker')}</span><h1>{t('lab.title')}</h1><p>{t('lab.description')}</p></div>
        <div className="page-header-action"><button className="primary-button" onClick={() => setNewSampleOpen(true)}><Plus size={18} /> {t('lab.newSample')}</button></div>
      </header>

      <section className="lab-hero" style={{ backgroundImage: `url(${images.laboratory})` }}>
        <div className="lab-hero-overlay" />
        <div className="lab-hero-copy"><span className="lab-live"><Activity size={15} /> {t('lab.active')}</span><h2>{t('lab.heroTitle')}</h2><p>{t('lab.heroText')}</p><div className="lab-hero-badges"><span><CheckCircle2 size={16} /> {t('lab.traceable')}</span><span><ShieldCheck size={16} /> {t('lab.contextLimits')}</span></div></div>
        <div className="lab-focus-card"><span className="lab-focus-icon"><FlaskConical /></span><div><small>{t('lab.nextPriority')}</small><strong>LAB-26-085</strong><span>T-26-017 · {t('lab.profileFermentation')}</span></div><em>14:00</em></div>
      </section>

      <section className="lab-metrics" aria-label={t('lab.summary')}>
        <LabMetric icon={<FlaskConical />} label={t('lab.pendingSamples')} value={String(pending.length)} detail={t('lab.dueToday', { count: pending.length })} tone="wine" />
        <LabMetric icon={<AlertTriangle />} label={t('lab.reviewRequired')} value={String(reviews.length)} detail={t('lab.parametersOutside', { count: reviews.reduce((total, sample) => total + sample.results.filter((result) => result.status !== 'normal').length, 0) })} tone="warning" />
        <LabMetric icon={<Clock3 />} label={t('lab.averageTime')} value="47 min" detail={t('lab.fromCollection')} tone="blue" />
        <LabMetric icon={<ShieldCheck />} label={t('lab.validatedToday')} value={String(validated.length)} detail={t('lab.signedResults')} tone="green" />
      </section>

      <div className="lab-toolbar">
        <div className="harvest-tabs lab-tabs" role="tablist"><button role="tab" aria-selected={view === 'queue'} className={view === 'queue' ? 'active' : ''} onClick={() => setView('queue')}>{t('lab.queue')}</button><button role="tab" aria-selected={view === 'results'} className={view === 'results' ? 'active' : ''} onClick={() => setView('results')}>{t('lab.results')}</button></div>
        <div className="filter-chips">{([['all', t('lab.all')], ['pending', t('lab.pending')], ['review', t('lab.review')]] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
      </div>

      {view === 'queue' ? (
        <section className="lab-workspace">
          <div className="panel sample-queue-panel">
            <LabSectionHeading title={t('lab.sampleQueue')} subtitle={t('lab.sampleQueueText')} />
            <div className="sample-list">{filtered.map((sample) => <SampleRow key={sample.id} sample={sample} onOpen={() => setSelectedId(sample.id)} />)}</div>
            {!filtered.length && <div className="lab-empty"><Search size={24} /><strong>{t('lab.noSamples')}</strong><span>{t('lab.changeFilter')}</span></div>}
          </div>
          <QualityPanel samples={samples} />
        </section>
      ) : <ResultsBoard samples={filtered} onOpen={(id) => setSelectedId(id)} />}

      {selected && <SampleDrawer sample={selected} onClose={() => setSelectedId(null)} onEnterResults={() => { setSelectedId(null); setResultSampleId(selected.id) }} />}
      {newSampleOpen && <NewSampleSheet lots={lots} deliveries={deliveries} parcels={parcels} onClose={() => setNewSampleOpen(false)} onCreate={(input) => { onCreate(input); setNewSampleOpen(false) }} />}
      {resultSample && <LabResultSheet sample={resultSample} onClose={() => setResultSampleId(null)} onSave={(input) => { onRecordResults(input); setResultSampleId(null) }} />}
    </main>
  )
}

function LabMetric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className="lab-metric"><span className={`lab-metric-icon ${tone}`}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article>
}

function LabSectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="lab-section-heading"><h2>{title}</h2><p>{subtitle}</p></header>
}

function SampleRow({ sample, onOpen }: { sample: LabSample; onOpen: () => void }) {
  const { t, locale } = useLanguage()
  return <button className={`sample-row ${sample.status}`} onClick={onOpen}><span className="sample-vial"><i /><FlaskConical size={18} /></span><span className="sample-main"><small>{sample.code} · {t(profileKeys[sample.profile])}</small><strong>{sample.sourceId} · {sample.sourceName}</strong><em>{formatSampleDate(sample.collectedAt, locale)} · {sample.assignedTo}</em></span><span className="sample-analyses">{sample.requestedAnalyses.slice(0, 3).map((analysis) => <i key={analysis}>{t(analysisKeys[analysis])}</i>)}{sample.requestedAnalyses.length > 3 && <i>+{sample.requestedAnalyses.length - 3}</i>}</span><span className={`sample-priority ${sample.priority}`}>{t(priorityKeys[sample.priority])}</span><span className={`sample-status ${sample.status}`}>{t(sampleStatusKeys[sample.status])}</span><ChevronRight size={17} /></button>
}

function QualityPanel({ samples }: { samples: LabSample[] }) {
  const { t } = useLanguage()
  const results = samples.flatMap((sample) => sample.results)
  const normal = results.filter((result) => result.status === 'normal').length
  const rate = results.length ? Math.round(normal / results.length * 100) : 100
  return <aside className="panel lab-quality-panel"><LabSectionHeading title={t('lab.qualityOverview')} subtitle={t('lab.lastValidated')} /><div className="quality-ring" style={{ '--quality-progress': `${rate * 3.6}deg` } as CSSProperties}><span><strong>{rate}%</strong><small>{t('lab.withinRange')}</small></span></div><div className="quality-breakdown"><span><i className="normal" /><strong>{normal}</strong><small>{t('lab.normalResults')}</small></span><span><i className="warning" /><strong>{results.filter((result) => result.status === 'warning').length}</strong><small>{t('lab.warningResults')}</small></span><span><i className="critical" /><strong>{results.filter((result) => result.status === 'critical').length}</strong><small>{t('lab.criticalResults')}</small></span></div><div className="lab-method-card"><Sparkles size={18} /><span><strong>{t('lab.smartLimits')}</strong><small>{t('lab.smartLimitsText')}</small></span></div></aside>
}

function ResultsBoard({ samples, onOpen }: { samples: LabSample[]; onOpen: (id: string) => void }) {
  const { t, locale } = useLanguage()
  const completed = samples.filter((sample) => sample.results.length)
  return <section className="panel lab-results-board"><LabSectionHeading title={t('lab.resultsRegister')} subtitle={t('lab.resultsRegisterText')} /><div className="lab-results-head"><span>{t('lab.sample')}</span><span>{t('lab.source')}</span><span>{t('lab.profile')}</span><span>{t('lab.keyResults')}</span><span>{t('lab.validation')}</span></div><div className="lab-results-list">{completed.map((sample) => <button key={sample.id} className="lab-result-row" onClick={() => onOpen(sample.id)}><span><strong>{sample.code}</strong><small>{formatSampleDate(sample.collectedAt, locale)}</small></span><span><strong>{sample.sourceId}</strong><small>{sample.sourceName}</small></span><span><strong>{t(profileKeys[sample.profile])}</strong><small>{sample.results.length} {t('lab.parameters')}</small></span><span className="result-chip-row">{sample.results.slice(0, 3).map((result) => <i className={result.status} key={result.analysis}>{result.value} {result.unit}</i>)}</span><span className={`sample-status ${sample.status}`}>{t(sampleStatusKeys[sample.status])}</span></button>)}</div></section>
}

function SampleDrawer({ sample, onClose, onEnterResults }: { sample: LabSample; onClose: () => void; onEnterResults: () => void }) {
  const { t, d, locale } = useLanguage()
  return <div className="sheet-layer"><button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} /><aside className="sample-drawer"><header className="drawer-head"><div><span className="eyebrow">{sample.code}</span><h2>{sample.sourceId}</h2><p>{sample.sourceName}</p></div><button className="icon-button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></header><div className="sample-drawer-status"><span className={`sample-status ${sample.status}`}>{t(sampleStatusKeys[sample.status])}</span><span className={`sample-priority ${sample.priority}`}>{t(priorityKeys[sample.priority])}</span></div><section className="sample-trace-card"><MapPin size={18} /><span><small>{t('lab.traceableSource')}</small><strong>{sample.sourceType === 'lot' ? t('lab.sourceLot') : sample.sourceType === 'delivery' ? t('lab.sourceDelivery') : t('lab.sourceParcel')} · {sample.sourceId}</strong><em>{formatSampleDate(sample.collectedAt, locale)} · {sample.collectedBy}</em></span></section><section className="drawer-section"><h3>{t('lab.requestedAnalyses')}</h3><div className="analysis-chip-grid">{sample.requestedAnalyses.map((analysis) => <span key={analysis}><Beaker size={14} /> {t(analysisKeys[analysis])}</span>)}</div></section>{sample.results.length > 0 && <section className="drawer-section"><h3>{t('lab.results')}</h3><div className="drawer-results-grid">{sample.results.map((result) => <span className={result.status} key={result.analysis}><small>{t(analysisKeys[result.analysis])}</small><strong>{result.value} {result.unit}</strong><em>{t(result.status === 'normal' ? 'lab.resultNormal' : result.status === 'warning' ? 'lab.resultWarning' : 'lab.resultCritical')}</em></span>)}</div></section>}<section className="drawer-note"><Activity size={17} /><span><small>{t('lab.notes')}</small><strong>{d(sample.notes) || t('lab.noNotes')}</strong></span></section><div className="sample-drawer-actions"><button className="secondary-button" onClick={onClose}>{t('common.close')}</button>{sample.status !== 'validated' && <button className="primary-button" onClick={onEnterResults}><FlaskConical size={17} /> {sample.results.length ? t('lab.repeatAnalysis') : t('lab.enterResults')}</button>}</div></aside></div>
}

interface NewSampleSheetProps { lots: WineLot[]; deliveries: GrapeDelivery[]; parcels: VineyardParcel[]; onClose: () => void; onCreate: (input: NewLabSampleInput) => void }

function NewSampleSheet({ lots, deliveries, parcels, onClose, onCreate }: NewSampleSheetProps) {
  const [sourceType, setSourceType] = useState<LabSampleSource>('lot')
  const [draft, setDraft] = useState<NewLabSampleInput>({ sourceType: 'lot', sourceId: lots[0]?.id ?? '', profile: 'fermentation', assignedTo: 'Lucía Sáenz', dueAt: '17:00', priority: 'today', notes: '' })
  const [error, setError] = useState('')
  const { t } = useLanguage()
  const options = sourceType === 'lot' ? lots.map((lot) => ({ id: lot.id, label: `${lot.id} · ${lot.name}` })) : sourceType === 'delivery' ? deliveries.map((delivery) => ({ id: delivery.code, label: `${delivery.code} · ${delivery.varieties}` })) : parcels.map((parcel) => ({ id: parcel.id, label: `${parcel.id} · ${parcel.name}` }))
  const changeSourceType = (next: LabSampleSource) => {
    const firstId = next === 'lot' ? lots[0]?.id : next === 'delivery' ? deliveries[0]?.code : parcels[0]?.id
    const profile = next === 'lot' ? 'fermentation' : 'maturity'
    setSourceType(next); setDraft((current) => ({ ...current, sourceType: next, sourceId: firstId ?? '', profile }))
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (!draft.sourceId || !draft.dueAt) return setError(t('lab.errorSource')); onCreate(draft) }
  return <div className="sheet-layer lot-flow-layer" role="dialog" aria-modal="true" aria-label={t('lab.newSample')}><button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} /><form className="lot-flow lab-sample-flow" onSubmit={submit}><header className="lot-flow-head"><div><span className="flow-type-icon lab"><FlaskConical /></span><span><small>{t('lab.kicker')}</small><strong>{t('lab.newSample')}</strong></span></div><button type="button" className="icon-button" onClick={onClose}><X size={20} /></button></header><div className="lot-flow-body"><section className="flow-section"><div className="flow-title"><span className="eyebrow">{t('lab.collection')}</span><h2>{t('lab.identifySample')}</h2><p>{t('lab.identifySampleText')}</p></div><div className="source-type-switch">{(['lot', 'delivery', 'parcel'] as const).map((type) => <button key={type} type="button" className={sourceType === type ? 'active' : ''} onClick={() => changeSourceType(type)}>{type === 'lot' ? <Wine size={16} /> : type === 'delivery' ? <Grape size={16} /> : <MapPin size={16} />}{t(type === 'lot' ? 'lab.sourceLot' : type === 'delivery' ? 'lab.sourceDelivery' : 'lab.sourceParcel')}</button>)}</div><div className="form-grid"><LabField label={t('lab.source')} wide><select value={draft.sourceId} onChange={(event) => setDraft({ ...draft, sourceId: event.target.value })}>{options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></LabField><LabField label={t('lab.analysisProfile')}><select value={draft.profile} onChange={(event) => setDraft({ ...draft, profile: event.target.value as LabProfile })}>{(Object.keys(labAnalysisProfiles) as LabProfile[]).map((profile) => <option value={profile} key={profile}>{t(profileKeys[profile])}</option>)}</select></LabField><LabField label={t('lab.assignedTo')}><select value={draft.assignedTo} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })}><option>Lucía Sáenz</option><option>Elena Martín</option><option>Martín Ruiz</option></select></LabField><LabField label={t('lab.dueAt')}><input type="time" value={draft.dueAt} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value })} /></LabField><LabField label={t('lab.priority')}><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as NewLabSampleInput['priority'] })}><option value="urgent">{t('lab.priorityUrgent')}</option><option value="today">{t('lab.priorityToday')}</option><option value="routine">{t('lab.priorityRoutine')}</option></select></LabField><LabField label={t('lab.notes')} wide><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={t('lab.notesPlaceholder')} /></LabField></div><div className="profile-preview"><Beaker size={19} /><span><small>{t('lab.includedAnalyses')}</small><strong>{labAnalysisProfiles[draft.profile].map((analysis) => t(analysisKeys[analysis])).join(' · ')}</strong><em>{t('lab.profileContext')}</em></span></div>{error && <div className="form-error">{error}</div>}</section></div><footer className="lot-flow-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><Plus size={17} /> {t('lab.createSample')}</button></footer></form></div>
}

function LabResultSheet({ sample, onClose, onSave }: { sample: LabSample; onClose: () => void; onSave: (input: LabResultsInput) => void }) {
  const initial = useMemo(() => Object.fromEntries(sample.results.map((result) => [result.analysis, String(result.value)])) as Partial<Record<LabAnalysisKey, string>>, [sample])
  const [values, setValues] = useState(initial)
  const [notes, setNotes] = useState(sample.notes)
  const [error, setError] = useState('')
  const { t } = useLanguage()
  const submit = (event: FormEvent) => { event.preventDefault(); const parsed: Partial<Record<LabAnalysisKey, number>> = {}; for (const analysis of sample.requestedAnalyses) { const value = Number(values[analysis]); if (values[analysis] === undefined || values[analysis] === '' || !Number.isFinite(value)) return setError(t('lab.errorResults')); parsed[analysis] = value } onSave({ sampleId: sample.id, values: parsed, notes }) }
  return <div className="sheet-layer lot-flow-layer" role="dialog" aria-modal="true" aria-label={t('lab.enterResults')}><button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} /><form className="lot-flow lab-result-flow" onSubmit={submit}><header className="lot-flow-head"><div><span className="flow-type-icon lab"><Beaker /></span><span><small>{sample.code} · {sample.sourceId}</small><strong>{t('lab.enterResults')}</strong></span></div><button type="button" className="icon-button" onClick={onClose}><X size={20} /></button></header><div className="lot-flow-body"><section className="flow-section"><div className="flow-title"><span className="eyebrow">{t(profileKeys[sample.profile])}</span><h2>{t('lab.recordMeasurements')}</h2><p>{t('lab.recordMeasurementsText')}</p></div><div className="lab-result-fields">{sample.requestedAnalyses.map((analysis) => <label key={analysis}><span>{analysis === 'temperature' ? <Thermometer size={15} /> : analysis === 'density' ? <Droplets size={15} /> : <Beaker size={15} />}{t(analysisKeys[analysis])}</span><div><input inputMode="decimal" value={values[analysis] ?? ''} onChange={(event) => setValues({ ...values, [analysis]: event.target.value.replace(',', '.') })} placeholder="—" /><i>{labAnalysisUnits[analysis]}</i></div></label>)}</div><label className="lab-result-note"><span>{t('lab.notes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label><div className="result-validation-note"><ShieldCheck size={18} /><span><strong>{t('lab.automaticValidation')}</strong><small>{t('lab.automaticValidationText')}</small></span></div>{error && <div className="form-error">{error}</div>}</section></div><footer className="lot-flow-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><Check size={17} /> {t('lab.validateResults')}</button></footer></form></div>
}

function LabField({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`flow-field lab-field ${wide ? 'wide' : ''}`}><span>{label}</span><div>{children}</div></label>
}
