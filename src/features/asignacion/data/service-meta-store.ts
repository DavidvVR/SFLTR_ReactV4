const META_KEY = 'SFLTR_SERVICIO_META_V1'

export interface ServiceMeta {
  clienteRFC?: string
  clienteDomicilio?: string
  // datos de unidad
  unidadMarca?: string
  unidadAnio?: number | string
  unidadAseguradora?: string
  unidadNoPoliza?: string
  unidadPermisoSCT?: string
  // datos de operador
  operadorNoLicencia?: string
  operadorRFC?: string
}

interface MetaStore {
  byId: Record<string, ServiceMeta>
  updatedAt: string
}

function loadStore(): MetaStore {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '') as MetaStore
  } catch {
    return { byId: {}, updatedAt: new Date().toISOString() }
  }
}

function saveStore(store: MetaStore) {
  localStorage.setItem(META_KEY, JSON.stringify(store))
}

export function setServiceMeta(id: string, meta: ServiceMeta) {
  const store = loadStore()
  store.byId[id] = { ...(store.byId[id] || {}), ...meta }
  store.updatedAt = new Date().toISOString()
  saveStore(store)
}

export function getServiceMeta(id: string): ServiceMeta | undefined {
  const store = loadStore()
  return store.byId[id]
}

export function listAllServiceMeta(): Array<{ id: string; meta: ServiceMeta }> {
  const store = loadStore()
  return Object.entries(store.byId).map(([id, meta]) => ({ id, meta }))
}

export function removeServiceMeta(id: string) {
  const store = loadStore()
  if (store.byId[id]) {
    delete store.byId[id]
    store.updatedAt = new Date().toISOString()
    saveStore(store)
  }
}