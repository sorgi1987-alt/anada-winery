import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  Activity, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  Clock3, Grape, MapPin, Navigation, Plus, Scale, Sprout, Thermometer,
  Truck, UserRound, Warehouse, X,
} from 'lucide-react'
import { images } from './data'
import { useLanguage } from './i18n'
import { assessHarvestWeather, fetchWineryWeather, weatherCondition, type WineryWeather } from './weather'
import type { DeliveryStatus, GrapeDelivery, NewGrapeIntakeInput, VineyardParcel } from './types'

const statusKeys: Record<DeliveryStatus, 'harvest.statusPlanned' | 'harvest.statusEnRoute' | 'harvest.statusAtGate' | 'harvest.statusReceived'> = {
  planned: 'harvest.statusPlanned',
  en_route: 'harvest.statusEnRoute',
  at_gate: 'harvest.statusAtGate',
  received: 'harvest.statusReceived',
}

const readinessKeys: Record<VineyardParcel['readiness'], 'harvest.readinessSampling' | 'harvest.readinessReady' | 'harvest.readinessScheduled' | 'harvest.readinessHarvested'> = {
  sampling: 'harvest.readinessSampling',
  ready: 'harvest.readinessReady',
  scheduled: 'harvest.readinessScheduled',
  harvested: 'harvest.readinessHarvested',
}

const formatKg = (value: number, locale: string) => `${new Intl.NumberFormat(locale).format(value)} kg`

interface HarvestPageProps {
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  onOpenIntake: (deliveryId?: string) => void
  campaignName?: string
  campaignStatus?: 'planned' | 'active' | 'closed' | 'archived'
  timeZone: string
  latitude: number
  longitude: number
}

export function HarvestPage({ parcels, deliveries, onOpenIntake, campaignName, campaignStatus, timeZone, latitude, longitude }: HarvestPageProps) {
  const [view, setView] = useState<'overview' | 'parcels' | 'schedule'>('overview')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [weather, setWeather] = useState<WineryWeather | null>(null)
  const [weatherError, setWeatherError] = useState(false)
  const [weatherRefreshing, setWeatherRefreshing] = useState(false)
  const { t, locale } = useLanguage()
  const harvestDate = new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(currentDate)

  // Refresh after midnight without keeping an unnecessary second-by-second timer.
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const loadWeather = async () => {
      setWeatherRefreshing(true)
      try {
        const result = await fetchWineryWeather(latitude, longitude, timeZone, controller.signal)
        if (active) { setWeather(result); setWeatherError(false) }
      } catch {
        if (active) setWeatherError(true)
      } finally {
        if (active) setWeatherRefreshing(false)
      }
    }
    void loadWeather()
    const timer = window.setInterval(loadWeather, 15 * 60_000)
    return () => { active = false; controller.abort(); window.clearInterval(timer) }
  }, [latitude, longitude, timeZone])
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(currentDate)
  const currentDateKey = `${dateParts.find((part) => part.type === 'year')?.value}-${dateParts.find((part) => part.type === 'month')?.value}-${dateParts.find((part) => part.type === 'day')?.value}`
  const weatherAssessment = assessHarvestWeather(weather, locale)
  const campaignEstimate = parcels.reduce((total, parcel) => total + parcel.estimatedKg, 0)
  const campaignReceivedKg = deliveries.reduce((total, delivery) => total + (delivery.netKg ?? 0), 0)
  const todayDeliveries = deliveries.filter((delivery) => delivery.scheduledDate === currentDateKey)
  const receivedTodayKg = todayDeliveries.reduce((total, delivery) => total + (delivery.netKg ?? 0), 0)
  const scheduledKg = todayDeliveries.reduce((total, delivery) => total + (delivery.netKg ?? delivery.expectedKg), 0)
  const readyParcels = parcels.filter((parcel) => parcel.readiness === 'ready' || parcel.readiness === 'scheduled').length
  const progress = Math.max(1, Math.round(campaignReceivedKg / campaignEstimate * 100))
  const sortedDeliveries = [...deliveries].sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))

  return (
    <main className="harvest-page">
      <header className="page-header">
        <div><span className="eyebrow">{t('harvest.kicker')}</span><h1>{t('harvest.title')}</h1><p>{t('harvest.description')}</p></div>
        <div className="page-header-action"><button className="primary-button" disabled={campaignStatus !== 'active'} onClick={() => onOpenIntake()}><Scale size={18} /> {t('harvest.registerIntake')}</button></div>
      </header>

      <section className="harvest-hero" style={{ backgroundImage: `url(${images.vineyard})` }}>
        <div className="harvest-hero-overlay" />
        <div className="harvest-hero-copy">
          <span className="hero-season"><Sprout size={15} /> {campaignName ?? t('harvest.campaign')}</span>
          <h2>{t('harvest.heroTitle')}</h2>
          <p>{harvestDate} · {t('harvest.heroWindow')}</p>
          <div className={`harvest-assessment ${weatherAssessment.level}`} aria-live="polite"><strong>{weatherAssessment.title}</strong><span>{weatherAssessment.detail}</span></div>
          <div className="harvest-weather" aria-live="polite"><span><strong>{weather ? `${Math.round(weather.temperatureC)}°` : '—'}</strong><small>{weather ? weatherCondition(weather.weatherCode, locale) : weatherError ? (locale.startsWith('es') ? 'Sin datos' : 'Unavailable') : (locale.startsWith('es') ? 'Actualizando' : 'Updating')}</small></span><span><strong>{weather ? `${Math.round(weather.windSpeedKmh)} km/h` : '—'}</strong><small>{locale.startsWith('es') ? 'Viento actual' : 'Current wind'}</small></span><span><strong>{weather?.forecast48h ? `${weather.forecast48h.precipitationMm.toFixed(1)} mm` : '—'}</strong><small>{locale.startsWith('es') ? 'Lluvia 48 h' : 'Rain 48h'}</small></span></div>
          <div className="harvest-weather-meta">{weather ? `${locale.startsWith('es') ? 'Actualizado' : 'Updated'} ${new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(weather.fetchedAt))} · Open-Meteo${weather.cached ? ` · ${locale.startsWith('es') ? 'caché' : 'cached'}` : ''}` : weatherRefreshing ? (locale.startsWith('es') ? 'Consultando estación meteorológica…' : 'Fetching winery weather…') : ''}</div>
        </div>
        <div className="campaign-progress-card">
          <div className="campaign-ring" style={{ '--campaign-progress': `${progress * 3.6}deg` } as CSSProperties}><span><strong>{progress}%</strong><small>{t('harvest.received')}</small></span></div>
          <div><small>{t('harvest.campaignVolume')}</small><strong>{formatKg(campaignReceivedKg, locale)}</strong><span>{t('harvest.ofEstimate', { total: formatKg(campaignEstimate, locale) })}</span></div>
        </div>
      </section>

      <section className="harvest-metrics" aria-label={t('harvest.summary')}>
        <HarvestMetric icon={<Truck />} label={t('harvest.todayDeliveries')} value={String(todayDeliveries.length)} detail={formatKg(scheduledKg, locale)} tone="wine" />
        <HarvestMetric icon={<Sprout />} label={t('harvest.readyParcels')} value={String(readyParcels)} detail={t('harvest.ofParcels', { count: parcels.length })} tone="green" />
        <HarvestMetric icon={<Scale />} label={t('harvest.receivedToday')} value={formatKg(receivedTodayKg, locale)} detail={t('harvest.registeredIntakes', { count: todayDeliveries.filter((delivery) => delivery.status === 'received').length })} tone="gold" />
        <HarvestMetric icon={<Activity />} label={t('harvest.averageHealth')} value="96%" detail={t('harvest.noIncidents')} tone="stone" />
      </section>

      <div className="harvest-tabs" role="tablist" aria-label={t('harvest.views')}>
        {(['overview', 'parcels', 'schedule'] as const).map((item) => <button key={item} role="tab" aria-selected={view === item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{t(item === 'overview' ? 'harvest.overview' : item === 'parcels' ? 'harvest.parcels' : 'harvest.schedule')}</button>)}
      </div>

      {view === 'overview' && (
        <>
          <section className="harvest-overview-grid">
            <div className="panel delivery-panel">
              <HarvestSectionHeading title={t('harvest.todaySchedule')} subtitle={t('harvest.intakeSequence')} link={t('harvest.fullSchedule')} onClick={() => setView('schedule')} />
              <div className="delivery-list">
                {todayDeliveries.map((delivery) => <DeliveryRow key={delivery.id} delivery={delivery} onOpen={() => delivery.status !== 'received' && onOpenIntake(delivery.id)} />)}
              </div>
            </div>
            <div className="panel harvest-balance-panel">
              <HarvestSectionHeading title={t('harvest.varietyPlan')} subtitle={t('harvest.estimatedCampaign')} />
              <VarietyBar label="Tempranillo" value={58} detail={formatKg(70300, locale)} tone="red" />
              <VarietyBar label="Viura" value={16} detail={formatKg(19200, locale)} tone="white" />
              <VarietyBar label="Garnacha" value={12} detail={formatKg(14500, locale)} tone="rose" />
              <VarietyBar label={t('harvest.otherVarieties')} value={14} detail={formatKg(16400, locale)} tone="stone" />
              <div className="balance-note"><CheckCircle2 size={17} /><span><strong>{t('harvest.capacityAligned')}</strong><small>{t('harvest.capacityAlignedText')}</small></span></div>
            </div>
          </section>
          <section className="harvest-parcel-section">
            <HarvestSectionHeading title={t('harvest.nextParcels')} subtitle={t('harvest.maturityUpdated')} link={t('harvest.viewAllParcels')} onClick={() => setView('parcels')} />
            <div className="parcel-card-grid">{parcels.slice(0, 3).map((parcel) => <ParcelCard key={parcel.id} parcel={parcel} />)}</div>
          </section>
        </>
      )}

      {view === 'parcels' && <section className="parcel-card-grid full">{parcels.map((parcel) => <ParcelCard key={parcel.id} parcel={parcel} />)}</section>}

      {view === 'schedule' && (
        <section className="panel schedule-board">
          <div className="schedule-board-head"><div><h2>{t('harvest.deliverySchedule')}</h2><p>{t('harvest.scheduleText')}</p></div><button className="secondary-button" onClick={() => onOpenIntake('manual')}><Plus size={17} /> {t('harvest.unscheduled')}</button></div>
          <div className="schedule-table-head"><span>{t('harvest.time')}</span><span>{t('harvest.originGrower')}</span><span>{t('harvest.variety')}</span><span>{t('harvest.expected')}</span><span>{t('harvest.destination')}</span><span>{t('harvest.status')}</span></div>
          <div className="schedule-table">{sortedDeliveries.map((delivery) => <ScheduleRow key={delivery.id} delivery={delivery} onOpen={() => delivery.status !== 'received' && onOpenIntake(delivery.id)} />)}</div>
        </section>
      )}
    </main>
  )
}

function HarvestMetric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className="harvest-metric"><span className={`harvest-metric-icon ${tone}`}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article>
}

function HarvestSectionHeading({ title, subtitle, link, onClick }: { title: string; subtitle: string; link?: string; onClick?: () => void }) {
  return <header className="harvest-section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{link && <button onClick={onClick}>{link} <ChevronRight size={15} /></button>}</header>
}

function DeliveryRow({ delivery, onOpen }: { delivery: GrapeDelivery; onOpen: () => void }) {
  const { d, locale } = useLanguage()
  return (
    <button className={`delivery-row ${delivery.status}`} onClick={onOpen} disabled={delivery.status === 'received'}>
      <time>{delivery.scheduledTime}</time>
      <span className="delivery-line"><i /></span>
      <span className="delivery-copy"><strong>{delivery.varieties}</strong><small>{delivery.grower} · {delivery.origin}</small></span>
      <span className="delivery-weight"><strong>{formatKg(delivery.netKg ?? delivery.expectedKg, locale)}</strong><small>{d(delivery.processingDestination)}</small></span>
      <StatusPill status={delivery.status} />
      {delivery.status !== 'received' && <ChevronRight size={17} />}
    </button>
  )
}

function ScheduleRow({ delivery, onOpen }: { delivery: GrapeDelivery; onOpen: () => void }) {
  const { t, d, locale } = useLanguage()
  const date = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(`${delivery.scheduledDate}T12:00:00`))
  return <button className="schedule-row" onClick={onOpen} disabled={delivery.status === 'received'}><span><strong>{delivery.scheduledTime}</strong><small>{date}</small></span><span><strong>{delivery.grower}</strong><small><MapPin size={12} /> {delivery.origin}</small></span><span><strong>{delivery.varieties}</strong><small>{delivery.code}</small></span><span><strong>{formatKg(delivery.netKg ?? delivery.expectedKg, locale)}</strong><small>{delivery.vehicle}</small></span><span><strong>{d(delivery.processingDestination)}</strong><small>{t('harvest.processingLine')}</small></span><StatusPill status={delivery.status} /></button>
}

function StatusPill({ status }: { status: DeliveryStatus }) {
  const { t } = useLanguage()
  return <span className={`harvest-status ${status}`}>{status === 'received' && <Check size={12} />}{status === 'en_route' && <Navigation size={12} />}{status === 'at_gate' && <Truck size={12} />}{t(statusKeys[status])}</span>
}

function ParcelCard({ parcel }: { parcel: VineyardParcel }) {
  const { t, d, locale } = useLanguage()
  return (
    <article className="parcel-card">
      <div className="parcel-image" style={{ backgroundImage: `url(${parcel.image})` }}><span className={`parcel-readiness ${parcel.readiness}`}>{t(readinessKeys[parcel.readiness])}</span><span className="parcel-window"><CalendarDays size={13} /> {d(parcel.harvestWindow)}</span></div>
      <div className="parcel-body">
        <span className="parcel-id">{parcel.id}</span><h3>{parcel.name}</h3><p><MapPin size={13} /> {parcel.municipality} · {parcel.zone}</p>
        <div className="parcel-variety"><Grape size={15} /><span><small>{t('harvest.variety')}</small><strong>{parcel.varieties}</strong></span></div>
        <div className="parcel-sample-grid"><span><small>{t('harvest.potential')}</small><strong>{parcel.sample.potentialAlcohol.toFixed(1)}%</strong></span><span><small>pH</small><strong>{parcel.sample.ph.toFixed(2)}</strong></span><span><small>{t('harvest.acidity')}</small><strong>{parcel.sample.totalAcidity.toFixed(1)}</strong></span><span><small>{t('harvest.health')}</small><strong>{parcel.sample.health}%</strong></span></div>
        <footer><span><UserRound size={13} /> {parcel.grower}</span><strong>{parcel.hectares.toLocaleString(locale)} ha · {formatKg(parcel.estimatedKg, locale)}</strong></footer>
      </div>
    </article>
  )
}

function VarietyBar({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return <div className="variety-bar"><div><strong>{label}</strong><span>{detail} · {value}%</span></div><i><em className={tone} style={{ width: `${value}%` }} /></i></div>
}

interface IntakeSheetProps {
  deliveries: GrapeDelivery[]
  parcels: VineyardParcel[]
  initialDeliveryId?: string
  campaignName?: string
  onClose: () => void
  onSave: (input: NewGrapeIntakeInput) => void
}

export function IntakeSheet({ deliveries, parcels, initialDeliveryId, campaignName, onClose, onSave }: IntakeSheetProps) {
  const available = deliveries.filter((delivery) => delivery.status !== 'received')
  const initialDelivery = initialDeliveryId === 'manual' ? undefined : deliveries.find((delivery) => delivery.id === initialDeliveryId) ?? available.find((delivery) => delivery.status === 'at_gate')
  const firstParcel = parcels.find((parcel) => parcel.id === initialDelivery?.parcelId) ?? parcels[0]
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<NewGrapeIntakeInput>(() => ({
    deliveryId: initialDelivery?.id ?? '', parcelId: firstParcel?.id ?? '', scheduledDate: initialDelivery?.scheduledDate ?? '2026-09-19', scheduledTime: initialDelivery?.scheduledTime ?? '14:00',
    expectedKg: initialDelivery?.expectedKg ?? 6000, vehicle: initialDelivery?.vehicle ?? '', grossKg: Math.round((initialDelivery?.expectedKg ?? 6000) + 3500), tareKg: 3500,
    temperature: 18, potentialAlcohol: firstParcel?.sample.potentialAlcohol ?? 12.5, condition: 'good', processingDestination: initialDelivery?.processingDestination ?? 'Mesa de selección', notes: '',
  }))
  const { t, d, locale } = useLanguage()
  const parcel = parcels.find((item) => item.id === draft.parcelId)
  const netKg = Math.max(0, draft.grossKg - draft.tareKg)

  const selectDelivery = (deliveryId: string) => {
    const delivery = deliveries.find((item) => item.id === deliveryId)
    if (!delivery) {
      setDraft((current) => ({ ...current, deliveryId: '' }))
      return
    }
    const selectedParcel = parcels.find((item) => item.id === delivery.parcelId)
    setDraft((current) => ({ ...current, deliveryId: delivery.id, parcelId: delivery.parcelId, scheduledDate: delivery.scheduledDate, scheduledTime: delivery.scheduledTime, expectedKg: delivery.expectedKg, vehicle: delivery.vehicle, grossKg: delivery.expectedKg + current.tareKg, potentialAlcohol: selectedParcel?.sample.potentialAlcohol ?? current.potentialAlcohol, processingDestination: delivery.processingDestination }))
  }

  const next = () => {
    if (step === 1 && (!draft.parcelId || !draft.scheduledDate || !draft.scheduledTime || draft.expectedKg <= 0 || !draft.vehicle.trim())) return setError(t('intake.errorOrigin'))
    if (step === 2 && (netKg <= 0 || draft.grossKg <= draft.tareKg)) return setError(t('intake.errorWeight'))
    if (step === 2 && (draft.temperature < 0 || draft.temperature > 40 || draft.potentialAlcohol < 8 || draft.potentialAlcohol > 18)) return setError(t('intake.errorQuality'))
    setError('')
    setStep((current) => Math.min(3, current + 1))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.processingDestination) return setError(t('intake.errorDestination'))
    onSave(draft)
  }

  return (
    <div className="sheet-layer lot-flow-layer" role="dialog" aria-modal="true" aria-label={t('intake.title')}>
      <button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} />
      <form className="lot-flow intake-flow" onSubmit={submit}>
        <header className="lot-flow-head"><div><span className="flow-type-icon intake"><Scale size={20} /></span><span><small>{campaignName ?? t('harvest.campaign')}</small><strong>{t('intake.title')}</strong></span></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></header>
        <div className="flow-progress">
          {[t('intake.origin'), t('intake.weightQuality'), t('intake.destination')].map((label, index) => <span key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'complete' : ''}><i>{step > index + 1 ? <Check size={14} /> : index + 1}</i><em>{label}</em></span>)}
        </div>
        <div className="lot-flow-body">
          {step === 1 && <section className="flow-section"><FlowTitle eyebrow={t('intake.step', { step: 1 })} title={t('intake.originTitle')} text={t('intake.originText')} /><div className="form-grid">
            <IntakeField label={t('intake.plannedDelivery')} wide><select value={draft.deliveryId} onChange={(event) => selectDelivery(event.target.value)}><option value="">{t('intake.unscheduled')}</option>{available.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.scheduledTime} · {delivery.code} · {delivery.varieties}</option>)}</select></IntakeField>
            <IntakeField label={t('intake.parcel')} icon={<MapPin size={15} />}><select value={draft.parcelId} onChange={(event) => { const selected = parcels.find((item) => item.id === event.target.value); setDraft({ ...draft, parcelId: event.target.value, potentialAlcohol: selected?.sample.potentialAlcohol ?? draft.potentialAlcohol }) }}>{parcels.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.municipality}</option>)}</select></IntakeField>
            <IntakeField label={t('intake.vehicle')} icon={<Truck size={15} />}><input value={draft.vehicle} onChange={(event) => setDraft({ ...draft, vehicle: event.target.value })} placeholder="LO-0000-AA" /></IntakeField>
            <IntakeField label={t('intake.date')} icon={<CalendarDays size={15} />}><input type="date" value={draft.scheduledDate} onChange={(event) => setDraft({ ...draft, scheduledDate: event.target.value })} /></IntakeField>
            <IntakeField label={t('intake.time')} icon={<Clock3 size={15} />}><input type="time" value={draft.scheduledTime} onChange={(event) => setDraft({ ...draft, scheduledTime: event.target.value })} /></IntakeField>
            <IntakeField label={t('intake.expectedWeight')}><input type="number" min="1" value={draft.expectedKg} onChange={(event) => setDraft({ ...draft, expectedKg: Number(event.target.value) })} /><i>kg</i></IntakeField>
            <div className="intake-origin-card"><Sprout size={20} /><span><small>{parcel?.id}</small><strong>{parcel?.grower}</strong><em>{parcel?.varieties} · {parcel?.municipality}</em>{campaignName && <em>{t('harvest.campaign')}: {campaignName}</em>}</span></div>
          </div></section>}
          {step === 2 && <section className="flow-section"><FlowTitle eyebrow={t('intake.step', { step: 2 })} title={t('intake.weightTitle')} text={t('intake.weightText')} /><div className="intake-scale-card"><Scale size={24} /><span><small>{t('intake.netWeight')}</small><strong>{formatKg(netKg, locale)}</strong><em>{t('intake.calculatedWeight')}</em></span></div><div className="form-grid">
            <IntakeField label={t('intake.grossWeight')}><input type="number" min="1" value={draft.grossKg} onChange={(event) => setDraft({ ...draft, grossKg: Number(event.target.value) })} /><i>kg</i></IntakeField>
            <IntakeField label={t('intake.tareWeight')}><input type="number" min="0" value={draft.tareKg} onChange={(event) => setDraft({ ...draft, tareKg: Number(event.target.value) })} /><i>kg</i></IntakeField>
            <IntakeField label={t('common.temperature')} icon={<Thermometer size={15} />}><input type="number" step="0.1" value={draft.temperature} onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })} /><i>°C</i></IntakeField>
            <IntakeField label={t('harvest.potential')}><input type="number" step="0.1" value={draft.potentialAlcohol} onChange={(event) => setDraft({ ...draft, potentialAlcohol: Number(event.target.value) })} /><i>% vol.</i></IntakeField>
            <IntakeField label={t('intake.condition')} wide><div className="condition-options">{(['excellent', 'good', 'review'] as const).map((condition) => <button key={condition} type="button" className={draft.condition === condition ? 'active' : ''} onClick={() => setDraft({ ...draft, condition })}>{t(condition === 'excellent' ? 'intake.excellent' : condition === 'good' ? 'intake.good' : 'intake.review')}</button>)}</div></IntakeField>
          </div></section>}
          {step === 3 && <section className="flow-section"><FlowTitle eyebrow={t('intake.step', { step: 3 })} title={t('intake.destinationTitle')} text={t('intake.destinationText')} /><div className="form-grid">
            <IntakeField label={t('intake.processingDestination')} icon={<Warehouse size={15} />} wide><select value={draft.processingDestination} onChange={(event) => setDraft({ ...draft, processingDestination: event.target.value })}><option value="Mesa de selección">{t('intake.selectionTable')}</option><option value="Prensa 1">{t('intake.pressOne')}</option><option value="Tolva 1">{t('intake.hopperOne')}</option><option value="Cámara de frío">{t('intake.coldRoom')}</option></select></IntakeField>
            <IntakeField label={t('intake.notes')} wide><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={t('intake.notesPlaceholder')} /></IntakeField>
          </div><div className="intake-review-card"><div><CheckCircle2 size={23} /><span><small>{t('intake.ready')}</small><strong>{parcel?.name} · {parcel?.varieties}</strong><em>{parcel?.grower}{campaignName ? ` · ${campaignName}` : ''} · {draft.vehicle}</em></span></div><div className="intake-review-grid"><span><small>{t('intake.netWeight')}</small><strong>{formatKg(netKg, locale)}</strong></span><span><small>{t('common.temperature')}</small><strong>{draft.temperature.toFixed(1)} °C</strong></span><span><small>{t('harvest.potential')}</small><strong>{draft.potentialAlcohol.toFixed(1)}%</strong></span><span><small>{t('harvest.destination')}</small><strong>{d(draft.processingDestination)}</strong></span></div><p><Activity size={15} /> {t('intake.traceabilityText')}</p></div></section>}
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer className="lot-flow-actions"><button type="button" className="secondary-button" onClick={step === 1 ? onClose : () => { setError(''); setStep(step - 1) }}>{step === 1 ? t('common.cancel') : t('common.previous')}</button>{step < 3 ? <button type="button" className="primary-button" onClick={next}>{t('common.continue')} <ArrowUpRight size={17} /></button> : <button className="primary-button" type="submit"><Check size={17} /> {t('intake.confirm')}</button>}</footer>
      </form>
    </div>
  )
}

function FlowTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="flow-title"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>
}

function IntakeField({ label, icon, wide = false, children }: { label: string; icon?: ReactNode; wide?: boolean; children: ReactNode }) {
  return <label className={`flow-field intake-field ${wide ? 'wide' : ''}`}><span>{icon}{label}</span><div>{children}</div></label>
}
