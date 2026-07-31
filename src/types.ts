export type WineType = 'tinto' | 'blanco' | 'rosado' | 'espumoso'
export type AttentionLevel = 'normal' | 'warning' | 'critical'

export interface ReadingPoint {
  time: string
  temperature: number
  density: number
  volume?: number
  note?: string
  recordedAt?: string
}

export interface LotActivity {
  id: string
  title: string
  person: string
  time: string
  detail: string
  recordedAt: string
}

export interface ProductionDetails {
  receivedKg: number
  receptionDate: string
  initialDensity: number
  receptionTemperature: number
  red?: {
    macerationPlan: string
  }
  white?: {
    pressFraction: string
    turbidityTarget: number
    protection: string
  }
}

export interface ProcessStage {
  id: string
  label: string
  shortLabel: string
  status: 'complete' | 'current' | 'upcoming' | 'optional'
}

export interface WineLot {
  id: string
  name: string
  type: WineType
  varieties: string
  origin: string
  vintage: number
  volume: number
  vessel: string
  stage: string
  day?: number
  temperature?: number
  density?: number
  progress: number
  attention: AttentionLevel
  attentionText?: string
  nextAction: string
  nextTime: string
  image: string
  process: ProcessStage[]
  readings: ReadingPoint[]
  activities?: LotActivity[]
  productionDetails?: ProductionDetails
}

export interface CellarTask {
  id: string
  title: string
  lot: string
  time: string
  assignee: string
  priority: 'alta' | 'media' | 'normal'
  complete: boolean
}

export interface Tank {
  id: string
  capacity: number
  volume: number
  lot?: string
  type?: WineType
  stage?: string
  temperature?: number
  attention: AttentionLevel
}

export type ParcelReadiness = 'sampling' | 'ready' | 'scheduled' | 'harvested'
export type DeliveryStatus = 'planned' | 'en_route' | 'at_gate' | 'received'
export type GrapeCondition = 'excellent' | 'good' | 'review'

export interface VineyardSample {
  sampledAt: string
  potentialAlcohol: number
  ph: number
  totalAcidity: number
  health: number
}

export interface VineyardParcel {
  id: string
  name: string
  grower: string
  municipality: string
  zone: string
  varieties: string
  hectares: number
  estimatedKg: number
  harvestWindow: string
  readiness: ParcelReadiness
  sample: VineyardSample
  image: string
}

export interface GrapeDelivery {
  id: string
  code: string
  parcelId: string
  grower: string
  varieties: string
  origin: string
  scheduledDate: string
  scheduledTime: string
  expectedKg: number
  status: DeliveryStatus
  vehicle: string
  processingDestination: string
  receivedAt?: string
  grossKg?: number
  tareKg?: number
  netKg?: number
  temperature?: number
  potentialAlcohol?: number
  condition?: GrapeCondition
  notes?: string
}

export interface WineryState {
  schemaVersion: 3
  lots: WineLot[]
  tasks: CellarTask[]
  tanks: Tank[]
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  samples: LabSample[]
}

export interface NewLotInput {
  type: Extract<WineType, 'tinto' | 'blanco'>
  id: string
  name: string
  vintage: number
  varieties: string
  origin: string
  receptionDate: string
  receivedKg: number
  volume: number
  vessel: string
  temperature: number
  density: number
  macerationPlan?: string
  pressFraction?: string
  turbidityTarget?: number
  protection?: string
}

export interface NewTaskInput {
  title: string
  lot: string
  time: string
  assignee: string
  priority: CellarTask['priority']
}

export interface NewGrapeIntakeInput {
  deliveryId: string
  parcelId: string
  scheduledDate: string
  scheduledTime: string
  expectedKg: number
  vehicle: string
  grossKg: number
  tareKg: number
  temperature: number
  potentialAlcohol: number
  condition: GrapeCondition
  processingDestination: string
  notes: string
}

export type LabSampleStatus = 'queued' | 'in_analysis' | 'review' | 'validated'
export type LabSampleSource = 'lot' | 'delivery' | 'parcel'
export type LabPriority = 'urgent' | 'today' | 'routine'
export type LabProfile = 'maturity' | 'fermentation' | 'malolactic' | 'bottling'
export type LabAnalysisKey = 'temperature' | 'density' | 'ph' | 'total_acidity' | 'volatile_acidity' | 'potential_alcohol' | 'malic_acid' | 'free_so2' | 'total_so2' | 'turbidity' | 'residual_sugar'
export type LabResultStatus = 'normal' | 'warning' | 'critical'

export interface LabResult {
  analysis: LabAnalysisKey
  value: number
  unit: string
  status: LabResultStatus
}

export interface LabSample {
  id: string
  code: string
  sourceType: LabSampleSource
  sourceId: string
  sourceName: string
  wineType?: WineType
  profile: LabProfile
  collectedAt: string
  collectedBy: string
  assignedTo: string
  dueAt: string
  priority: LabPriority
  status: LabSampleStatus
  requestedAnalyses: LabAnalysisKey[]
  results: LabResult[]
  notes: string
  validatedAt?: string
}

export interface NewLabSampleInput {
  sourceType: LabSampleSource
  sourceId: string
  profile: LabProfile
  assignedTo: string
  dueAt: string
  priority: LabPriority
  notes: string
}

export interface LabResultsInput {
  sampleId: string
  values: Partial<Record<LabAnalysisKey, number>>
  notes: string
}
