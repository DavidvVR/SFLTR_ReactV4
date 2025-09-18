import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { Servicio } from './ServiciosTable'

interface ConfirmacionServicioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicio: Servicio | null
  onConfirm: () => void
}

const formatDateTime = (date: Date | undefined) => {
  if (!date) return 'No especificada'
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

export function ConfirmacionServicioDialog({ open, onOpenChange, servicio, onConfirm }: ConfirmacionServicioDialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  const handleDescargarPng = async () => {
    const node = contentRef.current
    if (!node) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `${servicio?.id || 'confirmacion-servicio'}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('No se pudo exportar la imagen:', e)
      alert('No se pudo exportar la imagen.')
    }
  }

  if (!servicio) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div ref={contentRef}>
          <DialogHeader className="flex flex-col items-center">
            <DialogTitle className="text-2xl">¡Listo ya está tu asignación!</DialogTitle>
            <DialogDescription className="text-lg font-bold text-primary pt-2">
              {servicio.id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Cliente</span>
              <span>{servicio.cliente}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Ruta</span>
              <span>{servicio.ruta}</span>
            </div>
            {servicio.destino && (
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-right font-semibold text-muted-foreground">Destino</span>
                <span>{servicio.destino}</span>
              </div>
            )}
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Cita Carga</span>
              <span className="font-bold text-primary">{formatDateTime(servicio.citaCarga)}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Operador</span>
              <span>{servicio.operador || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Unidad</span>
              <span>Eco: {servicio.eco || 'N/A'} / Placas: {servicio.placa || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center gap-4">
              <span className="text-right font-semibold text-muted-foreground">Remolque</span>
              <span>{servicio.remolque || 'No aplica'}</span>
            </div>
            {servicio.costoExtra && servicio.costoExtra > 0 && (
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <span className="text-right font-semibold text-muted-foreground">Costo Extra</span>
                <span className="font-bold">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(servicio.costoExtra)}
                </span>
              </div>
            )}
            {servicio.comentarios && (
              <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                <span className="text-right font-semibold text-muted-foreground">Comentarios</span>
                <p className="text-muted-foreground bg-secondary p-2 rounded-md">{servicio.comentarios}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" className="gap-2" onClick={handleDescargarPng}>
            <Download className="h-4 w-4" />
            Descargar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Editar
            </Button>
            <Button onClick={onConfirm}>Confirmar y Crear Servicio</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}