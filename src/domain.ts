import { images, redProcess, whiteProcess } from './data'
import type { CellarTask, LotActivity, NewLotInput, NewTaskInput, ProcessStage, Tank, WineLot } from './types'

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
