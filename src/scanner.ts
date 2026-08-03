import type { Barrel, BottlingOrder, GrapeDelivery, Tank, VineyardParcel, WineLot } from './types'

export type ScanEntityType = 'lot' | 'vessel' | 'barrel' | 'parcel' | 'delivery' | 'bottling'

export interface ScanEntity {
  key: string
  type: ScanEntityType
  id: string
  code: string
  title: string
  subtitle: string
  detail: string
  route: string
  lotId?: string
  aliases: string[]
}

export interface ScannerRegistryInput {
  lots: WineLot[]
  tanks: Tank[]
  barrels: Barrel[]
  parcels: VineyardParcel[]
  deliveries: GrapeDelivery[]
  bottlingOrders: BottlingOrder[]
}

const normalized = (value: string) => value.trim().toLocaleUpperCase('es-ES')

export const scanPayload = (entity: Pick<ScanEntity, 'type' | 'code'>) => `ANADA:${entity.type.toUpperCase()}:${entity.code}`

export function parseScanPayload(value: string): { type?: ScanEntityType; code: string } {
  const clean = decodeURIComponent(value.trim())
  const match = clean.match(/^ANADA:(LOT|VESSEL|BARREL|PARCEL|DELIVERY|BOTTLING):(.+)$/i)
  if (match) return { type: match[1].toLowerCase() as ScanEntityType, code: match[2].trim() }
  return { code: clean }
}

export function buildScannerRegistry({ lots, tanks, barrels, parcels, deliveries, bottlingOrders }: ScannerRegistryInput): ScanEntity[] {
  return [
    ...lots.map((lot): ScanEntity => ({
      key: `lot:${lot.id}`, type: 'lot', id: lot.id, code: lot.id, title: lot.name,
      subtitle: `${lot.vintage} · ${lot.varieties}`, detail: `${lot.vessel} · ${lot.stage}`,
      route: `/lots/${encodeURIComponent(lot.id)}`, lotId: lot.id, aliases: [lot.id],
    })),
    ...tanks.map((tank): ScanEntity => ({
      key: `vessel:${tank.id}`, type: 'vessel', id: tank.id, code: tank.id, title: tank.id,
      subtitle: tank.lot ? `${tank.lot} · ${tank.stage ?? ''}` : 'Empty vessel',
      detail: `${tank.volume.toLocaleString('es-ES')} / ${tank.capacity.toLocaleString('es-ES')} L`,
      route: '/cellar', lotId: tank.lot, aliases: [tank.id],
    })),
    ...barrels.map((barrel): ScanEntity => ({
      key: `barrel:${barrel.id}`, type: 'barrel', id: barrel.id, code: barrel.code, title: barrel.code,
      subtitle: `${barrel.cooperage} · ${barrel.rack}-${barrel.position}`,
      detail: barrel.lotId ? `${barrel.lotId} · ${barrel.volume} L` : barrel.status,
      route: '/ageing', lotId: barrel.lotId, aliases: [barrel.id, barrel.code],
    })),
    ...parcels.map((parcel): ScanEntity => ({
      key: `parcel:${parcel.id}`, type: 'parcel', id: parcel.id, code: parcel.id, title: parcel.name,
      subtitle: `${parcel.municipality} · ${parcel.varieties}`, detail: `${parcel.grower} · ${parcel.readiness}`,
      route: '/harvest', aliases: [parcel.id],
    })),
    ...deliveries.map((delivery): ScanEntity => ({
      key: `delivery:${delivery.id}`, type: 'delivery', id: delivery.id, code: delivery.code, title: delivery.code,
      subtitle: `${delivery.grower} · ${delivery.varieties}`, detail: `${delivery.expectedKg.toLocaleString('es-ES')} kg · ${delivery.status}`,
      route: '/harvest', aliases: [delivery.id, delivery.code],
    })),
    ...bottlingOrders.map((order): ScanEntity => ({
      key: `bottling:${order.id}`, type: 'bottling', id: order.id, code: order.code, title: order.wineName,
      subtitle: `${order.code} · ${order.vintage}`, detail: `${order.targetBottles.toLocaleString('es-ES')} bottles · ${order.status}`,
      route: '/bottling', aliases: [order.id, order.code, order.completion?.finishedProductLot ?? ''].filter(Boolean),
    })),
  ]
}

export function resolveScanCode(value: string, registry: ScanEntity[]): ScanEntity[] {
  const parsed = parseScanPayload(value)
  const code = normalized(parsed.code)
  if (!code) return []
  return registry.filter((entity) => (!parsed.type || entity.type === parsed.type)
    && entity.aliases.some((alias) => normalized(alias) === code))
}

export function searchScannerRegistry(value: string, registry: ScanEntity[]): ScanEntity[] {
  const query = normalized(value)
  if (!query) return registry
  return registry.filter((entity) => normalized(`${entity.code} ${entity.title} ${entity.subtitle} ${entity.detail}`).includes(query))
}
