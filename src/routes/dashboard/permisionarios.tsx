import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, FileDown, FileUp } from 'lucide-react'

import PermisionarioModal, { type PermisionarioForm } from '@/features/permisionarios/permisionario-modal'
import PermisionariosTable from '@/features/permisionarios/components/PermisionariosTable'

import {
  readAll,
  upsert,
  search as searchLocal,
  nextId,
  removeById,
  type Permisionario,
  type DocRecord,
} from '@/features/permisionarios/permisionarioslocal'

import { listPermisionarios, addPermisionario, updatePermisionario, removePermisionario } from '@/features/permisionarios/permisionariosSupabase'

import { getXLSX } from '@/utils/xlsx'

import * as XLSX from 'xlsx';

export const Route = createFileRoute('/dashboard/permisionarios')({
  component: PermisionariosPage,
})

function PermisionariosPage() {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PermisionarioForm | null>(null)
  const [rows, setRows] = React.useState<Permisionario[]>([])
  const [q, setQ] = React.useState('')
  const importFileRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    load()
  }, [])

  async function load() {
    try { setRows(await listPermisionarios()) } catch (e) { console.error(e) }
  }

  function refresh(query = q) {
    setRows(query ? searchLocal(query) : readAll())
  }

  const handleExportAll = async () => {
    const XLSX = await getXLSX()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Permisionarios')
    XLSX.writeFile(wb, 'permisionarios.xlsx')
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const XLSX = await getXLSX()
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })

      const sheetName = wb.Sheets['Permisionarios'] ? 'Permisionarios' : wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      if (!ws) { alert('No se encontró una hoja válida en el XLSX.'); return }

      const data = XLSX.utils.sheet_to_json<any>(ws)

      const existing = readAll()
      const byRFC = new Map(existing
        .filter(r => !!r.rfc)
        .map(r => [r.rfc.trim().toUpperCase(), r] as const))

      const pick = (row: any, keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && `${row[k]}`.trim() !== '') return row[k]
        }
        return undefined
      }

      let created = 0, updated = 0
      for (const row of data) {
        const rfc = (pick(row, ['RFC', 'Rfc', 'rfc']) ?? '').toString().trim().toUpperCase()
        const razonSocial = (pick(row, ['Razón Social', 'Razon Social', 'Nombre / Razón Social', 'Nombre', 'Razon']) ?? '').toString().trim()
        if (!rfc || !razonSocial) continue

        const alias = pick(row, ['Alias', 'alias']) ?? ''
        const estatus: 'Activo' | 'Inactivo' = ((pick(row, ['Estatus', 'Status']) ?? 'Activo') === 'Inactivo') ? 'Inactivo' : 'Activo'
        const domicilio = pick(row, ['Domicilio', 'Dirección', 'Direccion']) ?? ''

        const payload: Permisionario = {
          id: '',
          rfc,
          razonSocial,
          alias,
          estatus,
          domicilio,
          opNombre: pick(row, ['Op Nombre']) ?? '',
          opEmail: pick(row, ['Op Email']) ?? '',
          opTel: pick(row, ['Op Tel']) ?? '',
          adNombre: pick(row, ['Ad Nombre']) ?? '',
          adEmail: pick(row, ['Ad Email']) ?? '',
          adTel: pick(row, ['Ad Tel']) ?? '',
          coNombre: pick(row, ['Co Nombre']) ?? '',
          coEmail: pick(row, ['Co Email']) ?? '',
          coTel: pick(row, ['Co Tel']) ?? '',
          docs: [],
          unidades: [],
          operadores: [],
        }

        const found = byRFC.get(rfc)
        if (found) {
          upsert({
            ...found,
            ...payload,
            id: found.id,
            docs: found.docs ?? [],
            unidades: found.unidades ?? [],
            operadores: found.operadores ?? [],
          })
          updated++
        } else {
          upsert({
            ...payload,
            id: nextId(),
          })
          created++
        }
      }

      refresh()
      alert(`Importación completada.\nActualizados: ${updated}\nCreados: ${created}`)
    } catch (err) {
      console.error('Error al importar XLSX (permisionarios):', err)
      alert('Hubo un problema al procesar el archivo.')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  function newPermisionario() {
    setEditing(null)         // IMPORTANTE: null/undefined => modo creación
    setOpen(true)
  }

  function handleEdit(row: Permisionario) {
    setEditing(row)
    setOpen(true)
  }

  async function handleSave(p: any) {
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

  function handleDelete(id: string) {
    removeById(id)
    refresh()
  }

  return (
    <div className="p-6">
      <div className="rounded-xl border bg-muted/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Permisionarios</h1>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar por ID / RFC / Razón social / Alias"
              value={q}
              onChange={(e) => {
                const v = e.target.value
                setQ(v)
                setRows(v ? searchLocal(v) : readAll())
              }}
              className="w-80"
            />
            <input
              type="file"
              ref={importFileRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <Button variant="outline" className="gap-2" onClick={() => importFileRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportAll}>
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
          <PermisionariosTable
            rows={rows}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
