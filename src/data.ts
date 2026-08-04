import type { Barrel, BarrelOperation, BlendCandidate, BlendTrial, BottlingOrder, CellarTask, GrapeDelivery, LabSample, PackagingMaterial, ProcessStage, ProductLot, ProductMaster, ProductStockTransaction, ProductionEvent, RecallSimulation, RoseMethod, Supplier, Tank, TraceabilityEntity, TraceabilityLink, VineyardParcel, WinerySettings, WineLot, WineMovement } from './types'

export const images = {
  vineyard: 'https://images.unsplash.com/photo-1727647279740-bb8a586193fa?auto=format&fit=crop&w=1800&q=82',
  cellar: 'https://images.unsplash.com/photo-1701596979350-3ba7ae9ecd5e?auto=format&fit=crop&w=1800&q=82',
  tanks: 'https://images.unsplash.com/photo-1765850258953-16e2b4cf70db?auto=format&fit=crop&w=1800&q=82',
  barrels: 'https://images.unsplash.com/photo-1561906814-23da9a8bfee0?auto=format&fit=crop&w=1800&q=82',
  whiteGrapes: 'https://images.unsplash.com/photo-1686359532306-f95743030ad5?auto=format&fit=crop&w=1800&q=82',
  laboratory: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1800&q=82',
}

export const winerySettings: WinerySettings = {
  wineryName: 'Bodega ValdeIregua', legalName: 'Bodegas ValdeIregua, S.L.', wineryCode: 'RE-26-LO-184',
  municipality: 'Alberite', province: 'La Rioja', designation: 'DOCa Rioja', timezone: 'Europe/Madrid',
  campaignYear: 2026, campaignStart: '2026-08-20', campaignEnd: '2026-11-15', targetHarvestKg: 120400,
  cellarTemperatureTarget: 16, cellarHumidityTarget: 72, taskReminderHours: 2, lowStockThreshold: 15,
  labReviewHours: 4, showOfficialDisclaimer: true, updatedAt: '2026-07-31T16:30:00+02:00', updatedBy: 'Elena Martín',
}

export const redProcess: ProcessStage[] = [
  { id: 'reception', label: 'Vendimia y recepción', shortLabel: 'Recepción', status: 'complete' },
  { id: 'destem', label: 'Selección, despalillado y encubado', shortLabel: 'Encubado', status: 'complete' },
  { id: 'af', label: 'Fermentación alcohólica y maceración', shortLabel: 'Fermentación', status: 'current' },
  { id: 'devat', label: 'Descube y prensado', shortLabel: 'Descube', status: 'upcoming' },
  { id: 'malo', label: 'Fermentación maloláctica', shortLabel: 'Maloláctica', status: 'upcoming' },
  { id: 'ageing', label: 'Ensamblaje y crianza', shortLabel: 'Crianza', status: 'upcoming' },
  { id: 'bottle', label: 'Estabilización y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
]

export const whiteProcess: ProcessStage[] = [
  { id: 'reception', label: 'Vendimia y recepción', shortLabel: 'Recepción', status: 'complete' },
  { id: 'press', label: 'Prensado y selección de fracciones', shortLabel: 'Prensado', status: 'complete' },
  { id: 'settling', label: 'Protección y desfangado', shortLabel: 'Desfangado', status: 'complete' },
  { id: 'af', label: 'Fermentación alcohólica en frío', shortLabel: 'Fermentación', status: 'current' },
  { id: 'lees', label: 'Crianza sobre lías', shortLabel: 'Lías', status: 'optional' },
  { id: 'stability', label: 'Estabilización tartárica', shortLabel: 'Estabilización', status: 'upcoming' },
  { id: 'bottle', label: 'Filtración y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
]

export const roseProcesses: Record<RoseMethod, ProcessStage[]> = {
  direct_press: [
    { id: 'reception', label: 'Recepción y control de composición', shortLabel: 'Recepción', status: 'complete' },
    { id: 'press', label: 'Prensado directo y selección por color', shortLabel: 'Prensado', status: 'complete' },
    { id: 'settling', label: 'Protección y desfangado', shortLabel: 'Desfangado', status: 'current' },
    { id: 'af', label: 'Fermentación alcohólica en frío', shortLabel: 'Fermentación', status: 'upcoming' },
    { id: 'lees', label: 'Afinado sobre lías', shortLabel: 'Lías', status: 'optional' },
    { id: 'stability', label: 'Estabilización y ajuste de color', shortLabel: 'Estabilización', status: 'upcoming' },
    { id: 'bottle', label: 'Filtración y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
  ],
  short_maceration: [
    { id: 'reception', label: 'Recepción y control de composición', shortLabel: 'Recepción', status: 'complete' },
    { id: 'maceration', label: 'Despalillado y maceración pelicular corta', shortLabel: 'Maceración', status: 'complete' },
    { id: 'press', label: 'Sangrado, prensado y selección de fracciones', shortLabel: 'Separación', status: 'current' },
    { id: 'settling', label: 'Protección y desfangado', shortLabel: 'Desfangado', status: 'upcoming' },
    { id: 'af', label: 'Fermentación alcohólica en frío', shortLabel: 'Fermentación', status: 'upcoming' },
    { id: 'lees', label: 'Afinado sobre lías', shortLabel: 'Lías', status: 'optional' },
    { id: 'bottle', label: 'Estabilización y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
  ],
  saignee: [
    { id: 'reception', label: 'Recepción y control de composición', shortLabel: 'Recepción', status: 'complete' },
    { id: 'maceration', label: 'Encubado y maceración prefermentativa', shortLabel: 'Maceración', status: 'complete' },
    { id: 'saignee', label: 'Sangrado y prensado de fracciones', shortLabel: 'Sangrado', status: 'current' },
    { id: 'settling', label: 'Protección y desfangado', shortLabel: 'Desfangado', status: 'upcoming' },
    { id: 'af', label: 'Fermentación alcohólica en frío', shortLabel: 'Fermentación', status: 'upcoming' },
    { id: 'lees', label: 'Afinado sobre lías', shortLabel: 'Lías', status: 'optional' },
    { id: 'bottle', label: 'Estabilización y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
  ],
  cofermentation: [
    { id: 'reception', label: 'Pesaje separado y control de composición', shortLabel: 'Pesaje', status: 'complete' },
    { id: 'vatting', label: 'Encubado conjunto tras báscula', shortLabel: 'Encubado', status: 'complete' },
    { id: 'cofermentation', label: 'Cofermentación corta con hollejos', shortLabel: 'Cofermentación', status: 'current' },
    { id: 'press', label: 'Separación y prensado de fracciones', shortLabel: 'Separación', status: 'upcoming' },
    { id: 'af', label: 'Final de fermentación alcohólica', shortLabel: 'Fermentación', status: 'upcoming' },
    { id: 'lees', label: 'Afinado sobre lías o maloláctica', shortLabel: 'Afinado', status: 'optional' },
    { id: 'bottle', label: 'Estabilización y embotellado', shortLabel: 'Embotellado', status: 'upcoming' },
  ],
}

export const roseLot: WineLot = {
  id: 'R-26-003', name: 'Clarete del Iregua', type: 'rosado', varieties: '60% Viura · 40% Garnacha Tinta',
  origin: 'Alberite · Rioja Oriental', vintage: 2026, volume: 4450, vessel: 'D-07',
  stage: 'Cofermentación corta con hollejos', day: 2, temperature: 18.4, density: 1.071,
  progress: 29, attention: 'normal', nextAction: 'Comprobar color y decidir separación', nextTime: '15:30',
  image: images.vineyard,
  process: roseProcesses.cofermentation,
  readings: [
    { time: 'Recepción', temperature: 14.1, density: 1.093 },
    { time: 'Día 1', temperature: 16.2, density: 1.085 },
    { time: 'Hoy 08h', temperature: 17.7, density: 1.076 },
    { time: 'Hoy 12h', temperature: 18.4, density: 1.071, note: 'Intensidad colorante 0,82 UA/cm' },
  ],
  productionDetails: {
    receivedKg: 6500, receptionDate: '2026-09-18', initialDensity: 1.093, receptionTemperature: 14.1,
    rose: { style: 'clarete', method: 'cofermentation', redGrapePercentage: 40, blendAfterWeighing: true, macerationHours: 18, pressFraction: 'Mosto yema + primera prensada', turbidityTarget: 110, protection: 'Inertizado con CO₂', targetColorIntensity: 0.8 },
  },
}

export const lots: WineLot[] = [
  {
    id: 'T-26-017', name: 'Ladera del Iregua', type: 'tinto', varieties: '95% Tempranillo · 5% Graciano',
    origin: 'Alberite · Rioja Oriental', vintage: 2026, volume: 7850, vessel: 'D-12',
    stage: 'Fermentación alcohólica y maceración', day: 4, temperature: 24.8, density: 1.046,
    progress: 38, attention: 'warning', attentionText: 'Temperatura en ascenso',
    nextAction: 'Registrar densidad', nextTime: '16:00', image: images.cellar, process: redProcess,
    readings: [
      { time: 'Día 1', temperature: 20.1, density: 1.091 },
      { time: 'Día 2', temperature: 22.6, density: 1.076 },
      { time: 'Día 3', temperature: 23.7, density: 1.061 },
      { time: 'Hoy 08h', temperature: 24.2, density: 1.052 },
      { time: 'Hoy 12h', temperature: 24.8, density: 1.046 },
    ],
  },
  {
    id: 'B-26-006', name: 'Viura de Nalda', type: 'blanco', varieties: '100% Viura',
    origin: 'Nalda · Rioja Oriental', vintage: 2026, volume: 5200, vessel: 'D-04',
    stage: 'Fermentación alcohólica en frío', day: 7, temperature: 15.2, density: 1.018,
    progress: 52, attention: 'normal', nextAction: 'Registrar densidad', nextTime: '17:30',
    image: images.whiteGrapes, process: whiteProcess,
    readings: [
      { time: 'Día 3', temperature: 14.8, density: 1.064 },
      { time: 'Día 4', temperature: 15.0, density: 1.049 },
      { time: 'Día 5', temperature: 15.3, density: 1.036 },
      { time: 'Día 6', temperature: 15.1, density: 1.026 },
      { time: 'Hoy', temperature: 15.2, density: 1.018 },
    ],
  },
  {
    id: 'T-25-012', name: 'Las Suertes', type: 'tinto', varieties: 'Tempranillo',
    origin: 'Alberite · Rioja Oriental', vintage: 2025, volume: 9100, vessel: 'D-18',
    stage: 'Fermentación maloláctica', temperature: 19.1, progress: 58, attention: 'warning',
    attentionText: 'Muestra pendiente', nextAction: 'Analítica de málico', nextTime: 'Hoy',
    image: images.tanks, process: redProcess.map((stage, index) => ({ ...stage, status: index < 4 ? 'complete' : index === 4 ? 'current' : 'upcoming' })),
    readings: [],
  },
  {
    id: 'CR-25-004', name: 'Cueva del Moncalvillo', type: 'tinto', varieties: 'Tempranillo · Mazuelo',
    origin: 'Vino de Municipio · Nalda', vintage: 2025, volume: 4050, vessel: '18 barricas',
    stage: 'Crianza en roble', progress: 72, attention: 'normal', nextAction: 'Relleno de barricas', nextTime: 'Mañana',
    image: images.barrels, process: redProcess.map((stage, index) => ({ ...stage, status: index < 5 ? 'complete' : index === 5 ? 'current' : 'upcoming' })),
    readings: [],
  },
  roseLot,
]

export const roseTask: CellarTask = { id: 'rose-demo-task', title: 'Comprobar color y decidir separación', lot: 'R-26-003', time: '15:30', assignee: 'Elena', priority: 'media', complete: false }

export const initialTasks: CellarTask[] = [
  { id: '1', title: 'Remontado suave', lot: 'T-26-017', time: '14:30', assignee: 'Martín', priority: 'alta', complete: false },
  { id: '2', title: 'Registrar densidad', lot: 'T-26-017', time: '16:00', assignee: 'Elena', priority: 'media', complete: false },
  { id: '3', title: 'Revisar temperatura', lot: 'B-26-006', time: '17:30', assignee: 'Elena', priority: 'normal', complete: false },
  { id: '4', title: 'Toma de muestra maloláctica', lot: 'T-25-012', time: '18:00', assignee: 'Lucía', priority: 'media', complete: false },
  { id: '5', title: 'Rellenar barricas', lot: 'CR-25-004', time: 'Mañana', assignee: 'Martín', priority: 'normal', complete: false },
  roseTask,
]

export const productionEvents: ProductionEvent[] = [
  {
    id: 'production-event-001', lotId: 'T-26-017', wineType: 'tinto', kind: 'operation', stageId: 'af', operationType: 'pump_over',
    performedAt: '2026-09-19T12:10:00+02:00', recordedAt: '2026-09-19T12:14:00+02:00', operator: 'Martín Ruiz',
    notes: 'Remontado suave sin incidencias.', metrics: { durationMinutes: 15, temperature: 24.8, volumeBefore: 7850, volumeAfter: 7850 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-002', lotId: 'T-26-017', wineType: 'tinto', kind: 'operation', stageId: 'af', operationType: 'density_check',
    performedAt: '2026-09-19T12:00:00+02:00', recordedAt: '2026-09-19T12:03:00+02:00', operator: 'Elena Martín',
    notes: 'Cinética regular; continuar seguimiento.', metrics: { density: 1.046, temperature: 24.8, volumeBefore: 7850, volumeAfter: 7850 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-003', lotId: 'T-26-017', wineType: 'tinto', kind: 'operation', stageId: 'af', operationType: 'addition',
    performedAt: '2026-09-18T18:42:00+02:00', recordedAt: '2026-09-18T18:44:00+02:00', operator: 'Elena Martín',
    notes: 'Nutriente orgánico incorporado durante remontado.', metrics: { product: 'Nutriente orgánico', additionAmount: 12, additionUnit: 'kg', volumeBefore: 7850, volumeAfter: 7850 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-white-001', lotId: 'B-26-006', wineType: 'blanco', kind: 'operation', stageId: 'af', operationType: 'density_check',
    performedAt: '2026-09-26T17:30:00+02:00', recordedAt: '2026-09-26T17:33:00+02:00', operator: 'Lucía Sáenz',
    notes: 'Fermentación protegida y cinética estable.', metrics: { density: 1.018, temperature: 15.2, volumeBefore: 5200, volumeAfter: 5200 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-white-002', lotId: 'B-26-006', wineType: 'blanco', kind: 'operation', stageId: 'af', operationType: 'inoculation',
    performedAt: '2026-09-25T11:20:00+02:00', recordedAt: '2026-09-25T11:24:00+02:00', operator: 'Elena Martín',
    notes: 'Inoculación tras aclimatación.', metrics: { product: 'Levadura seleccionada', additionAmount: 1.1, additionUnit: 'kg', temperature: 14.9, volumeBefore: 5200, volumeAfter: 5200 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-white-003', lotId: 'B-26-006', wineType: 'blanco', kind: 'operation', stageId: 'af', operationType: 'temperature_check',
    performedAt: '2026-09-26T09:12:00+02:00', recordedAt: '2026-09-26T09:14:00+02:00', operator: 'Elena Martín',
    notes: 'Temperatura estable.', metrics: { temperature: 15.2, volumeBefore: 5200, volumeAfter: 5200 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-rose-001', lotId: 'R-26-003', wineType: 'rosado', kind: 'operation', stageId: 'cofermentation', operationType: 'gentle_cap_management',
    performedAt: '2026-09-19T12:05:00+02:00', recordedAt: '2026-09-19T12:08:00+02:00', operator: 'Elena Martín',
    notes: 'Movimiento corto para homogeneizar color sin extracción intensa.', metrics: { durationMinutes: 6, temperature: 18.4, volumeBefore: 4450, volumeAfter: 4450 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-rose-002', lotId: 'R-26-003', wineType: 'rosado', kind: 'operation', stageId: 'cofermentation', operationType: 'density_check',
    performedAt: '2026-09-19T08:10:00+02:00', recordedAt: '2026-09-19T08:13:00+02:00', operator: 'Lucía Sáenz',
    notes: 'Cinética regular.', metrics: { density: 1.076, temperature: 17.7, volumeBefore: 4450, volumeAfter: 4450 }, storageMode: 'browser-local',
  },
  {
    id: 'production-event-rose-003', lotId: 'R-26-003', wineType: 'rosado', kind: 'operation', stageId: 'vatting', operationType: 'joint_vatting',
    performedAt: '2026-09-18T17:55:00+02:00', recordedAt: '2026-09-18T18:01:00+02:00', operator: 'Martín Ruiz',
    notes: 'Encubado conjunto después de conservar los pesajes por origen.', metrics: { separateWeightsConfirmed: true, mixingAfterWeighing: true, volumeBefore: 4450, volumeAfter: 4450 }, storageMode: 'browser-local',
  },
]

export const wineMovements: WineMovement[] = [
  {
    id: 'movement-002', code: 'MOV-26-002', kind: 'transfer', wineType: 'blanco',
    sourceLegs: [{ lotId: 'B-26-006', lotName: 'Viura de Nalda', vesselId: 'D-03', volumeBefore: 5240, movementVolume: 5240, volumeAfter: 0 }],
    destinationLegs: [{ lotId: 'B-26-006', lotName: 'Viura de Nalda', vesselId: 'D-04', volumeBefore: 0, movementVolume: 5200, volumeAfter: 5200 }],
    grossSourceVolume: 5240, receivedVolume: 5200, lossVolume: 40, lossPercentage: 0.76,
    performedAt: '2026-09-25T08:40:00+02:00', recordedAt: '2026-09-25T08:44:00+02:00', operator: 'Martín Ruiz',
    notes: 'Trasiego de mosto limpio después del desfangado.', storageMode: 'browser-local',
  },
  {
    id: 'movement-001', code: 'MOV-26-001', kind: 'transfer', wineType: 'tinto',
    sourceLegs: [{ lotId: 'T-25-012', lotName: 'Las Suertes', vesselId: 'D-17', volumeBefore: 9200, movementVolume: 9200, volumeAfter: 0 }],
    destinationLegs: [{ lotId: 'T-25-012', lotName: 'Las Suertes', vesselId: 'D-18', volumeBefore: 0, movementVolume: 9100, volumeAfter: 9100 }],
    grossSourceVolume: 9200, receivedVolume: 9100, lossVolume: 100, lossPercentage: 1.09,
    performedAt: '2026-09-11T10:15:00+02:00', recordedAt: '2026-09-11T10:22:00+02:00', operator: 'Elena Martín',
    notes: 'Trasiego previo al seguimiento maloláctico.', storageMode: 'browser-local',
  },
]

export const roseTank: Tank = { id: 'D-07', capacity: 6000, volume: 4450, lot: 'R-26-003', type: 'rosado', stage: 'Cofermentación', temperature: 18.4, attention: 'normal' }

export const movementReserveTanks: Tank[] = [
  { id: 'D-21', capacity: 12000, volume: 0, attention: 'normal' },
  { id: 'D-22', capacity: 10000, volume: 0, attention: 'normal' },
  { id: 'D-23', capacity: 7500, volume: 0, attention: 'normal' },
  { id: 'D-24', capacity: 6000, volume: 0, attention: 'normal' },
]

export const tanks: Tank[] = [
  { id: 'D-01', capacity: 10000, volume: 0, attention: 'normal' },
  { id: 'D-02', capacity: 10000, volume: 9200, lot: 'T-26-014', type: 'tinto', stage: 'Maceración', temperature: 23.4, attention: 'normal' },
  { id: 'D-03', capacity: 7500, volume: 6800, lot: 'T-26-015', type: 'tinto', stage: 'Fermentación', temperature: 25.1, attention: 'warning' },
  { id: 'D-04', capacity: 6000, volume: 5200, lot: 'B-26-006', type: 'blanco', stage: 'Fermentación en frío', temperature: 15.2, attention: 'normal' },
  { id: 'D-05', capacity: 6000, volume: 0, attention: 'normal' },
  { id: 'D-06', capacity: 7500, volume: 6100, lot: 'B-26-004', type: 'blanco', stage: 'Desfangado', temperature: 10.4, attention: 'normal' },
  roseTank,
  { id: 'D-11', capacity: 10000, volume: 8700, lot: 'T-26-016', type: 'tinto', stage: 'Fermentación', temperature: 24.1, attention: 'normal' },
  { id: 'D-12', capacity: 10000, volume: 7850, lot: 'T-26-017', type: 'tinto', stage: 'Fermentación', temperature: 24.8, attention: 'warning' },
  { id: 'D-13', capacity: 10000, volume: 9800, lot: 'T-26-019', type: 'tinto', stage: 'Encubado', temperature: 20.7, attention: 'critical' },
  { id: 'D-18', capacity: 12000, volume: 9100, lot: 'T-25-012', type: 'tinto', stage: 'Maloláctica', temperature: 19.1, attention: 'warning' },
  ...movementReserveTanks,
]

export const parcels: VineyardParcel[] = [
  {
    id: 'PAR-ALB-014', name: 'La Rad de Arriba', grower: 'Viñedos Iregua', municipality: 'Alberite', zone: 'Rioja Oriental',
    varieties: 'Tempranillo · Graciano', hectares: 4.8, estimatedKg: 28600, harvestWindow: '18–20 sept', readiness: 'ready', image: images.vineyard,
    sample: { sampledAt: '2026-09-17', potentialAlcohol: 13.4, ph: 3.48, totalAcidity: 5.2, health: 96 },
  },
  {
    id: 'PAR-NAL-006', name: 'Valle de San Marcos', grower: 'Hermanos Sáenz', municipality: 'Nalda', zone: 'Rioja Oriental',
    varieties: 'Viura', hectares: 3.1, estimatedKg: 19200, harvestWindow: '19–21 sept', readiness: 'scheduled', image: images.whiteGrapes,
    sample: { sampledAt: '2026-09-18', potentialAlcohol: 12.1, ph: 3.21, totalAcidity: 6.4, health: 98 },
  },
  {
    id: 'PAR-VIL-021', name: 'Los Cerrillos', grower: 'Bodegas ValdeIregua', municipality: 'Villamediana de Iregua', zone: 'Rioja Oriental',
    varieties: 'Tempranillo', hectares: 6.2, estimatedKg: 37100, harvestWindow: '21–24 sept', readiness: 'sampling', image: images.vineyard,
    sample: { sampledAt: '2026-09-18', potentialAlcohol: 12.7, ph: 3.39, totalAcidity: 5.7, health: 94 },
  },
  {
    id: 'PAR-ALB-031', name: 'El Soto', grower: 'Familia Ruiz', municipality: 'Alberite', zone: 'Rioja Oriental',
    varieties: 'Mazuelo', hectares: 2.4, estimatedKg: 13100, harvestWindow: '25–27 sept', readiness: 'sampling', image: images.vineyard,
    sample: { sampledAt: '2026-09-17', potentialAlcohol: 11.9, ph: 3.17, totalAcidity: 7.1, health: 97 },
  },
  {
    id: 'PAR-ENT-009', name: 'Camino de Moncalvillo', grower: 'Cooperativa del Iregua', municipality: 'Entrena', zone: 'Rioja Alta',
    varieties: 'Garnacha', hectares: 3.7, estimatedKg: 22400, harvestWindow: '16–18 sept', readiness: 'harvested', image: images.cellar,
    sample: { sampledAt: '2026-09-16', potentialAlcohol: 13.1, ph: 3.44, totalAcidity: 5.5, health: 95 },
  },
]

export const deliveries: GrapeDelivery[] = [
  {
    id: 'delivery-001', code: 'ENT-26-041', parcelId: 'PAR-NAL-006', grower: 'Hermanos Sáenz', varieties: 'Viura', origin: 'Nalda · Rioja Oriental',
    scheduledDate: '2026-09-19', scheduledTime: '08:30', expectedKg: 6400, status: 'at_gate', vehicle: 'LO-2841-AJ', processingDestination: 'Prensa 1',
  },
  {
    id: 'delivery-002', code: 'ENT-26-042', parcelId: 'PAR-ALB-014', grower: 'Viñedos Iregua', varieties: 'Tempranillo · Graciano', origin: 'Alberite · Rioja Oriental',
    scheduledDate: '2026-09-19', scheduledTime: '10:15', expectedKg: 7800, status: 'en_route', vehicle: 'LO-7712-AG', processingDestination: 'Mesa de selección',
  },
  {
    id: 'delivery-003', code: 'ENT-26-043', parcelId: 'PAR-ALB-014', grower: 'Viñedos Iregua', varieties: 'Tempranillo · Graciano', origin: 'Alberite · Rioja Oriental',
    scheduledDate: '2026-09-19', scheduledTime: '12:45', expectedKg: 7200, status: 'planned', vehicle: 'LO-6380-AC', processingDestination: 'Mesa de selección',
  },
  {
    id: 'delivery-004', code: 'ENT-26-040', parcelId: 'PAR-ENT-009', grower: 'Cooperativa del Iregua', varieties: 'Garnacha', origin: 'Entrena · Rioja Alta',
    scheduledDate: '2026-09-19', scheduledTime: '07:10', expectedKg: 5900, status: 'received', vehicle: 'LO-1495-Z', processingDestination: 'Tolva 1',
    receivedAt: '2026-09-19T07:24:00+02:00', grossKg: 9340, tareKg: 3510, netKg: 5830, temperature: 17.8, potentialAlcohol: 13.1, condition: 'excellent', notes: 'Uva sana y fresca.',
  },
  {
    id: 'delivery-005', code: 'ENT-26-044', parcelId: 'PAR-VIL-021', grower: 'Bodegas ValdeIregua', varieties: 'Tempranillo', origin: 'Villamediana de Iregua · Rioja Oriental',
    scheduledDate: '2026-09-20', scheduledTime: '09:00', expectedKg: 8100, status: 'planned', vehicle: 'LO-9024-AF', processingDestination: 'Mesa de selección',
  },
]

export const labSamples: LabSample[] = [
  {
    id: 'sample-085', code: 'LAB-26-085', sourceType: 'lot', sourceId: 'T-26-017', sourceName: 'Ladera del Iregua', wineType: 'tinto', profile: 'fermentation',
    collectedAt: '2026-09-19T12:10:00+02:00', collectedBy: 'Elena Martín', assignedTo: 'Lucía Sáenz', dueAt: '14:00', priority: 'urgent', status: 'in_analysis',
    requestedAnalyses: ['temperature', 'density', 'ph', 'total_acidity', 'volatile_acidity'], results: [], notes: 'Temperatura en ascenso durante el último remontado.',
  },
  {
    id: 'sample-084', code: 'LAB-26-084', sourceType: 'lot', sourceId: 'B-26-006', sourceName: 'Viura de Nalda', wineType: 'blanco', profile: 'fermentation',
    collectedAt: '2026-09-19T09:05:00+02:00', collectedBy: 'Elena Martín', assignedTo: 'Lucía Sáenz', dueAt: '11:30', priority: 'today', status: 'validated',
    requestedAnalyses: ['temperature', 'density', 'ph', 'total_acidity', 'volatile_acidity'],
    results: [
      { analysis: 'temperature', value: 15.2, unit: '°C', status: 'normal' }, { analysis: 'density', value: 1.018, unit: '', status: 'normal' },
      { analysis: 'ph', value: 3.18, unit: '', status: 'normal' }, { analysis: 'total_acidity', value: 6.1, unit: 'g/L', status: 'normal' },
      { analysis: 'volatile_acidity', value: 0.28, unit: 'g/L', status: 'normal' },
    ], notes: 'Cinética estable.', validatedAt: '2026-09-19T10:02:00+02:00',
  },
  {
    id: 'sample-083', code: 'LAB-26-083', sourceType: 'lot', sourceId: 'T-25-012', sourceName: 'Las Suertes', wineType: 'tinto', profile: 'malolactic',
    collectedAt: '2026-09-19T08:20:00+02:00', collectedBy: 'Martín Ruiz', assignedTo: 'Lucía Sáenz', dueAt: '12:00', priority: 'today', status: 'review',
    requestedAnalyses: ['malic_acid', 'ph', 'volatile_acidity', 'free_so2'],
    results: [
      { analysis: 'malic_acid', value: 0.55, unit: 'g/L', status: 'warning' }, { analysis: 'ph', value: 3.61, unit: '', status: 'normal' },
      { analysis: 'volatile_acidity', value: 0.62, unit: 'g/L', status: 'normal' }, { analysis: 'free_so2', value: 11, unit: 'mg/L', status: 'warning' },
    ], notes: 'Repetir málico en 48 h.', validatedAt: '2026-09-19T09:18:00+02:00',
  },
  {
    id: 'sample-082', code: 'LAB-26-082', sourceType: 'delivery', sourceId: 'ENT-26-040', sourceName: 'Camino de Moncalvillo', profile: 'maturity',
    collectedAt: '2026-09-19T07:25:00+02:00', collectedBy: 'Elena Martín', assignedTo: 'Elena Martín', dueAt: '08:15', priority: 'today', status: 'validated',
    requestedAnalyses: ['potential_alcohol', 'ph', 'total_acidity'],
    results: [{ analysis: 'potential_alcohol', value: 13.1, unit: '% vol.', status: 'normal' }, { analysis: 'ph', value: 3.44, unit: '', status: 'normal' }, { analysis: 'total_acidity', value: 5.5, unit: 'g/L', status: 'normal' }],
    notes: 'Uva sana y fresca.', validatedAt: '2026-09-19T07:52:00+02:00',
  },
  {
    id: 'sample-086', code: 'LAB-26-086', sourceType: 'lot', sourceId: 'CR-25-004', sourceName: 'Cueva del Moncalvillo', wineType: 'tinto', profile: 'bottling',
    collectedAt: '2026-09-19T11:40:00+02:00', collectedBy: 'Martín Ruiz', assignedTo: 'Lucía Sáenz', dueAt: '16:30', priority: 'routine', status: 'queued',
    requestedAnalyses: ['free_so2', 'total_so2', 'turbidity', 'residual_sugar'], results: [], notes: 'Control previo a estabilización.',
  },
]

const cooperages = ['Radoux', 'Seguin Moreau', 'Demptos', 'Murúa']

export const barrels: Barrel[] = Array.from({ length: 18 }, (_, index) => {
  const rack = index < 8 ? 'A' : index < 15 ? 'B' : 'C'
  const rackIndex = index < 8 ? index + 1 : index < 15 ? index - 7 : index - 14
  const isEmpty = index === 15 || index === 16
  const maintenance = index === 17
  const isLasSuertes = index < 8
  const lotId = isEmpty || maintenance ? undefined : isLasSuertes ? 'T-25-012' : 'CR-25-004'
  const attention = index === 2 || index === 10 ? 'warning' as const : maintenance ? 'critical' as const : 'normal' as const
  return {
    id: `barrel-${String(index + 1).padStart(3, '0')}`,
    code: `BR-${rack}-${String(rackIndex).padStart(2, '0')}`,
    cooperage: cooperages[index % cooperages.length],
    oakOrigin: index % 4 === 0 ? 'american' as const : index % 5 === 0 ? 'hungarian' as const : 'french' as const,
    toast: index % 3 === 0 ? 'medium_plus' as const : index % 3 === 1 ? 'medium' as const : 'light' as const,
    grain: index % 4 === 0 ? 'medium' as const : 'fine' as const,
    capacity: 225,
    volume: isEmpty || maintenance ? 0 : index % 4 === 0 ? 219 : index % 3 === 0 ? 222 : 225,
    status: maintenance ? 'maintenance' as const : isEmpty ? 'empty' as const : 'filled' as const,
    room: 'Sala de barricas', rack, position: `${rack}-${String(rackIndex).padStart(2, '0')}`, useNumber: index % 3 + 1,
    lotId, lotName: lotId === 'T-25-012' ? 'Las Suertes' : lotId === 'CR-25-004' ? 'Cueva del Moncalvillo' : undefined,
    wineType: lotId ? 'tinto' as const : undefined,
    filledAt: lotId === 'T-25-012' ? '2026-01-18' : lotId === 'CR-25-004' ? '2025-11-06' : undefined,
    plannedMonths: lotId === 'T-25-012' ? 12 : lotId === 'CR-25-004' ? 18 : undefined,
    attention,
    nextAction: maintenance ? 'Revisión de duelas' : isEmpty ? 'Limpieza y conservación' : attention === 'warning' ? 'Relleno de barrica' : index % 2 ? 'Control de SO₂' : 'Cata de evolución',
    nextDue: maintenance ? 'Hoy' : isEmpty ? 'Esta semana' : attention === 'warning' ? 'Hoy · 16:00' : index % 2 ? '25 sept' : '2 oct',
    notes: maintenance ? 'Pequeña pérdida detectada en la duela inferior.' : '',
  }
})

export const barrelOperations: BarrelOperation[] = [
  { id: 'barrel-op-001', type: 'top_up', barrelIds: ['barrel-001', 'barrel-002', 'barrel-003', 'barrel-004'], targetLabel: 'T-25-012 · Las Suertes', performedAt: '2026-09-18T16:20:00+02:00', person: 'Martín Ruiz', volumeAdded: 9, notes: 'Sin incidencias. Merma homogénea.' },
  { id: 'barrel-op-002', type: 'tasting', barrelIds: ['barrel-009', 'barrel-010', 'barrel-011'], targetLabel: 'CR-25-004 · Cueva del Moncalvillo', performedAt: '2026-09-17T11:45:00+02:00', person: 'Elena Martín', notes: 'Fruta integrada, madera todavía presente.' },
  { id: 'barrel-op-003', type: 'so2_check', barrelIds: ['barrel-005', 'barrel-006', 'barrel-007', 'barrel-008'], targetLabel: 'T-25-012 · Las Suertes', performedAt: '2026-09-15T09:30:00+02:00', person: 'Lucía Sáenz', notes: 'SO₂ libre dentro del objetivo.' },
  { id: 'barrel-op-004', type: 'cleaning', barrelIds: ['barrel-016', 'barrel-017'], targetLabel: 'BR-C-01 · BR-C-02', performedAt: '2026-09-14T15:10:00+02:00', person: 'Martín Ruiz', notes: 'Lavado, vapor y conservación completados.' },
]

export const blendCandidates: BlendCandidate[] = [
  {
    id: 'blend-candidate-001', lotId: 'T-25-012', name: 'Las Suertes', type: 'tinto', vintage: 2025, varieties: 'Tempranillo', origin: 'Alberite · Rioja Oriental', vessel: 'Barricas A', availableVolume: 4300,
    analysis: { alcohol: 14.1, ph: 3.62, totalAcidity: 5.1, colorIntensity: 13.8 }, sensory: ['Ciruela', 'Regaliz', 'Tanino fino'], readiness: 'ready', nextReview: '25 sept', image: images.barrels,
  },
  {
    id: 'blend-candidate-002', lotId: 'CR-25-004', name: 'Cueva del Moncalvillo', type: 'tinto', vintage: 2025, varieties: 'Tempranillo · Mazuelo', origin: 'Nalda · Rioja Oriental', vessel: 'Barricas B', availableVolume: 5200,
    analysis: { alcohol: 13.8, ph: 3.54, totalAcidity: 5.5, colorIntensity: 14.6 }, sensory: ['Fruta negra', 'Cedro', 'Estructura'], readiness: 'ready', nextReview: '2 oct', image: images.cellar,
  },
  {
    id: 'blend-candidate-003', lotId: 'T-25-021', name: 'Alto Najerilla', type: 'tinto', vintage: 2025, varieties: 'Garnacha', origin: 'Badarán · Rioja Alta', vessel: 'D-21', availableVolume: 3600,
    analysis: { alcohol: 14.4, ph: 3.68, totalAcidity: 4.9, colorIntensity: 10.7 }, sensory: ['Frambuesa', 'Floral', 'Volumen'], readiness: 'ready', nextReview: '28 sept', image: images.vineyard,
  },
  {
    id: 'blend-candidate-004', lotId: 'T-25-029', name: 'La Plana', type: 'tinto', vintage: 2025, varieties: 'Graciano', origin: 'Villamediana · Rioja Oriental', vessel: 'D-23', availableVolume: 1800,
    analysis: { alcohol: 13.5, ph: 3.31, totalAcidity: 6.4, colorIntensity: 16.8 }, sensory: ['Especias', 'Frescura', 'Persistencia'], readiness: 'ready', nextReview: '24 sept', image: images.tanks,
  },
  {
    id: 'blend-candidate-005', lotId: 'B-25-008', name: 'Viura sobre lías', type: 'blanco', vintage: 2025, varieties: 'Viura', origin: 'Nalda · Rioja Oriental', vessel: 'D-08', availableVolume: 3400,
    analysis: { alcohol: 12.7, ph: 3.22, totalAcidity: 6.2, colorIntensity: 0.18 }, sensory: ['Manzana', 'Hinojo', 'Textura'], readiness: 'ready', nextReview: '26 sept', image: images.whiteGrapes,
  },
  {
    id: 'blend-candidate-006', lotId: 'B-25-011', name: 'Maturana de Moncalvillo', type: 'blanco', vintage: 2025, varieties: 'Maturana Blanca', origin: 'Sojuela · Rioja Alta', vessel: 'D-10', availableVolume: 1400,
    analysis: { alcohol: 13.1, ph: 3.17, totalAcidity: 6.8, colorIntensity: 0.14 }, sensory: ['Cítrico', 'Hierbas', 'Tensión'], readiness: 'hold', nextReview: 'Hoy · 17:00', image: images.whiteGrapes,
  },
]

export const blendTrials: BlendTrial[] = [
  {
    id: 'blend-trial-001', code: 'ENS-26-001', name: 'Reserva de la Casa', type: 'tinto', targetVolume: 4500, objective: 'Profundidad de fruta, frescura y final largo para crianza prolongada.', status: 'tasting',
    components: [{ candidateId: 'blend-candidate-001', percentage: 55 }, { candidateId: 'blend-candidate-002', percentage: 30 }, { candidateId: 'blend-candidate-004', percentage: 15 }],
    estimatedAnalysis: { alcohol: 13.92, ph: 3.55, totalAcidity: 5.42, colorIntensity: 14.49 }, createdAt: '2026-09-18T10:15:00+02:00', createdBy: 'Elena Martín',
    tasting: { visual: 5, aroma: 4, palate: 4, balance: 4, recommendation: 'promising', notes: 'La aportación de Graciano alarga el final sin dominar la fruta.', tastedAt: '2026-09-19T11:20:00+02:00', tastedBy: 'Elena Martín' },
  },
  {
    id: 'blend-trial-002', code: 'ENS-26-002', name: 'Blanco de Parcela', type: 'blanco', targetVolume: 2200, objective: 'Mantener tensión y carácter de Viura con mayor longitud de boca.', status: 'draft',
    components: [{ candidateId: 'blend-candidate-005', percentage: 80 }, { candidateId: 'blend-candidate-006', percentage: 20 }],
    estimatedAnalysis: { alcohol: 12.78, ph: 3.21, totalAcidity: 6.32, colorIntensity: 0.17 }, createdAt: '2026-09-19T09:40:00+02:00', createdBy: 'Lucía Sáenz',
  },
  {
    id: 'blend-trial-003', code: 'ENS-26-003', name: 'Crianza Selección', type: 'tinto', targetVolume: 3000, objective: 'Perfil accesible, fruta definida y estructura media para salida temprana.', status: 'approved',
    components: [{ candidateId: 'blend-candidate-002', percentage: 70 }, { candidateId: 'blend-candidate-003', percentage: 30 }],
    estimatedAnalysis: { alcohol: 13.98, ph: 3.58, totalAcidity: 5.32, colorIntensity: 13.43 }, createdAt: '2026-09-15T12:10:00+02:00', createdBy: 'Elena Martín', approvedAt: '2026-09-18T13:05:00+02:00', approvedBy: 'Elena Martín',
    tasting: { visual: 4, aroma: 4, palate: 5, balance: 5, recommendation: 'promising', notes: 'Ensamblaje equilibrado y listo para preparación de depósito.', tastedAt: '2026-09-18T12:20:00+02:00', tastedBy: 'Elena Martín' },
  },
]

export const packagingMaterials: PackagingMaterial[] = [
  { id: 'pack-bottle-001', code: 'ENV-075-01', type: 'bottle', name: 'Bordelesa Élite 75 cl', supplier: 'Verallia', lotNumber: 'VE-260914-B7', onHand: 18500, reserved: 4080, reorderPoint: 5000, unit: 'units' },
  { id: 'pack-bottle-002', code: 'ENV-075-02', type: 'bottle', name: 'Borgoña Ámbar 75 cl', supplier: 'Vidrio Rioja', lotNumber: 'VR-260901-A2', onHand: 6200, reserved: 2993, reorderPoint: 2500, unit: 'units' },
  { id: 'pack-closure-001', code: 'COR-044-01', type: 'closure', name: 'Corcho natural 44 × 24', supplier: 'Amorim', lotNumber: 'AM-26-4481', onHand: 15200, reserved: 4080, reorderPoint: 4000, unit: 'units' },
  { id: 'pack-closure-002', code: 'COR-045-02', type: 'closure', name: 'Corcho técnico blanco', supplier: 'Diam', lotNumber: 'DI-26-1190', onHand: 5200, reserved: 2993, reorderPoint: 2000, unit: 'units' },
  { id: 'pack-capsule-001', code: 'CAP-BUR-01', type: 'capsule', name: 'Cápsula borgoña mate', supplier: 'Ramondín', lotNumber: 'RA-2608-97', onHand: 14800, reserved: 4080, reorderPoint: 4000, unit: 'units' },
  { id: 'pack-capsule-002', code: 'CAP-CRM-02', type: 'capsule', name: 'Cápsula crema mate', supplier: 'Ramondín', lotNumber: 'RA-2609-12', onHand: 4600, reserved: 2993, reorderPoint: 1800, unit: 'units' },
  { id: 'pack-front-001', code: 'ETQ-SB-25', type: 'front_label', name: 'Selección de Bodega 2025', supplier: 'Gráficas Larrad', lotNumber: 'GL-26188', onHand: 14000, reserved: 4080, reorderPoint: 3000, unit: 'units' },
  { id: 'pack-front-002', code: 'ETQ-BP-25', type: 'front_label', name: 'Blanco de Parcela 2025', supplier: 'Gráficas Larrad', lotNumber: 'GL-26204', onHand: 5100, reserved: 2993, reorderPoint: 1800, unit: 'units' },
  { id: 'pack-back-001', code: 'ETQ-TR-26-A', type: 'back_label', name: 'Etiqueta trasera · Selección 2025', supplier: 'Gráficas Larrad', lotNumber: 'GL-26211', onHand: 15000, reserved: 4080, reorderPoint: 3000, unit: 'units', controlledSeries: 'TR-26-A · 105221–120220' },
  { id: 'pack-back-002', code: 'ETQ-TR-26-B', type: 'back_label', name: 'Etiqueta trasera · Blanco 2025', supplier: 'Gráficas Larrad', lotNumber: 'GL-26212', onHand: 5000, reserved: 2993, reorderPoint: 1800, unit: 'units', controlledSeries: 'TR-26-B · 220001–225000' },
  { id: 'pack-carton-001', code: 'CAJ-06-01', type: 'carton', name: 'Caja 6 botellas · kraft', supplier: 'Cartonajes Ebro', lotNumber: 'CE-260911', onHand: 2300, reserved: 680, reorderPoint: 600, unit: 'units' },
  { id: 'pack-carton-002', code: 'CAJ-06-02', type: 'carton', name: 'Caja 6 botellas · blanca', supplier: 'Cartonajes Ebro', lotNumber: 'CE-260917', onHand: 920, reserved: 499, reorderPoint: 400, unit: 'units' },
]

export const bottlingOrders: BottlingOrder[] = [
  {
    id: 'bottling-order-006', code: 'EMB-26-006', sourceTrialId: 'blend-trial-historical-006', sourceCode: 'ENS-26-000', wineName: 'Selección de Bodega', type: 'tinto', vintage: 2025,
    targetVolume: 4000, targetBottles: 5334, scheduledAt: '2026-09-12T08:00:00+02:00', line: 'Línea 1', status: 'completed',
    packaging: { bottleSize: 0.75, unitsPerCase: 6, bottleId: 'pack-bottle-001', closureId: 'pack-closure-001', capsuleId: 'pack-capsule-001', frontLabelId: 'pack-front-001', backLabelId: 'pack-back-001', cartonId: 'pack-carton-001' },
    gates: ['wine_release', 'pre_bottling_lab', 'stabilisation', 'filtration', 'artwork', 'line_sanitation'].map((key) => ({ key: key as BottlingOrder['gates'][number]['key'], complete: true, verifiedAt: '2026-09-11T16:00:00+02:00', verifiedBy: 'Elena Martín' })),
    createdAt: '2026-09-02T10:10:00+02:00', createdBy: 'Elena Martín', releasedAt: '2026-09-11T16:10:00+02:00', releasedBy: 'Elena Martín',
    completion: { goodBottles: 5220, rejectedBottles: 42, actualVolume: 3951, finishedProductLot: 'PT-SB25-260912', labelSerialFrom: 100001, labelSerialTo: 105220, completedAt: '2026-09-12T15:42:00+02:00', completedBy: 'Martín Ruiz', notes: 'Arranque estable; 42 botellas rechazadas en control de nivel y cierre.' },
  },
  {
    id: 'bottling-order-007', code: 'EMB-26-007', sourceTrialId: 'blend-trial-003', sourceCode: 'ENS-26-003', wineName: 'Selección de Bodega', type: 'tinto', vintage: 2025,
    targetVolume: 3000, targetBottles: 4000, scheduledAt: '2026-09-22T07:30:00+02:00', line: 'Línea 1', status: 'ready',
    packaging: { bottleSize: 0.75, unitsPerCase: 6, bottleId: 'pack-bottle-001', closureId: 'pack-closure-001', capsuleId: 'pack-capsule-001', frontLabelId: 'pack-front-001', backLabelId: 'pack-back-001', cartonId: 'pack-carton-001' },
    gates: ['wine_release', 'pre_bottling_lab', 'stabilisation', 'filtration', 'artwork', 'line_sanitation'].map((key) => ({ key: key as BottlingOrder['gates'][number]['key'], complete: true, verifiedAt: '2026-09-20T12:00:00+02:00', verifiedBy: 'Elena Martín' })),
    createdAt: '2026-09-14T09:25:00+02:00', createdBy: 'Elena Martín', releasedAt: '2026-09-20T12:15:00+02:00', releasedBy: 'Elena Martín',
  },
  {
    id: 'bottling-order-008', code: 'EMB-26-008', sourceTrialId: 'blend-trial-historical-008', sourceCode: 'ENS-26-005', wineName: 'Blanco de Parcela', type: 'blanco', vintage: 2025,
    targetVolume: 2200, targetBottles: 2934, scheduledAt: '2026-09-24T08:00:00+02:00', line: 'Línea 1', status: 'preparation',
    packaging: { bottleSize: 0.75, unitsPerCase: 6, bottleId: 'pack-bottle-002', closureId: 'pack-closure-002', capsuleId: 'pack-capsule-002', frontLabelId: 'pack-front-002', backLabelId: 'pack-back-002', cartonId: 'pack-carton-002' },
    gates: [
      { key: 'wine_release', complete: false }, { key: 'pre_bottling_lab', complete: false }, { key: 'stabilisation', complete: true, verifiedAt: '2026-09-19T09:00:00+02:00', verifiedBy: 'Lucía Sáenz' },
      { key: 'filtration', complete: false }, { key: 'artwork', complete: true, verifiedAt: '2026-09-18T13:00:00+02:00', verifiedBy: 'Elena Martín' }, { key: 'line_sanitation', complete: false },
    ],
    createdAt: '2026-09-17T11:05:00+02:00', createdBy: 'Lucía Sáenz',
  },
]

export const traceabilityEntities: TraceabilityEntity[] = [
  { id: 'trace-parcel-001', type: 'parcel', code: 'PAR-ENT-009-25', name: 'Camino de Moncalvillo', subtitle: 'Entrena · Rioja Alta', occurredAt: '2025-09-18T07:30:00+02:00', status: 'verified', quantity: 12400, unit: 'kg', image: images.vineyard, metadata: { Viticultor: 'Cooperativa del Iregua', Variedad: 'Tempranillo', Campaña: '2025', Registro: 'RIO-ENT-009' } },
  { id: 'trace-parcel-002', type: 'parcel', code: 'PAR-NAL-018-25', name: 'Ladera de San Marcos', subtitle: 'Nalda · Rioja Oriental', occurredAt: '2025-09-19T08:10:00+02:00', status: 'verified', quantity: 9800, unit: 'kg', image: images.vineyard, metadata: { Viticultor: 'Hermanos Sáenz', Variedad: 'Tempranillo · Mazuelo', Campaña: '2025', Registro: 'RIO-NAL-018' } },
  { id: 'trace-parcel-003', type: 'parcel', code: 'PAR-BAD-011-25', name: 'Alto Najerilla', subtitle: 'Badarán · Rioja Alta', occurredAt: '2025-09-23T09:20:00+02:00', status: 'verified', quantity: 7600, unit: 'kg', image: images.vineyard, metadata: { Viticultor: 'Viñedos del Najerilla', Variedad: 'Garnacha', Campaña: '2025', Registro: 'RIO-BAD-011' } },
  { id: 'trace-parcel-004', type: 'parcel', code: 'PAR-SOJ-006-25', name: 'Las Neveras', subtitle: 'Sojuela · Rioja Alta', occurredAt: '2025-09-10T08:40:00+02:00', status: 'verified', quantity: 5200, unit: 'kg', image: images.whiteGrapes, metadata: { Viticultor: 'Familia Sáenz', Variedad: 'Viura · Maturana Blanca', Campaña: '2025', Registro: 'RIO-SOJ-006' } },
  { id: 'trace-delivery-001', type: 'grape_delivery', code: 'ENT-25-214', name: 'Entrada Tempranillo', subtitle: 'Mesa de selección · vehículo LO-2841-AJ', occurredAt: '2025-09-18T10:05:00+02:00', status: 'verified', quantity: 12180, unit: 'kg', image: images.cellar, metadata: { Bruto: '18.240 kg', Tara: '6.060 kg', Temperatura: '18,4 °C', Estado: 'Uva sana' } },
  { id: 'trace-delivery-002', type: 'grape_delivery', code: 'ENT-25-219', name: 'Entrada Tempranillo · Mazuelo', subtitle: 'Mesa de selección · vehículo LO-7712-AG', occurredAt: '2025-09-19T11:15:00+02:00', status: 'verified', quantity: 9560, unit: 'kg', image: images.cellar, metadata: { Bruto: '15.920 kg', Tara: '6.360 kg', Temperatura: '17,9 °C', Estado: 'Uva sana' } },
  { id: 'trace-delivery-003', type: 'grape_delivery', code: 'ENT-25-238', name: 'Entrada Garnacha', subtitle: 'Tolva 1 · vehículo LO-6380-AC', occurredAt: '2025-09-23T12:05:00+02:00', status: 'verified', quantity: 7310, unit: 'kg', image: images.cellar, metadata: { Bruto: '13.490 kg', Tara: '6.180 kg', Temperatura: '18,1 °C', Estado: 'Uva sana' } },
  { id: 'trace-delivery-004', type: 'grape_delivery', code: 'ENT-25-176', name: 'Entrada Viura · Maturana', subtitle: 'Prensa 1 · vehículo LO-4501-AF', occurredAt: '2025-09-10T10:10:00+02:00', status: 'verified', quantity: 5030, unit: 'kg', image: images.whiteGrapes, metadata: { Bruto: '10.980 kg', Tara: '5.950 kg', Temperatura: '15,8 °C', Estado: 'Uva excelente' } },
  { id: 'trace-wine-001', type: 'wine_lot', code: 'CR-25-004', name: 'Cueva del Moncalvillo', subtitle: 'Tempranillo · Mazuelo · 2025', occurredAt: '2025-10-18T09:00:00+02:00', status: 'verified', quantity: 4050, unit: 'L', image: images.barrels, metadata: { Origen: 'Nalda · Rioja Oriental', Elaboración: 'Tinto tradicional', Depósito: 'D-17', Calificación: 'Partida apta · demostración' } },
  { id: 'trace-wine-002', type: 'wine_lot', code: 'T-25-018', name: 'Camino del Iregua', subtitle: 'Tempranillo · 2025', occurredAt: '2025-10-16T10:30:00+02:00', status: 'verified', quantity: 5100, unit: 'L', image: images.tanks, metadata: { Origen: 'Entrena · Rioja Alta', Elaboración: 'Tinto tradicional', Depósito: 'D-16', Calificación: 'Partida apta · demostración' } },
  { id: 'trace-wine-003', type: 'wine_lot', code: 'T-25-021', name: 'Alto Najerilla', subtitle: 'Garnacha · 2025', occurredAt: '2025-10-21T12:00:00+02:00', status: 'verified', quantity: 3600, unit: 'L', image: images.tanks, metadata: { Origen: 'Badarán · Rioja Alta', Elaboración: 'Tinto tradicional', Depósito: 'D-21', Calificación: 'Partida apta · demostración' } },
  { id: 'trace-wine-004', type: 'wine_lot', code: 'B-25-008', name: 'Viura sobre lías', subtitle: 'Viura · 2025', occurredAt: '2025-10-02T08:00:00+02:00', status: 'verified', quantity: 3400, unit: 'L', image: images.whiteGrapes, metadata: { Origen: 'Sojuela · Rioja Alta', Elaboración: 'Blanco protegido', Depósito: 'D-08', Calificación: 'Pendiente de revisión documental' } },
  { id: 'trace-barrels-001', type: 'barrel_group', code: 'BARRICAS-B', name: 'Grupo de crianza B', subtitle: '18 barricas · roble francés y americano', occurredAt: '2026-09-17T11:45:00+02:00', status: 'verified', quantity: 3900, unit: 'L', image: images.barrels, metadata: { Lote: 'CR-25-004', Sala: 'Sala principal', Tiempo: '11 meses', Última_operación: 'Cata de evolución' } },
  { id: 'trace-blend-001', type: 'blend', code: 'ENS-26-000', name: 'Crianza Selección · tirada 1', subtitle: 'Fórmula histórica aprobada', occurredAt: '2026-09-02T10:10:00+02:00', status: 'verified', quantity: 4000, unit: 'L', image: images.cellar, metadata: { Fórmula: '62% T-25-018 · 38% CR-25-004', Cata: 'Favorable', Aprobó: 'Elena Martín', Estado: 'Aprobada' } },
  { id: 'trace-blend-002', type: 'blend', code: 'ENS-26-003', name: 'Crianza Selección', subtitle: '70% CR-25-004 · 30% T-25-021', occurredAt: '2026-09-18T13:05:00+02:00', status: 'verified', quantity: 3000, unit: 'L', image: images.cellar, metadata: { Fórmula: '70% CR-25-004 · 30% T-25-021', Cata: '4,5 / 5', Aprobó: 'Elena Martín', Estado: 'Aprobada' } },
  { id: 'trace-blend-003', type: 'blend', code: 'ENS-26-005', name: 'Blanco de Parcela', subtitle: 'Fórmula histórica en preparación', occurredAt: '2026-09-17T11:05:00+02:00', status: 'pending', quantity: 2200, unit: 'L', image: images.whiteGrapes, metadata: { Fórmula: 'Viura · Maturana Blanca', Cata: 'Pendiente', Aprobó: 'Pendiente', Estado: 'En preparación' } },
  { id: 'trace-order-006', type: 'bottling_order', code: 'EMB-26-006', name: 'Crianza Selección', subtitle: 'Tirada completada · Línea 1', occurredAt: '2026-09-12T08:00:00+02:00', status: 'verified', quantity: 3951, unit: 'L', image: images.cellar, metadata: { Formato: '75 cl', Conformes: '5.220', Rechazadas: '42', Rendimiento: '97,9%' } },
  { id: 'trace-order-007', type: 'bottling_order', code: 'EMB-26-007', name: 'Crianza Selección', subtitle: 'Orden liberada · Línea 1', occurredAt: '2026-09-22T07:30:00+02:00', status: 'verified', quantity: 3000, unit: 'L', image: images.cellar, metadata: { Formato: '75 cl', Previstas: '4.000', Liberación: 'Completa', Línea: 'Línea 1' } },
  { id: 'trace-order-008', type: 'bottling_order', code: 'EMB-26-008', name: 'Blanco de Parcela', subtitle: 'Orden en preparación · Línea 1', occurredAt: '2026-09-24T08:00:00+02:00', status: 'pending', quantity: 2200, unit: 'L', image: images.whiteGrapes, metadata: { Formato: '75 cl', Previstas: '2.934', Liberación: '2 de 6 controles', Línea: 'Línea 1' } },
  { id: 'trace-finished-001', type: 'finished_lot', code: 'PT-CS25-260912', name: 'Crianza Selección 2025', subtitle: 'Producto terminado · 5.220 botellas', occurredAt: '2026-09-12T15:42:00+02:00', status: 'verified', quantity: 5220, unit: 'bottles', image: images.cellar, metadata: { Contraetiquetas: '100001–105220', Mención: 'Crianza', Formato: '75 cl', Ubicación: 'Almacén PT-A' } },
  { id: 'pack-bottle-001', type: 'packaging_lot', code: 'VE-260914-B7', name: 'Bordelesa Élite 75 cl', subtitle: 'Verallia · lote de proveedor', occurredAt: '2026-09-09T09:10:00+02:00', status: 'verified', quantity: 18500, unit: 'units', metadata: { Material: 'Botella', Proveedor: 'Verallia', Referencia: 'ENV-075-01', Recepción: '2026-09-09' } },
  { id: 'pack-closure-001', type: 'packaging_lot', code: 'AM-26-4481', name: 'Corcho natural 44 × 24', subtitle: 'Amorim · lote de proveedor', occurredAt: '2026-09-08T11:20:00+02:00', status: 'attention', quantity: 15200, unit: 'units', metadata: { Material: 'Cierre', Proveedor: 'Amorim', Referencia: 'COR-044-01', Recepción: '2026-09-08' } },
  { id: 'pack-back-001', type: 'packaging_lot', code: 'GL-26211', name: 'Etiqueta trasera · Selección 2025', subtitle: 'Serie TR-26-A', occurredAt: '2026-09-07T10:00:00+02:00', status: 'verified', quantity: 15000, unit: 'units', metadata: { Material: 'Etiqueta trasera', Serie: 'TR-26-A', Numeración: '105221–120220', Referencia: 'ETQ-TR-26-A' } },
  { id: 'pack-front-001', type: 'packaging_lot', code: 'GL-26188', name: 'Etiqueta Crianza Selección 2025', subtitle: 'Gráficas Larrad · lote de proveedor', occurredAt: '2026-09-09T12:00:00+02:00', status: 'verified', quantity: 14000, unit: 'units', metadata: { Material: 'Etiqueta', Proveedor: 'Gráficas Larrad', Referencia: 'ETQ-CS-25', Aprobación: 'Registro interno aprobado' } },
]

export const traceabilityLinks: TraceabilityLink[] = [
  { id: 'trace-link-001', sourceId: 'trace-parcel-001', targetId: 'trace-delivery-001', relation: 'harvested_into', quantity: 12180, unit: 'kg', occurredAt: '2025-09-18T10:05:00+02:00', evidence: 'Ticket de báscula ENT-25-214', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-002', sourceId: 'trace-parcel-002', targetId: 'trace-delivery-002', relation: 'harvested_into', quantity: 9560, unit: 'kg', occurredAt: '2025-09-19T11:15:00+02:00', evidence: 'Ticket de báscula ENT-25-219', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-003', sourceId: 'trace-parcel-003', targetId: 'trace-delivery-003', relation: 'harvested_into', quantity: 7310, unit: 'kg', occurredAt: '2025-09-23T12:05:00+02:00', evidence: 'Ticket de báscula ENT-25-238', status: 'verified', verifiedBy: 'Lucía Sáenz' },
  { id: 'trace-link-004', sourceId: 'trace-parcel-004', targetId: 'trace-delivery-004', relation: 'harvested_into', quantity: 5030, unit: 'kg', occurredAt: '2025-09-10T10:10:00+02:00', evidence: 'Ticket de báscula ENT-25-176', status: 'verified', verifiedBy: 'Lucía Sáenz' },
  { id: 'trace-link-005', sourceId: 'trace-delivery-001', targetId: 'trace-wine-002', relation: 'processed_as', quantity: 5100, unit: 'L', occurredAt: '2025-09-18T12:20:00+02:00', evidence: 'Parte de encubado D-16', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-006', sourceId: 'trace-delivery-002', targetId: 'trace-wine-001', relation: 'processed_as', quantity: 4050, unit: 'L', occurredAt: '2025-09-19T13:10:00+02:00', evidence: 'Parte de encubado D-17', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-007', sourceId: 'trace-delivery-003', targetId: 'trace-wine-003', relation: 'processed_as', quantity: 3600, unit: 'L', occurredAt: '2025-09-23T14:00:00+02:00', evidence: 'Parte de encubado D-21', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-008', sourceId: 'trace-delivery-004', targetId: 'trace-wine-004', relation: 'processed_as', quantity: 3400, unit: 'L', occurredAt: '2025-09-10T13:20:00+02:00', evidence: 'Parte de prensado PR-25-044', status: 'verified', verifiedBy: 'Lucía Sáenz' },
  { id: 'trace-link-009', sourceId: 'trace-wine-001', targetId: 'trace-barrels-001', relation: 'aged_in', quantity: 3900, unit: 'L', occurredAt: '2025-10-18T09:00:00+02:00', evidence: 'Orden de llenado de barricas', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-010', sourceId: 'trace-wine-002', targetId: 'trace-blend-001', relation: 'component_of', quantity: 2480, unit: 'L', occurredAt: '2026-09-02T10:10:00+02:00', evidence: 'Fórmula ENS-26-000 · 62%', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-011', sourceId: 'trace-barrels-001', targetId: 'trace-blend-001', relation: 'component_of', quantity: 1520, unit: 'L', occurredAt: '2026-09-02T10:10:00+02:00', evidence: 'Fórmula ENS-26-000 · 38%', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-012', sourceId: 'trace-barrels-001', targetId: 'trace-blend-002', relation: 'component_of', quantity: 2100, unit: 'L', occurredAt: '2026-09-18T13:05:00+02:00', evidence: 'Fórmula ENS-26-003 · 70%', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-013', sourceId: 'trace-wine-003', targetId: 'trace-blend-002', relation: 'component_of', quantity: 900, unit: 'L', occurredAt: '2026-09-18T13:05:00+02:00', evidence: 'Fórmula ENS-26-003 · 30%', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-014', sourceId: 'trace-wine-004', targetId: 'trace-blend-003', relation: 'component_of', quantity: 2200, unit: 'L', occurredAt: '2026-09-17T11:05:00+02:00', evidence: 'Fórmula ENS-26-005 · pendiente de cierre', status: 'pending' },
  { id: 'trace-link-015', sourceId: 'trace-blend-001', targetId: 'trace-order-006', relation: 'bottled_as', quantity: 3951, unit: 'L', occurredAt: '2026-09-12T08:00:00+02:00', evidence: 'Orden EMB-26-006', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-016', sourceId: 'trace-blend-002', targetId: 'trace-order-007', relation: 'bottled_as', quantity: 3000, unit: 'L', occurredAt: '2026-09-22T07:30:00+02:00', evidence: 'Orden EMB-26-007', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-017', sourceId: 'trace-blend-003', targetId: 'trace-order-008', relation: 'bottled_as', quantity: 2200, unit: 'L', occurredAt: '2026-09-24T08:00:00+02:00', evidence: 'Orden EMB-26-008 · liberación pendiente', status: 'pending' },
  { id: 'trace-link-018', sourceId: 'trace-order-006', targetId: 'trace-finished-001', relation: 'produced_as', quantity: 5220, unit: 'bottles', occurredAt: '2026-09-12T15:42:00+02:00', evidence: 'Cierre de tirada EMB-26-006', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-019', sourceId: 'pack-bottle-001', targetId: 'trace-finished-001', relation: 'packaged_with', quantity: 5262, unit: 'units', occurredAt: '2026-09-12T15:42:00+02:00', evidence: 'Consumo de material VE-260914-B7', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-020', sourceId: 'pack-closure-001', targetId: 'trace-finished-001', relation: 'packaged_with', quantity: 5262, unit: 'units', occurredAt: '2026-09-12T15:42:00+02:00', evidence: 'Consumo de material AM-26-4481', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-021', sourceId: 'pack-front-001', targetId: 'trace-finished-001', relation: 'packaged_with', quantity: 5262, unit: 'units', occurredAt: '2026-09-12T15:42:00+02:00', evidence: 'Consumo de material GL-26188', status: 'verified', verifiedBy: 'Martín Ruiz' },
  { id: 'trace-link-022', sourceId: 'pack-back-001', targetId: 'trace-finished-001', relation: 'packaged_with', quantity: 5220, unit: 'units', occurredAt: '2026-09-12T15:42:00+02:00', evidence: 'Numeración 100001–105220', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-023', sourceId: 'pack-bottle-001', targetId: 'trace-order-007', relation: 'packaged_with', quantity: 4080, unit: 'units', occurredAt: '2026-09-20T12:15:00+02:00', evidence: 'Reserva de material EMB-26-007', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-024', sourceId: 'pack-closure-001', targetId: 'trace-order-007', relation: 'packaged_with', quantity: 4080, unit: 'units', occurredAt: '2026-09-20T12:15:00+02:00', evidence: 'Reserva de material EMB-26-007', status: 'verified', verifiedBy: 'Elena Martín' },
  { id: 'trace-link-025', sourceId: 'pack-back-001', targetId: 'trace-order-007', relation: 'packaged_with', quantity: 4080, unit: 'units', occurredAt: '2026-09-20T12:15:00+02:00', evidence: 'Reserva serie TR-26-A', status: 'verified', verifiedBy: 'Elena Martín' },
]

export const recallSimulations: RecallSimulation[] = [
  { id: 'recall-sim-001', code: 'SIM-26-001', targetEntityId: 'pack-closure-001', targetCode: 'AM-26-4481', reason: 'trace_test', notes: 'Ejercicio interno de localización por lote de corcho.', affectedEntityIds: ['pack-closure-001', 'trace-finished-001', 'trace-order-006', 'trace-order-007', 'trace-blend-001', 'trace-blend-002', 'trace-wine-001', 'trace-wine-002', 'trace-wine-003', 'trace-barrels-001', 'trace-delivery-001', 'trace-delivery-002', 'trace-delivery-003', 'trace-parcel-001', 'trace-parcel-002', 'trace-parcel-003'], affectedFinishedLotIds: ['trace-finished-001'], affectedBottlingOrderIds: ['trace-order-006', 'trace-order-007'], sourceParcelIds: ['trace-parcel-001', 'trace-parcel-002', 'trace-parcel-003'], createdAt: '2026-09-20T16:30:00+02:00', createdBy: 'Elena Martín', status: 'completed' },
]

export const suppliers: Supplier[] = [
  { id: 'supplier-001', code: 'PROV-001', name: 'Laffort España', taxId: 'B26340521', contactName: 'Ana López', email: 'pedidos@laffort.es', phone: '+34 941 000 101', status: 'active', approvedAt: '2026-01-15T10:00:00+01:00', notes: 'Proveedor habitual de levaduras y nutrientes.' },
  { id: 'supplier-002', code: 'PROV-002', name: 'Agrovin', taxId: 'A13013415', contactName: 'Carlos Sanz', email: 'rioja@agrovin.com', phone: '+34 941 000 202', status: 'active', approvedAt: '2026-02-03T09:30:00+01:00', notes: 'Productos de protección y estabilización.' },
  { id: 'supplier-003', code: 'PROV-003', name: 'Higiene Enológica Norte', taxId: 'B26590117', contactName: 'Marta Gil', email: 'pedidos@henorte.example', phone: '+34 941 000 303', status: 'active', approvedAt: '2026-03-12T12:00:00+01:00', notes: 'Productos de limpieza para depósitos y línea.' },
]

export const productMasters: ProductMaster[] = [
  { id: 'product-001', code: 'LEV-TIN-01', name: 'Levadura selección tinto', category: 'yeast', manufacturer: 'Laffort', defaultUnit: 'kg', storageInstructions: 'Conservar seco entre 5 y 15 °C.', technicalSheetRef: 'FT-LEV-TIN-01', safetySheetRef: 'FDS-LEV-TIN-01', active: true },
  { id: 'product-002', code: 'NUT-ORG-01', name: 'Nutriente orgánico de fermentación', category: 'nutrient', manufacturer: 'Laffort', defaultUnit: 'kg', storageInstructions: 'Envase cerrado, lugar fresco y seco.', technicalSheetRef: 'FT-NUT-ORG-01', active: true },
  { id: 'product-003', code: 'SO2-SOL-06', name: 'Solución sulfurosa 6 %', category: 'sulphur', manufacturer: 'Agrovin', defaultUnit: 'L', storageInstructions: 'Ventilado, protegido de calor y luz.', technicalSheetRef: 'FT-SO2-06', safetySheetRef: 'FDS-SO2-06', active: true },
  { id: 'product-004', code: 'EST-TAR-01', name: 'Estabilizante tartárico', category: 'stabilisation', manufacturer: 'Agrovin', defaultUnit: 'kg', storageInstructions: 'Conservar en lugar seco.', technicalSheetRef: 'FT-EST-TAR-01', active: true },
  { id: 'product-005', code: 'LIM-ALC-01', name: 'Detergente alcalino de bodega', category: 'cleaning', manufacturer: 'Higiene Enológica Norte', defaultUnit: 'L', storageInstructions: 'Armario químico, separado de ácidos.', technicalSheetRef: 'FT-LIM-ALC-01', safetySheetRef: 'FDS-LIM-ALC-01', active: true },
]

export const productLots: ProductLot[] = [
  { id: 'product-lot-001', code: 'INS-26-001', productId: 'product-001', supplierId: 'supplier-001', supplierLot: 'LA-260711-84', receivedAt: '2026-07-14T09:20:00+02:00', expiresAt: '2028-01-31', quantityReceived: 20, quantityOnHand: 14.5, unit: 'kg', location: 'Almacén seco · A-02', locationBalances: [{ location: 'Almacén seco · A-02', quantity: 14.5 }], status: 'approved', certificateRef: 'COA-LA-260711-84', releasedAt: '2026-07-14T12:10:00+02:00', releasedBy: 'Elena Martín', notes: 'Envases íntegros; recepción a 11 °C.' },
  { id: 'product-lot-002', code: 'INS-26-002', productId: 'product-002', supplierId: 'supplier-001', supplierLot: 'LA-260718-21', receivedAt: '2026-07-21T10:05:00+02:00', expiresAt: '2027-11-30', quantityReceived: 25, quantityOnHand: 25, unit: 'kg', location: 'Almacén seco · A-03', locationBalances: [{ location: 'Almacén seco · A-03', quantity: 25 }], status: 'quarantine', certificateRef: 'COA-LA-260718-21', notes: 'Pendiente de revisión documental.' },
  { id: 'product-lot-003', code: 'INS-26-003', productId: 'product-003', supplierId: 'supplier-002', supplierLot: 'AG-S6-26042', receivedAt: '2026-07-22T08:45:00+02:00', expiresAt: '2027-07-01', quantityReceived: 60, quantityOnHand: 48, unit: 'L', location: 'Almacén químico · Q-01', locationBalances: [{ location: 'Almacén químico · Q-01', quantity: 48 }], status: 'approved', certificateRef: 'COA-AG-S6-26042', releasedAt: '2026-07-22T11:00:00+02:00', releasedBy: 'Lucía Sáenz', notes: 'Bidones precintados.' },
  { id: 'product-lot-004', code: 'INS-26-004', productId: 'product-004', supplierId: 'supplier-002', supplierLot: 'AG-EST-2611', receivedAt: '2026-07-25T09:10:00+02:00', expiresAt: '2029-04-30', quantityReceived: 15, quantityOnHand: 15, unit: 'kg', location: 'Almacén seco · B-01', locationBalances: [{ location: 'Almacén seco · B-01', quantity: 15 }], status: 'approved', certificateRef: 'COA-AG-EST-2611', releasedAt: '2026-07-25T12:00:00+02:00', releasedBy: 'Elena Martín', notes: '' },
  { id: 'product-lot-005', code: 'INS-26-005', productId: 'product-005', supplierId: 'supplier-003', supplierLot: 'HEN-260729-A', receivedAt: '2026-07-30T08:30:00+02:00', expiresAt: '2028-07-01', quantityReceived: 80, quantityOnHand: 80, unit: 'L', location: 'Almacén químico · Q-04', locationBalances: [{ location: 'Almacén químico · Q-04', quantity: 80 }], status: 'quarantine', notes: 'Pendiente de ficha de seguridad actualizada.' },
]

export const productStockTransactions: ProductStockTransaction[] = productLots.map((lot) => ({
  id: `stock-${lot.id}-receipt`, productLotId: lot.id, type: 'receipt', quantity: lot.quantityReceived, unit: lot.unit, occurredAt: lot.receivedAt, recordedAt: lot.receivedAt, operator: 'Martín Ruiz', toLocation: lot.location, reference: lot.supplierLot, notes: 'Recepción inicial de producto.',
}))
