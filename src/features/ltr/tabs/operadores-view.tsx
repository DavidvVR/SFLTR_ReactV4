import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, FileUp, FileDown } from 'lucide-react'

// --- Tipos de Datos ---
type OperadorLTR = {
  id: string
  nombre: string
  numLicencia?: string
  venceLicencia?: string // yyyy-mm-dd
  expMedico?: string // yyyy-mm-dd
  venceAptoMedico?: string // yyyy-mm-dd
  rfc?: string
  curp?: string
  telefono?: string
  nss?: string
  estatus: 'Activo' | 'Inactivo' | 'Capacitación' | 'Baja'
  // Campos para archivos (opcional, solo para UI)
  licenciaNombre?: string
  aptoMedicoNombre?: string
}

const EMPTY_OPERADOR: OperadorLTR = {
  id: '',
  nombre: '',
  numLicencia: '',
  venceLicencia: '',
  expMedico: '',
  venceAptoMedico: '',
  rfc: '',
  curp: '',
  telefono: '',
  nss: '',
  estatus: 'Activo',
}

// --- Datos de ejemplo ---
const MOCK_DATA: OperadorLTR[] = [
  { id: 'OP-101', nombre: 'Juan Pérez', numLicencia: 'B12345', estatus: 'Activo', venceLicencia: '2026-10-05' },
  { id: 'OP-102', nombre: 'María López', numLicencia: 'C67890', estatus: 'Capacitación', venceAptoMedico: '2025-12-20' },
]

export default function OperadoresView() {
  // --- Estado Principal ---
  const [data, setData] = React.useState<OperadorLTR[]>(MOCK_DATA)
  const [q, setQ] = React.useState('')

  // --- Estado del Modal (Sheet) ---
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<OperadorLTR>(EMPTY_OPERADOR)
  const [isEditing, setIsEditing] = React.useState(false)

  // --- Lógica de Filtrado ---
  const filteredData = React.useMemo(() => {
    const query = q.toLowerCase()
    return data.filter(o => [o.id, o.nombre, o.numLicencia, o.estatus, o.rfc, o.curp].join(' ').toLowerCase().includes(query))
  }, [data, q])

  // --- Lógica de ID Secuencial ---
  function nextOperadorId(operadores: OperadorLTR[]): string {
    const maxId = operadores.reduce((max, op) => {
      const match = op.id.match(/^LTR-OP-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newNum = maxId + 1;
    return `LTR-OP-${String(newNum).padStart(2, '0')}`;
  }

  // --- Lógica CRUD ---
  function handleNew() {
    setIsEditing(false)
    setDraft({ ...EMPTY_OPERADOR, id: nextOperadorId(data) })
    setSheetOpen(true)
  }

  function handleEdit(operador: OperadorLTR) {
    setIsEditing(true)
    setDraft(operador)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    setData(prev => prev.filter(o => o.id !== id))
  }

  function handleSave() {
    if (!draft.nombre || !draft.numLicencia || !draft.curp) {
      alert('Nombre, No. de Licencia y CURP son campos obligatorios.')
      return
    }
    if (isEditing) {
      setData(prev => prev.map(o => o.id === draft.id ? draft : o))
    } else {
      setData(prev => [...prev, draft])
    }
    setSheetOpen(false)
  }

  return (
    <>
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Operadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Buscar por ID, Nombre, RFC, CURP..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-grow" />
            <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" /> Agregar Operador</Button>
            <Button variant="outline" className="gap-1"><FileUp className="h-4 w-4" /> Importar</Button>
            <Button variant="outline" className="gap-1"><FileDown className="h-4 w-4" /> Exportar</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>No. Licencia</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell className="font-medium">{o.nombre}</TableCell>
                    <TableCell>{o.numLicencia || 'N/A'}</TableCell>
                    <TableCell>{o.estatus}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(o)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará al operador {o.nombre}. Esta acción no se puede deshacer.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(o.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Sin resultados</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- Modal para Agregar/Editar Operador --- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>{isEditing ? `Editar Operador: ${draft.nombre}` : 'Alta de Operador'}</SheetTitle>
              <SheetDescription>Completa los datos requeridos del operador.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="opLTRNombre">Nombre*</Label>
                  <Input id="opLTRNombre" value={draft.nombre} onChange={e => setDraft(d => ({ ...d, nombre: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLTRLicencia">No. Licencia*</Label>
                  <Input id="opLTRLicencia" value={draft.numLicencia || ''} onChange={e => setDraft(d => ({ ...d, numLicencia: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLTRVtoLicencia">Vencimiento de Licencia</Label>
                  <Input id="opLTRVtoLicencia" type="date" value={draft.venceLicencia || ''} onChange={e => setDraft(d => ({ ...d, venceLicencia: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLicenciaFile">Archivo Licencia</Label>
                  <Input id="opLicenciaFile" type="file" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opAptoFile">Archivo Apto Médico</Label>
                  <Input id="opAptoFile" type="file" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opExpMedico">Exp Medico</Label>
                  <Input id="opExpMedico" type="text" value={draft.expMedico || ''} onChange={e => setDraft(d => ({ ...d, expMedico: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opVtoApto">Vencimiento Apto Médico</Label>
                  <Input id="opVtoApto" type="date" value={draft.venceAptoMedico || ''} onChange={e => setDraft(d => ({ ...d, venceAptoMedico: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opRFC">RFC</Label>
                  <Input id="opRFC" value={draft.rfc || ''} onChange={e => setDraft(d => ({ ...d, rfc: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLTRCURP">CURP*</Label>
                  <Input id="opLTRCURP" value={draft.curp || ''} onChange={e => setDraft(d => ({ ...d, curp: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLTRTelefono">Teléfono</Label>
                  <Input id="opLTRTelefono" type="tel" value={draft.telefono || ''} onChange={e => setDraft(d => ({ ...d, telefono: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opLTRNSS">NSS</Label>
                  <Input id="opLTRNSS" value={draft.nss || ''} onChange={e => setDraft(d => ({ ...d, nss: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
