import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { getCurrentOperatorName } from './operator'
import { ArrowRight, Beaker, Check, CheckCircle2, Clock3, Droplets, FlaskConical, Grape, RefreshCw, ShieldCheck, Thermometer, Wine, X } from 'lucide-react'
import { redOperationTypesByStage, redStageGate } from './domain'
import { useLanguage } from './i18n'
import type { AdvanceRedStageInput, NewRedOperationInput, ProductionEvent, RedOperationType, WineLot } from './types'

const operationLabelKeys = {
  selection: 'redEngine.op.selection', vatting: 'redEngine.op.vatting', pump_over: 'redEngine.op.pump_over', punch_down: 'redEngine.op.punch_down',
  temperature_check: 'redEngine.op.temperature_check', density_check: 'redEngine.op.density_check', addition: 'redEngine.op.addition', sample: 'redEngine.op.sample',
  devatting_pressing: 'redEngine.op.devatting_pressing', racking: 'redEngine.op.racking', malolactic_check: 'redEngine.op.malolactic_check', so2_adjustment: 'redEngine.op.so2_adjustment',
} as const satisfies Record<RedOperationType, string>

const gateLabelKeys = {
  operation_required: 'redEngine.gate.operation_required', density_required: 'redEngine.gate.density_required', malic_required: 'redEngine.gate.malic_required',
  managed_elsewhere: 'redEngine.gate.managed_elsewhere', complete: 'redEngine.gate.complete', ready: 'redEngine.gate.ready',
} as const

const nowForInput = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const operationIcon = (type: RedOperationType): ReactNode => {
  if (type === 'pump_over' || type === 'racking') return <RefreshCw />
  if (type === 'punch_down' || type === 'selection' || type === 'vatting' || type === 'devatting_pressing') return <Grape />
  if (type === 'temperature_check') return <Thermometer />
  if (type === 'density_check') return <Droplets />
  if (type === 'addition' || type === 'so2_adjustment') return <Beaker />
  if (type === 'sample' || type === 'malolactic_check') return <FlaskConical />
  return <Wine />
}

const numeric = (value: string) => value.trim() === '' ? undefined : Number(value.trim().replace(',', '.'))

interface RedProcessControlProps {
  lot: WineLot
  events: ProductionEvent[]
  onRecordOperation: (input: NewRedOperationInput) => void
  onAdvanceStage: (input: AdvanceRedStageInput) => void
}

export function RedProcessControl({ lot, events, onRecordOperation, onAdvanceStage }: RedProcessControlProps) {
  const { t, d, locale } = useLanguage()
  const [selectedOperation, setSelectedOperation] = useState<RedOperationType | null>(null)
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')
  const [transitionError, setTransitionError] = useState(false)
  const stage = lot.process.find((item) => item.status === 'current')
  const stageIndex = lot.process.findIndex((item) => item.status === 'current')
  const nextStage = stageIndex >= 0 ? lot.process[stageIndex + 1] : undefined
  const availableOperations = stage ? redOperationTypesByStage[stage.id] ?? [] : []
  const gate = redStageGate(lot, events)
  const lotEvents = useMemo(() => events.filter((event) => event.lotId === lot.id), [events, lot.id])
  const gateValue = gate.value === undefined ? '—' : gate.reason === 'density_required' ? gate.value.toFixed(3) : `${gate.value.toFixed(2)} g/L`

  const eventDetail = (event: ProductionEvent) => {
    if (event.kind === 'transition') {
      const from = lot.process.find((item) => item.id === event.fromStageId)?.shortLabel ?? event.fromStageId ?? ''
      const to = lot.process.find((item) => item.id === event.toStageId)?.shortLabel ?? event.toStageId ?? ''
      return `${d(from)} → ${d(to)}`
    }
    const metrics = event.metrics
    if (event.operationType === 'pump_over' || event.operationType === 'punch_down') return `${metrics.durationMinutes ?? 0} min${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
    if (event.operationType === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
    if (event.operationType === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
    if (event.operationType === 'addition') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}`
    if (event.operationType === 'devatting_pressing') return `${new Intl.NumberFormat(locale).format(metrics.freeRunVolume ?? 0)} L + ${new Intl.NumberFormat(locale).format(metrics.pressVolume ?? 0)} L`
    if (event.operationType === 'racking') return `${new Intl.NumberFormat(locale).format(metrics.volumeAfter ?? 0)} L`
    if (event.operationType === 'malolactic_check') return `${metrics.malicAcid?.toFixed(2)} g/L`
    if (event.operationType === 'so2_adjustment') return `${metrics.freeSo2?.toFixed(0)} mg/L`
    return event.notes || '—'
  }

  const confirmAdvance = () => {
    try {
      onAdvanceStage({ lotId: lot.id, performedAt: new Date().toISOString(), operator: getCurrentOperatorName(), notes: transitionNote })
      setAdvanceOpen(false)
      setTransitionNote('')
      setTransitionError(false)
    } catch {
      setTransitionError(true)
    }
  }

  return (
    <section className="red-engine panel">
      <header className="red-engine-head">
        <div><span className="eyebrow">{t('redEngine.kicker')}</span><h2>{t('redEngine.title')}</h2><p>{t('redEngine.description')}</p></div>
        <span className="red-engine-audit"><ShieldCheck /><span><strong>{t('redEngine.localAudit')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></span>
      </header>

      <div className="red-engine-stage">
        <div className="red-stage-orbit"><span>{String(stageIndex + 1).padStart(2, '0')}</span><i style={{ '--stage-progress': `${Math.max(6, (stageIndex + 1) / lot.process.length * 100)}%` } as CSSProperties} /></div>
        <div className="red-stage-copy"><small>{t('redEngine.stageNumber', { current: stageIndex + 1, total: lot.process.length })}</small><strong>{d(stage?.label ?? lot.stage)}</strong><span className={gate.eligible ? 'ready' : 'blocked'}>{gate.eligible ? <CheckCircle2 /> : <Clock3 />} {t(gate.eligible ? 'redEngine.gateReady' : 'redEngine.gateBlocked')}</span></div>
        <div className="red-gate-copy"><small>{nextStage ? t('redEngine.nextStage') : t('redEngine.gate.complete')}</small><strong>{nextStage ? d(nextStage.label) : '—'}</strong><p>{t(gateLabelKeys[gate.reason], { value: gateValue })}</p></div>
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
                <span>{event.kind === 'transition' ? <ArrowRight /> : event.operationType ? operationIcon(event.operationType as RedOperationType) : <Check />}</span>
                <div><strong>{event.kind === 'transition' ? t('redEngine.transition') : event.operationType ? t(operationLabelKeys[event.operationType as RedOperationType] as Parameters<typeof t>[0]) : '—'}</strong><small>{event.operator} · {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.performedAt))}</small><em>{eventDetail(event)}</em></div>
                <Check size={14} />
              </article>
            ))}
            {!lotEvents.length && <div className="red-empty-events"><Clock3 /><span>{t('redEngine.noRecords')}</span></div>}
          </div>
        </div>
      </div>

      {selectedOperation && <RedOperationSheet lot={lot} type={selectedOperation} onClose={() => setSelectedOperation(null)} onSave={(input) => { onRecordOperation(input); setSelectedOperation(null) }} />}
    </section>
  )
}

function RedOperationSheet({ lot, type, onClose, onSave }: { lot: WineLot; type: RedOperationType; onClose: () => void; onSave: (input: NewRedOperationInput) => void }) {
  const { t, d, locale } = useLanguage()
  const [performedAt, setPerformedAt] = useState(nowForInput)
  const [operator, setOperator] = useState(getCurrentOperatorName())
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState(type === 'pump_over' ? '15' : type === 'punch_down' ? '10' : '')
  const [temperature, setTemperature] = useState(lot.temperature?.toFixed(1) ?? '')
  const [density, setDensity] = useState(lot.density?.toFixed(3) ?? '')
  const [product, setProduct] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<'kg' | 'g' | 'L' | 'mL'>('kg')
  const [freeRun, setFreeRun] = useState('')
  const [pressVolume, setPressVolume] = useState('')
  const [volumeAfter, setVolumeAfter] = useState(String(Math.round(lot.volume)))
  const [malicAcid, setMalicAcid] = useState('')
  const [freeSo2, setFreeSo2] = useState('')
  const [error, setError] = useState(false)
  const output = (numeric(freeRun) ?? 0) + (numeric(pressVolume) ?? 0)
  const loss = lot.volume > 0 ? Math.max(0, (lot.volume - output) / lot.volume * 100) : 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    try {
      onSave({
        lotId: lot.id, type, performedAt: new Date(performedAt).toISOString(), operator, notes,
        metrics: {
          durationMinutes: numeric(duration), temperature: numeric(temperature), density: numeric(density), volumeAfter: numeric(volumeAfter),
          freeRunVolume: numeric(freeRun), pressVolume: numeric(pressVolume), product: product.trim() || undefined, additionAmount: numeric(amount), additionUnit: unit,
          malicAcid: numeric(malicAcid), freeSo2: numeric(freeSo2),
        },
      })
    } catch {
      setError(true)
    }
  }

  const durationOperation = type === 'pump_over' || type === 'punch_down'
  const temperatureOperation = durationOperation || type === 'temperature_check' || type === 'density_check'
  return (
    <div className="red-operation-layer" role="dialog" aria-modal="true" aria-label={t('redEngine.formTitle')}>
      <form className="red-operation-sheet" onSubmit={submit} noValidate>
        <header><span className="red-sheet-icon">{operationIcon(type)}</span><div><small>{lot.id} · {t('redEngine.formTitle')}</small><h2>{t(operationLabelKeys[type] as Parameters<typeof t>[0])}</h2><p>{t('redEngine.formText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header>
        <div className="red-sheet-body">
          <div className="red-sheet-context"><span><small>{t('detail.currentStage')}</small><strong>{d(lot.stage)}</strong></span><span><small>{t('redEngine.volumeBefore')}</small><strong>{new Intl.NumberFormat(locale).format(lot.volume)} L</strong></span></div>
          <div className="red-form-grid">
            <label><span>{t('redEngine.performedAt')}</span><input type="datetime-local" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
            <label><span>{t('redEngine.operator')}</span><input value={operator} onChange={(event) => setOperator(event.target.value)} required /></label>
            {durationOperation && <label><span>{t('redEngine.duration')}</span><div className="unit-input"><input type="number" min="1" max="180" value={duration} onChange={(event) => setDuration(event.target.value)} required /><em>min</em></div></label>}
            {temperatureOperation && <label><span>{t('common.temperature')}</span><div className="unit-input"><input inputMode="decimal" value={temperature} onChange={(event) => setTemperature(event.target.value)} required={type === 'temperature_check'} /><em>°C</em></div></label>}
            {type === 'density_check' && <label><span>{t('common.density')}</span><input inputMode="decimal" value={density} onChange={(event) => setDensity(event.target.value)} required /></label>}
            {type === 'addition' && <><label className="wide"><span>{t('redEngine.product')}</span><input value={product} onChange={(event) => setProduct(event.target.value)} required /></label><label><span>{t('redEngine.amount')}</span><input type="number" min="0.001" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label><span>{t('common.volume')}</span><select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}><option>kg</option><option>g</option><option>L</option><option>mL</option></select></label></>}
            {type === 'devatting_pressing' && <><label><span>{t('redEngine.freeRun')}</span><div className="unit-input"><input type="number" min="0" max={lot.volume} step="1" value={freeRun} onChange={(event) => setFreeRun(event.target.value)} required /><em>L</em></div></label><label><span>{t('redEngine.pressVolume')}</span><div className="unit-input"><input type="number" min="0" max={lot.volume} step="1" value={pressVolume} onChange={(event) => setPressVolume(event.target.value)} required /><em>L</em></div></label></>}
            {type === 'racking' && <label><span>{t('redEngine.reconciledVolume')}</span><div className="unit-input"><input type="number" min="1" max={lot.volume} step="1" value={volumeAfter} onChange={(event) => setVolumeAfter(event.target.value)} required /><em>L</em></div></label>}
            {type === 'malolactic_check' && <label><span>{t('redEngine.malicAcid')}</span><div className="unit-input"><input type="number" min="0" max="10" step="0.01" value={malicAcid} onChange={(event) => setMalicAcid(event.target.value)} required /><em>g/L</em></div></label>}
            {type === 'so2_adjustment' && <label><span>{t('redEngine.freeSo2')}</span><div className="unit-input"><input type="number" min="0" max="200" step="1" value={freeSo2} onChange={(event) => setFreeSo2(event.target.value)} required /><em>mg/L</em></div></label>}
            <label className="wide"><span>{t('redEngine.notes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('redEngine.notesPlaceholder')} /></label>
          </div>
          {type === 'devatting_pressing' && <div className={`red-volume-preview ${output > lot.volume ? 'invalid' : ''}`}><span><small>{t('redEngine.outputTotal')}</small><strong>{new Intl.NumberFormat(locale).format(output)} L</strong></span><i /><span><small>{t('redEngine.estimatedLoss')}</small><strong>{loss.toFixed(1)}%</strong></span></div>}
          <div className="red-local-notice"><ShieldCheck /><span><strong>{t('redEngine.localOperator')}</strong><small>{t('redEngine.notAuthenticated')}</small></span></div>
          {error && <p className="form-error">{t('redEngine.formError')}</p>}
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Check /> {t('redEngine.saveOperation')}</button></footer>
      </form>
    </div>
  )
}
