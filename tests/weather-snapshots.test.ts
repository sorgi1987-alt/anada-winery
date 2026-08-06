import test from 'node:test'
import assert from 'node:assert/strict'
import { unavailableWeatherSnapshot, weatherSnapshotFromWeather } from '../src/weather'
import { buildOperationalRegister, operationalRegisterCsv } from '../src/operational'

test('weather snapshots preserve provenance and measurements', () => {
  const snapshot = weatherSnapshotFromWeather('grape_delivery', 'DEL-1', 42.46, -2.44, {
    temperatureC: 21.4, apparentTemperatureC: 21, relativeHumidity: 61, windSpeedKmh: 8.5,
    precipitationMm: 0.2, weatherCode: 2, observedAt: '2026-08-06T10:00:00Z', fetchedAt: '2026-08-06T10:02:00Z', source: 'Open-Meteo', cached: false,
  })
  assert.equal(snapshot.status, 'live')
  assert.equal(snapshot.temperatureC, 21.4)
  assert.equal(snapshot.entityId, 'DEL-1')
})

test('unavailable weather remains explicit and non-destructive', () => {
  const snapshot = unavailableWeatherSnapshot('wine_movement', 'MOV-1', 42.46, -2.44, 'timeout')
  assert.equal(snapshot.status, 'unavailable')
  assert.equal(snapshot.source, 'unavailable')
  assert.equal(snapshot.notes, 'timeout')
})

test('operational CSV includes weather context', () => {
  const events = buildOperationalRegister({ lots: [], deliveries: [{ id:'DEL-1', code:'D-1', parcelId:'P', grower:'Grower', varieties:'Tempranillo', origin:'Alberite', scheduledDate:'2026-08-06', scheduledTime:'10:00', expectedKg:1000, status:'received', vehicle:'LO', processingDestination:'Tolva', receivedAt:'2026-08-06T10:00:00Z', netKg:950 }], productionEvents:[], movements:[], productTransactions:[], barrelOperations:[], bottlingOrders:[], weatherSnapshots:[{ id:'W-1', entityType:'grape_delivery', entityId:'DEL-1', capturedAt:'2026-08-06T10:01:00Z', observedAt:'2026-08-06T10:00:00Z', latitude:42.46, longitude:-2.44, temperatureC:22, relativeHumidity:60, windSpeedKmh:7, precipitationMm:0, weatherCode:1, source:'Open-Meteo', status:'live' }] })
  assert.equal(events[0]?.weather?.temperatureC, 22)
  const csv = operationalRegisterCsv(events)
  assert.match(csv, /Temperatura °C/)
  assert.match(csv, /Open-Meteo/)
})
