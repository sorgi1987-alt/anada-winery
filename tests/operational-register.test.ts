import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOperationalRegister, operationalRegisterCsv } from '../src/operational'
import { barrelOperations, bottlingOrders, deliveries, lots, productStockTransactions, productionEvents, wineMovements } from '../src/data'
test('unified register normalizes and sorts operational records',()=>{const events=buildOperationalRegister({lots,deliveries,productionEvents,movements:wineMovements,productTransactions:productStockTransactions,barrelOperations,bottlingOrders});assert.ok(events.length>productionEvents.length);assert.ok(events.some(e=>e.category==='supply'));assert.ok(events.every((e,i)=>!i||Date.parse(events[i-1].performedAt)>=Date.parse(e.performedAt)))})
test('CSV export includes operational identity and escapes values',()=>{const csv=operationalRegisterCsv([{id:'x',category:'production',type:'note',title:'A, B',performedAt:'2026-01-01T10:00:00Z',recordedAt:'2026-01-01T10:01:00Z',operator:'Ana',notes:'ok'}]);assert.match(csv,/Categoría/);assert.match(csv,/"A, B"/)})
