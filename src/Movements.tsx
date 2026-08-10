import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { getCurrentOperatorName } from './operator'
import { ArrowRight, ArrowRightLeft, Check, CircleGauge, GitMerge, Layers3, Plus, ShieldCheck, Split, Warehouse, X } from 'lucide-react'
import { images } from './data'
import { useLanguage } from './i18n'
import type { NewMergeInput, NewSplitInput, NewTransferInput, Tank, WineLot, WineMovement, WineMovementKind } from './types'

const numeric = (value: string) => value.trim() === '' ? 0 : Number(value.trim().replace(',', '.'))

const nowForInput = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const kindIcon = (kind: WineMovementKind): ReactNode => kind === 'transfer' ? <ArrowRightLeft /> : kind === 'split' ? <Split /> : <GitMerge />

const kindKey = (kind: WineMovementKind) => ({ transfer: 'movements.transfer', split: 'movements.split', merge: 'movements.merge' } as const)[kind]

export function MovementsPage({ lots, tanks, movements, onTransfer, onSplit, onMerge }: {
  lots: WineLot[]
  tanks: Tank[]
  movements: WineMovement[]
  onTransfer: (input: NewTransferInput) => void
  onSplit: (input: NewSplitInput) => void
  onMerge: (input: NewMergeInput) => void
}) {
  const { t, locale } = useLanguage()
  const [openKind, setOpenKind] = useState<WineMovementKind | null>(null)
  const [filter, setFilter] = useState<'all' | WineMovementKind>('all')
  const activeLots = lots.filter((lot) => lot.operationalStatus !== 'consumed' && lot.volume > 0 && lot.type !== 'espumoso'
    && tanks.some((tank) => tank.id === lot.vessel && tank.lot === lot.id))
  const emptyTanks = tanks.filter((tank) => !tank.lot && tank.volume === 0)
  const visibleMovements = filter === 'all' ? movements : movements.filter((movement) => movement.kind === filter)
  const movedVolume = movements.reduce((total, movement) => total + movement.receivedVolume, 0)
  const totalLoss = movements.reduce((total, movement) => total + movement.lossVolume, 0)
  const averageLoss = movements.length ? totalLoss / Math.max(1, movements.reduce((total, movement) => total + movement.grossSourceVolume, 0)) * 100 : 0

  return (
    <main className="movements-page">
      <section className="movements-hero" style={{ backgroundImage: `url(${images.tanks})` }}>
        <div className="movements-hero-overlay" />
        <div className="movements-hero-copy"><span className="eyebrow light">{t('movements.kicker')}</span><h1>{t('movements.title')}</h1><p>{t('movements.description')}</p><span><ShieldCheck /> {t('movements.localAudit')}</span></div>
        <div className="movements-flow-visual"><span><i>D-12</i><small>{t('movements.source')}</small></span><ArrowRight /><span><i>D-01</i><small>{t('movements.destination')}</small></span></div>
      </section>

      <section className="movement-kpis">
        <article><span><ArrowRightLeft /></span><div><small>{t('movements.records')}</small><strong>{movements.length}</strong><em>{t('movements.persistedLocal')}</em></div></article>
        <article><span><Layers3 /></span><div><small>{t('movements.receivedVolume')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(movedVolume))} L</strong><em>{t('movements.reconciled')}</em></div></article>
        <article><span><CircleGauge /></span><div><small>{t('movements.averageLoss')}</small><strong>{averageLoss.toFixed(2)}%</strong><em>{new Intl.NumberFormat(locale).format(Math.round(totalLoss))} L</em></div></article>
        <article><span><Warehouse /></span><div><small>{t('movements.emptyVessels')}</small><strong>{emptyTanks.length}</strong><em>{t('movements.availableNow')}</em></div></article>
      </section>

      {emptyTanks.length === 0 && <section className="movement-capacity-alert"><Warehouse /><span><strong>{t('movements.noFreeTitle')}</strong><small>{t('movements.noFreeText')}</small></span></section>}

      <section className="movement-action-grid">
        {(['transfer', 'split', 'merge'] as const).map((kind) => {
          const requiredVessels = kind === 'split' ? 2 : 1
          const unavailable = emptyTanks.length < requiredVessels
          return <button key={kind} disabled={unavailable} title={unavailable ? t('movements.requiresVessels', { count: requiredVessels }) : undefined} onClick={() => setOpenKind(kind)}>
            <span>{kindIcon(kind)}</span><div><small>{t(`movements.${kind}.kicker` as Parameters<typeof t>[0])}</small><strong>{t(kindKey(kind))}</strong><p>{t(`movements.${kind}.text` as Parameters<typeof t>[0])}</p>{unavailable && <em>{t('movements.requiresVessels', { count: requiredVessels })}</em>}</div><i><Plus /></i>
          </button>
        })}
      </section>

      <section className="movement-history panel">
        <header><div><span className="eyebrow">{t('movements.auditKicker')}</span><h2>{t('movements.history')}</h2><p>{t('movements.historyText')}</p></div><div className="movement-filters">{(['all', 'transfer', 'split', 'merge'] as const).map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{t(value === 'all' ? 'movements.all' : kindKey(value))}</button>)}</div></header>
        <div className="movement-list">
          {visibleMovements.map((movement) => (
            <article key={movement.id}>
              <span className={`movement-kind ${movement.kind}`}>{kindIcon(movement.kind)}</span>
              <div className="movement-identity"><small>{movement.code} · {t(kindKey(movement.kind))}</small><strong>{movement.sourceLegs.map((leg) => leg.lotName).join(' + ')}</strong><em>{movement.operator} · {new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(movement.performedAt))}</em></div>
              <div className="movement-route"><span>{movement.sourceLegs.map((leg) => leg.vesselId).join(' + ')}</span><ArrowRight /><span>{movement.destinationLegs.map((leg) => leg.vesselId).join(' + ')}</span></div>
              <div className="movement-volume"><strong>{new Intl.NumberFormat(locale).format(Math.round(movement.receivedVolume))} L</strong><small>{t('movements.lossValue', { value: new Intl.NumberFormat(locale).format(Math.round(movement.lossVolume)), percent: movement.lossPercentage.toFixed(2) })}</small></div>
              <Check />
            </article>
          ))}
        </div>
      </section>

      {openKind && <MovementSheet kind={openKind} lots={activeLots} tanks={tanks} onClose={() => setOpenKind(null)} onTransfer={(input) => { onTransfer(input); setOpenKind(null) }} onSplit={(input) => { onSplit(input); setOpenKind(null) }} onMerge={(input) => { onMerge(input); setOpenKind(null) }} />}
    </main>
  )
}

function MovementSheet({ kind, lots, tanks, onClose, onTransfer, onSplit, onMerge }: {
  kind: WineMovementKind
  lots: WineLot[]
  tanks: Tank[]
  onClose: () => void
  onTransfer: (input: NewTransferInput) => void
  onSplit: (input: NewSplitInput) => void
  onMerge: (input: NewMergeInput) => void
}) {
  const { t, locale } = useLanguage()
  const emptyTanks = tanks.filter((tank) => !tank.lot && tank.volume === 0)
  const [performedAt, setPerformedAt] = useState(nowForInput)
  const [operator, setOperator] = useState(getCurrentOperatorName())
  const [notes, setNotes] = useState('')
  const [sourceId, setSourceId] = useState(lots[0]?.id ?? '')
  const source = lots.find((lot) => lot.id === sourceId)
  const [destinationId, setDestinationId] = useState(emptyTanks[0]?.id ?? '')
  const [loss, setLoss] = useState('0')
  const [splitTankOne, setSplitTankOne] = useState(emptyTanks[0]?.id ?? '')
  const [splitTankTwo, setSplitTankTwo] = useState(emptyTanks[1]?.id ?? '')
  const [splitVolumeOne, setSplitVolumeOne] = useState('')
  const [splitVolumeTwo, setSplitVolumeTwo] = useState('')
  const [mergeSourceTwo, setMergeSourceTwo] = useState('')
  const [mergeVolumeOne, setMergeVolumeOne] = useState('')
  const [mergeVolumeTwo, setMergeVolumeTwo] = useState('')
  const [mergeName, setMergeName] = useState('')
  const [error, setError] = useState(false)

  const compatibleLots = useMemo(() => {
    if (!source) return []
    const sourceStage = source.process.find((stage) => stage.status === 'current')?.id
    return lots.filter((lot) => lot.id !== source.id && lot.type === source.type && lot.vintage === source.vintage
      && lot.process.find((stage) => stage.status === 'current')?.id === sourceStage
      && (source.type !== 'rosado' || lot.productionDetails?.rose?.method === source.productionDetails?.rose?.method))
  }, [lots, source])
  const secondSource = compatibleLots.find((lot) => lot.id === mergeSourceTwo)
  const lossVolume = numeric(loss)
  const splitAllocated = numeric(splitVolumeOne) + numeric(splitVolumeTwo)
  const splitRemaining = Math.max(0, (source?.volume ?? 0) - splitAllocated - lossVolume)
  const mergeGross = numeric(mergeVolumeOne) + numeric(mergeVolumeTwo)
  const expectedReceived = kind === 'transfer' ? Math.max(0, (source?.volume ?? 0) - lossVolume) : kind === 'merge' ? Math.max(0, mergeGross - lossVolume) : splitAllocated

  const selectSource = (lotId: string) => {
    setSourceId(lotId)
    setMergeSourceTwo('')
    setMergeVolumeOne('')
    setMergeVolumeTwo('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(false)
    try {
      const common = { performedAt: new Date(performedAt).toISOString(), operator, notes, lossVolume }
      if (kind === 'transfer') onTransfer({ ...common, lotId: sourceId, destinationTankId: destinationId })
      if (kind === 'split') onSplit({ ...common, lotId: sourceId, destinations: [{ tankId: splitTankOne, volume: numeric(splitVolumeOne) }, { tankId: splitTankTwo, volume: numeric(splitVolumeTwo) }] })
      if (kind === 'merge') onMerge({ ...common, sources: [{ lotId: sourceId, volume: numeric(mergeVolumeOne) }, { lotId: mergeSourceTwo, volume: numeric(mergeVolumeTwo) }], destinationTankId: destinationId, name: mergeName })
    } catch { setError(true) }
  }

  return (
    <div className="movement-sheet-layer" role="dialog" aria-modal="true" aria-label={t(kindKey(kind))}>
      <form className="movement-sheet" onSubmit={submit} noValidate>
        <header><span>{kindIcon(kind)}</span><div><small>{t(`movements.${kind}.kicker` as Parameters<typeof t>[0])}</small><h2>{t(kindKey(kind))}</h2><p>{t(`movements.${kind}.formText` as Parameters<typeof t>[0])}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header>
        <div className="movement-sheet-body">
          <div className="movement-form-grid">
            <label className="wide"><span>{t(kind === 'merge' ? 'movements.firstSource' : 'movements.sourceLot')}</span><select value={sourceId} onChange={(event) => selectSource(event.target.value)} required>{lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.name} · {lot.vessel} · {new Intl.NumberFormat(locale).format(lot.volume)} L</option>)}</select></label>

            {kind === 'transfer' && <label className="wide"><span>{t('movements.destinationVessel')}</span><select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required><option value="">{t('movements.selectVessel')}</option>{emptyTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {new Intl.NumberFormat(locale).format(tank.capacity)} L</option>)}</select></label>}

            {kind === 'split' && <>
              <div className="movement-allocation wide"><span><i>01</i><strong>{t('movements.firstFraction')}</strong></span><select value={splitTankOne} onChange={(event) => setSplitTankOne(event.target.value)} required>{emptyTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {new Intl.NumberFormat(locale).format(tank.capacity)} L</option>)}</select><div className="unit-input"><input inputMode="decimal" value={splitVolumeOne} onChange={(event) => setSplitVolumeOne(event.target.value)} required /><em>L</em></div></div>
              <div className="movement-allocation wide"><span><i>02</i><strong>{t('movements.secondFraction')}</strong></span><select value={splitTankTwo} onChange={(event) => setSplitTankTwo(event.target.value)} required>{emptyTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {new Intl.NumberFormat(locale).format(tank.capacity)} L</option>)}</select><div className="unit-input"><input inputMode="decimal" value={splitVolumeTwo} onChange={(event) => setSplitVolumeTwo(event.target.value)} required /><em>L</em></div></div>
            </>}

            {kind === 'merge' && <>
              <label><span>{t('movements.firstSourceVolume')}</span><div className="unit-input"><input inputMode="decimal" value={mergeVolumeOne} onChange={(event) => setMergeVolumeOne(event.target.value)} placeholder={source ? String(Math.round(source.volume)) : ''} required /><em>L</em></div></label>
              <label><span>{t('movements.secondSource')}</span><select value={mergeSourceTwo} onChange={(event) => setMergeSourceTwo(event.target.value)} required><option value="">{t('movements.selectCompatible')}</option>{compatibleLots.map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.name} · {lot.vessel}</option>)}</select></label>
              <label><span>{t('movements.secondSourceVolume')}</span><div className="unit-input"><input inputMode="decimal" value={mergeVolumeTwo} onChange={(event) => setMergeVolumeTwo(event.target.value)} placeholder={secondSource ? String(Math.round(secondSource.volume)) : ''} required /><em>L</em></div></label>
              <label><span>{t('movements.destinationVessel')}</span><select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} required><option value="">{t('movements.selectVessel')}</option>{emptyTanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.id} · {new Intl.NumberFormat(locale).format(tank.capacity)} L</option>)}</select></label>
              <label className="wide"><span>{t('movements.mergedName')}</span><input value={mergeName} onChange={(event) => setMergeName(event.target.value)} placeholder={t('movements.mergedNamePlaceholder')} required /></label>
            </>}

            <label><span>{t('movements.declaredLoss')}</span><div className="unit-input"><input inputMode="decimal" value={loss} onChange={(event) => setLoss(event.target.value)} required /><em>L</em></div></label>
            <label><span>{t('redEngine.performedAt')}</span><input type="datetime-local" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
            <label><span>{t('redEngine.operator')}</span><input value={operator} onChange={(event) => setOperator(event.target.value)} required /></label>
            <label className="wide"><span>{t('redEngine.notes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('movements.notesPlaceholder')} /></label>
          </div>

          <div className="movement-reconciliation">
            <span><small>{t('movements.sourceBefore')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(kind === 'merge' ? mergeGross : source?.volume ?? 0))} L</strong></span><ArrowRight />
            <span><small>{t(kind === 'split' ? 'movements.allocated' : 'movements.expectedDestination')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(expectedReceived))} L</strong></span><i />
            <span><small>{t('movements.declaredLoss')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(lossVolume))} L</strong></span>
            {kind === 'split' && <span><small>{t('movements.sourceRemaining')}</small><strong>{new Intl.NumberFormat(locale).format(Math.round(splitRemaining))} L</strong></span>}
          </div>
          <div className="movement-local-notice"><ShieldCheck /><span><strong>{t('movements.atomicLocal')}</strong><small>{t('movements.atomicLocalText')}</small></span></div>
          {error && <p className="form-error">{t('movements.formError')}</p>}
        </div>
        <footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button type="submit" className="primary-button"><Check /> {t('movements.confirm')}</button></footer>
      </form>
    </div>
  )
}
