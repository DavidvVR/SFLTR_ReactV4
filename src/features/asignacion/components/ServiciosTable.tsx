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
import { MoreHorizontal, X, Pencil } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// NUEVO: imports del Dialog, Label y Select
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Define la estructura de un servicio para la tabla
export interface Servicio {
  id: string
  cliente: string
  ruta?: string
  tipoFlota?: 'LTR' | 'Permisionario' | string
  tipoUnidad?: string
  citaCarga?: Date
  operador?: string
  eco?: string
  placa?: string
  remolque?: string
  comentarios?: string
  destino?: string
  costoExtra?: number
  tarifa?: number
}

interface ServiciosTableProps {
  rows: Servicio[]
  onCancel?: (row: Servicio, motivo: string) => void // NUEVO
  onEdit?: (row: Servicio) => void // NUEVO
}

export function ServiciosTable({ rows, onCancel, onEdit }: ServiciosTableProps) {
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState<Servicio | null>(null)
  const [motivo, setMotivo] = React.useState<string>('')

  const openCancelDialog = (row: Servicio) => {
    setSelectedRow(row)
    setMotivo('')
    setCancelOpen(true)
  }

  const handleConfirmarCancelacion = () => {
    if (selectedRow && motivo) {
      onCancel?.(selectedRow, motivo)
      setCancelOpen(false)
      setSelectedRow(null)
      setMotivo('')
    }
  }

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
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Cancelar viaje"
                            onClick={() => openCancelDialog(row)} // NUEVO
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Cancelar viaje</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* NUEVO: Editar servicio */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            aria-label="Editar servicio"
                            onClick={() => onEdit?.(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Editar servicio</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Aqui podemos agregar mas opciones</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

      {/* Modal de confirmación de cancelación */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmación de cancelación de viaje</DialogTitle>
            <DialogDescription>Por favor seleccione el motivo de cancelación del servicio</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-cancel">Motivo:</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger id="motivo-cancel">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Servicio cancelado por el cliente">Servicio cancelado por el cliente</SelectItem>
                <SelectItem value="Incumplimiento de cita de carga">Incumplimiento de cita de carga</SelectItem>
                <SelectItem value="Cita reprogramada">Cita reprogramada</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="sm:justify-end">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)}>
                Regresar
              </Button>
              <Button variant="destructive" onClick={handleConfirmarCancelacion} disabled={!motivo}>
                Confirmar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}