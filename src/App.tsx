import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity, ArrowLeft, ArrowUpRight, BarChart3, Beaker, Bell, Check,
  CheckCircle2, ChevronDown, ChevronRight, Circle, ClipboardCheck, Clock3, Droplets,
  Factory, FlaskConical, Gauge, Grape, Grid2X2, Home, Leaf, List, MapPin, Menu, Moon,
  MoreHorizontal, Package, Plus, Save, Search, Settings2, ShieldCheck,
  Sparkles, Sprout, Sun, Thermometer, Undo2, Warehouse,
  Waypoints, Wine, X,
} from 'lucide-react'
import { images, initialTasks, lots as seedLots, tanks } from './data'
import { NavLink, useHashLocation, useNavigate } from './router'
import type { CellarTask, ReadingPoint, Tank, WineLot, WineType } from './types'

const formatVolume = (volume: number) => `${new Intl.NumberFormat('es-ES').format(volume)} L`

const wineLabel: Record<WineType, string> = {
  tinto: 'Tinto',
  blanco: 'Blanco',
  rosado: 'Rosado',
  espumoso: 'Espumoso',
}

const FermentationChart = lazy(() => import('./Charts').then((module) => ({ default: module.FermentationChart })))
const PreviewChart = lazy(() => import('./Charts').then((module) => ({ default: module.PreviewChart })))

const typeIcon: Record<WineType, ReactNode> = {
  tinto: <Wine size={18} />,
  blanco: <Leaf size={18} />,
  rosado: <Sparkles size={18} />,
  espumoso: <Sparkles size={18} />,
}

const navItems = [
  { label: 'Hoy', path: '/dashboard', icon: Home },
  { label: 'Vendimia', path: '/production', icon: Sprout },
  { label: 'Elaboración', path: '/lots', icon: Grape },
  { label: 'Bodega', path: '/cellar', icon: Warehouse },
  { label: 'Laboratorio', path: '/laboratory', icon: FlaskConical },
  { label: 'Crianza', path: '/ageing', icon: Wine },
  { label: 'Embotellado', path: '/bottling', icon: Package },
  { label: 'Trazabilidad', path: '/traceability', icon: Waypoints },
  { label: 'Informes', path: '/reports', icon: BarChart3 },
]

function App() {
  const { pathname } = useHashLocation()
  const [demoLots, setDemoLots] = useState<WineLot[]>(seedLots)
  const [tasks, setTasks] = useState<CellarTask[]>(initialTasks)
  const [cellarMode, setCellarMode] = useState(() => localStorage.getItem('anada-theme') === 'cellar')
  const [menuOpen, setMenuOpen] = useState(false)
  const [readingLotId, setReadingLotId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [undoLot, setUndoLot] = useState<WineLot | null>(null)

  const toggleCellarMode = () => {
    setCellarMode((current) => {
      const next = !current
      localStorage.setItem('anada-theme', next ? 'cellar' : 'light')
      return next
    })
  }

  const saveReading = (lotId: string, reading: ReadingPoint, volume?: number) => {
    setUndoLot(demoLots.find((lot) => lot.id === lotId) ?? null)
    setDemoLots((current) => current.map((lot) => lot.id === lotId
      ? {
          ...lot,
          temperature: reading.temperature,
          density: reading.density,
          volume: volume ?? lot.volume,
          readings: [...lot.readings, reading],
        }
      : lot))
    setReadingLotId(null)
    setToast(`Lectura guardada en ${lotId}`)
    window.setTimeout(() => setToast(null), 4200)
  }

  const undoReading = () => {
    if (!undoLot) return
    setDemoLots((current) => current.map((lot) => lot.id === undoLot.id ? undoLot : lot))
    setToast(`Última lectura de ${undoLot.id} deshecha`)
    setUndoLot(null)
    window.setTimeout(() => setToast(null), 3200)
  }

  const readingLot = demoLots.find((lot) => lot.id === readingLotId)

  if (pathname === '/welcome') return <div className={cellarMode ? 'app cellar-theme' : 'app'}><Welcome /></div>

  let currentPage: ReactNode
  if (pathname === '/dashboard') currentPage = <Dashboard lots={demoLots} tasks={tasks} setTasks={setTasks} onReading={setReadingLotId} />
  else if (pathname === '/production') currentPage = <Production />
  else if (pathname === '/lots') currentPage = <LotsOverview lots={demoLots} />
  else if (pathname.startsWith('/lots/')) currentPage = <LotDetail lots={demoLots} lotId={decodeURIComponent(pathname.slice('/lots/'.length))} onReading={setReadingLotId} />
  else if (pathname === '/cellar') currentPage = <CellarMap />
  else if (pathname === '/tasks') currentPage = <TasksPage tasks={tasks} setTasks={setTasks} />
  else if (pathname === '/laboratory') currentPage = <PreviewModule type="laboratory" />
  else if (pathname === '/ageing') currentPage = <PreviewModule type="ageing" />
  else if (pathname === '/bottling') currentPage = <PreviewModule type="bottling" />
  else if (pathname === '/traceability') currentPage = <PreviewModule type="traceability" />
  else if (pathname === '/reports') currentPage = <PreviewModule type="reports" />
  else if (pathname === '/settings') currentPage = <PreviewModule type="settings" />
  else currentPage = <Dashboard lots={demoLots} tasks={tasks} setTasks={setTasks} onReading={setReadingLotId} />

  return (
    <div className={cellarMode ? 'app cellar-theme' : 'app'}>
      <Shell
        cellarMode={cellarMode}
        toggleCellarMode={toggleCellarMode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onQuickReading={() => setReadingLotId('T-26-017')}
        onNotifications={() => {
          setToast('3 alertas activas · 1 requiere revisión')
          window.setTimeout(() => setToast(null), 3200)
        }}
      >
        {currentPage}
      </Shell>

      {readingLot && <ReadingSheet lot={readingLot} onClose={() => setReadingLotId(null)} onSave={saveReading} />}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          {undoLot && <button onClick={undoReading} aria-label="Deshacer última lectura"><Undo2 size={17} /> Deshacer</button>}
        </div>
      )}
    </div>
  )
}

function Welcome() {
  const navigate = useNavigate()
  return (
    <main className="welcome-screen">
      <div className="welcome-visual" style={{ backgroundImage: `url(${images.vineyard})` }}>
        <div className="welcome-brand"><Brand light /></div>
        <div className="welcome-caption">
          <span className="eyebrow light">Desde la viña hasta la botella</span>
          <h1>El vino marca el ritmo.<br />Añada lo hace visible.</h1>
          <p>Una forma más clara y natural de trabajar en bodega.</p>
        </div>
      </div>
      <section className="welcome-panel">
        <div className="demo-pill"><Circle size={8} fill="currentColor" /> Entorno de demostración</div>
        <div>
          <span className="eyebrow">Tu espacio de trabajo</span>
          <h2>Bienvenida, Elena</h2>
          <p className="muted">Retoma la vendimia donde la dejaste.</p>
        </div>
        <div className="winery-selector">
          <span className="winery-mark">VI</span>
          <span><strong>Bodega ValdeIregua</strong><small>Alberite · Rioja Oriental</small></span>
          <ChevronDown size={18} />
        </div>
        <button className="primary-button full" onClick={() => navigate('/dashboard')}>
          Entrar en bodega <ArrowUpRight size={18} />
        </button>
        <div className="welcome-meta">
          <span><ShieldCheck size={16} /> Datos de demostración</span>
          <span>Añada 0.1</span>
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

interface ShellProps {
  children: ReactNode
  cellarMode: boolean
  toggleCellarMode: () => void
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  onQuickReading: () => void
  onNotifications: () => void
}

function Shell({ children, cellarMode, toggleCellarMode, menuOpen, setMenuOpen, onQuickReading, onNotifications }: ShellProps) {
  const location = useHashLocation()
  const page = navItems.find((item) => location.pathname.startsWith(item.path))?.label ?? 'Añada'
  return (
    <div className="shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <div className="winery-mini">
          <span className="winery-mark small">VI</span>
          <span><strong>ValdeIregua</strong><small>Vendimia 2026</small></span>
          <ChevronDown size={15} />
        </div>
        <nav className="primary-nav" aria-label="Navegación principal">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setMenuOpen(false)}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="nav-item"><Settings2 size={19} /><span>Configuración</span></NavLink>
          <div className="user-mini">
            <span className="avatar">EM</span>
            <span><strong>Elena Martín</strong><small>Enóloga</small></span>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu size={21} /></button>
            <span className="mobile-page-title">{page}</span>
          </div>
          <div className="topbar-actions">
            <button className="mode-button" onClick={toggleCellarMode}>
              {cellarMode ? <Sun size={17} /> : <Moon size={17} />}
              <span>{cellarMode ? 'Modo claro' : 'Modo bodega'}</span>
            </button>
            <button className="icon-button notification-button" onClick={onNotifications} aria-label="Notificaciones"><Bell size={19} /><i /></button>
            <span className="avatar top-avatar">EM</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </section>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        <MobileNavItem to="/dashboard" icon={<Home />} label="Hoy" />
        <MobileNavItem to="/lots" icon={<Grape />} label="Lotes" />
        <button className="mobile-quick" onClick={onQuickReading} aria-label="Registrar lectura"><Plus /></button>
        <MobileNavItem to="/cellar" icon={<Warehouse />} label="Bodega" />
        <MobileNavItem to="/tasks" icon={<ClipboardCheck />} label="Tareas" />
      </nav>
    </div>
  )
}

function MobileNavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return <NavLink to={to} className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>{icon}<span>{label}</span></NavLink>
}

interface DashboardProps {
  lots: WineLot[]
  tasks: CellarTask[]
  setTasks: React.Dispatch<React.SetStateAction<CellarTask[]>>
  onReading: (lotId: string) => void
}

function Dashboard({ lots, tasks, setTasks, onReading }: DashboardProps) {
  const navigate = useNavigate()
  const pending = tasks.filter((task) => !task.complete)
  const occupied = tanks.filter((tank) => tank.volume > 0)
  return (
    <main>
      <PageHeader
        eyebrow="Jueves, 31 de julio"
        title="Buenos días, Elena"
        description="La bodega está en marcha. Hay tres asuntos que necesitan tu atención."
        action={<button className="primary-button" onClick={() => navigate('/production')}><Plus size={18} /> Nueva elaboración</button>}
      />

      <section className="metrics-grid" aria-label="Resumen de bodega">
        <MetricCard label="Lotes activos" value="12" detail="4 en fermentación" icon={<Grape />} accent="wine" />
        <MetricCard label="Capacidad ocupada" value="71%" detail="64.550 de 91.000 L" icon={<Gauge />} accent="stone" />
        <MetricCard label="Tareas pendientes" value={String(pending.length)} detail="2 antes de las 17:00" icon={<ClipboardCheck />} accent="gold" />
        <MetricCard label="Alertas activas" value="3" detail="1 requiere revisión" icon={<Activity />} accent="red" />
      </section>

      <section className="section-block">
        <SectionHeading title="Ahora en bodega" subtitle="Lo que está evolucionando en este momento" link="Ver todos los lotes" onLink={() => navigate('/lots')} />
        <div className="active-lots-grid">
          {lots.slice(0, 3).map((lot) => <LotCard key={lot.id} lot={lot} onOpen={() => navigate(`/lots/${lot.id}`)} onReading={() => onReading(lot.id)} />)}
        </div>
      </section>

      <section className="dashboard-columns">
        <div className="task-panel panel">
          <SectionHeading title="Tareas de hoy" subtitle={`${pending.length} operaciones pendientes`} link="Ver agenda" onLink={() => navigate('/tasks')} compact />
          <div className="task-list">
            {tasks.slice(0, 4).map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))} />
            ))}
          </div>
        </div>
        <div className="occupancy-panel panel">
          <SectionHeading title="Ocupación" subtitle="Nave de fermentación" link="Abrir mapa" onLink={() => navigate('/cellar')} compact />
          <div className="occupancy-visual">
            <ProgressRing value={71} />
            <div className="mini-tanks">
              {occupied.slice(0, 6).map((tank) => <MiniTank key={tank.id} tank={tank} />)}
            </div>
          </div>
          <div className="occupancy-legend"><span><i className="dot wine" /> Tinto 48%</span><span><i className="dot white" /> Blanco 23%</span><span><i className="dot empty" /> Libre 29%</span></div>
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
  return (
    <article className={`lot-card lot-${lot.type}`}>
      <button className="lot-image" style={{ backgroundImage: `url(${lot.image})` }} onClick={onOpen} aria-label={`Abrir lote ${lot.id}`}>
        <span className="lot-type-chip">{typeIcon[lot.type]} {wineLabel[lot.type]}</span>
        {lot.attention !== 'normal' && <span className={`attention-chip ${lot.attention}`}><Activity size={14} /> {lot.attentionText}</span>}
      </button>
      <div className="lot-card-body">
        <div className="lot-title"><div><span>{lot.id}</span><h3>{lot.name}</h3></div><button className="icon-button small" onClick={onOpen} aria-label="Abrir detalle"><ArrowUpRight size={17} /></button></div>
        <p className="lot-origin"><MapPin size={14} /> {lot.origin}</p>
        <div className="lot-stage"><span>{lot.stage}</span>{lot.day && <small>Día {lot.day}</small>}</div>
        <div className="progress-track"><i style={{ width: `${lot.progress}%` }} /></div>
        <div className="lot-readings">
          {lot.temperature && <span><Thermometer size={16} /><strong>{lot.temperature.toFixed(1)}°</strong><small>Temp.</small></span>}
          {lot.density && <span><Droplets size={16} /><strong>{lot.density.toFixed(3)}</strong><small>Densidad</small></span>}
          <span><Gauge size={16} /><strong>{formatVolume(lot.volume)}</strong><small>{lot.vessel}</small></span>
        </div>
        <button className="next-operation" onClick={onReading}><span><Clock3 size={16} /><i>Próximo</i><strong>{lot.nextAction}</strong></span><small>{lot.nextTime}</small></button>
      </div>
    </article>
  )
}

function TaskRow({ task, onToggle }: { task: CellarTask; onToggle: () => void }) {
  return (
    <div className={`task-row ${task.complete ? 'complete' : ''}`}>
      <button className="task-check" onClick={onToggle} aria-label={task.complete ? 'Reabrir tarea' : 'Completar tarea'}>{task.complete ? <Check size={16} /> : null}</button>
      <div className="task-copy"><strong>{task.title}</strong><span>{task.lot} · {task.assignee}</span></div>
      <span className={`priority-dot ${task.priority}`} />
      <time>{task.time}</time>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  return <div className="progress-ring" style={{ '--progress': `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>ocupado</span></div></div>
}

function MiniTank({ tank }: { tank: Tank }) {
  const level = Math.round((tank.volume / tank.capacity) * 100)
  return <div className={`mini-tank ${tank.type ?? 'empty'} ${tank.attention !== 'normal' ? 'attention' : ''}`} title={`${tank.id}: ${level}%`}><i style={{ height: `${level}%` }} /><span>{tank.id}</span></div>
}

function Production() {
  const [selected, setSelected] = useState<WineType | null>(null)
  const navigate = useNavigate()
  const options = [
    { type: 'tinto' as const, title: 'Tinto', image: images.cellar, detail: 'Fermentación con hollejos, maceración, descube y maloláctica.', stages: '11 etapas', active: true },
    { type: 'blanco' as const, title: 'Blanco', image: images.whiteGrapes, detail: 'Prensado, desfangado y fermentación protegida a baja temperatura.', stages: '10 etapas', active: true },
    { type: 'rosado' as const, title: 'Rosado / Clarete', image: images.vineyard, detail: 'Prensado directo, sangrado o maceración corta.', stages: 'Fase 2', active: false },
    { type: 'espumoso' as const, title: 'Espumoso', image: images.barrels, detail: 'Vino base y método tradicional con crianza sobre lías.', stages: 'Fase 4', active: false },
  ]
  const selectedLot = selected === 'tinto' ? seedLots[0] : seedLots[1]
  return (
    <main>
      <PageHeader eyebrow="Vendimia 2026" title="Nueva elaboración" description="Elige el tipo de vino. Añada adaptará etapas, controles y operaciones al proceso real." />
      <div className="process-choice-grid">
        {options.map((option) => (
          <button
            key={option.type}
            className={`process-choice ${selected === option.type ? 'selected' : ''} ${!option.active ? 'disabled' : ''}`}
            onClick={() => option.active && setSelected(option.type)}
            aria-disabled={!option.active}
            disabled={!option.active}
          >
            <span className="process-choice-image" style={{ backgroundImage: `url(${option.image})` }}><i>{option.active ? option.stages : 'Próximamente'}</i></span>
            <span className="process-choice-copy"><span className={`wine-symbol ${option.type}`}>{typeIcon[option.type]}</span><strong>{option.title}</strong><small>{option.detail}</small></span>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
      {selected && selectedLot && (
        <section className={`process-preview preview-${selected}`}>
          <div className="process-preview-head"><div><span className="eyebrow">Plantilla seleccionada</span><h2>Elaboración de {wineLabel[selected].toLowerCase()} tradicional</h2><p>Las etapas se pueden adaptar antes de crear el lote.</p></div><button className="primary-button" onClick={() => navigate(`/lots/${selectedLot.id}`)}>Previsualizar lote <ArrowUpRight size={18} /></button></div>
          <ProcessTimeline lot={selectedLot} />
          <div className="context-operation-row">
            {(selected === 'tinto' ? ['Remontado', 'Bazuqueo', 'Descube', 'Control de málico'] : ['Prensado', 'Desfangado', 'Control de turbidez', 'Bâtonnage']).map((operation) => <span key={operation}><CheckCircle2 size={15} /> {operation}</span>)}
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
  const filtered = lots.filter((lot) => {
    const matchesQuery = `${lot.id} ${lot.name} ${lot.varieties} ${lot.origin}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'todos' || (filter === 'attention' ? lot.attention !== 'normal' : lot.type === filter)
    return matchesQuery && matchesFilter
  })
  return (
    <main>
      <PageHeader eyebrow="Elaboración" title="Lotes en bodega" description={`${lots.length} lotes activos · Vendimias 2025–2026`} action={<button className="primary-button" onClick={() => navigate('/production')}><Plus size={18} /> Nuevo lote</button>} />
      <div className="filter-bar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lote, variedad u origen" /></label>
        <div className="filter-chips">
          {([['todos', 'Todos'], ['tinto', 'Tintos'], ['blanco', 'Blancos'], ['attention', 'Requieren atención']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className="view-switch"><button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Vista tarjetas"><Grid2X2 size={17} /></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="Vista lista"><List size={17} /></button></div>
      </div>
      <div className={view === 'grid' ? 'lots-overview-grid' : 'lots-overview-list'}>
        {filtered.map((lot) => <OverviewLotCard key={lot.id} lot={lot} onOpen={() => navigate(`/lots/${lot.id}`)} compact={view === 'list'} />)}
      </div>
      {filtered.length === 0 && <div className="empty-state"><Search size={28} /><h3>No hay lotes que coincidan</h3><p>Prueba con otro término o elimina algún filtro.</p></div>}
    </main>
  )
}

function OverviewLotCard({ lot, onOpen, compact }: { lot: WineLot; onOpen: () => void; compact: boolean }) {
  return (
    <button className={`overview-lot ${compact ? 'compact' : ''}`} onClick={onOpen}>
      <span className="overview-lot-image" style={{ backgroundImage: `url(${lot.image})` }}><i className={`wine-band ${lot.type}`} /></span>
      <span className="overview-lot-main"><small>{lot.id} · {wineLabel[lot.type]}</small><strong>{lot.name}</strong><i>{lot.varieties}</i><em><MapPin size={13} /> {lot.origin}</em></span>
      <span className="overview-stage"><small>Etapa actual</small><strong>{lot.stage}</strong><span className="progress-track"><i style={{ width: `${lot.progress}%` }} /></span></span>
      <span className="overview-volume"><strong>{formatVolume(lot.volume)}</strong><small>{lot.vessel}</small></span>
      <span className={`attention-or-arrow ${lot.attention}`}>{lot.attention !== 'normal' ? <Activity size={17} /> : <ChevronRight size={19} />}</span>
    </button>
  )
}

function LotDetail({ lots, lotId, onReading }: { lots: WineLot[]; lotId: string; onReading: (id: string) => void }) {
  const navigate = useNavigate()
  const lot = lots.find((item) => item.id === lotId)
  if (!lot) return <div className="empty-state"><Search size={28} /><h3>Lote no encontrado</h3><button className="secondary-button" onClick={() => navigate('/lots')}>Volver a lotes</button></div>
  const isRed = lot.type === 'tinto'
  return (
    <main className="lot-detail-page">
      <button className="back-button" onClick={() => navigate('/lots')}><ArrowLeft size={17} /> Volver a lotes</button>
      <section className={`lot-hero lot-${lot.type}`} style={{ backgroundImage: `url(${lot.image})` }}>
        <div className="lot-hero-overlay" />
        <div className="lot-hero-content">
          <div className="lot-hero-top"><span className="lot-type-chip glass">{typeIcon[lot.type]} {wineLabel[lot.type]}</span><span className="doca-chip"><ShieldCheck size={15} /> Elegibilidad pendiente de validación</span></div>
          <div><span className="eyebrow light">{lot.id} · Vendimia {lot.vintage}</span><h1>{lot.name}</h1><p>{lot.varieties}</p><span className="hero-origin"><MapPin size={15} /> {lot.origin}</span></div>
        </div>
      </section>

      <section className="lot-status-grid">
        <div className="current-stage-card panel">
          <div className="stage-label"><span className="pulse-dot" /><span><small>Etapa actual</small><strong>{lot.stage}</strong></span>{lot.day && <em>Día {lot.day}</em>}</div>
          <p>{isRed ? 'Fermentación activa con gestión suave del sombrero para preservar fruta y frescura.' : 'Fermentación protegida a baja temperatura. Cinética estable y sin desviaciones.'}</p>
          <div className="stage-actions">
            <button className="primary-button" onClick={() => onReading(lot.id)}><Plus size={18} /> Registrar lectura</button>
            {(isRed ? ['Remontado', 'Bazuqueo', 'Adición', 'Muestra'] : ['Control temperatura', 'Muestra', 'Trasiego']).map((action) => <span className="context-action" key={action}>{action}</span>)}
          </div>
        </div>
        <div className="vessel-card panel">
          <div className="vessel-graphic"><span className={`vessel-fill ${lot.type}`} style={{ height: `${Math.min(92, lot.volume / 100)}%` }} /><i>{lot.vessel}</i></div>
          <div><span className="eyebrow">Recipiente</span><h3>Depósito {lot.vessel.replace('D-', '')}</h3><p>Acero inoxidable · 10.000 L</p><div className="vessel-data"><span><strong>{formatVolume(lot.volume)}</strong><small>Volumen</small></span><span><strong>{Math.round(lot.volume / 100)}%</strong><small>Ocupación</small></span></div></div>
        </div>
      </section>

      <section className="panel process-panel">
        <SectionHeading title={`Proceso de elaboración · ${wineLabel[lot.type]}`} subtitle="La secuencia y las operaciones se adaptan al tipo de vino" compact />
        <ProcessTimeline lot={lot} />
      </section>

      <section className="detail-columns">
        <div className="panel readings-panel">
          <SectionHeading title="Evolución" subtitle={lot.readings.length ? 'Últimas lecturas del lote' : 'Sin lecturas recientes'} compact />
          {lot.readings.length ? <Suspense fallback={<ChartSkeleton />}><FermentationChart data={lot.readings} /></Suspense> : <div className="empty-chart"><Activity size={25} /><span>El seguimiento de esta etapa se mostrará aquí.</span></div>}
          <div className="reading-kpis">
            {lot.temperature && <span><i className="kpi-icon warm"><Thermometer /></i><small>Temperatura</small><strong>{lot.temperature.toFixed(1)} °C</strong><em>{isRed ? '+0,6° desde las 08h' : 'Estable'}</em></span>}
            {lot.density && <span><i className="kpi-icon blue"><Droplets /></i><small>Densidad</small><strong>{lot.density.toFixed(3)}</strong><em>-0,006 desde las 08h</em></span>}
            {!isRed && <span><i className="kpi-icon stone"><Beaker /></i><small>Turbidez inicial</small><strong>82 NTU</strong><em>Tras desfangado</em></span>}
          </div>
        </div>
        <div className="panel activity-panel">
          <SectionHeading title="Actividad reciente" subtitle="Registro firmado de operaciones" compact />
          <div className="activity-list">
            {(isRed ? [
              ['Remontado suave', 'Martín Ruiz', 'Hoy · 12:10', '15 min · Sin incidencias'],
              ['Lectura de densidad', 'Elena Martín', 'Hoy · 08:04', '1.052 · 24,2 °C'],
              ['Adición de nutrientes', 'Elena Martín', 'Ayer · 18:42', '12 kg · Nutriente orgánico'],
              ['Remontado con aireación', 'Martín Ruiz', 'Ayer · 17:15', '20 min'],
            ] : [
              ['Control de temperatura', 'Elena Martín', 'Hoy · 09:12', '15,2 °C · Estable'],
              ['Lectura de densidad', 'Lucía Sáenz', 'Ayer · 17:30', '1.026 · 15,1 °C'],
              ['Inoculación', 'Elena Martín', '25 sept · 11:20', 'Levadura seleccionada'],
              ['Trasiego de mosto limpio', 'Martín Ruiz', '25 sept · 08:40', '5.240 L'],
            ]).map(([title, person, time, detail], index) => (
              <div className="activity-row" key={title}><span className="activity-icon">{index === 1 ? <Droplets size={16} /> : <Check size={16} />}</span><span><strong>{title}</strong><small>{person} · {time}</small><em>{detail}</em></span></div>
            ))}
          </div>
        </div>
      </section>

      {!isRed && (
        <section className="white-specific panel">
          <div><span className="eyebrow">Preparación del mosto</span><h2>Prensado y desfangado</h2><p>Información específica del proceso de blanco, visible sin abrir operaciones genéricas.</p></div>
          <div className="white-specific-grid">
            <span><i>01</i><small>Fracción seleccionada</small><strong>Mosto yema</strong><em>Rendimiento 61%</em></span>
            <span><i>02</i><small>Protección</small><strong>Inertizado</strong><em>Desde recepción</em></span>
            <span><i>03</i><small>Desfangado</small><strong>18 horas</strong><em>10,2 °C</em></span>
            <span><i>04</i><small>Turbidez</small><strong>82 NTU</strong><em>Objetivo alcanzado</em></span>
          </div>
        </section>
      )}
    </main>
  )
}

function ProcessTimeline({ lot }: { lot: WineLot }) {
  return (
    <div className="process-timeline">
      {lot.process.map((stage, index) => (
        <div className={`process-stage ${stage.status}`} key={stage.id}>
          <span className="stage-node">{stage.status === 'complete' ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span>
          <span><strong>{stage.shortLabel}</strong><small>{stage.label}</small></span>
        </div>
      ))}
    </div>
  )
}

function CellarMap() {
  const [filter, setFilter] = useState<'all' | 'empty' | 'tinto' | 'blanco' | 'attention'>('all')
  const [selected, setSelected] = useState<Tank | null>(null)
  const visible = tanks.filter((tank) => filter === 'all' || (filter === 'empty' ? tank.volume === 0 : filter === 'attention' ? tank.attention !== 'normal' : tank.type === filter))
  return (
    <main>
      <PageHeader eyebrow="Bodega ValdeIregua" title="Mapa de bodega" description="Una lectura visual de cada recipiente, lote y estado de atención." />
      <div className="cellar-tabs"><span className="active">Nave de fermentación</span><span>Sala de conservación · Fase 2</span><span>Sala de barricas · Fase 2</span><span>Embotellado · Fase 2</span></div>
      <div className="filter-bar cellar-filter"><div className="filter-chips">{([['all', 'Todos'], ['empty', 'Libres'], ['tinto', 'Tintos'], ['blanco', 'Blancos'], ['attention', 'Con atención']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="map-summary">{visible.length} depósitos visibles</span></div>
      <section className="cellar-map-shell">
        <div className="cellar-map-header"><span>ENTRADA DE VENDIMIA</span><i /><span>ZONA DE TRABAJO</span></div>
        <div className="tank-grid">
          {visible.map((tank) => <TankVisual key={tank.id} tank={tank} selected={selected?.id === tank.id} onSelect={() => setSelected(tank)} />)}
        </div>
        <div className="cellar-map-footer"><span><Factory size={16} /> Prensa</span><span><Beaker size={16} /> Laboratorio</span><span><Warehouse size={16} /> Acceso a crianza</span></div>
      </section>
      {selected && <TankDrawer tank={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}

function TankVisual({ tank, selected, onSelect }: { tank: Tank; selected: boolean; onSelect: () => void }) {
  const level = Math.round((tank.volume / tank.capacity) * 100)
  return (
    <button className={`tank-visual ${tank.type ?? 'empty'} ${tank.attention} ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <span className="tank-body"><i style={{ height: `${level}%` }} /><strong>{tank.id}</strong>{tank.attention !== 'normal' && <Activity size={16} />}</span>
      <span className="tank-info"><strong>{tank.lot ?? 'Disponible'}</strong><small>{tank.stage ?? `${new Intl.NumberFormat('es-ES').format(tank.capacity)} L`}</small><em>{tank.volume ? `${level}% · ${tank.temperature?.toFixed(1)} °C` : 'Libre'}</em></span>
    </button>
  )
}

function TankDrawer({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <aside className="tank-drawer">
      <div className="drawer-head"><div><span className="eyebrow">Depósito</span><h2>{tank.id}</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div>
      {tank.volume ? <>
        <div className={`drawer-wine-card ${tank.type}`}><span>{typeIcon[tank.type!]}</span><div><small>{wineLabel[tank.type!]}</small><strong>{tank.lot}</strong><em>{tank.stage}</em></div></div>
        <div className="drawer-data"><span><small>Volumen</small><strong>{formatVolume(tank.volume)}</strong></span><span><small>Capacidad</small><strong>{new Intl.NumberFormat('es-ES').format(tank.capacity)} L</strong></span><span><small>Temperatura</small><strong>{tank.temperature?.toFixed(1)} °C</strong></span><span><small>Ocupación</small><strong>{Math.round(tank.volume / tank.capacity * 100)}%</strong></span></div>
        {tank.attention !== 'normal' && <div className={`drawer-alert ${tank.attention}`}><Activity size={18} /><span><strong>Requiere atención</strong><small>{tank.attention === 'critical' ? 'Nivel próximo al límite operativo' : 'Revisar seguimiento del lote'}</small></span></div>}
        <button className="primary-button full" onClick={() => tank.lot && navigate(`/lots/${tank.lot}`)}>Abrir lote <ArrowUpRight size={18} /></button>
      </> : <div className="empty-tank-copy"><Warehouse size={30} /><h3>Depósito disponible</h3><p>10.000 L limpios y preparados para asignación.</p><span className="available-label"><CheckCircle2 size={16} /> Disponible para asignación</span></div>}
    </aside>
  )
}

function TasksPage({ tasks, setTasks }: { tasks: CellarTask[]; setTasks: React.Dispatch<React.SetStateAction<CellarTask[]>> }) {
  return (
    <main>
      <PageHeader eyebrow="Jueves, 31 de julio" title="Tareas de bodega" description="Operaciones ordenadas por prioridad y momento óptimo." />
      <section className="panel task-page-panel">
        {tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))} />)}
      </section>
    </main>
  )
}

const previewData = {
  laboratory: { eyebrow: 'Control enológico', title: 'Laboratorio', text: 'Analíticas, límites, muestras pendientes y evolución de cada parámetro.', image: images.whiteGrapes, icon: <FlaskConical /> },
  ageing: { eyebrow: 'Tiempo y madera', title: 'Crianza', text: 'Barricas, rellenos, catas y elegibilidad de envejecimiento en una sola vista.', image: images.barrels, icon: <Wine /> },
  bottling: { eyebrow: 'De lote a botella', title: 'Embotellado', text: 'Órdenes, materiales, rendimientos, lotes de expedición y contraetiquetas.', image: images.tanks, icon: <Package /> },
  traceability: { eyebrow: 'Genealogía completa', title: 'Trazabilidad', text: 'De cualquier botella a cada depósito, operación, entrega de uva y parcela.', image: images.vineyard, icon: <Waypoints /> },
  reports: { eyebrow: 'Decisiones con contexto', title: 'Informes', text: 'Rendimientos, capacidad, calidad y costes explicados sin hojas de cálculo.', image: images.cellar, icon: <BarChart3 /> },
  settings: { eyebrow: 'Configuración', title: 'Tu bodega', text: 'Usuarios, roles, procesos, variedades, unidades y reglas de campaña.', image: images.vineyard, icon: <Settings2 /> },
}

function PreviewModule({ type }: { type: keyof typeof previewData }) {
  const data = previewData[type]
  return (
    <main>
      <PageHeader eyebrow={data.eyebrow} title={data.title} description={data.text} />
      <section className="module-preview-hero" style={{ backgroundImage: `url(${data.image})` }}><div><span className="preview-icon">{data.icon}</span><span className="eyebrow light">Vista previa · Fase 2</span><h2>Diseñado alrededor del trabajo real de bodega.</h2><p>Esta área ya forma parte del sistema visual. Sus operaciones se conectarán al motor de procesos en el siguiente checkpoint.</p></div></section>
      <section className="preview-cards">
        <div className="panel"><span className="eyebrow">Resumen</span><h3>Información que importa</h3><div className="preview-stat-row"><span><strong>24</strong><small>Registros</small></span><span><strong>3</strong><small>Pendientes</small></span><span><strong>98%</strong><small>Completitud</small></span></div></div>
        <div className="panel preview-chart"><span className="eyebrow">Evolución</span><Suspense fallback={<ChartSkeleton compact />}><PreviewChart id={type} /></Suspense></div>
      </section>
    </main>
  )
}

function ChartSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={`chart-skeleton ${compact ? 'compact' : ''}`}><i /><i /><i /><i /><i /></div>
}

function ReadingSheet({ lot, onClose, onSave }: { lot: WineLot; onClose: () => void; onSave: (lotId: string, reading: ReadingPoint, volume?: number) => void }) {
  const [temperature, setTemperature] = useState(String(lot.temperature ?? ''))
  const [density, setDensity] = useState(String(lot.density ?? ''))
  const [volume, setVolume] = useState(String(lot.volume))
  const [note, setNote] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSave(lot.id, { time: 'Ahora', temperature: Number(temperature), density: Number(density) }, Number(volume))
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label="Registrar lectura">
      <button className="sheet-scrim" onClick={onClose} aria-label="Cerrar" />
      <form className="reading-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <div className="drawer-head"><div><span className="eyebrow">{lot.id} · {lot.vessel}</span><h2>Registrar lectura</h2><p>{lot.stage}</p></div><button className="icon-button" type="button" onClick={onClose}><X size={20} /></button></div>
        <div className="previous-reading"><Clock3 size={17} /><span><small>Lectura anterior · Hoy 12:00</small><strong>{lot.temperature?.toFixed(1)} °C · {lot.density?.toFixed(3)}</strong></span></div>
        <div className="reading-fields">
          <label><span><Thermometer size={17} /> Temperatura</span><div><input inputMode="decimal" required value={temperature} onChange={(event) => setTemperature(event.target.value)} /><i>°C</i></div></label>
          <label><span><Droplets size={17} /> Densidad</span><div><input inputMode="decimal" required value={density} onChange={(event) => setDensity(event.target.value)} /><i>g/mL</i></div></label>
          <label><span><Gauge size={17} /> Volumen</span><div><input inputMode="numeric" required value={volume} onChange={(event) => setVolume(event.target.value)} /><i>L</i></div></label>
        </div>
        <label className="note-field"><span>Observación opcional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Añade contexto para el siguiente turno…" /></label>
        <div className="operator-row"><span className="avatar small-avatar">EM</span><span><small>Operadora</small><strong>Elena Martín · Ahora</strong></span><CheckCircle2 size={18} /></div>
        <div className="sheet-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button"><Save size={18} /> Guardar lectura</button></div>
      </form>
    </div>
  )
}

export default App
