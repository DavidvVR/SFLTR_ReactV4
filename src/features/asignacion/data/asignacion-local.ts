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

// Funciones placeholder para interactuar con los datos.
// La lógica completa se agregará más adelante.

export function readAll(): Asignacion[] {
  console.log("Leyendo todas las asignaciones...");
  return [];
}

export function upsert(asignacion: Asignacion): void {
  console.log("Guardando asignación:", asignacion.id);
}

export function remove(id: string): void {
  console.log("Eliminando asignación:", id);
}