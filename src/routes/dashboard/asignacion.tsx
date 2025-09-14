import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
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