import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, FileDown, FileUp } from 'lucide-react'
import PermisionarioModal, { type PermisionarioForm } from '@/features/permisionarios/permisionario-modal'
import PermisionariosTable from '@/features/permisionarios/components/PermisionariosTable'

import {
  listPermisionarios,
  searchPermisionarios,
  addPermisionario,
  updatePermisionario,
  removePermisionario
} from '@/features/permisionarios/permisionariosSupabase'

import { getXLSX } from '@/utils/xlsx'

export const Route = createFileRoute('/dashboard/permisionarios')({
  component: PermisionariosPage,
})

function PermisionariosPage() {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PermisionarioForm | null>(null)
  const [rows, setRows] = React.useState<PermisionarioForm[]>([])
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const searchAbort = React.useRef<AbortController | null>(null)
  const importFileRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try { setRows(await listPermisionarios()) } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Debounce búsqueda
  React.useEffect(() => {
    const id = setTimeout(() => {
      void doSearch(q)
    }, 350)
    return () => clearTimeout(id)
  }, [q])

  async function doSearch(term: string) {
    if (!term.trim()) return load()
    setLoading(true)
    try {
      setRows(await searchPermisionarios(term))
    } catch (e) {
      console.error('Error buscando', e)
    } finally {
      setLoading(false)
    }
  }

  function newPermisionario() {
    setEditing(null)
    setOpen(true)
  }

  function handleEdit(row: PermisionarioForm) {
    setEditing(row)
    setOpen(true)
  }

  async function handleSave(p: PermisionarioForm) {
    try {
      if (p.id) await updatePermisionario(p.id, p)
      else await addPermisionario(p)
      await load()
      setOpen(false); setEditing(null)
    } catch (e) {
      console.error(e)
      alert('Error guardando (ver consola).')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar permisionario?')) return
    try {
      await removePermisionario(id)
      await load()
    } catch (e) {
      console.error(e)
      alert('Error eliminando.')
    }
  }

  const handleExportAll = async () => {
    const XLSX = await getXLSX()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Permisionarios')
    XLSX.writeFile(wb, 'permisionarios.xlsx')
  }

  // (Opcional) quitar import local legacy; si quieres importar a Supabase, habría que mapear y llamar addPermisionario por fila.

  return (
    <div className="p-6">
      <div className="rounded-xl border bg-muted/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Permisionarios</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por ID / RFC / Razón social / Alias"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-80"
            />
            <input
              type="file"
              ref={importFileRef}
              className="hidden"
              accept=".xlsx,.xls"
              // onChange={handleFileImport} // Deshabilitado hasta migrar import a Supabase
              disabled
            />
            <Button variant="outline" className="gap-2" disabled>
              <FileUp className="h-4 w-4" />
              Importar (deshabilitado)
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportAll} disabled={loading || rows.length===0}>
              <FileDown className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="gap-2" onClick={newPermisionario}>
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="p-4">
          {loading && <div className="text-sm text-muted-foreground mb-2">Cargando...</div>}
          <PermisionariosTable
            rows={rows as any}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground mt-4">Sin resultados.</div>
          )}
        </div>
      </div>

      <PermisionarioModal
        open={open}
        onOpenChange={setOpen}
        initialValue={editing ?? undefined}
        onSave={handleSave}
      />
    </div>
  )
}

export default PermisionariosPage
