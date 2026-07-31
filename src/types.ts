export type WineType = 'tinto' | 'blanco' | 'rosado' | 'espumoso'
export type AttentionLevel = 'normal' | 'warning' | 'critical'

export interface ReadingPoint {
  time: string
  temperature: number
  density: number
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
