import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowUpRight, BarChart3, CheckCircle2, ClipboardCheck, Download,
  FileCheck2, FlaskConical, Grape, Package, Printer, ShieldCheck, TrendingUp, Warehouse, Wine,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { images } from './data'
import { useLanguage } from './i18n'
import type {
  Barrel, BlendTrial, BottlingOrder, CellarTask, GrapeDelivery, LabSample, PackagingMaterial,
  Tank, TraceabilityEntity, TraceabilityLink, WinerySettings, WineLot, WineType,
} from './types'

type ReportView = 'overview' | 'production' | 'quality' | 'control'
type WineFilter = 'all' | Extract<WineType, 'tinto' | 'blanco' | 'rosado'>

interface ReportsPageProps {
  lots: WineLot[]
  tasks: CellarTask[]
  tanks: Tank[]
  deliveries: GrapeDelivery[]
  samples: LabSample[]
  barrels: Barrel[]
  trials: BlendTrial[]
  orders: BottlingOrder[]
  materials: PackagingMaterial[]
  traceabilityEntities: TraceabilityEntity[]
  traceabilityLinks: TraceabilityLink[]
  settings: WinerySettings
}

const deliveryType = (delivery: GrapeDelivery): Exclude<WineFilter, 'all'> => {
  const hasWhite = /viura|malvas[ií]a|garnacha blanca|tempranillo blanco|maturana blanca|verdejo|turrunt[eé]s|chardonnay|sauvignon/i.test(delivery.varieties)
  const hasRed = /tempranillo(?! blanco)|garnacha(?! blanca)|graciano|mazuelo|maturana tinta/i.test(delivery.varieties)
  return hasWhite && hasRed ? 'rosado' : hasWhite ? 'blanco' : 'tinto'
}
const pct = (value: number, total: number) => total ? Math.round(value / total * 100) : 0

export function ReportsPage(props: ReportsPageProps) {
  const { lots, tasks, tanks, deliveries, samples, barrels, trials, orders, materials, traceabilityEntities, traceabilityLinks, settings } = props
  const { t, d, locale } = useLanguage()
  const [view, setView] = useState<ReportView>('overview')
  const campaigns = useMemo(() => [...new Set([...lots.map((lot) => lot.vintage), ...deliveries.map((delivery) => Number(delivery.scheduledDate.slice(0, 4)))])].sort((a, b) => b - a), [lots, deliveries])
  const [campaign, setCampaign] = useState<'all' | number>(campaigns[0] ?? 'all')
  const [wineFilter, setWineFilter] = useState<WineFilter>('all')
  const number = (value: number) => new Intl.NumberFormat(locale).format(Math.round(value))
  const filteredLots = lots.filter((lot) => (campaign === 'all' || lot.vintage === campaign) && (wineFilter === 'all' || lot.type === wineFilter))
  const filteredDeliveries = deliveries.filter((delivery) => (campaign === 'all' || delivery.scheduledDate.startsWith(String(campaign))) && (wineFilter === 'all' || deliveryType(delivery) === wineFilter))
  const filteredSamples = samples.filter((sample) => wineFilter === 'all' || sample.wineType === wineFilter)
  const wineVolume = filteredLots.reduce((sum, lot) => sum + lot.volume, 0)
  const receivedKg = filteredDeliveries.reduce((sum, delivery) => sum + (delivery.netKg ?? 0), 0)
  const expectedKg = filteredDeliveries.reduce((sum, delivery) => sum + delivery.expectedKg, 0)
  const campaignTargetKg = campaign === settings.campaignYear && wineFilter === 'all' ? settings.targetHarvestKg : expectedKg
  const tankCapacity = tanks.reduce((sum, tank) => sum + tank.capacity, 0)
  const tankVolume = tanks.reduce((sum, tank) => sum + tank.volume, 0)
  const tankOccupancy = pct(tankVolume, tankCapacity)
  const validatedSamples = filteredSamples.filter((sample) => sample.status === 'validated').length
  const validatedRate = pct(validatedSamples, filteredSamples.length)
  const verifiedLinks = traceabilityLinks.filter((link) => link.status === 'verified').length
  const traceCoverage = pct(verifiedLinks, traceabilityLinks.length)
  const completedOrders = orders.filter((order) => order.status === 'completed')
  const finishedBottles = completedOrders.reduce((sum, order) => sum + (order.completion?.goodBottles ?? 0), 0)
  const openTasks = tasks.filter((task) => !task.complete).length
  const attentionLots = filteredLots.filter((lot) => lot.attention !== 'normal')
  const reviewSamples = filteredSamples.filter((sample) => sample.status === 'review' || sample.results.some((result) => result.status !== 'normal'))
  const lowMaterials = materials.filter((material) => {
    const available = material.onHand - material.reserved
    return available <= material.reorderPoint || pct(available, material.onHand) <= settings.lowStockThreshold
  })
  const pendingLinks = traceabilityLinks.filter((link) => link.status === 'pending')

  const intakeTrend = useMemo(() => {
    const days = new Map<string, { date: string; expected: number; received: number }>()
    filteredDeliveries.forEach((delivery) => {
      const current = days.get(delivery.scheduledDate) ?? { date: delivery.scheduledDate, expected: 0, received: 0 }
      current.expected += delivery.expectedKg
      current.received += delivery.netKg ?? 0
      days.set(delivery.scheduledDate, current)
    })
    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({ ...item, label: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(`${item.date}T12:00:00`)) }))
  }, [filteredDeliveries, locale])

  const volumeByType = (['tinto', 'blanco', 'rosado'] as const).map((type) => ({
    type: t(type === 'tinto' ? 'wine.red' : type === 'blanco' ? 'wine.white' : 'wine.rose'),
    volume: lots.filter((lot) => (campaign === 'all' || lot.vintage === campaign) && lot.type === type).reduce((sum, lot) => sum + lot.volume, 0),
  }))
  const stageRows = [...new Map(filteredLots.map((lot) => [lot.stage, lot.stage])).values()].map((stage) => ({
    stage, volume: filteredLots.filter((lot) => lot.stage === stage).reduce((sum, lot) => sum + lot.volume, 0), count: filteredLots.filter((lot) => lot.stage === stage).length,
  })).sort((a, b) => b.volume - a.volume)

  const exportCsv = () => {
    const rows = [
      [t('reports.csvSection'), t('reports.csvMetric'), t('reports.csvValue')],
      [t('reports.harvest'), t('reports.grapesReceived'), String(receivedKg)],
      [t('reports.production'), t('reports.activeWine'), String(wineVolume)],
      [t('reports.cellar'), t('reports.tankOccupancy'), String(tankOccupancy)],
      [t('reports.quality'), t('reports.validatedSamples'), String(validatedRate)],
      [t('reports.control'), t('reports.traceCoverage'), String(traceCoverage)],
      ...filteredLots.map((lot) => [t('reports.lot'), `${lot.id} · ${lot.name}`, String(lot.volume)]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `anada-report-${campaign}-${wineFilter}.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  return <main className="reports-page">
    <header className="page-header"><div><span className="eyebrow">{t('reports.kicker')}</span><h1>{t('reports.title')}</h1><p>{t('reports.description')}</p></div><div className="page-header-action report-export-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={16} /> {t('reports.print')}</button><button className="primary-button" onClick={exportCsv}><Download size={16} /> {t('reports.export')}</button></div></header>

    <section className="reports-hero" style={{ backgroundImage: `url(${images.cellar})` }}><div className="reports-hero-overlay" /><div className="reports-hero-copy"><span className="report-season"><BarChart3 size={15} /> {t('reports.campaignView', { year: campaign === 'all' ? t('reports.allCampaigns') : campaign })}</span><h2>{t('reports.heroTitle')}</h2><p>{t('reports.heroText')}</p><div className="reports-hero-badges"><span><TrendingUp size={15} /> {t('reports.liveData')}</span><span><ShieldCheck size={15} /> {t('reports.internalManagement')}</span></div></div><div className="report-hero-summary"><span><small>{t('reports.activeWine')}</small><strong>{number(wineVolume)} L</strong><em>{filteredLots.length} {t('reports.lots').toLowerCase()}</em></span><i /><span><small>{t('reports.campaignProgress')}</small><strong>{pct(receivedKg, campaignTargetKg)}%</strong><em>{number(receivedKg)} kg</em></span></div></section>

    <section className="report-filters"><div className="harvest-tabs reports-tabs" role="tablist">{(['overview', 'production', 'quality', 'control'] as const).map((item) => <button key={item} role="tab" aria-selected={view === item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{t(`reports.${item}` as 'reports.overview')}</button>)}</div><div className="report-filter-controls"><label><span>{t('reports.campaign')}</span><select value={campaign} onChange={(event) => setCampaign(event.target.value === 'all' ? 'all' : Number(event.target.value))}><option value="all">{t('reports.allCampaigns')}</option>{campaigns.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><div className="filter-chips">{(['all', 'tinto', 'blanco', 'rosado'] as const).map((type) => <button key={type} className={wineFilter === type ? 'active' : ''} onClick={() => setWineFilter(type)}>{t(type === 'all' ? 'reports.allWines' : type === 'tinto' ? 'wine.red' : type === 'blanco' ? 'wine.white' : 'wine.rose')}</button>)}</div></div></section>

    <section className="report-metrics" aria-label={t('reports.summary')}><ReportMetric icon={<Grape />} label={t('reports.grapesReceived')} value={`${number(receivedKg)} kg`} detail={t('reports.ofExpected', { value: `${pct(receivedKg, campaignTargetKg)}%` })} tone="wine" /><ReportMetric icon={<Wine />} label={t('reports.activeWine')} value={`${number(wineVolume)} L`} detail={t('reports.acrossLots', { count: filteredLots.length })} tone="gold" /><ReportMetric icon={<Warehouse />} label={t('reports.tankOccupancy')} value={`${tankOccupancy}%`} detail={`${number(tankVolume)} / ${number(tankCapacity)} L`} tone="blue" /><ReportMetric icon={<ClipboardCheck />} label={t('reports.openWork')} value={String(openTasks)} detail={t('reports.attentionCount', { count: attentionLots.length + reviewSamples.length })} tone="critical" /></section>

    {view === 'overview' && <section className="report-dashboard-grid"><ReportPanel title={t('reports.intakeEvolution')} text={t('reports.intakeEvolutionText')} className="wide"><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={intakeTrend} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}><defs><linearGradient id="received-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--wine-600)" stopOpacity={.34} /><stop offset="100%" stopColor="var(--wine-600)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }} /><Area type="monotone" dataKey="expected" name={t('reports.expected')} stroke="var(--gold)" fill="transparent" strokeDasharray="5 4" /><Area type="monotone" dataKey="received" name={t('reports.received')} stroke="var(--wine-600)" strokeWidth={2.5} fill="url(#received-area)" /></AreaChart></ResponsiveContainer></div></ReportPanel><ReportPanel title={t('reports.volumeByType')} text={t('reports.volumeByTypeText')}><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={volumeByType} layout="vertical" margin={{ left: 5, right: 18 }}><CartesianGrid horizontal={false} stroke="var(--line)" /><XAxis type="number" hide /><YAxis type="category" dataKey="type" axisLine={false} tickLine={false} width={54} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)' }} /><Bar dataKey="volume" name={t('common.volume')} fill="var(--wine-600)" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div></ReportPanel><ReportPanel title={t('reports.attentionBoard')} text={t('reports.attentionBoardText')}><div className="report-attention-list"><AttentionRow icon={<Wine />} label={t('reports.lotsWithAttention')} value={attentionLots.length} tone={attentionLots.length ? 'warning' : 'success'} /><AttentionRow icon={<FlaskConical />} label={t('reports.samplesToReview')} value={reviewSamples.length} tone={reviewSamples.length ? 'critical' : 'success'} /><AttentionRow icon={<Package />} label={t('reports.materialAlerts')} value={lowMaterials.length} tone={lowMaterials.length ? 'warning' : 'success'} /><AttentionRow icon={<FileCheck2 />} label={t('reports.pendingEvidence')} value={pendingLinks.length} tone={pendingLinks.length ? 'warning' : 'success'} /></div></ReportPanel></section>}

    {view === 'production' && <section className="report-detail-grid"><ReportPanel title={t('reports.volumeByStage')} text={t('reports.volumeByStageText')} className="wide"><div className="stage-report-list">{stageRows.map((row) => <article key={row.stage}><span><strong>{d(row.stage)}</strong><small>{row.count} {t('reports.lots').toLowerCase()}</small></span><div><i style={{ width: `${pct(row.volume, wineVolume)}%` }} /></div><em>{number(row.volume)} L</em></article>)}</div></ReportPanel><ReportPanel title={t('reports.cellarUse')} text={t('reports.cellarUseText')}><div className="report-ring" style={{ '--value': `${tankOccupancy * 3.6}deg` } as React.CSSProperties}><span><strong>{tankOccupancy}%</strong><small>{t('common.occupancy')}</small></span></div><div className="report-mini-stats"><span><small>{t('reports.filledTanks')}</small><strong>{tanks.filter((tank) => tank.volume > 0).length}</strong></span><span><small>{t('reports.filledBarrels')}</small><strong>{barrels.filter((barrel) => barrel.status === 'filled').length}</strong></span></div></ReportPanel><ReportPanel title={t('reports.blendingBottling')} text={t('reports.blendingBottlingText')}><div className="report-funnel"><span><i>{trials.length}</i><strong>{t('reports.trials')}</strong></span><ArrowUpRight /><span><i>{trials.filter((trial) => trial.status === 'approved').length}</i><strong>{t('reports.approved')}</strong></span><ArrowUpRight /><span><i>{finishedBottles}</i><strong>{t('reports.bottles')}</strong></span></div></ReportPanel></section>}

    {view === 'quality' && <section className="report-detail-grid"><ReportPanel title={t('reports.labValidation')} text={t('reports.labValidationText')}><div className="quality-score"><span><strong>{validatedRate}%</strong><small>{t('reports.validatedSamples')}</small></span></div><div className="report-mini-stats"><span><small>{t('reports.totalSamples')}</small><strong>{filteredSamples.length}</strong></span><span><small>{t('reports.toReview')}</small><strong>{reviewSamples.length}</strong></span></div></ReportPanel><ReportPanel title={t('reports.sampleStatus')} text={t('reports.sampleStatusText')} className="wide"><div className="status-distribution">{(['queued', 'in_analysis', 'review', 'validated'] as const).map((status) => { const count = filteredSamples.filter((sample) => sample.status === status).length; return <article key={status}><span><strong>{t(`lab.status${status === 'in_analysis' ? 'InAnalysis' : status[0].toUpperCase() + status.slice(1)}` as 'lab.statusQueued')}</strong><em>{count}</em></span><div><i style={{ width: `${pct(count, filteredSamples.length)}%` }} /></div></article> })}</div></ReportPanel><ReportPanel title={t('reports.qualitySignals')} text={t('reports.qualitySignalsText')} className="wide"><div className="report-record-list">{reviewSamples.slice(0, 5).map((sample) => <article key={sample.id}><span className="report-record-icon"><FlaskConical /></span><span><strong>{sample.code} · {sample.sourceName}</strong><small>{sample.results.filter((result) => result.status !== 'normal').length} {t('reports.parametersFlagged')}</small></span><em>{sample.assignedTo}</em></article>)}{!reviewSamples.length && <div className="report-empty"><CheckCircle2 /><strong>{t('reports.noQualityAlerts')}</strong></div>}</div></ReportPanel></section>}

    {view === 'control' && <section className="report-detail-grid"><ReportPanel title={t('reports.controlCoverage')} text={t('reports.controlCoverageText')} className="wide"><div className="coverage-list"><CoverageRow label={t('reports.traceCoverage')} value={traceCoverage} detail={`${verifiedLinks}/${traceabilityLinks.length}`} /><CoverageRow label={t('reports.entityVerification')} value={pct(traceabilityEntities.filter((entity) => entity.status === 'verified').length, traceabilityEntities.length)} detail={`${traceabilityEntities.length} ${t('reports.records').toLowerCase()}`} /><CoverageRow label={t('reports.labValidation')} value={validatedRate} detail={`${validatedSamples}/${filteredSamples.length}`} /><CoverageRow label={t('reports.bottlingDocumentation')} value={pct(completedOrders.length, orders.length)} detail={`${completedOrders.length}/${orders.length}`} /></div></ReportPanel><ReportPanel title={t('reports.finishedProduct')} text={t('reports.finishedProductText')}><div className="finished-report-list">{completedOrders.map((order) => <article key={order.id}><span><strong>{order.completion?.finishedProductLot}</strong><small>{order.code} · {order.wineName}</small></span><em>{number(order.completion?.goodBottles ?? 0)} {t('reports.bottles').toLowerCase()}</em></article>)}{!completedOrders.length && <span className="report-empty-text">{t('reports.noCompletedRuns')}</span>}</div></ReportPanel><div className="report-disclaimer"><ShieldCheck /><span><strong>{t('reports.internalReport')}</strong><small>{t('reports.internalReportText')}</small></span></div></section>}
  </main>
}

function ReportMetric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) { return <article className="report-metric"><span className={`report-metric-icon ${tone}`}>{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span></article> }
function ReportPanel({ title, text, className = '', children }: { title: string; text: string; className?: string; children: ReactNode }) { return <article className={`report-panel ${className}`}><header><span><h2>{title}</h2><p>{text}</p></span></header>{children}</article> }
function AttentionRow({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: string }) { return <article><span className={`attention-icon ${tone}`}>{icon}</span><strong>{label}</strong><em>{value}</em></article> }
function CoverageRow({ label, value, detail }: { label: string; value: number; detail: string }) { return <article><span><strong>{label}</strong><small>{detail}</small></span><div><i style={{ width: `${value}%` }} /></div><em>{value}%</em></article> }
