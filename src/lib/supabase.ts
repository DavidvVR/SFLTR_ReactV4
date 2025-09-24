// src/lib/supabase.ts
// Cliente único de Supabase, seguro para SSR y compatible con Vite/TanStack.
// Si generas tipos con el CLI de Supabase, descomenta la línea con <Database>.

// import type { Database } from '@/lib/database.types'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Evita persistir sesión cuando se ejecuta en el servidor
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

// Singleton (se reutiliza en el cliente y evita múltiples instancias en HMR)
let client: SupabaseClient /*<Database>*/ | null = null

const isValidUrl = (u?: string) => !!u && /^https?:\/\//i.test(u)

/**
 * Obtiene una instancia singleton del cliente de Supabase.
 * Lanza error si faltan las variables de entorno requeridas.
 */
export function getSupabase(): SupabaseClient /*<Database>*/ {
  if (!client) {
    if (!isValidUrl(SUPABASE_URL) || !SUPABASE_ANON_KEY) {
      throw new Error('Configura VITE_SUPABASE_URL (http/https) y VITE_SUPABASE_ANON_KEY en tu .env')
    }

    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
      },
      global: {
        headers: { 'x-application-name': 'SFLTR_ReactV4' },
      },
    })
  }
  return client // <-- importante
}

/**
 * (Opcional) Si alguna vez necesitas forzar recrear el cliente
 * durante HMR o pruebas, puedes llamar a resetSupabaseClient().
 */
export function resetSupabaseClient() {
  client = null
}

// Limpia la instancia al hacer HMR en Vite para evitar estados colgados
if (import.meta && (import.meta as any).hot) {
  ;(import.meta as any).hot.dispose(() => {
    client = null
  })
}

