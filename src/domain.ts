import { images, redProcess, whiteProcess } from './data'
import type { CellarTask, GrapeDelivery, LabAnalysisKey, LabResult, LabResultsInput, LabSample, LabProfile, LotActivity, NewGrapeIntakeInput, NewLabSampleInput, NewLotInput, NewTaskInput, ProcessStage, Tank, VineyardParcel, WineLot } from './types'

const nowId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const initialProcess = (template: ProcessStage[]) => template.map((stage, index) => ({
  ...stage,
  status: index === 0 ? 'current' as const : stage.status === 'optional' ? 'optional' as const : 'upcoming' as const,
}))

export const nextLotCode = (type: NewLotInput['type'], vintage: number, lots: WineLot[]) => {
  const prefix = type === 'tinto' ? 'T' : 'B'
  const year = String(vintage).slice(-2)
  const matcher = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  const highest = lots.reduce((maximum, lot) => {
    const match = lot.id.match(matcher)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `${prefix}-${year}-${String(highest + 1).padStart(3, '0')}`
}

export const createLot = (input: NewLotInput): WineLot => {
  const isRed = input.type === 'tinto'
  const process = initialProcess(isRed ? redProcess : whiteProcess)
  const recordedAt = new Date().toISOString()
  const activity: LotActivity = {
    id: nowId('activity'),
    title: 'Lote creado',
    person: 'Elena Martín',
    time: 'Ahora',
    detail: `${input.receivedKg.toLocaleString('es-ES')} kg recibidos · ${input.vessel}`,
    recordedAt,
  }

  return {
    id: input.id.trim().toUpperCase(),
    name: input.name.trim(),
    type: input.type,
    varieties: input.varieties.trim(),
    origin: input.origin.trim(),
    vintage: input.vintage,
    volume: input.volume,
    vessel: input.vessel,
    stage: process[0].label,
    temperature: input.temperature,
    density: input.density,
    progress: 4,
    attention: 'normal',
    nextAction: isRed ? 'Completar selección y encubado' : 'Registrar prensado y fracciones',
    nextTime: 'Hoy',
    image: isRed ? images.cellar : images.whiteGrapes,
    process,
    readings: [{
      time: 'Recepción',
      temperature: input.temperature,
      density: input.density,
      volume: input.volume,
      recordedAt,
    }],
    activities: [activity],
    productionDetails: {
      receivedKg: input.receivedKg,
      receptionDate: input.receptionDate,
      initialDensity: input.density,
      receptionTemperature: input.temperature,
      red: isRed ? { macerationPlan: input.macerationPlan ?? 'Tradicional' } : undefined,
      white: !isRed ? {
        pressFraction: input.pressFraction ?? 'Mosto yema',
        turbidityTarget: input.turbidityTarget ?? 100,
        protection: input.protection ?? 'Inertizado',
      } : undefined,
    },
  }
}

export const createOpeningTask = (lot: WineLot): CellarTask => ({
  id: nowId('task'),
  title: lot.type === 'tinto' ? 'Completar selección y encubado' : 'Registrar prensado y fracciones',
  lot: lot.id,
  time: 'Hoy',
  assignee: 'Elena',
  priority: 'media',
  complete: false,
})

export const createTask = (input: NewTaskInput): CellarTask => ({
  id: nowId('task'),
  ...input,
  title: input.title.trim(),
  complete: false,
})

export const assignLotToTank = (tanks: Tank[], lot: WineLot) => tanks.map((tank) => tank.id === lot.vessel
  ? {
      ...tank,
      volume: lot.volume,
      lot: lot.id,
      type: lot.type,
      stage: 'Recepción',
      temperature: lot.temperature,
      attention: 'normal' as const,
    }
  : tank)

export const receiveGrapeDelivery = (
  deliveries: GrapeDelivery[],
  parcels: VineyardParcel[],
  input: NewGrapeIntakeInput,
) => {
  const parcel = parcels.find((item) => item.id === input.parcelId)
  if (!parcel) throw new Error('Parcel not found')
  const netKg = input.grossKg - input.tareKg
  const recordedAt = new Date().toISOString()
  const existing = deliveries.find((delivery) => delivery.id === input.deliveryId)
  const delivery: GrapeDelivery = {
    id: existing?.id ?? nowId('delivery'),
    code: existing?.code ?? `ENT-${String(new Date().getFullYear()).slice(-2)}-${String(deliveries.length + 41).padStart(3, '0')}`,
    parcelId: parcel.id,
    grower: parcel.grower,
    varieties: parcel.varieties,
    origin: `${parcel.municipality} · ${parcel.zone}`,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    expectedKg: input.expectedKg,
    status: 'received',
    vehicle: input.vehicle.trim().toUpperCase(),
    processingDestination: input.processingDestination,
    receivedAt: recordedAt,
    grossKg: input.grossKg,
    tareKg: input.tareKg,
    netKg,
    temperature: input.temperature,
    potentialAlcohol: input.potentialAlcohol,
    condition: input.condition,
    notes: input.notes.trim(),
  }
  const parcelHasPendingDeliveries = deliveries.some((item) => item.parcelId === parcel.id && item.id !== delivery.id && item.status !== 'received')
  return {
    delivery,
    deliveries: existing
      ? deliveries.map((item) => item.id === existing.id ? delivery : item)
      : [delivery, ...deliveries],
    parcels: parcels.map((item) => item.id === parcel.id ? { ...item, readiness: parcelHasPendingDeliveries ? 'scheduled' as const : 'harvested' as const } : item),
  }
}

export const labAnalysisProfiles: Record<LabProfile, LabAnalysisKey[]> = {
  maturity: ['potential_alcohol', 'ph', 'total_acidity'],
  fermentation: ['temperature', 'density', 'ph', 'total_acidity', 'volatile_acidity'],
  malolactic: ['malic_acid', 'ph', 'volatile_acidity', 'free_so2'],
  bottling: ['free_so2', 'total_so2', 'turbidity', 'residual_sugar'],
}

export const labAnalysisUnits: Record<LabAnalysisKey, string> = {
  temperature: '°C', density: '', ph: '', total_acidity: 'g/L', volatile_acidity: 'g/L', potential_alcohol: '% vol.',
  malic_acid: 'g/L', free_so2: 'mg/L', total_so2: 'mg/L', turbidity: 'NTU', residual_sugar: 'g/L',
}

const evaluateLabResult = (analysis: LabAnalysisKey, value: number): LabResult['status'] => {
  const warning = () => 'warning' as const
  const critical = () => 'critical' as const
  switch (analysis) {
    case 'temperature': return value >= 8 && value <= 30 ? 'normal' : value >= 4 && value <= 35 ? warning() : critical()
    case 'density': return value >= 0.98 && value <= 1.15 ? 'normal' : warning()
    case 'ph': return value >= 2.9 && value <= 4 ? 'normal' : value >= 2.7 && value <= 4.2 ? warning() : critical()
    case 'total_acidity': return value >= 4 && value <= 9 ? 'normal' : value >= 3 && value <= 11 ? warning() : critical()
    case 'volatile_acidity': return value < 0.8 ? 'normal' : value <= 1.2 ? warning() : critical()
    case 'potential_alcohol': return value >= 9 && value <= 16 ? 'normal' : warning()
    case 'malic_acid': return value <= 0.3 ? 'normal' : value <= 0.8 ? warning() : critical()
    case 'free_so2': return value >= 15 && value <= 45 ? 'normal' : value >= 8 && value <= 60 ? warning() : critical()
    case 'total_so2': return value <= 150 ? 'normal' : value <= 200 ? warning() : critical()
    case 'turbidity': return value <= 2 ? 'normal' : value <= 5 ? warning() : critical()
    case 'residual_sugar': return value <= 4 ? 'normal' : value <= 9 ? warning() : critical()
  }
}

export const createLabSample = (
  input: NewLabSampleInput,
  samples: LabSample[],
  lots: WineLot[],
  deliveries: GrapeDelivery[],
  parcels: VineyardParcel[],
): LabSample => {
  const lot = input.sourceType === 'lot' ? lots.find((item) => item.id === input.sourceId) : undefined
  const delivery = input.sourceType === 'delivery' ? deliveries.find((item) => item.code === input.sourceId) : undefined
  const parcel = input.sourceType === 'parcel'
    ? parcels.find((item) => item.id === input.sourceId)
    : delivery ? parcels.find((item) => item.id === delivery.parcelId) : undefined
  if (!lot && !delivery && !parcel) throw new Error('Sample source not found')
  const highest = samples.reduce((maximum, sample) => {
    const match = sample.code.match(/^LAB-\d{2}-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  const now = new Date().toISOString()
  return {
    id: nowId('sample'), code: `LAB-${String(new Date().getFullYear()).slice(-2)}-${String(highest + 1).padStart(3, '0')}`,
    sourceType: input.sourceType, sourceId: input.sourceId, sourceName: lot?.name ?? parcel?.name ?? delivery?.varieties ?? input.sourceId,
    wineType: lot?.type, profile: input.profile, collectedAt: now, collectedBy: 'Elena Martín', assignedTo: input.assignedTo,
    dueAt: input.dueAt, priority: input.priority, status: 'queued', requestedAnalyses: labAnalysisProfiles[input.profile], results: [], notes: input.notes.trim(),
  }
}

export const recordLabResults = (samples: LabSample[], input: LabResultsInput) => {
  const current = samples.find((sample) => sample.id === input.sampleId)
  if (!current) throw new Error('Sample not found')
  const results = current.requestedAnalyses.map((analysis) => {
    const value = input.values[analysis]
    if (value === undefined || !Number.isFinite(value)) throw new Error('Missing analysis result')
    return { analysis, value, unit: labAnalysisUnits[analysis], status: evaluateLabResult(analysis, value) }
  })
  const status = results.some((result) => result.status !== 'normal') ? 'review' as const : 'validated' as const
  const updated: LabSample = { ...current, status, results, notes: input.notes.trim() || current.notes, validatedAt: new Date().toISOString() }
  return { sample: updated, samples: samples.map((sample) => sample.id === updated.id ? updated : sample) }
}
