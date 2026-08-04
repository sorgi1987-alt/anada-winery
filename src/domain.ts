import { images, redProcess, roseProcesses, whiteProcess } from './data'
import type { AdvanceRedStageInput, AdvanceRoseStageInput, AdvanceWhiteStageInput, Barrel, BarrelOperation, BlendAnalysis, BlendCandidate, BlendTastingInput, BlendTrial, BottlingGateKey, BottlingOrder, CellarTask, CompleteBottlingOrderInput, GrapeDelivery, LabAnalysisKey, LabResult, LabResultsInput, LabSample, LabProfile, LotActivity, NewBarrelInput, NewBarrelOperationInput, NewBlendTrialInput, NewBottlingOrderInput, NewGrapeIntakeInput, NewLabSampleInput, NewLotInput, NewMergeInput, NewProductLotInput, NewProductMasterInput, NewRecallSimulationInput, NewRedOperationInput, NewRoseOperationInput, NewSplitInput, NewSupplierInput, NewTaskInput, NewTransferInput, NewWhiteOperationInput, PackagingMaterial, ProcessStage, ProductLot, ProductLotStatus, ProductMaster, ProductStockTransaction, ProductionEvent, RecallSimulation, RedOperationType, RedStageGate, RoseMethod, RoseOperationType, RoseStageGate, Supplier, Tank, TraceabilityDirection, TraceabilityEntity, TraceabilityLink, VineyardParcel, WhiteOperationType, WhiteStageGate, WineLot, WineMovement } from './types'

const nowId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const nextMasterCode = (prefix: string, codes: string[]) => {
  const sequence = codes.reduce((maximum, code) => {
    const match = code.match(new RegExp(`^${prefix}-(\\d+)$`))
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0) + 1
  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

export const createSupplier = (input: NewSupplierInput, suppliers: Supplier[]) => {
  const name = input.name.trim()
  const taxId = input.taxId.trim().toUpperCase()
  const email = input.email.trim().toLowerCase()
  if (!name || !taxId || !input.contactName.trim() || !email) throw new Error('Name, tax ID, contact and email are required')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email is required')
  if (suppliers.some((supplier) => supplier.taxId.trim().toUpperCase() === taxId)) throw new Error('A supplier with this tax ID already exists')
  if (suppliers.some((supplier) => supplier.name.trim().toLowerCase() === name.toLowerCase())) throw new Error('A supplier with this name already exists')
  const supplier: Supplier = {
    id: nowId('supplier'), code: nextMasterCode('PROV', suppliers.map((item) => item.code)), name, taxId,
    contactName: input.contactName.trim(), email, phone: input.phone.trim(), status: 'active', approvedAt: new Date().toISOString(), notes: input.notes.trim(),
  }
  return { supplier, suppliers: [supplier, ...suppliers] }
}

export const createProductMaster = (input: NewProductMasterInput, products: ProductMaster[]) => {
  const name = input.name.trim()
  const manufacturer = input.manufacturer.trim()
  const storageInstructions = input.storageInstructions.trim()
  if (!name || !manufacturer || !storageInstructions) throw new Error('Name, manufacturer and storage instructions are required')
  if (products.some((product) => product.name.trim().toLowerCase() === name.toLowerCase() && product.manufacturer.trim().toLowerCase() === manufacturer.toLowerCase())) throw new Error('This product already exists for the manufacturer')
  const product: ProductMaster = {
    id: nowId('product'), code: nextMasterCode('PROD', products.map((item) => item.code)), name, category: input.category, manufacturer,
    defaultUnit: input.defaultUnit, storageInstructions, ...(input.technicalSheetRef?.trim() ? { technicalSheetRef: input.technicalSheetRef.trim() } : {}),
    ...(input.safetySheetRef?.trim() ? { safetySheetRef: input.safetySheetRef.trim() } : {}), active: true,
  }
  return { product, products: [product, ...products] }
}

export const receiveProductLot = (input: NewProductLotInput, products: ProductMaster[], suppliers: Supplier[], lots: ProductLot[], transactions: ProductStockTransaction[]) => {
  const product = products.find((item) => item.id === input.productId && item.active)
  const supplier = suppliers.find((item) => item.id === input.supplierId && item.status === 'active')
  if (!product) throw new Error('An active product is required')
  if (!supplier) throw new Error('An active supplier is required')
  if (!input.supplierLot.trim() || !input.location.trim() || input.quantity <= 0) throw new Error('Lot, quantity and location are required')
  if (input.unit !== product.defaultUnit) throw new Error('The receipt unit must match the product master')
  if (input.expiresAt && input.expiresAt < input.receivedAt.slice(0, 10)) throw new Error('Expiry cannot precede receipt')
  if (lots.some((lot) => lot.productId === product.id && lot.supplierId === supplier.id && lot.supplierLot.toLowerCase() === input.supplierLot.trim().toLowerCase())) throw new Error('Supplier lot already exists for this product')
  const year = new Date(input.receivedAt).getFullYear().toString().slice(-2)
  const sequence = lots.reduce((maximum, lot) => {
    const match = lot.code.match(new RegExp(`^INS-${year}-(\\d+)$`))
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0) + 1
  const recordedAt = new Date().toISOString()
  const lot: ProductLot = {
    id: nowId('product-lot'), code: `INS-${year}-${String(sequence).padStart(3, '0')}`, productId: product.id, supplierId: supplier.id,
    supplierLot: input.supplierLot.trim(), receivedAt: input.receivedAt, ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}), quantityReceived: input.quantity,
    quantityOnHand: input.quantity, unit: input.unit, location: input.location.trim(), status: 'quarantine', ...(input.certificateRef?.trim() ? { certificateRef: input.certificateRef.trim() } : {}), notes: input.notes.trim(),
  }
  const transaction: ProductStockTransaction = {
    id: nowId('stock'), productLotId: lot.id, type: 'receipt', quantity: input.quantity, unit: input.unit, occurredAt: input.receivedAt, recordedAt,
    operator: 'Elena Martín', toLocation: lot.location, reference: lot.supplierLot, notes: input.notes.trim(),
  }
  return { lot, lots: [lot, ...lots], transaction, transactions: [transaction, ...transactions] }
}

export const effectiveProductLotStatus = (lot: ProductLot, today = new Date().toISOString().slice(0, 10)): ProductLotStatus =>
  lot.expiresAt && lot.expiresAt < today && (lot.status === 'approved' || lot.status === 'quarantine') ? 'expired' : lot.status

export const changeProductLotStatus = (lots: ProductLot[], transactions: ProductStockTransaction[], lotId: string, status: Extract<ProductLotStatus, 'approved' | 'rejected' | 'recalled'>, notes: string) => {
  const current = lots.find((lot) => lot.id === lotId)
  if (!current) throw new Error('Product lot not found')
  if (current.status === 'expired') throw new Error('An expired lot cannot be released')
  if (current.status === 'recalled' && status === 'approved') throw new Error('A recalled lot cannot be released')
  if (status === 'approved' && current.expiresAt && current.expiresAt < new Date().toISOString().slice(0, 10)) throw new Error('An expired product lot cannot be released')
  if (status !== 'approved' && !notes.trim()) throw new Error('A reason is required for rejection or recall')
  const recordedAt = new Date().toISOString()
  const updated: ProductLot = {
    ...current, status, notes: notes.trim() || current.notes,
    ...(status === 'approved' ? { releasedAt: recordedAt, releasedBy: 'Elena Martín' } : { releasedAt: undefined, releasedBy: undefined }),
  }
  const transaction: ProductStockTransaction = {
    id: nowId('stock'), productLotId: current.id, type: status === 'approved' ? 'release' : status === 'rejected' ? 'rejection' : 'recall', quantity: 0,
    unit: current.unit, occurredAt: recordedAt, recordedAt, operator: 'Elena Martín', reference: current.code, notes: notes.trim(),
  }
  return { lot: updated, lots: lots.map((lot) => lot.id === lotId ? updated : lot), transaction, transactions: [transaction, ...transactions] }
}

const initialProcess = (template: ProcessStage[]) => template.map((stage, index) => ({
  ...stage,
  status: index === 0 ? 'current' as const : stage.status === 'optional' ? 'optional' as const : 'upcoming' as const,
}))

const roseOpeningActions: Record<RoseMethod, string> = {
  direct_press: 'Registrar prensado directo y fracciones por color',
  short_maceration: 'Iniciar maceración pelicular corta',
  saignee: 'Iniciar maceración para sangrado',
  cofermentation: 'Confirmar encubado conjunto tras báscula',
}

export const roseOpeningAction = (method: RoseMethod) => roseOpeningActions[method]

export const roseConfigurationIssues = (input: NewLotInput) => {
  if (input.type !== 'rosado') return []
  const issues: string[] = []
  const redPercentage = input.redGrapePercentage ?? 0
  const colorIntensity = input.targetColorIntensity ?? 0
  const method = input.roseMethod ?? 'direct_press'
  const macerationHours = input.macerationHours ?? 0
  const estimatedYield = input.receivedKg > 0 ? input.volume / input.receivedKg * 100 : 0

  if (redPercentage <= 0 || redPercentage > 100) issues.push('red_percentage')
  if (redPercentage < 100 && !input.blendAfterWeighing) issues.push('blend_after_weighing')
  if (colorIntensity <= 0 || colorIntensity > 10) issues.push('color_intensity')
  if (estimatedYield > 100) issues.push('yield')
  if (input.roseStyle === 'clarete' && method !== 'cofermentation') issues.push('clarete_method')
  if (method !== 'direct_press' && (macerationHours <= 0 || macerationHours > 168)) issues.push('maceration_hours')
  return issues
}

export const validateRoseInput = (input: NewLotInput) => {
  const issues = roseConfigurationIssues(input)
  if (issues.length) throw new Error(`Rosado configuration checks failed: ${issues.join(', ')}`)
}

export const nextLotCode = (type: NewLotInput['type'], vintage: number, lots: WineLot[]) => {
  const prefix = type === 'tinto' ? 'T' : type === 'blanco' ? 'B' : 'R'
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
  const isRose = input.type === 'rosado'
  if (isRose) validateRoseInput(input)
  const process = initialProcess(isRed ? redProcess : isRose ? roseProcesses[input.roseMethod ?? 'direct_press'] : whiteProcess)
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
    nextAction: isRed ? 'Completar selección y encubado' : isRose ? roseOpeningAction(input.roseMethod ?? 'direct_press') : 'Registrar prensado y fracciones',
    nextTime: 'Hoy',
    image: isRed ? images.cellar : isRose ? images.vineyard : images.whiteGrapes,
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
      white: input.type === 'blanco' ? {
        pressFraction: input.pressFraction ?? 'Mosto yema',
        turbidityTarget: input.turbidityTarget ?? 100,
        protection: input.protection ?? 'Inertizado',
      } : undefined,
      rose: isRose ? {
        style: input.roseStyle ?? 'rosado',
        method: input.roseMethod ?? 'direct_press',
        redGrapePercentage: input.redGrapePercentage ?? 100,
        blendAfterWeighing: input.blendAfterWeighing ?? true,
        macerationHours: input.macerationHours ?? 0,
        pressFraction: input.pressFraction ?? 'Mosto yema',
        turbidityTarget: input.turbidityTarget ?? 100,
        protection: input.protection ?? 'Inertizado con CO₂',
        targetColorIntensity: input.targetColorIntensity ?? 0.8,
      } : undefined,
    },
  }
}

export const createOpeningTask = (lot: WineLot): CellarTask => ({
  id: nowId('task'),
  title: lot.type === 'tinto' ? 'Completar selección y encubado' : lot.type === 'rosado' ? roseOpeningAction(lot.productionDetails?.rose?.method ?? 'direct_press') : 'Registrar prensado y fracciones',
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

const bottlingGateKeys: BottlingGateKey[] = ['wine_release', 'pre_bottling_lab', 'stabilisation', 'filtration', 'artwork', 'line_sanitation']

export const bottlingMaterialRequirements = (order: Pick<BottlingOrder, 'targetBottles' | 'packaging'>) => {
  const lineUnits = Math.ceil(order.targetBottles * 1.02)
  return [
    { materialId: order.packaging.bottleId, quantity: lineUnits },
    { materialId: order.packaging.closureId, quantity: lineUnits },
    { materialId: order.packaging.capsuleId, quantity: lineUnits },
    { materialId: order.packaging.frontLabelId, quantity: lineUnits },
    { materialId: order.packaging.backLabelId, quantity: lineUnits },
    { materialId: order.packaging.cartonId, quantity: Math.ceil(order.targetBottles / order.packaging.unitsPerCase * 1.02) },
  ]
}

export const nextBottlingCode = (orders: BottlingOrder[]) => {
  const highest = orders.reduce((maximum, order) => {
    const match = order.code.match(/^EMB-\d{2}-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `EMB-${String(new Date().getFullYear()).slice(-2)}-${String(highest + 1).padStart(3, '0')}`
}

export const createBottlingOrder = (input: NewBottlingOrderInput, trials: BlendTrial[], orders: BottlingOrder[], materials: PackagingMaterial[]) => {
  const trial = trials.find((item) => item.id === input.sourceTrialId)
  if (!trial || trial.status !== 'approved') throw new Error('Bottling source must be an approved blend')
  if (!input.wineName.trim() || !input.scheduledAt || !input.line.trim() || input.targetVolume <= 0 || input.bottleSize <= 0 || input.unitsPerCase <= 0) throw new Error('Invalid bottling order')
  if (input.targetVolume > trial.targetVolume + 0.01) throw new Error('Target volume exceeds approved blend')
  const packaging = { ...input.packaging, bottleSize: input.bottleSize, unitsPerCase: input.unitsPerCase }
  const targetBottles = Math.floor(input.targetVolume / input.bottleSize)
  const draftOrder: BottlingOrder = {
    id: nowId('bottling-order'), code: nextBottlingCode(orders), sourceTrialId: trial.id, sourceCode: trial.code, wineName: input.wineName.trim(), type: trial.type,
    vintage: input.vintage, targetVolume: input.targetVolume, targetBottles, scheduledAt: input.scheduledAt,
    line: input.line.trim(), status: 'preparation', packaging, gates: bottlingGateKeys.map((key) => ({ key, complete: key === 'wine_release', ...(key === 'wine_release' ? { verifiedAt: new Date().toISOString(), verifiedBy: 'Elena Martín' } : {}) })),
    createdAt: new Date().toISOString(), createdBy: 'Elena Martín',
  }
  const requirements = bottlingMaterialRequirements(draftOrder)
  requirements.forEach(({ materialId, quantity }) => {
    const material = materials.find((item) => item.id === materialId)
    if (!material || material.onHand - material.reserved < quantity) throw new Error('Insufficient packaging material')
  })
  const nextMaterials = materials.map((material) => {
    const required = requirements.find((item) => item.materialId === material.id)?.quantity ?? 0
    return required ? { ...material, reserved: material.reserved + required } : material
  })
  return { order: draftOrder, orders: [draftOrder, ...orders], materials: nextMaterials }
}

export const setBottlingGate = (orders: BottlingOrder[], orderId: string, gateKey: BottlingGateKey, complete: boolean) => {
  const order = orders.find((item) => item.id === orderId)
  if (!order || ['completed', 'in_progress'].includes(order.status)) throw new Error('Bottling gates cannot be edited')
  const gates = order.gates.map((gate) => gate.key === gateKey ? { key: gate.key, complete, ...(complete ? { verifiedAt: new Date().toISOString(), verifiedBy: 'Elena Martín' } : {}) } : gate)
  const released = gates.every((gate) => gate.complete)
  const updated: BottlingOrder = { ...order, gates, status: released ? 'ready' : 'preparation', ...(released ? { releasedAt: new Date().toISOString(), releasedBy: 'Elena Martín' } : { releasedAt: undefined, releasedBy: undefined }) }
  return { order: updated, orders: orders.map((item) => item.id === updated.id ? updated : item) }
}

export const startBottlingOrder = (orders: BottlingOrder[], orderId: string) => {
  const order = orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'ready' || !order.gates.every((gate) => gate.complete)) throw new Error('Bottling order is not released')
  const updated: BottlingOrder = { ...order, status: 'in_progress' }
  return { order: updated, orders: orders.map((item) => item.id === updated.id ? updated : item) }
}

export const completeBottlingOrder = (orders: BottlingOrder[], materials: PackagingMaterial[], input: CompleteBottlingOrderInput) => {
  const order = orders.find((item) => item.id === input.orderId)
  if (!order || !['ready', 'in_progress'].includes(order.status)) throw new Error('Bottling order cannot be completed')
  if (!input.finishedProductLot.trim() || input.goodBottles <= 0 || input.rejectedBottles < 0 || input.actualVolume <= 0 || (input.labelSerialFrom !== undefined && input.labelSerialFrom <= 0)) throw new Error('Invalid bottling completion')
  const totalHandled = input.goodBottles + input.rejectedBottles
  if (totalHandled > Math.ceil(order.targetBottles * 1.02) || input.actualVolume > order.targetVolume * 1.01) throw new Error('Completion exceeds released order')
  const reservations = bottlingMaterialRequirements(order)
  const usedByMaterial = new Map<string, number>([
    [order.packaging.bottleId, totalHandled], [order.packaging.closureId, totalHandled], [order.packaging.capsuleId, totalHandled], [order.packaging.frontLabelId, totalHandled],
    [order.packaging.backLabelId, input.goodBottles], [order.packaging.cartonId, Math.ceil(input.goodBottles / order.packaging.unitsPerCase)],
  ])
  const nextMaterials = materials.map((material) => {
    const reserved = reservations.find((item) => item.materialId === material.id)?.quantity ?? 0
    const used = usedByMaterial.get(material.id) ?? 0
    return reserved || used ? { ...material, onHand: Math.max(0, material.onHand - used), reserved: Math.max(0, material.reserved - reserved) } : material
  })
  const updated: BottlingOrder = {
    ...order, status: 'completed', completion: {
      goodBottles: input.goodBottles, rejectedBottles: input.rejectedBottles, actualVolume: input.actualVolume, finishedProductLot: input.finishedProductLot.trim().toUpperCase(),
      ...(input.labelSerialFrom !== undefined ? { labelSerialFrom: input.labelSerialFrom, labelSerialTo: input.labelSerialFrom + input.goodBottles - 1 } : {}),
      completedAt: new Date().toISOString(), completedBy: 'Elena Martín', notes: input.notes.trim(),
    },
  }
  return { order: updated, orders: orders.map((item) => item.id === updated.id ? updated : item), materials: nextMaterials }
}

export const traceEntityScope = (entityId: string, entities: TraceabilityEntity[], links: TraceabilityLink[], direction: TraceabilityDirection = 'both') => {
  if (!entities.some((entity) => entity.id === entityId)) return []
  const visited = new Set([entityId])
  const queue = [entityId]
  while (queue.length) {
    const current = queue.shift()!
    links.forEach((link) => {
      const related: string[] = []
      if ((direction === 'forward' || direction === 'both') && link.sourceId === current) related.push(link.targetId)
      if ((direction === 'backward' || direction === 'both') && link.targetId === current) related.push(link.sourceId)
      related.forEach((id) => {
        if (!visited.has(id)) {
          visited.add(id)
          queue.push(id)
        }
      })
    })
  }
  return entities.filter((entity) => visited.has(entity.id))
}

export const nextRecallCode = (simulations: RecallSimulation[]) => {
  const highest = simulations.reduce((maximum, simulation) => {
    const match = simulation.code.match(/^SIM-\d{2}-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `SIM-${String(new Date().getFullYear()).slice(-2)}-${String(highest + 1).padStart(3, '0')}`
}

export const createRecallSimulation = (input: NewRecallSimulationInput, entities: TraceabilityEntity[], links: TraceabilityLink[], simulations: RecallSimulation[]) => {
  const target = entities.find((entity) => entity.id === input.targetEntityId)
  if (!target || !input.notes.trim()) throw new Error('Recall simulation requires a target and notes')
  const scope = traceEntityScope(target.id, entities, links, 'both')
  const simulation: RecallSimulation = {
    id: nowId('recall-sim'), code: nextRecallCode(simulations), targetEntityId: target.id, targetCode: target.code, reason: input.reason, notes: input.notes.trim(),
    affectedEntityIds: scope.map((entity) => entity.id),
    affectedFinishedLotIds: scope.filter((entity) => entity.type === 'finished_lot').map((entity) => entity.id),
    affectedBottlingOrderIds: scope.filter((entity) => entity.type === 'bottling_order').map((entity) => entity.id),
    sourceParcelIds: scope.filter((entity) => entity.type === 'parcel').map((entity) => entity.id),
    createdAt: new Date().toISOString(), createdBy: 'Elena Martín', status: 'completed',
  }
  return { simulation, simulations: [simulation, ...simulations] }
}

export const redOperationTypesByStage: Record<string, RedOperationType[]> = {
  reception: ['selection', 'temperature_check', 'sample'],
  destem: ['vatting', 'addition', 'temperature_check'],
  af: ['pump_over', 'punch_down', 'temperature_check', 'density_check', 'addition', 'sample'],
  devat: ['devatting_pressing', 'racking', 'sample'],
  malo: ['malolactic_check', 'racking', 'so2_adjustment', 'sample'],
  ageing: ['racking', 'so2_adjustment', 'sample'],
  bottle: [],
}

const redOperationTitles: Record<RedOperationType, string> = {
  selection: 'Selección de uva', vatting: 'Encubado', pump_over: 'Remontado', punch_down: 'Bazuqueo',
  temperature_check: 'Control de temperatura', density_check: 'Control de densidad', addition: 'Adición enológica', sample: 'Toma de muestra',
  devatting_pressing: 'Descube y prensado', racking: 'Trasiego', malolactic_check: 'Control de ácido málico', so2_adjustment: 'Ajuste de SO₂',
}

const redNextActions: Record<string, string> = {
  reception: 'Completar selección y control de recepción', destem: 'Registrar encubado', af: 'Registrar densidad', devat: 'Registrar descube y prensado',
  malo: 'Registrar control de ácido málico', ageing: 'Planificar operaciones de crianza', bottle: 'Preparar orden de embotellado',
}

const currentStage = (lot: WineLot) => lot.process.find((stage) => stage.status === 'current')

const latestMetric = (events: ProductionEvent[], lotId: string, metric: 'density' | 'malicAcid' | 'turbidity' | 'conductivityDrop' | 'colorIntensity' | 'skinContactHours') => events
  .find((event) => event.lotId === lotId && event.kind === 'operation' && event.metrics[metric] !== undefined)?.metrics[metric]

export const redStageGate = (lot: WineLot, events: ProductionEvent[]): RedStageGate => {
  if (lot.type !== 'tinto') throw new Error('Red process gates only apply to red lots')
  const stage = currentStage(lot)
  if (!stage) return { stageId: 'complete', eligible: false, reason: 'complete' }
  const stageIndex = lot.process.findIndex((item) => item.id === stage.id)
  const nextStageId = lot.process[stageIndex + 1]?.id
  if (!nextStageId) return { stageId: stage.id, eligible: false, reason: 'complete' }
  if (stage.id === 'ageing') return { stageId: stage.id, nextStageId, eligible: false, reason: 'managed_elsewhere' }

  const stageEvents = events.filter((event) => event.lotId === lot.id && event.stageId === stage.id && event.kind === 'operation')
  const hasOperation = (type: RedOperationType) => stageEvents.some((event) => event.operationType === type)
  if (stage.id === 'reception') return { stageId: stage.id, nextStageId, eligible: hasOperation('selection'), reason: hasOperation('selection') ? 'ready' : 'operation_required' }
  if (stage.id === 'destem') return { stageId: stage.id, nextStageId, eligible: hasOperation('vatting'), reason: hasOperation('vatting') ? 'ready' : 'operation_required' }
  if (stage.id === 'af') {
    const density = latestMetric(events, lot.id, 'density') ?? lot.density
    const eligible = density !== undefined && density <= 0.995
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'density_required', value: density }
  }
  if (stage.id === 'devat') return { stageId: stage.id, nextStageId, eligible: hasOperation('devatting_pressing'), reason: hasOperation('devatting_pressing') ? 'ready' : 'operation_required' }
  if (stage.id === 'malo') {
    const malicAcid = latestMetric(events, lot.id, 'malicAcid')
    const eligible = malicAcid !== undefined && malicAcid <= 0.3
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'malic_required', value: malicAcid }
  }
  return { stageId: stage.id, nextStageId, eligible: false, reason: 'operation_required' }
}

const requiredNumber = (value: number | undefined, message: string, minimum: number, maximum: number) => {
  if (value === undefined || !Number.isFinite(value) || value < minimum || value > maximum) throw new Error(message)
  return value
}

const operationDetail = (input: NewRedOperationInput, volumeAfter: number) => {
  const metrics = input.metrics
  if (input.type === 'pump_over' || input.type === 'punch_down') return `${metrics.durationMinutes} min${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
  if (input.type === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
  if (input.type === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
  if (input.type === 'addition') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}`
  if (input.type === 'devatting_pressing') return `${Math.round(metrics.freeRunVolume ?? 0).toLocaleString('es-ES')} L yema · ${Math.round(metrics.pressVolume ?? 0).toLocaleString('es-ES')} L prensa`
  if (input.type === 'malolactic_check') return `${metrics.malicAcid?.toFixed(2)} g/L ácido málico`
  if (input.type === 'so2_adjustment') return `${metrics.freeSo2?.toFixed(0)} mg/L SO₂ libre`
  if (input.type === 'racking') return `${Math.round(volumeAfter).toLocaleString('es-ES')} L reconciliados`
  return input.notes.trim() || 'Operación registrada'
}

export const recordRedOperation = (
  lots: WineLot[],
  tanks: Tank[],
  tasks: CellarTask[],
  events: ProductionEvent[],
  input: NewRedOperationInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'tinto') throw new Error('Red operation requires a red lot')
  const stage = currentStage(lot)
  if (!stage || !redOperationTypesByStage[stage.id]?.includes(input.type)) throw new Error('Operation is not allowed in the current stage')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Operation requires time and operator')

  const metrics = { ...input.metrics, volumeBefore: lot.volume }
  let volumeAfter = metrics.volumeAfter ?? lot.volume
  if (input.type === 'pump_over' || input.type === 'punch_down') requiredNumber(metrics.durationMinutes, 'Duration is required', 1, 180)
  if (input.type === 'temperature_check') requiredNumber(metrics.temperature, 'Temperature is required', 0, 40)
  if (input.type === 'density_check') requiredNumber(metrics.density, 'Density is required', 0.97, 1.2)
  if (input.type === 'addition') {
    if (!metrics.product?.trim() || !metrics.additionUnit) throw new Error('Addition product and unit are required')
    requiredNumber(metrics.additionAmount, 'Addition amount is required', 0.001, 10000)
  }
  if (input.type === 'devatting_pressing') {
    const freeRun = requiredNumber(metrics.freeRunVolume, 'Free-run volume is required', 0, lot.volume)
    const press = requiredNumber(metrics.pressVolume, 'Press volume is required', 0, lot.volume)
    volumeAfter = freeRun + press
    if (volumeAfter <= 0 || volumeAfter > lot.volume + 0.01) throw new Error('Devatting output exceeds available lot volume')
  }
  if (input.type === 'racking') volumeAfter = requiredNumber(metrics.volumeAfter, 'Reconciled volume is required', 0.01, lot.volume)
  if (input.type === 'malolactic_check') requiredNumber(metrics.malicAcid, 'Malic acid result is required', 0, 10)
  if (input.type === 'so2_adjustment') requiredNumber(metrics.freeSo2, 'Free SO2 result is required', 0, 200)
  if (metrics.temperature !== undefined) requiredNumber(metrics.temperature, 'Temperature is outside the accepted entry range', 0, 40)
  metrics.volumeAfter = volumeAfter

  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-event'), lotId: lot.id, wineType: lot.type, kind: 'operation', stageId: stage.id, operationType: input.type,
    performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(), metrics, storageMode: 'browser-local',
  }
  const nextEvents = [event, ...events]
  const gate = redStageGate(lot, nextEvents)
  const title = redOperationTitles[input.type]
  const detail = operationDetail(input, volumeAfter)
  const temperature = metrics.temperature ?? lot.temperature
  const density = metrics.density ?? lot.density
  const nextAttention = temperature !== undefined && temperature > 30 ? 'critical' as const : temperature !== undefined && temperature > 27 ? 'warning' as const : lot.attention
  const readingChanged = metrics.temperature !== undefined || metrics.density !== undefined || volumeAfter !== lot.volume
  const updatedLot: WineLot = {
    ...lot, volume: volumeAfter, temperature, density, attention: nextAttention,
    nextAction: gate.eligible ? 'Revisar cierre de etapa' : redNextActions[stage.id] ?? lot.nextAction,
    readings: readingChanged ? [...lot.readings, { time: 'Ahora', temperature: temperature ?? 0, density: density ?? 0, volume: volumeAfter, note: input.notes.trim(), recordedAt }] : lot.readings,
    activities: [{ id: event.id, title, person: event.operator, time: 'Ahora', detail, recordedAt }, ...(lot.activities ?? [])],
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, volume: volumeAfter, temperature, stage: stage.shortLabel, attention: nextAttention } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks, events: nextEvents, gate }
}

export const advanceRedStage = (
  lots: WineLot[],
  tanks: Tank[],
  tasks: CellarTask[],
  events: ProductionEvent[],
  input: AdvanceRedStageInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'tinto') throw new Error('Red stage transition requires a red lot')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Transition requires time and operator')
  const stage = currentStage(lot)
  if (!stage) throw new Error('Lot has no active stage')
  const gate = redStageGate(lot, events)
  if (!gate.eligible || !gate.nextStageId) throw new Error(`Stage gate is not ready: ${gate.reason}`)
  const nextIndex = lot.process.findIndex((item) => item.id === gate.nextStageId)
  const nextStage = lot.process[nextIndex]
  if (!nextStage) throw new Error('Next stage not found')

  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-transition'), lotId: lot.id, wineType: lot.type, kind: 'transition', stageId: stage.id,
    fromStageId: stage.id, toStageId: nextStage.id, performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(),
    metrics: { volumeBefore: lot.volume, volumeAfter: lot.volume }, storageMode: 'browser-local',
  }
  const process = lot.process.map((item, index) => ({ ...item, status: index < nextIndex ? 'complete' as const : index === nextIndex ? 'current' as const : item.status === 'optional' ? 'optional' as const : 'upcoming' as const }))
  const updatedLot: WineLot = {
    ...lot, process, stage: nextStage.label, day: 1, progress: Math.round(nextIndex / Math.max(1, lot.process.length - 1) * 100),
    attention: 'normal', attentionText: undefined, nextAction: redNextActions[nextStage.id] ?? lot.nextAction, nextTime: 'Hoy',
    activities: [{ id: event.id, title: 'Cambio de etapa', person: event.operator, time: 'Ahora', detail: `${stage.shortLabel} → ${nextStage.shortLabel}`, recordedAt }, ...(lot.activities ?? [])],
  }
  const openingTask: CellarTask = {
    id: nowId('task'), title: updatedLot.nextAction, lot: lot.id, time: 'Hoy', assignee: input.operator.split(' ')[0], priority: 'media', complete: false,
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, stage: nextStage.shortLabel, volume: lot.volume, attention: 'normal' as const } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks: [openingTask, ...tasks], events: [event, ...events] }
}

export const whiteOperationTypesByStage: Record<string, WhiteOperationType[]> = {
  reception: ['reception_check', 'must_protection', 'sample'],
  press: ['pressing', 'sample'],
  settling: ['turbidity_check', 'clean_must_racking', 'sample'],
  af: ['inoculation', 'temperature_check', 'density_check', 'sample'],
  lees: ['batonnage', 'lees_tasting', 'lees_decision', 'sample'],
  stability: ['cold_stability_check', 'sample'],
  bottle: [],
}

const whiteOperationTitles: Record<WhiteOperationType, string> = {
  reception_check: 'Control de recepción', must_protection: 'Protección del mosto', pressing: 'Prensado y fracciones',
  turbidity_check: 'Control de turbidez', clean_must_racking: 'Trasiego de mosto limpio', inoculation: 'Inoculación',
  temperature_check: 'Control de temperatura', density_check: 'Control de densidad', sample: 'Toma de muestra',
  batonnage: 'Bâtonnage', lees_tasting: 'Cata de lías', lees_decision: 'Decisión sobre lías', cold_stability_check: 'Control de estabilidad tartárica',
}

const whiteNextActions: Record<string, string> = {
  reception: 'Registrar protección del mosto', press: 'Registrar prensado y fracciones', settling: 'Comprobar turbidez y trasegar mosto limpio',
  af: 'Registrar densidad y temperatura', lees: 'Evaluar trabajo sobre lías', stability: 'Comprobar estabilidad tartárica', bottle: 'Preparar filtración y embotellado',
}

export const whiteStageGate = (lot: WineLot, events: ProductionEvent[]): WhiteStageGate => {
  if (lot.type !== 'blanco') throw new Error('White process gates only apply to white lots')
  const stage = currentStage(lot)
  if (!stage) return { stageId: 'complete', eligible: false, reason: 'complete' }
  const stageIndex = lot.process.findIndex((item) => item.id === stage.id)
  const nextStageId = lot.process[stageIndex + 1]?.id
  if (!nextStageId) return { stageId: stage.id, eligible: false, reason: 'complete' }

  const stageEvents = events.filter((event) => event.lotId === lot.id && event.stageId === stage.id && event.kind === 'operation')
  const hasOperation = (type: WhiteOperationType) => stageEvents.some((event) => event.operationType === type)
  if (stage.id === 'reception') return { stageId: stage.id, nextStageId, eligible: hasOperation('must_protection'), reason: hasOperation('must_protection') ? 'ready' : 'protection_required' }
  if (stage.id === 'press') return { stageId: stage.id, nextStageId, eligible: hasOperation('pressing'), reason: hasOperation('pressing') ? 'ready' : 'pressing_required' }
  if (stage.id === 'settling') {
    const turbidity = latestMetric(events, lot.id, 'turbidity')
    const target = lot.productionDetails?.white?.turbidityTarget ?? 100
    if (turbidity === undefined || turbidity > target) return { stageId: stage.id, nextStageId, eligible: false, reason: 'turbidity_required', value: turbidity }
    const racked = hasOperation('clean_must_racking')
    return { stageId: stage.id, nextStageId, eligible: racked, reason: racked ? 'ready' : 'racking_required', value: turbidity }
  }
  if (stage.id === 'af') {
    const density = latestMetric(events, lot.id, 'density') ?? lot.density
    const eligible = density !== undefined && density <= 0.995
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'density_required', value: density }
  }
  if (stage.id === 'lees') {
    const decision = stageEvents.find((event) => event.operationType === 'lees_decision')?.metrics.leesDecision
    const eligible = decision === 'complete' || decision === 'skip'
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'lees_decision_required' }
  }
  if (stage.id === 'stability') {
    const conductivityDrop = latestMetric(events, lot.id, 'conductivityDrop')
    const eligible = conductivityDrop !== undefined && conductivityDrop <= 30
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'stability_required', value: conductivityDrop }
  }
  return { stageId: stage.id, nextStageId, eligible: false, reason: 'complete' }
}

const whiteOperationDetail = (input: NewWhiteOperationInput, volumeAfter: number) => {
  const metrics = input.metrics
  if (input.type === 'reception_check') return `${metrics.potentialAlcohol?.toFixed(1)} % vol. potencial · ${metrics.temperature?.toFixed(1)} °C`
  if (input.type === 'must_protection') return metrics.protection ?? input.notes.trim()
  if (input.type === 'pressing') return `${Math.round(metrics.freeRunVolume ?? 0).toLocaleString('es-ES')} L yema · ${Math.round(metrics.pressVolume ?? 0).toLocaleString('es-ES')} L prensa`
  if (input.type === 'turbidity_check') return `${metrics.turbidity?.toFixed(0)} NTU`
  if (input.type === 'clean_must_racking') return `${Math.round(volumeAfter).toLocaleString('es-ES')} L reconciliados`
  if (input.type === 'inoculation') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}`
  if (input.type === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
  if (input.type === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
  if (input.type === 'batonnage') return `${metrics.durationMinutes} min`
  if (input.type === 'lees_decision') return metrics.leesDecision ?? ''
  if (input.type === 'cold_stability_check') return `Δ ${metrics.conductivityDrop?.toFixed(0)} µS/cm`
  return input.notes.trim() || 'Operación registrada'
}

const whiteAttention = (stageId: string, temperature: number | undefined, fallback: WineLot['attention']) => {
  if (stageId !== 'af' || temperature === undefined) return fallback
  if (temperature > 22) return 'critical' as const
  if (temperature > 18 || temperature < 10) return 'warning' as const
  return 'normal' as const
}

export const recordWhiteOperation = (
  lots: WineLot[],
  tanks: Tank[],
  tasks: CellarTask[],
  events: ProductionEvent[],
  input: NewWhiteOperationInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'blanco') throw new Error('White operation requires a white lot')
  const stage = currentStage(lot)
  if (!stage || !whiteOperationTypesByStage[stage.id]?.includes(input.type)) throw new Error('Operation is not allowed in the current stage')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Operation requires time and operator')

  const metrics = { ...input.metrics, volumeBefore: lot.volume }
  let volumeAfter = metrics.volumeAfter ?? lot.volume
  if (input.type === 'reception_check') {
    requiredNumber(metrics.potentialAlcohol, 'Potential alcohol is required', 5, 20)
    requiredNumber(metrics.temperature, 'Temperature is required', 0, 35)
  }
  if (input.type === 'must_protection' && !metrics.protection?.trim()) throw new Error('Must protection is required')
  if (input.type === 'pressing') {
    const freeRun = requiredNumber(metrics.freeRunVolume, 'Free-run volume is required', 0, 1000000)
    const press = requiredNumber(metrics.pressVolume, 'Press volume is required', 0, 1000000)
    volumeAfter = freeRun + press
    const physicalMaximum = lot.productionDetails?.receivedKg !== undefined ? lot.productionDetails.receivedKg : lot.volume
    const maximumOutput = Math.min(lot.volume, physicalMaximum)
    if (volumeAfter <= 0 || volumeAfter > maximumOutput + 0.01) throw new Error('Press output exceeds the available lot volume')
  }
  if (input.type === 'turbidity_check') requiredNumber(metrics.turbidity, 'Turbidity is required', 0, 5000)
  if (input.type === 'clean_must_racking') {
    volumeAfter = requiredNumber(metrics.volumeAfter, 'Reconciled volume is required', 0.01, lot.volume)
    if (metrics.settlingHours !== undefined) requiredNumber(metrics.settlingHours, 'Settling time is outside the accepted range', 0, 168)
  }
  if (input.type === 'inoculation') {
    if (!metrics.product?.trim() || !metrics.additionUnit) throw new Error('Inoculation product and unit are required')
    requiredNumber(metrics.additionAmount, 'Inoculation amount is required', 0.001, 10000)
  }
  if (input.type === 'temperature_check') requiredNumber(metrics.temperature, 'Temperature is required', 0, 35)
  if (input.type === 'density_check') requiredNumber(metrics.density, 'Density is required', 0.97, 1.2)
  if (input.type === 'batonnage') requiredNumber(metrics.durationMinutes, 'Duration is required', 1, 180)
  if (input.type === 'lees_tasting' && !input.notes.trim()) throw new Error('Lees tasting notes are required')
  if (input.type === 'lees_decision' && !metrics.leesDecision) throw new Error('Lees decision is required')
  if (input.type === 'cold_stability_check') requiredNumber(metrics.conductivityDrop, 'Conductivity drop is required', 0, 1000)
  if (metrics.temperature !== undefined) requiredNumber(metrics.temperature, 'Temperature is outside the accepted entry range', 0, 35)
  metrics.volumeAfter = volumeAfter

  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-event'), lotId: lot.id, wineType: lot.type, kind: 'operation', stageId: stage.id, operationType: input.type,
    performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(), metrics, storageMode: 'browser-local',
  }
  const nextEvents = [event, ...events]
  const gate = whiteStageGate(lot, nextEvents)
  const temperature = metrics.temperature ?? lot.temperature
  const density = metrics.density ?? lot.density
  const nextAttention = whiteAttention(stage.id, temperature, lot.attention)
  const readingChanged = metrics.temperature !== undefined || metrics.density !== undefined || volumeAfter !== lot.volume
  const updatedLot: WineLot = {
    ...lot, volume: volumeAfter, temperature, density, attention: nextAttention,
    nextAction: gate.eligible ? 'Revisar cierre de etapa' : whiteNextActions[stage.id] ?? lot.nextAction,
    readings: readingChanged ? [...lot.readings, { time: 'Ahora', temperature: temperature ?? 0, density: density ?? 0, volume: volumeAfter, note: input.notes.trim(), recordedAt }] : lot.readings,
    activities: [{ id: event.id, title: whiteOperationTitles[input.type], person: event.operator, time: 'Ahora', detail: whiteOperationDetail(input, volumeAfter), recordedAt }, ...(lot.activities ?? [])],
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, volume: volumeAfter, temperature, stage: stage.shortLabel, attention: nextAttention } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks, events: nextEvents, gate }
}

export const advanceWhiteStage = (
  lots: WineLot[],
  tanks: Tank[],
  tasks: CellarTask[],
  events: ProductionEvent[],
  input: AdvanceWhiteStageInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'blanco') throw new Error('White stage transition requires a white lot')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Transition requires time and operator')
  const stage = currentStage(lot)
  if (!stage) throw new Error('Lot has no active stage')
  const gate = whiteStageGate(lot, events)
  if (!gate.eligible || !gate.nextStageId) throw new Error(`Stage gate is not ready: ${gate.reason}`)
  const nextIndex = lot.process.findIndex((item) => item.id === gate.nextStageId)
  const nextStage = lot.process[nextIndex]
  if (!nextStage) throw new Error('Next stage not found')

  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-transition'), lotId: lot.id, wineType: lot.type, kind: 'transition', stageId: stage.id,
    fromStageId: stage.id, toStageId: nextStage.id, performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(),
    metrics: { volumeBefore: lot.volume, volumeAfter: lot.volume }, storageMode: 'browser-local',
  }
  const process = lot.process.map((item, index) => ({ ...item, status: index < nextIndex ? 'complete' as const : index === nextIndex ? 'current' as const : item.status === 'optional' ? 'optional' as const : 'upcoming' as const }))
  const updatedLot: WineLot = {
    ...lot, process, stage: nextStage.label, day: 1, progress: Math.round(nextIndex / Math.max(1, lot.process.length - 1) * 100),
    attention: 'normal', attentionText: undefined, nextAction: whiteNextActions[nextStage.id] ?? lot.nextAction, nextTime: 'Hoy',
    activities: [{ id: event.id, title: 'Cambio de etapa', person: event.operator, time: 'Ahora', detail: `${stage.shortLabel} → ${nextStage.shortLabel}`, recordedAt }, ...(lot.activities ?? [])],
  }
  const openingTask: CellarTask = {
    id: nowId('task'), title: updatedLot.nextAction, lot: lot.id, time: 'Hoy', assignee: input.operator.split(' ')[0], priority: 'media', complete: false,
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, stage: nextStage.shortLabel, volume: lot.volume, attention: 'normal' as const } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks: [openingTask, ...tasks], events: [event, ...events] }
}

export const roseOperationTypesByMethod: Record<RoseMethod, Record<string, RoseOperationType[]>> = {
  direct_press: {
    reception: ['composition_check', 'must_protection', 'temperature_check', 'sample'],
    press: ['direct_pressing', 'color_check', 'sample'],
    settling: ['turbidity_check', 'clean_must_racking', 'must_protection', 'sample'],
    af: ['inoculation', 'temperature_check', 'density_check', 'color_check', 'sample'],
    lees: ['lees_decision', 'sample'], stability: ['stability_check', 'color_check', 'sample'], bottle: [],
  },
  short_maceration: {
    reception: ['composition_check', 'must_protection', 'temperature_check', 'sample'],
    maceration: ['skin_contact_check', 'color_check', 'temperature_check', 'sample'],
    press: ['fraction_separation', 'color_check', 'sample'],
    settling: ['turbidity_check', 'clean_must_racking', 'must_protection', 'sample'],
    af: ['inoculation', 'temperature_check', 'density_check', 'color_check', 'sample'],
    lees: ['lees_decision', 'sample'], bottle: [],
  },
  saignee: {
    reception: ['composition_check', 'must_protection', 'temperature_check', 'sample'],
    maceration: ['skin_contact_check', 'color_check', 'temperature_check', 'sample'],
    saignee: ['saignee_separation', 'color_check', 'sample'],
    settling: ['turbidity_check', 'clean_must_racking', 'must_protection', 'sample'],
    af: ['inoculation', 'temperature_check', 'density_check', 'color_check', 'sample'],
    lees: ['lees_decision', 'sample'], bottle: [],
  },
  cofermentation: {
    reception: ['composition_check', 'separate_weighing', 'temperature_check', 'sample'],
    vatting: ['joint_vatting', 'temperature_check', 'sample'],
    cofermentation: ['gentle_cap_management', 'skin_contact_check', 'color_check', 'temperature_check', 'density_check', 'sample'],
    press: ['fraction_separation', 'color_check', 'sample'],
    af: ['inoculation', 'temperature_check', 'density_check', 'sample'],
    lees: ['lees_decision', 'sample'], bottle: [],
  },
}

export const roseOperationsForLot = (lot: WineLot) => {
  const method = lot.productionDetails?.rose?.method ?? 'direct_press'
  const stage = currentStage(lot)
  return stage ? roseOperationTypesByMethod[method][stage.id] ?? [] : []
}

const roseOperationTitles: Record<RoseOperationType, string> = {
  composition_check: 'Control de composición', separate_weighing: 'Pesajes separados', must_protection: 'Protección del mosto', direct_pressing: 'Prensado directo',
  skin_contact_check: 'Control de contacto pelicular', color_check: 'Control de color', saignee_separation: 'Sangrado y separación', joint_vatting: 'Encubado conjunto',
  gentle_cap_management: 'Gestión suave de hollejos', fraction_separation: 'Separación de fracciones', turbidity_check: 'Control de turbidez', clean_must_racking: 'Trasiego de mosto limpio',
  inoculation: 'Inoculación', temperature_check: 'Control de temperatura', density_check: 'Control de densidad', sample: 'Toma de muestra',
  lees_decision: 'Decisión de afinado', stability_check: 'Control de estabilidad',
}

const roseNextActions: Record<string, string> = {
  reception: 'Confirmar composición y recepción', vatting: 'Registrar encubado conjunto', maceration: 'Controlar contacto pelicular y color',
  cofermentation: 'Comprobar color y decidir separación', press: 'Registrar separación y fracciones', saignee: 'Registrar sangrado y fracciones',
  settling: 'Comprobar turbidez y trasegar mosto limpio', af: 'Registrar densidad y temperatura', lees: 'Decidir el afinado sobre lías',
  stability: 'Comprobar estabilidad y color', bottle: 'Preparar filtración y embotellado',
}

const roseColorReady = (lot: WineLot, value: number | undefined) => {
  if (value === undefined) return false
  const target = lot.productionDetails?.rose?.targetColorIntensity ?? 0.8
  return value >= Math.max(0.01, target - 0.15) && value <= Math.min(10, target + 0.15)
}

export const roseStageGate = (lot: WineLot, events: ProductionEvent[]): RoseStageGate => {
  if (lot.type !== 'rosado') throw new Error('Rosado process gates only apply to rosado or clarete lots')
  const stage = currentStage(lot)
  if (!stage) return { stageId: 'complete', eligible: false, reason: 'complete' }
  const stageIndex = lot.process.findIndex((item) => item.id === stage.id)
  const nextStageId = lot.process[stageIndex + 1]?.id
  if (!nextStageId) return { stageId: stage.id, eligible: false, reason: 'complete' }
  const method = lot.productionDetails?.rose?.method ?? 'direct_press'
  const stageEvents = events.filter((event) => event.lotId === lot.id && event.stageId === stage.id && event.kind === 'operation')
  const hasOperation = (type: RoseOperationType) => stageEvents.some((event) => event.operationType === type)
  const stageMetric = (metric: 'density' | 'turbidity' | 'conductivityDrop' | 'colorIntensity' | 'skinContactHours') => stageEvents.find((event) => event.metrics[metric] !== undefined)?.metrics[metric]

  if (stage.id === 'reception') {
    if (!hasOperation('composition_check')) return { stageId: stage.id, nextStageId, eligible: false, reason: 'composition_required' }
    if (method === 'cofermentation') return { stageId: stage.id, nextStageId, eligible: hasOperation('separate_weighing'), reason: hasOperation('separate_weighing') ? 'ready' : 'weighing_required' }
    return { stageId: stage.id, nextStageId, eligible: hasOperation('must_protection'), reason: hasOperation('must_protection') ? 'ready' : 'protection_required' }
  }
  if (stage.id === 'vatting') return { stageId: stage.id, nextStageId, eligible: hasOperation('joint_vatting'), reason: hasOperation('joint_vatting') ? 'ready' : 'vatting_required' }
  if (stage.id === 'maceration' || stage.id === 'cofermentation') {
    const contact = stageMetric('skinContactHours')
    const planned = lot.productionDetails?.rose?.macerationHours ?? 0
    if (contact === undefined || contact < planned) return { stageId: stage.id, nextStageId, eligible: false, reason: 'contact_required', value: contact }
    const color = stageMetric('colorIntensity')
    return { stageId: stage.id, nextStageId, eligible: roseColorReady(lot, color), reason: roseColorReady(lot, color) ? 'ready' : 'color_required', value: color }
  }
  if (stage.id === 'press') {
    const required = method === 'direct_press' ? 'direct_pressing' : 'fraction_separation'
    return { stageId: stage.id, nextStageId, eligible: hasOperation(required), reason: hasOperation(required) ? 'ready' : 'pressing_required' }
  }
  if (stage.id === 'saignee') return { stageId: stage.id, nextStageId, eligible: hasOperation('saignee_separation'), reason: hasOperation('saignee_separation') ? 'ready' : 'separation_required' }
  if (stage.id === 'settling') {
    const turbidity = stageMetric('turbidity')
    const target = lot.productionDetails?.rose?.turbidityTarget ?? 110
    if (turbidity === undefined || turbidity > target) return { stageId: stage.id, nextStageId, eligible: false, reason: 'turbidity_required', value: turbidity }
    return { stageId: stage.id, nextStageId, eligible: hasOperation('clean_must_racking'), reason: hasOperation('clean_must_racking') ? 'ready' : 'racking_required', value: turbidity }
  }
  if (stage.id === 'af') {
    const density = stageMetric('density') ?? lot.density
    const eligible = density !== undefined && density <= 0.995
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'density_required', value: density }
  }
  if (stage.id === 'lees') {
    const decision = stageEvents.find((event) => event.operationType === 'lees_decision')?.metrics.leesDecision
    const eligible = decision === 'complete' || decision === 'skip'
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'lees_decision_required' }
  }
  if (stage.id === 'stability') {
    const conductivityDrop = stageMetric('conductivityDrop')
    const eligible = conductivityDrop !== undefined && conductivityDrop <= 30
    return { stageId: stage.id, nextStageId, eligible, reason: eligible ? 'ready' : 'stability_required', value: conductivityDrop }
  }
  return { stageId: stage.id, nextStageId, eligible: false, reason: 'complete' }
}

const roseOperationDetail = (input: NewRoseOperationInput, volumeAfter: number) => {
  const metrics = input.metrics
  if (input.type === 'composition_check') return `${metrics.redGrapePercentage?.toFixed(0)}% uva tinta · objetivo ${metrics.colorIntensity?.toFixed(2)} UA/cm`
  if (input.type === 'separate_weighing' || input.type === 'joint_vatting') return metrics.mixingAfterWeighing ? 'Pesajes por origen conservados · mezcla posterior' : input.notes
  if (input.type === 'must_protection') return metrics.protection ?? input.notes
  if (input.type === 'direct_pressing' || input.type === 'fraction_separation' || input.type === 'saignee_separation') return `${Math.round(metrics.freeRunVolume ?? 0).toLocaleString('es-ES')} L yema · ${Math.round(metrics.pressVolume ?? 0).toLocaleString('es-ES')} L prensa`
  if (input.type === 'skin_contact_check') return `${metrics.skinContactHours?.toFixed(1)} h · ${metrics.colorIntensity?.toFixed(2)} UA/cm`
  if (input.type === 'color_check') return `${metrics.colorIntensity?.toFixed(2)} UA/cm${metrics.skinContactHours !== undefined ? ` · ${metrics.skinContactHours.toFixed(1)} h` : ''}`
  if (input.type === 'gentle_cap_management') return `${metrics.durationMinutes} min${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
  if (input.type === 'turbidity_check') return `${metrics.turbidity?.toFixed(0)} NTU`
  if (input.type === 'clean_must_racking') return `${Math.round(volumeAfter).toLocaleString('es-ES')} L reconciliados`
  if (input.type === 'inoculation') return `${metrics.additionAmount} ${metrics.additionUnit} · ${metrics.product}`
  if (input.type === 'temperature_check') return `${metrics.temperature?.toFixed(1)} °C`
  if (input.type === 'density_check') return `${metrics.density?.toFixed(3)}${metrics.temperature !== undefined ? ` · ${metrics.temperature.toFixed(1)} °C` : ''}`
  if (input.type === 'lees_decision') return metrics.leesDecision ?? ''
  if (input.type === 'stability_check') return `Δ ${metrics.conductivityDrop?.toFixed(0)} µS/cm`
  return input.notes.trim() || 'Operación registrada'
}

const roseAttention = (stageId: string, temperature: number | undefined, fallback: WineLot['attention']) => {
  if (!['maceration', 'cofermentation', 'af'].includes(stageId) || temperature === undefined) return fallback
  if (temperature > 24) return 'critical' as const
  if (temperature > 20 || temperature < 10) return 'warning' as const
  return 'normal' as const
}

export const recordRoseOperation = (
  lots: WineLot[], tanks: Tank[], tasks: CellarTask[], events: ProductionEvent[], input: NewRoseOperationInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'rosado') throw new Error('Rosado operation requires a rosado or clarete lot')
  const stage = currentStage(lot)
  const method = lot.productionDetails?.rose?.method ?? 'direct_press'
  if (!stage || !roseOperationTypesByMethod[method][stage.id]?.includes(input.type)) throw new Error('Operation is not allowed for this rosado route and stage')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Operation requires time and operator')

  const metrics = { ...input.metrics, volumeBefore: lot.volume }
  let volumeAfter = metrics.volumeAfter ?? lot.volume
  if (input.type === 'composition_check') {
    const redPercentage = requiredNumber(metrics.redGrapePercentage, 'Red-grape percentage is required', 0.01, 100)
    if (redPercentage < 100 && !metrics.mixingAfterWeighing) throw new Error('Mixed grapes must be combined after weighing')
    requiredNumber(metrics.colorIntensity, 'Target colour intensity is required', 0.01, 10)
  }
  if (input.type === 'separate_weighing' && (!metrics.separateWeightsConfirmed || !metrics.mixingAfterWeighing)) throw new Error('Separate weighbridge records and later mixing are required')
  if (input.type === 'must_protection' && !metrics.protection?.trim()) throw new Error('Must protection is required')
  if (input.type === 'joint_vatting' && (!metrics.separateWeightsConfirmed || !metrics.mixingAfterWeighing)) throw new Error('Joint vatting requires preserved separate weights')
  if (input.type === 'direct_pressing' || input.type === 'fraction_separation' || input.type === 'saignee_separation') {
    const freeRun = requiredNumber(metrics.freeRunVolume, 'Free-run volume is required', 0, 1000000)
    const press = requiredNumber(metrics.pressVolume, 'Press volume is required', 0, 1000000)
    volumeAfter = freeRun + press
    const physicalMaximum = lot.productionDetails?.receivedKg !== undefined ? lot.productionDetails.receivedKg : lot.volume
    const maximumOutput = Math.min(lot.volume, physicalMaximum)
    if (volumeAfter <= 0 || volumeAfter > maximumOutput + 0.01) throw new Error('Separated output exceeds available lot volume')
  }
  if (input.type === 'skin_contact_check') {
    requiredNumber(metrics.skinContactHours, 'Skin-contact time is required', 0, 168)
    requiredNumber(metrics.colorIntensity, 'Colour intensity is required', 0.01, 10)
  }
  if (input.type === 'color_check') {
    requiredNumber(metrics.colorIntensity, 'Colour intensity is required', 0.01, 10)
    if (metrics.skinContactHours !== undefined) requiredNumber(metrics.skinContactHours, 'Skin-contact time is outside the accepted range', 0, 168)
  }
  if (input.type === 'gentle_cap_management') requiredNumber(metrics.durationMinutes, 'Duration is required', 1, 60)
  if (input.type === 'turbidity_check') requiredNumber(metrics.turbidity, 'Turbidity is required', 0, 5000)
  if (input.type === 'clean_must_racking') {
    volumeAfter = requiredNumber(metrics.volumeAfter, 'Reconciled volume is required', 0.01, lot.volume)
    if (metrics.settlingHours !== undefined) requiredNumber(metrics.settlingHours, 'Settling time is outside the accepted range', 0, 168)
  }
  if (input.type === 'inoculation') {
    if (!metrics.product?.trim() || !metrics.additionUnit) throw new Error('Inoculation product and unit are required')
    requiredNumber(metrics.additionAmount, 'Inoculation amount is required', 0.001, 10000)
  }
  if (input.type === 'temperature_check') requiredNumber(metrics.temperature, 'Temperature is required', 0, 35)
  if (input.type === 'density_check') requiredNumber(metrics.density, 'Density is required', 0.97, 1.2)
  if (input.type === 'lees_decision' && !metrics.leesDecision) throw new Error('Lees decision is required')
  if (input.type === 'stability_check') requiredNumber(metrics.conductivityDrop, 'Conductivity drop is required', 0, 1000)
  if (metrics.temperature !== undefined) requiredNumber(metrics.temperature, 'Temperature is outside the accepted entry range', 0, 35)
  if (metrics.colorIntensity !== undefined) requiredNumber(metrics.colorIntensity, 'Colour intensity is outside the accepted entry range', 0.01, 10)
  metrics.volumeAfter = volumeAfter

  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-event'), lotId: lot.id, wineType: lot.type, kind: 'operation', stageId: stage.id, operationType: input.type,
    performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(), metrics, storageMode: 'browser-local',
  }
  const nextEvents = [event, ...events]
  const gate = roseStageGate(lot, nextEvents)
  const temperature = metrics.temperature ?? lot.temperature
  const density = metrics.density ?? lot.density
  const nextAttention = roseAttention(stage.id, temperature, lot.attention)
  const readingChanged = metrics.temperature !== undefined || metrics.density !== undefined || volumeAfter !== lot.volume
  const updatedLot: WineLot = {
    ...lot, volume: volumeAfter, temperature, density, attention: nextAttention,
    nextAction: gate.eligible ? 'Revisar cierre de etapa' : roseNextActions[stage.id] ?? lot.nextAction,
    readings: readingChanged ? [...lot.readings, { time: 'Ahora', temperature: temperature ?? 0, density: density ?? 0, volume: volumeAfter, note: input.notes.trim(), recordedAt }] : lot.readings,
    activities: [{ id: event.id, title: roseOperationTitles[input.type], person: event.operator, time: 'Ahora', detail: roseOperationDetail(input, volumeAfter), recordedAt }, ...(lot.activities ?? [])],
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, volume: volumeAfter, temperature, stage: stage.shortLabel, attention: nextAttention } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks, events: nextEvents, gate }
}

export const advanceRoseStage = (
  lots: WineLot[], tanks: Tank[], tasks: CellarTask[], events: ProductionEvent[], input: AdvanceRoseStageInput,
) => {
  const lot = lots.find((item) => item.id === input.lotId)
  if (!lot || lot.type !== 'rosado') throw new Error('Rosado stage transition requires a rosado or clarete lot')
  if (!input.performedAt || !input.operator.trim()) throw new Error('Transition requires time and operator')
  const stage = currentStage(lot)
  if (!stage) throw new Error('Lot has no active stage')
  const gate = roseStageGate(lot, events)
  if (!gate.eligible || !gate.nextStageId) throw new Error(`Stage gate is not ready: ${gate.reason}`)
  const nextIndex = lot.process.findIndex((item) => item.id === gate.nextStageId)
  const nextStage = lot.process[nextIndex]
  if (!nextStage) throw new Error('Next stage not found')
  const recordedAt = new Date().toISOString()
  const event: ProductionEvent = {
    id: nowId('production-transition'), lotId: lot.id, wineType: lot.type, kind: 'transition', stageId: stage.id,
    fromStageId: stage.id, toStageId: nextStage.id, performedAt: input.performedAt, recordedAt, operator: input.operator.trim(), notes: input.notes.trim(),
    metrics: { volumeBefore: lot.volume, volumeAfter: lot.volume }, storageMode: 'browser-local',
  }
  const process = lot.process.map((item, index) => ({ ...item, status: index < nextIndex ? 'complete' as const : index === nextIndex ? 'current' as const : item.status === 'optional' ? 'optional' as const : 'upcoming' as const }))
  const updatedLot: WineLot = {
    ...lot, process, stage: nextStage.label, day: 1, progress: Math.round(nextIndex / Math.max(1, lot.process.length - 1) * 100),
    attention: 'normal', attentionText: undefined, nextAction: roseNextActions[nextStage.id] ?? lot.nextAction, nextTime: 'Hoy',
    activities: [{ id: event.id, title: 'Cambio de etapa', person: event.operator, time: 'Ahora', detail: `${stage.shortLabel} → ${nextStage.shortLabel}`, recordedAt }, ...(lot.activities ?? [])],
  }
  const openingTask: CellarTask = { id: nowId('task'), title: updatedLot.nextAction, lot: lot.id, time: 'Hoy', assignee: input.operator.split(' ')[0], priority: 'media', complete: false }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => tank.lot === lot.id ? { ...tank, stage: nextStage.shortLabel, volume: lot.volume, attention: 'normal' as const } : tank)
  return { event, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, tasks: [openingTask, ...tasks], events: [event, ...events] }
}

export const nextMovementCode = (movements: WineMovement[]) => {
  const highest = movements.reduce((maximum, movement) => {
    const match = movement.code.match(/^MOV-\d{2}-(\d+)$/)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `MOV-${String(new Date().getFullYear()).slice(-2)}-${String(highest + 1).padStart(3, '0')}`
}

const movementLot = (lots: WineLot[], lotId: string): WineLot & { type: 'tinto' | 'blanco' | 'rosado' } => {
  const lot = lots.find((item) => item.id === lotId)
  if (!lot || lot.operationalStatus === 'consumed' || lot.volume <= 0 || lot.type === 'espumoso') throw new Error('Movement requires an active wine lot')
  return lot as WineLot & { type: 'tinto' | 'blanco' | 'rosado' }
}

const movementTank = (tanks: Tank[], tankId: string) => {
  const tank = tanks.find((item) => item.id === tankId)
  if (!tank) throw new Error('Vessel not found')
  return tank
}

const emptyDestinationTank = (tanks: Tank[], tankId: string) => {
  const tank = movementTank(tanks, tankId)
  if (tank.lot || tank.volume > 0) throw new Error('Destination vessel must be empty')
  return tank
}

const validateSourceBalance = (lot: WineLot, tank: Tank) => {
  if (Math.abs(tank.volume - lot.volume) > 0.01) throw new Error('Source lot and vessel volumes are inconsistent')
}

const validateMovementMeta = (performedAt: string, operator: string) => {
  if (!performedAt || !operator.trim()) throw new Error('Movement requires time and operator')
}

const movementLoss = (lossVolume: number, grossVolume: number) => {
  const loss = requiredNumber(lossVolume, 'Loss volume is required', 0, grossVolume)
  if (loss >= grossVolume) throw new Error('Loss cannot consume the entire movement')
  return loss
}

const movementRecord = (
  movements: WineMovement[],
  input: Omit<WineMovement, 'id' | 'code' | 'recordedAt' | 'storageMode' | 'lossPercentage'>,
): WineMovement => ({
  ...input,
  id: nowId('movement'),
  code: nextMovementCode(movements),
  recordedAt: new Date().toISOString(),
  lossPercentage: input.grossSourceVolume > 0 ? input.lossVolume / input.grossSourceVolume * 100 : 0,
  storageMode: 'browser-local',
})

const movementActivity = (movement: WineMovement, detail: string): LotActivity => ({
  id: `${movement.id}-${Math.random().toString(36).slice(2, 6)}`,
  title: `Movimiento ${movement.code}`,
  person: movement.operator,
  time: 'Ahora',
  detail,
  recordedAt: movement.recordedAt,
})

export const transferWine = (lots: WineLot[], tanks: Tank[], movements: WineMovement[], input: NewTransferInput) => {
  validateMovementMeta(input.performedAt, input.operator)
  const lot = movementLot(lots, input.lotId)
  const sourceTank = movementTank(tanks, lot.vessel)
  if (sourceTank.lot !== lot.id) throw new Error('Source vessel assignment is inconsistent')
  validateSourceBalance(lot, sourceTank)
  if (input.destinationTankId === sourceTank.id) throw new Error('Source and destination vessels must differ')
  const destinationTank = emptyDestinationTank(tanks, input.destinationTankId)
  const loss = movementLoss(input.lossVolume, lot.volume)
  const received = lot.volume - loss
  if (received > destinationTank.capacity) throw new Error('Destination capacity is insufficient')

  const movement = movementRecord(movements, {
    kind: 'transfer', wineType: lot.type, grossSourceVolume: lot.volume, receivedVolume: received, lossVolume: loss,
    sourceLegs: [{ lotId: lot.id, lotName: lot.name, vesselId: sourceTank.id, volumeBefore: lot.volume, movementVolume: lot.volume, volumeAfter: 0 }],
    destinationLegs: [{ lotId: lot.id, lotName: lot.name, vesselId: destinationTank.id, volumeBefore: 0, movementVolume: received, volumeAfter: received }],
    performedAt: input.performedAt, operator: input.operator.trim(), notes: input.notes.trim(),
  })
  const updatedLot: WineLot = {
    ...lot, vessel: destinationTank.id, volume: received, operationalStatus: 'active',
    activities: [movementActivity(movement, `${sourceTank.id} → ${destinationTank.id} · ${Math.round(received).toLocaleString('es-ES')} L · merma ${Math.round(loss).toLocaleString('es-ES')} L`), ...(lot.activities ?? [])],
  }
  const updatedLots = lots.map((item) => item.id === lot.id ? updatedLot : item)
  const updatedTanks = tanks.map((tank) => {
    if (tank.id === sourceTank.id) return { ...tank, volume: 0, lot: undefined, type: undefined, stage: undefined, temperature: undefined, attention: 'normal' as const }
    if (tank.id === destinationTank.id) return { ...tank, volume: received, lot: lot.id, type: lot.type, stage: lot.process.find((stage) => stage.status === 'current')?.shortLabel ?? lot.stage, temperature: lot.temperature, attention: lot.attention }
    return tank
  })
  return { movement, lot: updatedLot, lots: updatedLots, tanks: updatedTanks, movements: [movement, ...movements] }
}

const nextSplitLotId = (parentId: string, lots: WineLot[], offset: number) => {
  const matcher = new RegExp(`^${parentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-S(\\d+)$`)
  const highest = lots.reduce((maximum, lot) => {
    const match = lot.id.match(matcher)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `${parentId}-S${String(highest + offset).padStart(2, '0')}`
}

export const splitWine = (lots: WineLot[], tanks: Tank[], movements: WineMovement[], input: NewSplitInput) => {
  validateMovementMeta(input.performedAt, input.operator)
  const lot = movementLot(lots, input.lotId)
  const sourceTank = movementTank(tanks, lot.vessel)
  if (sourceTank.lot !== lot.id) throw new Error('Source vessel assignment is inconsistent')
  validateSourceBalance(lot, sourceTank)
  if (!input.destinations.length) throw new Error('Split requires at least one destination')
  const uniqueTankIds = new Set(input.destinations.map((destination) => destination.tankId))
  if (uniqueTankIds.size !== input.destinations.length || uniqueTankIds.has(sourceTank.id)) throw new Error('Split destinations must be unique and differ from the source')
  const destinations = input.destinations.map((destination) => {
    const tank = emptyDestinationTank(tanks, destination.tankId)
    const volume = requiredNumber(destination.volume, 'Destination volume is required', 0.01, tank.capacity)
    return { tank, volume }
  })
  const destinationVolume = destinations.reduce((total, destination) => total + destination.volume, 0)
  const loss = movementLoss(input.lossVolume, lot.volume)
  const remaining = lot.volume - destinationVolume - loss
  if (remaining < -0.01) throw new Error('Split allocations and loss exceed source volume')
  const normalizedRemaining = Math.max(0, remaining)
  if (destinations.length + (normalizedRemaining > 0 ? 1 : 0) < 2) throw new Error('Split must produce at least two active lots')

  const provisionalMovement = movementRecord(movements, {
    kind: 'split', wineType: lot.type, grossSourceVolume: destinationVolume + loss, receivedVolume: destinationVolume, lossVolume: loss,
    sourceLegs: [{ lotId: lot.id, lotName: lot.name, vesselId: sourceTank.id, volumeBefore: lot.volume, movementVolume: destinationVolume + loss, volumeAfter: normalizedRemaining }],
    destinationLegs: destinations.map((destination, index) => ({ lotId: nextSplitLotId(lot.id, lots, index + 1), lotName: `${lot.name} · ${index + 1}`, vesselId: destination.tank.id, volumeBefore: 0, movementVolume: destination.volume, volumeAfter: destination.volume })),
    performedAt: input.performedAt, operator: input.operator.trim(), notes: input.notes.trim(),
  })
  const children = destinations.map((destination, index): WineLot => {
    const leg = provisionalMovement.destinationLegs[index]
    return {
      ...structuredClone(lot), id: leg.lotId, name: leg.lotName, vessel: destination.tank.id, volume: destination.volume, operationalStatus: 'active',
      readings: [...lot.readings, { time: 'División', temperature: lot.temperature ?? 0, density: lot.density ?? 0, volume: destination.volume, note: provisionalMovement.code, recordedAt: provisionalMovement.recordedAt }],
      activities: [movementActivity(provisionalMovement, `${lot.id} → ${destination.tank.id} · ${Math.round(destination.volume).toLocaleString('es-ES')} L`), ...(lot.activities ?? [])],
    }
  })
  const updatedSource: WineLot = {
    ...lot, volume: normalizedRemaining, operationalStatus: normalizedRemaining > 0 ? 'active' : 'consumed',
    activities: [movementActivity(provisionalMovement, `${destinations.length} fracciones · ${Math.round(destinationVolume).toLocaleString('es-ES')} L · merma ${Math.round(loss).toLocaleString('es-ES')} L`), ...(lot.activities ?? [])],
  }
  const updatedLots = [...children, ...lots.map((item) => item.id === lot.id ? updatedSource : item)]
  const childByTank = new Map(children.map((child) => [child.vessel, child]))
  const updatedTanks = tanks.map((tank) => {
    if (tank.id === sourceTank.id) return normalizedRemaining > 0
      ? { ...tank, volume: normalizedRemaining }
      : { ...tank, volume: 0, lot: undefined, type: undefined, stage: undefined, temperature: undefined, attention: 'normal' as const }
    const child = childByTank.get(tank.id)
    return child ? { ...tank, volume: child.volume, lot: child.id, type: child.type, stage: child.process.find((stage) => stage.status === 'current')?.shortLabel ?? child.stage, temperature: child.temperature, attention: child.attention } : tank
  })
  return { movement: provisionalMovement, lots: updatedLots, tanks: updatedTanks, movements: [provisionalMovement, ...movements], createdLots: children, sourceLot: updatedSource }
}

const nextMergedLotId = (vintage: number, lots: WineLot[]) => {
  const year = String(vintage).slice(-2)
  const matcher = new RegExp(`^M-${year}-(\\d+)$`)
  const highest = lots.reduce((maximum, lot) => {
    const match = lot.id.match(matcher)
    return match ? Math.max(maximum, Number(match[1])) : maximum
  }, 0)
  return `M-${year}-${String(highest + 1).padStart(3, '0')}`
}

const mergeCompatible = (reference: WineLot, candidate: WineLot) => {
  const referenceStage = currentStage(reference)?.id
  const candidateStage = currentStage(candidate)?.id
  if (reference.type !== candidate.type) return false
  if (reference.vintage !== candidate.vintage) return false
  if (referenceStage !== candidateStage) return false
  if (reference.type === 'rosado' && reference.productionDetails?.rose?.method !== candidate.productionDetails?.rose?.method) return false
  return true
}

export const mergeWine = (lots: WineLot[], tanks: Tank[], movements: WineMovement[], input: NewMergeInput) => {
  validateMovementMeta(input.performedAt, input.operator)
  if (input.sources.length < 2) throw new Error('Merge requires at least two source lots')
  const sourceIds = new Set(input.sources.map((source) => source.lotId))
  if (sourceIds.size !== input.sources.length) throw new Error('Merge source lots must be unique')
  const sources = input.sources.map((source) => {
    const lot = movementLot(lots, source.lotId)
    const tank = movementTank(tanks, lot.vessel)
    if (tank.lot !== lot.id) throw new Error('Source vessel assignment is inconsistent')
    validateSourceBalance(lot, tank)
    const volume = requiredNumber(source.volume, 'Source volume is required', 0.01, lot.volume)
    return { lot, tank, volume }
  })
  const reference = sources[0].lot
  if (sources.some((source) => !mergeCompatible(reference, source.lot))) throw new Error('Merge lots must share wine type, vintage, process stage and rosado route')
  const destination = emptyDestinationTank(tanks, input.destinationTankId)
  if (sources.some((source) => source.tank.id === destination.id)) throw new Error('Merge destination must differ from every source vessel')
  if (!input.name.trim()) throw new Error('Merged lot name is required')
  const gross = sources.reduce((total, source) => total + source.volume, 0)
  const loss = movementLoss(input.lossVolume, gross)
  const received = gross - loss
  if (received > destination.capacity) throw new Error('Destination capacity is insufficient')
  const mergedLotId = nextMergedLotId(reference.vintage, lots)

  const movement = movementRecord(movements, {
    kind: 'merge', wineType: reference.type, grossSourceVolume: gross, receivedVolume: received, lossVolume: loss,
    sourceLegs: sources.map((source) => ({ lotId: source.lot.id, lotName: source.lot.name, vesselId: source.tank.id, volumeBefore: source.lot.volume, movementVolume: source.volume, volumeAfter: source.lot.volume - source.volume })),
    destinationLegs: [{ lotId: mergedLotId, lotName: input.name.trim(), vesselId: destination.id, volumeBefore: 0, movementVolume: received, volumeAfter: received }],
    performedAt: input.performedAt, operator: input.operator.trim(), notes: input.notes.trim(),
  })
  const weightedMetric = (metric: 'temperature' | 'density') => {
    const measured = sources.filter((source) => source.lot[metric] !== undefined)
    const denominator = measured.reduce((total, source) => total + source.volume, 0)
    return denominator > 0 ? measured.reduce((total, source) => total + (source.lot[metric] ?? 0) * source.volume, 0) / denominator : undefined
  }
  const temperature = weightedMetric('temperature')
  const density = weightedMetric('density')
  const mergedLot: WineLot = {
    ...structuredClone(reference), id: mergedLotId, name: input.name.trim(), vessel: destination.id, volume: received, temperature, density,
    varieties: [...new Set(sources.map((source) => source.lot.varieties))].join(' · '), origin: [...new Set(sources.map((source) => source.lot.origin))].join(' / '),
    attention: 'normal', attentionText: undefined, nextAction: 'Revisar lote combinado', nextTime: 'Hoy', operationalStatus: 'active',
    readings: [{ time: 'Combinación', temperature: temperature ?? 0, density: density ?? 0, volume: received, note: movement.code, recordedAt: movement.recordedAt }],
    activities: [movementActivity(movement, `${sources.length} lotes → ${destination.id} · ${Math.round(received).toLocaleString('es-ES')} L · merma ${Math.round(loss).toLocaleString('es-ES')} L`)],
  }
  const sourceUpdates = new Map(sources.map((source) => {
    const remaining = source.lot.volume - source.volume
    const updated: WineLot = {
      ...source.lot, volume: remaining, operationalStatus: remaining > 0 ? 'active' : 'consumed',
      activities: [movementActivity(movement, `${source.tank.id} → ${destination.id} · ${Math.round(source.volume).toLocaleString('es-ES')} L`), ...(source.lot.activities ?? [])],
    }
    return [source.lot.id, updated]
  }))
  const updatedLots = [mergedLot, ...lots.map((lot) => sourceUpdates.get(lot.id) ?? lot)]
  const updatedTanks = tanks.map((tank) => {
    if (tank.id === destination.id) return { ...tank, volume: received, lot: mergedLot.id, type: mergedLot.type, stage: mergedLot.process.find((stage) => stage.status === 'current')?.shortLabel ?? mergedLot.stage, temperature, attention: 'normal' as const }
    const source = sources.find((item) => item.tank.id === tank.id)
    if (!source) return tank
    const remaining = source.lot.volume - source.volume
    return remaining > 0 ? { ...tank, volume: remaining } : { ...tank, volume: 0, lot: undefined, type: undefined, stage: undefined, temperature: undefined, attention: 'normal' as const }
  })
  return { movement, lot: mergedLot, lots: updatedLots, tanks: updatedTanks, movements: [movement, ...movements], sourceLots: [...sourceUpdates.values()] }
}
