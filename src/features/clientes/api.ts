import { getSupabase } from '@/lib/supabase'
import type { Cliente } from './types'

export async function listarClientes(): Promise<Cliente[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function crearCliente(c: Cliente) {
  const supabase = getSupabase()
  const { error } = await supabase.from('clientes').insert(c)
  if (error) throw error
}

export async function borrarCliente(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
