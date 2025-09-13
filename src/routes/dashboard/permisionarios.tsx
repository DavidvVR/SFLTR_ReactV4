// src/routes/dashboard/permisionarios.tsx
import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import PermisionarioModal from '@/features/permisionarios/permisionario-modal'
import PermisionariosTable from '@/features/permisionarios/components/PermisionariosTable'

import {
  readAll,
  upsert,
  search as searchLocal,
  nextId,
  type Permisionario,
  type DocRecord,
} from '@/features/permisionarios/permisionarioslocal'

export const Route = createFileRoute('/dashboard/permisionarios')({
  component: PermisionariosPage,
})

function PermisionariosPage() {
  const [open, setOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Permisionario | null>(null)
  const [rows, setRows] = React.useState<Permisionario[]>([])
  const [q, setQ] = React.useState('')

  React.useEffect(() => {
    setRows(readAll())
  }, [])

  function refresh(query = q) {
    setRows(query ? searchLocal(query) : readAll())
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

  // Recibe TODO el form del modal (incluye docs)
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
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Permisionarios</h1>
        <div className="flex gap-2">
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
          <Button onClick={handleNew}>Nuevo Permisionario</Button>
        </div>
      </div>

      <PermisionariosTable rows={rows} onEdit={handleEdit} />

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
              }
            : undefined
        }
        onSave={handleSave}
      />
    </div>
  )
}
