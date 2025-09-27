import { getSupabase } from '@/lib/supabase'

// Interfaz alineada a la BD
export interface UnidadLTRRemote {
  id?: string
  placas: string
  eco?: string
  tipo: string
  disponibilidad: 'Disponible' | 'En Mtto' | 'Baja'
  marca?: string
  anio?: number | null
  aseguradora?: string | null
  vencePoliza?: string | null   // UI (date ISO / yyyy-mm-dd)
  permisoSCT?: string | null
  noPoliza?: string | null
  polizaUrl?: string | null
  polizaNombre?: string | null
  tarjetaUrl?: string | null
  tarjetaNombre?: string | null
  created_at?: string
  updated_at?: string
}

function mapFromDb(r: any): UnidadLTRRemote {
  return {
    id: r.id,
    placas: r.placas,
    eco: r.eco ?? undefined,
    tipo: r.tipo,
    disponibilidad: r.disponibilidad,
    marca: r.marca ?? undefined,
    anio: r.anio ?? undefined,
    aseguradora: r.aseguradora ?? undefined,
    vencePoliza: r.vence_poliza ?? undefined,
    permisoSCT: r.permiso_sct ?? undefined,
    noPoliza: r.no_poliza ?? undefined,
    polizaUrl: r.poliza_url ?? undefined,
    polizaNombre: r.poliza_nombre ?? undefined,
    tarjetaUrl: r.tarjeta_url ?? undefined,
    tarjetaNombre: r.tarjeta_nombre ?? undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function mapToDb(u: UnidadLTRRemote) {
  return {
    id: u.id || undefined, // trigger genera si no se envía
    placas: u.placas,
    eco: u.eco || null,
    tipo: u.tipo,
    disponibilidad: u.disponibilidad || 'Disponible',
    marca: u.marca || null,
    anio: (typeof u.anio === 'number' ? u.anio : null),
    aseguradora: u.aseguradora || null,
    vence_poliza: u.vencePoliza || null,
    permiso_sct: u.permisoSCT || null,
    no_poliza: u.noPoliza || null,
    poliza_url: u.polizaUrl || null,
    poliza_nombre: u.polizaNombre || null,
    tarjeta_url: u.tarjetaUrl || null,
    tarjeta_nombre: u.tarjetaNombre || null,
  }
}

export async function listUnidadesLTR(): Promise<UnidadLTRRemote[]> {
  const s = getSupabase()
  const { data, error } = await s
    .from('ltr_unidades')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapFromDb)
}

export async function searchUnidadesLTR(q: string, tipoFilter?: string): Promise<UnidadLTRRemote[]> {
  const term = q.trim()
  const s = getSupabase()
  let query = s.from('ltr_unidades').select('*').order('created_at', { ascending: false })

  if (term) {
    const pattern = `%${term}%`
    query = query.or([
      `placas.ilike.${pattern}`,
      `eco.ilike.${pattern}`,
      `tipo.ilike.${pattern}`,
      `no_poliza.ilike.${pattern}`
    ].join(','))
  }
  if (tipoFilter) {
    query = query.eq('tipo', tipoFilter)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapFromDb)
}

export async function addUnidadLTR(u: UnidadLTRRemote): Promise<string> {
  const s = getSupabase()
  const { data, error } = await s
    .from('ltr_unidades')
    .insert(mapToDb(u))
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

export async function updateUnidadLTR(id: string, u: UnidadLTRRemote): Promise<void> {
  const s = getSupabase()
  const row = mapToDb(u)
  delete (row as any).id
  const { error } = await s
    .from('ltr_unidades')
    .update(row)
    .eq('id', id)
  if (error) throw error
}

export async function deleteUnidadLTR(id: string): Promise<void> {
  const s = getSupabase()
  const { error } = await s.from('ltr_unidades').delete().eq('id', id)
  if (error) throw error
}

export async function importUnidadesLTR(rows: UnidadLTRRemote[]) {
  if (!rows.length) return
  const s = getSupabase()
  // Limpia IDs vacíos para permitir trigger
  const payload = rows.map(r => {
    const mapped = mapToDb(r)
    if (!r.id) delete (mapped as any).id
    return mapped
  })
  const { error } = await s.from('ltr_unidades').insert(payload)
  if (error) throw error
}

export function subscribeUnidadesLTR(onChange: () => void) {
  const s = getSupabase()
  const channel = s
    .channel('realtime-ltr-unidades')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ltr_unidades' }, () => {
      onChange()
    })
    .subscribe()
  return () => { s.removeChannel(channel) }
}