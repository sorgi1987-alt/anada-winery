export type WineType = 'tinto' | 'blanco' | 'rosado' | 'espumoso'
export type RoseStyle = 'rosado' | 'clarete'
export type RoseMethod = 'direct_press' | 'short_maceration' | 'saignee' | 'cofermentation'
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
  rose?: {
    style: RoseStyle
    method: RoseMethod
    redGrapePercentage: number
    blendAfterWeighing: boolean
    macerationHours: number
    pressFraction: string
    turbidityTarget: number
    protection: string
    targetColorIntensity: number
  }
}

export interface ProcessStage {
  id: string
  label: string
  shortLabel: string
  status: 'complete' | 'current' | 'upcoming' | 'optional'
}

export interface Campaign {
  id: string
  code: string
  year: number
  startsAt: string
  endsAt: string
  status: 'planned' | 'active' | 'closed'
}

export interface Grower {
  id: string
  code: string
  name: string
  taxId?: string
  contactName?: string
  email?: string
  phone?: string
  status: 'active' | 'blocked'
}

export interface WineryLocation {
  id: string
  code: string
  name: string
  type: 'winery' | 'vineyard' | 'tank_room' | 'barrel_room' | 'warehouse' | 'processing' | 'external'
  parentLocationId?: string
  active: boolean
}

export type VesselStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'quarantine' | 'inactive'
export type VesselMaterial = 'stainless_steel' | 'concrete' | 'wood' | 'fiberglass' | 'plastic' | 'other'

export interface Vessel {
  id: string
  code: string
  name: string
  type: 'tank' | 'barrel' | 'hopper' | 'press' | 'ibc' | 'flexitank' | 'other'
  material: VesselMaterial
  nominalCapacity: number
  usableCapacity: number
  unit: 'L'
  locationId: string
  status: VesselStatus
  coolingJacket: boolean
  heating: boolean
  variableLid: boolean
  pressureRated: boolean
  active: boolean
}

export interface VesselOccupancy {
  vesselId: string
  wineLotId?: string
  allocatedVolume: number
  usableCapacity: number
  remainingCapacity: number
  fillPercentage: number
  status: VesselStatus
}

export interface VesselAllocation {
  id: string
  vesselId: string
  wineLotId: string
  campaignId: string
  volume: number
  unit: 'L'
  startedAt: string
  endedAt?: string
  status: 'active' | 'ended' | 'corrected'
}

export interface VineyardSampleRecord extends VineyardSample {
  id: string
  parcelId: string
  campaignId: string
  sampledBy: string
  status: 'draft' | 'validated' | 'superseded'
  notes?: string
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
  operationalStatus?: 'active' | 'consumed'
  campaignId?: string
  currentVesselId?: string
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
  growerId?: string
  locationId?: string
  campaignId?: string
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
  growerId?: string
  campaignId?: string
}

export interface WeatherSnapshot {
  id: string
  entityType: 'grape_delivery' | 'production_event' | 'wine_movement' | 'bottling_order'
  entityId: string
  capturedAt: string
  observedAt?: string
  latitude: number
  longitude: number
  temperatureC?: number
  apparentTemperatureC?: number
  relativeHumidity?: number
  windSpeedKmh?: number
  precipitationMm?: number
  weatherCode?: number
  source: 'Open-Meteo' | 'manual' | 'unavailable'
  status: 'live' | 'cached' | 'manual' | 'unavailable'
  notes?: string
}

export interface WineryState {
  schemaVersion: 23
  campaigns: Campaign[]
  growers: Grower[]
  locations: WineryLocation[]
  vessels: Vessel[]
  vesselAllocations: VesselAllocation[]
  vineyardSamples: VineyardSampleRecord[]
  lots: WineLot[]
  tasks: CellarTask[]
  tanks: Tank[]
  productionEvents: ProductionEvent[]
  movements: WineMovement[]
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  samples: LabSample[]
  barrels: Barrel[]
  barrelOperations: BarrelOperation[]
  blendCandidates: BlendCandidate[]
  blendTrials: BlendTrial[]
  packagingMaterials: PackagingMaterial[]
  bottlingOrders: BottlingOrder[]
  traceabilityEntities: TraceabilityEntity[]
  traceabilityLinks: TraceabilityLink[]
  recallSimulations: RecallSimulation[]
  suppliers: Supplier[]
  productMasters: ProductMaster[]
  productLots: ProductLot[]
  productStockTransactions: ProductStockTransaction[]
  weatherSnapshots: WeatherSnapshot[]
  settings: WinerySettings
}

export type SupplierStatus = 'active' | 'blocked'

export interface Supplier {
  id: string
  code: string
  name: string
  taxId: string
  contactName: string
  email: string
  phone: string
  status: SupplierStatus
  approvedAt?: string
  notes: string
}

export interface NewSupplierInput {
  name: string
  taxId: string
  contactName: string
  email: string
  phone: string
  notes: string
}

export type ProductCategory = 'yeast' | 'nutrient' | 'enzyme' | 'sulphur' | 'acid' | 'fining' | 'stabilisation' | 'filtration' | 'cleaning'
export type ProductUnit = 'kg' | 'g' | 'L' | 'mL' | 'units'

export interface ProductMaster {
  id: string
  code: string
  name: string
  category: ProductCategory
  manufacturer: string
  defaultUnit: ProductUnit
  storageInstructions: string
  technicalSheetRef?: string
  safetySheetRef?: string
  active: boolean
}

export interface NewProductMasterInput {
  name: string
  category: ProductCategory
  manufacturer: string
  defaultUnit: ProductUnit
  storageInstructions: string
  technicalSheetRef?: string
  safetySheetRef?: string
}

export type ProductLotStatus = 'quarantine' | 'approved' | 'rejected' | 'expired' | 'recalled' | 'closed'

export interface ProductLot {
  id: string
  code: string
  productId: string
  supplierId: string
  supplierLot: string
  receivedAt: string
  expiresAt?: string
  quantityReceived: number
  quantityOnHand: number
  unit: ProductUnit
  location: string
  locationBalances: ProductLocationBalance[]
  status: ProductLotStatus
  certificateRef?: string
  releasedAt?: string
  releasedBy?: string
  notes: string
}

export type ProductStockTransactionType = 'receipt' | 'release' | 'rejection' | 'recall' | 'adjustment' | 'transfer' | 'consumption' | 'disposal' | 'closure' | 'consumption_reversal'

export interface ProductStockTransaction {
  id: string
  productLotId: string
  type: ProductStockTransactionType
  quantity: number
  unit: ProductUnit
  occurredAt: string
  recordedAt: string
  operator: string
  fromLocation?: string
  toLocation?: string
  reference?: string
  wineLotId?: string
  productionEventId?: string
  reason?: string
  relatedTransactionId?: string
  supersededByTransactionId?: string
  status?: 'active' | 'reversed'
  notes: string
}


export interface ProductLocationBalance {
  location: string
  quantity: number
}

export interface ProductStockAdjustmentInput { productLotId: string; quantity: number; reason: string; performedAt: string; operator: string; notes: string }
export interface ProductLocationTransferInput { productLotId: string; fromLocation: string; toLocation: string; quantity: number; performedAt: string; operator: string; notes: string }
export interface ProductDisposalInput { productLotId: string; location: string; quantity: number; reason: string; performedAt: string; operator: string; reference?: string; notes: string }
export interface ProductConsumptionCorrectionInput { transactionId: string; performedAt: string; operator: string; reason: string; replacement?: NewProductConsumptionInput }

export interface NewProductLotInput {
  productId: string
  supplierId: string
  supplierLot: string
  receivedAt: string
  expiresAt?: string
  quantity: number
  unit: ProductUnit
  location: string
  certificateRef?: string
  notes: string
}

export interface NewProductConsumptionInput {
  productLotId: string
  wineLotId: string
  quantity: number
  performedAt: string
  operator: string
  notes: string
}

export interface WinerySettings {
  wineryName: string
  legalName: string
  wineryCode: string
  municipality: string
  province: string
  designation: string
  timezone: string
  latitude: number
  longitude: number
  campaignYear: number
  campaignStart: string
  campaignEnd: string
  targetHarvestKg: number
  cellarTemperatureTarget: number
  cellarHumidityTarget: number
  taskReminderHours: number
  lowStockThreshold: number
  labReviewHours: number
  showOfficialDisclaimer: boolean
  updatedAt: string
  updatedBy: string
}

export interface NewLotInput {
  type: Extract<WineType, 'tinto' | 'blanco' | 'rosado'>
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
  roseStyle?: RoseStyle
  roseMethod?: RoseMethod
  redGrapePercentage?: number
  blendAfterWeighing?: boolean
  macerationHours?: number
  targetColorIntensity?: number
}

export interface NewTaskInput {
  title: string
  lot: string
  time: string
  assignee: string
  priority: CellarTask['priority']
}

export type RedOperationType =
  | 'selection'
  | 'vatting'
  | 'pump_over'
  | 'punch_down'
  | 'temperature_check'
  | 'density_check'
  | 'addition'
  | 'sample'
  | 'devatting_pressing'
  | 'racking'
  | 'malolactic_check'
  | 'so2_adjustment'

export interface ProductionEventMetrics {
  durationMinutes?: number
  temperature?: number
  density?: number
  volumeBefore?: number
  volumeAfter?: number
  freeRunVolume?: number
  pressVolume?: number
  product?: string
  productId?: string
  productLotId?: string
  supplierLot?: string
  additionAmount?: number
  additionUnit?: ProductUnit
  malicAcid?: number
  freeSo2?: number
  potentialAlcohol?: number
  turbidity?: number
  pressFraction?: string
  protection?: string
  settlingHours?: number
  leesDecision?: 'continue' | 'complete' | 'skip'
  conductivityDrop?: number
  colorIntensity?: number
  skinContactHours?: number
  redGrapePercentage?: number
  separateWeightsConfirmed?: boolean
  mixingAfterWeighing?: boolean
}

export interface ProductionEvent {
  id: string
  lotId: string
  wineType: WineType
  kind: 'operation' | 'transition'
  stageId: string
  operationType?: RedOperationType | WhiteOperationType | RoseOperationType
  fromStageId?: string
  toStageId?: string
  performedAt: string
  recordedAt: string
  operator: string
  notes: string
  metrics: ProductionEventMetrics
  storageMode: 'browser-local'
}

export interface NewRedOperationInput {
  lotId: string
  type: RedOperationType
  performedAt: string
  operator: string
  notes: string
  metrics: ProductionEventMetrics
}

export interface AdvanceRedStageInput {
  lotId: string
  performedAt: string
  operator: string
  notes: string
}

export interface RedStageGate {
  stageId: string
  nextStageId?: string
  eligible: boolean
  reason: 'operation_required' | 'density_required' | 'malic_required' | 'managed_elsewhere' | 'complete' | 'ready'
  value?: number
}

export type WhiteOperationType =
  | 'reception_check'
  | 'must_protection'
  | 'pressing'
  | 'turbidity_check'
  | 'clean_must_racking'
  | 'inoculation'
  | 'temperature_check'
  | 'density_check'
  | 'sample'
  | 'batonnage'
  | 'lees_tasting'
  | 'lees_decision'
  | 'cold_stability_check'

export interface NewWhiteOperationInput {
  lotId: string
  type: WhiteOperationType
  performedAt: string
  operator: string
  notes: string
  metrics: ProductionEventMetrics
}

export interface AdvanceWhiteStageInput {
  lotId: string
  performedAt: string
  operator: string
  notes: string
}

export interface WhiteStageGate {
  stageId: string
  nextStageId?: string
  eligible: boolean
  reason: 'protection_required' | 'pressing_required' | 'turbidity_required' | 'racking_required' | 'density_required' | 'lees_decision_required' | 'stability_required' | 'complete' | 'ready'
  value?: number
}

export type RoseOperationType =
  | 'composition_check'
  | 'separate_weighing'
  | 'must_protection'
  | 'direct_pressing'
  | 'skin_contact_check'
  | 'color_check'
  | 'saignee_separation'
  | 'joint_vatting'
  | 'gentle_cap_management'
  | 'fraction_separation'
  | 'turbidity_check'
  | 'clean_must_racking'
  | 'inoculation'
  | 'temperature_check'
  | 'density_check'
  | 'sample'
  | 'lees_decision'
  | 'stability_check'

export interface NewRoseOperationInput {
  lotId: string
  type: RoseOperationType
  performedAt: string
  operator: string
  notes: string
  metrics: ProductionEventMetrics
}

export interface AdvanceRoseStageInput {
  lotId: string
  performedAt: string
  operator: string
  notes: string
}

export interface RoseStageGate {
  stageId: string
  nextStageId?: string
  eligible: boolean
  reason: 'composition_required' | 'weighing_required' | 'protection_required' | 'pressing_required' | 'contact_required' | 'color_required' | 'vatting_required' | 'separation_required' | 'turbidity_required' | 'racking_required' | 'density_required' | 'lees_decision_required' | 'stability_required' | 'complete' | 'ready'
  value?: number
}

export type WineMovementKind = 'transfer' | 'split' | 'merge'

export interface WineMovementLeg {
  lotId: string
  lotName: string
  vesselId: string
  volumeBefore: number
  movementVolume: number
  volumeAfter: number
}

export interface WineMovement {
  id: string
  code: string
  kind: WineMovementKind
  wineType: Exclude<WineType, 'espumoso'>
  sourceLegs: WineMovementLeg[]
  destinationLegs: WineMovementLeg[]
  grossSourceVolume: number
  receivedVolume: number
  lossVolume: number
  lossPercentage: number
  performedAt: string
  recordedAt: string
  operator: string
  notes: string
  storageMode: 'browser-local'
}

export interface NewTransferInput {
  lotId: string
  destinationTankId: string
  lossVolume: number
  performedAt: string
  operator: string
  notes: string
}

export interface NewSplitInput {
  lotId: string
  destinations: Array<{ tankId: string; volume: number }>
  lossVolume: number
  performedAt: string
  operator: string
  notes: string
}

export interface NewMergeInput {
  sources: Array<{ lotId: string; volume: number }>
  destinationTankId: string
  name: string
  lossVolume: number
  performedAt: string
  operator: string
  notes: string
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

export type BarrelStatus = 'filled' | 'empty' | 'maintenance'
export type OakOrigin = 'french' | 'american' | 'hungarian'
export type ToastLevel = 'light' | 'medium' | 'medium_plus' | 'heavy'
export type BarrelOperationType = 'top_up' | 'tasting' | 'so2_check' | 'racking' | 'cleaning' | 'repair'

export interface Barrel {
  id: string
  code: string
  cooperage: string
  oakOrigin: OakOrigin
  toast: ToastLevel
  grain: 'fine' | 'medium'
  capacity: number
  volume: number
  status: BarrelStatus
  room: string
  rack: string
  position: string
  useNumber: number
  lotId?: string
  lotName?: string
  wineType?: WineType
  filledAt?: string
  plannedMonths?: number
  attention: AttentionLevel
  nextAction: string
  nextDue: string
  notes: string
}

export interface BarrelOperation {
  id: string
  type: BarrelOperationType
  barrelIds: string[]
  targetLabel: string
  performedAt: string
  person: string
  volumeAdded?: number
  notes: string
}

export interface NewBarrelInput {
  code: string
  cooperage: string
  oakOrigin: OakOrigin
  toast: ToastLevel
  grain: Barrel['grain']
  capacity: number
  room: string
  rack: string
  position: string
  useNumber: number
  lotId: string
  plannedMonths: number
  notes: string
}

export interface NewBarrelOperationInput {
  targetType: 'barrel' | 'lot'
  targetId: string
  type: BarrelOperationType
  performedAt: string
  volumeAdded: number
  notes: string
}

export type BlendTrialStatus = 'draft' | 'tasting' | 'approved' | 'rejected'
export type BlendCandidateReadiness = 'ready' | 'hold'
export type BlendTastingRecommendation = 'promising' | 'adjust' | 'reject'

export interface BlendAnalysis {
  alcohol: number
  ph: number
  totalAcidity: number
  colorIntensity: number
}

export interface BlendCandidate {
  id: string
  lotId: string
  name: string
  type: Extract<WineType, 'tinto' | 'blanco'>
  vintage: number
  varieties: string
  origin: string
  vessel: string
  availableVolume: number
  analysis: BlendAnalysis
  sensory: string[]
  readiness: BlendCandidateReadiness
  nextReview: string
  image: string
}

export interface BlendComponent {
  candidateId: string
  percentage: number
}

export interface BlendTasting {
  visual: number
  aroma: number
  palate: number
  balance: number
  recommendation: BlendTastingRecommendation
  notes: string
  tastedAt: string
  tastedBy: string
}

export interface BlendTrial {
  id: string
  code: string
  name: string
  type: Extract<WineType, 'tinto' | 'blanco'>
  targetVolume: number
  objective: string
  status: BlendTrialStatus
  components: BlendComponent[]
  estimatedAnalysis: BlendAnalysis
  createdAt: string
  createdBy: string
  tasting?: BlendTasting
  approvedAt?: string
  approvedBy?: string
}

export interface NewBlendTrialInput {
  name: string
  type: BlendTrial['type']
  targetVolume: number
  objective: string
  components: BlendComponent[]
}

export interface BlendTastingInput {
  trialId: string
  visual: number
  aroma: number
  palate: number
  balance: number
  recommendation: BlendTastingRecommendation
  notes: string
}

export type BottlingOrderStatus = 'draft' | 'preparation' | 'ready' | 'in_progress' | 'completed' | 'hold'
export type BottlingGateKey = 'wine_release' | 'pre_bottling_lab' | 'stabilisation' | 'filtration' | 'artwork' | 'line_sanitation'
export type PackagingMaterialType = 'bottle' | 'closure' | 'capsule' | 'front_label' | 'back_label' | 'carton'

export interface BottlingReleaseGate {
  key: BottlingGateKey
  complete: boolean
  verifiedAt?: string
  verifiedBy?: string
}

export interface PackagingMaterial {
  id: string
  code: string
  type: PackagingMaterialType
  name: string
  supplier: string
  lotNumber: string
  onHand: number
  reserved: number
  reorderPoint: number
  unit: 'units'
  controlledSeries?: string
}

export interface BottlingPackaging {
  bottleSize: number
  unitsPerCase: number
  bottleId: string
  closureId: string
  capsuleId: string
  frontLabelId: string
  backLabelId: string
  cartonId: string
}

export interface BottlingCompletion {
  goodBottles: number
  rejectedBottles: number
  actualVolume: number
  finishedProductLot: string
  labelSerialFrom?: number
  labelSerialTo?: number
  completedAt: string
  completedBy: string
  notes: string
}

export interface BottlingOrder {
  id: string
  code: string
  sourceTrialId: string
  sourceCode: string
  wineName: string
  type: Extract<WineType, 'tinto' | 'blanco'>
  vintage: number
  labelClaim?: string
  originClaim?: string
  targetVolume: number
  targetBottles: number
  scheduledAt: string
  line: string
  status: BottlingOrderStatus
  packaging: BottlingPackaging
  gates: BottlingReleaseGate[]
  createdAt: string
  createdBy: string
  releasedAt?: string
  releasedBy?: string
  completion?: BottlingCompletion
}

export interface NewBottlingOrderInput {
  sourceTrialId: string
  wineName: string
  vintage: number
  targetVolume: number
  scheduledAt: string
  line: string
  bottleSize: number
  unitsPerCase: number
  packaging: Omit<BottlingPackaging, 'bottleSize' | 'unitsPerCase'>
}

export interface CompleteBottlingOrderInput {
  orderId: string
  goodBottles: number
  rejectedBottles: number
  actualVolume: number
  finishedProductLot: string
  labelSerialFrom?: number
  notes: string
}

export type TraceabilityEntityType = 'parcel' | 'grape_delivery' | 'product_lot' | 'wine_lot' | 'barrel_group' | 'blend' | 'bottling_order' | 'finished_lot' | 'packaging_lot'
export type TraceabilityEntityStatus = 'verified' | 'pending' | 'attention'
export type TraceabilityRelation = 'harvested_into' | 'processed_as' | 'used_in' | 'aged_in' | 'component_of' | 'bottled_as' | 'produced_as' | 'packaged_with'
export type TraceabilityDirection = 'backward' | 'forward' | 'both'

export interface TraceabilityEntity {
  id: string
  type: TraceabilityEntityType
  code: string
  name: string
  subtitle: string
  occurredAt: string
  status: TraceabilityEntityStatus
  quantity?: number
  unit?: ProductUnit | 'bottles'
  image?: string
  metadata: Record<string, string>
}

export interface TraceabilityLink {
  id: string
  sourceId: string
  targetId: string
  relation: TraceabilityRelation
  quantity?: number
  unit?: ProductUnit | 'bottles'
  occurredAt: string
  evidence: string
  status: 'verified' | 'pending'
  verifiedBy?: string
}

export type RecallReason = 'quality' | 'packaging' | 'labelling' | 'trace_test'

export interface RecallSimulation {
  id: string
  code: string
  targetEntityId: string
  targetCode: string
  reason: RecallReason
  notes: string
  affectedEntityIds: string[]
  affectedFinishedLotIds: string[]
  affectedBottlingOrderIds: string[]
  sourceParcelIds: string[]
  createdAt: string
  createdBy: string
  status: 'completed'
}

export interface NewRecallSimulationInput {
  targetEntityId: string
  reason: RecallReason
  notes: string
}
