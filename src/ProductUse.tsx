import { useMemo, useState, type FormEvent } from 'react'
import { getCurrentOperatorName } from './operator'
import { AlertTriangle, Beaker, CheckCircle2, Clock3, FlaskConical, PackageCheck, Plus, ShieldCheck, X } from 'lucide-react'
import { effectiveProductLotStatus } from './domain'
import { useLanguage } from './i18n'
import type { NewProductConsumptionInput, ProductLot, ProductMaster, ProductStockTransaction, WineLot } from './types'

const nowForInput = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function ProductUsePanel({ wineLot, products, productLots, transactions, onConsume }: {
  wineLot: WineLot
  products: ProductMaster[]
  productLots: ProductLot[]
  transactions: ProductStockTransaction[]
  onConsume: (input: NewProductConsumptionInput) => void
}) {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const availableLots = productLots.filter((lot) => effectiveProductLotStatus(lot) === 'approved' && lot.quantityOnHand > 0 && productById.get(lot.productId)?.active)
  const history = transactions.filter((transaction) => transaction.type === 'consumption' && transaction.wineLotId === wineLot.id)
  const totalProducts = new Set(history.map((transaction) => productLots.find((lot) => lot.id === transaction.productLotId)?.productId).filter(Boolean)).size

  return <section className="product-use-panel panel">
    <header><div><span className="product-use-mark"><FlaskConical /></span><span><small>{t('productUse.kicker')}</small><strong>{t('productUse.title')}</strong><em>{t('productUse.description')}</em></span></div><button className="primary-button" disabled={!availableLots.length} onClick={() => setOpen(true)}><Plus /> {t('productUse.register')}</button></header>
    <div className="product-use-summary"><span><ShieldCheck /><small>{t('productUse.availableLots')}</small><strong>{availableLots.length}</strong></span><span><Beaker /><small>{t('productUse.productsUsed')}</small><strong>{totalProducts}</strong></span><span><PackageCheck /><small>{t('productUse.recordedUses')}</small><strong>{history.length}</strong></span></div>
    <div className="product-use-history">{history.slice(0, 4).map((transaction) => { const lot = productLots.find((item) => item.id === transaction.productLotId); const product = lot && productById.get(lot.productId); return <article key={transaction.id}><span><CheckCircle2 /></span><div><strong>{product?.name ?? lot?.code}</strong><small>{lot?.code} · {lot?.supplierLot}</small></div><em>{new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(transaction.quantity)} {transaction.unit}</em><time><Clock3 /> {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(transaction.occurredAt))}</time></article> })}{!history.length && <div className="product-use-empty"><Beaker /><span><strong>{t('productUse.noUses')}</strong><small>{t('productUse.noUsesText')}</small></span></div>}</div>
    {!availableLots.length && <p className="product-use-warning"><AlertTriangle /> {t('productUse.noApprovedStock')}</p>}
    {open && <ProductUseSheet wineLot={wineLot} products={productById} productLots={availableLots} onClose={() => setOpen(false)} onSave={(input) => { onConsume(input); setOpen(false) }} />}
  </section>
}

function ProductUseSheet({ wineLot, products, productLots, onClose, onSave }: {
  wineLot: WineLot
  products: Map<string, ProductMaster>
  productLots: ProductLot[]
  onClose: () => void
  onSave: (input: NewProductConsumptionInput) => void
}) {
  const { t, locale } = useLanguage()
  const [draft, setDraft] = useState<NewProductConsumptionInput>({ productLotId: productLots[0]?.id ?? '', wineLotId: wineLot.id, quantity: 0, performedAt: nowForInput(), operator: getCurrentOperatorName(), notes: '' })
  const [error, setError] = useState('')
  const selected = productLots.find((lot) => lot.id === draft.productLotId)
  const product = selected && products.get(selected.productId)
  const submit = (event: FormEvent) => { event.preventDefault(); try { onSave({ ...draft, performedAt: new Date(draft.performedAt).toISOString() }) } catch (reason) { setError(reason instanceof Error ? reason.message : t('productUse.formError')) } }

  return <div className="movement-sheet-layer" role="dialog" aria-modal="true" aria-label={t('productUse.sheetTitle')} onMouseDown={onClose}><form className="movement-sheet product-use-sheet" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><span><FlaskConical /></span><div><small>{wineLot.id} · {t('productUse.kicker')}</small><h2>{t('productUse.sheetTitle')}</h2><p>{t('productUse.sheetText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header><div className="movement-sheet-body">
    <div className="product-use-context"><span><small>{t('productUse.targetWine')}</small><strong>{wineLot.name}</strong><em>{wineLot.id} · {wineLot.vessel}</em></span><span><small>{t('detail.currentStage')}</small><strong>{wineLot.stage}</strong><em>{new Intl.NumberFormat(locale).format(wineLot.volume)} L</em></span></div>
    <div className="movement-form-grid">
      <label className="wide"><span>{t('productUse.productLot')}</span><select value={draft.productLotId} onChange={(event) => setDraft({ ...draft, productLotId: event.target.value, quantity: 0 })}>{productLots.map((lot) => <option key={lot.id} value={lot.id}>{lot.code} · {products.get(lot.productId)?.name} · {lot.quantityOnHand} {lot.unit}</option>)}</select></label>
      <label><span>{t('productUse.quantity')}</span><div className="supply-unit-input"><input required type="number" min="0.001" max={selected?.quantityOnHand} step="0.001" value={draft.quantity || ''} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} /><i>{selected?.unit}</i></div></label>
      <label><span>{t('productUse.performedAt')}</span><input required type="datetime-local" value={draft.performedAt} onChange={(event) => setDraft({ ...draft, performedAt: event.target.value })} /></label>
      <label className="wide"><span>{t('productUse.operator')}</span><input required value={draft.operator} onChange={(event) => setDraft({ ...draft, operator: event.target.value })} /></label>
      <label className="wide"><span>{t('productUse.notes')}</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={t('productUse.notesPlaceholder')} /></label>
    </div>
    {selected && <div className="product-lot-preview"><span><small>{t('productUse.selectedProduct')}</small><strong>{product?.name}</strong><em>{selected.code} · {selected.supplierLot}</em></span><span><small>{t('productUse.stockBefore')}</small><strong>{selected.quantityOnHand} {selected.unit}</strong><em>{selected.location}</em></span><span><small>{t('productUse.stockAfter')}</small><strong>{Math.max(0, selected.quantityOnHand - draft.quantity).toLocaleString(locale, { maximumFractionDigits: 3 })} {selected.unit}</strong><em>{selected.expiresAt ?? t('supplies.noExpiry')}</em></span></div>}
    <div className="red-local-notice"><ShieldCheck /><span><strong>{t('productUse.atomicRecord')}</strong><small>{t('productUse.atomicRecordText')}</small></span></div>
    {error && <p className="form-error"><AlertTriangle /> {error}</p>}
  </div><footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><PackageCheck /> {t('productUse.confirm')}</button></footer></form></div>
}
