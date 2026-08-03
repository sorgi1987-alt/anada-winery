import assert from 'node:assert/strict'
import test from 'node:test'
import QRCode from 'qrcode'
import { barrels, bottlingOrders, deliveries, lots, parcels, tanks } from '../src/data'
import { buildScannerRegistry, parseScanPayload, resolveScanCode, scanPayload, searchScannerRegistry } from '../src/scanRegistry'

const registry = buildScannerRegistry({ lots, tanks, barrels, parcels, deliveries, bottlingOrders })

test('scanner registry covers the physical and traceable cellar identifiers', () => {
  const types = new Set(registry.map((entity) => entity.type))
  assert.deepEqual([...types].sort(), ['barrel', 'bottling', 'delivery', 'lot', 'parcel', 'vessel'])
  assert.ok(registry.length >= lots.length + tanks.length + barrels.length)
})

test('encoded labels resolve one exact typed entity without guessing', () => {
  const lot = registry.find((entity) => entity.type === 'lot')!
  const payload = scanPayload(lot)
  assert.deepEqual(parseScanPayload(payload), { type: 'lot', code: lot.code })
  assert.deepEqual(resolveScanCode(payload.toLowerCase(), registry).map((entity) => entity.key), [lot.key])
})

test('manual lookup accepts existing raw codes and exposes ambiguity', () => {
  const vessel = registry.find((entity) => entity.type === 'vessel' && entity.lotId)!
  assert.ok(resolveScanCode(vessel.code, registry).some((entity) => entity.key === vessel.key))
  const duplicated = [...registry, { ...vessel, key: 'parcel:duplicate', type: 'parcel' as const }]
  assert.equal(resolveScanCode(vessel.code, duplicated).length, 2)
})

test('label search is case-insensitive across codes and descriptions', () => {
  const target = registry.find((entity) => entity.type === 'parcel')!
  assert.ok(searchScannerRegistry(target.title.toLowerCase(), registry).some((entity) => entity.key === target.key))
})

test('printable labels render the typed cellar identifier as a QR image', async () => {
  const lot = registry.find((entity) => entity.type === 'lot')!
  const image = await QRCode.toDataURL(scanPayload(lot), { errorCorrectionLevel: 'M', margin: 1, width: 360 })
  assert.match(image, /^data:image\/png;base64,/)
})
