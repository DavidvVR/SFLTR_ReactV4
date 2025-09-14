import initialData from '@/data/ltr-operadores.json'

// El tipo debe ser exportado desde operadores-view.tsx o un archivo de tipos compartido
export type OperadorLTR = {
  id: string
  nombre: string
  numLicencia?: string
  venceLicencia?: string
  expMedico?: string
  venceAptoMedico?: string
  rfc?: string
  curp?: string
  telefono?: string
  nss?: string
  estatus: 'Activo' | 'Inactivo' | 'Capacitación' | 'Baja'
  licenciaNombre?: string
  aptoMedicoNombre?: string
}

const STORAGE_KEY = 'SFLTR_LTR_OPERADORES'

// Lee todos los operadores desde localStorage
export function readAll(): OperadorLTR[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (storedData) {
      return JSON.parse(storedData)
    }
    // Si no hay nada, usa los datos del JSON como base inicial
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
    return initialData as OperadorLTR[]
  } catch (error) {
    console.error('Error al leer los operadores de localStorage:', error)
    return []
  }
}

// Escribe un array completo de operadores a localStorage
function writeAll(operadores: OperadorLTR[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operadores))
}

// Inserta o actualiza un operador
export function upsert(operador: OperadorLTR): void {
  const operadores = readAll()
  const index = operadores.findIndex(o => o.id === operador.id)
  if (index > -1) {
    operadores[index] = operador // Actualizar
  } else {
    operadores.push(operador) // Insertar
  }
  writeAll(operadores)
}

// Elimina un operador por su ID
export function remove(id: string): void {
  let operadores = readAll()
  operadores = operadores.filter(o => o.id !== id)
  writeAll(operadores)
}