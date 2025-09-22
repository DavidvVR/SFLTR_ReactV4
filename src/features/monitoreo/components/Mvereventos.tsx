import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export type LoggedEvent = {
  id?: string
  serviceId: string
  type: string
  status: string
  message?: string
  coords?: { lat?: number; lng?: number } | null
  user?: string | null
  createdAt?: string | number | Date
}





type ItemWithEvents = {
  id?: string
  serviceId?: string
  eventos?: LoggedEvent[]
  [k: string]: any
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  serviceId: string
  items: ItemWithEvents[]
}

export function ViewEventsDialog({ open, onOpenChange, serviceId, items }: Props) {
  const events = React.useMemo<LoggedEvent[]>(() => {
    if (!serviceId) return []
    const rec =
      items.find((it) => it.id === serviceId || it.serviceId === serviceId) ??
      null
    return (rec?.eventos ?? []).slice().sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime()
      const tb = new Date(b.createdAt ?? 0).getTime()
      return tb - ta // más recientes primero
    })
  }, [items, serviceId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Eventos del servicio {serviceId || '-'}</DialogTitle>
          <DialogDescription>Bitácora de eventos registrados.</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border max-h-[60vh] overflow-auto">
          <Table className="min-w-full border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="whitespace-nowrap">Fecha</TableHead>
                <TableHead className="whitespace-nowrap">Tipo</TableHead>
                <TableHead className="whitespace-nowrap">Estatus</TableHead>
                <TableHead className="whitespace-nowrap">Usuario</TableHead>
                <TableHead>Mensaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin eventos registrados para este servicio.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((ev, idx) => {
                  const dt = ev.createdAt ? new Date(ev.createdAt) : null
                  const when = dt ? dt.toLocaleString() : '—'
                  return (
                    <TableRow key={ev.id ?? idx}>
                      <TableCell className="whitespace-nowrap">{when}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{ev.type || '—'}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge>{ev.status || '—'}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{ev.user || '—'}</TableCell>
                      <TableCell className="max-w-[420px]">
                        <div className="truncate" title={ev.message || ''}>{ev.message || '—'}</div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}