import initialData from '@/data/ltr-unidades.json'

export interface UnidadLTR {
  id: string
  placas: string
  tipo: string
  eco?: string
  disponibilidad: 'Disponible' | 'En Mtto'
  marca?: string
  anio?: number | string
  aseguradora?: string
  vencePoliza?: string
  permisoSCT?: string
  noPoliza?: string // NUEVO
  tarjetaUrl?: string
  tarjetaNombre?: string
  polizaUrl?: string
  polizaNombre?: string
}

const STORAGE_KEY = 'SFLTR_LTR_UNIDADES'

// Lee todas las unidades desde localStorage
export function readAll(): UnidadLTR[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (storedData) {
      return JSON.parse(storedData)
    }
    // Si no hay nada, usa los datos del JSON como base inicial
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
    return initialData as UnidadLTR[]
  } catch (error) {
    console.error('Error al leer las unidades de localStorage:', error)
    return []
  }
}

// Escribe un array completo de unidades a localStorage
function writeAll(unidades: UnidadLTR[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unidades))
}

// Inserta o actualiza una unidad
export function upsert(unidad: UnidadLTR): void {
  const all = readAll()
  const idx = all.findIndex(u => u.id === unidad.id)
  if (idx >= 0) {
    // merge para no perder noPoliza (u otros campos nuevos)
    all[idx] = { ...all[idx], ...unidad }
  } else {
    all.push(unidad)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

// Elimina una unidad por su ID
export function remove(id: string): void {
  let unidades = readAll()
  unidades = unidades.filter(u => u.id !== id)
  writeAll(unidades)
}