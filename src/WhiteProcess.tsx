import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Beaker, Check, CheckCircle2, Clock3, Droplets, FlaskConical, Grape, RefreshCw, ShieldCheck, Snowflake, Sparkles, Thermometer, Waves, X } from 'lucide-react'
import { whiteOperationTypesByStage, whiteStageGate } from './domain'
import { useLanguage } from './i18n'
import type { AdvanceWhiteStageInput, NewWhiteOperationInput, ProductionEvent, WhiteOperationType, WineLot } from './types'

const operationLabelKeys = {
  reception_check: 'whiteEngine.op.reception_check', must_protection: 'whiteEngine.op.must_protection', pressing: 'whiteEngine.op.pressing',
  turbidity_check: 'whiteEngine.op.turbidity_check', clean_must_racking: 'whiteEngine.op.clean_must_racking', inoculation: 'whiteEngine.op.inoculation',
  temperature_check: 'whiteEngine.op.temperature_check', density_check: 'whiteEngine.op.density_check', sample: 'whiteEngine.op.sample',
  batonnage: 'whiteEngine.op.batonnage', lees_tasting: 'whiteEngine.op.lees_tasting', lees_decision: 'whiteEngine.op.lees_decision', cold_stability_check: 'whiteEngine.op.cold_stability_check',
} as const satisfies Record<WhiteOperationType, string>

const gateLabelKeys = {
  protection_required: 'whiteEngine.gate.protection_required', pressing_required: 'whiteEngine.gate.pressing_required', turbidity_required: 'whiteEngine.gate.turbidity_required',
  racking_required: 'whiteEngine.gate.racking_required', density_required: 'whiteEngine.gate.density_required', lees_decision_required: 'whiteEngine.gate.lees_decision_required',
  stability_required: 'whiteEngine.gate.stability_required', complete: 'whiteEngine.gate.complete', ready: 'whiteEngine.gate.ready',
} as const

const nowForInput = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const operationIcon = (type: WhiteOperationType | 'addition'): ReactNode => {
  if (type === 'pressing' || type === 'reception_check') return <Grape />
  if (type === 'must_protection') return <ShieldCheck />
  if (type === 'turbidity_check' || type === 'density_check') return <Droplets />
  if (type === 'clean_must_racking' || type === 'batonnage') return <RefreshCw />
  if (type === 'temperature_check') return <Thermometer />
  if (type === 'inoculation' || type === 'addition') return <Beaker />
  if (type === 'sample' || type === 'lees_tasting') return <FlaskConical />
  if (type === 'cold_stability_check') return <Snowflake />
  if (type === 'lees_decision') return <Sparkles />
  return <Waves />
}

const numeric = (value: string) => value.trim() === '' ? undefined : Number(value.trim().replace(',', '.'))

interface WhiteProcessControlProps {
  lot: WineLot
  events: ProductionEvent[]
  onRecordOperation: (input: NewWhiteOperationInput) => void
  onAdvanceStage: (input: AdvanceWhiteStageInput) => void
}

export function WhiteProcessControl({ lot, events, onRecordOperation, onAdvanceStage }: WhiteProcessControlProps) {
  const { t, d, locale } = useLanguage()
  const [selectedOperation, setSelectedOperation] = useState<WhiteOperationType | null>(null)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')
  const [transitionError, setTransitionError] = useState(false)
  const stage = lot.process.find((item) => item.status === 'current')
  const stageIndex = lot.process.findIndex((item) => item.status === 'current')
  const nextStage = stageIndex >= 0 ? lot.process[stageIndex + 1] : undefined
  const availableOperations = stage ? whiteOperationTypesByStage[stage.id] ?? [] : []
  const gate = whiteStageGate(lot, events)
  const lotEvents = useMemo(() => events.filter((event) => event.lotId === lot.id && event.wineType === 'blanco'), [events, lot.id])
  const gateValue = gate.value === undefined
    ? '—'
    : gate.reason === 'density_required' ? gate.value.toFixed(3)
      : gate.reason === 'turbidity_required' ? `${gate.value.toFixed(0)} NTU`
        : `${gate.value.toFixed(0)} µS/cm`

  const eventDetail = (event: ProductionEvent) => {
    if (event.kind === 'transition') {
      const from = lot.process.find((item) => item.id === event.fromStageId)?.shortLabel ?? event.fromStageId ?? ''
      const to = lot.process.find((item) => item.id === event.toStageId)?.shortLabel ?? event.toStageId ?? ''
      return `${d(from)} → ${d(to)}`
    }
    const metrics = event.metrics
    if (event.operationType === 'reception_check') return `${metrics.potentialAlcohol?.toFixed(1)} % · ${metrics.temperature?.toFixed(1)} °C`
    if (event.operationType === 'must_protection') return metrics.protection ?? event.notes
    if (event.operationType === 'pressing') return `${new Intl.NumberFormat(locale).format(metrics.freeRunVolume ?? 0)} L + ${new Intl.NumberFormat(locale).format(metrics.pressVolume ?? 0)} L`
    if (event.operationType === 'turbidity_check') return `${metrics.turbidity?.toFixed(0)} NTU`
    if (event.operationType === 'clean_must_racking') return `${new Intl.NumberFormat(locale).format(metrics.volumeAfter ?? 0)} L`
    if (event.operationType === 'inoculation' || event.operationType === 'addition') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}${metrics.supplierLot ? ` · ${metrics.supplierLot}` : ''}`
    if (event.operationType === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
    if (event.operationType === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
    if (event.operationType === 'batonnage') return `${metrics.durationMinutes} min`
    if (event.operationType === 'lees_decision') return t(`whiteEngine.decision.${metrics.leesDecision ?? 'continue'}` as Parameters<typeof t>[0])
    if (event.operationType === 'cold_stability_check') return `Δ ${metrics.conductivityDrop?.toFixed(0)} µS/cm`
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

  const eventLabel = (event: ProductionEvent) => event.kind === 'transition'
    ? t('redEngine.transition')
    : event.operationType === 'addition' ? t('redEngine.op.addition')
    : event.operationType && event.operationType in operationLabelKeys
      ? t(operationLabelKeys[event.operationType as WhiteOperationType] as Parameters<typeof t>[0])
      : '—'

  return (
    <section className="red-engine white-engine panel">
      <header className="red-engine-head">
        <div><span className="eyebrow">{t('whiteEngine.kicker')}</span><h2>{t('whiteEngine.title')}</h2><p>{t('whiteEngine.description')}</p></div>
        <span className="red-engine-audit"><ShieldCheck /><span><strong>{t('redEngine.localAudit')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></span>
      </header>

      <div className="red-engine-stage">
        <div className="red-stage-orbit"><span>{String(stageIndex + 1).padStart(2, '0')}</span><i style={{ '--stage-progress': `${Math.max(6, (stageIndex + 1) / lot.process.length * 100)}%` } as CSSProperties} /></div>
        <div className="red-stage-copy"><small>{t('redEngine.stageNumber', { current: stageIndex + 1, total: lot.process.length })}</small><strong>{d(stage?.label ?? lot.stage)}</strong><span className={gate.eligible ? 'ready' : 'blocked'}>{gate.eligible ? <CheckCircle2 /> : <Clock3 />} {t(gate.eligible ? 'redEngine.gateReady' : 'redEngine.gateBlocked')}</span></div>
        <div className="red-gate-copy"><small>{nextStage ? t('redEngine.nextStage') : t('whiteEngine.gate.complete')}</small><strong>{nextStage ? d(nextStage.label) : '—'}</strong><p>{t(gateLabelKeys[gate.reason] as Parameters<typeof t>[0], { value: gateValue, target: lot.productionDetails?.white?.turbidityTarget ?? 100 })}</p></div>
        <button className="primary-button red-advance-button" disabled={!gate.eligible} onClick={() => setAdvanceOpen(true)}>{t('redEngine.advanceStage')} <ArrowRight /></button>
      </div>

      {advanceOpen && nextStage && (
        <div className="red-advance-confirm">
          <span><CheckCircle2 /></span>
          <div><strong>{t('redEngine.confirmAdvance')}</strong><p>{t('redEngine.confirmAdvanceText', { from: d(stage?.shortLabel ?? ''), to: d(nextStage.shortLabel) })}</p><input value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} placeholder={t('redEngine.noteOptional')} />{transitionError && <em>{t('redEngine.formError')}</em>}</div>
          <div><button className="secondary-button" onClick={() => setAdvanceOpen(false)}>{t('common.cancel')}</button><button className="primary-button" onClick={confirmAdvance}>{t('redEngine.confirm')}</button></div>
        </div>
      )}

      <div className="red-engine-grid">
        <div className="red-operation-board">
          <div className="red-section-heading"><span><strong>{t('redEngine.registerOperation')}</strong><small>{stage ? d(stage.shortLabel) : '—'}</small></span><em>{availableOperations.length}</em></div>
          <div className="red-operation-grid">
            {availableOperations.map((type) => <button key={type} onClick={() => setSelectedOperation(type)}><span>{operationIcon(type)}</span><strong>{t(operationLabelKeys[type] as Parameters<typeof t>[0])}</strong><ArrowRight /></button>)}
          </div>
        </div>
        <div className="red-event-board">
          <div className="red-section-heading"><span><strong>{t('redEngine.history')}</strong><small>{t('redEngine.recentRecords')}</small></span><em>{lotEvents.length}</em></div>
          <div className="red-event-list">
            {lotEvents.slice(0, 5).map((event) => (
              <article key={event.id}>
                <span>{event.kind === 'transition' ? <ArrowRight /> : event.operationType ? operationIcon(event.operationType as WhiteOperationType | 'addition') : <Check />}</span>
                <div><strong>{eventLabel(event)}</strong><small>{event.operator} · {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.performedAt))}</small><em>{eventDetail(event)}</em></div>
                <Check size={14} />
              </article>
            ))}
            {!lotEvents.length && <div className="red-empty-events"><Clock3 /><span>{t('redEngine.noRecords')}</span></div>}
          </div>
        </div>
      </div>

      {selectedOperation && <WhiteOperationSheet lot={lot} type={selectedOperation} onClose={() => setSelectedOperation(null)} onSave={(input) => { onRecordOperation(input); setSelectedOperation(null) }} />}
    </section>
  )
}

function WhiteOperationSheet({ lot, type, onClose, onSave }: { lot: WineLot; type: WhiteOperationType; onClose: () => void; onSave: (input: NewWhiteOperationInput) => void }) {
  const { t, d, locale } = useLanguage()
  const [performedAt, setPerformedAt] = useState(nowForInput)
  const [operator, setOperator] = useState('Elena Martín')
  const [notes, setNotes] = useState('')
  const [temperature, setTemperature] = useState(lot.temperature?.toFixed(1) ?? '')
  const [density, setDensity] = useState(lot.density?.toFixed(3) ?? '')
  const [potentialAlcohol, setPotentialAlcohol] = useState('')
  const [protection, setProtection] = useState(lot.productionDetails?.white?.protection ?? 'Inertizado con CO₂')
  const [freeRun, setFreeRun] = useState('')
  const [pressVolume, setPressVolume] = useState('')
  const [pressFraction, setPressFraction] = useState(lot.productionDetails?.white?.pressFraction ?? 'Mosto yema')
  const [turbidity, setTurbidity] = useState('')
  const [volumeAfter, setVolumeAfter] = useState(String(Math.round(lot.volume)))
  const [settlingHours, setSettlingHours] = useState('24')
  const [product, setProduct] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL'>('g')
  const [duration, setDuration] = useState('10')
  const [leesDecision, setLeesDecision] = useState<'continue' | 'complete' | 'skip'>('continue')
  const [conductivityDrop, setConductivityDrop] = useState('')
  const [error, setError] = useState(false)
  const output = (numeric(freeRun) ?? 0) + (numeric(pressVolume) ?? 0)
  const maximumOutput = lot.productionDetails?.receivedKg !== undefined ? lot.productionDetails.receivedKg * 0.7 : lot.volume

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      onSave({
        lotId: lot.id, type, performedAt: new Date(performedAt).toISOString(), operator, notes,
        metrics: {
          temperature: numeric(temperature), density: numeric(density), potentialAlcohol: numeric(potentialAlcohol), protection: protection.trim() || undefined,
          freeRunVolume: numeric(freeRun), pressVolume: numeric(pressVolume), pressFraction: pressFraction.trim() || undefined, turbidity: numeric(turbidity),
          volumeAfter: numeric(volumeAfter), settlingHours: numeric(settlingHours), product: product.trim() || undefined, additionAmount: numeric(amount), additionUnit: unit,
          durationMinutes: numeric(duration), leesDecision, conductivityDrop: numeric(conductivityDrop),
        },
      })
    } catch {
      setError(true)
    }
  }

  const showTemperature = type === 'reception_check' || type === 'temperature_check' || type === 'density_check'
  return (
    <div className="red-operation-layer" role="dialog" aria-modal="true" aria-label={t('redEngine.formTitle')}>
      <form className="red-operation-sheet white-operation-sheet" onSubmit={submit} noValidate>
        <header><span className="red-sheet-icon">{operationIcon(type)}</span><div><small>{lot.id} · {t('redEngine.formTitle')}</small><h2>{t(operationLabelKeys[type] as Parameters<typeof t>[0])}</h2><p>{t('whiteEngine.formText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header>
        <div className="red-sheet-body">
          <div className="red-sheet-context"><span><small>{t('detail.currentStage')}</small><strong>{d(lot.stage)}</strong></span><span><small>{t('redEngine.volumeBefore')}</small><strong>{new Intl.NumberFormat(locale).format(lot.volume)} L</strong></span></div>
          <div className="red-form-grid">
            <label><span>{t('redEngine.performedAt')}</span><input type="datetime-local" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
            <label><span>{t('redEngine.operator')}</span><input value={operator} onChange={(event) => setOperator(event.target.value)} required /></label>
            {showTemperature && <label><span>{t('common.temperature')}</span><div className="unit-input"><input inputMode="decimal" value={temperature} onChange={(event) => setTemperature(event.target.value)} required={type !== 'density_check'} /><em>°C</em></div></label>}
            {type === 'reception_check' && <label><span>{t('whiteEngine.potentialAlcohol')}</span><div className="unit-input"><input inputMode="decimal" value={potentialAlcohol} onChange={(event) => setPotentialAlcohol(event.target.value)} required /><em>% vol.</em></div></label>}
            {type === 'must_protection' && <label className="wide"><span>{t('whiteEngine.protection')}</span><input value={protection} onChange={(event) => setProtection(event.target.value)} required /></label>}
            {type === 'pressing' && <><label><span>{t('whiteEngine.freeRunMust')}</span><div className="unit-input"><input inputMode="decimal" value={freeRun} onChange={(event) => setFreeRun(event.target.value)} required /><em>L</em></div></label><label><span>{t('whiteEngine.pressMust')}</span><div className="unit-input"><input inputMode="decimal" value={pressVolume} onChange={(event) => setPressVolume(event.target.value)} required /><em>L</em></div></label><label className="wide"><span>{t('whiteEngine.pressFraction')}</span><input value={pressFraction} onChange={(event) => setPressFraction(event.target.value)} required /></label></>}
            {type === 'turbidity_check' && <label><span>{t('whiteEngine.turbidity')}</span><div className="unit-input"><input inputMode="decimal" value={turbidity} onChange={(event) => setTurbidity(event.target.value)} required /><em>NTU</em></div></label>}
            {type === 'clean_must_racking' && <><label><span>{t('redEngine.reconciledVolume')}</span><div className="unit-input"><input inputMode="decimal" value={volumeAfter} onChange={(event) => setVolumeAfter(event.target.value)} required /><em>L</em></div></label><label><span>{t('whiteEngine.settlingHours')}</span><div className="unit-input"><input inputMode="decimal" value={settlingHours} onChange={(event) => setSettlingHours(event.target.value)} /><em>h</em></div></label></>}
            {type === 'inoculation' && <><label className="wide"><span>{t('redEngine.product')}</span><input value={product} onChange={(event) => setProduct(event.target.value)} required /></label><label><span>{t('redEngine.amount')}</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label><span>{t('whiteEngine.unit')}</span><select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}><option>kg</option><option>g</option><option>L</option><option>mL</option></select></label></>}
            {type === 'density_check' && <label><span>{t('common.density')}</span><input inputMode="decimal" value={density} onChange={(event) => setDensity(event.target.value)} required /></label>}
            {type === 'batonnage' && <label><span>{t('redEngine.duration')}</span><div className="unit-input"><input inputMode="decimal" value={duration} onChange={(event) => setDuration(event.target.value)} required /><em>min</em></div></label>}
            {type === 'lees_decision' && <label className="wide"><span>{t('whiteEngine.leesDecision')}</span><select value={leesDecision} onChange={(event) => setLeesDecision(event.target.value as typeof leesDecision)}><option value="continue">{t('whiteEngine.decision.continue')}</option><option value="complete">{t('whiteEngine.decision.complete')}</option><option value="skip">{t('whiteEngine.decision.skip')}</option></select></label>}
            {type === 'cold_stability_check' && <label><span>{t('whiteEngine.conductivityDrop')}</span><div className="unit-input"><input inputMode="decimal" value={conductivityDrop} onChange={(event) => setConductivityDrop(event.target.value)} required /><em>µS/cm</em></div></label>}
            <label className="wide"><span>{t('redEngine.notes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t(type === 'lees_tasting' ? 'whiteEngine.tastingRequired' : 'redEngine.notesPlaceholder')} required={type === 'lees_tasting'} /></label>
          </div>
          {type === 'pressing' && <div className={`red-volume-preview ${output > maximumOutput ? 'invalid' : ''}`}><span><small>{t('redEngine.outputTotal')}</small><strong>{new Intl.NumberFormat(locale).format(output)} L</strong></span><i /><span><small>{t('whiteEngine.pressLimit')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(maximumOutput))} L</strong></span></div>}
          <div className="red-local-notice"><ShieldCheck /><span><strong>{t('redEngine.localOperator')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></div>
          {error && <p className="form-error">{t('redEngine.formError')}</p>}
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Check /> {t('redEngine.saveOperation')}</button></footer>
      </form>
    </div>
  )
}
