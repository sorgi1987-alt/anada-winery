import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, Beaker, Check, ChevronRight, ClipboardCheck, FileText, FlaskConical, PackageCheck, Plus, Search, ShieldAlert, Truck, X } from 'lucide-react'
import { useLanguage } from './i18n'
import { effectiveProductLotStatus } from './domain'
import type { NewProductLotInput, NewProductMasterInput, NewSupplierInput, ProductCategory, ProductLot, ProductLotStatus, ProductMaster, ProductStockTransaction, ProductUnit, Supplier } from './types'

type View = 'lots' | 'products' | 'suppliers'

interface SuppliesPageProps {
  suppliers: Supplier[]
  products: ProductMaster[]
  lots: ProductLot[]
  transactions: ProductStockTransaction[]
  onReceive: (input: NewProductLotInput) => void
  onCreateProduct: (input: NewProductMasterInput) => void
  onCreateSupplier: (input: NewSupplierInput) => void
  onStatus: (lotId: string, status: Extract<ProductLotStatus, 'approved' | 'rejected' | 'recalled'>, notes: string) => void
}

const statusKey = {
  quarantine: 'supplies.status.quarantine', approved: 'supplies.status.approved', rejected: 'supplies.status.rejected', expired: 'supplies.status.expired', recalled: 'supplies.status.recalled',
} as const satisfies Record<ProductLotStatus, string>

const categoryKey = {
  yeast: 'supplies.category.yeast', nutrient: 'supplies.category.nutrient', enzyme: 'supplies.category.enzyme', sulphur: 'supplies.category.sulphur', acid: 'supplies.category.acid', fining: 'supplies.category.fining', stabilisation: 'supplies.category.stabilisation', filtration: 'supplies.category.filtration', cleaning: 'supplies.category.cleaning',
} as const satisfies Record<ProductMaster['category'], string>

export function SuppliesPage({ suppliers, products, lots, transactions, onReceive, onCreateProduct, onCreateSupplier, onStatus }: SuppliesPageProps) {
  const { t, locale } = useLanguage()
  const [view, setView] = useState<View>('lots')
  const [query, setQuery] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const selectedLot = lots.find((lot) => lot.id === selectedLotId)
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const supplierById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers])
  const normalized = query.trim().toLowerCase()
  const visibleLots = lots.filter((lot) => {
    const product = productById.get(lot.productId)
    const supplier = supplierById.get(lot.supplierId)
    return !normalized || [lot.code, lot.supplierLot, lot.location, product?.name, supplier?.name].some((value) => value?.toLowerCase().includes(normalized))
  })
  const quarantined = lots.filter((lot) => effectiveProductLotStatus(lot) === 'quarantine').length
  const approvedLots = lots.filter((lot) => effectiveProductLotStatus(lot) === 'approved').length

  const openPrimaryAction = () => view === 'lots' ? setReceiving(true) : view === 'products' ? setCreatingProduct(true) : setCreatingSupplier(true)
  const primaryActionLabel = view === 'lots' ? t('supplies.receive') : view === 'products' ? t('supplies.newProduct') : t('supplies.newSupplier')

  return <main className="page-content supplies-page">
    <header className="page-header"><div><span className="eyebrow">{t('supplies.kicker')}</span><h1>{t('supplies.title')}</h1><p>{t('supplies.description')}</p></div><div className="page-header-action"><button className="primary-button" onClick={openPrimaryAction}><Plus /> {primaryActionLabel}</button></div></header>
    <section className="supplies-hero"><div><span className="supplies-hero-mark"><FlaskConical /></span><h2>{t('supplies.heroTitle')}</h2><p>{t('supplies.heroText')}</p></div><aside><ClipboardCheck /><span><strong>{t('supplies.localRegister')}</strong><small>{t('supplies.localRegisterText')}</small></span></aside></section>
    <section className="supplies-metrics">
      <Metric icon={<PackageCheck />} value={String(lots.length)} label={t('supplies.receivedLots')} detail={t('supplies.traceableLots')} />
      <Metric icon={<ShieldAlert />} value={String(quarantined)} label={t('supplies.quarantine')} detail={t('supplies.awaitingReview')} attention={quarantined > 0} />
      <Metric icon={<Beaker />} value={String(approvedLots)} label={t('supplies.approvedStock')} detail={t('supplies.approvedLots')} />
      <Metric icon={<Truck />} value={String(suppliers.filter((supplier) => supplier.status === 'active').length)} label={t('supplies.activeSuppliers')} detail={t('supplies.approvedSources')} />
    </section>
    <div className="supplies-toolbar"><div className="segmented-control">{(['lots', 'products', 'suppliers'] as View[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{t(`supplies.tab.${item}`)}</button>)}</div><label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('supplies.search')} /></label></div>
    {view === 'lots' && <section className="input-lot-grid">{visibleLots.map((lot) => {
      const product = productById.get(lot.productId)
      const supplier = supplierById.get(lot.supplierId)
      const percentage = lot.quantityReceived ? lot.quantityOnHand / lot.quantityReceived * 100 : 0
      const effectiveStatus = effectiveProductLotStatus(lot)
      return <button key={lot.id} className={`input-lot-card ${effectiveStatus}`} onClick={() => setSelectedLotId(lot.id)}><header><span className={`input-status ${effectiveStatus}`}>{t(statusKey[effectiveStatus])}</span><small>{lot.code}</small></header><div className="input-lot-icon"><FlaskConical /></div><h3>{product?.name}</h3><p>{supplier?.name} · {lot.supplierLot}</p><div className="input-lot-stock"><span><small>{t('supplies.onHand')}</small><strong>{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(lot.quantityOnHand)} {lot.unit}</strong></span><span><small>{t('supplies.location')}</small><strong>{lot.location}</strong></span></div><div className="input-stock-bar"><i style={{ width: `${percentage}%` }} /></div><footer><span>{lot.expiresAt ? t('supplies.expires', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${lot.expiresAt}T12:00:00`)) }) : t('supplies.noExpiry')}</span><ChevronRight /></footer></button>
    })}</section>}
    {view === 'products' && <section className="master-grid">{products.filter((product) => !normalized || [product.code, product.name, product.manufacturer].some((value) => value.toLowerCase().includes(normalized))).map((product) => <article key={product.id} className="master-card"><span className="master-icon"><Beaker /></span><div><small>{product.code} · {t(categoryKey[product.category])}</small><h3>{product.name}</h3><p>{product.manufacturer}</p></div><dl><div><dt>{t('supplies.unit')}</dt><dd>{product.defaultUnit}</dd></div><div><dt>{t('supplies.storage')}</dt><dd>{product.storageInstructions}</dd></div></dl><footer>{product.technicalSheetRef && <span><FileText /> {product.technicalSheetRef}</span>}{product.safetySheetRef && <span><AlertTriangle /> {product.safetySheetRef}</span>}</footer></article>)}</section>}
    {view === 'suppliers' && <section className="master-grid suppliers">{suppliers.filter((supplier) => !normalized || [supplier.code, supplier.name, supplier.contactName].some((value) => value.toLowerCase().includes(normalized))).map((supplier) => <article key={supplier.id} className="master-card supplier-card"><span className="master-icon"><Truck /></span><div><small>{supplier.code} · {supplier.taxId}</small><h3>{supplier.name}</h3><p>{supplier.contactName}</p></div><dl><div><dt>{t('supplies.contact')}</dt><dd>{supplier.email}</dd></div><div><dt>{t('supplies.statusLabel')}</dt><dd className={supplier.status}>{t(`supplies.supplier.${supplier.status}`)}</dd></div></dl></article>)}</section>}
    {receiving && <ReceiveLotSheet products={products} suppliers={suppliers} onClose={() => setReceiving(false)} onSave={(input) => { onReceive(input); setReceiving(false) }} />}
    {creatingProduct && <ProductSheet onClose={() => setCreatingProduct(false)} onSave={(input) => { onCreateProduct(input); setCreatingProduct(false) }} />}
    {creatingSupplier && <SupplierSheet onClose={() => setCreatingSupplier(false)} onSave={(input) => { onCreateSupplier(input); setCreatingSupplier(false) }} />}
    {selectedLot && <LotDrawer lot={selectedLot} product={productById.get(selectedLot.productId)} supplier={supplierById.get(selectedLot.supplierId)} transactions={transactions.filter((transaction) => transaction.productLotId === selectedLot.id)} onClose={() => setSelectedLotId(null)} onStatus={(status, notes) => { onStatus(selectedLot.id, status, notes); setSelectedLotId(null) }} />}
  </main>
}

const productCategories: ProductCategory[] = ['yeast', 'nutrient', 'enzyme', 'sulphur', 'acid', 'fining', 'stabilisation', 'filtration', 'cleaning']
const productUnits: ProductUnit[] = ['kg', 'g', 'L', 'mL', 'units']

function SupplierSheet({ onClose, onSave }: { onClose: () => void; onSave: (input: NewSupplierInput) => void }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState<NewSupplierInput>({ name: '', taxId: '', contactName: '', email: '', phone: '', notes: '' })
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); try { onSave(draft) } catch (reason) { setError(reason instanceof Error ? reason.message : t('supplies.formError')) } }
  return <div className="movement-sheet-layer" role="dialog" aria-modal="true" aria-label={t('supplies.supplierTitle')} onMouseDown={onClose}><form className="movement-sheet supply-sheet" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><span><Truck /></span><div><small>{t('supplies.supplierKicker')}</small><h2>{t('supplies.supplierTitle')}</h2><p>{t('supplies.supplierText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header><div className="movement-sheet-body"><div className="movement-form-grid supply-form-grid">
    <label className="wide"><span>{t('supplies.supplierName')}</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
    <label><span>{t('supplies.taxId')}</span><input required value={draft.taxId} onChange={(event) => setDraft({ ...draft, taxId: event.target.value })} /></label>
    <label><span>{t('supplies.contactName')}</span><input required value={draft.contactName} onChange={(event) => setDraft({ ...draft, contactName: event.target.value })} /></label>
    <label><span>{t('supplies.email')}</span><input required type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
    <label><span>{t('supplies.phone')}</span><input type="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
    <label className="wide"><span>{t('supplies.notes')}</span><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
  </div>{error && <p className="form-error"><AlertTriangle /> {error}</p>}</div><footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><Truck /> {t('supplies.saveSupplier')}</button></footer></form></div>
}

function ProductSheet({ onClose, onSave }: { onClose: () => void; onSave: (input: NewProductMasterInput) => void }) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState<NewProductMasterInput>({ name: '', category: 'yeast', manufacturer: '', defaultUnit: 'kg', storageInstructions: '', technicalSheetRef: '', safetySheetRef: '' })
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); try { onSave(draft) } catch (reason) { setError(reason instanceof Error ? reason.message : t('supplies.formError')) } }
  return <div className="movement-sheet-layer" role="dialog" aria-modal="true" aria-label={t('supplies.productTitle')} onMouseDown={onClose}><form className="movement-sheet supply-sheet" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><span><Beaker /></span><div><small>{t('supplies.productKicker')}</small><h2>{t('supplies.productTitle')}</h2><p>{t('supplies.productText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header><div className="movement-sheet-body"><div className="movement-form-grid supply-form-grid">
    <label className="wide"><span>{t('supplies.productName')}</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
    <label><span>{t('supplies.category')}</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ProductCategory })}>{productCategories.map((category) => <option key={category} value={category}>{t(categoryKey[category])}</option>)}</select></label>
    <label><span>{t('supplies.manufacturer')}</span><input required value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} /></label>
    <label><span>{t('supplies.defaultUnit')}</span><select value={draft.defaultUnit} onChange={(event) => setDraft({ ...draft, defaultUnit: event.target.value as ProductUnit })}>{productUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>
    <label><span>{t('supplies.storageInstructions')}</span><input required value={draft.storageInstructions} onChange={(event) => setDraft({ ...draft, storageInstructions: event.target.value })} /></label>
    <label><span>{t('supplies.technicalSheet')}</span><input value={draft.technicalSheetRef} onChange={(event) => setDraft({ ...draft, technicalSheetRef: event.target.value })} /></label>
    <label><span>{t('supplies.safetySheet')}</span><input value={draft.safetySheetRef} onChange={(event) => setDraft({ ...draft, safetySheetRef: event.target.value })} /></label>
  </div>{error && <p className="form-error"><AlertTriangle /> {error}</p>}</div><footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><Beaker /> {t('supplies.saveProduct')}</button></footer></form></div>
}

function Metric({ icon, value, label, detail, attention = false }: { icon: ReactNode; value: string; label: string; detail: string; attention?: boolean }) {
  return <article className={attention ? 'attention' : ''}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>
}

function ReceiveLotSheet({ products, suppliers, onClose, onSave }: { products: ProductMaster[]; suppliers: Supplier[]; onClose: () => void; onSave: (input: NewProductLotInput) => void }) {
  const { t } = useLanguage()
  const activeProducts = products.filter((product) => product.active)
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active')
  const [draft, setDraft] = useState<NewProductLotInput>({ productId: activeProducts[0]?.id ?? '', supplierId: activeSuppliers[0]?.id ?? '', supplierLot: '', receivedAt: new Date().toISOString().slice(0, 16), expiresAt: '', quantity: 0, unit: activeProducts[0]?.defaultUnit ?? 'kg', location: '', certificateRef: '', notes: '' })
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); try { onSave(draft) } catch (reason) { setError(reason instanceof Error ? reason.message : t('supplies.formError')) } }
  const chooseProduct = (productId: string) => { const product = products.find((item) => item.id === productId); setDraft((current) => ({ ...current, productId, unit: product?.defaultUnit ?? current.unit })) }
  return <div className="movement-sheet-layer" role="dialog" aria-modal="true" aria-label={t('supplies.receiptTitle')} onMouseDown={onClose}><form className="movement-sheet supply-sheet" onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><span><PackageCheck /></span><div><small>{t('supplies.receiptKicker')}</small><h2>{t('supplies.receiptTitle')}</h2><p>{t('supplies.receiptText')}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('common.close')}><X /></button></header><div className="movement-sheet-body"><div className="movement-form-grid supply-form-grid">
    <label><span>{t('supplies.product')}</span><select value={draft.productId} onChange={(event) => chooseProduct(event.target.value)}>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</select></label>
    <label><span>{t('supplies.supplier')}</span><select value={draft.supplierId} onChange={(event) => setDraft({ ...draft, supplierId: event.target.value })}>{activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} · {supplier.name}</option>)}</select></label>
    <label><span>{t('supplies.supplierLot')}</span><input required value={draft.supplierLot} onChange={(event) => setDraft({ ...draft, supplierLot: event.target.value })} /></label>
    <label><span>{t('supplies.receivedAt')}</span><input required type="datetime-local" value={draft.receivedAt} onChange={(event) => setDraft({ ...draft, receivedAt: event.target.value })} /></label>
    <label><span>{t('supplies.quantity')}</span><div className="supply-unit-input"><input required type="number" min="0.001" step="0.001" value={draft.quantity || ''} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} /><i>{draft.unit}</i></div></label>
    <label><span>{t('supplies.expiry')}</span><input type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} /></label>
    <label className="wide"><span>{t('supplies.location')}</span><input required value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder={t('supplies.locationPlaceholder')} /></label>
    <label><span>{t('supplies.certificate')}</span><input value={draft.certificateRef} onChange={(event) => setDraft({ ...draft, certificateRef: event.target.value })} /></label>
    <label><span>{t('supplies.notes')}</span><input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
  </div>{error && <p className="form-error"><AlertTriangle /> {error}</p>}</div><footer><button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button><button className="primary-button"><PackageCheck /> {t('supplies.saveReceipt')}</button></footer></form></div>
}

function LotDrawer({ lot, product, supplier, transactions, onClose, onStatus }: { lot: ProductLot; product?: ProductMaster; supplier?: Supplier; transactions: ProductStockTransaction[]; onClose: () => void; onStatus: (status: 'approved' | 'rejected' | 'recalled', notes: string) => void }) {
  const { t, locale } = useLanguage()
  const [notes, setNotes] = useState('')
  return <div className="drawer-scrim" onMouseDown={onClose}><aside className="supply-drawer" onMouseDown={(event) => event.stopPropagation()}><header><div><span className={`input-status ${effectiveProductLotStatus(lot)}`}>{t(statusKey[effectiveProductLotStatus(lot)])}</span><h2>{product?.name}</h2><p>{lot.code} · {lot.supplierLot}</p></div><button onClick={onClose} aria-label={t('common.close')}><X /></button></header><section className="lot-dossier"><div><small>{t('supplies.supplier')}</small><strong>{supplier?.name}</strong></div><div><small>{t('supplies.onHand')}</small><strong>{lot.quantityOnHand} {lot.unit}</strong></div><div><small>{t('supplies.location')}</small><strong>{lot.location}</strong></div><div><small>{t('supplies.certificate')}</small><strong>{lot.certificateRef || t('supplies.notLinked')}</strong></div></section><section><h3>{t('supplies.auditTrail')}</h3><div className="stock-timeline">{transactions.map((transaction) => <span key={transaction.id}><i><Check /></i><div><strong>{t(`supplies.transaction.${transaction.type}`)}</strong><small>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(transaction.occurredAt))} · {transaction.operator}</small></div><em>{transaction.quantity ? `${transaction.quantity} ${transaction.unit}` : '—'}</em></span>)}</div></section><label className="decision-notes"><span>{t('supplies.decisionNotes')}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('supplies.decisionPlaceholder')} /></label><footer>{effectiveProductLotStatus(lot) === 'quarantine' && <><button className="supply-danger-button" disabled={!notes.trim()} onClick={() => onStatus('rejected', notes)}>{t('supplies.reject')}</button><button className="primary-button" onClick={() => onStatus('approved', notes)}><Check /> {t('supplies.approve')}</button></>}{effectiveProductLotStatus(lot) === 'approved' && <button className="supply-danger-button full" disabled={!notes.trim()} onClick={() => onStatus('recalled', notes)}><ShieldAlert /> {t('supplies.recall')}</button>}</footer></aside></div>
}
