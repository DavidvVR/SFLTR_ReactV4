import { MonitoreoStatus, TrackingEvent, MonitoreoResumen } from '../types'

const STORAGE_KEY = 'SFLTR_MONITOREO_V1'

interface ServiceTrack {
  events: TrackingEvent[]
  status: MonitoreoStatus
  updatedAt: string
}

interface Store {
  byService: Record<string, ServiceTrack>
  updatedAt: string
}

function nowIso() { return new Date().toISOString() }

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as Store
  } catch {
    return { byService: {}, updatedAt: nowIso() }
  }
}

function save(s: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function listResumen(): MonitoreoResumen[] {
  const s = load()
  return Object.entries(s.byService).map(([serviceId, track]) => {
    const last = [...track.events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).at(-1)
    const lastLocation = track.events.slice().reverse().find(e => e.lat != null && e.lng != null)
    return {
      serviceId,
      status: track.status,
      lastEventAt: last?.timestamp,
      lastLocation: lastLocation ? { lat: lastLocation.lat!, lng: lastLocation.lng! } : undefined,
      notas: track.events.filter(e => e.type === 'Nota').length,
      incidencias: track.events.filter(e => e.type === 'Incidencia').length,
    }
  })
}

export function listEvents(serviceId: string): TrackingEvent[] {
  const s = load()
  return s.byService[serviceId]?.events || []
}

export function addEvent(
  serviceId: string,
  event: Omit<TrackingEvent, 'id' | 'timestamp' | 'serviceId'> & Partial<Pick<TrackingEvent, 'id' | 'timestamp' | 'serviceId'>>
) {
  const s = load()
  if (!s.byService[serviceId]) {
    s.byService[serviceId] = { events: [], status: 'Pendiente', updatedAt: nowIso() }
  }
  const ev: TrackingEvent = {
    id: event.id || crypto.randomUUID(),
    timestamp: event.timestamp || nowIso(),
    serviceId,
    type: event.type!,
    status: event.status,
    message: event.message,
    lat: event.lat,
    lng: event.lng,
    user: event.user,
  }
  s.byService[serviceId].events.push(ev)
  if (event.status) s.byService[serviceId].status = event.status
  s.byService[serviceId].updatedAt = nowIso()
  s.updatedAt = nowIso()
  save(s)
  return ev
}

export function setStatus(serviceId: string, status: MonitoreoStatus) {
  const s = load()
  if (!s.byService[serviceId]) {
    s.byService[serviceId] = { events: [], status, updatedAt: nowIso() }
  } else {
    s.byService[serviceId].status = status
    s.byService[serviceId].updatedAt = nowIso()
  }
  s.updatedAt = nowIso()
  save(s)
}

export function removeServiceTracking(serviceId: string) {
  const s = load()
  if (s.byService[serviceId]) {
    delete s.byService[serviceId]
    s.updatedAt = nowIso()
    save(s)
  }
}