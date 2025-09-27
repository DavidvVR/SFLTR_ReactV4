import { getSupabase } from '@/lib/supabase'

export interface OperadorRemote {
  id?: string
  nombre: string
  numLicencia: string
  venceLicencia?: string | null
  expMedico?: string | null
  venceAptoMedico?: string | null
  rfc?: string | null
  curp: string
  telefono?: string | null
  nss?: string | null
  estatus: 'Activo' | 'Baja' | 'Suspendido'
  licenciaUrl?: string | null
  licenciaNombre?: string | null
  aptoMedicoUrl?: string | null
  aptoMedicoNombre?: string | null
  created_at?: string
  updated_at?: string
}

function fromDb(r: any): OperadorRemote {
  return {
    id: r.id,
    nombre: r.nombre,
    numLicencia: r.num_licencia,
    venceLicencia: r.vence_licencia,
    expMedico: r.exp_medico,
    venceAptoMedico: r.vence_apto_medico,
    rfc: r.rfc,
    curp: r.curp,
    telefono: r.telefono,
    nss: r.nss,
    estatus: r.estatus,
    licenciaUrl: r.licencia_url,
    licenciaNombre: r.licencia_nombre,
    aptoMedicoUrl: r.apto_medico_url,
    aptoMedicoNombre: r.apto_medico_nombre,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function toDb(o: OperadorRemote) {
  return {
    id: o.id || undefined,
    nombre: o.nombre,
    num_licencia: o.numLicencia,
    vence_licencia: o.venceLicencia || null,
    exp_medico: o.expMedico || null,
    vence_apto_medico: o.venceAptoMedico || null,
    rfc: o.rfc || null,
    curp: o.curp,
    telefono: o.telefono || null,
    nss: o.nss || null,
    estatus: o.estatus || 'Activo',
    licencia_url: o.licenciaUrl || null,
    licencia_nombre: o.licenciaNombre || null,
    apto_medico_url: o.aptoMedicoUrl || null,
    apto_medico_nombre: o.aptoMedicoNombre || null,
  }
}

export async function listOperadores(): Promise<OperadorRemote[]> {
  const s = getSupabase()
  const { data, error } = await s.from('ltr_operadores').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function searchOperadores(q: string): Promise<OperadorRemote[]> {
  const term = q.trim()
  if (!term) return listOperadores()
  const s = getSupabase()
  const pattern = `%${term}%`
  const { data, error } = await s
    .from('ltr_operadores')
    .select('*')
    .or([
      `id.ilike.${pattern}`,
      `nombre.ilike.${pattern}`,
      `num_licencia.ilike.${pattern}`,
      `curp.ilike.${pattern}`,
      `rfc.ilike.${pattern}`
    ].join(','))
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromDb)
}

export async function addOperador(o: OperadorRemote): Promise<string> {
  const s = getSupabase()
  const { data, error } = await s.from('ltr_operadores').insert(toDb(o)).select('id').single()
  if (error) throw error
  return data!.id as string
}

export async function updateOperador(id: string, o: OperadorRemote): Promise<void> {
  const s = getSupabase()
  const row = toDb(o)
  delete (row as any).id
  const { error } = await s.from('ltr_operadores').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteOperador(id: string): Promise<void> {
  const s = getSupabase()
  const { error } = await s.from('ltr_operadores').delete().eq('id', id)
  if (error) throw error
}

export async function importOperadores(rows: OperadorRemote[]) {
  if (!rows.length) return
  const s = getSupabase()
  const payload = rows.map(r => {
    const m = toDb(r)
    if (!r.id) delete (m as any).id
    return m
  })
  const { error } = await s.from('ltr_operadores').insert(payload)
  if (error) throw error
}

export function subscribeOperadores(onChange: () => void) {
  const s = getSupabase()
  const ch = s
    .channel('realtime-ltr-operadores')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ltr_operadores' }, () => {
      onChange()
    })
    .subscribe()
  return () => { s.removeChannel(ch) }
}