import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

// Define la estructura de un servicio para la tabla
export interface Servicio {
  id: string
  cliente: string
  ruta: string
  tipoFlota: 'LTR' | 'Permisionario'
  tipoUnidad: string
  citaCarga?: Date
  operador?: string
  eco?: string
  placa?: string
  remolque?: string
  comentarios?: string
  // Nuevos campos
  destino?: string
  costoExtra?: number
  // Nuevo campo
  tarifa?: number
}

interface ServiciosTableProps {
  rows: Servicio[]
}

export function ServiciosTable({ rows }: ServiciosTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Tipo de Flota</TableHead>
            <TableHead>Tipo de Unidad</TableHead>
            <TableHead className="w-[80px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id}</TableCell>
                <TableCell>{row.cliente}</TableCell>
                <TableCell>{row.ruta}</TableCell>
                <TableCell>{row.tipoFlota}</TableCell>
                <TableCell>{row.tipoUnidad}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem>Cancelar servicio</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No hay servicios activos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}