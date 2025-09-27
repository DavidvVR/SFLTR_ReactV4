import { getSupabase } from '@/lib/supabase'

export interface Tarifa {
  id: string
  clienteId: string
  tipoUnidad: string
  estadoOrigen: string
  estadoDestino: string
  tarifa: number
}

export interface ClienteRemote {
  id: string
  nombre: string
  rfc?: string | null
  tarifas?: Tarifa[]
}

export async function listClientesConTarifas(): Promise<ClienteRemote[]> {
  const s = getSupabase()
  // Trae clientes + (opcional) JSON tarifas para fallback
  const { data: clientes, error: cErr } = await s
    .from('clientes')
    .select('id, nombre, rfc, tarifas')
    .order('nombre', { ascending: true })
  if (cErr) throw cErr
  if (!clientes?.length) return []

  const ids = clientes.map(c => c.id)
  const { data: tarifas, error: tErr } = await s
    .from('cliente_tarifas')
    .select('cliente_id, tipo_unidad, estado_origen, estado_destino, tarifa')
    .in('cliente_id', ids)
  if (tErr) throw tErr

  const byCliente = new Map<string, Tarifa[]>()
  ;(tarifas || []).forEach(t => {
    const arr = byCliente.get(t.cliente_id) || []
    arr.push({
      id: crypto.randomUUID(),
      clienteId: t.cliente_id,
      tipoUnidad: t.tipo_unidad,
      estadoOrigen: t.estado_origen,
      estadoDestino: t.estado_destino,
      tarifa: Number(t.tarifa),
    })
    byCliente.set(t.cliente_id, arr)
  })

  return clientes.map(c => {
    let tArr = byCliente.get(c.id)
    if ((!tArr || tArr.length === 0) && Array.isArray(c.tarifas)) {
      tArr = c.tarifas.map((t: any) => ({
        id: crypto.randomUUID(),
        clienteId: c.id,
        tipoUnidad: t.tipoUnidad ?? t.tipo_unidad ?? '',
        estadoOrigen: t.estadoOrigen ?? t.estado_origen ?? '',
        estadoDestino: t.estadoDestino ?? t.estado_destino ?? '',
        tarifa: Number(t.tarifa ?? 0),
      })).filter(x => x.tipoUnidad)
    }
    return {
      id: c.id,
      nombre: c.nombre,
      rfc: c.rfc,
      tarifas: tArr || [],
    }
  })
}