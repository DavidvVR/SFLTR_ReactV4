// src/features/clientes/clientesLocal.ts

/** Clave en localStorage */
const STORAGE_KEY = "sr_clientes";

/** Tipos base */
export type Estatus = "Activo" | "Inactivo";

export interface Contacto {
  nombre?: string;
  email?: string;
  tel?: string;
}

export type DocKey =
  | "acta"
  | "poder"
  | "compDomicilio"
  | "csf"
  | "ine"
  | "contrato";

export type DocsState = Record<DocKey, boolean>;

export interface Tarifa {
  id: string;
  estadoOrigen: string;
  municipioOrigen?: string;
  estadoDestino: string;
  municipioDestino?: string;
  tipoUnidad: string;
  diasCredito?: number;
  kmRecorrer?: number;
  tarifa: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  estatus: Estatus;
  rfc?: string;
  direccion?: string;
  contactos?: {
    operaciones?: Contacto;
    administracion?: Contacto;
    comercial?: Contacto;
  };
  docs?: DocsState;
  tarifas?: Tarifa[];
  comentarios?: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Para crear: no pasas id/fechas */
export type NewCliente = Omit<Cliente, "id" | "createdAt" | "updatedAt">;

/** Carga segura desde localStorage */
function load(): Cliente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Cliente[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Guarda lista completa */
function save(list: Cliente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Genera el siguiente ID secuencial con prefijo LTR-CL-01, 02, 03... */
function nextClienteId(existing: Cliente[] = load()): string {
  const prefijo = "LTR-CL-";
  const maxNum = existing.reduce((max, c) => {
    const m = (c.id || "").match(/^LTR-CL-(\d+)$/);
    const n = m ? parseInt(m[1], 10) : 0;
    return n > max ? n : max;
  }, 0);
  const consecutivo = String(maxNum + 1).padStart(2, "0");
  return `${prefijo}${consecutivo}`;
}

/** Validación mínima */
function validateNew(input: Partial<NewCliente>): asserts input is NewCliente {
  if (!input || typeof input !== "object") throw new Error("Datos inválidos");
  if (!input.nombre || !input.estatus) {
    throw new Error('Campos requeridos: "nombre", "estatus"');
  }
}

/** API pública */

export function listClientes(): Cliente[] {
  return load();
}

export function getCliente(id: string): Cliente | undefined {
  return load().find((c) => c.id === id);
}

export function addCliente(input: Partial<NewCliente>): Cliente {
  validateNew(input);
  const list = load(); // leer una vez para calcular ID y luego guardar
  const now = new Date().toISOString();
  const nuevo: Cliente = {
    id: nextClienteId(list),
    nombre: input.nombre!,
    estatus: input.estatus!,
    rfc: input.rfc?.toUpperCase(),
    direccion: input.direccion,
    contactos: input.contactos ?? {},
    docs: input.docs ?? ({} as DocsState),
    tarifas: input.tarifas ?? [],
    comentarios: input.comentarios ?? "",
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(nuevo);
  save(list);
  return nuevo;
}

export function updateCliente(
  id: string,
  patch: Partial<Omit<Cliente, "id" | "createdAt">>
): Cliente {
  const list = load();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Cliente no encontrado");
  const prev = list[idx];
  const next: Cliente = {
    ...prev,
    ...patch,
    rfc: patch.rfc ? patch.rfc.toUpperCase() : prev.rfc,
    contactos: {
      ...prev.contactos,
      ...(patch.contactos ?? {}),
    },
    docs: { ...(prev.docs ?? {}), ...(patch.docs ?? {}) } as DocsState,
    tarifas: patch.tarifas ?? prev.tarifas,
    comentarios: patch.comentarios ?? prev.comentarios,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  save(list);
  return next;
}

export function removeCliente(id: string): boolean {
  const list = load();
  const next = list.filter((c) => c.id !== id);
  const changed = next.length !== list.length;
  if (changed) save(next);
  return changed;
}

export function clearAllClientes() {
  save([]);
}

export function setAllClientes(list: Cliente[]) {
  save(list);
}

/** Búsqueda simple por nombre/RFC */
export function searchClientes(q: string): Cliente[] {
  const s = (q ?? "").trim().toLowerCase();
  if (!s) return listClientes();
  return load().filter((c) => {
    const nombre = c.nombre?.toLowerCase() ?? "";
    const rfc = c.rfc?.toLowerCase() ?? "";
    return nombre.includes(s) || rfc.includes(s);
  });
}

/** SQL Schema for clientes table */
export const SQL_SCHEMA = `
create table if not exists clientes (
  id text primary key,
  nombre text not null,
  estatus text not null check (estatus in ('Activo','Inactivo')),
  rfc text,
  direccion text,
  contactos jsonb,
  docs jsonb,
  tarifas jsonb,
  comentarios text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- RLS (para desarrollo; ajusta en producción)
alter table clientes enable row level security;

create policy "anon select clientes"
  on clientes for select
  using (true);

create policy "anon insert clientes"
  on clientes for insert
  with check (true);

create policy "anon update clientes"
  on clientes for update
  using (true);

create policy "anon delete clientes"
  on clientes for delete
  using (true);
`;
