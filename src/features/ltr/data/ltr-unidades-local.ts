import initialData from '@/data/ltr-unidades.json'

export type UnidadLTR = {
  id: string
  placas: string
  eco?: string
  tipo: string
  disponibilidad: 'Disponible' | 'En Mtto'
  tarjetaUrl?: string
  tarjetaNombre?: string
  aseguradora?: string
  vencePoliza?: string
  polizaUrl?: string
  polizaNombre?: string
  marca?: string
  anio?: number | ''
  permisoSCT?: string
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
  const unidades = readAll()
  const index = unidades.findIndex(u => u.id === unidad.id)
  if (index > -1) {
    unidades[index] = unidad // Actualizar
  } else {
    unidades.push(unidad) // Insertar
  }
  writeAll(unidades)
}

// Elimina una unidad por su ID
export function remove(id: string): void {
  let unidades = readAll()
  unidades = unidades.filter(u => u.id !== id)
  writeAll(unidades)
}