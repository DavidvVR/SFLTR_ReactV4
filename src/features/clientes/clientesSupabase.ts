import { getSupabase } from '@/lib/supabase'
import type { Cliente, Tarifa as TarifaModel, DocKey, NewCliente } from '@/features/clientes/clientesLocal'

function generateClienteId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }
}

/**
 * Crea un cliente en Supabase.
 * Devuelve el registro insertado con los campos tal como quedaron en la BD.
 */
export async function addCliente(input: Partial<NewCliente>): Promise<Cliente> {
  if (!input?.nombre || !input?.estatus) throw new Error('Campos requeridos: nombre, estatus')
  const supabase = getSupabase()
  const now = new Date().toISOString()

  const row = {
    id: generateClienteId(),
    nombre: input.nombre,
    estatus: input.estatus,
    rfc: input.rfc?.toUpperCase() ?? null,
    direccion: input.direccion ?? null,
    contactos: input.contactos ?? {},
    docs: input.docs ?? {},
    tarifas: input.tarifas ?? [],
    comentarios: input.comentarios ?? '',
    created_at: now,         // snake_case
    updated_at: now,         // snake_case
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error
  return data as Cliente
}

/**
 * Actualiza un cliente por id.
 * Solo envía los campos proporcionados; uppercase para RFC.
 */
export async function updateCliente(
  id: string,
  patch: Partial<Omit<Cliente, 'id' | 'createdAt'>>
): Promise<Cliente> {
  const supabase = getSupabase()
  const row: any = {
    ...patch,
    rfc: patch.rfc ? patch.rfc.toUpperCase() : undefined,
    updated_at: new Date().toISOString(), // snake_case
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Cliente
}

/** Utilidades opcionales */
export async function listClientes(): Promise<Cliente[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false }) // usar snake_case
  if (error) throw error
  return (data ?? []) as Cliente[]
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Cliente | null
}

export async function removeCliente(id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error, count } = await supabase
    .from('clientes')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw error
  return (count ?? 0) > 0
}