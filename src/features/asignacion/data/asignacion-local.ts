// Definición del tipo de dato para una Asignación
export type Asignacion = {
  id: string;
  unidadId: string;
  operadorId: string;
  fechaAsignacion: string;
  origen: string;
  destino: string;
  estatus: string;
};

const STORAGE_KEY = 'SFLTR_ASIGNACIONES_SIMPLE';

function load(): Asignacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Asignacion[]) : [];
  } catch (e) {
    console.error('Error leyendo asignaciones:', e);
    return [];
  }
}

function save(all: Asignacion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error guardando asignaciones:', e);
  }
}

// Lee todas las asignaciones desde localStorage
export function readAll(): Asignacion[] {
  return load();
}

// Inserta o actualiza una asignación por id
export function upsert(asignacion: Asignacion): void {
  const all = load();
  const idx = all.findIndex(a => a.id === asignacion.id);
  if (idx >= 0) {
    all[idx] = asignacion;
  } else {
    all.unshift(asignacion);
  }
  save(all);
}

// Elimina una asignación por su ID
export function remove(id: string): void {
  const all = load().filter(a => a.id !== id);
  save(all);
}