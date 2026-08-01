import { images, redProcess, whiteProcess } from './data'
import type { Barrel, BarrelOperation, BlendAnalysis, BlendCandidate, BlendTastingInput, BlendTrial, CellarTask, GrapeDelivery, LabAnalysisKey, LabResult, LabResultsInput, LabSample, LabProfile, LotActivity, NewBarrelInput, NewBarrelOperationInput, NewBlendTrialInput, NewGrapeIntakeInput, NewLabSampleInput, NewLotInput, NewTaskInput, ProcessStage, Tank, VineyardParcel, WineLot } from './types'

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

export const nextBarrelCode = (barrels: Barrel[]) => {
  const highest = barrels.reduce((maximum, barrel) => {
    const match = barrel.code.match(/^BR-N-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `BR-N-${String(highest + 1).padStart(2, '0')}`
}

export const createBarrel = (input: NewBarrelInput, barrels: Barrel[], lots: WineLot[]): Barrel => {
  const code = input.code.trim().toUpperCase()
  const position = input.position.trim().toUpperCase()
  if (!code || !position || !input.room.trim() || !input.cooperage.trim() || input.capacity <= 0 || input.useNumber < 1) throw new Error('Invalid barrel identity')
  if (barrels.some((barrel) => barrel.code.toUpperCase() === code)) throw new Error('Barrel code already exists')
  if (barrels.some((barrel) => barrel.room === input.room.trim() && barrel.position.toUpperCase() === position)) throw new Error('Barrel position already occupied')
  const lot = input.lotId ? lots.find((item) => item.id === input.lotId) : undefined
  if (input.lotId && !lot) throw new Error('Wine lot not found')
  const filled = Boolean(lot)
  return {
    id: nowId('barrel'), code, cooperage: input.cooperage.trim(), oakOrigin: input.oakOrigin, toast: input.toast,
    grain: input.grain, capacity: input.capacity, volume: filled ? input.capacity : 0, status: filled ? 'filled' : 'empty', room: input.room.trim(),
    rack: input.rack.trim().toUpperCase(), position, useNumber: input.useNumber, lotId: lot?.id, lotName: lot?.name,
    wineType: lot?.type, filledAt: filled ? new Date().toISOString().slice(0, 10) : undefined, plannedMonths: filled ? input.plannedMonths : undefined,
    attention: 'normal', nextAction: filled ? 'Control de SO₂' : 'Limpieza y conservación', nextDue: filled ? '7 días' : 'Esta semana', notes: input.notes.trim(),
  }
}

export const recordBarrelOperation = (
  barrels: Barrel[],
  operations: BarrelOperation[],
  input: NewBarrelOperationInput,
) => {
  const targets = input.targetType === 'barrel' ? barrels.filter((barrel) => barrel.id === input.targetId) : barrels.filter((barrel) => barrel.lotId === input.targetId)
  if (!targets.length) throw new Error('Barrel operation target not found')
  const requiresWine = ['top_up', 'tasting', 'so2_check', 'racking'].includes(input.type)
  if (requiresWine && targets.some((barrel) => barrel.status !== 'filled')) throw new Error('Operation requires filled barrels')
  if (['cleaning', 'repair'].includes(input.type) && targets.some((barrel) => barrel.status === 'filled')) throw new Error('Wine must be transferred before maintenance')
  const totalHeadspace = targets.reduce((total, barrel) => total + Math.max(0, barrel.capacity - barrel.volume), 0)
  if (input.type === 'top_up' && (!Number.isFinite(input.volumeAdded) || input.volumeAdded <= 0 || input.volumeAdded > totalHeadspace + 0.001)) throw new Error('Topping-up volume exceeds measured headspace')
  const targetIds = new Set(targets.map((barrel) => barrel.id))
  const additions = new Map(targets.map((barrel) => [barrel.id, input.type === 'top_up' && totalHeadspace > 0 ? input.volumeAdded * Math.max(0, barrel.capacity - barrel.volume) / totalHeadspace : 0]))
  const nextByType: Record<NewBarrelOperationInput['type'], { action: string; due: string }> = {
    top_up: { action: 'Control de SO₂', due: '7 días' }, tasting: { action: 'Cata de evolución', due: '30 días' }, so2_check: { action: 'Relleno de barrica', due: '14 días' },
    racking: { action: 'Control de turbidez', due: '48 h' }, cleaning: { action: 'Conservación de barrica', due: 'Esta semana' }, repair: { action: 'Limpieza y conservación', due: 'Mañana' },
  }
  const next = nextByType[input.type]
  const updatedBarrels = barrels.map((barrel) => {
    if (!targetIds.has(barrel.id)) return barrel
    if (input.type === 'repair') return { ...barrel, status: 'empty' as const, volume: 0, lotId: undefined, lotName: undefined, wineType: undefined, filledAt: undefined, plannedMonths: undefined, attention: 'normal' as const, nextAction: next.action, nextDue: next.due }
    if (input.type === 'cleaning') return { ...barrel, attention: 'normal' as const, nextAction: next.action, nextDue: next.due }
    return { ...barrel, volume: Math.min(barrel.capacity, barrel.volume + (additions.get(barrel.id) ?? 0)), attention: input.type === 'top_up' ? 'normal' as const : barrel.attention, nextAction: next.action, nextDue: next.due }
  })
  const targetLabel = input.targetType === 'lot' ? `${targets[0].lotId} · ${targets[0].lotName}` : targets[0].code
  const operation: BarrelOperation = {
    id: nowId('barrel-op'), type: input.type, barrelIds: targets.map((barrel) => barrel.id), targetLabel, performedAt: input.performedAt,
    person: 'Elena Martín', volumeAdded: input.type === 'top_up' ? input.volumeAdded : undefined, notes: input.notes.trim(),
  }
  return { barrels: updatedBarrels, operations: [operation, ...operations], operation }
}

export const reservedBlendVolume = (candidateId: string, trials: BlendTrial[], excludedTrialId?: string) => trials
  .filter((trial) => trial.status === 'approved' && trial.id !== excludedTrialId)
  .reduce((total, trial) => {
    const component = trial.components.find((item) => item.candidateId === candidateId)
    return total + (component ? trial.targetVolume * component.percentage / 100 : 0)
  }, 0)

export const estimateBlendAnalysis = (components: NewBlendTrialInput['components'], candidates: BlendCandidate[]): BlendAnalysis => {
  const value = (key: keyof BlendAnalysis) => components.reduce((total, component) => {
    const candidate = candidates.find((item) => item.id === component.candidateId)
    return total + (candidate?.analysis[key] ?? 0) * component.percentage / 100
  }, 0)
  return {
    alcohol: Number(value('alcohol').toFixed(2)),
    ph: Number(value('ph').toFixed(2)),
    totalAcidity: Number(value('totalAcidity').toFixed(2)),
    colorIntensity: Number(value('colorIntensity').toFixed(2)),
  }
}

const validateBlendFormula = (input: NewBlendTrialInput, candidates: BlendCandidate[], trials: BlendTrial[], excludedTrialId?: string) => {
  if (!input.name.trim() || !input.objective.trim() || !Number.isFinite(input.targetVolume) || input.targetVolume <= 0) throw new Error('Invalid blend identity')
  if (input.components.length < 2 || new Set(input.components.map((item) => item.candidateId)).size !== input.components.length) throw new Error('Blend requires distinct components')
  const percentage = input.components.reduce((total, item) => total + item.percentage, 0)
  if (Math.abs(percentage - 100) > 0.01 || input.components.some((item) => item.percentage <= 0)) throw new Error('Blend formula must total 100%')
  input.components.forEach((component) => {
    const candidate = candidates.find((item) => item.id === component.candidateId)
    if (!candidate || candidate.type !== input.type) throw new Error('Incompatible blend component')
    const remaining = candidate.availableVolume - reservedBlendVolume(candidate.id, trials, excludedTrialId)
    if (input.targetVolume * component.percentage / 100 > remaining + 0.01) throw new Error('Blend component volume unavailable')
  })
}

export const nextBlendCode = (trials: BlendTrial[]) => {
  const highest = trials.reduce((maximum, trial) => {
    const match = trial.code.match(/^ENS-\d{2}-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `ENS-${String(new Date().getFullYear()).slice(-2)}-${String(highest + 1).padStart(3, '0')}`
}

export const createBlendTrial = (input: NewBlendTrialInput, candidates: BlendCandidate[], trials: BlendTrial[]): BlendTrial => {
  validateBlendFormula(input, candidates, trials)
  return {
    id: nowId('blend-trial'), code: nextBlendCode(trials), name: input.name.trim(), type: input.type, targetVolume: input.targetVolume,
    objective: input.objective.trim(), status: 'draft', components: input.components.map((component) => ({ ...component })),
    estimatedAnalysis: estimateBlendAnalysis(input.components, candidates), createdAt: new Date().toISOString(), createdBy: 'Elena Martín',
  }
}

export const recordBlendTasting = (trials: BlendTrial[], input: BlendTastingInput) => {
  const trial = trials.find((item) => item.id === input.trialId)
  if (!trial || trial.status === 'approved') throw new Error('Blend trial is not available for tasting')
  const scores = [input.visual, input.aroma, input.palate, input.balance]
  if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) throw new Error('Invalid tasting score')
  const updated: BlendTrial = {
    ...trial,
    status: input.recommendation === 'reject' ? 'rejected' : 'tasting',
    tasting: {
      visual: input.visual, aroma: input.aroma, palate: input.palate, balance: input.balance,
      recommendation: input.recommendation, notes: input.notes.trim(), tastedAt: new Date().toISOString(), tastedBy: 'Elena Martín',
    },
  }
  return { trial: updated, trials: trials.map((item) => item.id === updated.id ? updated : item) }
}

export const approveBlendTrial = (trials: BlendTrial[], candidates: BlendCandidate[], trialId: string) => {
  const trial = trials.find((item) => item.id === trialId)
  if (!trial || trial.status === 'approved' || trial.tasting?.recommendation !== 'promising') throw new Error('Blend trial requires a favourable tasting')
  validateBlendFormula({ name: trial.name, type: trial.type, targetVolume: trial.targetVolume, objective: trial.objective, components: trial.components }, candidates, trials, trial.id)
  if (trial.components.some((component) => candidates.find((candidate) => candidate.id === component.candidateId)?.readiness !== 'ready')) throw new Error('All components must be released before approval')
  const updated: BlendTrial = { ...trial, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: 'Elena Martín' }
  return { trial: updated, trials: trials.map((item) => item.id === updated.id ? updated : item) }
}
