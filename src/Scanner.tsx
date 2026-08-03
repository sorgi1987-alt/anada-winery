import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import QRCode from 'qrcode'
import {
  ArrowRight, Camera, Check, Download, Grape, MapPin, Package, Printer, ScanLine,
  Search, Tag, Truck, Warehouse, Wine, X, Zap,
} from 'lucide-react'
import { useLanguage } from './i18n'
import { useNavigate } from './router'
import { buildScannerRegistry, resolveScanCode, scanPayload, searchScannerRegistry, type ScanEntity, type ScanEntityType } from './scanRegistry'
import type { Barrel, BottlingOrder, GrapeDelivery, Tank, VineyardParcel, WineLot } from './types'

interface ScannerPageProps {
  lots: WineLot[]
  tanks: Tank[]
  barrels: Barrel[]
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  bottlingOrders: BottlingOrder[]
  onReading: (lotId: string) => void
}

type DetectorResult = { rawValue: string }
type Detector = { detect: (source: HTMLVideoElement) => Promise<DetectorResult[]> }
type DetectorConstructor = new (options: { formats: string[] }) => Detector

const entityIcon: Record<ScanEntityType, ReactNode> = {
  lot: <Grape />, vessel: <Warehouse />, barrel: <Wine />, parcel: <MapPin />,
  delivery: <Truck />, bottling: <Package />,
}

const typeKey: Record<ScanEntityType, 'scanner.type.lot' | 'scanner.type.vessel' | 'scanner.type.barrel' | 'scanner.type.parcel' | 'scanner.type.delivery' | 'scanner.type.bottling'> = {
  lot: 'scanner.type.lot', vessel: 'scanner.type.vessel', barrel: 'scanner.type.barrel',
  parcel: 'scanner.type.parcel', delivery: 'scanner.type.delivery', bottling: 'scanner.type.bottling',
}

export function ScannerPage(props: ScannerPageProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const registry = useMemo(() => buildScannerRegistry(props), [props.lots, props.tanks, props.barrels, props.parcels, props.deliveries, props.bottlingOrders])
  const [view, setView] = useState<'scan' | 'labels'>('scan')
  const [manualCode, setManualCode] = useState('')
  const [scanState, setScanState] = useState<'idle' | 'unknown' | 'found'>('idle')
  const [matches, setMatches] = useState<ScanEntity[]>([])
  const [selected, setSelected] = useState<ScanEntity | null>(null)
  const [labelSearch, setLabelSearch] = useState('')
  const [labelType, setLabelType] = useState<'all' | ScanEntityType>('all')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  const resolve = (value: string) => {
    const next = resolveScanCode(value, registry)
    setMatches(next)
    setSelected(next.length === 1 ? next[0] : null)
    setScanState(next.length ? 'found' : 'unknown')
    setManualCode(value)
  }

  const submitManual = (event: FormEvent) => {
    event.preventDefault()
    resolve(manualCode)
  }

  const filteredLabels = searchScannerRegistry(labelSearch, registry).filter((entity) => labelType === 'all' || entity.type === labelType)
  const printable = registry.filter((entity) => selectedLabels.includes(entity.key))

  const queueLabel = (entity: ScanEntity) => {
    setSelectedLabels((current) => current.includes(entity.key) ? current : [...current, entity.key])
    setView('labels')
  }

  return <main className="scanner-page">
    <header className="page-header"><div><span className="eyebrow">{t('scanner.kicker')}</span><h1>{t('scanner.title')}</h1><p>{t('scanner.description')}</p></div><div className="scanner-local-chip"><Zap /><span><strong>{t('scanner.offlineReady')}</strong><small>{t('scanner.offlineReadyText')}</small></span></div></header>

    <div className="scanner-view-tabs" role="tablist">
      <button className={view === 'scan' ? 'active' : ''} onClick={() => setView('scan')}><ScanLine /> {t('scanner.scan')}</button>
      <button className={view === 'labels' ? 'active' : ''} onClick={() => setView('labels')}><Tag /> {t('scanner.labels')}<em>{selectedLabels.length}</em></button>
    </div>

    {view === 'scan' ? <section className="scanner-workspace">
      <CameraScanner onCode={resolve} />
      <div className="scanner-manual-panel">
        <span className="scanner-section-icon"><Search /></span>
        <div className="scanner-section-copy"><span className="eyebrow">{t('scanner.manualKicker')}</span><h2>{t('scanner.manualTitle')}</h2><p>{t('scanner.manualText')}</p></div>
        <form onSubmit={submitManual}><label><ScanLine /><input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder={t('scanner.placeholder')} autoCapitalize="characters" autoCorrect="off" /></label><button className="primary-button">{t('scanner.find')} <ArrowRight /></button></form>
        <div className="scanner-code-examples"><span>T-26-017</span><span>D21</span><span>BAR-026-01</span><span>ENT-26-018</span></div>
      </div>

      <div className="scanner-result-panel" aria-live="polite">
        {scanState === 'idle' && <ScannerEmpty icon={<ScanLine />} title={t('scanner.waitingTitle')} text={t('scanner.waitingText')} />}
        {scanState === 'unknown' && <ScannerEmpty icon={<X />} title={t('scanner.unknownTitle')} text={t('scanner.unknownText')} critical />}
        {matches.length > 1 && !selected && <div className="scanner-ambiguous"><header><strong>{t('scanner.multipleTitle')}</strong><small>{t('scanner.multipleText')}</small></header>{matches.map((entity) => <button key={entity.key} onClick={() => setSelected(entity)}><span className={`scanner-entity-icon ${entity.type}`}>{entityIcon[entity.type]}</span><span><strong>{entity.code}</strong><small>{t(typeKey[entity.type])} · {entity.title}</small></span><ArrowRight /></button>)}</div>}
        {selected && <ScannerResult entity={selected} onOpen={() => navigate(selected.route)} onReading={selected.lotId ? () => props.onReading(selected.lotId!) : undefined} onMovement={selected.lotId ? () => navigate('/movements') : undefined} onTrace={() => navigate('/traceability')} onLabel={() => queueLabel(selected)} />}
      </div>
    </section> : <LabelWorkspace registry={registry} filtered={filteredLabels} selected={selectedLabels} search={labelSearch} type={labelType} printable={printable} onSearch={setLabelSearch} onType={setLabelType} onToggle={(key) => setSelectedLabels((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} onClear={() => setSelectedLabels([])} />}
  </main>
}

function CameraScanner({ onCode }: { onCode: (code: string) => void }) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const busyRef = useRef(false)
  const [state, setState] = useState<'idle' | 'starting' | 'active' | 'unsupported' | 'denied'>('idle')

  const stop = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setState('idle')
  }

  useEffect(() => stop, [])

  const start = async () => {
    const DetectorApi = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
    if (!DetectorApi || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      const detector = new DetectorApi({ formats: ['qr_code', 'code_128', 'data_matrix', 'ean_13', 'ean_8'] })
      setState('active')
      const scan = async () => {
        if (!busyRef.current && video.readyState >= 2) {
          busyRef.current = true
          try {
            const codes = await detector.detect(video)
            if (codes[0]?.rawValue) {
              const code = codes[0].rawValue
              stop()
              onCode(code)
              return
            }
          } finally {
            busyRef.current = false
          }
        }
        frameRef.current = requestAnimationFrame(scan)
      }
      frameRef.current = requestAnimationFrame(scan)
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setState('denied')
    }
  }

  return <div className={`camera-scanner ${state}`}>
    <video ref={videoRef} muted playsInline />
    <div className="camera-overlay"><span className="scan-corner top-left" /><span className="scan-corner top-right" /><span className="scan-corner bottom-left" /><span className="scan-corner bottom-right" />{state === 'active' && <i />}</div>
    <div className="camera-placeholder"><span><Camera /></span><strong>{state === 'active' ? t('scanner.aim') : state === 'starting' ? t('scanner.starting') : t('scanner.cameraTitle')}</strong><small>{state === 'unsupported' ? t('scanner.unsupported') : state === 'denied' ? t('scanner.denied') : t('scanner.cameraText')}</small>{state === 'active' ? <button className="camera-stop" onClick={stop}><X /> {t('scanner.stop')}</button> : <button className="camera-start" onClick={() => void start()}><Camera /> {t('scanner.openCamera')}</button>}</div>
  </div>
}

function ScannerResult({ entity, onOpen, onReading, onMovement, onTrace, onLabel }: { entity: ScanEntity; onOpen: () => void; onReading?: () => void; onMovement?: () => void; onTrace: () => void; onLabel: () => void }) {
  const { t } = useLanguage()
  return <article className="scanner-result-card">
    <header><span className={`scanner-entity-icon ${entity.type}`}>{entityIcon[entity.type]}</span><span><small>{t(typeKey[entity.type])}</small><strong>{entity.code}</strong></span><em><Check /> {t('scanner.identified')}</em></header>
    <div><h2>{entity.title}</h2><p>{entity.subtitle}</p><span>{entity.detail}</span></div>
    <div className="scanner-result-actions"><button className="primary-button" onClick={onOpen}>{t('scanner.openRecord')} <ArrowRight /></button>{onReading && <button onClick={onReading}><Download /> {t('scanner.recordReading')}</button>}{onMovement && <button onClick={onMovement}><Warehouse /> {t('scanner.startMovement')}</button>}<button onClick={onTrace}><Grape /> {t('scanner.trace')}</button><button onClick={onLabel}><Tag /> {t('scanner.printLabel')}</button></div>
  </article>
}

function ScannerEmpty({ icon, title, text, critical = false }: { icon: ReactNode; title: string; text: string; critical?: boolean }) {
  return <div className={`scanner-empty ${critical ? 'critical' : ''}`}><span>{icon}</span><strong>{title}</strong><small>{text}</small></div>
}

interface LabelWorkspaceProps {
  registry: ScanEntity[]
  filtered: ScanEntity[]
  selected: string[]
  printable: ScanEntity[]
  search: string
  type: 'all' | ScanEntityType
  onSearch: (value: string) => void
  onType: (value: 'all' | ScanEntityType) => void
  onToggle: (key: string) => void
  onClear: () => void
}

function LabelWorkspace({ registry, filtered, selected, printable, search, type, onSearch, onType, onToggle, onClear }: LabelWorkspaceProps) {
  const { t } = useLanguage()
  const types: Array<'all' | ScanEntityType> = ['all', 'lot', 'vessel', 'barrel', 'parcel', 'delivery', 'bottling']
  const [qrImages, setQrImages] = useState<Record<string, string>>({})
  useEffect(() => {
    let current = true
    void Promise.all(printable.map(async (entity) => [entity.key, await QRCode.toDataURL(scanPayload(entity), { width: 360, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#3A0B1D', light: '#FFFFFF' } })] as const))
      .then((entries) => { if (current) setQrImages(Object.fromEntries(entries)) })
    return () => { current = false }
  }, [printable])
  const printReady = printable.length > 0 && printable.every((entity) => qrImages[entity.key])
  return <section className="label-workspace">
    <header className="label-workspace-head"><div><span className="eyebrow">{t('scanner.labelKicker')}</span><h2>{t('scanner.labelTitle')}</h2><p>{t('scanner.labelText')}</p></div><div><button className="secondary-button" disabled={!selected.length} onClick={onClear}>{t('scanner.clear')}</button><button className="primary-button" disabled={!printReady} onClick={() => window.print()}><Printer /> {t('scanner.printSelected', { count: selected.length })}</button></div></header>
    <div className="label-toolbar"><label><Search /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={t('scanner.searchLabels')} /></label><div>{types.map((item) => <button key={item} className={type === item ? 'active' : ''} onClick={() => onType(item)}>{item === 'all' ? t('scanner.all') : t(typeKey[item])}</button>)}</div></div>
    <div className="label-registry"><header><span>{t('scanner.availableLabels', { count: registry.length })}</span><strong>{t('scanner.selectedLabels', { count: selected.length })}</strong></header><div>{filtered.map((entity) => <button key={entity.key} className={selected.includes(entity.key) ? 'selected' : ''} onClick={() => onToggle(entity.key)}><span className={`scanner-entity-icon ${entity.type}`}>{entityIcon[entity.type]}</span><span><small>{t(typeKey[entity.type])}</small><strong>{entity.code}</strong><em>{entity.title}</em></span><i>{selected.includes(entity.key) && <Check />}</i></button>)}</div></div>
    {!filtered.length && <ScannerEmpty icon={<Search />} title={t('scanner.noLabels')} text={t('scanner.noLabelsText')} />}
    <div className="print-label-sheet" aria-hidden="true">{printable.map((entity) => <QrLabel key={entity.key} entity={entity} image={qrImages[entity.key]} />)}</div>
  </section>
}

function QrLabel({ entity, image }: { entity: ScanEntity; image?: string }) {
  const { t } = useLanguage()
  return <article className="qr-print-label"><div className="qr-label-brand"><span><Grape /></span><strong>Añada</strong></div>{image && <img src={image} alt="" />}<div><small>{t(typeKey[entity.type])}</small><strong>{entity.code}</strong><span>{entity.title}</span><em>{entity.subtitle}</em></div><code>{scanPayload(entity)}</code></article>
}
