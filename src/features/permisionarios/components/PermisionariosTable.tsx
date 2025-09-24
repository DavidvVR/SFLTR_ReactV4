import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'
import type { Permisionario } from '../types'

interface PermisionariosTableProps {
  rows: Permisionario[]
  onEdit: (row: Permisionario) => void
  onDelete?: (id: string) => void
}

export default function PermisionariosTable({ rows, onEdit, onDelete }: PermisionariosTableProps) {
  return (
    <div className="rounded-md border">
      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>RFC</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Operadores</TableHead>
              <TableHead className="w-[160px] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No se encontraron permisionarios.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell>{row.rfc}</TableCell>
                  <TableCell>{row.razonSocial}</TableCell>
                  <TableCell>{row.alias || '—'}</TableCell>
                  <TableCell>
                    <span className={row.estatus === 'Activo' ? 'text-green-600' : 'text-red-600'}>
                      {row.estatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.unidades?.length || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.operadores?.length || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Editar"
                        onClick={() => onEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar permisionario</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. ¿Deseas eliminar "{row.razonSocial}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(row.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
