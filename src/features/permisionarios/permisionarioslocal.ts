// src/features/permisionarios/permisionarioslocal.ts

// ===== Tipos =====
export type DocKey =
  | 'acta'
  | 'poder'
  | 'comprobanteDomicilio'
  | 'constanciaFiscal'
  | 'ineRep'
  | 'contrato'

export type DocRecord = {
  key: DocKey
  label: string
  url?: string      // Idealmente URL permanente
  fileName?: string // Opcional
}

export type Unidad = {
  id: string
  tarjetaNombre?: string
  tarjetaUrl?: string
  placas: string
  eco?: string
  tipo: string
  vencePoliza?: string
  aseguradora?: string
  polizaNombre?: string
  polizaUrl?: string
  marca?: string
  anio?: number | ''
  permisoSCT?: string
}

export type Permisionario = {
  id: string
  rfc: string
  razonSocial: string
  alias?: string
  estatus?: 'Activo' | 'Inactivo'
  domicilio?: string
  // Contactos
  opNombre?: string;  opEmail?: string;  opTel?: string
  adNombre?: string;  adEmail?: string;  adTel?: string
  coNombre?: string;  coEmail?: string;  coTel?: string
  // Documentación
  docs?: DocRecord[]
  // Unidades
  unidades?: Unidad[]
}

const LS_KEY = 'sr_permisionarios'

// ===== Utils =====
function isBlobUrl(u?: string) {
  if (!u) return false
  try {
    const url = new URL(u)
    return url.protocol === 'blob:'
  } catch {
    return false
  }
}

/** Limpia docs dejando solo URLs permanentes */
function sanitizeDocs(docs?: DocRecord[]): DocRecord[] | undefined {
  if (!docs?.length) return undefined
  return docs.map((d) => {
    if (!d.url || isBlobUrl(d.url)) return { ...d, url: undefined, fileName: undefined }
    return { ...d }
  })
}

/** Limpia unidades: descarta blob: en tarjetaUrl/polizaUrl */
function sanitizeUnidades(unidades?: Unidad[]): Unidad[] | undefined {
  if (!unidades?.length) return undefined
  return unidades.map((u) => ({
    ...u,
    tarjetaUrl: isBlobUrl(u.tarjetaUrl) ? undefined : u.tarjetaUrl,
    tarjetaNombre: isBlobUrl(u.tarjetaUrl) ? undefined : u.tarjetaNombre,
    polizaUrl: isBlobUrl(u.polizaUrl) ? undefined : u.polizaUrl,
    polizaNombre: isBlobUrl(u.polizaUrl) ? undefined : u.polizaNombre,
  }))
}

// ===== CRUD =====
export function readAll(): Permisionario[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const list = raw ? (JSON.parse(raw) as Permisionario[]) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function writeAll(list: Permisionario[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function upsert(item: Permisionario) {
  const toSave: Permisionario = {
    ...item,
    rfc: (item.rfc || '').toUpperCase(),
    docs: sanitizeDocs(item.docs),
    unidades: sanitizeUnidades(item.unidades),
  }

  const list = readAll()
  const i = list.findIndex((x) => x.id === toSave.id)
  if (i >= 0) list[i] = { ...list[i], ...toSave }
  else list.push(toSave)
  writeAll(list)
}

export function removeById(id: string) {
  const list = readAll().filter((x) => x.id !== id)
  writeAll(list)
}

/** ID consecutivo con prefijo 'LTR-PR-' */
export function nextId(prefijo = 'LTR-PR-'): string {
  const list = readAll()
  const max = list.reduce((m, c) => {
    const re = new RegExp('^' + prefijo.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&') + '(\\d+)$')
    const mm = (c.id || '').match(re)
    const n = mm ? parseInt(mm[1], 10) : 0
    return n > m ? n : m
  }, 0)
  return `${prefijo}${String(max + 1).padStart(4, '0')}`
}

/** Búsqueda simple por ID / RFC / Razón social / Alias */
export function search(query: string): Permisionario[] {
  const q = query.trim().toLowerCase()
  if (!q) return readAll()
  return readAll().filter((p) =>
    [p.id, p.rfc, p.razonSocial, p.alias]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  )
}
