export type MonitoreoStatus =
  | 'Pendiente'
  | 'Encitio de carga'
  | 'En ruta'
  | 'En destino'
  | 'Entregado'
  | 'Incidencia'

export type TrackingEventType = 'Ubicacion' | 'Incidencia' | 'Nota' | 'Estadia'

export interface TrackingEvent {
  id: string
  serviceId: string
  type: TrackingEventType
  status?: MonitoreoStatus
  message?: string
  lat?: number
  lng?: number
  timestamp: string
  user?: string
}

export interface MonitoreoResumen {
  serviceId: string
  status: MonitoreoStatus
  lastEventAt?: string
  lastLocation?: { lat: number; lng: number }
  notas: number
  incidencias: number
}