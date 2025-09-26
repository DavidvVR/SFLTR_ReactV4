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
    id: u.id,
    permisionario_id: permisionarioId,
    tarjeta_url: u.tarjetaUrl || null,
    tarjeta_nombre: u.tarjetaNombre || null,
    placas: u.placas,
    eco: u.eco || null,
    tipo: u.tipo,
    num_poliza: u.numPoliza || null,
    aseguradora: u.aseguradora || null,
    vence_poliza: u.vencePoliza || null,
    marca: u.marca || null,
    anio: typeof u.anio === 'number' ? u.anio : null,
    permiso_sct: u.permisoSCT || null,
    poliza_url: u.polizaUrl || null,
    poliza_nombre: u.polizaNombre || null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
}

function opToRow(o: Operador, permisionarioId: string) {
  return {
    id: o.id,
    permisionario_id: permisionarioId,
    nombre: o.nombre,
    num_licencia: o.numLicencia || null,
    licencia_url: o.licenciaUrl || null,
    licencia_nombre: o.licenciaNombre || null,
    vence_licencia: o.venceLicencia || null,
    apto_medico_url: o.aptoMedicoUrl || null,
    apto_medico_nombre: o.aptoMedicoNombre || null,
    vence_apto_medico: o.venceAptoMedico || null,
    rfc: o.rfc || null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
}

function buildDocsFromColumns(p: any) {
  return [
    { key: 'acta', label: 'Acta Constitutiva', url: p.acta_url || undefined },
    { key: 'poder', label: 'Poder Rep. Legal', url: p.poder_url || undefined },
    { key: 'comprobanteDomicilio', label: 'Comprobante de Domicilio', url: p.comprobante_domicilio_url || undefined },
    { key: 'constanciaFiscal', label: 'Constancia de Situación Fiscal', url: p.constancia_fiscal_url || undefined },
    { key: 'ineRep', label: 'INE Rep. Legal', url: p.ine_rep_url || undefined },
    { key: 'contrato', label: 'Contrato', url: p.contrato_url || undefined },
  ]
}

function ensureUnitId(u: Unidad): Unidad {
  return { ...u, id: u.id || crypto.randomUUID() }
}
function ensureOpId(o: Operador): Operador {
  return { ...o, id: o.id || crypto.randomUUID() }
}

export async function listPermisionarios(): Promise<PermisionarioForm[]> {
  const supabase = getSupabase()
  const { data: parents, error } = await supabase
    .from('permisionarios')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!parents?.length) return []

  const ids = parents.map(p => p.id)
  const [{ data: units, error: uErr }, { data: ops, error: oErr }] = await Promise.all([
    supabase.from('permisionario_unidades').select('*').in('permisionario_id', ids),
    supabase.from('permisionario_operadores').select('*').in('permisionario_id', ids),
  ])
  if (uErr) throw uErr
  if (oErr) throw oErr

  const unitsBy = new Map<string, any[]>()
  const opsBy = new Map<string, any[]>()
  ;(units ?? []).forEach(u => {
    const arr = unitsBy.get(u.permisionario_id) || []
    arr.push(u); unitsBy.set(u.permisionario_id, arr)
  })
  ;(ops ?? []).forEach(o => {
    const arr = opsBy.get(o.permisionario_id) || []
    arr.push(o); opsBy.set(o.permisionario_id, arr)
  })

  return parents.map((p: any) => ({
    id: p.id,
    razonSocial: p.razon_social,
    alias: p.alias ?? '',
    rfc: p.rfc ?? '',
    estatus: p.estatus,
    domicilio: '', // si aún deseas mostrar compuesto, constrúyelo aquí si guardas campos separados
    opNombre: p.op_nombre ?? '', opEmail: p.op_email ?? '', opTel: p.op_tel ?? '',
    adNombre: p.ad_nombre ?? '', adEmail: p.ad_email ?? '', adTel: p.ad_tel ?? '',
    coNombre: p.co_nombre ?? '', coEmail: p.co_email ?? '', coTel: p.co_tel ?? '',
    docs: buildDocsFromColumns(p),
    unidades: (unitsBy.get(p.id) ?? []).map((u: any): Unidad => ({
      id: u.id,
      tarjetaUrl: u.tarjeta_url || undefined,
      tarjetaNombre: u.tarjeta_nombre || undefined,
      placas: u.placas,
      eco: u.eco || undefined,
      tipo: u.tipo,
      numPoliza: u.num_poliza || undefined,
      aseguradora: u.aseguradora || undefined,
      vencePoliza: u.vence_poliza || undefined,
      marca: u.marca || undefined,
      anio: u.anio ?? '',
      permisoSCT: u.permiso_sct || undefined,
      polizaUrl: u.poliza_url || undefined,
      polizaNombre: u.poliza_nombre || undefined,
    })),
    operadores: (opsBy.get(p.id) ?? []).map((o: any): Operador => ({
      id: o.id,
      nombre: o.nombre,
      numLicencia: o.num_licencia || undefined,
      licenciaUrl: o.licencia_url || undefined,
      licenciaNombre: o.licencia_nombre || undefined,
      venceLicencia: o.vence_licencia || undefined,
      aptoMedicoUrl: o.apto_medico_url || undefined,
      aptoMedicoNombre: o.apto_medico_nombre || undefined,
      venceAptoMedico: o.vence_apto_medico || undefined,
      rfc: o.rfc || undefined,
    })),
  }))
}

export async function addPermisionario(p: any) {
  const s = getSupabase()
  const { data, error } = await s.from('permisionarios').insert(toParentRow(p)).select('id').single()
  if (error) throw error
  const id = data!.id as string

  // Insertar unidades
  if (p.unidades?.length) {
    const rows = p.unidades
      .map(ensureUnitId)
      .map((u: Unidad) => unitToRow(u, id))
    const { error: ue } = await s.from('permisionario_unidades').upsert(rows, { onConflict: 'id' })
    if (ue) throw ue
  }

  // Insertar operadores
  if (p.operadores?.length) {
    const rows = p.operadores
      .map(ensureOpId)
      .map((o: Operador) => opToRow(o, id))
    const { error: oe } = await s.from('permisionario_operadores').upsert(rows, { onConflict: 'id' })
    if (oe) throw oe
  }

  return id
}

export async function updatePermisionario(id: string, p: any) {
  const s = getSupabase()
  const row = toParentRow(p)
  delete (row as any).created_at
  const { error } = await s.from('permisionarios').update(row).eq('id', id)
  if (error) throw error

  // Reemplazar unidades
  if (p.unidades) {
    const { error: delU } = await s.from('permisionario_unidades').delete().eq('permisionario_id', id)
    if (delU) throw delU
    if (p.unidades.length) {
      const rows = p.unidades
        .map(ensureUnitId)
        .map((u: Unidad) => unitToRow(u, id))
      const { error: insU } = await s.from('permisionario_unidades').insert(rows)
      if (insU) throw insU
    }
  }

  // Reemplazar operadores
  if (p.operadores) {
    const { error: delO } = await s.from('permisionario_operadores').delete().eq('permisionario_id', id)
    if (delO) throw delO
    if (p.operadores.length) {
      const rows = p.operadores
        .map(ensureOpId)
        .map((o: Operador) => opToRow(o, id))
      const { error: insO } = await s.from('permisionario_operadores').insert(rows)
      if (insO) throw insO
    }
  }
}

export async function removePermisionario(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('permisionarios').delete().eq('id', id)
  if (error) throw error
}