import initialData from '@/data/permisionarios.json'
import { type PermisionarioForm } from '../permisionario-modal'

const STORAGE_KEY = 'SFLTR_PERMISIONARIOS'

// Lee todos los permisionarios desde localStorage
export function readAll(): PermisionarioForm[] {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (storedData) {
      return JSON.parse(storedData)
    }
    // Si no hay nada, usa los datos del JSON como base inicial
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
    return initialData as PermisionarioForm[]
  } catch (error) {
    console.error('Error al leer los permisionarios de localStorage:', error)
    return []
  }
}


//


// Escribe un array completo de permisionarios a localStorage
function writeAll(data: PermisionarioForm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2))
}

// Inserta o actualiza un permisionario
export function upsert(permisionario: PermisionarioForm): void {
  const allData = readAll()
  const index = allData.findIndex(p => p.id === permisionario.id)
  
  if (index > -1) {
    allData[index] = permisionario // Actualizar
  } else {
    allData.push(permisionario) // Insertar
  }
  
  writeAll(allData)
}

// Elimina un permisionario por su ID
export function remove(id: string): void {
  let allData = readAll()
  allData = allData.filter(p => p.id !== id)
  writeAll(allData)
}

// Genera un nuevo ID único
export function getNextId(): string {
  const allData = readAll()
  const maxNum = allData.reduce((max, p) => {
    const match = (p.id || '').match(/^LTR-PR-(\d+)$/)
    const num = match ? parseInt(match[1], 10) : 0
    return num > max ? num : max
  }, 0)
  return `LTR-PR-${String(maxNum + 1).padStart(3, '0')}`
}