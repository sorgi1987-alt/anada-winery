import type { Vessel, VesselAllocation, VesselOccupancy, VesselStatus } from './types'

const round = (value: number) => Math.round(value * 100) / 100

export const activeAllocationForVessel = (allocations: VesselAllocation[], vesselId: string) =>
  allocations.find((allocation) => allocation.vesselId === vesselId && allocation.status === 'active')

export const deriveVesselOccupancy = (vessel: Vessel, allocations: VesselAllocation[]): VesselOccupancy => {
  const allocation = activeAllocationForVessel(allocations, vessel.id)
  const allocatedVolume = allocation?.volume ?? 0
  const remainingCapacity = Math.max(0, vessel.usableCapacity - allocatedVolume)
  const fillPercentage = vessel.usableCapacity > 0 ? round(allocatedVolume / vessel.usableCapacity * 100) : 0
  const operationalStatus: VesselStatus = !vessel.active ? 'inactive'
    : vessel.status === 'cleaning' || vessel.status === 'maintenance' || vessel.status === 'quarantine'
      ? vessel.status
      : allocatedVolume > 0 ? 'occupied' : 'available'
  return { vesselId: vessel.id, wineLotId: allocation?.wineLotId, allocatedVolume, usableCapacity: vessel.usableCapacity, remainingCapacity, fillPercentage, status: operationalStatus }
}

export const deriveCellarOccupancy = (vessels: Vessel[], allocations: VesselAllocation[]) =>
  vessels.map((vessel) => deriveVesselOccupancy(vessel, allocations))

export const assertVesselCanReceive = (vessel: Vessel, allocations: VesselAllocation[], incomingVolume: number) => {
  if (!Number.isFinite(incomingVolume) || incomingVolume <= 0) throw new Error('Incoming volume must be greater than zero')
  if (!vessel.active || vessel.status === 'inactive') throw new Error('Destination vessel is inactive')
  if (vessel.status === 'cleaning' || vessel.status === 'maintenance' || vessel.status === 'quarantine') {
    throw new Error(`Destination vessel is ${vessel.status}`)
  }
  const occupancy = deriveVesselOccupancy(vessel, allocations)
  if (incomingVolume > occupancy.remainingCapacity) throw new Error('Destination usable capacity is insufficient')
  return occupancy
}

export const validateCellarAssets = (vessels: Vessel[], allocations: VesselAllocation[]): string[] => {
  const errors: string[] = []
  const codes = new Set<string>()
  const ids = new Set(vessels.map((vessel) => vessel.id))
  vessels.forEach((vessel) => {
    const code = vessel.code.trim().toLowerCase()
    if (!code) errors.push(`Vessel ${vessel.id} has no code`)
    if (codes.has(code)) errors.push(`Duplicate vessel code ${vessel.code}`)
    codes.add(code)
    if (vessel.nominalCapacity <= 0) errors.push(`Vessel ${vessel.id} has invalid nominal capacity`)
    if (vessel.usableCapacity <= 0 || vessel.usableCapacity > vessel.nominalCapacity) errors.push(`Vessel ${vessel.id} has invalid usable capacity`)
  })
  const activeByVessel = new Map<string, number>()
  allocations.filter((allocation) => allocation.status === 'active').forEach((allocation) => {
    if (!ids.has(allocation.vesselId)) errors.push(`Allocation ${allocation.id} has no valid vessel`)
    activeByVessel.set(allocation.vesselId, (activeByVessel.get(allocation.vesselId) ?? 0) + 1)
    const vessel = vessels.find((item) => item.id === allocation.vesselId)
    if (vessel && allocation.volume > vessel.usableCapacity) errors.push(`Allocation ${allocation.id} exceeds vessel ${vessel.id} usable capacity`)
  })
  activeByVessel.forEach((count, vesselId) => { if (count > 1) errors.push(`Vessel ${vesselId} has multiple active allocations`) })
  return errors
}
