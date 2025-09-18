import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download } from 'lucide-react'
import { NuevoServicioSheet } from '@/features/asignacion/components/nuevo-servicio-sheet'
import { ServiciosTable, type Servicio } from '@/features/asignacion/components/ServiciosTable'
import { ConfirmacionServicioDialog } from '@/features/asignacion/components/ConfirmacionServicioDialog'
import { upsertAsignacion, listAsignaciones, type AsignacionRecord, removeAsignacion } from '@/features/asignacion/data/asignacion-store'
import { setServiceMeta, removeServiceMeta } from '@/features/asignacion/data/service-meta-store'
import { readAll as readAllLtrUnits } from '@/features/ltr/data/ltr-unidades-local'

// Si tienes un módulo de operadores LTR:
let readAllLtrOperators: undefined | (() => any[])
try {
  // evita romper si no existe el módulo
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  readAllLtrOperators = require('@/features/ltr/data/ltr-operadores-local').readAll
} catch { readAllLtrOperators = undefined }

// --- Generación de IDs de Servicio ---
const SERVICE_COUNTER_KEY = 'SFLTR_SERVICE_COUNTER'

function generateNextServiceId(): string {
  const currentYear = new Date().getFullYear().toString().slice(-2)
  let counter = { year: currentYear, lastNumber: 0 }
  try {
    const storedCounter = localStorage.getItem(SERVICE_COUNTER_KEY)
    if (storedCounter) counter = JSON.parse(storedCounter)
  } catch (e) {
    console.error('Error al leer el contador de servicios:', e)
  }
  if (counter.year !== currentYear) {
    counter.year = currentYear
    counter.lastNumber = 0
  }
  const newNumber = counter.lastNumber + 1
  counter.lastNumber = newNumber
  localStorage.setItem(SERVICE_COUNTER_KEY, JSON.stringify(counter))
  const formattedNumber = String(newNumber).padStart(3, '0')
  return `LTR-${currentYear}-${formattedNumber}`
}

// Claves donde están tus clientes (igual que en el modal)
const CLIENT_STORAGE_KEYS = ['sr_clientes', 'sr_clientes_registrados', 'srClientes']

function _readLS<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[] } catch { return [] }
}

function extractAddress(c: any): string {
  // Intenta resolver un domicilio legible a partir de varias posibles propiedades
  const directo = c.domicilio || c.direccion || c.direccionFiscal || c.address || ''
  if (typeof directo === 'string' && directo.trim()) return directo.trim()

  const parts = [
    c.calle,
    c.numero || c.noExterior || c.noExt,
    c.colonia || c.fraccionamiento,
    c.municipio || c.alcaldia || c.delegacion || c.ciudad,
    c.estado,
    c.cp || c.codigoPostal,
    c.pais,
  ].filter(Boolean)
  return parts.join(', ')
}

function normalizeClient(c: any) {
  return {
    nombre: c.nombre || c.razonSocial || c.nombreRazon || c.nombre_comercial || '',
    rfc: c.rfc || c.RFC || '',
    domicilio: extractAddress(c),
  }
}

function findClientMetaByName(nombre: string): { rfc?: string; domicilio?: string } {
  const name = (nombre || '').trim().toLowerCase()
  for (const key of CLIENT_STORAGE_KEYS) {
    const data = _readLS<any>(key)
    if (Array.isArray(data) && data.length) {
      const norm = data.map(normalizeClient)
      const found = norm.find(x => x.nombre.toLowerCase() === name)
      if (found) return { rfc: found.rfc, domicilio: found.domicilio }
    }
  }
  return {}
}

// Helpers para leer unidades de permisionarios (si existen en localStorage)
function readPermisionariosFromLS(): any[] {
  const keys = ['sr_permisionarios', 'permisionarios', 'permisionarios_v1']
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr
    } catch {}
  }
  return []
}

function findUnitDetails(eco?: string, placa?: string) {
  // 1) LTR
  try {
    const ltr = readAllLtrUnits() as any[]
    const found = ltr.find(u => (eco && u.eco === eco) || (placa && u.placas === placa))
    if (found) {
      return {
        marca: found.marca,
        anio: found.anio,
        aseguradora: found.aseguradora,
        noPoliza: found.noPoliza,
        permisoSCT: found.permisoSCT,
      }
    }
  } catch {}

  // 2) Permisionarios
  try {
    const per = readPermisionariosFromLS()
    for (const p of per) {
      const units: any[] = Array.isArray(p?.unidades) ? p.unidades : []
      const f = units.find(u => (eco && u.eco === eco) || (placa && (u.placas === placa || u.placa === placa)))
      if (f) {
        return {
          marca: f.marca,
          anio: f.anio,
          aseguradora: f.aseguradora,
          noPoliza: f.noPoliza,
          permisoSCT: f.permisoSCT,
        }
      }
    }
  } catch {}

  return {}
}

function findOperatorDetails(nombreOperador?: string): { noLicencia?: string; rfc?: string } {
  const name = (nombreOperador || '').trim().toLowerCase()
  if (!name) return {}

  // 1) LTR operadores
  try {
    const ops = typeof readAllLtrOperators === 'function' ? readAllLtrOperators() : []
    const found = (ops as any[]).find(o => (o.nombre || '').toLowerCase() === name)
    if (found) {
      return {
        noLicencia:
          found.noLicencia || found.licencia || found.numLicencia || found.numeroLicencia || '',
        rfc: found.rfc || found.RFC || '',
      }
    }
  } catch {}

  // 2) Permisionarios -> operadores
  try {
    const per = readPermisionariosFromLS()
    for (const p of per) {
      const operadores: any[] = Array.isArray(p?.operadores) ? p.operadores : []
      const f = operadores.find(o => (o.nombre || '').toLowerCase() === name)
      if (f) {
        return {
          noLicencia:
            f.noLicencia || f.licencia || f.numLicencia || f.numeroLicencia || '',
          rfc: f.rfc || f.RFC || '',
        }
      }
    }
  } catch {}

  return {}
}

export const Route = createFileRoute('/dashboard/asignacion')({
  component: function AsignacionComponent() {
    const [sheetOpen, setSheetOpen] = React.useState(false)
    const [servicios, setServicios] = React.useState<Servicio[]>([])
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
    const [servicioParaConfirmar, setServicioParaConfirmar] = React.useState<Servicio | null>(null)
    const [editingServicio, setEditingServicio] = React.useState<Servicio | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Cargar servicios desde localStorage al montar el componente
    React.useEffect(() => {
      const serviciosGuardados = listAsignaciones()
      const serviciosParaTabla: Servicio[] = serviciosGuardados.map(
        r =>
          ({
            id: r.id,
            cliente: r.cliente?.nombreRazonSocial ?? '',
            ruta: r.ruta ?? '',
            destino: r.destino ?? '',
            tipoFlota: r.unidades?.[0]?.tipoFlota ?? '',
            tipoUnidad: r.unidades?.[0]?.tipoUnidad ?? '',
            operador: r.operadores?.[0]?.nombre ?? '',
            eco: r.unidades?.[0]?.eco ?? '',
            placa: r.unidades?.[0]?.placa ?? '',
            remolque: r.unidades?.[0]?.remolque ?? '',
            citaCarga: r.citaCarga ? new Date(r.citaCarga) : undefined,
            tarifa: r.tarifas?.tarifaBase,
            costoExtra: r.tarifas?.extras?.[0]?.monto,
            comentarios: r.comentarios,
          } as unknown as Servicio),
      )
      setServicios(serviciosParaTabla)
    }, [])

    // Abre el diálogo de confirmación al guardar un nuevo servicio
    const handleSave = (data: Omit<Servicio, 'id'>) => {
      const newId = generateNextServiceId()
      const servicioCompleto: Servicio = { id: newId, ...data } as Servicio
      setServicioParaConfirmar(servicioCompleto)
      setSheetOpen(false)
      setConfirmDialogOpen(true)
    }

    // Editar: guarda cambios sin nuevo ID
    const handleSaveEdit = (id: string, data: Omit<Servicio, 'id'>) => {
      const actualizado: Servicio = { id, ...data } as Servicio

      // 1) Actualiza UI
      setServicios(prev => prev.map(s => (s.id === id ? actualizado : s)))

      // 2) Persiste en store (upsert con mismo ID)
      const s: any = actualizado
      const record: AsignacionRecord = {
        id: s.id,
        createdAt: new Date().toISOString(),
        cliente: { nombreRazonSocial: s.cliente },
        tarifas: { tarifaBase: s.tarifa, extras: s.costoExtra ? [{ concepto: 'Extra', monto: s.costoExtra }] : [] },
        origen: { tipo: s.tipoFlota === 'Permisionario' ? 'PERMISIONARIO' : 'LTR' } as any,
        unidades: [{ tipoFlota: s.tipoFlota, tipoUnidad: s.tipoUnidad, eco: s.eco, placa: s.placa, remolque: s.remolque }],
        operadores: [{ nombre: s.operador }],
        ruta: s.ruta,
        destino: s.destino,
        citaCarga: s.citaCarga ? new Date(s.citaCarga).toISOString() : undefined,
        comentarios: s.comentarios,
      }
      upsertAsignacion(record)

      const unit = findUnitDetails(data.eco, data.placa)
      const metaCliente = findClientMetaByName(data.cliente)
      const opMeta = findOperatorDetails(data.operador)

      setServiceMeta(id, {
        clienteRFC: metaCliente.rfc || '',
        clienteDomicilio: metaCliente.domicilio || '',
        unidadMarca: unit.marca,
        unidadAnio: unit.anio,
        unidadAseguradora: unit.aseguradora,
        unidadNoPoliza: unit.noPoliza,
        unidadPermisoSCT: unit.permisoSCT,
        operadorNoLicencia: opMeta.noLicencia || '',
        operadorRFC: opMeta.rfc || '',
      })

      // 3) Cierra hoja y limpia estado de edición
      setEditingServicio(null)
      setSheetOpen(false)
    }

    // Click en lápiz desde la tabla
    const handleEditClick = (row: Servicio) => {
      setEditingServicio(row)
      setSheetOpen(true)
    }

    // Confirma y persiste el servicio en localStorage
    const handleConfirmarServicio = () => {
      if (!servicioParaConfirmar) return

      setServicios(prev => [servicioParaConfirmar, ...prev])

      const s: any = servicioParaConfirmar
      const record: AsignacionRecord = {
        id: s.id,
        createdAt: new Date().toISOString(),
        cliente: { nombreRazonSocial: s.cliente },
        tarifas: { tarifaBase: s.tarifa, extras: s.costoExtra ? [{ concepto: 'Extra', monto: s.costoExtra }] : [] },
        origen: { tipo: 'LTR' },
        unidades: [{ tipoFlota: s.tipoFlota, tipoUnidad: s.tipoUnidad, eco: s.eco, placa: s.placa, remolque: s.remolque }],
        operadores: [{ nombre: s.operador }],
        ruta: s.ruta,
        destino: s.destino,
        citaCarga: s.citaCarga?.toISOString(),
        comentarios: s.comentarios,
      }

      upsertAsignacion(record)

      const unit = findUnitDetails((s as any).eco, (s as any).placa)
      const metaCliente = findClientMetaByName((s as any).cliente)
      const opMeta = findOperatorDetails((s as any).operador)

      setServiceMeta((s as any).id, {
        clienteRFC: metaCliente.rfc || '',
        clienteDomicilio: metaCliente.domicilio || '',
        unidadMarca: unit.marca,
        unidadAnio: unit.anio,
        unidadAseguradora: unit.aseguradora,
        unidadNoPoliza: unit.noPoliza,
        unidadPermisoSCT: unit.permisoSCT,
        operadorNoLicencia: opMeta.noLicencia || '',
        operadorRFC: opMeta.rfc || '',
      })

      setConfirmDialogOpen(false)
      setServicioParaConfirmar(null)
    }

    // Exportar a Excel
    const handleExportarServicios = async () => {
      if (servicios.length === 0) {
        alert('No hay servicios para exportar.')
        return
      }
      try {
        const XLSX = (await import('xlsx')) as typeof import('xlsx')
        const datosParaExportar = servicios.map(s => ({
          'ID Servicio': s.id ?? '',
          'Cliente': (s as any).cliente ?? '',
          'Ruta': (s as any).ruta ?? '',
          'Destino': (s as any).destino ?? '',
          'Tipo de Flota': (s as any).tipoFlota ?? '',
          'Tipo de Unidad': (s as any).tipoUnidad ?? '',
          'Operador': (s as any).operador ?? '',
          'Eco': (s as any).eco ?? '',
          'Placa': (s as any).placa ?? '',
          'Remolque': (s as any).remolque ?? '',
          'Cita de Carga': (s as any).citaCarga ? new Date((s as any).citaCarga).toLocaleString('es-MX') : 'N/A',
          'Tarifa': (s as any).tarifa ?? '',
          'Costo Extra': (s as any).costoExtra ?? '',
          'Comentarios': (s as any).comentarios ?? '',
        }))
        const worksheet = XLSX.utils.json_to_sheet(datosParaExportar)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios')
        XLSX.writeFile(workbook, `Servicios_${new Date().toISOString().split('T')[0]}.xlsx`)
      } catch (err) {
        console.error('Error exportando a Excel:', err)
        alert('No se pudo exportar. Verifica que el paquete "xlsx" esté instalado.')
      }
    }

    // Importar desde Excel
    const handleImportarClick = () => fileInputRef.current?.click()

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async e => {
        try {
          const XLSX = (await import('xlsx')) as typeof import('xlsx')
          const data = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const importedData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

          if (importedData.length === 0) {
            alert('El archivo no contiene datos.')
            return
          }

          const nuevosServicios: Servicio[] = []
          importedData.forEach(row => {
            const id = generateNextServiceId()
            const citaCargaValue = row['Cita de Carga']
            const citaCarga = citaCargaValue ? new Date(citaCargaValue) : undefined
            
            const servicio: Servicio = {
              id,
              cliente: row['Cliente'],
              ruta: row['Ruta'],
              destino: row['Destino'],
              tipoFlota: row['Tipo de Flota'],
              tipoUnidad: row['Tipo de Unidad'],
              operador: row['Operador'],
              eco: row['Eco'],
              placa: row['Placa'],
              remolque: row['Remolque'],
              citaCarga,
              tarifa: row['Tarifa'],
              costoExtra: row['Costo Extra'],
              comentarios: row['Comentarios'],
            } as unknown as Servicio
            
            nuevosServicios.push(servicio)

            // Persistir cada servicio importado
            const record: AsignacionRecord = {
              id: servicio.id,
              createdAt: new Date().toISOString(),
              cliente: { nombreRazonSocial: servicio.cliente },
              tarifas: { tarifaBase: servicio.tarifa, extras: servicio.costoExtra ? [{ concepto: 'Extra', monto: servicio.costoExtra }] : [] },
              origen: { tipo: 'LTR' },
              unidades: [{ tipoFlota: servicio.tipoFlota, tipoUnidad: servicio.tipoUnidad, eco: servicio.eco, placa: servicio.placa, remolque: servicio.remolque }],
              operadores: [{ nombre: servicio.operador }],
              ruta: servicio.ruta,
              destino: servicio.destino,
              citaCarga: servicio.citaCarga?.toISOString(),
              comentarios: servicio.comentarios,
            }
            upsertAsignacion(record)

            attachMetaAfterImport(servicio)
          })

          setServicios(prev => [...nuevosServicios, ...prev])
          alert(`${nuevosServicios.length} servicios importados con éxito.`)
        } catch (error) {
          console.error('Error al importar el archivo:', error)
          alert('El archivo seleccionado no es un Excel válido o tiene un formato incorrecto.')
        }
      }
      reader.readAsArrayBuffer(file)
      event.target.value = ''
    }

    const attachMetaAfterImport = (servicio: Servicio) => {
      const unit = findUnitDetails(servicio.eco, servicio.placa)
      const metaCliente = findClientMetaByName(servicio.cliente)
      const opMeta = findOperatorDetails(servicio.operador)
      setServiceMeta(servicio.id, {
        clienteRFC: metaCliente.rfc || '',
        clienteDomicilio: metaCliente.domicilio || '',
        unidadMarca: unit.marca,
        unidadAnio: unit.anio,
        unidadAseguradora: unit.aseguradora,
        unidadNoPoliza: unit.noPoliza,
        unidadPermisoSCT: unit.permisoSCT,
        operadorNoLicencia: opMeta.noLicencia || '',
        operadorRFC: opMeta.rfc || '',
      })
    }

    const handleCancelarServicio = (row: Servicio, motivo: string) => {
      // Eliminar de la UI
      setServicios(prev => prev.filter(s => s.id !== row.id))
      // Eliminar del store (base de datos local)
      removeAsignacion(row.id)
      removeServiceMeta(row.id) // NUEVO
      // Opcional: mostrar notificación
      // toast.success(`Servicio ${row.id} cancelado: ${motivo}`)
    }

    return (
      <>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Asignación</h1>
              <p className="text-muted-foreground">Centro de gestión para el área de asignación</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={handleImportarClick}>
                <Upload className="h-4 w-4" />
                Importar
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportarServicios}
                disabled={servicios.length === 0}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2" onClick={() => setSheetOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo servicio
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Servicios Activos</h2>
            <ServiciosTable rows={servicios} onCancel={handleCancelarServicio} onEdit={handleEditClick} />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
        />

        <NuevoServicioSheet
          open={sheetOpen}
          onOpenChange={(o) => {
            setSheetOpen(o)
            if (!o) setEditingServicio(null)
          }}
          onSave={handleSave}
          mode={editingServicio ? 'edit' : 'create'}
          initialData={editingServicio || undefined}
          onSaveEdit={(id, data) => handleSaveEdit(id, data)}
        />

        <ConfirmacionServicioDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          servicio={servicioParaConfirmar}
          onConfirm={handleConfirmarServicio}
        />
      </>
    )
  },
})
