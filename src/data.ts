import type { CellarTask, GrapeDelivery, LabSample, ProcessStage, Tank, VineyardParcel, WineLot } from './types'

export const images = {
  vineyard: 'https://images.unsplash.com/photo-1727647279740-bb8a586193fa?auto=format&fit=crop&w=1800&q=82',
  cellar: 'https://images.unsplash.com/photo-1701596979350-3ba7ae9ecd5e?auto=format&fit=crop&w=1800&q=82',
  tanks: 'https://images.unsplash.com/photo-1765850258953-16e2b4cf70db?auto=format&fit=crop&w=1800&q=82',
  barrels: 'https://images.unsplash.com/photo-1561906814-23da9a8bfee0?auto=format&fit=crop&w=1800&q=82',
  whiteGrapes: 'https://images.unsplash.com/photo-1686359532306-f95743030ad5?auto=format&fit=crop&w=1800&q=82',
  laboratory: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1800&q=82',
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
]

export const initialTasks: CellarTask[] = [
  { id: '1', title: 'Remontado suave', lot: 'T-26-017', time: '14:30', assignee: 'Martín', priority: 'alta', complete: false },
  { id: '2', title: 'Registrar densidad', lot: 'T-26-017', time: '16:00', assignee: 'Elena', priority: 'media', complete: false },
  { id: '3', title: 'Revisar temperatura', lot: 'B-26-006', time: '17:30', assignee: 'Elena', priority: 'normal', complete: false },
  { id: '4', title: 'Toma de muestra maloláctica', lot: 'T-25-012', time: '18:00', assignee: 'Lucía', priority: 'media', complete: false },
  { id: '5', title: 'Rellenar barricas', lot: 'CR-25-004', time: 'Mañana', assignee: 'Martín', priority: 'normal', complete: false },
]

export const tanks: Tank[] = [
  { id: 'D-01', capacity: 10000, volume: 0, attention: 'normal' },
  { id: 'D-02', capacity: 10000, volume: 9200, lot: 'T-26-014', type: 'tinto', stage: 'Maceración', temperature: 23.4, attention: 'normal' },
  { id: 'D-03', capacity: 7500, volume: 6800, lot: 'T-26-015', type: 'tinto', stage: 'Fermentación', temperature: 25.1, attention: 'warning' },
  { id: 'D-04', capacity: 6000, volume: 5200, lot: 'B-26-006', type: 'blanco', stage: 'Fermentación en frío', temperature: 15.2, attention: 'normal' },
  { id: 'D-05', capacity: 6000, volume: 0, attention: 'normal' },
  { id: 'D-06', capacity: 7500, volume: 6100, lot: 'B-26-004', type: 'blanco', stage: 'Desfangado', temperature: 10.4, attention: 'normal' },
  { id: 'D-11', capacity: 10000, volume: 8700, lot: 'T-26-016', type: 'tinto', stage: 'Fermentación', temperature: 24.1, attention: 'normal' },
  { id: 'D-12', capacity: 10000, volume: 7850, lot: 'T-26-017', type: 'tinto', stage: 'Fermentación', temperature: 24.8, attention: 'warning' },
  { id: 'D-13', capacity: 10000, volume: 9800, lot: 'T-26-019', type: 'tinto', stage: 'Encubado', temperature: 20.7, attention: 'critical' },
  { id: 'D-18', capacity: 12000, volume: 9100, lot: 'T-25-012', type: 'tinto', stage: 'Maloláctica', temperature: 19.1, attention: 'warning' },
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
