import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardCheck,
  Droplets, Grape, Leaf, MapPin, Save, Scale, Thermometer, Warehouse, X,
} from 'lucide-react'
import { nextLotCode } from './domain'
import type { NewLotInput, NewTaskInput, Tank, WineLot } from './types'

const numberValue = (value: string) => Number(value.replace(',', '.'))

interface CreateLotSheetProps {
  type: NewLotInput['type']
  lots: WineLot[]
  tanks: Tank[]
  onClose: () => void
  onCreate: (input: NewLotInput) => void
}

export function CreateLotSheet({ type, lots, tanks, onClose, onCreate }: CreateLotSheetProps) {
  const vintage = 2026
  const freeTanks = useMemo(() => tanks.filter((tank) => tank.volume === 0), [tanks])
  const initialVolume = type === 'tinto' ? 6500 : 4800
  const initialTank = freeTanks.find((tank) => tank.capacity >= initialVolume)?.id ?? freeTanks[0]?.id ?? ''
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<NewLotInput>({
    type,
    id: nextLotCode(type, vintage, lots),
    name: '',
    vintage,
    varieties: type === 'tinto' ? '100% Tempranillo' : '100% Viura',
    origin: 'Alberite · Rioja Oriental',
    receptionDate: new Date().toISOString().slice(0, 10),
    receivedKg: type === 'tinto' ? 9000 : 7200,
    volume: initialVolume,
    vessel: initialTank,
    temperature: type === 'tinto' ? 18 : 12,
    density: 1.09,
    macerationPlan: type === 'tinto' ? 'Tradicional · 8–12 días' : undefined,
    pressFraction: type === 'blanco' ? 'Mosto yema' : undefined,
    turbidityTarget: type === 'blanco' ? 100 : undefined,
    protection: type === 'blanco' ? 'Inertizado con CO₂' : undefined,
  })

  const update = <K extends keyof NewLotInput>(key: K, value: NewLotInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const selectedTank = freeTanks.find((tank) => tank.id === draft.vessel)
  const validate = () => {
    if (step === 0) {
      if (!draft.id.trim() || !draft.name.trim() || !draft.varieties.trim() || !draft.origin.trim()) return 'Completa la identidad y procedencia del lote.'
      if (lots.some((lot) => lot.id.toLowerCase() === draft.id.trim().toLowerCase())) return 'Ese código de lote ya existe.'
    }
    if (step === 1) {
      if (!draft.vessel) return 'Selecciona un depósito disponible.'
      if (!selectedTank) return 'El depósito seleccionado ya no está disponible.'
      if (draft.volume <= 0 || draft.receivedKg <= 0) return 'El peso y el volumen deben ser superiores a cero.'
      if (draft.volume > selectedTank.capacity) return `El volumen supera la capacidad de ${selectedTank.id}.`
      if (draft.density < 0.98 || draft.density > 1.2) return 'Revisa la densidad inicial introducida.'
      if (draft.temperature < 0 || draft.temperature > 40) return 'Revisa la temperatura de recepción.'
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
  const yieldPercentage = draft.receivedKg > 0 ? Math.round(draft.volume / draft.receivedKg * 100) : 0

  return (
    <div className="sheet-layer lot-flow-layer" role="dialog" aria-modal="true" aria-label="Crear lote">
      <button className="sheet-scrim" onClick={onClose} aria-label="Cerrar" />
      <form className="lot-flow" onSubmit={submit}>
        <div className="lot-flow-head">
          <div>
            <span className={`flow-type-icon ${type}`}>{isRed ? <Grape /> : <Leaf />}</span>
            <span><small>Nueva elaboración</small><strong>{isRed ? 'Tinto' : 'Blanco'}</strong></span>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="flow-progress" aria-label={`Paso ${step + 1} de 3`}>
          {['Identidad', 'Recepción', 'Revisión'].map((label, index) => (
            <span key={label} className={index === step ? 'active' : index < step ? 'complete' : ''}>
              <i>{index < step ? <Check size={13} /> : index + 1}</i><em>{label}</em>
            </span>
          ))}
        </div>

        <div className="lot-flow-body">
          {step === 0 && (
            <section className="flow-section">
              <div className="flow-title"><span className="eyebrow">Paso 1</span><h2>Identidad y procedencia</h2><p>La información que acompañará al lote durante toda su trazabilidad.</p></div>
              <div className="form-grid">
                <FlowField label="Código de lote" hint="Único">
                  <input required value={draft.id} onChange={(event) => update('id', event.target.value.toUpperCase())} />
                </FlowField>
                <FlowField label="Añada">
                  <input type="number" min="2020" max="2035" required value={draft.vintage} onChange={(event) => update('vintage', Number(event.target.value))} />
                </FlowField>
                <FlowField label="Nombre del lote" wide>
                  <input autoFocus required value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder={isRed ? 'Ej. Ladera de Alberite' : 'Ej. Viura del Iregua'} />
                </FlowField>
                <FlowField label="Variedades" icon={<Grape size={16} />} wide>
                  <input required value={draft.varieties} onChange={(event) => update('varieties', event.target.value)} />
                </FlowField>
                <FlowField label="Origen" icon={<MapPin size={16} />} wide>
                  <input required value={draft.origin} onChange={(event) => update('origin', event.target.value)} />
                </FlowField>
                <FlowField label="Fecha de recepción" icon={<CalendarDays size={16} />} wide>
                  <input type="date" required value={draft.receptionDate} onChange={(event) => update('receptionDate', event.target.value)} />
                </FlowField>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="flow-section">
              <div className="flow-title"><span className="eyebrow">Paso 2</span><h2>Recepción y encubado</h2><p>{isRed ? 'Datos iniciales para comenzar la selección, el despalillado y la maceración.' : 'Datos iniciales para controlar prensado, protección y desfangado.'}</p></div>
              <div className="form-grid">
                <FlowField label="Uva recibida" suffix="kg" icon={<Scale size={16} />}>
                  <input type="number" min="1" step="1" required value={draft.receivedKg} onChange={(event) => update('receivedKg', Number(event.target.value))} />
                </FlowField>
                <FlowField label="Volumen estimado" suffix="L" icon={<Droplets size={16} />}>
                  <input type="number" min="1" step="1" required value={draft.volume} onChange={(event) => update('volume', Number(event.target.value))} />
                </FlowField>
                <FlowField label="Temperatura" suffix="°C" icon={<Thermometer size={16} />}>
                  <input inputMode="decimal" required value={draft.temperature} onChange={(event) => update('temperature', numberValue(event.target.value))} />
                </FlowField>
                <FlowField label="Densidad inicial" suffix="g/mL" icon={<Droplets size={16} />}>
                  <input inputMode="decimal" required value={draft.density} onChange={(event) => update('density', numberValue(event.target.value))} />
                </FlowField>
                <FlowField label="Depósito disponible" icon={<Warehouse size={16} />} wide>
                  <select required value={draft.vessel} onChange={(event) => update('vessel', event.target.value)}>
                    <option value="">Seleccionar depósito</option>
                    {freeTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {tank.capacity.toLocaleString('es-ES')} L</option>)}
                  </select>
                </FlowField>
              </div>
              <div className={`specific-process-card ${type}`}>
                <span className="flow-type-icon">{isRed ? <Grape /> : <Leaf />}</span>
                <div><small>Configuración específica</small><strong>{isRed ? 'Maceración y gestión del sombrero' : 'Prensado y protección del mosto'}</strong></div>
                {isRed ? (
                  <select value={draft.macerationPlan} onChange={(event) => update('macerationPlan', event.target.value)}>
                    <option>Tradicional · 8–12 días</option>
                    <option>Maceración corta · 5–7 días</option>
                    <option>Prefermentativa en frío</option>
                  </select>
                ) : (
                  <div className="specific-fields">
                    <select value={draft.pressFraction} onChange={(event) => update('pressFraction', event.target.value)}>
                      <option>Mosto yema</option><option>Primera prensada</option><option>Mosto yema + primera prensada</option>
                    </select>
                    <select value={draft.protection} onChange={(event) => update('protection', event.target.value)}>
                      <option>Inertizado con CO₂</option><option>Inertizado con N₂</option><option>Protección antioxidante</option>
                    </select>
                    <label><span>Turbidez objetivo</span><div><input type="number" min="20" max="300" value={draft.turbidityTarget} onChange={(event) => update('turbidityTarget', Number(event.target.value))} /><i>NTU</i></div></label>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="flow-section review-section">
              <div className="flow-title"><span className="eyebrow">Paso 3</span><h2>Todo listo para recibir la uva</h2><p>Revisa el lote antes de incorporarlo a la bodega.</p></div>
              <div className={`review-hero ${type}`}><span>{isRed ? <Grape /> : <Leaf />}</span><div><small>{draft.id} · Añada {draft.vintage}</small><h3>{draft.name}</h3><p>{draft.varieties}</p><em><MapPin size={14} /> {draft.origin}</em></div></div>
              <div className="review-grid">
                <ReviewValue label="Recepción" value={new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(`${draft.receptionDate}T12:00:00`))} />
                <ReviewValue label="Uva recibida" value={`${draft.receivedKg.toLocaleString('es-ES')} kg`} />
                <ReviewValue label="Volumen" value={`${draft.volume.toLocaleString('es-ES')} L`} />
                <ReviewValue label="Rendimiento estimado" value={`${yieldPercentage}%`} />
                <ReviewValue label="Depósito" value={draft.vessel} />
                <ReviewValue label="Ocupación" value={selectedTank ? `${Math.round(draft.volume / selectedTank.capacity * 100)}%` : '—'} />
              </div>
              <div className="next-steps-card"><CheckCircle2 size={20} /><div><strong>Se crearán automáticamente</strong><p>El lote, su asignación al depósito, la lectura de recepción y la primera tarea del proceso.</p></div></div>
            </section>
          )}
          {error && <div className="form-error" role="alert">{error}</div>}
        </div>

        <div className="lot-flow-actions">
          <button type="button" className="secondary-button" onClick={() => step ? setStep((current) => current - 1) : onClose()}>{step ? <><ArrowLeft size={17} /> Anterior</> : 'Cancelar'}</button>
          <button type="submit" className="primary-button">{step < 2 ? <>Continuar <ArrowRight size={17} /></> : <><Save size={17} /> Crear lote</>}</button>
        </div>
      </form>
    </div>
  )
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
  const [draft, setDraft] = useState<NewTaskInput>({ title: '', lot: lots[0]?.id ?? '', time: 'Hoy', assignee: 'Elena', priority: 'normal' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.title.trim() && draft.lot) onCreate(draft)
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label="Nueva tarea">
      <button className="sheet-scrim" onClick={onClose} aria-label="Cerrar" />
      <form className="reading-sheet task-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="drawer-head"><div><span className="eyebrow">Agenda de bodega</span><h2>Nueva tarea</h2><p>Asigna una operación a un lote activo.</p></div><button className="icon-button" type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="task-sheet-icon"><ClipboardCheck /><span><small>Operación pendiente</small><strong>Quedará visible en Hoy y Tareas</strong></span></div>
        <div className="form-grid single">
          <FlowField label="Descripción" wide><input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ej. Revisar temperatura" /></FlowField>
          <FlowField label="Lote" wide><select required value={draft.lot} onChange={(event) => setDraft({ ...draft, lot: event.target.value })}>{lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.name}</option>)}</select></FlowField>
          <FlowField label="Momento"><input required value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} placeholder="Hoy · 16:00" /></FlowField>
          <FlowField label="Responsable"><select value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}><option>Elena</option><option>Martín</option><option>Lucía</option></select></FlowField>
          <FlowField label="Prioridad" wide><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as NewTaskInput['priority'] })}><option value="normal">Normal</option><option value="media">Media</option><option value="alta">Alta</option></select></FlowField>
        </div>
        <div className="sheet-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button"><Save size={18} /> Crear tarea</button></div>
      </form>
    </div>
  )
}
