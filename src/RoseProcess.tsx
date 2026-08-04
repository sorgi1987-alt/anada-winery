import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Beaker, Check, CheckCircle2, Clock3, Droplets, FlaskConical, GitMerge, Grape, RefreshCw, Scale, ShieldCheck, Sparkles, Thermometer, Waves, X } from 'lucide-react'
import { roseOperationsForLot, roseStageGate } from './domain'
import { useLanguage } from './i18n'
import type { AdvanceRoseStageInput, NewRoseOperationInput, ProductionEvent, ProductionEventMetrics, RoseMethod, RoseOperationType, WineLot } from './types'

const operationLabelKeys = {
  composition_check: 'roseEngine.op.composition_check', separate_weighing: 'roseEngine.op.separate_weighing', must_protection: 'roseEngine.op.must_protection', direct_pressing: 'roseEngine.op.direct_pressing',
  skin_contact_check: 'roseEngine.op.skin_contact_check', color_check: 'roseEngine.op.color_check', saignee_separation: 'roseEngine.op.saignee_separation', joint_vatting: 'roseEngine.op.joint_vatting',
  gentle_cap_management: 'roseEngine.op.gentle_cap_management', fraction_separation: 'roseEngine.op.fraction_separation', turbidity_check: 'roseEngine.op.turbidity_check', clean_must_racking: 'roseEngine.op.clean_must_racking',
  inoculation: 'roseEngine.op.inoculation', temperature_check: 'roseEngine.op.temperature_check', density_check: 'roseEngine.op.density_check', sample: 'roseEngine.op.sample',
  lees_decision: 'roseEngine.op.lees_decision', stability_check: 'roseEngine.op.stability_check',
} as const satisfies Record<RoseOperationType, string>

const gateLabelKeys = {
  composition_required: 'roseEngine.gate.composition_required', weighing_required: 'roseEngine.gate.weighing_required', protection_required: 'roseEngine.gate.protection_required',
  pressing_required: 'roseEngine.gate.pressing_required', contact_required: 'roseEngine.gate.contact_required', color_required: 'roseEngine.gate.color_required',
  vatting_required: 'roseEngine.gate.vatting_required', separation_required: 'roseEngine.gate.separation_required', turbidity_required: 'roseEngine.gate.turbidity_required',
  racking_required: 'roseEngine.gate.racking_required', density_required: 'roseEngine.gate.density_required', lees_decision_required: 'roseEngine.gate.lees_decision_required',
  stability_required: 'roseEngine.gate.stability_required', complete: 'roseEngine.gate.complete', ready: 'roseEngine.gate.ready',
} as const

const methodLabelKeys: Record<RoseMethod, 'rose.method.direct_press' | 'rose.method.short_maceration' | 'rose.method.saignee' | 'rose.method.cofermentation'> = {
  direct_press: 'rose.method.direct_press', short_maceration: 'rose.method.short_maceration', saignee: 'rose.method.saignee', cofermentation: 'rose.method.cofermentation',
}

const nowForInput = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const operationIcon = (type: RoseOperationType | 'addition'): ReactNode => {
  if (type === 'composition_check' || type === 'color_check') return <Sparkles />
  if (type === 'separate_weighing') return <Scale />
  if (type === 'must_protection') return <ShieldCheck />
  if (type === 'direct_pressing' || type === 'saignee_separation' || type === 'fraction_separation' || type === 'skin_contact_check') return <Grape />
  if (type === 'joint_vatting') return <GitMerge />
  if (type === 'gentle_cap_management' || type === 'clean_must_racking') return <RefreshCw />
  if (type === 'turbidity_check' || type === 'density_check') return <Droplets />
  if (type === 'inoculation' || type === 'addition') return <Beaker />
  if (type === 'temperature_check') return <Thermometer />
  if (type === 'sample') return <FlaskConical />
  return <Waves />
}

const numeric = (value: string) => value.trim() === '' ? undefined : Number(value.trim().replace(',', '.'))

export function RoseProcessControl({ lot, events, onRecordOperation, onAdvanceStage }: {
  lot: WineLot
  events: ProductionEvent[]
  onRecordOperation: (input: NewRoseOperationInput) => void
  onAdvanceStage: (input: AdvanceRoseStageInput) => void
}) {
  const { t, d, locale } = useLanguage()
  const [selectedOperation, setSelectedOperation] = useState<RoseOperationType | null>(null)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')
  const [transitionError, setTransitionError] = useState(false)
  const stage = lot.process.find((item) => item.status === 'current')
  const stageIndex = lot.process.findIndex((item) => item.status === 'current')
  const nextStage = stageIndex >= 0 ? lot.process[stageIndex + 1] : undefined
  const availableOperations = roseOperationsForLot(lot)
  const gate = roseStageGate(lot, events)
  const method = lot.productionDetails?.rose?.method ?? 'direct_press'
  const lotEvents = useMemo(() => events.filter((event) => event.lotId === lot.id && event.wineType === 'rosado'), [events, lot.id])
  const gateValue = gate.value === undefined ? '—'
    : gate.reason === 'density_required' ? gate.value.toFixed(3)
      : gate.reason === 'color_required' ? `${gate.value.toFixed(2)} UA/cm`
        : gate.reason === 'contact_required' ? `${gate.value.toFixed(1)} h`
          : gate.reason === 'turbidity_required' ? `${gate.value.toFixed(0)} NTU`
            : `${gate.value.toFixed(0)} µS/cm`

  const eventDetail = (event: ProductionEvent) => {
    if (event.kind === 'transition') {
      const from = lot.process.find((item) => item.id === event.fromStageId)?.shortLabel ?? event.fromStageId ?? ''
      const to = lot.process.find((item) => item.id === event.toStageId)?.shortLabel ?? event.toStageId ?? ''
      return `${d(from)} → ${d(to)}`
    }
    const metrics = event.metrics
    if (event.operationType === 'composition_check') return `${metrics.redGrapePercentage?.toFixed(0)}% · ${metrics.colorIntensity?.toFixed(2)} UA/cm`
    if (event.operationType === 'separate_weighing' || event.operationType === 'joint_vatting') return t('roseEngine.weightsConfirmed')
    if (event.operationType === 'must_protection') return metrics.protection ?? event.notes
    if (event.operationType === 'direct_pressing' || event.operationType === 'saignee_separation' || event.operationType === 'fraction_separation') return `${new Intl.NumberFormat(locale).format(metrics.freeRunVolume ?? 0)} L + ${new Intl.NumberFormat(locale).format(metrics.pressVolume ?? 0)} L`
    if (event.operationType === 'skin_contact_check' || event.operationType === 'color_check') return `${metrics.colorIntensity?.toFixed(2)} UA/cm${metrics.skinContactHours !== undefined ? ` · ${metrics.skinContactHours.toFixed(1)} h` : ''}`
    if (event.operationType === 'gentle_cap_management') return `${metrics.durationMinutes} min${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
    if (event.operationType === 'turbidity_check') return `${metrics.turbidity?.toFixed(0)} NTU`
    if (event.operationType === 'clean_must_racking') return `${new Intl.NumberFormat(locale).format(metrics.volumeAfter ?? 0)} L`
    if (event.operationType === 'inoculation' || event.operationType === 'addition') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}${metrics.supplierLot ? ` · ${metrics.supplierLot}` : ''}`
    if (event.operationType === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
    if (event.operationType === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
    if (event.operationType === 'lees_decision') return t(`whiteEngine.decision.${metrics.leesDecision ?? 'continue'}` as Parameters<typeof t>[0])
    if (event.operationType === 'stability_check') return `Δ ${metrics.conductivityDrop?.toFixed(0)} µS/cm`
    return event.notes || '—'
  }

  const confirmAdvance = () => {
    try {
      onAdvanceStage({ lotId: lot.id, performedAt: new Date().toISOString(), operator: 'Elena Martín', notes: transitionNote })
      setAdvanceOpen(false)
      setTransitionNote('')
      setTransitionError(false)
    } catch {
      setTransitionError(true)
    }
  }

  const eventLabel = (event: ProductionEvent) => event.kind === 'transition' ? t('redEngine.transition')
    : event.operationType === 'addition' ? t('redEngine.op.addition')
    : event.operationType && event.operationType in operationLabelKeys ? t(operationLabelKeys[event.operationType as RoseOperationType] as Parameters<typeof t>[0]) : '—'

  return (
    <section className="red-engine rose-engine panel">
      <header className="red-engine-head">
        <div><span className="eyebrow">{t('roseEngine.kicker')}</span><h2>{t('roseEngine.title')}</h2><p>{t('roseEngine.description')}</p></div>
        <div className="rose-engine-meta"><span><Sparkles /><small>{t('rose.method')}</small><strong>{t(methodLabelKeys[method])}</strong></span><span className="red-engine-audit"><ShieldCheck /><span><strong>{t('redEngine.localAudit')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></span></div>
      </header>

      <div className="red-engine-stage">
        <div className="red-stage-orbit"><span>{String(stageIndex + 1).padStart(2, '0')}</span><i style={{ '--stage-progress': `${Math.max(6, (stageIndex + 1) / lot.process.length * 100)}%` } as CSSProperties} /></div>
        <div className="red-stage-copy"><small>{t('redEngine.stageNumber', { current: stageIndex + 1, total: lot.process.length })}</small><strong>{d(stage?.label ?? lot.stage)}</strong><span className={gate.eligible ? 'ready' : 'blocked'}>{gate.eligible ? <CheckCircle2 /> : <Clock3 />} {t(gate.eligible ? 'redEngine.gateReady' : 'redEngine.gateBlocked')}</span></div>
        <div className="red-gate-copy"><small>{nextStage ? t('redEngine.nextStage') : t('roseEngine.gate.complete')}</small><strong>{nextStage ? d(nextStage.label) : '—'}</strong><p>{t(gateLabelKeys[gate.reason] as Parameters<typeof t>[0], { value: gateValue, target: lot.productionDetails?.rose?.targetColorIntensity ?? 0.8, hours: lot.productionDetails?.rose?.macerationHours ?? 0, turbidity: lot.productionDetails?.rose?.turbidityTarget ?? 110 })}</p></div>
        <button className="primary-button red-advance-button" disabled={!gate.eligible} onClick={() => setAdvanceOpen(true)}>{t('redEngine.advanceStage')} <ArrowRight /></button>
      </div>

      {advanceOpen && nextStage && <div className="red-advance-confirm"><span><CheckCircle2 /></span><div><strong>{t('redEngine.confirmAdvance')}</strong><p>{t('redEngine.confirmAdvanceText', { from: d(stage?.shortLabel ?? ''), to: d(nextStage.shortLabel) })}</p><input value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} placeholder={t('redEngine.noteOptional')} />{transitionError && <em>{t('redEngine.formError')}</em>}</div><div><button className="secondary-button" onClick={() => setAdvanceOpen(false)}>{t('common.cancel')}</button><button className="primary-button" onClick={confirmAdvance}>{t('redEngine.confirm')}</button></div></div>}

      <div className="red-engine-grid">
        <div className="red-operation-board"><div className="red-section-heading"><span><strong>{t('redEngine.registerOperation')}</strong><small>{stage ? d(stage.shortLabel) : '—'}</small></span><em>{availableOperations.length}</em></div><div className="red-operation-grid">{availableOperations.map((type) => <button key={type} onClick={() => setSelectedOperation(type)}><span>{operationIcon(type)}</span><strong>{t(operationLabelKeys[type] as Parameters<typeof t>[0])}</strong><ArrowRight /></button>)}</div></div>
        <div className="red-event-board"><div className="red-section-heading"><span><strong>{t('redEngine.history')}</strong><small>{t('redEngine.recentRecords')}</small></span><em>{lotEvents.length}</em></div><div className="red-event-list">{lotEvents.slice(0, 5).map((event) => <article key={event.id}><span>{event.kind === 'transition' ? <ArrowRight /> : event.operationType ? operationIcon(event.operationType as RoseOperationType | 'addition') : <Check />}</span><div><strong>{eventLabel(event)}</strong><small>{event.operator} · {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.performedAt))}</small><em>{eventDetail(event)}</em></div><Check size={14} /></article>)}{!lotEvents.length && <div className="red-empty-events"><Clock3 /><span>{t('redEngine.noRecords')}</span></div>}</div></div>
      </div>
      {selectedOperation && <RoseOperationSheet lot={lot} type={selectedOperation} onClose={() => setSelectedOperation(null)} onSave={(input) => { onRecordOperation(input); setSelectedOperation(null) }} />}
    </section>
  )
}

function RoseOperationSheet({ lot, type, onClose, onSave }: { lot: WineLot; type: RoseOperationType; onClose: () => void; onSave: (input: NewRoseOperationInput) => void }) {
  const { t, d, locale } = useLanguage()
  const details = lot.productionDetails?.rose
  const stageId = lot.process.find((stage) => stage.status === 'current')?.id
  const [performedAt, setPerformedAt] = useState(nowForInput)
  const [operator, setOperator] = useState('Elena Martín')
  const [notes, setNotes] = useState('')
  const [temperature, setTemperature] = useState(lot.temperature?.toFixed(1) ?? '')
  const [density, setDensity] = useState(lot.density?.toFixed(3) ?? '')
  const [redPercentage, setRedPercentage] = useState(String(details?.redGrapePercentage ?? 25))
  const [colorIntensity, setColorIntensity] = useState(String(details?.targetColorIntensity ?? 0.8).replace('.', ','))
  const [skinContactHours, setSkinContactHours] = useState(String(details?.macerationHours ?? 0))
  const [mixingAfterWeighing, setMixingAfterWeighing] = useState(details?.blendAfterWeighing ?? true)
  const [separateWeights, setSeparateWeights] = useState(details?.blendAfterWeighing ?? true)
  const [protection, setProtection] = useState(details?.protection ?? 'Inertizado con CO₂')
  const [freeRun, setFreeRun] = useState('')
  const [pressVolume, setPressVolume] = useState('')
  const [pressFraction, setPressFraction] = useState(details?.pressFraction ?? 'Mosto yema')
  const [duration, setDuration] = useState('6')
  const [turbidity, setTurbidity] = useState('')
  const [volumeAfter, setVolumeAfter] = useState(String(Math.round(lot.volume)))
  const [settlingHours, setSettlingHours] = useState('24')
  const [product, setProduct] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL'>('g')
  const [leesDecision, setLeesDecision] = useState<'continue' | 'complete' | 'skip'>('continue')
  const [conductivityDrop, setConductivityDrop] = useState('')
  const [error, setError] = useState(false)
  const output = (numeric(freeRun) ?? 0) + (numeric(pressVolume) ?? 0)
  const yieldLimit = lot.productionDetails?.receivedKg !== undefined ? lot.productionDetails.receivedKg * 0.7 : lot.volume
  const maximumOutput = Math.min(lot.volume, yieldLimit)
  const separationOperation = type === 'direct_pressing' || type === 'fraction_separation' || type === 'saignee_separation'
  const showContact = type === 'skin_contact_check' || (type === 'color_check' && (stageId === 'maceration' || stageId === 'cofermentation'))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      const metrics: ProductionEventMetrics = {}
      if (type === 'composition_check') Object.assign(metrics, { redGrapePercentage: numeric(redPercentage), colorIntensity: numeric(colorIntensity), mixingAfterWeighing })
      if (type === 'separate_weighing' || type === 'joint_vatting') Object.assign(metrics, { separateWeightsConfirmed: separateWeights, mixingAfterWeighing })
      if (type === 'must_protection') metrics.protection = protection.trim() || undefined
      if (separationOperation) Object.assign(metrics, { freeRunVolume: numeric(freeRun), pressVolume: numeric(pressVolume), pressFraction: pressFraction.trim() || undefined })
      if (type === 'skin_contact_check' || type === 'color_check') metrics.colorIntensity = numeric(colorIntensity)
      if (showContact) metrics.skinContactHours = numeric(skinContactHours)
      if (type === 'gentle_cap_management') Object.assign(metrics, { durationMinutes: numeric(duration), temperature: numeric(temperature) })
      if (type === 'turbidity_check') metrics.turbidity = numeric(turbidity)
      if (type === 'clean_must_racking') Object.assign(metrics, { volumeAfter: numeric(volumeAfter), settlingHours: numeric(settlingHours) })
      if (type === 'inoculation') Object.assign(metrics, { product: product.trim() || undefined, additionAmount: numeric(amount), additionUnit: unit })
      if (type === 'temperature_check') metrics.temperature = numeric(temperature)
      if (type === 'density_check') Object.assign(metrics, { density: numeric(density), temperature: numeric(temperature) })
      if (type === 'lees_decision') metrics.leesDecision = leesDecision
      if (type === 'stability_check') metrics.conductivityDrop = numeric(conductivityDrop)
      onSave({ lotId: lot.id, type, performedAt: new Date(performedAt).toISOString(), operator, notes, metrics })
    } catch { setError(true) }
  }

  return (
    <div className="red-operation-layer" role="dialog" aria-modal="true" aria-label={t('redEngine.formTitle')}>
      <form className="red-operation-sheet rose-operation-sheet" onSubmit={submit} noValidate>
        <header><span className="red-sheet-icon">{operationIcon(type)}</span><div><small>{lot.id} · {t('redEngine.formTitle')}</small><h2>{t(operationLabelKeys[type] as Parameters<typeof t>[0])}</h2><p>{t('roseEngine.formText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header>
        <div className="red-sheet-body">
          <div className="red-sheet-context"><span><small>{t('detail.currentStage')}</small><strong>{d(lot.stage)}</strong></span><span><small>{t('redEngine.volumeBefore')}</small><strong>{new Intl.NumberFormat(locale).format(lot.volume)} L</strong></span></div>
          <div className="red-form-grid">
            <label><span>{t('redEngine.performedAt')}</span><input type="datetime-local" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
            <label><span>{t('redEngine.operator')}</span><input value={operator} onChange={(event) => setOperator(event.target.value)} required /></label>
            {type === 'composition_check' && <><label><span>{t('rose.redPercentage')}</span><div className="unit-input"><input inputMode="decimal" value={redPercentage} onChange={(event) => setRedPercentage(event.target.value)} required /><em>%</em></div></label><label><span>{t('rose.colorTarget')}</span><div className="unit-input"><input inputMode="decimal" value={colorIntensity} onChange={(event) => setColorIntensity(event.target.value)} required /><em>UA/cm</em></div></label><ToggleField label={t('rose.afterWeighbridge')} checked={mixingAfterWeighing} onChange={setMixingAfterWeighing} /></>}
            {(type === 'separate_weighing' || type === 'joint_vatting') && <><ToggleField label={t('roseEngine.separateWeights')} checked={separateWeights} onChange={setSeparateWeights} /><ToggleField label={t('rose.afterWeighbridge')} checked={mixingAfterWeighing} onChange={setMixingAfterWeighing} /></>}
            {type === 'must_protection' && <label className="wide"><span>{t('rose.protection')}</span><input value={protection} onChange={(event) => setProtection(event.target.value)} required /></label>}
            {separationOperation && <><label><span>{t('whiteEngine.freeRunMust')}</span><div className="unit-input"><input inputMode="decimal" value={freeRun} onChange={(event) => setFreeRun(event.target.value)} required /><em>L</em></div></label><label><span>{t('whiteEngine.pressMust')}</span><div className="unit-input"><input inputMode="decimal" value={pressVolume} onChange={(event) => setPressVolume(event.target.value)} required /><em>L</em></div></label><label className="wide"><span>{t('rose.pressFraction')}</span><input value={pressFraction} onChange={(event) => setPressFraction(event.target.value)} required /></label></>}
            {(type === 'skin_contact_check' || type === 'color_check') && <label><span>{t('roseEngine.colorIntensity')}</span><div className="unit-input"><input inputMode="decimal" value={colorIntensity} onChange={(event) => setColorIntensity(event.target.value)} required /><em>UA/cm</em></div></label>}
            {showContact && <label><span>{t('rose.macerationHours')}</span><div className="unit-input"><input inputMode="decimal" value={skinContactHours} onChange={(event) => setSkinContactHours(event.target.value)} required /><em>h</em></div></label>}
            {type === 'gentle_cap_management' && <><label><span>{t('redEngine.duration')}</span><div className="unit-input"><input inputMode="decimal" value={duration} onChange={(event) => setDuration(event.target.value)} required /><em>min</em></div></label><label><span>{t('common.temperature')}</span><div className="unit-input"><input inputMode="decimal" value={temperature} onChange={(event) => setTemperature(event.target.value)} /><em>°C</em></div></label></>}
            {type === 'turbidity_check' && <label><span>{t('whiteEngine.turbidity')}</span><div className="unit-input"><input inputMode="decimal" value={turbidity} onChange={(event) => setTurbidity(event.target.value)} required /><em>NTU</em></div></label>}
            {type === 'clean_must_racking' && <><label><span>{t('redEngine.reconciledVolume')}</span><div className="unit-input"><input inputMode="decimal" value={volumeAfter} onChange={(event) => setVolumeAfter(event.target.value)} required /><em>L</em></div></label><label><span>{t('whiteEngine.settlingHours')}</span><div className="unit-input"><input inputMode="decimal" value={settlingHours} onChange={(event) => setSettlingHours(event.target.value)} /><em>h</em></div></label></>}
            {type === 'inoculation' && <><label className="wide"><span>{t('redEngine.product')}</span><input value={product} onChange={(event) => setProduct(event.target.value)} required /></label><label><span>{t('redEngine.amount')}</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label><span>{t('whiteEngine.unit')}</span><select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}><option>kg</option><option>g</option><option>L</option><option>mL</option></select></label></>}
            {type === 'temperature_check' && <label><span>{t('common.temperature')}</span><div className="unit-input"><input inputMode="decimal" value={temperature} onChange={(event) => setTemperature(event.target.value)} required /><em>°C</em></div></label>}
            {type === 'density_check' && <><label><span>{t('common.density')}</span><input inputMode="decimal" value={density} onChange={(event) => setDensity(event.target.value)} required /></label><label><span>{t('common.temperature')}</span><div className="unit-input"><input inputMode="decimal" value={temperature} onChange={(event) => setTemperature(event.target.value)} /><em>°C</em></div></label></>}
            {type === 'lees_decision' && <label className="wide"><span>{t('whiteEngine.leesDecision')}</span><select value={leesDecision} onChange={(event) => setLeesDecision(event.target.value as typeof leesDecision)}><option value="continue">{t('whiteEngine.decision.continue')}</option><option value="complete">{t('whiteEngine.decision.complete')}</option><option value="skip">{t('whiteEngine.decision.skip')}</option></select></label>}
            {type === 'stability_check' && <label><span>{t('whiteEngine.conductivityDrop')}</span><div className="unit-input"><input inputMode="decimal" value={conductivityDrop} onChange={(event) => setConductivityDrop(event.target.value)} required /><em>µS/cm</em></div></label>}
            <label className="wide"><span>{t('redEngine.notes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('redEngine.notesPlaceholder')} /></label>
          </div>
          {separationOperation && <div className={`red-volume-preview ${output > maximumOutput ? 'invalid' : ''}`}><span><small>{t('redEngine.outputTotal')}</small><strong>{new Intl.NumberFormat(locale).format(output)} L</strong></span><i /><span><small>{t('whiteEngine.pressLimit')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(maximumOutput))} L</strong></span></div>}
          <div className="red-local-notice"><ShieldCheck /><span><strong>{t('redEngine.localOperator')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></div>
          {error && <p className="form-error">{t('redEngine.formError')}</p>}
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Check /> {t('redEngine.saveOperation')}</button></footer>
      </form>
    </div>
  )
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="rose-check-field"><span>{label}</span><button type="button" className={checked ? 'active' : ''} onClick={() => onChange(!checked)} aria-pressed={checked}><i>{checked && <Check />}</i><em>{checked ? '✓' : '—'}</em></button></div>
}
