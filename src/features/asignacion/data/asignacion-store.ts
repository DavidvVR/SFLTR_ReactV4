import seedAsignaciones from '@/data/asignacion.json'

export type Direccion = {
  calle?: string
  numeroExterior?: string
  numeroInterior?: string
  colonia?: string
  municipio?: string
  estado?: string
  pais?: string
  codigoPostal?: string
}

export type ClienteInfo = {
  nombreRazonSocial?: string
  rfc?: string
  domicilio?: Direccion
}

export type PermisionarioInfo = {
  nombreRazonSocial?: string
  rfc?: string
  domicilio?: Direccion
}

export type TarifaExtra = {
  concepto: string
  monto: number
}

export type Tarifas = {
  moneda?: 'MXN' | 'USD' | string
  tarifaBase?: number
  iva?: number
  retencion?: number
  extras?: TarifaExtra[]
  total?: number
}

export type UnidadAsignada = {
  tipoFlota?: string
  tipoUnidad?: string
  eco?: string
  placa?: string
  remolque?: string
}

export type OperadorAsignado = {
  nombre?: string
  licencia?: string
  telefono?: string
}

export type OrigenAsignacion =
  | { tipo: 'LTR' }
  | { tipo: 'PERMISIONARIO'; permisionario: PermisionarioInfo }

export type AsignacionRecord = {
  id: string
  createdAt: string
  cliente?: ClienteInfo
  tarifas?: Tarifas
  origen: OrigenAsignacion
  unidades?: UnidadAsignada[]
  operadores?: OperadorAsignado[]
  // Datos operativos adicionales
  ruta?: string
  destino?: string
  citaCarga?: string // ISO
  comentarios?: string
}

type StoreShape = {
  byId: Record<string, AsignacionRecord>
  updatedAt: string
}

const LS_KEY = 'SFLTR_ASIGNACIONES_V1'

export function deriveOrigenFromId(id: string): OrigenAsignacion {
  // Ajusta esta lógica si tienes otros prefijos
  if (id?.toUpperCase().startsWith('LTR-')) return { tipo: 'LTR' }
  return { tipo: 'PERMISIONARIO', permisionario: {} }
}

function loadStore(): StoreShape {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      // Semilla inicial desde el JSON (solo la primera vez)
      const seededArray = (Array.isArray(seedAsignaciones) ? seedAsignaciones : []) as Partial<AsignacionRecord>[]
      const byId = Object.fromEntries(
        seededArray
          .filter(r => r && r.id)
          .map(r => [r.id as string, { ...r, createdAt: r.createdAt ?? new Date().toISOString() } as AsignacionRecord]),
      )
      return { byId, updatedAt: new Date().toISOString() }
    }
    const parsed = JSON.parse(raw) as StoreShape
    return parsed?.byId ? parsed : { byId: {}, updatedAt: new Date().toISOString() }
  } catch {
    return { byId: {}, updatedAt: new Date().toISOString() }
  }
}

function saveStore(store: StoreShape) {
  localStorage.setItem(LS_KEY, JSON.stringify(store))
}

export function upsertAsignacion(record: AsignacionRecord) {
  const store = loadStore()
  store.byId[record.id] = record
  store.updatedAt = new Date().toISOString()
  saveStore(store)
}

export function getAsignacionById(id: string): AsignacionRecord | undefined {
  return loadStore().byId[id]
}

export function listAsignaciones(): AsignacionRecord[] {
  const s = loadStore()
  return Object.values(s.byId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function removeAsignacion(id: string) {
  const store = loadStore()
  if (store.byId[id]) {
    delete store.byId[id]
    store.updatedAt = new Date().toISOString()
    saveStore(store)
  }
}