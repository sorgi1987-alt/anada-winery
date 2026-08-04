import assert from 'node:assert/strict'
import test from 'node:test'
import { productLots, productMasters, productStockTransactions, suppliers } from '../src/data'
import { changeProductLotStatus, createProductMaster, createSupplier, effectiveProductLotStatus, receiveProductLot } from '../src/domain'
import { migrateLegacyState } from '../src/store'

test('a receipt creates one quarantined physical lot and one stock transaction', () => {
  const result = receiveProductLot({
    productId: productMasters[0].id,
    supplierId: suppliers[0].id,
    supplierLot: 'LA-TEST-001',
    receivedAt: '2026-08-04T09:00',
    expiresAt: '2028-08-04',
    quantity: 10,
    unit: 'kg',
    location: 'Almacén seco · A-09',
    certificateRef: 'COA-LA-TEST-001',
    notes: 'Envases íntegros.',
  }, productMasters, suppliers, productLots, productStockTransactions)

  assert.equal(result.lot.status, 'quarantine')
  assert.equal(result.lot.quantityReceived, 10)
  assert.equal(result.lot.quantityOnHand, 10)
  assert.equal(result.transaction.type, 'receipt')
  assert.equal(result.transaction.productLotId, result.lot.id)
})

test('receipts reject duplicate supplier lots, blocked suppliers and mismatched units', () => {
  const base = { productId: productMasters[0].id, supplierId: suppliers[0].id, supplierLot: productLots[0].supplierLot, receivedAt: '2026-08-04T09:00', quantity: 10, unit: 'kg' as const, location: 'A-09', notes: '' }
  assert.throws(() => receiveProductLot(base, productMasters, suppliers, productLots, productStockTransactions), /already exists/)
  assert.throws(() => receiveProductLot({ ...base, supplierLot: 'NEW', supplierId: 'blocked' }, productMasters, [...suppliers, { ...suppliers[0], id: 'blocked', status: 'blocked' }], productLots, productStockTransactions), /active supplier/)
  assert.throws(() => receiveProductLot({ ...base, supplierLot: 'NEW', unit: 'L' }, productMasters, suppliers, productLots, productStockTransactions), /match the product master/)
})

test('release and recall remain separate attributed stock events', () => {
  const quarantined = productLots.find((lot) => lot.status === 'quarantine')!
  const released = changeProductLotStatus(productLots, productStockTransactions, quarantined.id, 'approved', 'Documentación revisada.')
  assert.equal(released.lot.status, 'approved')
  assert.equal(released.transaction.type, 'release')
  assert.ok(released.lot.releasedAt)

  const recalled = changeProductLotStatus(released.lots, released.transactions, quarantined.id, 'recalled', 'Retirada preventiva.')
  assert.equal(recalled.lot.status, 'recalled')
  assert.equal(recalled.transaction.type, 'recall')
  assert.equal(recalled.lot.quantityOnHand, quarantined.quantityOnHand)
  assert.throws(() => changeProductLotStatus(recalled.lots, recalled.transactions, quarantined.id, 'approved', ''), /cannot be released/)
  assert.throws(() => changeProductLotStatus(productLots, productStockTransactions, quarantined.id, 'rejected', ''), /reason is required/)
})

test('the v16 migration adds supply masters and lots without changing legacy wine records', () => {
  const legacyLot = { id: 'LEGACY-LOT' }
  const migrated = migrateLegacyState({ schemaVersion: 15, lots: [legacyLot], tasks: [], tanks: [] })
  assert.equal(migrated?.schemaVersion, 16)
  assert.equal(migrated?.lots[0], legacyLot)
  assert.ok(migrated?.suppliers.length)
  assert.ok(migrated?.productMasters.length)
  assert.ok(migrated?.productLots.length)
  assert.ok(migrated?.productStockTransactions.every((transaction) => transaction.type === 'receipt'))
})

test('expired approved or quarantined lots are unavailable without overwriting their recorded status', () => {
  const lot = { ...productLots[0], status: 'approved' as const, expiresAt: '2026-01-01' }
  assert.equal(effectiveProductLotStatus(lot, '2026-08-04'), 'expired')
  assert.equal(lot.status, 'approved')
})

test('suppliers are created as separate active master records with unique fiscal identity', () => {
  const result = createSupplier({ name: 'Bodega Técnica Rioja', taxId: 'B12345678', contactName: 'Lucía Pérez', email: 'COMPRAS@BTR.ES', phone: '941000000', notes: '' }, suppliers)
  assert.equal(result.supplier.status, 'active')
  assert.equal(result.supplier.email, 'compras@btr.es')
  assert.match(result.supplier.code, /^PROV-\d{3}$/)
  assert.equal(result.suppliers[0], result.supplier)
  assert.throws(() => createSupplier({ name: 'Otra razón social', taxId: suppliers[0].taxId.toLowerCase(), contactName: 'Ana', email: 'ana@example.com', phone: '', notes: '' }, suppliers), /tax ID already exists/)
})

test('product masters are created separately from physical stock lots', () => {
  const result = createProductMaster({ name: 'Levadura Test', category: 'yeast', manufacturer: 'Ensayos Rioja', defaultUnit: 'kg', storageInstructions: 'Conservar en frío', technicalSheetRef: 'FT-001', safetySheetRef: '' }, productMasters)
  assert.equal(result.product.active, true)
  assert.equal(result.product.category, 'yeast')
  assert.match(result.product.code, /^PROD-\d{3}$/)
  assert.equal(productLots.some((lot) => lot.productId === result.product.id), false)
  assert.throws(() => createProductMaster({ name: result.product.name.toLowerCase(), category: 'yeast', manufacturer: result.product.manufacturer.toUpperCase(), defaultUnit: 'kg', storageInstructions: 'Frío' }, result.products), /already exists/)
})
