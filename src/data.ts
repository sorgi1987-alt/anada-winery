import type { CellarTask, ProcessStage, Tank, WineLot } from './types'

export const images = {
  vineyard: 'https://images.unsplash.com/photo-1727647279740-bb8a586193fa?auto=format&fit=crop&w=1800&q=82',
  cellar: 'https://images.unsplash.com/photo-1701596979350-3ba7ae9ecd5e?auto=format&fit=crop&w=1800&q=82',
  tanks: 'https://images.unsplash.com/photo-1765850258953-16e2b4cf70db?auto=format&fit=crop&w=1800&q=82',
  barrels: 'https://images.unsplash.com/photo-1561906814-23da9a8bfee0?auto=format&fit=crop&w=1800&q=82',
  whiteGrapes: 'https://images.unsplash.com/photo-1686359532306-f95743030ad5?auto=format&fit=crop&w=1800&q=82',
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
