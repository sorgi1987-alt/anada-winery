import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  Archive, BellRing, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, CloudOff,
  Database, Download, Edit3, FlaskConical, Gauge, HardDrive, Info, Leaf, LockKeyhole, MapPin, MoreHorizontal, Plus, RefreshCw, RotateCcw, Server,
  Save, Search, ShieldCheck, SlidersHorizontal, Smartphone, Star, Thermometer, Trash2, Users, Warehouse, Wifi, WifiOff, X,
} from 'lucide-react'
import { catalystFoundation, checkCatalystReadService, type CatalystConnectionResult } from './catalyst'
import { getCurrentOperatorName } from './operator'
import { images } from './data'
import { useLanguage } from './i18n'
import { useNavigate } from './router'
import type { PwaStatus } from './pwa'
import type { BottlingOrder, Campaign, CampaignParcelPlan, GrapeDelivery, Grower, NewCampaignInput, NewGrowerInput, NewParcelInput, NewVineyardInput, VineyardEstate, VineyardParcel, WineLot, WinerySettings } from './types'
import type { CampaignUpdateInput } from './campaigns'
import type { GrowerUpdateInput } from './growers'
import type { VineyardUpdateInput } from './vineyards'
import type { ParcelUpdateInput } from './parcels'

type AdministrationView = 'winery' | 'campaign' | 'growers' | 'vineyards' | 'parcels' | 'operations' | 'system'

interface AdministrationPageProps {
  initialView?: AdministrationView
  settings: WinerySettings
  campaigns: Campaign[]
  growers: Grower[]
  vineyards: VineyardEstate[]
  parcels: VineyardParcel[]
  campaignParcels: CampaignParcelPlan[]
  lots: WineLot[]
  deliveries: GrapeDelivery[]
  bottlingOrders: BottlingOrder[]
  recordCount: number
  pwa: PwaStatus
  onSave: (settings: WinerySettings) => void
  onCreateCampaign: (input: NewCampaignInput) => void
  onUpdateCampaign: (id: string, input: CampaignUpdateInput) => void
  onCampaignAction: (action: 'activate' | 'close' | 'reopen' | 'archive' | 'default', id: string) => void
  onCreateGrower: (input: NewGrowerInput) => void
  onUpdateGrower: (id: string, input: GrowerUpdateInput) => void
  onGrowerAction: (action: 'deactivate' | 'reactivate', id: string) => void
  onCreateVineyard: (input: NewVineyardInput) => void
  onUpdateVineyard: (id: string, input: VineyardUpdateInput) => void
  onVineyardAction: (action: 'deactivate' | 'reactivate', id: string) => void
  onCreateParcel: (input: NewParcelInput) => void
  onUpdateParcel: (id: string, input: ParcelUpdateInput) => void
  onParcelAction: (action: 'deactivate' | 'reactivate', id: string) => void
  onToggleParcelCampaign: (campaignId: string, parcelId: string, included: boolean) => void
  onResetData: () => void
}

export function AdministrationPage({ initialView = 'winery', settings, campaigns, growers, vineyards, parcels, campaignParcels, lots, deliveries, bottlingOrders, recordCount, pwa, onSave, onCreateCampaign, onUpdateCampaign, onCampaignAction, onCreateGrower, onUpdateGrower, onGrowerAction, onCreateVineyard, onUpdateVineyard, onVineyardAction, onCreateParcel, onUpdateParcel, onParcelAction, onToggleParcelCampaign, onResetData }: AdministrationPageProps) {
  const { t, locale } = useLanguage()
  const navigate = useNavigate()
  const [view, setView] = useState<AdministrationView>(initialView)
  useEffect(() => setView(initialView), [initialView])
  const [draft, setDraft] = useState(settings)
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [checkingCatalyst, setCheckingCatalyst] = useState(false)
  const [catalystConnection, setCatalystConnection] = useState<CatalystConnectionResult>({
    state: catalystFoundation.readApiUrl ? 'not-checked' : 'not-configured',
  })
  const autoCheckStarted = useRef(false)
  useEffect(() => setDraft(settings), [settings])
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings])
  const initials = draft.wineryName.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase()
  const update = <K extends keyof WinerySettings>(key: K, value: WinerySettings[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.wineryName.trim() || !draft.legalName.trim() || !draft.wineryCode.trim() || !draft.municipality.trim()) return setError(t('admin.errorIdentity'))
    if (draft.campaignYear < 2020 || draft.targetHarvestKg <= 0 || !draft.campaignStart || !draft.campaignEnd || draft.campaignStart > draft.campaignEnd) return setError(t('admin.errorCampaign'))
    if (draft.cellarTemperatureTarget < 5 || draft.cellarTemperatureTarget > 25 || draft.cellarHumidityTarget < 40 || draft.cellarHumidityTarget > 95) return setError(t('admin.errorOperations'))
    setError(''); onSave({ ...draft, updatedAt: new Date().toISOString(), updatedBy: getCurrentOperatorName() })
  }
  const checkCatalyst = async () => {
    setCheckingCatalyst(true)
    setCatalystConnection(await checkCatalystReadService())
    setCheckingCatalyst(false)
  }
  const connectionCopy = {
    'not-configured': ['admin.bridgeAwaitingDeploy', 'pending'],
    'not-checked': ['admin.notChecked', 'pending'],
    ready: ['admin.available', 'success'],
    unavailable: ['admin.unavailable', 'warning'],
  } as const
  const activeConnectionCopy = connectionCopy[catalystConnection.state]
  const failureCopy = catalystConnection.failure ? {
    http: t('admin.connectionHttp', { status: catalystConnection.httpStatus ?? '—' }),
    'invalid-response': t('admin.connectionInvalid'),
    timeout: t('admin.connectionTimeout'),
    network: t('admin.connectionNetwork'),
  }[catalystConnection.failure] : ''
  const connectionDetail = failureCopy || (catalystConnection.checkedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(catalystConnection.checkedAt))
    : t('admin.endpointReady'))

  useEffect(() => {
    if (view !== 'system' || catalystConnection.state !== 'not-checked' || autoCheckStarted.current) return
    autoCheckStarted.current = true
    setCheckingCatalyst(true)
    void checkCatalystReadService().then((result) => {
      setCatalystConnection(result)
      setCheckingCatalyst(false)
    })
  }, [view, catalystConnection.state])

  const routeForView: Record<AdministrationView, string> = { winery: '/admin/winery', campaign: '/admin/campaigns', growers: '/admin/growers', vineyards: '/admin/vineyards', parcels: '/admin/parcels', operations: '/admin/operations', system: '/admin/system' }
  const switchView = (next: AdministrationView) => { setView(next); navigate(routeForView[next]) }
  const masterWorkspace = view === 'campaign' || view === 'growers' || view === 'vineyards' || view === 'parcels'
  const workspaceTitle = view === 'campaign' ? (locale.startsWith('es') ? 'Campañas' : 'Campaigns') : view === 'growers' ? (locale.startsWith('es') ? 'Viticultores' : 'Growers') : view === 'vineyards' ? (locale.startsWith('es') ? 'Viñedos' : 'Vineyards') : view === 'parcels' ? (locale.startsWith('es') ? 'Parcelas' : 'Parcels') : t('admin.title')
  const workspaceDescription = view === 'campaign' ? (locale.startsWith('es') ? 'Gestiona las vendimias, su ciclo de vida y la campaña operativa predeterminada.' : 'Manage vintages, their lifecycle and the default operational campaign.') : view === 'growers' ? (locale.startsWith('es') ? 'Mantén la identidad, contacto y estado de los viticultores sin duplicarlos entre campañas.' : 'Maintain grower identity, contact details and status without duplicating them between campaigns.') : view === 'vineyards' ? (locale.startsWith('es') ? 'Agrupa parcelas bajo explotaciones estables vinculadas a cada viticultor.' : 'Group parcels under permanent vineyard estates linked to each grower.') : view === 'parcels' ? (locale.startsWith('es') ? 'Gestiona la identidad agronómica permanente de cada parcela y su vínculo con viticultor y viñedo.' : 'Manage the permanent agronomic identity of each parcel and its grower/vineyard links.') : t('admin.description')

  return <main className={`admin-page ${masterWorkspace ? 'admin-page-master-data' : ''}`}>
    <header className="page-header"><div><span className="eyebrow">{t('admin.kicker')}</span><h1>{workspaceTitle}</h1><p>{workspaceDescription}</p></div>{!masterWorkspace && <div className="page-header-action"><button className="primary-button" form="admin-settings-form" disabled={!dirty}><Save size={16} /> {dirty ? t('admin.saveChanges') : t('admin.saved')}</button></div>}</header>

    {!masterWorkspace && <section className="admin-hero" style={{ backgroundImage: `url(${images.vineyard})` }}><div className="admin-hero-overlay" /><div className="admin-hero-copy"><span className="admin-season"><Building2 size={15} /> {t('admin.singleWinery')}</span><h2>{draft.wineryName}</h2><p>{draft.municipality} · {draft.province} · {draft.designation}</p><div className="admin-hero-badges"><span><ShieldCheck size={15} /> {t('admin.localCheckpoint')}</span><span><CloudOff size={15} /> {t('admin.backendDeferred')}</span></div></div><div className="winery-identity-card"><span className="winery-large-mark">{initials || 'VI'}</span><span><small>{t('admin.registry')}</small><strong>{draft.wineryCode}</strong><em>{t('admin.campaignLabel', { year: draft.campaignYear })}</em></span></div></section>}

    {!masterWorkspace && <section className="admin-status-grid"><AdminStatus icon={<HardDrive />} label={t('admin.storage')} value={t('admin.browserLocal')} detail={t('admin.localRecords', { count: recordCount })} tone="wine" /><AdminStatus icon={<Users />} label={t('admin.access')} value={getCurrentOperatorName()} detail={t('admin.authenticatedVia')} tone="gold" /><AdminStatus icon={<Database />} label={t('admin.dataService')} value={t('admin.schemaReady')} detail={t('admin.catalystTables', { count: catalystFoundation.tables.length })} tone="blue" /><AdminStatus icon={<CheckCircle2 />} label={t('admin.configuration')} value={dirty ? t('admin.unsaved') : t('admin.upToDate')} detail={t('admin.lastSavedBy', { name: settings.updatedBy })} tone={dirty ? 'warning' : 'success'} /></section>}

    <div className="admin-workspace"><aside className="admin-section-nav">{([
      ['winery', <Building2 />, t('admin.wineryProfile'), t('admin.wineryProfileText')],
      ['campaign', <CalendarDays />, t('admin.campaigns'), t('admin.campaignsText')],
      ['growers', <Users />, locale.startsWith('es') ? 'Viticultores' : 'Growers', locale.startsWith('es') ? 'Identidad y contacto' : 'Identity and contact'],
      ['vineyards', <Leaf />, locale.startsWith('es') ? 'Viñedos' : 'Vineyards', locale.startsWith('es') ? 'Explotaciones y fincas' : 'Estates and vineyards'],
      ['parcels', <MapPin />, locale.startsWith('es') ? 'Parcelas' : 'Parcels', locale.startsWith('es') ? 'Maestro agronómico' : 'Agronomic master'],
      ['operations', <SlidersHorizontal />, t('admin.operations'), t('admin.operationsText')],
      ['system', <Database />, t('admin.systemData'), t('admin.systemDataText')],
    ] as const).map(([key, icon, label, text]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => switchView(key)}><span>{icon}</span><span><strong>{label}</strong><small>{text}</small></span><ChevronRight /></button>)}</aside>

      <form id="admin-settings-form" className="admin-form-panel" onSubmit={submit}>
        {view === 'winery' && <AdminSection icon={<Building2 />} title={t('admin.wineryProfile')} text={t('admin.profileIntro')}>
          <div className="admin-form-grid"><AdminField label={t('admin.displayName')} wide><input value={draft.wineryName} onChange={(event) => update('wineryName', event.target.value)} /></AdminField><AdminField label={t('admin.legalName')} wide><input value={draft.legalName} onChange={(event) => update('legalName', event.target.value)} /></AdminField><AdminField label={t('admin.registryCode')}><input value={draft.wineryCode} onChange={(event) => update('wineryCode', event.target.value)} /></AdminField><AdminField label={t('admin.designation')}><input value={draft.designation} onChange={(event) => update('designation', event.target.value)} /></AdminField><AdminField label={t('admin.municipality')}><input value={draft.municipality} onChange={(event) => update('municipality', event.target.value)} /></AdminField><AdminField label={t('admin.province')}><input value={draft.province} onChange={(event) => update('province', event.target.value)} /></AdminField><AdminField label={t('admin.timezone')} wide><select value={draft.timezone} onChange={(event) => update('timezone', event.target.value)}><option value="Europe/Madrid">Europe/Madrid</option><option value="Europe/London">Europe/London</option><option value="Europe/Paris">Europe/Paris</option></select></AdminField><AdminField label={locale.startsWith('es') ? 'Latitud' : 'Latitude'}><input type="number" step="0.0001" min="-90" max="90" value={draft.latitude} onChange={(event) => update('latitude', Number(event.target.value))} /></AdminField><AdminField label={locale.startsWith('es') ? 'Longitud' : 'Longitude'}><input type="number" step="0.0001" min="-180" max="180" value={draft.longitude} onChange={(event) => update('longitude', Number(event.target.value))} /></AdminField></div>
          <div className="admin-context-note"><Info /><span><strong>{t('admin.identityNote')}</strong><small>{t('admin.identityNoteText')}</small></span></div>
        </AdminSection>}

        {view === 'campaign' && <CampaignManager campaigns={campaigns} lots={lots} deliveries={deliveries} bottlingOrders={bottlingOrders} locale={locale} onCreate={onCreateCampaign} onUpdate={onUpdateCampaign} onAction={onCampaignAction} />}
        {view === 'growers' && <GrowerManager growers={growers} parcels={parcels} locale={locale} onCreate={onCreateGrower} onUpdate={onUpdateGrower} onAction={onGrowerAction} />}
      {view === 'vineyards' && <VineyardManager vineyards={vineyards} growers={growers} parcels={parcels} locale={locale} onCreate={onCreateVineyard} onUpdate={onUpdateVineyard} onAction={onVineyardAction} />}
      {view === 'parcels' && <ParcelManager parcels={parcels} growers={growers} vineyards={vineyards} campaigns={campaigns} campaignParcels={campaignParcels} locale={locale} onCreate={onCreateParcel} onUpdate={onUpdateParcel} onAction={onParcelAction} onToggleCampaign={onToggleParcelCampaign} />}

        {view === 'operations' && <AdminSection icon={<SlidersHorizontal />} title={t('admin.operations')} text={t('admin.operationsIntro')}>
          <div className="admin-threshold-grid"><ThresholdField icon={<Thermometer />} label={t('admin.cellarTemperature')} value={draft.cellarTemperatureTarget} unit="°C" min={5} max={25} onChange={(value) => update('cellarTemperatureTarget', value)} /><ThresholdField icon={<Gauge />} label={t('admin.cellarHumidity')} value={draft.cellarHumidityTarget} unit="%" min={40} max={95} onChange={(value) => update('cellarHumidityTarget', value)} /><ThresholdField icon={<BellRing />} label={t('admin.taskReminder')} value={draft.taskReminderHours} unit="h" min={1} max={24} onChange={(value) => update('taskReminderHours', value)} /><ThresholdField icon={<Warehouse />} label={t('admin.lowStock')} value={draft.lowStockThreshold} unit="%" min={1} max={50} onChange={(value) => update('lowStockThreshold', value)} /><ThresholdField icon={<FlaskConical />} label={t('admin.labReview')} value={draft.labReviewHours} unit="h" min={1} max={48} onChange={(value) => update('labReviewHours', value)} /></div>
          <label className="admin-toggle"><span className="admin-toggle-icon"><ShieldCheck /></span><span><strong>{t('admin.officialDisclaimer')}</strong><small>{t('admin.officialDisclaimerText')}</small></span><input type="checkbox" checked={draft.showOfficialDisclaimer} onChange={(event) => update('showOfficialDisclaimer', event.target.checked)} /><i><Check /></i></label>
        </AdminSection>}

        {view === 'system' && <AdminSection icon={<Database />} title={t('admin.systemData')} text={t('admin.systemIntro')}>
          <div className="integration-cards"><IntegrationCard icon={<HardDrive />} title={t('admin.browserRepository')} status={t('admin.active')} detail={t('admin.browserRepositoryText')} tone="success" /><IntegrationCard icon={<Smartphone />} title={t('pwa.app')} status={pwa.installed ? t('pwa.installed') : pwa.serviceWorkerReady ? t('pwa.ready') : t('common.pending')} detail={t('pwa.integrationText')} tone={pwa.installed || pwa.serviceWorkerReady ? 'success' : 'pending'} /><IntegrationCard icon={<Database />} title={t('admin.catalystDataStore')} status={t('admin.schemaReady')} detail={t('admin.catalystDataStoreText')} tone="success" /><IntegrationCard icon={<LockKeyhole />} title={t('admin.authentication')} status={t('admin.deferred')} detail={t('admin.authenticationText')} tone="pending" /><IntegrationCard icon={<RefreshCw />} title={t('admin.externalSystems')} status={t('admin.notConfigured')} detail={t('admin.externalSystemsText')} tone="neutral" /></div>
          <section className={`pwa-foundation-card ${pwa.online ? 'online' : 'offline'}`}>
            <header><span><Smartphone /><span><small>{t('pwa.kicker')}</small><strong>{t('pwa.title')}</strong></span></span><em>{pwa.installed ? t('pwa.installed') : t('pwa.ready')}</em></header>
            <div className="pwa-capability-grid">
              <article><span><Download /></span><span><small>{t('pwa.appShell')}</small><strong>{pwa.serviceWorkerReady ? t('pwa.cached') : t('pwa.preparing')}</strong></span></article>
              <article><span>{pwa.online ? <Wifi /> : <WifiOff />}</span><span><small>{t('pwa.connectivity')}</small><strong>{pwa.online ? t('pwa.online') : t('pwa.offline')}</strong></span></article>
              <article><span><HardDrive /></span><span><small>{t('pwa.offlineWrites')}</small><strong>{t('pwa.thisDevice')}</strong></span></article>
            </div>
            <footer><span><ShieldCheck /><span><strong>{t('pwa.localAuthority')}</strong><small>{t('pwa.localAuthorityText')}</small></span></span><div>{pwa.updateAvailable && <button type="button" className="secondary-button" onClick={pwa.activateUpdate}><RefreshCw /> {t('pwa.update')}</button>}{pwa.installAvailable && <button type="button" className="primary-button" onClick={() => void pwa.install()}><Download /> {t('pwa.install')}</button>}</div></footer>
            {!pwa.installed && !pwa.installAvailable && <div className="pwa-install-help"><Info /><span><strong>{t('pwa.installHelp')}</strong><small>{t('pwa.installHelpText')}</small></span></div>}
          </section>
          <section className="catalyst-foundation-card">
            <header><span><Database /><span><small>{t('admin.catalystFoundation')}</small><strong>{t('admin.developmentSchema')}</strong></span></span><em>{t('admin.schemaVersion', { version: catalystFoundation.schemaVersion })}</em></header>
            <div className="catalyst-foundation-steps">
              <FoundationStep icon={<Database />} status="ready" title={t('admin.dataStoreSchema')} detail={t('admin.tablesProvisioned', { count: catalystFoundation.tables.length })} />
              <FoundationStep icon={<Server />} status={catalystConnection.state === 'ready' ? 'ready' : 'pending'} title={t('admin.readBridge')} detail={t(activeConnectionCopy[0])} />
              <FoundationStep icon={<LockKeyhole />} status="locked" title={t('admin.remoteOperations')} detail={t('admin.remoteOperationsLocked')} />
            </div>
            <div className="catalyst-table-cloud">{catalystFoundation.tables.map((table) => <span key={table.id}><CheckCircle2 /> {table.name.replace('Anada_', '')}</span>)}</div>
            <footer><span><ShieldCheck /><span><strong>{t('admin.browserAuthority')}</strong><small>{t('admin.browserAuthorityText')}</small></span></span><button type="button" className="secondary-button" disabled={!catalystFoundation.readApiUrl || checkingCatalyst} onClick={checkCatalyst}><RefreshCw className={checkingCatalyst ? 'spin' : ''} /> {checkingCatalyst ? t('admin.checking') : t('admin.checkConnection')}</button></footer>
            <div className={`catalyst-connection-note ${activeConnectionCopy[1]}`}><span>{t(activeConnectionCopy[0])}</span><small>{connectionDetail}</small></div>
          </section>
          <div className="admin-team-card"><header><span><Users /><strong>{t('admin.demoTeam')}</strong></span><em>{t('admin.notUserManagement')}</em></header><div>{[['EM', 'Elena Martín', t('admin.roleWinemaker')], ['MS', 'Martín Sáenz', t('admin.roleCellar')], ['LS', 'Lucía Sáenz', t('admin.roleLaboratory')]].map(([initial, name, role]) => <article key={name}><span>{initial}</span><span><strong>{name}</strong><small>{role}</small></span><LockKeyhole /></article>)}</div></div>
          <div className="danger-zone"><span><Trash2 /><span><strong>{t('admin.demoData')}</strong><small>{t('admin.demoDataText')}</small></span></span><button type="button" className="danger-button" onClick={() => setResetOpen(true)}>{t('common.reset')}</button></div>
        </AdminSection>}
        {error && <div className="form-error admin-form-error">{error}</div>}
        {view !== 'system' && view !== 'campaign' && view !== 'growers' && <footer className="admin-form-actions"><span>{dirty ? t('admin.unsavedChanges') : t('admin.noPendingChanges')}</span><button className="primary-button" disabled={!dirty}><Save size={16} /> {t('admin.saveChanges')}</button></footer>}
      </form>
    </div>

    {resetOpen && <div className="sheet-layer" role="dialog" aria-modal="true"><button className="sheet-scrim" onClick={() => setResetOpen(false)} aria-label={t('common.close')} /><section className="reset-confirm"><span className="reset-confirm-icon"><Trash2 /></span><h2>{t('admin.resetTitle')}</h2><p>{t('admin.resetText')}</p><div><button className="secondary-button" onClick={() => setResetOpen(false)}>{t('common.cancel')}</button><button className="danger-button" onClick={() => { onResetData(); setResetOpen(false) }}>{t('admin.resetConfirm')}</button></div></section></div>}
  </main>
}

function GrowerManager({ growers, parcels, locale, onCreate, onUpdate, onAction }: {
  growers: Grower[]
  parcels: VineyardParcel[]
  locale: string
  onCreate: (input: NewGrowerInput) => void
  onUpdate: (id: string, input: GrowerUpdateInput) => void
  onAction: (action: 'deactivate' | 'reactivate', id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [editing, setEditing] = useState<Grower | 'new' | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const es = locale.startsWith('es')
  const copy = es ? {
    title: 'Viticultores', intro: 'Maestro permanente de productores y proveedores de uva. No se duplica entre campañas.', add: 'Nuevo viticultor', search: 'Buscar por nombre, código o NIF/CIF', all: 'Todos', active: 'Activos', inactive: 'Inactivos', grower: 'Viticultor', contact: 'Contacto', location: 'Ubicación', parcels: 'Parcelas', status: 'Estado', actions: 'Acciones', noResults: 'No hay viticultores que coincidan.', edit: 'Editar', deactivate: 'Desactivar', reactivate: 'Reactivar', createTitle: 'Crear viticultor', editTitle: 'Editar viticultor', code: 'Código', legalName: 'Razón social / nombre legal', tradeName: 'Nombre comercial', type: 'Tipo', taxId: 'NIF / CIF', contactName: 'Persona de contacto', phone: 'Teléfono', email: 'Correo electrónico', address: 'Dirección', municipality: 'Municipio', province: 'Provincia', country: 'País', notes: 'Notas', save: 'Guardar viticultor', cancel: 'Cancelar', individual: 'Particular', company: 'Empresa', cooperative: 'Cooperativa', unknown: 'Sin clasificar', blocked: 'Bloqueado'
  } : {
    title: 'Growers', intro: 'Permanent master for grape growers and suppliers. Records are shared across campaigns.', add: 'New grower', search: 'Search by name, code or tax ID', all: 'All', active: 'Active', inactive: 'Inactive', grower: 'Grower', contact: 'Contact', location: 'Location', parcels: 'Parcels', status: 'Status', actions: 'Actions', noResults: 'No matching growers.', edit: 'Edit', deactivate: 'Deactivate', reactivate: 'Reactivate', createTitle: 'Create grower', editTitle: 'Edit grower', code: 'Code', legalName: 'Legal name', tradeName: 'Trade name', type: 'Type', taxId: 'Tax ID', contactName: 'Primary contact', phone: 'Phone', email: 'Email', address: 'Address', municipality: 'Municipality', province: 'Province', country: 'Country', notes: 'Notes', save: 'Save grower', cancel: 'Cancel', individual: 'Individual', company: 'Company', cooperative: 'Cooperative', unknown: 'Unclassified', blocked: 'Blocked'
  }
  const normalizedQuery = query.trim().toLowerCase()
  const filtered = growers.filter((grower) => {
    const matchesQuery = !normalizedQuery || `${grower.code} ${grower.name} ${grower.legalName} ${grower.tradeName ?? ''} ${grower.taxId ?? ''} ${grower.contactName ?? ''}`.toLowerCase().includes(normalizedQuery)
    const matchesStatus = status === 'all' || (status === 'active' ? grower.status === 'active' : grower.status !== 'active')
    return matchesQuery && matchesStatus
  })
  const parcelCount = (growerId: string) => parcels.filter((parcel) => parcel.growerId === growerId).length
  const activeCount = growers.filter((grower) => grower.status === 'active').length
  const inactiveCount = growers.length - activeCount
  return <AdminSection icon={<Users />} title={copy.title} text={copy.intro}>
    <div className="grower-manager-summary"><span><strong>{growers.length}</strong><small>{copy.title}</small></span><span><strong>{activeCount}</strong><small>{copy.active}</small></span><span><strong>{inactiveCount}</strong><small>{copy.inactive}</small></span><button type="button" className="primary-button" onClick={() => setEditing('new')}><Plus /> {copy.add}</button></div>
    <div className="grower-manager-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label><div className="grower-filter-chips">{(['all', 'active', 'inactive'] as const).map((value) => <button type="button" key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{copy[value]}</button>)}</div></div>
    <div className="grower-table-wrap"><table className="grower-table"><thead><tr><th>{copy.grower}</th><th>{copy.contact}</th><th>{copy.location}</th><th>{copy.parcels}</th><th>{copy.status}</th><th>{copy.actions}</th></tr></thead><tbody>{filtered.map((grower) => <tr key={grower.id}><td><span className="grower-name-cell"><strong>{grower.tradeName || grower.legalName}</strong><small>{grower.code}{grower.taxId ? ` · ${grower.taxId}` : ''}</small><em>{copy[grower.growerType]}</em></span></td><td><span className="grower-contact-cell"><strong>{grower.contactName || '—'}</strong><small>{grower.email || grower.phone || '—'}</small></span></td><td><span className="grower-contact-cell"><strong>{grower.municipality || '—'}</strong><small>{[grower.province, grower.country].filter(Boolean).join(' · ')}</small></span></td><td><span className="grower-parcel-count">{parcelCount(grower.id)}</span></td><td><span className={`grower-status ${grower.status}`}>{grower.status === 'active' ? copy.active : grower.status === 'blocked' ? copy.blocked : copy.inactive}</span></td><td><div className="campaign-row-actions"><button type="button" className="icon-button" onClick={() => setEditing(grower)} aria-label={copy.edit}><Edit3 /></button><button type="button" className="icon-button" onClick={() => setMenuId(menuId === grower.id ? null : grower.id)} aria-label={copy.actions}><MoreHorizontal /></button>{menuId === grower.id && <div className="campaign-action-menu">{grower.status === 'active' ? <button type="button" onClick={() => { onAction('deactivate', grower.id); setMenuId(null) }}><Archive /> {copy.deactivate}</button> : <button type="button" onClick={() => { onAction('reactivate', grower.id); setMenuId(null) }}><RotateCcw /> {copy.reactivate}</button>}</div>}</div></td></tr>)}</tbody></table>{!filtered.length && <div className="campaign-empty">{copy.noResults}</div>}</div>
    {editing && <GrowerEditor grower={editing === 'new' ? undefined : editing} locale={locale} copy={copy} existingCodes={growers.map((grower) => grower.code)} onCancel={() => setEditing(null)} onSave={(input) => { if (editing === 'new') onCreate(input); else onUpdate(editing.id, input); setEditing(null) }} />}
  </AdminSection>
}

function GrowerEditor({ grower, locale, copy, existingCodes, onCancel, onSave }: { grower?: Grower; locale: string; copy: Record<string, string>; existingCodes: string[]; onCancel: () => void; onSave: (input: NewGrowerInput & GrowerUpdateInput) => void }) {
  const nextCode = (() => { for (let i = 1; i < 10000; i += 1) { const candidate = `VIT-${String(i).padStart(3, '0')}`; if (!existingCodes.includes(candidate)) return candidate } return `VIT-${Date.now()}` })()
  const [draft, setDraft] = useState({
    code: grower?.code ?? nextCode,
    legalName: grower?.legalName ?? '',
    tradeName: grower?.tradeName ?? '',
    growerType: grower?.growerType ?? 'unknown' as Grower['growerType'],
    taxId: grower?.taxId ?? '',
    contactName: grower?.contactName ?? '',
    phone: grower?.phone ?? '',
    email: grower?.email ?? '',
    address: grower?.address ?? '',
    municipality: grower?.municipality ?? '',
    province: grower?.province ?? '',
    country: grower?.country ?? (locale.startsWith('es') ? 'España' : 'Spain'),
    notes: grower?.notes ?? '',
  })
  const valid = draft.code.trim().length >= 2 && draft.legalName.trim().length >= 2
  const set = (key: keyof typeof draft, value: string) => setDraft((current) => ({ ...current, [key]: value }))
  return <div className="sheet-layer campaign-editor-layer" role="dialog" aria-modal="true"><button type="button" className="sheet-scrim" onClick={onCancel} aria-label={copy.cancel} /><section className="campaign-editor grower-editor"><header><span><Users /></span><div><small>{grower ? copy.editTitle : copy.createTitle}</small><h2>{grower?.tradeName || grower?.legalName || copy.createTitle}</h2></div><button type="button" className="icon-button" onClick={onCancel}><X /></button></header><div className="campaign-editor-body"><div className="campaign-editor-grid"><label><span>{copy.code}</span><input value={draft.code} onChange={(event) => set('code', event.target.value.toUpperCase())} /></label><label><span>{copy.type}</span><select value={draft.growerType} onChange={(event) => setDraft((current) => ({ ...current, growerType: event.target.value as Grower['growerType'] }))}><option value="unknown">{copy.unknown}</option><option value="individual">{copy.individual}</option><option value="company">{copy.company}</option><option value="cooperative">{copy.cooperative}</option></select></label><label className="wide"><span>{copy.legalName}</span><input value={draft.legalName} onChange={(event) => set('legalName', event.target.value)} /></label><label className="wide"><span>{copy.tradeName}</span><input value={draft.tradeName} onChange={(event) => set('tradeName', event.target.value)} /></label><label><span>{copy.taxId}</span><input value={draft.taxId} onChange={(event) => set('taxId', event.target.value.toUpperCase())} /></label><label><span>{copy.contactName}</span><input value={draft.contactName} onChange={(event) => set('contactName', event.target.value)} /></label><label><span>{copy.phone}</span><input value={draft.phone} onChange={(event) => set('phone', event.target.value)} /></label><label><span>{copy.email}</span><input type="email" value={draft.email} onChange={(event) => set('email', event.target.value)} /></label><label className="wide"><span>{copy.address}</span><input value={draft.address} onChange={(event) => set('address', event.target.value)} /></label><label><span>{copy.municipality}</span><input value={draft.municipality} onChange={(event) => set('municipality', event.target.value)} /></label><label><span>{copy.province}</span><input value={draft.province} onChange={(event) => set('province', event.target.value)} /></label><label><span>{copy.country}</span><input value={draft.country} onChange={(event) => set('country', event.target.value)} /></label><label className="wide"><span>{copy.notes}</span><textarea value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></label></div></div><footer><button type="button" className="secondary-button" onClick={onCancel}>{copy.cancel}</button><button type="button" className="primary-button" disabled={!valid} onClick={() => onSave({ ...draft, operator: getCurrentOperatorName() })}><Save /> {copy.save}</button></footer></section></div>
}

function CampaignManager({ campaigns, lots, deliveries, bottlingOrders, locale, onCreate, onUpdate, onAction }: {
  campaigns: Campaign[]
  lots: WineLot[]
  deliveries: GrapeDelivery[]
  bottlingOrders: BottlingOrder[]
  locale: string
  onCreate: (input: NewCampaignInput) => void
  onUpdate: (id: string, input: CampaignUpdateInput) => void
  onAction: (action: 'activate' | 'close' | 'reopen' | 'archive' | 'default', id: string) => void
}) {
  const es = locale.startsWith('es')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Campaign | 'new' | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const filtered = campaigns.filter((campaign) => `${campaign.code} ${campaign.name} ${campaign.vintage}`.toLowerCase().includes(query.toLowerCase()))
  const active = campaigns.find((campaign) => campaign.status === 'active')
  const copy = es ? {
    title: 'Campañas', intro: 'Gestiona el ciclo operativo de cada vendimia sin duplicar parcelas ni maestros.', add: 'Nueva campaña', search: 'Buscar campañas', campaign: 'Campaña', dates: 'Fechas', activity: 'Actividad', status: 'Estado', actions: 'Acciones', default: 'Predeterminada', lots: 'lotes', deliveries: 'recepciones', bottlings: 'embotellados', noResults: 'No hay campañas que coincidan.', active: 'Activa', planned: 'Planificada', closed: 'Cerrada', archived: 'Archivada', activate: 'Activar', close: 'Cerrar', reopen: 'Reabrir', archive: 'Archivar', makeDefault: 'Hacer predeterminada', edit: 'Editar', createTitle: 'Crear campaña', editTitle: 'Editar campaña', code: 'Código', name: 'Nombre', vintage: 'Añada', start: 'Inicio', harvest: 'Inicio previsto de vendimia', end: 'Fin previsto', notes: 'Notas', makeActive: 'Activar al crear', save: 'Guardar campaña', cancel: 'Cancelar', activeSummary: 'Campaña operativa', noActive: 'No hay campaña activa', blocked: 'El cierre puede bloquearse si quedan lotes, recepciones o embotellados pendientes.'
  } : {
    title: 'Campaigns', intro: 'Manage each vintage lifecycle without duplicating parcels or master data.', add: 'New campaign', search: 'Search campaigns', campaign: 'Campaign', dates: 'Dates', activity: 'Activity', status: 'Status', actions: 'Actions', default: 'Default', lots: 'lots', deliveries: 'receptions', bottlings: 'bottlings', noResults: 'No matching campaigns.', active: 'Active', planned: 'Planned', closed: 'Closed', archived: 'Archived', activate: 'Activate', close: 'Close', reopen: 'Reopen', archive: 'Archive', makeDefault: 'Make default', edit: 'Edit', createTitle: 'Create campaign', editTitle: 'Edit campaign', code: 'Code', name: 'Name', vintage: 'Vintage', start: 'Start', harvest: 'Expected harvest start', end: 'Expected end', notes: 'Notes', makeActive: 'Activate after creation', save: 'Save campaign', cancel: 'Cancel', activeSummary: 'Operational campaign', noActive: 'No active campaign', blocked: 'Closure may be blocked while lots, receptions or bottlings remain unresolved.'
  }
  const stats = (id: string) => ({
    lots: lots.filter((lot) => lot.campaignId === id).length,
    deliveries: deliveries.filter((delivery) => delivery.campaignId === id).length,
    bottlings: bottlingOrders.filter((order) => (order as { campaignId?: string }).campaignId === id).length,
  })
  return <AdminSection icon={<CalendarDays />} title={copy.title} text={copy.intro}>
    <div className="campaign-manager-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label><button type="button" className="primary-button" onClick={() => setEditing('new')}><Plus /> {copy.add}</button></div>
    <div className="campaign-active-summary"><span><CalendarDays /></span><span><small>{copy.activeSummary}</small><strong>{active ? `${active.name} · ${active.vintage}` : copy.noActive}</strong><em>{active ? `${formatAdminDate(active.startsAt, locale)} — ${formatAdminDate(active.expectedEndAt, locale)}` : copy.blocked}</em></span>{active?.isDefault && <i><Star /> {copy.default}</i>}</div>
    <div className="campaign-table-wrap"><table className="campaign-table"><thead><tr><th>{copy.campaign}</th><th>{copy.dates}</th><th>{copy.activity}</th><th>{copy.status}</th><th>{copy.actions}</th></tr></thead><tbody>{filtered.map((campaign) => { const count = stats(campaign.id); return <tr key={campaign.id}><td><span className="campaign-name-cell"><strong>{campaign.name}</strong><small>{campaign.code} · {campaign.vintage}</small>{campaign.isDefault && <em><Star /> {copy.default}</em>}</span></td><td><span className="campaign-date-cell"><strong>{formatAdminDate(campaign.startsAt, locale)}</strong><small>{formatAdminDate(campaign.expectedHarvestStart, locale)}</small></span></td><td><span className="campaign-counts"><i>{count.lots} {copy.lots}</i><i>{count.deliveries} {copy.deliveries}</i><i>{count.bottlings} {copy.bottlings}</i></span></td><td><span className={`campaign-status ${campaign.status}`}>{copy[campaign.status]}</span></td><td><div className="campaign-row-actions"><button type="button" className="icon-button" onClick={() => setEditing(campaign)} aria-label={copy.edit}><Edit3 /></button><button type="button" className="icon-button" onClick={() => setMenuId(menuId === campaign.id ? null : campaign.id)} aria-label={copy.actions}><MoreHorizontal /></button>{menuId === campaign.id && <div className="campaign-action-menu">{campaign.status !== 'active' && campaign.status !== 'archived' && <button type="button" onClick={() => { onAction('activate', campaign.id); setMenuId(null) }}><CheckCircle2 /> {copy.activate}</button>}{campaign.status === 'active' && <button type="button" onClick={() => { onAction('close', campaign.id); setMenuId(null) }}><LockKeyhole /> {copy.close}</button>}{campaign.status === 'closed' && <button type="button" onClick={() => { onAction('reopen', campaign.id); setMenuId(null) }}><RotateCcw /> {copy.reopen}</button>}{campaign.status === 'closed' && <button type="button" onClick={() => { onAction('archive', campaign.id); setMenuId(null) }}><Archive /> {copy.archive}</button>}{!campaign.isDefault && campaign.status !== 'archived' && <button type="button" onClick={() => { onAction('default', campaign.id); setMenuId(null) }}><Star /> {copy.makeDefault}</button>}</div>}</div></td></tr>})}</tbody></table>{!filtered.length && <div className="campaign-empty">{copy.noResults}</div>}</div>
    <div className="admin-context-note"><Info /><span><strong>{copy.blocked}</strong><small>{es ? 'Las reglas de cierre se evalúan contra registros operativos reales.' : 'Closure rules are evaluated against real operational records.'}</small></span></div>
    {editing && <CampaignEditor campaign={editing === 'new' ? undefined : editing} locale={locale} copy={copy} onCancel={() => setEditing(null)} onSave={(input, makeActive) => { if (editing === 'new') onCreate({ ...input, makeDefault: makeActive, operator: getCurrentOperatorName() }); else onUpdate(editing.id, input); setEditing(null) }} />}
  </AdminSection>
}

function CampaignEditor({ campaign, locale, copy, onCancel, onSave }: { campaign?: Campaign; locale: string; copy: Record<string, string>; onCancel: () => void; onSave: (input: CampaignUpdateInput & NewCampaignInput, makeActive: boolean) => void }) {
  const year = new Date().getFullYear()
  const [draft, setDraft] = useState({ code: campaign?.code ?? String(year + 1), name: campaign?.name ?? `${locale.startsWith('es') ? 'Vendimia' : 'Harvest'} ${year + 1}`, vintage: campaign?.vintage ?? year + 1, startsAt: campaign?.startsAt ?? `${year + 1}-08-01`, expectedHarvestStart: campaign?.expectedHarvestStart ?? `${year + 1}-09-01`, expectedEndAt: campaign?.expectedEndAt ?? `${year + 1}-12-31`, notes: campaign?.notes ?? '' })
  const [makeActive, setMakeActive] = useState(false)
  const valid = Boolean(draft.code.trim() && draft.name.trim() && draft.startsAt && draft.vintage >= 1900)
  return <div className="sheet-layer campaign-editor-layer" role="dialog" aria-modal="true"><button type="button" className="sheet-scrim" onClick={onCancel} aria-label={copy.cancel} /><section className="campaign-editor"><header><span><CalendarDays /></span><div><small>{campaign ? copy.editTitle : copy.createTitle}</small><h2>{campaign?.name ?? copy.createTitle}</h2></div><button type="button" className="icon-button" onClick={onCancel}><X /></button></header><div className="campaign-editor-body"><div className="campaign-editor-grid"><label><span>{copy.code}</span><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></label><label><span>{copy.vintage}</span><input type="number" min="1900" max="2200" value={draft.vintage} onChange={(event) => setDraft({ ...draft, vintage: Number(event.target.value) })} /></label><label className="wide"><span>{copy.name}</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label><span>{copy.start}</span><input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></label><label><span>{copy.harvest}</span><input type="date" value={draft.expectedHarvestStart} onChange={(event) => setDraft({ ...draft, expectedHarvestStart: event.target.value })} /></label><label><span>{copy.end}</span><input type="date" value={draft.expectedEndAt} onChange={(event) => setDraft({ ...draft, expectedEndAt: event.target.value })} /></label><label className="wide"><span>{copy.notes}</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label></div>{!campaign && <label className="campaign-activate-toggle"><input type="checkbox" checked={makeActive} onChange={(event) => setMakeActive(event.target.checked)} /><span><CheckCircle2 /><span><strong>{copy.makeActive}</strong><small>{copy.blocked}</small></span></span></label>}</div><footer><button type="button" className="secondary-button" onClick={onCancel}>{copy.cancel}</button><button type="button" className="primary-button" disabled={!valid} onClick={() => onSave({ ...draft, operator: getCurrentOperatorName() }, makeActive)}><Save /> {copy.save}</button></footer></section></div>
}


function VineyardManager({ vineyards, growers, parcels, locale, onCreate, onUpdate, onAction }: { vineyards: VineyardEstate[]; growers: Grower[]; parcels: VineyardParcel[]; locale: string; onCreate: (input: NewVineyardInput) => void; onUpdate: (id: string, input: VineyardUpdateInput) => void; onAction: (action: 'deactivate' | 'reactivate', id: string) => void }) {
  const es = locale.startsWith('es'); const [query, setQuery] = useState(''); const [editing, setEditing] = useState<VineyardEstate | 'new' | null>(null)
  const rows = vineyards.filter((v) => `${v.code} ${v.name} ${v.municipality}`.toLowerCase().includes(query.toLowerCase()))
  const growerName = (id: string) => growers.find((g) => g.id === id)?.name ?? '—'
  return <AdminSection icon={<Leaf />} title={es ? 'Viñedos' : 'Vineyards'} text={es ? 'Explotaciones permanentes vinculadas a un viticultor.' : 'Permanent vineyard estates linked to a grower.'}>
    <div className="campaign-manager-toolbar"><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={es ? 'Buscar viñedo' : 'Search vineyards'} /></label><button type="button" className="primary-button" onClick={() => setEditing('new')}><Plus /> {es ? 'Nuevo viñedo' : 'New vineyard'}</button></div>
    <div className="campaign-table-wrap"><table className="campaign-table"><thead><tr><th>{es ? 'Viñedo' : 'Vineyard'}</th><th>{es ? 'Viticultor' : 'Grower'}</th><th>{es ? 'Ubicación' : 'Location'}</th><th>{es ? 'Parcelas' : 'Parcels'}</th><th>{es ? 'Estado' : 'Status'}</th><th /></tr></thead><tbody>{rows.map((v) => <tr key={v.id}><td><span className="campaign-name-cell"><strong>{v.name}</strong><small>{v.code}</small></span></td><td>{growerName(v.growerId)}</td><td>{v.municipality}{v.province ? ` · ${v.province}` : ''}</td><td>{parcels.filter((p) => p.estateId === v.id && p.status !== 'inactive').length}</td><td><span className={`campaign-status ${v.status === 'active' ? 'active' : 'archived'}`}>{v.status === 'active' ? (es ? 'Activo' : 'Active') : (es ? 'Inactivo' : 'Inactive')}</span></td><td><div className="campaign-row-actions"><button className="icon-button" onClick={() => setEditing(v)}><Edit3 /></button><button className="secondary-button" onClick={() => onAction(v.status === 'active' ? 'deactivate' : 'reactivate', v.id)}>{v.status === 'active' ? (es ? 'Desactivar' : 'Deactivate') : (es ? 'Reactivar' : 'Reactivate')}</button></div></td></tr>)}</tbody></table>{!rows.length && <div className="campaign-empty">{es ? 'No hay viñedos.' : 'No vineyards.'}</div>}</div>
    {editing && <VineyardEditor vineyard={editing === 'new' ? undefined : editing} growers={growers.filter((g) => g.status === 'active')} es={es} onCancel={() => setEditing(null)} onSave={(input) => { if (editing === 'new') onCreate(input); else onUpdate(editing.id, input); setEditing(null) }} />}
  </AdminSection>
}

function VineyardEditor({ vineyard, growers, es, onCancel, onSave }: { vineyard?: VineyardEstate; growers: Grower[]; es: boolean; onCancel: () => void; onSave: (input: NewVineyardInput) => void }) {
  const [draft, setDraft] = useState({ code: vineyard?.code ?? '', name: vineyard?.name ?? '', growerId: vineyard?.growerId ?? growers[0]?.id ?? '', municipality: vineyard?.municipality ?? '', province: vineyard?.province ?? '', country: vineyard?.country ?? 'España', notes: vineyard?.notes ?? '' })
  const valid = Boolean(draft.code.trim() && draft.name.trim() && draft.growerId && draft.municipality.trim())
  return <div className="sheet-layer campaign-editor-layer" role="dialog" aria-modal="true"><button className="sheet-scrim" onClick={onCancel} /><section className="campaign-editor"><header><span><Leaf /></span><div><small>{vineyard ? (es ? 'Editar viñedo' : 'Edit vineyard') : (es ? 'Nuevo viñedo' : 'New vineyard')}</small><h2>{draft.name || (es ? 'Viñedo' : 'Vineyard')}</h2></div><button className="icon-button" onClick={onCancel}><X /></button></header><div className="campaign-editor-body"><div className="campaign-editor-grid"><label><span>{es ? 'Código' : 'Code'}</span><input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></label><label><span>{es ? 'Viticultor' : 'Grower'}</span><select value={draft.growerId} onChange={(e) => setDraft({ ...draft, growerId: e.target.value })}>{growers.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label className="wide"><span>{es ? 'Nombre' : 'Name'}</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label><span>{es ? 'Municipio' : 'Municipality'}</span><input value={draft.municipality} onChange={(e) => setDraft({ ...draft, municipality: e.target.value })} /></label><label><span>{es ? 'Provincia' : 'Province'}</span><input value={draft.province} onChange={(e) => setDraft({ ...draft, province: e.target.value })} /></label><label><span>{es ? 'País' : 'Country'}</span><input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label><label className="wide"><span>{es ? 'Notas' : 'Notes'}</span><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label></div></div><footer><button className="secondary-button" onClick={onCancel}>{es ? 'Cancelar' : 'Cancel'}</button><button className="primary-button" disabled={!valid} onClick={() => onSave({ ...draft, operator: getCurrentOperatorName() })}><Save /> {es ? 'Guardar' : 'Save'}</button></footer></section></div>
}

function ParcelManager({ parcels, growers, vineyards, campaigns, campaignParcels, locale, onCreate, onUpdate, onAction, onToggleCampaign }: { parcels: VineyardParcel[]; growers: Grower[]; vineyards: VineyardEstate[]; campaigns: Campaign[]; campaignParcels: CampaignParcelPlan[]; locale: string; onCreate: (input: NewParcelInput) => void; onUpdate: (id: string, input: ParcelUpdateInput) => void; onAction: (action: 'deactivate' | 'reactivate', id: string) => void; onToggleCampaign: (campaignId: string, parcelId: string, included: boolean) => void }) {
  const es = locale.startsWith('es'); const [query, setQuery] = useState(''); const [editing, setEditing] = useState<VineyardParcel | 'new' | null>(null); const activeCampaign = campaigns.find((c) => c.status === 'active')
  const rows = parcels.filter((p) => `${p.code ?? p.id} ${p.name} ${p.grower} ${p.varieties}`.toLowerCase().includes(query.toLowerCase()))
  const estateName = (id?: string) => vineyards.find((v) => v.id === id)?.name ?? '—'
  return <AdminSection icon={<MapPin />} title={es ? 'Parcelas' : 'Parcels'} text={es ? 'Maestro permanente; la planificación de cada vendimia se guarda por campaña.' : 'Permanent master data; harvest planning is stored separately per campaign.'}>
    <div className="campaign-manager-toolbar"><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={es ? 'Buscar parcela' : 'Search parcels'} /></label><button type="button" className="primary-button" onClick={() => setEditing('new')}><Plus /> {es ? 'Nueva parcela' : 'New parcel'}</button></div>
    <div className="campaign-table-wrap"><table className="campaign-table"><thead><tr><th>{es ? 'Parcela' : 'Parcel'}</th><th>{es ? 'Viticultor / viñedo' : 'Grower / vineyard'}</th><th>{es ? 'Variedad' : 'Variety'}</th><th>{es ? 'Superficie' : 'Area'}</th><th>{es ? 'Campaña activa' : 'Active campaign'}</th><th>{es ? 'Estado' : 'Status'}</th><th /></tr></thead><tbody>{rows.map((p) => { const plan = activeCampaign && campaignParcels.find((cp) => cp.campaignId === activeCampaign.id && cp.parcelId === p.id && cp.status !== 'cancelled'); return <tr key={p.id}><td><span className="campaign-name-cell"><strong>{p.name}</strong><small>{p.code ?? p.id}</small></span></td><td><span className="campaign-date-cell"><strong>{p.grower}</strong><small>{estateName(p.estateId)}</small></span></td><td>{p.varieties}</td><td>{p.hectares.toLocaleString(locale)} ha</td><td>{activeCampaign ? <button type="button" className={plan ? 'campaign-status active' : 'secondary-button'} onClick={() => onToggleCampaign(activeCampaign.id, p.id, !plan)}>{plan ? (es ? 'Incluida · Quitar' : 'Included · Remove') : (es ? 'Añadir' : 'Add')}</button> : <span>—</span>}</td><td><span className={`campaign-status ${p.status === 'inactive' ? 'archived' : 'active'}`}>{p.status === 'inactive' ? (es ? 'Inactiva' : 'Inactive') : (es ? 'Activa' : 'Active')}</span></td><td><div className="campaign-row-actions"><button className="icon-button" onClick={() => setEditing(p)}><Edit3 /></button><button className="secondary-button" onClick={() => onAction(p.status === 'inactive' ? 'reactivate' : 'deactivate', p.id)}>{p.status === 'inactive' ? (es ? 'Reactivar' : 'Reactivate') : (es ? 'Desactivar' : 'Deactivate')}</button></div></td></tr>})}</tbody></table></div>
    {editing && <ParcelEditor parcel={editing === 'new' ? undefined : editing} growers={growers.filter((g) => g.status === 'active')} vineyards={vineyards.filter((v) => v.status === 'active')} activeCampaign={activeCampaign} es={es} onCancel={() => setEditing(null)} onSave={(input) => { if (editing === 'new') onCreate(input); else onUpdate(editing.id, input); setEditing(null) }} />}
  </AdminSection>
}

function ParcelEditor({ parcel, growers, vineyards, activeCampaign, es, onCancel, onSave }: { parcel?: VineyardParcel; growers: Grower[]; vineyards: VineyardEstate[]; activeCampaign?: Campaign; es: boolean; onCancel: () => void; onSave: (input: NewParcelInput) => void }) {
  const initialGrower = parcel?.growerId ?? growers[0]?.id ?? ''; const eligible = vineyards.filter((v) => v.growerId === initialGrower)
  const [draft, setDraft] = useState({ code: parcel?.code ?? parcel?.id ?? '', name: parcel?.name ?? '', growerId: initialGrower, estateId: parcel?.estateId ?? eligible[0]?.id ?? '', varieties: parcel?.varieties ?? '', hectares: parcel?.hectares ?? 1, clone: parcel?.clone ?? '', rootstock: parcel?.rootstock ?? '', plantingYear: parcel?.plantingYear ?? undefined as number | undefined, trainingSystem: parcel?.trainingSystem ?? '', irrigation: parcel?.irrigation ?? false, altitudeM: parcel?.altitudeM ?? undefined as number | undefined, orientation: parcel?.orientation ?? '', organic: parcel?.organic ?? false, latitude: parcel?.latitude ?? undefined as number | undefined, longitude: parcel?.longitude ?? undefined as number | undefined, notes: parcel?.notes ?? '', addToCampaign: Boolean(!parcel && activeCampaign) })
  const availableVineyards = vineyards.filter((v) => v.growerId === draft.growerId); const valid = Boolean(draft.code.trim() && draft.name.trim() && draft.growerId && draft.estateId && draft.varieties.trim() && draft.hectares > 0)
  return <div className="sheet-layer campaign-editor-layer" role="dialog" aria-modal="true"><button className="sheet-scrim" onClick={onCancel} /><section className="campaign-editor parcel-editor"><header><span><MapPin /></span><div><small>{parcel ? (es ? 'Editar parcela' : 'Edit parcel') : (es ? 'Nueva parcela' : 'New parcel')}</small><h2>{draft.name || (es ? 'Parcela' : 'Parcel')}</h2></div><button className="icon-button" onClick={onCancel}><X /></button></header><div className="campaign-editor-body"><div className="campaign-editor-grid"><label><span>{es ? 'Código' : 'Code'}</span><input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></label><label><span>{es ? 'Superficie (ha)' : 'Area (ha)'}</span><input type="number" step="0.01" min="0.01" value={draft.hectares} onChange={(e) => setDraft({ ...draft, hectares: Number(e.target.value) })} /></label><label className="wide"><span>{es ? 'Nombre' : 'Name'}</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label><span>{es ? 'Viticultor' : 'Grower'}</span><select value={draft.growerId} onChange={(e) => { const growerId = e.target.value; const first = vineyards.find((v) => v.growerId === growerId); setDraft({ ...draft, growerId, estateId: first?.id ?? '' }) }}>{growers.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label><span>{es ? 'Viñedo' : 'Vineyard'}</span><select value={draft.estateId} onChange={(e) => setDraft({ ...draft, estateId: e.target.value })}><option value="">—</option>{availableVineyards.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label><label><span>{es ? 'Variedad(es)' : 'Variety/varieties'}</span><input value={draft.varieties} onChange={(e) => setDraft({ ...draft, varieties: e.target.value })} /></label><label><span>Clon</span><input value={draft.clone} onChange={(e) => setDraft({ ...draft, clone: e.target.value })} /></label><label><span>{es ? 'Portainjerto' : 'Rootstock'}</span><input value={draft.rootstock} onChange={(e) => setDraft({ ...draft, rootstock: e.target.value })} /></label><label><span>{es ? 'Año plantación' : 'Planting year'}</span><input type="number" value={draft.plantingYear ?? ''} onChange={(e) => setDraft({ ...draft, plantingYear: e.target.value ? Number(e.target.value) : undefined })} /></label><label><span>{es ? 'Sistema conducción' : 'Training system'}</span><input value={draft.trainingSystem} onChange={(e) => setDraft({ ...draft, trainingSystem: e.target.value })} /></label><label><span>{es ? 'Altitud (m)' : 'Altitude (m)'}</span><input type="number" value={draft.altitudeM ?? ''} onChange={(e) => setDraft({ ...draft, altitudeM: e.target.value ? Number(e.target.value) : undefined })} /></label><label><span>{es ? 'Orientación' : 'Orientation'}</span><input value={draft.orientation} onChange={(e) => setDraft({ ...draft, orientation: e.target.value })} /></label><label className="wide"><span>{es ? 'Notas' : 'Notes'}</span><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label></div>{!parcel && activeCampaign && <label className="campaign-activate-toggle"><input type="checkbox" checked={draft.addToCampaign} onChange={(e) => setDraft({ ...draft, addToCampaign: e.target.checked })} /><span><CalendarDays /><span><strong>{es ? `Añadir a ${activeCampaign.name}` : `Add to ${activeCampaign.name}`}</strong><small>{es ? 'Crea la relación de planificación; la parcela seguirá siendo un maestro permanente.' : 'Creates the planning relationship; the parcel remains permanent master data.'}</small></span></span></label>}</div><footer><button className="secondary-button" onClick={onCancel}>{es ? 'Cancelar' : 'Cancel'}</button><button className="primary-button" disabled={!valid} onClick={() => onSave({ code: draft.code, name: draft.name, growerId: draft.growerId, estateId: draft.estateId, varieties: draft.varieties, hectares: draft.hectares, clone: draft.clone, rootstock: draft.rootstock, plantingYear: draft.plantingYear, trainingSystem: draft.trainingSystem, irrigation: draft.irrigation, altitudeM: draft.altitudeM, orientation: draft.orientation, organic: draft.organic, latitude: draft.latitude, longitude: draft.longitude, notes: draft.notes, campaignId: !parcel && draft.addToCampaign ? activeCampaign?.id : undefined, operator: getCurrentOperatorName() })}><Save /> {es ? 'Guardar' : 'Save'}</button></footer></section></div>
}

function formatAdminDate(value: string | undefined, locale: string) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function AdminStatus({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) { return <article className="admin-status"><span className={`admin-status-icon ${tone}`}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article> }
function AdminSection({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) { return <section className="admin-section"><header><span>{icon}</span><div><h2>{title}</h2><p>{text}</p></div></header>{children}</section> }
function AdminField({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={`admin-field ${wide ? 'wide' : ''}`}><span>{label}</span><div>{children}</div></label> }
function ThresholdField({ icon, label, value, unit, min, max, onChange }: { icon: ReactNode; label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void }) { return <label className="threshold-field"><span className="threshold-icon">{icon}</span><span><small>{label}</small><strong>{value} {unit}</strong></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function IntegrationCard({ icon, title, status, detail, tone }: { icon: ReactNode; title: string; status: string; detail: string; tone: string }) { return <article className="integration-card"><span className={`integration-icon ${tone}`}>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><em className={tone}>{status}</em></article> }
function FoundationStep({ icon, status, title, detail }: { icon: ReactNode; status: 'ready' | 'pending' | 'locked'; title: string; detail: string }) { return <article className={`foundation-step ${status}`}><span>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><em>{status === 'ready' ? <Check /> : status === 'locked' ? <LockKeyhole /> : <RefreshCw />}</em></article> }
