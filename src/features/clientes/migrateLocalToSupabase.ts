import { getSupabase } from '@/lib/supabase'
import { listClientes, type Cliente } from '@/features/clientes/clientesLocal'

type MigSummary = {
  ok: boolean
  total: number
  affected: number
  errors: { message: string; details?: any }[]
}

/**
 * Sube clientes de localStorage a Supabase.
 * - Usa upsert por id (requiere PK/UNIQUE en id).
 * - Devuelve resumen con contadores y errores (si los hay).
 */
export async function migrateClientesLocalToSupabase(): Promise<MigSummary> {
  const supabase = getSupabase()
  const data: Cliente[] = listClientes()

  if (!Array.isArray(data) || data.length === 0) {
    return { ok: true, total: 0, affected: 0, errors: [] }
  }

  const chunkSize = 500
  const chunks: Cliente[][] = []
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize))
  }

  const errors: MigSummary['errors'] = []
  let affected = 0

  for (const chunk of chunks) {
    // Normaliza por si acaso
    const rows = chunk.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      estatus: c.estatus,
      rfc: c.rfc ? c.rfc.toUpperCase() : null,
      direccion: c.direccion ?? null,
      contactos: c.contactos ?? {},
      docs: c.docs ?? {},
      tarifas: c.tarifas ?? [],
      comentarios: c.comentarios ?? '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    const { error, count } = await supabase
      .from('clientes')
      .upsert(rows, { onConflict: 'id', count: 'exact' })

    if (error) {
      errors.push({ message: error.message, details: error })
    } else if (count) {
      affected += count
    }
  }

  return { ok: errors.length === 0, total: data.length, affected, errors }
}

// Exponer en ventana para ejecutarlo desde la consola en desarrollo
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).migrateClientesLocalToSupabase = migrateClientesLocalToSupabase
}