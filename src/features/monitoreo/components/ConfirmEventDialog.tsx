import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { MonitoreoStatus, TrackingEventType } from '../types'

export interface ConfirmEventData {
  serviceId: string
  type: TrackingEventType
  status: MonitoreoStatus
  message?: string
  coords?: { lat: number; lng: number }
  user?: string
}

interface ConfirmEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ConfirmEventData
  onConfirm: () => void
}

export function ConfirmEventDialog({ open, onOpenChange, data, onConfirm }: ConfirmEventDialogProps) {
  const { serviceId, type, status, message, coords, user } = data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar guardado de evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>ID Servicio:</strong> {serviceId || '-'}</p>
          <p><strong>Tipo:</strong> {type}</p>
          <p><strong>Estado:</strong> {status}</p>
          <p><strong>Usuario:</strong> {user || '-'}</p>
          <p><strong>Coordenadas:</strong> {coords ? `${coords.lat}, ${coords.lng}` : '-'}</p>
          <p className="whitespace-pre-wrap"><strong>Mensaje:</strong> {message || '-'}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!serviceId}>Confirmar y guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}