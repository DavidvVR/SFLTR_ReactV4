// src/routes/dashboard/permisionarios.tsx
import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import * as XLSX from 'xlsx'
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

  function handleExportAll() {
    const allPermisionarios = readAll()
    if (allPermisionarios.length === 0) {
      alert('No hay permisionarios para exportar.')
      return
    }

    const generalData = allPermisionarios.map(p => ({
      'ID': p.id,
      'RFC': p.rfc,
      'Razón Social': p.razonSocial,
      'Alias': p.alias,
      'Estatus': p.estatus,
      'Domicilio': p.domicilio,
      'Contacto Op.': `${p.opNombre} | ${p.opEmail} | ${p.opTel}`,
      'Contacto Adm.': `${p.adNombre} | ${p.adEmail} | ${p.adTel}`,
      'Contacto Com.': `${p.coNombre} | ${p.coEmail} | ${p.coTel}`,
    }))

    const unidadesData = allPermisionarios.flatMap(p =>
      (p.unidades || []).map(u => ({
        'Permisionario RFC': p.rfc,
        'Unidad ID': u.id,
        'Placas': u.placas,
        'Eco': u.eco,
        'Tipo': u.tipo,
        'Marca': u.marca,
        'Año': u.anio,
        'Aseguradora': u.aseguradora,
        'Venc. Póliza': u.vencePoliza,
        'Permiso SCT': u.permisoSCT,
      }))
    )

    const operadoresData = allPermisionarios.flatMap(p =>
      (p.operadores || []).map(op => ({
        'Permisionario RFC': p.rfc,
        'Operador ID': op.id,
        'Nombre': op.nombre,
        'RFC': op.rfc,
        'Num. Licencia': op.numLicencia,
        'Venc. Licencia': op.venceLicencia,
        'Venc. Apto Médico': op.venceAptoMedico,
      }))
    )

    const wsGeneral = XLSX.utils.json_to_sheet(generalData)
    const wsUnidades = XLSX.utils.json_to_sheet(unidadesData)
    const wsOperadores = XLSX.utils.json_to_sheet(operadoresData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, wsGeneral, 'Permisionarios')
    XLSX.utils.book_append_sheet(workbook, wsUnidades, 'Unidades')
    XLSX.utils.book_append_sheet(workbook, wsOperadores, 'Operadores')

    XLSX.writeFile(workbook, `Reporte_Permisionarios_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        const permisionariosSheet = workbook.Sheets['Permisionarios']
        const unidadesSheet = workbook.Sheets['Unidades']
        const operadoresSheet = workbook.Sheets['Operadores']

        if (!permisionariosSheet) {
          alert("El archivo debe contener una hoja llamada 'Permisionarios'.")
          return
        }

        const importedPermisionarios = XLSX.utils.sheet_to_json<any>(permisionariosSheet)
        const importedUnidades = unidadesSheet ? XLSX.utils.sheet_to_json<any>(unidadesSheet) : []
        const importedOperadores = operadoresSheet ? XLSX.utils.sheet_to_json<any>(operadoresSheet) : []

        let count = 0
        for (const pRow of importedPermisionarios) {
          const rfc = pRow['RFC']?.trim().toUpperCase()
          if (!rfc || !pRow['Razón Social']) {
            console.warn('Omitiendo fila de permisionario por falta de RFC o Razón Social:', pRow)
            continue
          }

          const [opNombre, opEmail, opTel] = (pRow['Contacto Op.'] || '||').split('|').map(s => s.trim())
          const [adNombre, adEmail, adTel] = (pRow['Contacto Adm.'] || '||').split('|').map(s => s.trim())
          const [coNombre, coEmail, coTel] = (pRow['Contacto Com.'] || '||').split('|').map(s => s.trim())

          const unidades = importedUnidades
            .filter(u => u['Permisionario RFC']?.trim().toUpperCase() === rfc)
            .map(u => ({
              id: u['Unidad ID'] || `U-${Date.now()}`,
              placas: u['Placas'],
              eco: u['Eco'],
              tipo: u['Tipo'],
              marca: u['Marca'],
              anio: u['Año'],
              aseguradora: u['Aseguradora'],
              vencePoliza: u['Venc. Póliza'],
              permisoSCT: u['Permiso SCT'],
            }))

          const operadores = importedOperadores
            .filter(op => op['Permisionario RFC']?.trim().toUpperCase() === rfc)
            .map(op => ({
              id: op['Operador ID'] || `OP-${Date.now()}`,
              nombre: op['Nombre'],
              rfc: op['RFC'],
              numLicencia: op['Num. Licencia'],
              venceLicencia: op['Venc. Licencia'],
              venceAptoMedico: op['Venc. Apto Médico'],
            }))

          const permisionario: Permisionario = {
            id: pRow['ID'] || nextId(),
            rfc,
            razonSocial: pRow['Razón Social'],
            alias: pRow['Alias'],
            estatus: pRow['Estatus'] === 'Inactivo' ? 'Inactivo' : 'Activo',
            domicilio: pRow['Domicilio'],
            opNombre, opEmail, opTel,
            adNombre, adEmail, adTel,
            coNombre, coEmail, coTel,
            unidades,
            operadores,
            docs: [],
          }
          upsert(permisionario)
          count++
        }

        alert(`${count} permisionarios importados/actualizados correctamente.`)
        refresh()
      } catch (error) {
        console.error('Error al importar el archivo:', error)
        alert('Ocurrió un error al procesar el archivo. Revisa la consola para más detalles.')
      } finally {
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
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
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <PermisionariosTable 
        rows={rows} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

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
                unidades: editItem.unidades ?? [], // Agregar unidades
                operadores: editItem.operadores ?? [], // Agregar operadores
              }
            : undefined
        }
        onSave={handleSave}
      />
    </div>
  )
}
