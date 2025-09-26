import { getSupabase } from '@/lib/supabase'
import type { PermisionarioForm, Unidad, Operador } from '@/features/permisionarios/permisionario-modal'

export interface PermisionarioPersistInput extends PermisionarioForm {
  domCalle?: string
  domNum?: string
  domColonia?: string
  domMunicipio?: string
  domEstado?: string
  domCP?: string
}

function toRow(p: Partial<PermisionarioForm>) {
  return {
    id: p.id || undefined, // lo genera el trigger si no viene
    razon_social: p.razonSocial,
    alias: p.alias ?? null,
    rfc: p.rfc?.toUpperCase() ?? null,
    estatus: p.estatus,
    domicilio: p.domicilio ?? null,
    op_nombre: p.opNombre ?? null, op_email: p.opEmail ?? null, op_tel: p.opTel ?? null,
    ad_nombre: p.adNombre ?? null, ad_email: p.adEmail ?? null, ad_tel: p.adTel ?? null,
    co_nombre: p.coNombre ?? null, co_email: p.coEmail ?? null, co_tel: p.coTel ?? null,
    docs: p.docs ?? [],
    updated_at: new Date().toISOString(),
  }
}

function toParentRow(p: any) {
  return {
    id: p.id || undefined,
    razon_social: p.razonSocial,
    rfc: p.rfc.toUpperCase(),
    alias: p.alias || null,
    estatus: p.estatus,
    calle: p.domCalle || '',
    num_extint: p.domNum || '',
    colonia: p.domColonia || '',
    municipio: p.domMunicipio || '',
    estado: p.domEstado || '',
    cp: p.domCP || '00000',
    op_nombre: p.opNombre || '',
    op_email: p.opEmail || '',
    op_tel: p.opTel || '',
    ad_nombre: p.adNombre || '',
    ad_email: p.adEmail || '',
    ad_tel: p.adTel || '',
    co_nombre: p.coNombre || '',
    co_email: p.coEmail || '',
    co_tel: p.coTel || '',
    acta_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'acta')?.url || null,
    poder_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'poder')?.url || null,
    comprobante_domicilio_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'comprobanteDomicilio')?.url || null,
    constancia_fiscal_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'constanciaFiscal')?.url || null,
    ine_rep_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'ineRep')?.url || null,
    contrato_url: p.docs?.find((d: { key: string; url: string }) => d.key === 'contrato')?.url || null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
}

function unitToRow(u: Unidad, permisionarioId: string) {
  return {
    id: u.id, permisionario_id: permisionarioId,
    tarjeta_url: u.tarjetaUrl ?? null, tarjeta_nombre: u.tarjetaNombre ?? null,
    placas: u.placas, eco: u.eco ?? null, tipo: u.tipo,
    vence_poliza: u.vencePoliza ?? null,
    aseguradora: u.aseguradora ?? null,
    num_poliza: u.numPoliza ?? null,
    poliza_url: u.polizaUrl ?? null, poliza_nombre: u.polizaNombre ?? null,
    marca: u.marca ?? null,
    anio: typeof u.anio === 'number' ? u.anio : null,
    permiso_sct: u.permisoSCT ?? null,
    updated_at: new Date().toISOString(),
  }
}

function opToRow(op: Operador, permisionarioId: string) {
  return {
    id: op.id, permisionario_id: permisionarioId,
    nombre: op.nombre,
    num_licencia: op.numLicencia ?? null,
    licencia_url: op.licenciaUrl ?? null, licencia_nombre: op.licenciaNombre ?? null,
    vence_licencia: op.venceLicencia ?? null,
    apto_medico_url: op.aptoMedicoUrl ?? null, apto_medico_nombre: op.aptoMedicoNombre ?? null,
    vence_apto_medico: op.venceAptoMedico ?? null,
    rfc: op.rfc ?? null,
    updated_at: new Date().toISOString(),
  }
}

export async function listPermisionarios(): Promise<PermisionarioForm[]> {
  const supabase = getSupabase()
  const { data: parents, error } = await supabase
    .from('permisionarios').select('*').order('created_at', { ascending: false })
  if (error) throw error
  const ids = (parents ?? []).map(p => p.id)
  if (ids.length === 0) return []

  const [{ data: units }, { data: ops }] = await Promise.all([
    supabase.from('permisionario_unidades').select('*').in('permisionario_id', ids),
    supabase.from('permisionario_operadores').select('*').in('permisionario_id', ids),
  ])

  const unitsByPid = new Map<string, any[]>()
  const opsByPid = new Map<string, any[]>()
  ;(units ?? []).forEach(u => {
    const arr = unitsByPid.get(u.permisionario_id) ?? []
    arr.push(u)
    unitsByPid.set(u.permisionario_id, arr)
  })
  ;(ops ?? []).forEach(o => {
    const arr = opsByPid.get(o.permisionario_id) ?? []
    arr.push(o)
    opsByPid.set(o.permisionario_id, arr)
  })

  return (parents ?? []).map((p: any) => ({
    id: p.id,
    razonSocial: p.razon_social,
    alias: p.alias ?? '',
    rfc: p.rfc ?? '',
    estatus: p.estatus,
    domicilio: p.domicilio ?? '',
    opNombre: p.op_nombre ?? '', opEmail: p.op_email ?? '', opTel: p.op_tel ?? '',
    adNombre: p.ad_nombre ?? '', adEmail: p.ad_email ?? '', adTel: p.ad_tel ?? '',
    coNombre: p.co_nombre ?? '', coEmail: p.co_email ?? '', coTel: p.co_tel ?? '',
    docs: p.docs ?? [],
    unidades: (unitsByPid.get(p.id) ?? []).map((u: any): Unidad => ({
      id: u.id,
      tarjetaUrl: u.tarjeta_url ?? undefined, tarjetaNombre: u.tarjeta_nombre ?? undefined,
      placas: u.placas, eco: u.eco ?? undefined, tipo: u.tipo,
      vencePoliza: u.vence_poliza ?? undefined,
      aseguradora: u.aseguradora ?? undefined,
      numPoliza: u.num_poliza ?? undefined,
      polizaUrl: u.poliza_url ?? undefined, polizaNombre: u.poliza_nombre ?? undefined,
      marca: u.marca ?? undefined,
      anio: u.anio ?? '',
      permisoSCT: u.permiso_sct ?? undefined,
    })),
    operadores: (opsByPid.get(p.id) ?? []).map((o: any): Operador => ({
      id: o.id, nombre: o.nombre,
      numLicencia: o.num_licencia ?? undefined,
      licenciaUrl: o.licencia_url ?? undefined, licenciaNombre: o.licencia_nombre ?? undefined,
      venceLicencia: o.vence_licencia ?? undefined,
      aptoMedicoUrl: o.apto_medico_url ?? undefined, aptoMedicoNombre: o.apto_medico_nombre ?? undefined,
      venceAptoMedico: o.vence_apto_medico ?? undefined,
      rfc: o.rfc ?? undefined,
    })),
  }))
}

export async function addPermisionario(p: any) {
  const s = getSupabase()
  const { data, error } = await s.from('permisionarios').insert(toParentRow(p)).select('id').single()
  if (error) throw error
  const id = data!.id
  // hijos...
  return id
}

export async function updatePermisionario(id: string, p: any) {
  const s = getSupabase()
  const row = toParentRow(p)
  delete (row as any).created_at
  const { error } = await s.from('permisionarios').update(row).eq('id', id)
  if (error) throw error
  // hijos...
}

export async function removePermisionario(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('permisionarios').delete().eq('id', id)
  if (error) throw error
}