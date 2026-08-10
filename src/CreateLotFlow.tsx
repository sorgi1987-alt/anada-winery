import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getCurrentOperatorName } from './operator'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardCheck,
  Droplets, Grape, Leaf, MapPin, Save, Scale, Sparkles, Thermometer, Warehouse, X,
} from 'lucide-react'
import { nextLotCode, roseConfigurationIssues } from './domain'
import { tankUsableCapacity } from './cellar'
import { useLanguage } from './i18n'
import type { NewLotInput, NewTaskInput, RoseMethod, Tank, WineLot } from './types'

const numberValue = (value: string) => Number(value.replace(',', '.'))
const roseMethodLabelKey: Record<RoseMethod, 'rose.method.direct_press' | 'rose.method.short_maceration' | 'rose.method.saignee' | 'rose.method.cofermentation'> = {
  direct_press: 'rose.method.direct_press', short_maceration: 'rose.method.short_maceration', saignee: 'rose.method.saignee', cofermentation: 'rose.method.cofermentation',
}
const roseIssueTranslation = {
  red_percentage: 'rose.error.red_percentage', blend_after_weighing: 'rose.error.blend_after_weighing', color_intensity: 'rose.error.color_intensity',
  yield: 'rose.error.yield', clarete_method: 'rose.error.clarete_method', maceration_hours: 'rose.error.maceration_hours',
} as const

interface CreateLotSheetProps {
  type: NewLotInput['type']
  lots: WineLot[]
  tanks: Tank[]
  onClose: () => void
  onCreate: (input: NewLotInput) => void
}

export function CreateLotSheet({ type, lots, tanks, onClose, onCreate }: CreateLotSheetProps) {
  const { t, d, locale } = useLanguage()
  const vintage = 2026
  const freeTanks = useMemo(() => tanks.filter((tank) => tank.volume === 0), [tanks])
  const initialVolume = type === 'tinto' ? 6500 : type === 'rosado' ? 4500 : 4800
  const initialTank = freeTanks.find((tank) => tankUsableCapacity(tank) >= initialVolume)?.id ?? freeTanks[0]?.id ?? ''
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<NewLotInput>({
    type,
    id: nextLotCode(type, vintage, lots),
    name: '',
    vintage,
    varieties: type === 'tinto' ? '100% Tempranillo' : type === 'rosado' ? '60% Viura · 40% Garnacha Tinta' : '100% Viura',
    origin: 'Alberite · Rioja Oriental',
    receptionDate: new Date().toISOString().slice(0, 10),
    receivedKg: type === 'tinto' ? 9000 : type === 'rosado' ? 6500 : 7200,
    volume: initialVolume,
    vessel: initialTank,
    temperature: type === 'tinto' ? 18 : type === 'rosado' ? 14 : 12,
    density: 1.09,
    macerationPlan: type === 'tinto' ? 'Tradicional · 8–12 días' : undefined,
    pressFraction: type !== 'tinto' ? 'Mosto yema + primera prensada' : undefined,
    turbidityTarget: type !== 'tinto' ? 100 : undefined,
    protection: type !== 'tinto' ? 'Inertizado con CO₂' : undefined,
    roseStyle: type === 'rosado' ? 'clarete' : undefined,
    roseMethod: type === 'rosado' ? 'cofermentation' : undefined,
    redGrapePercentage: type === 'rosado' ? 40 : undefined,
    blendAfterWeighing: type === 'rosado' ? true : undefined,
    macerationHours: type === 'rosado' ? 18 : undefined,
    targetColorIntensity: type === 'rosado' ? 0.8 : undefined,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const update = <K extends keyof NewLotInput>(key: K, value: NewLotInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const selectedTank = freeTanks.find((tank) => tank.id === draft.vessel)
  const validate = () => {
    if (step === 0) {
      if (!draft.id.trim() || !draft.name.trim() || !draft.varieties.trim() || !draft.origin.trim()) return t('flow.errorIdentity')
      if (lots.some((lot) => lot.id.toLowerCase() === draft.id.trim().toLowerCase())) return t('flow.errorDuplicate')
    }
    if (step === 1) {
      if (!draft.vessel) return t('flow.errorTank')
      if (!selectedTank) return t('flow.errorUnavailable')
      if (draft.volume <= 0 || draft.receivedKg <= 0) return t('flow.errorPositive')
      if (draft.volume > tankUsableCapacity(selectedTank)) return t('flow.errorCapacity', { id: selectedTank.id })
      if (draft.density < 0.98 || draft.density > 1.2) return t('flow.errorDensity')
      if (draft.temperature < 0 || draft.temperature > 40) return t('flow.errorTemperature')
      if (type === 'rosado') {
        const issue = roseConfigurationIssues(draft)[0]
        if (issue) return t(roseIssueTranslation[issue as keyof typeof roseIssueTranslation])
      }
    }
    return ''
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    if (step < 2) setStep((current) => current + 1)
    else onCreate(draft)
  }

  const isRed = type === 'tinto'
  const isRose = type === 'rosado'
  const yieldPercentage = draft.receivedKg > 0 ? Math.round(draft.volume / draft.receivedKg * 100) : 0
  const typeLabel = isRed ? t('wine.red') : isRose ? t('wine.roseClarete') : t('wine.white')
  const TypeIcon = isRed ? Grape : isRose ? Sparkles : Leaf

  return createPortal((
    <div className="sheet-layer lot-flow-layer" role="dialog" aria-modal="true" aria-label={t('flow.createLot')}>
      <button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} />
      <form className="lot-flow" onSubmit={submit}>
        <div className="lot-flow-head">
          <div>
            <span className={`flow-type-icon ${type}`}><TypeIcon /></span>
            <span><small>{t('flow.newProduction')}</small><strong>{typeLabel}</strong></span>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button>
        </div>

        <div className="flow-progress" aria-label={t('flow.progress', { step: step + 1 })}>
          {[t('flow.identity'), t('flow.reception'), t('flow.review')].map((label, index) => (
            <span key={label} className={index === step ? 'active' : index < step ? 'complete' : ''}>
              <i>{index < step ? <Check size={13} /> : index + 1}</i><em>{label}</em>
            </span>
          ))}
        </div>

        <div className="lot-flow-body">
          {step === 0 && (
            <section className="flow-section">
              <div className="flow-title"><span className="eyebrow">{t('flow.step', { step: 1 })}</span><h2>{t('flow.identityTitle')}</h2><p>{t('flow.identityText')}</p></div>
              <div className="form-grid">
                <FlowField label={t('flow.lotCode')} hint={t('flow.unique')}>
                  <input required value={draft.id} onChange={(event) => update('id', event.target.value.toUpperCase())} />
                </FlowField>
                <FlowField label={t('common.vintage')}>
                  <input type="number" min="2020" max="2035" required value={draft.vintage} onChange={(event) => update('vintage', Number(event.target.value))} />
                </FlowField>
                <FlowField label={t('flow.lotName')} wide>
                  <input required value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder={isRed ? t('flow.redName') : isRose ? t('rose.namePlaceholder') : t('flow.whiteName')} />
                </FlowField>
                <FlowField label={t('common.varieties')} icon={<Grape size={16} />} wide>
                  <input required value={draft.varieties} onChange={(event) => update('varieties', event.target.value)} />
                </FlowField>
                <FlowField label={t('common.origin')} icon={<MapPin size={16} />} wide>
                  <input required value={draft.origin} onChange={(event) => update('origin', event.target.value)} />
                </FlowField>
                <FlowField label={t('flow.receptionDate')} icon={<CalendarDays size={16} />} wide>
                  <input type="date" required value={draft.receptionDate} onChange={(event) => update('receptionDate', event.target.value)} />
                </FlowField>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="flow-section">
              <div className="flow-title"><span className="eyebrow">{t('flow.step', { step: 2 })}</span><h2>{t('flow.receptionTitle')}</h2><p>{isRed ? t('flow.redReceptionText') : isRose ? t('rose.receptionText') : t('flow.whiteReceptionText')}</p></div>
              <div className="form-grid">
                <FlowField label={t('flow.grapesReceived')} suffix="kg" icon={<Scale size={16} />}>
                  <input type="number" min="1" step="1" required value={draft.receivedKg} onChange={(event) => update('receivedKg', Number(event.target.value))} />
                </FlowField>
                <FlowField label={t('flow.estimatedVolume')} suffix="L" icon={<Droplets size={16} />}>
                  <input type="number" min="1" step="1" required value={draft.volume} onChange={(event) => update('volume', Number(event.target.value))} />
                </FlowField>
                <FlowField label={t('common.temperature')} suffix="°C" icon={<Thermometer size={16} />}>
                  <input inputMode="decimal" required value={draft.temperature} onChange={(event) => update('temperature', numberValue(event.target.value))} />
                </FlowField>
                <FlowField label={t('detail.initialDensity')} suffix="g/mL" icon={<Droplets size={16} />}>
                  <input inputMode="decimal" required value={draft.density} onChange={(event) => update('density', numberValue(event.target.value))} />
                </FlowField>
                <FlowField label={t('flow.availableTank')} icon={<Warehouse size={16} />} wide>
                  <select required value={draft.vessel} onChange={(event) => update('vessel', event.target.value)}>
                    <option value="">{t('flow.selectTank')}</option>
                    {freeTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {tank.capacity.toLocaleString(locale)} L</option>)}
                  </select>
                </FlowField>
              </div>
              <div className={`specific-process-card ${type}`}>
                <span className="flow-type-icon"><TypeIcon /></span>
                <div><small>{t('flow.specificConfig')}</small><strong>{isRed ? t('flow.redConfig') : isRose ? t('rose.config') : t('flow.whiteConfig')}</strong></div>
                {isRed ? (
                  <select value={draft.macerationPlan} onChange={(event) => update('macerationPlan', event.target.value)}>
                    {['Tradicional · 8–12 días', 'Maceración corta · 5–7 días', 'Prefermentativa en frío'].map((option) => <option key={option} value={option}>{d(option)}</option>)}
                  </select>
                ) : isRose ? (
                  <div className="rose-specific-fields">
                    <label><span>{t('rose.style')}</span><select value={draft.roseStyle} onChange={(event) => {
                      const style = event.target.value as NonNullable<NewLotInput['roseStyle']>
                      setDraft((current) => ({ ...current, roseStyle: style, roseMethod: style === 'clarete' ? 'cofermentation' : current.roseMethod === 'cofermentation' ? 'direct_press' : current.roseMethod }))
                      setError('')
                    }}><option value="rosado">{t('rose.styleRose')}</option><option value="clarete">{t('rose.styleClarete')}</option></select></label>
                    <label><span>{t('rose.method')}</span><select value={draft.roseMethod} onChange={(event) => update('roseMethod', event.target.value as NonNullable<NewLotInput['roseMethod']>)}>
                      {draft.roseStyle === 'clarete'
                        ? <option value="cofermentation">{t('rose.methodCofermentation')}</option>
                        : <><option value="direct_press">{t('rose.methodDirect')}</option><option value="short_maceration">{t('rose.methodMaceration')}</option><option value="saignee">{t('rose.methodSaignee')}</option></>}
                    </select></label>
                    <label><span>{t('rose.redPercentage')}</span><div><input type="number" min="0.01" max="100" step="0.01" value={draft.redGrapePercentage} onChange={(event) => update('redGrapePercentage', Number(event.target.value))} /><i>%</i></div></label>
                    <label><span>{t('rose.colorTarget')}</span><div><input type="number" min="0.01" max="10" step="0.01" value={draft.targetColorIntensity} onChange={(event) => update('targetColorIntensity', numberValue(event.target.value))} /><i>UA/cm</i></div></label>
                    {draft.roseMethod !== 'direct_press' && <label><span>{t('rose.macerationHours')}</span><div><input type="number" min="1" max="168" value={draft.macerationHours} onChange={(event) => update('macerationHours', Number(event.target.value))} /><i>h</i></div></label>}
                    <label><span>{t('detail.turbidityTarget')}</span><div><input type="number" min="20" max="300" value={draft.turbidityTarget} onChange={(event) => update('turbidityTarget', Number(event.target.value))} /><i>NTU</i></div></label>
                    <label className="rose-wide-field"><span>{t('rose.pressFraction')}</span><select value={draft.pressFraction} onChange={(event) => update('pressFraction', event.target.value)}>{['Mosto yema', 'Primera prensada', 'Mosto yema + primera prensada'].map((option) => <option key={option} value={option}>{d(option)}</option>)}</select></label>
                    <label className="rose-wide-field"><span>{t('rose.protection')}</span><select value={draft.protection} onChange={(event) => update('protection', event.target.value)}>{['Inertizado con CO₂', 'Inertizado con N₂', 'Protección antioxidante'].map((option) => <option key={option} value={option}>{d(option)}</option>)}</select></label>
                    <label className="rose-weighbridge"><input type="checkbox" checked={Boolean(draft.blendAfterWeighing)} onChange={(event) => update('blendAfterWeighing', event.target.checked)} /><span><strong>{t('rose.afterWeighbridge')}</strong><small>{t('rose.afterWeighbridgeText')}</small></span></label>
                  </div>
                ) : (
                  <div className="specific-fields">
                    <select value={draft.pressFraction} onChange={(event) => update('pressFraction', event.target.value)}>
                      {['Mosto yema', 'Primera prensada', 'Mosto yema + primera prensada'].map((option) => <option key={option} value={option}>{d(option)}</option>)}
                    </select>
                    <select value={draft.protection} onChange={(event) => update('protection', event.target.value)}>
                      {['Inertizado con CO₂', 'Inertizado con N₂', 'Protección antioxidante'].map((option) => <option key={option} value={option}>{d(option)}</option>)}
                    </select>
                    <label><span>{t('detail.turbidityTarget')}</span><div><input type="number" min="20" max="300" value={draft.turbidityTarget} onChange={(event) => update('turbidityTarget', Number(event.target.value))} /><i>NTU</i></div></label>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flow-section review-section">
              <div className="flow-title"><span className="eyebrow">{t('flow.step', { step: 3 })}</span><h2>{t('flow.ready')}</h2><p>{t('flow.reviewText')}</p></div>
              <div className={`review-hero ${type}`}><span><TypeIcon /></span><div><small>{draft.id} · {t('common.vintage')} {draft.vintage}</small><h3>{draft.name}</h3><p>{draft.varieties}</p><em><MapPin size={14} /> {draft.origin}</em></div></div>
              <div className="review-grid">
                <ReviewValue label={t('flow.reception')} value={new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${draft.receptionDate}T12:00:00`))} />
                <ReviewValue label={t('flow.grapesReceived')} value={`${draft.receivedKg.toLocaleString(locale)} kg`} />
                <ReviewValue label={t('common.volume')} value={`${draft.volume.toLocaleString(locale)} L`} />
                <ReviewValue label={t('flow.estimatedYield')} value={`${yieldPercentage}%`} />
                <ReviewValue label={t('detail.vessel')} value={draft.vessel} />
                <ReviewValue label={t('common.occupancy')} value={selectedTank ? `${Math.round(draft.volume / selectedTank.capacity * 100)}%` : '—'} />
                {isRose && draft.roseMethod && <><ReviewValue label={t('rose.style')} value={draft.roseStyle === 'clarete' ? t('rose.styleClarete') : t('rose.styleRose')} /><ReviewValue label={t('rose.method')} value={t(roseMethodLabelKey[draft.roseMethod])} /></>}
              </div>
              {isRose && <div className="rose-eligibility-card"><CheckCircle2 size={20} /><div><strong>{t('rose.configurationOk')}</strong><p>{t('rose.configurationOkText', { red: draft.redGrapePercentage ?? 0, yield: yieldPercentage })}</p></div></div>}
              <div className="next-steps-card"><CheckCircle2 size={20} /><div><strong>{t('flow.autoCreate')}</strong><p>{t('flow.autoCreateText')}</p></div></div>
            </section>
          )}
          {error && <div className="form-error" role="alert">{error}</div>}
        </div>

        <div className="lot-flow-actions">
          <button type="button" className="secondary-button" onClick={() => step ? setStep((current) => current - 1) : onClose()}>{step ? <><ArrowLeft size={17} /> {t('common.previous')}</> : t('common.cancel')}</button>
          <button type="submit" className="primary-button">{step < 2 ? <>{t('common.continue')} <ArrowRight size={17} /></> : <><Save size={17} /> {t('flow.createLot')}</>}</button>
        </div>
      </form>
    </div>
  ), document.body)
}

function FlowField({ label, hint, suffix, icon, wide = false, children }: { label: string; hint?: string; suffix?: string; icon?: ReactNode; wide?: boolean; children: ReactNode }) {
  return <label className={`flow-field ${wide ? 'wide' : ''}`}><span>{icon}{label}{hint && <small>{hint}</small>}</span><div>{children}{suffix && <i>{suffix}</i>}</div></label>
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return <span><small>{label}</small><strong>{value}</strong></span>
}

interface NewTaskSheetProps {
  lots: WineLot[]
  onClose: () => void
  onCreate: (input: NewTaskInput) => void
}

export function NewTaskSheet({ lots, onClose, onCreate }: NewTaskSheetProps) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState<NewTaskInput>({ title: '', lot: lots[0]?.id ?? '', time: t('common.today'), assignee: getCurrentOperatorName(), priority: 'normal' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.title.trim() && draft.lot) onCreate(draft)
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={t('task.new')}>
      <button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} />
      <form className="reading-sheet task-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="drawer-head"><div><span className="eyebrow">{t('task.agenda')}</span><h2>{t('task.new')}</h2><p>{t('task.assign')}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></div>
        <div className="task-sheet-icon"><ClipboardCheck /><span><small>{t('task.pendingOperation')}</small><strong>{t('task.visible')}</strong></span></div>
        <div className="form-grid single">
          <FlowField label={t('task.description')} wide><input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t('task.placeholder')} /></FlowField>
          <FlowField label={t('task.lot')} wide><select required value={draft.lot} onChange={(event) => setDraft({ ...draft, lot: event.target.value })}>{lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.name}</option>)}</select></FlowField>
          <FlowField label={t('task.moment')}><input required value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} placeholder={`${t('common.today')} · 16:00`} /></FlowField>
          <FlowField label={t('task.responsible')}><select value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}><option>Elena</option><option>Martín</option><option>Lucía</option></select></FlowField>
          <FlowField label={t('task.priority')} wide><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as NewTaskInput['priority'] })}><option value="normal">{t('task.normal')}</option><option value="media">{t('task.medium')}</option><option value="alta">{t('task.high')}</option></select></FlowField>
        </div>
        <div className="sheet-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Save size={18} /> {t('task.create')}</button></div>
      </form>
    </div>
  )
}
