import * as React from 'react'
import { migrateClientesLocalToSupabase } from '@/features/clientes/migrateLocalToSupabase'

export function RunClientesMigration() {
  React.useEffect(() => {
    migrateClientesLocalToSupabase()
      .then((res) => console.log('[Migración clientes]', res))
      .catch(console.error)
  }, [])
  return null
}