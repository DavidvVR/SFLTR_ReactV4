import * as React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Item = {
  serviceId: string
  cliente: string
  ruta: string
  operador: string
  unidad: string
  status: string
  lastEventAt?: string
}





type Props = {
  items: any[]
  q?: string
  onQChange?: (v: string) => void
  onVerEventos: (id: string) => void
  hideSearch?: boolean
}

export function MonitoreoTable({ items, q, onQChange, onVerEventos, hideSearch = false }: Props) {
  return (
    <div className="w-full">
      {/* Toolbar de la tabla opcional (oculta si viene hideSearch) */}
      {!hideSearch && (
        <div className="p-3 flex items-center justify-end">
          <input
            className="h-9 w-[240px] rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Buscar servicio..."
            value={q ?? ''}
            onChange={(e) => onQChange?.(e.target.value)}
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table className="min-w-full border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead className="sticky top-0 z-20 bg-background">ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[160px]">Último evento</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">Sin registros</TableCell>
              </TableRow>
            ) : items.map(it => (
              <TableRow key={it.serviceId}>
                <TableCell className="font-mono text-xs">{it.serviceId}</TableCell>
                <TableCell>{it.cliente}</TableCell>
                <TableCell>{it.ruta}</TableCell>
                <TableCell>{it.unidad}</TableCell>
                <TableCell>{it.operador}</TableCell>
                <TableCell><Badge variant="secondary">{it.status}</Badge></TableCell>
                <TableCell>{it.lastEventAt ? new Date(it.lastEventAt).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onVerEventos(it.serviceId)}>Ver eventos</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}