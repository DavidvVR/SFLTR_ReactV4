import { getSupabase } from '@/lib/supabase'

export async function testClientesQuery() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('id,nombre,rfc,created_at')
    .limit(5)
  return { data, error }
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as any).testClientesQuery = testClientesQuery
}