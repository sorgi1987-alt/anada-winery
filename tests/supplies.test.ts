import assert from 'node:assert/strict'
import test from 'node:test'
import { productLots, productMasters, productStockTransactions, suppliers } from '../src/data'
import { changeProductLotStatus, effectiveProductLotStatus, receiveProductLot } from '../src/domain'
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
