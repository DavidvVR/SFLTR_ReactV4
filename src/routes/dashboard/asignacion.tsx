import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
<<<<<<< HEAD
import { Plus } from 'lucide-react'
import { NuevoServicioSheet } from '@/features/asignacion/components/nuevo-servicio-sheet'

export const Route = createFileRoute('/dashboard/asignacion')({
  component: RouteComponent,
})

function RouteComponent() {
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const handleSave = () => {
    // Aquí irá la lógica para guardar el nuevo servicio
    console.log("Guardando servicio...")
    setSheetOpen(false) // Cierra el modal al guardar
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Asignación</h1>
            <p className="text-muted-foreground">
              Centro de gestión para el area de asignación
            </p>
          </div>
          <Button className="gap-2" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </Button>
        </div>
        {/* Aquí irá el resto del contenido, como las pestañas y la tabla */}
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">El contenido principal de la tabla de asignaciones irá aquí.</p>
        </div>
      </div>

      <NuevoServicioSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        onSave={handleSave} 
      />
    </>
  )
}
=======
import { Plus, Upload, Download } from 'lucide-react'
import { NuevoServicioSheet } from '@/features/asignacion/components/nuevo-servicio-sheet'
import { ServiciosTable, type Servicio } from '@/features/asignacion/components/ServiciosTable'
import { ConfirmacionServicioDialog } from '@/features/asignacion/components/ConfirmacionServicioDialog'
import { upsertAsignacion, listAsignaciones, deriveOrigenFromId, type AsignacionRecord } from '@/features/asignacion/data/asignacion-store'

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

export const Route = createFileRoute('/dashboard/asignacion')({
  component: function AsignacionComponent() {
    const [sheetOpen, setSheetOpen] = React.useState(false)
    const [servicios, setServicios] = React.useState<Servicio[]>([])
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
    const [servicioParaConfirmar, setServicioParaConfirmar] = React.useState<Servicio | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // --- NUEVO: Cargar servicios desde localStorage al montar ---
    React.useEffect(() => {
      const serviciosGuardados = listAsignaciones()
      // Mapear el formato de AsignacionRecord al formato de Servicio para la tabla
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

    // Guardado inicial -> abre confirmación
    const handleSave = (data: Omit<Servicio, 'id'>) => {
      const newId = generateNextServiceId()
      const servicioCompleto: Servicio = { id: newId, ...data } as Servicio
      setServicioParaConfirmar(servicioCompleto)
      setSheetOpen(false)
      setConfirmDialogOpen(true)
    }

    // Confirmación -> agrega a la tabla y persiste en localStorage
    const handleConfirmarServicio = () => {
      if (!servicioParaConfirmar) return

      // 1. Actualizar el estado de React para ver el cambio al instante
      setServicios(prev => [servicioParaConfirmar, ...prev])

      // 2. Construir el objeto completo para guardar en localStorage
      const s: any = servicioParaConfirmar
      const record: AsignacionRecord = {
        id: s.id,
        createdAt: new Date().toISOString(),
        cliente: { nombreRazonSocial: s.cliente },
        tarifas: { tarifaBase: s.tarifa, extras: s.costoExtra ? [{ concepto: 'Extra', monto: s.costoExtra }] : [] },
        origen: { tipo: 'LTR' }, // O la lógica que uses
        unidades: [{ tipoFlota: s.tipoFlota, tipoUnidad: s.tipoUnidad, eco: s.eco, placa: s.placa, remolque: s.remolque }],
        operadores: [{ nombre: s.operador }],
        ruta: s.ruta,
        destino: s.destino,
        citaCarga: s.citaCarga?.toISOString(),
        comentarios: s.comentarios,
      }

      // 3. Persistir en localStorage
      upsertAsignacion(record)

      // 4. Limpiar estados
      setConfirmDialogOpen(false)
      setServicioParaConfirmar(null)
    }

    // Exportar a Excel (carga dinámica de xlsx)
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
          'Cita de Carga': (s as any).citaCarga
            ? new Date((s as any).citaCarga).toLocaleString('es-MX')
            : 'N/A',
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

          const nuevosServicios: Servicio[] = importedData.map(row => {
            const id = generateNextServiceId()
            const citaCargaValue = row['Cita de Carga']
            const citaCarga =
              citaCargaValue ? new Date(citaCargaValue) : undefined
            return {
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
            <ServiciosTable rows={servicios} />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
        />

        <NuevoServicioSheet open={sheetOpen} onOpenChange={setSheetOpen} onSave={handleSave} />

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
>>>>>>> Modulo de asiganación60
