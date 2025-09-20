// src/routes/dashboard/permisionarios.tsx
import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, FileDown, FileUp } from 'lucide-react' // <-- 1. Importar FileUp

import PermisionarioModal from '@/features/permisionarios/permisionario-modal'
import PermisionariosTable from '@/features/permisionarios/components/PermisionariosTable'

import {
  readAll,
  upsert,
  search as searchLocal,
  nextId,
  removeById, // Importar la función de eliminar
  type Permisionario,
  type DocRecord,
} from '@/features/permisionarios/permisionarioslocal'

// Importa xlsx solo en cliente cuando se necesite
async function loadXLSX() {
  // Entrada ESM que evita cpexcel en SSR
  const xlsx = await import('xlsx/xlsx.mjs')
  // No uses set_cptable ni imports a 'xlsx/dist/cpexcel.js'
  return xlsx
}

export const Route = createFileRoute('/dashboard/permisionarios')({
  component: PermisionariosPage,
})

function PermisionariosPage() {
  const [open, setOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Permisionario | null>(null)
  const [rows, setRows] = React.useState<Permisionario[]>([])
  const [q, setQ] = React.useState('')
  const importFileRef = React.useRef<HTMLInputElement | null>(null) // <-- 2. Ref para input de archivo

  React.useEffect(() => {
    setRows(readAll())
  }, [])

  function refresh(query = q) {
    setRows(query ? searchLocal(query) : readAll())
  }

  // Ejemplo: exportar archivo
  const handleExportAll = async () => {
    const XLSX = await loadXLSX()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Permisionarios')
    XLSX.writeFile(wb, 'permisionarios.xlsx')
  }

  // Ejemplo: importar archivo
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSX = await loadXLSX()
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)
    // ...procesar rows...
  }

  function handleNew() {
    setEditItem({
      id: nextId(),
      rfc: '',
      razonSocial: '',
      alias: '',
      estatus: 'Activo',
    })
    setOpen(true)
  }

  function handleEdit(row: Permisionario) {
    setEditItem(row)
    setOpen(true)
  }

  function handleDelete(id: string) {
    removeById(id)
    refresh()
  }

  function handleSave(data: {
    id: string
    rfc: string
    razonSocial: string
    alias: string
    estatus: 'Activo' | 'Inactivo'
    domicilio: string
    opNombre: string;  opEmail: string;  opTel: string
    adNombre: string;  adEmail: string;  adTel: string
    coNombre: string;  coEmail: string;  coTel: string
    docs: DocRecord[]
    unidades: any[] // Agregar unidades
    operadores: any[] // Agregar operadores
  }) {
    const merged: Permisionario = {
      ...(editItem ?? {}),
      ...data,
      id: data.id || nextId(),
      rfc: (data.rfc || '').toUpperCase(),
    }
    upsert(merged)
    setOpen(false)
    setEditItem(null)
    refresh()
  }

  return (
    <div className="p-6">
      <div className="rounded-xl border bg-muted/30">
        {/* Encabezado dentro del marco gris */}
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
            <Button className="gap-2" onClick={handleNew}>
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Contenido dentro del marco gris */}
        <div className="p-4">
          <PermisionariosTable
            rows={rows}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Modales e inputs fuera del marco visual */}
      <PermisionarioModal
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditItem(null)
        }}
        initialValue={
          editItem
            ? {
                id: editItem.id,
                rfc: editItem.rfc,
                razonSocial: editItem.razonSocial,
                alias: editItem.alias ?? '',
                estatus: editItem.estatus ?? 'Activo',
                domicilio: editItem.domicilio ?? '',
                opNombre: editItem.opNombre ?? '',
                opEmail: editItem.opEmail ?? '',
                opTel: editItem.opTel ?? '',
                adNombre: editItem.adNombre ?? '',
                adEmail: editItem.adEmail ?? '',
                adTel: editItem.adTel ?? '',
                coNombre: editItem.coNombre ?? '',
                coEmail: editItem.coEmail ?? '',
                coTel: editItem.coTel ?? '',
                docs: editItem.docs ?? [],
                unidades: editItem.unidades ?? [],
                operadores: editItem.operadores ?? [],
              }
            : undefined
        }
        onSave={handleSave}
      />
    </div>
  )
}
