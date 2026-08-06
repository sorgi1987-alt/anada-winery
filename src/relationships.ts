import type {
  Campaign,
  GrapeDelivery,
  Grower,
  Tank,
  VineyardParcel,
  VineyardSampleRecord,
  Vessel,
  VesselAllocation,
  WineryLocation,
  WinerySettings,
  WineLot,
} from './types'

const slug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const growerCode = (index: number) => `VIT-${String(index + 1).padStart(3, '0')}`

export interface CanonicalRelationshipModel {
  campaigns: Campaign[]
  growers: Grower[]
  locations: WineryLocation[]
  vessels: Vessel[]
  vesselAllocations: VesselAllocation[]
  vineyardSamples: VineyardSampleRecord[]
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  lots: WineLot[]
}

export const buildCanonicalRelationshipModel = (
  settings: WinerySettings,
  parcels: VineyardParcel[],
  deliveries: GrapeDelivery[],
  lots: WineLot[],
  tanks: Tank[],
): CanonicalRelationshipModel => {
  const campaignId = `campaign-${settings.campaignYear}`
  const campaigns: Campaign[] = [{
    id: campaignId,
    code: String(settings.campaignYear),
    name: `Vendimia ${settings.campaignYear}`,
    vintage: settings.campaignYear,
    startsAt: settings.campaignStart,
    expectedHarvestStart: `${settings.campaignYear}-09-01`,
    expectedEndAt: settings.campaignEnd,
    status: 'active',
    isDefault: true,
    notes: '',
    createdAt: `${settings.campaignStart}T00:00:00.000Z`,
    updatedAt: `${settings.campaignStart}T00:00:00.000Z`,
    createdBy: 'System migration',
    updatedBy: 'System migration',
  }]

  const growerNames = [...new Set(parcels.map((parcel) => parcel.grower.trim()).filter(Boolean))]
  const growers: Grower[] = growerNames.map((name, index) => ({
    id: `grower-${slug(name)}`,
    code: growerCode(index),
    name,
    status: 'active',
  }))
  const growerByName = new Map(growers.map((grower) => [grower.name.toLowerCase(), grower]))

  const wineryLocation: WineryLocation = {
    id: 'location-winery',
    code: 'BOD-01',
    name: settings.wineryName,
    type: 'winery',
    active: true,
  }
  const tankRoom: WineryLocation = {
    id: 'location-tank-room',
    code: 'DEP-01',
    name: 'Sala de depósitos',
    type: 'tank_room',
    parentLocationId: wineryLocation.id,
    active: true,
  }
  const municipalityNames = [...new Set(parcels.map((parcel) => parcel.municipality.trim()).filter(Boolean))]
  const vineyardLocations: WineryLocation[] = municipalityNames.map((name, index) => ({
    id: `location-vineyard-${slug(name)}`,
    code: `VIN-${String(index + 1).padStart(2, '0')}`,
    name,
    type: 'vineyard',
    active: true,
  }))
  const storageNames = [...new Set(deliveries.map((delivery) => delivery.processingDestination.trim()).filter(Boolean))]
  const processingLocations: WineryLocation[] = storageNames.map((name, index) => ({
    id: `location-processing-${slug(name)}`,
    code: `PRO-${String(index + 1).padStart(2, '0')}`,
    name,
    type: 'processing',
    parentLocationId: wineryLocation.id,
    active: true,
  }))
  const locations = [wineryLocation, tankRoom, ...vineyardLocations, ...processingLocations]
  const vineyardLocationByName = new Map(vineyardLocations.map((location) => [location.name.toLowerCase(), location]))

  const normalizedParcels = parcels.map((parcel) => ({
    ...parcel,
    growerId: parcel.growerId ?? growerByName.get(parcel.grower.toLowerCase())?.id,
    locationId: parcel.locationId ?? vineyardLocationByName.get(parcel.municipality.toLowerCase())?.id,
    campaignId: parcel.campaignId ?? campaignId,
  }))
  const parcelById = new Map(normalizedParcels.map((parcel) => [parcel.id, parcel]))
  const normalizedDeliveries = deliveries.map((delivery) => {
    const parcel = parcelById.get(delivery.parcelId)
    return {
      ...delivery,
      growerId: delivery.growerId ?? parcel?.growerId ?? growerByName.get(delivery.grower.toLowerCase())?.id,
      campaignId: delivery.campaignId ?? parcel?.campaignId ?? campaignId,
    }
  })

  const vessels: Vessel[] = tanks.map((tank) => ({
    id: tank.id,
    code: tank.id,
    name: `Depósito ${tank.id}`,
    type: 'tank',
    material: 'stainless_steel',
    nominalCapacity: tank.capacity,
    usableCapacity: tank.capacity,
    unit: 'L',
    locationId: tankRoom.id,
    status: 'available',
    coolingJacket: true,
    heating: false,
    variableLid: false,
    pressureRated: false,
    active: true,
  }))
  const vesselByCode = new Map(vessels.map((vessel) => [vessel.code.toLowerCase(), vessel]))
  const normalizedLots = lots.map((lot) => {
    const inferredCampaignId = lot.campaignId ?? (
      typeof lot.vintage === 'number' && Number.isFinite(lot.vintage)
        ? `campaign-${lot.vintage}`
        : undefined
    )
    const inferredVesselId = lot.currentVesselId ?? (
      typeof lot.vessel === 'string' && lot.vessel.trim()
        ? vesselByCode.get(lot.vessel.trim().toLowerCase())?.id
        : undefined
    )

    const campaignChanged = inferredCampaignId !== undefined && inferredCampaignId !== lot.campaignId
    const vesselChanged = inferredVesselId !== undefined && inferredVesselId !== lot.currentVesselId

    if (!campaignChanged && !vesselChanged) return lot

    return {
      ...lot,
      ...(campaignChanged ? { campaignId: inferredCampaignId } : {}),
      ...(vesselChanged ? { currentVesselId: inferredVesselId } : {}),
    }
  })
  const lotById = new Map(normalizedLots.map((lot) => [lot.id, lot]))
  const vesselAllocations: VesselAllocation[] = tanks.flatMap((tank) => {
    if (!tank.lot) return []
    const lot = lotById.get(tank.lot)
    if (!lot) return []
    return [{
      id: `allocation-${tank.id}-${lot.id}`,
      vesselId: tank.id,
      wineLotId: lot.id,
      campaignId: lot.campaignId ?? campaignId,
      volume: tank.volume,
      unit: 'L' as const,
      startedAt: lot.productionDetails?.receptionDate
        ? `${lot.productionDetails.receptionDate}T08:00:00+02:00`
        : `${lot.vintage}-09-01T08:00:00+02:00`,
      status: 'active' as const,
    }]
  })

  const vineyardSamples: VineyardSampleRecord[] = normalizedParcels.map((parcel) => ({
    id: `vineyard-sample-${parcel.id}-${parcel.sample.sampledAt.slice(0, 10)}`,
    parcelId: parcel.id,
    campaignId: parcel.campaignId ?? campaignId,
    sampledAt: parcel.sample.sampledAt,
    sampledBy: 'Equipo de viticultura',
    potentialAlcohol: parcel.sample.potentialAlcohol,
    ph: parcel.sample.ph,
    totalAcidity: parcel.sample.totalAcidity,
    health: parcel.sample.health,
    status: 'validated',
  }))

  return {
    campaigns,
    growers,
    locations,
    vessels,
    vesselAllocations,
    vineyardSamples,
    parcels: normalizedParcels,
    deliveries: normalizedDeliveries,
    lots: normalizedLots,
  }
}

export const validateCanonicalRelationships = (model: CanonicalRelationshipModel): string[] => {
  const errors: string[] = []
  const growerIds = new Set(model.growers.map((item) => item.id))
  const locationIds = new Set(model.locations.map((item) => item.id))
  const campaignIds = new Set(model.campaigns.map((item) => item.id))
  const parcelIds = new Set(model.parcels.map((item) => item.id))
  const vesselIds = new Set(model.vessels.map((item) => item.id))
  const lotIds = new Set(model.lots.map((item) => item.id))

  model.parcels.forEach((parcel) => {
    if (!parcel.growerId || !growerIds.has(parcel.growerId)) errors.push(`Parcel ${parcel.id} has no valid grower`)
    if (!parcel.locationId || !locationIds.has(parcel.locationId)) errors.push(`Parcel ${parcel.id} has no valid vineyard location`)
    if (!parcel.campaignId || !campaignIds.has(parcel.campaignId)) errors.push(`Parcel ${parcel.id} has no valid campaign`)
  })
  model.deliveries.forEach((delivery) => {
    if (!parcelIds.has(delivery.parcelId)) errors.push(`Delivery ${delivery.id} has no valid parcel`)
    if (!delivery.growerId || !growerIds.has(delivery.growerId)) errors.push(`Delivery ${delivery.id} has no valid grower`)
  })
  model.vineyardSamples.forEach((sample) => {
    if (!parcelIds.has(sample.parcelId)) errors.push(`Vineyard sample ${sample.id} has no valid parcel`)
  })
  const activeVesselIds = new Set<string>()
  model.vesselAllocations.filter((allocation) => allocation.status === 'active').forEach((allocation) => {
    if (!vesselIds.has(allocation.vesselId)) errors.push(`Allocation ${allocation.id} has no valid vessel`)
    if (!lotIds.has(allocation.wineLotId)) errors.push(`Allocation ${allocation.id} has no valid wine lot`)
    if (activeVesselIds.has(allocation.vesselId)) errors.push(`Vessel ${allocation.vesselId} has multiple active allocations`)
    const vessel = model.vessels.find((item) => item.id === allocation.vesselId)
    if (vessel && allocation.volume > vessel.usableCapacity) errors.push(`Allocation ${allocation.id} exceeds vessel ${vessel.id} usable capacity`)
    activeVesselIds.add(allocation.vesselId)
  })
  return errors
}
