import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  BellRing, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, CloudOff,
  Database, Download, FlaskConical, Gauge, Grape, HardDrive, Info, LockKeyhole, RefreshCw, Server,
  Save, ShieldCheck, SlidersHorizontal, Smartphone, Thermometer, Trash2, Users, Warehouse, Wifi, WifiOff,
} from 'lucide-react'
import { catalystFoundation, checkCatalystReadService, type CatalystConnectionResult } from './catalyst'
import { images } from './data'
import { useLanguage } from './i18n'
import type { PwaStatus } from './pwa'
import type { WinerySettings } from './types'

type AdministrationView = 'winery' | 'campaign' | 'operations' | 'system'

interface AdministrationPageProps {
  settings: WinerySettings
  recordCount: number
  pwa: PwaStatus
  onSave: (settings: WinerySettings) => void
  onResetData: () => void
}

export function AdministrationPage({ settings, recordCount, pwa, onSave, onResetData }: AdministrationPageProps) {
  const { t, locale } = useLanguage()
  const [view, setView] = useState<AdministrationView>('winery')
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
  const campaignDate = (value: string, withYear = false) => {
    const date = new Date(`${value}T12:00:00`)
    return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: withYear ? 'numeric' : undefined }).format(date)
  }
  const update = <K extends keyof WinerySettings>(key: K, value: WinerySettings[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.wineryName.trim() || !draft.legalName.trim() || !draft.wineryCode.trim() || !draft.municipality.trim()) return setError(t('admin.errorIdentity'))
    if (draft.campaignYear < 2020 || draft.targetHarvestKg <= 0 || !draft.campaignStart || !draft.campaignEnd || draft.campaignStart > draft.campaignEnd) return setError(t('admin.errorCampaign'))
    if (draft.cellarTemperatureTarget < 5 || draft.cellarTemperatureTarget > 25 || draft.cellarHumidityTarget < 40 || draft.cellarHumidityTarget > 95) return setError(t('admin.errorOperations'))
    setError(''); onSave({ ...draft, updatedAt: new Date().toISOString(), updatedBy: 'Elena Martín' })
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

  return <main className="admin-page">
    <header className="page-header"><div><span className="eyebrow">{t('admin.kicker')}</span><h1>{t('admin.title')}</h1><p>{t('admin.description')}</p></div><div className="page-header-action"><button className="primary-button" form="admin-settings-form" disabled={!dirty}><Save size={16} /> {dirty ? t('admin.saveChanges') : t('admin.saved')}</button></div></header>

    <section className="admin-hero" style={{ backgroundImage: `url(${images.vineyard})` }}><div className="admin-hero-overlay" /><div className="admin-hero-copy"><span className="admin-season"><Building2 size={15} /> {t('admin.singleWinery')}</span><h2>{draft.wineryName}</h2><p>{draft.municipality} · {draft.province} · {draft.designation}</p><div className="admin-hero-badges"><span><ShieldCheck size={15} /> {t('admin.localCheckpoint')}</span><span><CloudOff size={15} /> {t('admin.backendDeferred')}</span></div></div><div className="winery-identity-card"><span className="winery-large-mark">{initials || 'VI'}</span><span><small>{t('admin.registry')}</small><strong>{draft.wineryCode}</strong><em>{t('admin.campaignLabel', { year: draft.campaignYear })}</em></span></div></section>

    <section className="admin-status-grid"><AdminStatus icon={<HardDrive />} label={t('admin.storage')} value={t('admin.browserLocal')} detail={t('admin.localRecords', { count: recordCount })} tone="wine" /><AdminStatus icon={<Users />} label={t('admin.access')} value={t('admin.demoOperator')} detail={t('admin.authPending')} tone="gold" /><AdminStatus icon={<Database />} label={t('admin.dataService')} value={t('admin.schemaReady')} detail={t('admin.catalystTables', { count: catalystFoundation.tables.length })} tone="blue" /><AdminStatus icon={<CheckCircle2 />} label={t('admin.configuration')} value={dirty ? t('admin.unsaved') : t('admin.upToDate')} detail={t('admin.lastSavedBy', { name: settings.updatedBy })} tone={dirty ? 'warning' : 'success'} /></section>

    <div className="admin-workspace"><aside className="admin-section-nav">{([
      ['winery', <Building2 />, 'admin.wineryProfile', 'admin.wineryProfileText'],
      ['campaign', <CalendarDays />, 'admin.campaign', 'admin.campaignText'],
      ['operations', <SlidersHorizontal />, 'admin.operations', 'admin.operationsText'],
      ['system', <Database />, 'admin.systemData', 'admin.systemDataText'],
    ] as const).map(([key, icon, label, text]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}><span>{icon}</span><span><strong>{t(label)}</strong><small>{t(text)}</small></span><ChevronRight /></button>)}</aside>

      <form id="admin-settings-form" className="admin-form-panel" onSubmit={submit}>
        {view === 'winery' && <AdminSection icon={<Building2 />} title={t('admin.wineryProfile')} text={t('admin.profileIntro')}>
          <div className="admin-form-grid"><AdminField label={t('admin.displayName')} wide><input value={draft.wineryName} onChange={(event) => update('wineryName', event.target.value)} /></AdminField><AdminField label={t('admin.legalName')} wide><input value={draft.legalName} onChange={(event) => update('legalName', event.target.value)} /></AdminField><AdminField label={t('admin.registryCode')}><input value={draft.wineryCode} onChange={(event) => update('wineryCode', event.target.value)} /></AdminField><AdminField label={t('admin.designation')}><input value={draft.designation} onChange={(event) => update('designation', event.target.value)} /></AdminField><AdminField label={t('admin.municipality')}><input value={draft.municipality} onChange={(event) => update('municipality', event.target.value)} /></AdminField><AdminField label={t('admin.province')}><input value={draft.province} onChange={(event) => update('province', event.target.value)} /></AdminField><AdminField label={t('admin.timezone')} wide><select value={draft.timezone} onChange={(event) => update('timezone', event.target.value)}><option value="Europe/Madrid">Europe/Madrid</option><option value="Europe/London">Europe/London</option><option value="Europe/Paris">Europe/Paris</option></select></AdminField><AdminField label={locale.startsWith('es') ? 'Latitud' : 'Latitude'}><input type="number" step="0.0001" min="-90" max="90" value={draft.latitude} onChange={(event) => update('latitude', Number(event.target.value))} /></AdminField><AdminField label={locale.startsWith('es') ? 'Longitud' : 'Longitude'}><input type="number" step="0.0001" min="-180" max="180" value={draft.longitude} onChange={(event) => update('longitude', Number(event.target.value))} /></AdminField></div>
          <div className="admin-context-note"><Info /><span><strong>{t('admin.identityNote')}</strong><small>{t('admin.identityNoteText')}</small></span></div>
        </AdminSection>}

        {view === 'campaign' && <AdminSection icon={<CalendarDays />} title={t('admin.campaign')} text={t('admin.campaignIntro')}>
          <div className="admin-form-grid"><AdminField label={t('admin.campaignYear')}><input type="number" min="2020" max="2100" value={draft.campaignYear} onChange={(event) => update('campaignYear', Number(event.target.value))} /></AdminField><AdminField label={t('admin.targetHarvest')}><div className="admin-unit-input"><input type="number" min="1" value={draft.targetHarvestKg} onChange={(event) => update('targetHarvestKg', Number(event.target.value))} /><i>kg</i></div></AdminField><AdminField label={t('admin.campaignStart')}><input type="date" value={draft.campaignStart} onChange={(event) => update('campaignStart', event.target.value)} /></AdminField><AdminField label={t('admin.campaignEnd')}><input type="date" value={draft.campaignEnd} onChange={(event) => update('campaignEnd', event.target.value)} /></AdminField></div>
          <div className="campaign-window-card"><span className="campaign-window-icon"><Grape /></span><span><small>{t('admin.activeWindow')}</small><strong>{campaignDate(draft.campaignStart)} — {campaignDate(draft.campaignEnd, true)}</strong><em>{new Intl.NumberFormat(locale).format(draft.targetHarvestKg)} kg · {draft.designation}</em></span></div>
          <div className="admin-context-note"><Info /><span><strong>{t('admin.campaignRuleNote')}</strong><small>{t('admin.campaignRuleNoteText')}</small></span></div>
        </AdminSection>}

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
        {view !== 'system' && <footer className="admin-form-actions"><span>{dirty ? t('admin.unsavedChanges') : t('admin.noPendingChanges')}</span><button className="primary-button" disabled={!dirty}><Save size={16} /> {t('admin.saveChanges')}</button></footer>}
      </form>
    </div>

    {resetOpen && <div className="sheet-layer" role="dialog" aria-modal="true"><button className="sheet-scrim" onClick={() => setResetOpen(false)} aria-label={t('common.close')} /><section className="reset-confirm"><span className="reset-confirm-icon"><Trash2 /></span><h2>{t('admin.resetTitle')}</h2><p>{t('admin.resetText')}</p><div><button className="secondary-button" onClick={() => setResetOpen(false)}>{t('common.cancel')}</button><button className="danger-button" onClick={() => { onResetData(); setResetOpen(false) }}>{t('admin.resetConfirm')}</button></div></section></div>}
  </main>
}

function AdminStatus({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) { return <article className="admin-status"><span className={`admin-status-icon ${tone}`}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article> }
function AdminSection({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) { return <section className="admin-section"><header><span>{icon}</span><div><h2>{title}</h2><p>{text}</p></div></header>{children}</section> }
function AdminField({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={`admin-field ${wide ? 'wide' : ''}`}><span>{label}</span><div>{children}</div></label> }
function ThresholdField({ icon, label, value, unit, min, max, onChange }: { icon: ReactNode; label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void }) { return <label className="threshold-field"><span className="threshold-icon">{icon}</span><span><small>{label}</small><strong>{value} {unit}</strong></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function IntegrationCard({ icon, title, status, detail, tone }: { icon: ReactNode; title: string; status: string; detail: string; tone: string }) { return <article className="integration-card"><span className={`integration-icon ${tone}`}>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><em className={tone}>{status}</em></article> }
function FoundationStep({ icon, status, title, detail }: { icon: ReactNode; status: 'ready' | 'pending' | 'locked'; title: string; detail: string }) { return <article className={`foundation-step ${status}`}><span>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><em>{status === 'ready' ? <Check /> : status === 'locked' ? <LockKeyhole /> : <RefreshCw />}</em></article> }
