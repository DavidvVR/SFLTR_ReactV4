import { getSupabase } from '@/lib/supabase'
import { setAllClientes, type Cliente } from '@/features/clientes/clientesLocal'

export async function syncSupabaseToLocal() {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('clientes').select('*')
  if (error) throw error
  setAllClientes((data ?? []) as Cliente[])
}