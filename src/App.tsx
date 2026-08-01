import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, BarChart3, Beaker, Bell, Check,
  CheckCircle2, ChevronDown, ChevronRight, Circle, ClipboardCheck, Clock3, Droplets,
  Factory, FlaskConical, Gauge, GitMerge, Grape, Grid2X2, Home, Languages, Leaf, List, MapPin, Menu, Moon,
  MoreHorizontal, Package, Plus, Save, Search, Settings2, ShieldCheck,
  Sparkles, Sprout, Sun, Thermometer, Undo2, Warehouse,
  Waypoints, Wine, X,
} from 'lucide-react'
import { CreateLotSheet, NewTaskSheet } from './CreateLotFlow'
import { AgeingPage } from './Ageing'
import { BlendingPage } from './Blending'
import { images, lots as seedLots } from './data'
import { approveBlendTrial, assignLotToTank, completeBottlingOrder, createBarrel, createBlendTrial, createBottlingOrder, createLabSample, createLot as buildLot, createOpeningTask, createRecallSimulation, createTask, receiveGrapeDelivery, recordBarrelOperation, recordBlendTasting, recordLabResults, setBottlingGate, startBottlingOrder } from './domain'
import { HarvestPage, IntakeSheet } from './Harvest'
import { useLanguage, type Language } from './i18n'
import { LaboratoryPage } from './Laboratory'
import { NavLink, useHashLocation, useNavigate } from './router'
import { browserWineryRepository } from './store'
import type { Barrel, BarrelOperation, BlendCandidate, BlendTastingInput, BlendTrial, BottlingGateKey, BottlingOrder, CellarTask, CompleteBottlingOrderInput, GrapeDelivery, LabResultsInput, LabSample, NewBarrelInput, NewBarrelOperationInput, NewBlendTrialInput, NewBottlingOrderInput, NewGrapeIntakeInput, NewLabSampleInput, NewLotInput, NewRecallSimulationInput, NewTaskInput, PackagingMaterial, ReadingPoint, RecallSimulation, RoseMethod, Tank, TraceabilityEntity, TraceabilityLink, VineyardParcel, WinerySettings, WineLot, WineType } from './types'

const formatVolume = (volume: number, locale: string) => `${new Intl.NumberFormat(locale).format(volume)} L`

const wineLabelKey: Record<WineType, 'wine.red' | 'wine.white' | 'wine.rose' | 'wine.sparkling'> = {
  tinto: 'wine.red', blanco: 'wine.white', rosado: 'wine.rose', espumoso: 'wine.sparkling',
}

const roseMethodLabelKey: Record<RoseMethod, 'rose.method.direct_press' | 'rose.method.short_maceration' | 'rose.method.saignee' | 'rose.method.cofermentation'> = {
  direct_press: 'rose.method.direct_press', short_maceration: 'rose.method.short_maceration', saignee: 'rose.method.saignee', cofermentation: 'rose.method.cofermentation',
}

const FermentationChart = lazy(() => import('./Charts').then((module) => ({ default: module.FermentationChart })))
const BottlingPage = lazy(() => import('./Bottling').then((module) => ({ default: module.BottlingPage })))
const TraceabilityPage = lazy(() => import('./Traceability').then((module) => ({ default: module.TraceabilityPage })))
const ReportsPage = lazy(() => import('./Reports').then((module) => ({ default: module.ReportsPage })))
const AdministrationPage = lazy(() => import('./Administration').then((module) => ({ default: module.AdministrationPage })))

const typeIcon: Record<WineType, ReactNode> = {
  tinto: <Wine size={18} />,
  blanco: <Leaf size={18} />,
  rosado: <Sparkles size={18} />,
  espumoso: <Sparkles size={18} />,
}

const navItems = [
  { labelKey: 'nav.today' as const, path: '/dashboard', icon: Home },
  { labelKey: 'nav.harvest' as const, path: '/harvest', icon: Sprout },
  { labelKey: 'nav.production' as const, path: '/lots', icon: Grape },
  { labelKey: 'nav.cellar' as const, path: '/cellar', icon: Warehouse },
  { labelKey: 'nav.laboratory' as const, path: '/laboratory', icon: FlaskConical },
  { labelKey: 'nav.ageing' as const, path: '/ageing', icon: Wine },
  { labelKey: 'nav.blending' as const, path: '/blending', icon: GitMerge },
  { labelKey: 'nav.bottling' as const, path: '/bottling', icon: Package },
  { labelKey: 'nav.traceability' as const, path: '/traceability', icon: Waypoints },
  { labelKey: 'nav.reports' as const, path: '/reports', icon: BarChart3 },
]

function App() {
  const { pathname } = useHashLocation()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [initialState] = useState(() => browserWineryRepository.load())
  const [demoLots, setDemoLots] = useState<WineLot[]>(initialState.lots)
  const [tasks, setTasks] = useState<CellarTask[]>(initialState.tasks)
  const [demoTanks, setDemoTanks] = useState<Tank[]>(initialState.tanks)
  const [parcels, setParcels] = useState<VineyardParcel[]>(initialState.parcels)
  const [deliveries, setDeliveries] = useState<GrapeDelivery[]>(initialState.deliveries)
  const [samples, setSamples] = useState<LabSample[]>(initialState.samples)
  const [barrels, setBarrels] = useState<Barrel[]>(initialState.barrels)
  const [barrelOperations, setBarrelOperations] = useState<BarrelOperation[]>(initialState.barrelOperations)
  const [blendCandidates, setBlendCandidates] = useState<BlendCandidate[]>(initialState.blendCandidates)
  const [blendTrials, setBlendTrials] = useState<BlendTrial[]>(initialState.blendTrials)
  const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>(initialState.packagingMaterials)
  const [bottlingOrders, setBottlingOrders] = useState<BottlingOrder[]>(initialState.bottlingOrders)
  const [traceabilityEntities, setTraceabilityEntities] = useState<TraceabilityEntity[]>(initialState.traceabilityEntities)
  const [traceabilityLinks, setTraceabilityLinks] = useState<TraceabilityLink[]>(initialState.traceabilityLinks)
  const [recallSimulations, setRecallSimulations] = useState<RecallSimulation[]>(initialState.recallSimulations)
  const [settings, setSettings] = useState<WinerySettings>(initialState.settings)
  const [cellarMode, setCellarMode] = useState(() => localStorage.getItem('anada-theme') === 'cellar')
  const [menuOpen, setMenuOpen] = useState(false)
  const [readingLotId, setReadingLotId] = useState<string | null>(null)
  const [newLotType, setNewLotType] = useState<NewLotInput['type'] | null>(null)
  const [intakeFlow, setIntakeFlow] = useState<{ open: boolean; deliveryId?: string }>({ open: false })
  const [toast, setToast] = useState<string | null>(null)
  const [undoLot, setUndoLot] = useState<WineLot | null>(null)

  useEffect(() => {
    browserWineryRepository.save({ schemaVersion: 9, lots: demoLots, tasks, tanks: demoTanks, parcels, deliveries, samples, barrels, barrelOperations, blendCandidates, blendTrials, packagingMaterials, bottlingOrders, traceabilityEntities, traceabilityLinks, recallSimulations, settings })
  }, [demoLots, tasks, demoTanks, parcels, deliveries, samples, barrels, barrelOperations, blendCandidates, blendTrials, packagingMaterials, bottlingOrders, traceabilityEntities, traceabilityLinks, recallSimulations, settings])

  const toggleCellarMode = () => {
    setCellarMode((current) => {
      const next = !current
      localStorage.setItem('anada-theme', next ? 'cellar' : 'light')
      return next
    })
  }

  const saveReading = (lotId: string, reading: ReadingPoint, volume?: number) => {
    setUndoLot(demoLots.find((lot) => lot.id === lotId) ?? null)
    const nextVolume = volume ?? demoLots.find((lot) => lot.id === lotId)?.volume
    const recordedAt = new Date().toISOString()
    setDemoLots((current) => current.map((lot) => lot.id === lotId
      ? {
          ...lot,
          temperature: reading.temperature,
          density: reading.density,
          volume: volume ?? lot.volume,
          readings: [...lot.readings, { ...reading, volume: nextVolume, recordedAt }],
          activities: [{
            id: `activity-${Date.now()}`,
            title: 'Lectura de bodega',
            person: 'Elena Martín',
            time: 'Ahora',
            detail: `${reading.density.toFixed(3)} · ${reading.temperature.toFixed(1)} °C${reading.note ? ` · ${reading.note}` : ''}`,
            recordedAt,
          }, ...(lot.activities ?? [])],
        }
      : lot))
    setDemoTanks((current) => current.map((tank) => tank.lot === lotId
      ? { ...tank, temperature: reading.temperature, volume: nextVolume ?? tank.volume }
      : tank))
    setReadingLotId(null)
    setToast(t('toast.readingSaved', { id: lotId }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const undoReading = () => {
    if (!undoLot) return
    setDemoLots((current) => current.map((lot) => lot.id === undoLot.id ? undoLot : lot))
    setDemoTanks((current) => current.map((tank) => tank.lot === undoLot.id
      ? { ...tank, temperature: undoLot.temperature, volume: undoLot.volume }
      : tank))
    setToast(t('toast.readingUndone', { id: undoLot.id }))
    setUndoLot(null)
    window.setTimeout(() => setToast(null), 3200)
  }

  const createNewLot = (input: NewLotInput) => {
    const lot = buildLot(input)
    setDemoLots((current) => [lot, ...current])
    setTasks((current) => [createOpeningTask(lot), ...current])
    setDemoTanks((current) => assignLotToTank(current, lot))
    setNewLotType(null)
    setUndoLot(null)
    setToast(t('toast.lotCreated', { id: lot.id, vessel: lot.vessel }))
    window.setTimeout(() => setToast(null), 4200)
    navigate(`/lots/${lot.id}`)
  }

  const addTask = (input: NewTaskInput) => {
    const task = createTask(input)
    setTasks((current) => [task, ...current])
    setUndoLot(null)
    setToast(t('toast.taskCreated', { id: task.lot }))
    window.setTimeout(() => setToast(null), 3200)
  }

  const registerIntake = (input: NewGrapeIntakeInput) => {
    const result = receiveGrapeDelivery(deliveries, parcels, input)
    setDeliveries(result.deliveries)
    setParcels(result.parcels)
    setIntakeFlow({ open: false })
    setToast(t('toast.intakeRegistered', { code: result.delivery.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const addLabSample = (input: NewLabSampleInput) => {
    const sample = createLabSample(input, samples, demoLots, deliveries, parcels)
    setSamples((current) => [sample, ...current])
    setToast(t('toast.sampleCreated', { code: sample.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const saveLabResults = (input: LabResultsInput) => {
    const result = recordLabResults(samples, input)
    setSamples(result.samples)
    setToast(t(result.sample.status === 'review' ? 'toast.resultsReview' : 'toast.resultsValidated', { code: result.sample.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const addBarrel = (input: NewBarrelInput) => {
    const barrel = createBarrel(input, barrels, demoLots)
    setBarrels((current) => [...current, barrel])
    setToast(t('toast.barrelCreated', { code: barrel.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const saveBarrelOperation = (input: NewBarrelOperationInput) => {
    const result = recordBarrelOperation(barrels, barrelOperations, input)
    setBarrels(result.barrels)
    setBarrelOperations(result.operations)
    setToast(t('toast.barrelOperationSaved'))
    window.setTimeout(() => setToast(null), 4200)
  }

  const addBlendTrial = (input: NewBlendTrialInput) => {
    const trial = createBlendTrial(input, blendCandidates, blendTrials)
    setBlendTrials((current) => [trial, ...current])
    setToast(t('toast.blendTrialCreated', { code: trial.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const saveBlendTasting = (input: BlendTastingInput) => {
    const result = recordBlendTasting(blendTrials, input)
    setBlendTrials(result.trials)
    setToast(t('toast.blendTastingSaved', { code: result.trial.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const approveBlend = (trialId: string) => {
    const result = approveBlendTrial(blendTrials, blendCandidates, trialId)
    setBlendTrials(result.trials)
    setToast(t('toast.blendApproved', { code: result.trial.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const addBottlingOrder = (input: NewBottlingOrderInput) => {
    const result = createBottlingOrder(input, blendTrials, bottlingOrders, packagingMaterials)
    setBottlingOrders(result.orders)
    setPackagingMaterials(result.materials)
    setToast(t('toast.bottlingOrderCreated', { code: result.order.code }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const updateBottlingGate = (orderId: string, gate: BottlingGateKey, complete: boolean) => {
    const result = setBottlingGate(bottlingOrders, orderId, gate, complete)
    setBottlingOrders(result.orders)
    setToast(t('toast.bottlingGateUpdated'))
    window.setTimeout(() => setToast(null), 3200)
  }

  const startBottling = (orderId: string) => {
    const result = startBottlingOrder(bottlingOrders, orderId)
    setBottlingOrders(result.orders)
    setToast(t('toast.bottlingStarted', { code: result.order.code }))
    window.setTimeout(() => setToast(null), 3200)
  }

  const finishBottling = (input: CompleteBottlingOrderInput) => {
    const result = completeBottlingOrder(bottlingOrders, packagingMaterials, input)
    setBottlingOrders(result.orders)
    setPackagingMaterials(result.materials)
    setToast(t('toast.bottlingCompleted', { code: result.order.code, lot: result.order.completion?.finishedProductLot ?? '' }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const runRecallSimulation = (input: NewRecallSimulationInput) => {
    const result = createRecallSimulation(input, traceabilityEntities, traceabilityLinks, recallSimulations)
    setRecallSimulations(result.simulations)
    setToast(t('toast.recallCompleted', { code: result.simulation.code, count: result.simulation.affectedEntityIds.length }))
    window.setTimeout(() => setToast(null), 4200)
  }

  const saveWinerySettings = (nextSettings: WinerySettings) => {
    setSettings(nextSettings)
    setToast(t('toast.settingsSaved'))
    window.setTimeout(() => setToast(null), 3200)
  }

  const resetDemoData = () => {
    const reset = browserWineryRepository.clear()
    setDemoLots(reset.lots)
    setTasks(reset.tasks)
    setDemoTanks(reset.tanks)
    setParcels(reset.parcels)
    setDeliveries(reset.deliveries)
    setSamples(reset.samples)
    setBarrels(reset.barrels)
    setBarrelOperations(reset.barrelOperations)
    setBlendCandidates(reset.blendCandidates)
    setBlendTrials(reset.blendTrials)
    setPackagingMaterials(reset.packagingMaterials)
    setBottlingOrders(reset.bottlingOrders)
    setTraceabilityEntities(reset.traceabilityEntities)
    setTraceabilityLinks(reset.traceabilityLinks)
    setRecallSimulations(reset.recallSimulations)
    setSettings(reset.settings)
    setUndoLot(null)
    setToast(t('toast.reset'))
    window.setTimeout(() => setToast(null), 3200)
    navigate('/dashboard')
  }

  const readingLot = demoLots.find((lot) => lot.id === readingLotId)
  const operationalRecordCount = demoLots.length + tasks.length + demoTanks.length + parcels.length + deliveries.length + samples.length + barrels.length + barrelOperations.length + blendTrials.length + packagingMaterials.length + bottlingOrders.length + traceabilityEntities.length + traceabilityLinks.length + recallSimulations.length

  if (pathname === '/welcome') return <div className={cellarMode ? 'app cellar-theme' : 'app'}><Welcome /></div>

  let currentPage: ReactNode
  if (pathname === '/dashboard') currentPage = <Dashboard lots={demoLots} tanks={demoTanks} tasks={tasks} setTasks={setTasks} onReading={setReadingLotId} />
  else if (pathname === '/harvest') currentPage = <HarvestPage parcels={parcels} deliveries={deliveries} onOpenIntake={(deliveryId) => setIntakeFlow({ open: true, deliveryId })} />
  else if (pathname === '/production') currentPage = <Production onStartCreate={setNewLotType} />
  else if (pathname === '/lots') currentPage = <LotsOverview lots={demoLots} />
  else if (pathname.startsWith('/lots/')) currentPage = <LotDetail lots={demoLots} tanks={demoTanks} lotId={decodeURIComponent(pathname.slice('/lots/'.length))} onReading={setReadingLotId} />
  else if (pathname === '/cellar') currentPage = <CellarMap tanks={demoTanks} />
  else if (pathname === '/tasks') currentPage = <TasksPage lots={demoLots} tasks={tasks} setTasks={setTasks} onCreate={addTask} />
  else if (pathname === '/laboratory') currentPage = <LaboratoryPage samples={samples} lots={demoLots} deliveries={deliveries} parcels={parcels} onCreate={addLabSample} onRecordResults={saveLabResults} />
  else if (pathname === '/ageing') currentPage = <AgeingPage barrels={barrels} operations={barrelOperations} lots={demoLots} onCreateBarrel={addBarrel} onRecordOperation={saveBarrelOperation} />
  else if (pathname === '/blending') currentPage = <BlendingPage candidates={blendCandidates} trials={blendTrials} onCreateTrial={addBlendTrial} onRecordTasting={saveBlendTasting} onApproveTrial={approveBlend} />
  else if (pathname === '/bottling') currentPage = <BottlingPage orders={bottlingOrders} materials={packagingMaterials} trials={blendTrials} onCreateOrder={addBottlingOrder} onToggleGate={updateBottlingGate} onStartOrder={startBottling} onCompleteOrder={finishBottling} />
  else if (pathname === '/traceability') currentPage = <TraceabilityPage entities={traceabilityEntities} links={traceabilityLinks} simulations={recallSimulations} onCreateSimulation={runRecallSimulation} />
  else if (pathname === '/reports') currentPage = <ReportsPage lots={demoLots} tasks={tasks} tanks={demoTanks} deliveries={deliveries} samples={samples} barrels={barrels} trials={blendTrials} orders={bottlingOrders} materials={packagingMaterials} traceabilityEntities={traceabilityEntities} traceabilityLinks={traceabilityLinks} settings={settings} />
  else if (pathname === '/settings') currentPage = <AdministrationPage settings={settings} recordCount={operationalRecordCount} onSave={saveWinerySettings} onResetData={resetDemoData} />
  else currentPage = <Dashboard lots={demoLots} tanks={demoTanks} tasks={tasks} setTasks={setTasks} onReading={setReadingLotId} />

  return (
    <div className={cellarMode ? 'app cellar-theme' : 'app'}>
      <Shell
        cellarMode={cellarMode}
        toggleCellarMode={toggleCellarMode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onQuickReading={() => setReadingLotId('T-26-017')}
        onNotifications={() => {
          setToast(t('toast.alerts'))
          window.setTimeout(() => setToast(null), 3200)
        }}
        settings={settings}
      >
        <Suspense fallback={<div className="module-loading"><Package size={24} /><span>{t('common.loading')}</span></div>}>{currentPage}</Suspense>
      </Shell>

      {readingLot && <ReadingSheet lot={readingLot} onClose={() => setReadingLotId(null)} onSave={saveReading} />}
      {newLotType && <CreateLotSheet type={newLotType} lots={demoLots} tanks={demoTanks} onClose={() => setNewLotType(null)} onCreate={createNewLot} />}
      {intakeFlow.open && <IntakeSheet deliveries={deliveries} parcels={parcels} initialDeliveryId={intakeFlow.deliveryId} onClose={() => setIntakeFlow({ open: false })} onSave={registerIntake} />}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          {undoLot && <button onClick={undoReading} aria-label={t('toast.undo')}><Undo2 size={17} /> {t('toast.undo')}</button>}
        </div>
      )}
    </div>
  )
}

function Welcome() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  return (
    <main className="welcome-screen">
      <div className="welcome-visual" style={{ backgroundImage: `url(${images.vineyard})` }}>
        <div className="welcome-brand"><Brand light /></div>
        <div className="welcome-caption">
          <span className="eyebrow light">{t('welcome.kicker')}</span>
          <h1>{t('welcome.title').split('\n').map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1>
          <p>{t('welcome.subtitle')}</p>
        </div>
      </div>
      <section className="welcome-panel">
        <div className="welcome-tools"><div className="demo-pill"><Circle size={8} fill="currentColor" /> {t('welcome.demo')}</div><LanguageSelector compact /></div>
        <div>
          <span className="eyebrow">{t('welcome.workspace')}</span>
          <h2>{t('welcome.hello')}</h2>
          <p className="muted">{t('welcome.resume')}</p>
        </div>
        <div className="winery-selector">
          <span className="winery-mark">VI</span>
          <span><strong>{t('welcome.winery')}</strong><small>Alberite · Rioja Oriental</small></span>
          <ChevronDown size={18} />
        </div>
        <button className="primary-button full" onClick={() => navigate('/dashboard')}>
          {t('welcome.enter')} <ArrowUpRight size={18} />
        </button>
        <div className="welcome-meta">
          <span><ShieldCheck size={16} /> {t('welcome.demoData')}</span>
          <span>Añada 0.11</span>
        </div>
      </section>
    </main>
  )
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-glyph"><Grape size={22} strokeWidth={1.7} /></span>
      <span>Añada</span>
    </div>
  )
}

function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div className={`language-selector ${compact ? 'compact' : ''}`} aria-label={t('language.label')}>
      {!compact && <Languages size={16} />}
      {(['es', 'en'] as Language[]).map((option) => <button key={option} type="button" className={language === option ? 'active' : ''} onClick={() => setLanguage(option)} aria-pressed={language === option}>{option === 'es' ? t('language.es') : t('language.en')}</button>)}
    </div>
  )
}

interface ShellProps {
  children: ReactNode
  cellarMode: boolean
  toggleCellarMode: () => void
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  onQuickReading: () => void
  onNotifications: () => void
  settings: WinerySettings
}

function Shell({ children, cellarMode, toggleCellarMode, menuOpen, setMenuOpen, onQuickReading, onNotifications, settings }: ShellProps) {
  const location = useHashLocation()
  const { t } = useLanguage()
  const pageItem = navItems.find((item) => location.pathname.startsWith(item.path))
  const page = pageItem ? t(pageItem.labelKey) : 'Añada'
  const wineryInitials = settings.wineryName.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase()
  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label={t('common.close')}><X size={20} /></button>
        </div>
        <div className="winery-mini">
          <span className="winery-mark small">{wineryInitials || 'VI'}</span>
          <span><strong>{settings.wineryName}</strong><small>{t('admin.campaignLabel', { year: settings.campaignYear })}</small></span>
          <ChevronDown size={15} />
        </div>
        <nav className="primary-nav" aria-label={t('nav.primary')}>
          {navItems.map(({ labelKey, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setMenuOpen(false)}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <LanguageSelector />
          <NavLink to="/settings" className="nav-item"><Settings2 size={19} /><span>{t('nav.settings')}</span></NavLink>
          <div className="user-mini">
            <span className="avatar">EM</span>
            <span><strong>Elena Martín</strong><small>{t('shell.role')}</small></span>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label={t('common.close')} />}

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label={t('common.open')}><Menu size={21} /></button>
            <span className="mobile-page-title">{page}</span>
          </div>
          <div className="topbar-actions">
            <button className="mode-button" onClick={toggleCellarMode}>
              {cellarMode ? <Sun size={17} /> : <Moon size={17} />}
              <span>{cellarMode ? t('shell.light') : t('shell.cellar')}</span>
            </button>
            <LanguageSelector compact />
            <button className="icon-button notification-button" onClick={onNotifications} aria-label={t('shell.notifications')}><Bell size={19} /><i /></button>
            <span className="avatar top-avatar">EM</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </section>

      <nav className="mobile-nav" aria-label={t('nav.mobile')}>
        <MobileNavItem to="/dashboard" icon={<Home />} label={t('nav.today')} />
        <MobileNavItem to="/harvest" icon={<Sprout />} label={t('nav.harvest')} />
        <button className="mobile-quick" onClick={onQuickReading} aria-label={t('detail.registerReading')}><Plus /></button>
        <MobileNavItem to="/cellar" icon={<Warehouse />} label={t('nav.cellar')} />
        <MobileNavItem to="/tasks" icon={<ClipboardCheck />} label={t('nav.tasks')} />
      </nav>
    </div>
  )
}

function MobileNavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return <NavLink to={to} className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>{icon}<span>{label}</span></NavLink>
}

interface DashboardProps {
  lots: WineLot[]
  tanks: Tank[]
  tasks: CellarTask[]
  setTasks: React.Dispatch<React.SetStateAction<CellarTask[]>>
  onReading: (lotId: string) => void
}

function Dashboard({ lots, tanks, tasks, setTasks, onReading }: DashboardProps) {
  const navigate = useNavigate()
  const { t, locale } = useLanguage()
  const pending = tasks.filter((task) => !task.complete)
  const occupied = tanks.filter((tank) => tank.volume > 0)
  const totalCapacity = tanks.reduce((total, tank) => total + tank.capacity, 0)
  const occupiedVolume = tanks.reduce((total, tank) => total + tank.volume, 0)
  const occupiedPercentage = totalCapacity ? Math.round(occupiedVolume / totalCapacity * 100) : 0
  const activeFermentations = lots.filter((lot) => lot.stage.toLowerCase().includes('fermentación')).length
  return (
    <main>
      <PageHeader
        eyebrow={t('dashboard.date')}
        title={t('dashboard.greeting')}
        description={t('dashboard.description')}
        action={<button className="primary-button" onClick={() => navigate('/production')}><Plus size={18} /> {t('dashboard.new')}</button>}
      />

      <section className="metrics-grid" aria-label={t('dashboard.summary')}>
        <MetricCard label={t('dashboard.activeLots')} value={String(lots.length)} detail={t('dashboard.inFermentation', { count: activeFermentations })} icon={<Grape />} accent="wine" />
        <MetricCard label={t('dashboard.capacityUsed')} value={`${occupiedPercentage}%`} detail={t('dashboard.capacityDetail', { used: formatVolume(occupiedVolume, locale), total: formatVolume(totalCapacity, locale) })} icon={<Gauge />} accent="stone" />
        <MetricCard label={t('dashboard.pendingTasks')} value={String(pending.length)} detail={t('dashboard.beforeTime')} icon={<ClipboardCheck />} accent="gold" />
        <MetricCard label={t('dashboard.activeAlerts')} value="3" detail={t('dashboard.alertDetail')} icon={<Activity />} accent="red" />
      </section>

      <section className="section-block">
        <SectionHeading title={t('dashboard.now')} subtitle={t('dashboard.nowSubtitle')} link={t('dashboard.viewLots')} onLink={() => navigate('/lots')} />
        <div className="active-lots-grid">
          {lots.slice(0, 3).map((lot) => <LotCard key={lot.id} lot={lot} onOpen={() => navigate(`/lots/${lot.id}`)} onReading={() => onReading(lot.id)} />)}
        </div>
      </section>

      <section className="dashboard-columns">
        <div className="task-panel panel">
          <SectionHeading title={t('dashboard.todayTasks')} subtitle={t('dashboard.operationsPending', { count: pending.length })} link={t('dashboard.viewAgenda')} onLink={() => navigate('/tasks')} compact />
          <div className="task-list">
            {tasks.slice(0, 4).map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))} />
            ))}
          </div>
        </div>
        <div className="occupancy-panel panel">
          <SectionHeading title={t('dashboard.occupancy')} subtitle={t('dashboard.fermentationHall')} link={t('dashboard.openMap')} onLink={() => navigate('/cellar')} compact />
          <div className="occupancy-visual">
            <ProgressRing value={occupiedPercentage} />
            <div className="mini-tanks">
              {occupied.slice(0, 6).map((tank) => <MiniTank key={tank.id} tank={tank} />)}
            </div>
          </div>
          <div className="occupancy-legend"><span><i className="dot wine" /> {t('wine.red')}</span><span><i className="dot white" /> {t('wine.white')}</span><span><i className="dot empty" /> {t('dashboard.free', { value: 100 - occupiedPercentage })}</span></div>
        </div>
      </section>
    </main>
  )
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  )
}

function MetricCard({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: ReactNode; accent: string }) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${accent}`}>{icon}</span>
      <div><span className="metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  )
}

function SectionHeading({ title, subtitle, link, onLink, compact = false }: { title: string; subtitle?: string; link?: string; onLink?: () => void; compact?: boolean }) {
  return (
    <div className={`section-heading ${compact ? 'compact' : ''}`}>
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {link && <button className="text-button" onClick={onLink}>{link} <ChevronRight size={16} /></button>}
    </div>
  )
}

function LotCard({ lot, onOpen, onReading }: { lot: WineLot; onOpen: () => void; onReading: () => void }) {
  const { t, d, locale } = useLanguage()
  return (
    <article className={`lot-card lot-${lot.type}`}>
      <button className="lot-image" style={{ backgroundImage: `url(${lot.image})` }} onClick={onOpen} aria-label={t('lot.open', { id: lot.id })}>
        <span className="lot-type-chip">{typeIcon[lot.type]} {t(wineLabelKey[lot.type])}</span>
        {lot.attention !== 'normal' && <span className={`attention-chip ${lot.attention}`}><Activity size={14} /> {d(lot.attentionText ?? '')}</span>}
      </button>
      <div className="lot-card-body">
        <div className="lot-title"><div><span>{lot.id}</span><h3>{lot.name}</h3></div><button className="icon-button small" onClick={onOpen} aria-label={t('lot.openDetail')}><ArrowUpRight size={17} /></button></div>
        <p className="lot-origin"><MapPin size={14} /> {lot.origin}</p>
        <div className="lot-stage"><span>{d(lot.stage)}</span>{lot.day && <small>{t('common.day')} {lot.day}</small>}</div>
        <div className="progress-track"><i style={{ width: `${lot.progress}%` }} /></div>
        <div className="lot-readings">
          {lot.temperature && <span><Thermometer size={16} /><strong>{lot.temperature.toFixed(1)}°</strong><small>{t('lot.temp')}</small></span>}
          {lot.density && <span><Droplets size={16} /><strong>{lot.density.toFixed(3)}</strong><small>{t('common.density')}</small></span>}
          <span><Gauge size={16} /><strong>{formatVolume(lot.volume, locale)}</strong><small>{lot.vessel}</small></span>
        </div>
        <button className="next-operation" onClick={onReading}><span><Clock3 size={16} /><i>{t('lot.next')}</i><strong>{d(lot.nextAction)}</strong></span><small>{d(lot.nextTime)}</small></button>
      </div>
    </article>
  )
}

function TaskRow({ task, onToggle }: { task: CellarTask; onToggle: () => void }) {
  const { t, d } = useLanguage()
  return (
    <div className={`task-row ${task.complete ? 'complete' : ''}`}>
      <button className="task-check" onClick={onToggle} aria-label={task.complete ? t('lot.reopenTask') : t('lot.completeTask')}>{task.complete ? <Check size={16} /> : null}</button>
      <div className="task-copy"><strong>{d(task.title)}</strong><span>{task.lot} · {task.assignee}</span></div>
      <span className={`priority-dot ${task.priority}`} />
      <time>{task.time}</time>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const { t } = useLanguage()
  return <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>{t('dashboard.used')}</span></div></div>
}

function MiniTank({ tank }: { tank: Tank }) {
  const level = Math.round((tank.volume / tank.capacity) * 100)
  return <div className={`mini-tank ${tank.type ?? 'empty'} ${tank.attention !== 'normal' ? 'attention' : ''}`} title={`${tank.id}: ${level}%`}><i style={{ height: `${level}%` }} /><span>{tank.id}</span></div>
}

function Production({ onStartCreate }: { onStartCreate: (type: NewLotInput['type']) => void }) {
  const [selected, setSelected] = useState<WineType | null>(null)
  const navigate = useNavigate()
  const { t, d } = useLanguage()
  const options = [
    { type: 'tinto' as const, title: t('wine.red'), image: images.cellar, detail: t('production.redDetail'), stages: t('production.stages', { count: 11 }), active: true },
    { type: 'blanco' as const, title: t('wine.white'), image: images.whiteGrapes, detail: t('production.whiteDetail'), stages: t('production.stages', { count: 10 }), active: true },
    { type: 'rosado' as const, title: t('wine.roseClarete'), image: images.vineyard, detail: t('production.roseDetail'), stages: t('production.routes', { count: 4 }), active: true },
    { type: 'espumoso' as const, title: t('wine.sparkling'), image: images.barrels, detail: t('production.sparklingDetail'), stages: t('production.phase4'), active: false },
  ]
  const selectedLot = selected ? seedLots.find((lot) => lot.type === selected) : undefined
  return (
    <main>
      <PageHeader eyebrow={t('production.kicker')} title={t('production.title')} description={t('production.description')} />
      <div className="process-choice-grid">
        {options.map((option) => (
          <button
            key={option.type}
            className={`process-choice ${selected === option.type ? 'selected' : ''} ${!option.active ? 'disabled' : ''}`}
            onClick={() => option.active && setSelected(option.type)}
            aria-disabled={!option.active}
            disabled={!option.active}
          >
            <span className="process-choice-image" style={{ backgroundImage: `url(${option.image})` }}><i>{option.active ? option.stages : t('production.soon')}</i></span>
            <span className="process-choice-copy"><span className={`wine-symbol ${option.type}`}>{typeIcon[option.type]}</span><strong>{option.title}</strong><small>{option.detail}</small></span>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
      {selected && selectedLot && (
        <section className={`process-preview preview-${selected}`}>
          <div className="process-preview-head"><div><span className="eyebrow">{t('production.template')}</span><h2>{t('production.traditional', { wine: t(wineLabelKey[selected]).toLowerCase() })}</h2><p>{t('production.adapt')}</p></div><div className="process-preview-actions"><button className="secondary-button" onClick={() => navigate(`/lots/${selectedLot.id}`)}>{t('production.example')}</button><button className="primary-button" onClick={() => onStartCreate(selected as NewLotInput['type'])}>{t('production.configure')} <ArrowUpRight size={18} /></button></div></div>
          <ProcessTimeline lot={selectedLot} />
          <div className="context-operation-row">
            {(selected === 'tinto'
              ? ['Remontado', 'Bazuqueo', 'Descube', 'Control de málico']
              : selected === 'rosado'
                ? ['Prensado por color', 'Maceración corta', 'Sangrado', 'Cofermentación']
                : ['Prensado', 'Desfangado', 'Control de turbidez', 'Bâtonnage']).map((operation) => <span key={operation}><CheckCircle2 size={15} /> {d(operation)}</span>)}
          </div>
        </section>
      )}
    </main>
  )
}

function LotsOverview({ lots }: { lots: WineLot[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'todos' | WineType | 'attention'>('todos')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const navigate = useNavigate()
  const { t } = useLanguage()
  const filtered = lots.filter((lot) => {
    const matchesQuery = `${lot.id} ${lot.name} ${lot.varieties} ${lot.origin}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'todos' || (filter === 'attention' ? lot.attention !== 'normal' : lot.type === filter)
    return matchesQuery && matchesFilter
  })
  return (
    <main>
      <PageHeader eyebrow={t('lots.kicker')} title={t('lots.title')} description={t('lots.description', { count: lots.length })} action={<button className="primary-button" onClick={() => navigate('/production')}><Plus size={18} /> {t('lots.new')}</button>} />
      <div className="filter-bar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('lots.search')} /></label>
        <div className="filter-chips">
          {([['todos', t('lots.all')], ['tinto', t('lots.red')], ['blanco', t('lots.white')], ['rosado', t('lots.rose')], ['attention', t('lots.needsAttention')]] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className="view-switch"><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label={t('lots.grid')}><Grid2X2 size={17} /></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label={t('lots.list')}><List size={17} /></button></div>
      </div>
      <div className={view === 'grid' ? 'lots-overview-grid' : 'lots-overview-list'}>
        {filtered.map((lot) => <OverviewLotCard key={lot.id} lot={lot} onOpen={() => navigate(`/lots/${lot.id}`)} compact={view === 'list'} />)}
      </div>
      {filtered.length === 0 && <div className="empty-state"><Search size={28} /><h3>{t('lots.emptyTitle')}</h3><p>{t('lots.emptyText')}</p></div>}
    </main>
  )
}

function OverviewLotCard({ lot, onOpen, compact }: { lot: WineLot; onOpen: () => void; compact: boolean }) {
  const { t, d, locale } = useLanguage()
  return (
    <button className={`overview-lot ${compact ? 'compact' : ''}`} onClick={onOpen}>
      <span className="overview-lot-image" style={{ backgroundImage: `url(${lot.image})` }}><i className={`wine-band ${lot.type}`} /></span>
      <span className="overview-lot-main"><small>{lot.id} · {t(wineLabelKey[lot.type])}</small><strong>{lot.name}</strong><i>{lot.varieties}</i><em><MapPin size={13} /> {lot.origin}</em></span>
      <span className="overview-stage"><small>{t('lots.currentStage')}</small><strong>{d(lot.stage)}</strong><span className="progress-track"><i style={{ width: `${lot.progress}%` }} /></span></span>
      <span className="overview-volume"><strong>{formatVolume(lot.volume, locale)}</strong><small>{lot.vessel}</small></span>
      <span className={`attention-or-arrow ${lot.attention}`}>{lot.attention !== 'normal' ? <Activity size={17} /> : <ChevronRight size={19} />}</span>
    </button>
  )
}

function LotDetail({ lots, tanks, lotId, onReading }: { lots: WineLot[]; tanks: Tank[]; lotId: string; onReading: (id: string) => void }) {
  const navigate = useNavigate()
  const { t, d, locale } = useLanguage()
  const lot = lots.find((item) => item.id === lotId)
  if (!lot) return <div className="empty-state"><Search size={28} /><h3>{t('detail.notFound')}</h3><button className="secondary-button" onClick={() => navigate('/lots')}>{t('detail.backLots')}</button></div>
  const isRed = lot.type === 'tinto'
  const isRose = lot.type === 'rosado'
  const isReception = lot.process[0]?.status === 'current'
  const whiteDetails = lot.productionDetails?.white
  const roseDetails = lot.productionDetails?.rose
  const roseMethod = roseDetails?.method ?? 'direct_press'
  const vessel = tanks.find((tank) => tank.id === lot.vessel)
  const vesselCapacity = vessel?.capacity ?? 10000
  const stageDescription = isReception
    ? isRed
      ? t('detail.redReception')
      : isRose ? t('rose.detailReception') : t('detail.whiteReception')
    : isRed
      ? t('detail.redFermentation')
      : isRose ? t('rose.detailFermentation') : t('detail.whiteFermentation')
  const roseActions: Record<RoseMethod, string[]> = {
    direct_press: ['Prensado por color', 'Fracciones', 'Muestra de color'],
    short_maceration: ['Control de color', 'Maceración corta', 'Separación'],
    saignee: ['Control de color', 'Sangrado', 'Prensado'],
    cofermentation: ['Control de color', 'Cofermentación', 'Separación'],
  }
  const stageActions = isReception
    ? isRed ? ['Selección', 'Pesaje', 'Encubado'] : isRose ? roseActions[roseMethod] : ['Pesaje', 'Muestra', 'Prensado']
    : isRed ? ['Remontado', 'Bazuqueo', 'Adición', 'Muestra'] : isRose ? roseActions[roseMethod] : ['Control temperatura', 'Muestra', 'Trasiego']
  const fallbackActivities = isRed ? [
    ['Remontado suave', 'Martín Ruiz', 'Hoy · 12:10', '15 min · Sin incidencias'],
    ['Lectura de densidad', 'Elena Martín', 'Hoy · 08:04', '1.052 · 24,2 °C'],
    ['Adición de nutrientes', 'Elena Martín', 'Ayer · 18:42', '12 kg · Nutriente orgánico'],
    ['Remontado con aireación', 'Martín Ruiz', 'Ayer · 17:15', '20 min'],
  ] : isRose ? [
    ['Control de intensidad colorante', 'Elena Martín', 'Hoy · 12:05', '0,82 UA/cm · Dentro del objetivo'],
    ['Lectura de densidad', 'Lucía Sáenz', 'Hoy · 08:10', '1.076 · 17,7 °C'],
    ['Control de encubado conjunto', 'Martín Ruiz', 'Ayer · 18:15', '40% uva tinta · Tras báscula'],
    ['Protección del mosto', 'Elena Martín', 'Ayer · 17:40', 'Inertizado con CO₂'],
  ] : [
    ['Control de temperatura', 'Elena Martín', 'Hoy · 09:12', '15,2 °C · Estable'],
    ['Lectura de densidad', 'Lucía Sáenz', 'Ayer · 17:30', '1.026 · 15,1 °C'],
    ['Inoculación', 'Elena Martín', '25 sept · 11:20', 'Levadura seleccionada'],
    ['Trasiego de mosto limpio', 'Martín Ruiz', '25 sept · 08:40', '5.240 L'],
  ]
  const activityRows = lot.activities?.length
    ? lot.activities.map((activity) => [activity.title, activity.person, activity.time, activity.detail])
    : fallbackActivities
  return (
    <main className="lot-detail-page">
      <button className="back-button" onClick={() => navigate('/lots')}><ArrowLeft size={17} /> {t('detail.backLots')}</button>
      <section className={`lot-hero lot-${lot.type}`} style={{ backgroundImage: `url(${lot.image})` }}>
        <div className="lot-hero-overlay" />
        <div className="lot-hero-content">
          <div className="lot-hero-top"><span className="lot-type-chip glass">{typeIcon[lot.type]} {t(wineLabelKey[lot.type])}</span><span className="doca-chip"><ShieldCheck size={15} /> {t('detail.eligibility')}</span></div>
          <div><span className="eyebrow light">{lot.id} · {t('common.vintage')} {lot.vintage}</span><h1>{lot.name}</h1><p>{lot.varieties}</p><span className="hero-origin"><MapPin size={15} /> {lot.origin}</span></div>
        </div>
      </section>

      <section className="lot-status-grid">
        <div className="current-stage-card panel">
          <div className="stage-label"><span className="pulse-dot" /><span><small>{t('detail.currentStage')}</small><strong>{d(lot.stage)}</strong></span>{lot.day && <em>{t('common.day')} {lot.day}</em>}</div>
          <p>{stageDescription}</p>
          <div className="stage-actions">
            <button className="primary-button" onClick={() => onReading(lot.id)}><Plus size={18} /> {t('detail.registerReading')}</button>
            {stageActions.map((action) => <span className="context-action" key={action}>{d(action)}</span>)}
          </div>
        </div>
        <div className="vessel-card panel">
          <div className="vessel-graphic"><span className={`vessel-fill ${lot.type}`} style={{ height: `${Math.min(92, lot.volume / vesselCapacity * 100)}%` }} /><i>{lot.vessel}</i></div>
          <div><span className="eyebrow">{t('detail.vessel')}</span><h3>{t('detail.tank', { id: lot.vessel.replace('D-', '') })}</h3><p>{t('detail.stainless', { capacity: vesselCapacity.toLocaleString(locale) })}</p><div className="vessel-data"><span><strong>{formatVolume(lot.volume, locale)}</strong><small>{t('common.volume')}</small></span><span><strong>{Math.round(lot.volume / vesselCapacity * 100)}%</strong><small>{t('common.occupancy')}</small></span></div></div>
        </div>
      </section>

      <section className="panel process-panel">
        <SectionHeading title={t('detail.process', { wine: t(wineLabelKey[lot.type]) })} subtitle={t('detail.processSubtitle')} compact />
        <ProcessTimeline lot={lot} />
      </section>

      <section className="detail-columns">
        <div className="panel readings-panel">
          <SectionHeading title={t('detail.evolution')} subtitle={lot.readings.length ? t('detail.latestReadings') : t('detail.noReadings')} compact />
          {lot.readings.length ? <Suspense fallback={<ChartSkeleton />}><FermentationChart data={lot.readings} /></Suspense> : <div className="empty-chart"><Activity size={25} /><span>{t('detail.trackingHere')}</span></div>}
          <div className="reading-kpis">
            {lot.temperature && <span><i className="kpi-icon warm"><Thermometer /></i><small>{t('common.temperature')}</small><strong>{lot.temperature.toFixed(1)} °C</strong><em>{isReception ? t('detail.receptionReading') : isRed ? t('detail.tempChange') : t('detail.stable')}</em></span>}
            {lot.density && <span><i className="kpi-icon blue"><Droplets /></i><small>{t('common.density')}</small><strong>{lot.density.toFixed(3)}</strong><em>{isReception ? t('detail.initialDensity') : t('detail.densityChange')}</em></span>}
            {isRose
              ? <span><i className="kpi-icon rose"><Sparkles /></i><small>{t('rose.colorTarget')}</small><strong>{(roseDetails?.targetColorIntensity ?? 0.8).toLocaleString(locale)} UA/cm</strong><em>{t('rose.colorRange')}</em></span>
              : !isRed && <span><i className="kpi-icon stone"><Beaker /></i><small>{isReception ? t('detail.turbidityTarget') : t('detail.initialTurbidity')}</small><strong>{isReception && whiteDetails ? whiteDetails.turbidityTarget : 82} NTU</strong><em>{isReception ? t('detail.forSettling') : t('detail.afterSettling')}</em></span>}
          </div>
        </div>
        <div className="panel activity-panel">
          <SectionHeading title={t('detail.recentActivity')} subtitle={t('detail.signedLog')} compact />
          <div className="activity-list">
            {activityRows.map(([title, person, time, detail], index) => (
              <div className="activity-row" key={`${title}-${time}-${index}`}><span className="activity-icon">{index === 1 ? <Droplets size={16} /> : <Check size={16} />}</span><span><strong>{d(title)}</strong><small>{person} · {d(time)}</small><em>{d(detail)}</em></span></div>
            ))}
          </div>
        </div>
      </section>

      {lot.type === 'blanco' && (
        <section className="white-specific panel">
          <div><span className="eyebrow">{t('detail.mustPrep')}</span><h2>{t('detail.pressSettling')}</h2><p>{t('detail.whiteSpecific')}</p></div>
          <div className="white-specific-grid">
            <span><i>01</i><small>{t('detail.selectedFraction')}</small><strong>{d(whiteDetails?.pressFraction ?? 'Mosto yema')}</strong><em>{isReception ? t('detail.confirmPending') : t('detail.yield')}</em></span>
            <span><i>02</i><small>{t('detail.protection')}</small><strong>{d(whiteDetails?.protection ?? 'Inertizado')}</strong><em>{t('detail.sinceReception')}</em></span>
            <span><i>03</i><small>{t('detail.settling')}</small><strong>{isReception ? t('common.pending') : '18 h'}</strong><em>{isReception ? t('detail.afterPress') : '10.2 °C'}</em></span>
            <span><i>04</i><small>{t('detail.turbidityTarget')}</small><strong>{whiteDetails ? `${whiteDetails.turbidityTarget} NTU` : '82 NTU'}</strong><em>{isReception ? t('detail.targetConfigured') : t('detail.targetReached')}</em></span>
          </div>
        </section>
      )}

      {isRose && roseDetails && (
        <section className="rose-specific panel">
          <div className="rose-specific-head"><div><span className="eyebrow">{t('rose.processIdentity')}</span><h2>{roseDetails.style === 'clarete' ? t('rose.clareteTitle') : t('rose.roseTitle')}</h2><p>{t('rose.specificText')}</p></div><span className="rose-route-badge"><Sparkles size={18} /><small>{t('rose.method')}</small><strong>{t(roseMethodLabelKey[roseDetails.method])}</strong></span></div>
          <div className="rose-specific-grid">
            <span><i>01</i><small>{t('rose.redPercentage')}</small><strong>{roseDetails.redGrapePercentage}%</strong><em>{t('rose.minimumRed')}</em></span>
            <span><i>02</i><small>{t('rose.mixingMoment')}</small><strong>{roseDetails.blendAfterWeighing ? t('rose.afterScale') : t('common.pending')}</strong><em>{t('rose.separateWeighing')}</em></span>
            <span><i>03</i><small>{t('rose.skinContact')}</small><strong>{roseDetails.method === 'direct_press' ? t('rose.noMaceration') : `${roseDetails.macerationHours} h`}</strong><em>{t(roseMethodLabelKey[roseDetails.method])}</em></span>
            <span><i>04</i><small>{t('rose.colorTarget')}</small><strong>{roseDetails.targetColorIntensity.toLocaleString(locale)} UA/cm</strong><em>{t('rose.colorRange')}</em></span>
            <span><i>05</i><small>{t('rose.pressFraction')}</small><strong>{d(roseDetails.pressFraction)}</strong><em>{t('rose.fractionTrace')}</em></span>
            <span><i>06</i><small>{t('rose.protection')}</small><strong>{d(roseDetails.protection)}</strong><em>{t('detail.sinceReception')}</em></span>
            <span><i>07</i><small>{t('detail.turbidityTarget')}</small><strong>{roseDetails.turbidityTarget} NTU</strong><em>{t('detail.forSettling')}</em></span>
            <span><i>08</i><small>{t('rose.estimatedYield')}</small><strong>{lot.productionDetails ? Math.round(lot.volume / lot.productionDetails.receivedKg * 100) : 0}%</strong><em>{t('rose.maximumYield')}</em></span>
          </div>
          <div className="rose-compliance-note"><ShieldCheck size={19} /><span><strong>{t('rose.internalCheck')}</strong><small>{t('rose.internalCheckText')}</small></span></div>
        </section>
      )}
    </main>
  )
}

function ProcessTimeline({ lot }: { lot: WineLot }) {
  const { d } = useLanguage()
  return (
    <div className="process-timeline">
      {lot.process.map((stage, index) => (
        <div className={`process-stage ${stage.status}`} key={stage.id}>
          <span className="stage-node">{stage.status === 'complete' ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span>
          <span><strong>{d(stage.shortLabel)}</strong><small>{d(stage.label)}</small></span>
        </div>
      ))}
    </div>
  )
}

function CellarMap({ tanks }: { tanks: Tank[] }) {
  const [filter, setFilter] = useState<'all' | 'empty' | 'tinto' | 'blanco' | 'rosado' | 'attention'>('all')
  const [selected, setSelected] = useState<Tank | null>(null)
  const { t } = useLanguage()
  const visible = tanks.filter((tank) => filter === 'all' || (filter === 'empty' ? tank.volume === 0 : filter === 'attention' ? tank.attention !== 'normal' : tank.type === filter))
  return (
    <main>
      <PageHeader eyebrow={t('cellar.kicker')} title={t('cellar.title')} description={t('cellar.description')} />
      <div className="cellar-tabs"><span className="active">{t('cellar.fermentationHall')}</span><span>{t('cellar.conservation')}</span><span>{t('cellar.barrels')}</span><span>{t('cellar.bottling')}</span></div>
      <div className="filter-bar cellar-filter"><div className="filter-chips">{([['all', t('cellar.all')], ['empty', t('cellar.free')], ['tinto', t('cellar.red')], ['blanco', t('cellar.white')], ['rosado', t('cellar.rose')], ['attention', t('cellar.attention')]] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="map-summary">{t('cellar.visible', { count: visible.length })}</span></div>
      <section className="cellar-map-shell">
        <div className="cellar-map-header"><span>{t('cellar.harvestEntrance')}</span><i /><span>{t('cellar.workArea')}</span></div>
        <div className="tank-grid">
          {visible.map((tank) => <TankVisual key={tank.id} tank={tank} selected={selected?.id === tank.id} onSelect={() => setSelected(tank)} />)}
        </div>
        <div className="cellar-map-footer"><span><Factory size={16} /> {t('cellar.press')}</span><span><Beaker size={16} /> {t('cellar.lab')}</span><span><Warehouse size={16} /> {t('cellar.ageingAccess')}</span></div>
      </section>
      {selected && <TankDrawer tank={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}

function TankVisual({ tank, selected, onSelect }: { tank: Tank; selected: boolean; onSelect: () => void }) {
  const level = Math.round((tank.volume / tank.capacity) * 100)
  const { t, d, locale } = useLanguage()
  return (
    <button className={`tank-visual ${tank.type ?? 'empty'} ${tank.attention} ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <span className="tank-body"><i style={{ height: `${level}%` }} /><strong>{tank.id}</strong>{tank.attention !== 'normal' && <Activity size={16} />}</span>
      <span className="tank-info"><strong>{tank.lot ?? t('common.available')}</strong><small>{tank.stage ? d(tank.stage) : `${new Intl.NumberFormat(locale).format(tank.capacity)} L`}</small><em>{tank.volume ? `${level}% · ${tank.temperature?.toFixed(1)} °C` : t('cellar.free')}</em></span>
    </button>
  )
}

function TankDrawer({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const navigate = useNavigate()
  const { t, d, locale } = useLanguage()
  return (
    <aside className="tank-drawer">
      <div className="drawer-head"><div><span className="eyebrow">{t('detail.vessel')}</span><h2>{tank.id}</h2></div><button className="icon-button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></div>
      {tank.volume ? <>
        <div className={`drawer-wine-card ${tank.type}`}><span>{typeIcon[tank.type!]}</span><div><small>{t(wineLabelKey[tank.type!])}</small><strong>{tank.lot}</strong><em>{d(tank.stage ?? '')}</em></div></div>
        <div className="drawer-data"><span><small>{t('common.volume')}</small><strong>{formatVolume(tank.volume, locale)}</strong></span><span><small>{t('common.capacity')}</small><strong>{new Intl.NumberFormat(locale).format(tank.capacity)} L</strong></span><span><small>{t('common.temperature')}</small><strong>{tank.temperature?.toFixed(1)} °C</strong></span><span><small>{t('common.occupancy')}</small><strong>{Math.round(tank.volume / tank.capacity * 100)}%</strong></span></div>
        {tank.attention !== 'normal' && <div className={`drawer-alert ${tank.attention}`}><Activity size={18} /><span><strong>{t('cellar.requiresAttention')}</strong><small>{tank.attention === 'critical' ? t('cellar.limit') : t('cellar.review')}</small></span></div>}
        <button className="primary-button full" onClick={() => tank.lot && navigate(`/lots/${tank.lot}`)}>{t('cellar.openLot')} <ArrowUpRight size={18} /></button>
      </> : <div className="empty-tank-copy"><Warehouse size={30} /><h3>{t('cellar.availableTank')}</h3><p>{t('cellar.cleanReady', { capacity: tank.capacity.toLocaleString(locale) })}</p><span className="available-label"><CheckCircle2 size={16} /> {t('cellar.availableAssignment')}</span></div>}
    </aside>
  )
}

function TasksPage({ lots, tasks, setTasks, onCreate }: { lots: WineLot[]; tasks: CellarTask[]; setTasks: React.Dispatch<React.SetStateAction<CellarTask[]>>; onCreate: (input: NewTaskInput) => void }) {
  const [creating, setCreating] = useState(false)
  const { t } = useLanguage()
  return (
    <main>
      <PageHeader eyebrow={t('tasks.kicker')} title={t('tasks.title')} description={t('tasks.description')} action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={18} /> {t('tasks.new')}</button>} />
      <section className="panel task-page-panel">
        {tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))} />)}
      </section>
      {creating && <NewTaskSheet lots={lots} onClose={() => setCreating(false)} onCreate={(input) => { onCreate(input); setCreating(false) }} />}
    </main>
  )
}

function ChartSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={`chart-skeleton ${compact ? 'compact' : ''}`}><i /><i /><i /><i /><i /></div>
}

function ReadingSheet({ lot, onClose, onSave }: { lot: WineLot; onClose: () => void; onSave: (lotId: string, reading: ReadingPoint, volume?: number) => void }) {
  const { t, d } = useLanguage()
  const [temperature, setTemperature] = useState(String(lot.temperature ?? ''))
  const [density, setDensity] = useState(String(lot.density ?? ''))
  const [volume, setVolume] = useState(String(lot.volume))
  const [note, setNote] = useState('')
  const previousReading = lot.readings.at(-1)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(lot.id, { time: 'Ahora', temperature: Number(temperature.replace(',', '.')), density: Number(density.replace(',', '.')), note: note.trim() || undefined }, Number(volume))
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={t('detail.registerReading')}>
      <button className="sheet-scrim" onClick={onClose} aria-label={t('common.close')} />
      <form className="reading-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="drawer-head"><div><span className="eyebrow">{lot.id} · {lot.vessel}</span><h2>{t('detail.registerReading')}</h2><p>{d(lot.stage)}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></div>
        <div className="previous-reading"><Clock3 size={17} /><span><small>{t('reading.previous', { time: d(previousReading?.time ?? t('detail.noReadings')) })}</small><strong>{lot.temperature?.toFixed(1)} °C · {lot.density?.toFixed(3)}</strong></span></div>
        <div className="reading-fields">
          <label><span><Thermometer size={17} /> {t('common.temperature')}</span><div><input inputMode="decimal" required value={temperature} onChange={(event) => setTemperature(event.target.value)} /><i>°C</i></div></label>
          <label><span><Droplets size={17} /> {t('common.density')}</span><div><input inputMode="decimal" required value={density} onChange={(event) => setDensity(event.target.value)} /><i>g/mL</i></div></label>
          <label><span><Gauge size={17} /> {t('common.volume')}</span><div><input inputMode="numeric" required value={volume} onChange={(event) => setVolume(event.target.value)} /><i>L</i></div></label>
        </div>
        <label className="note-field"><span>{t('reading.observation')}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('reading.placeholder')} /></label>
        <div className="operator-row"><span className="avatar small-avatar">EM</span><span><small>{t('reading.operator')}</small><strong>Elena Martín · {t('common.now')}</strong></span><CheckCircle2 size={18} /></div>
        <div className="sheet-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Save size={18} /> {t('reading.save')}</button></div>
      </form>
    </div>
  )
}

export default App
