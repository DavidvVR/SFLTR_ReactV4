import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, FileUp, FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  type UnidadLTR,
  readAll,
  upsert,
  remove,
} from '../data/ltr-unidades-local'

// Extiende el tipo localmente para incluir No de Póliza
type UnidadLTREx = UnidadLTR & { noPoliza?: string }

const EMPTY_UNIDAD: UnidadLTREx = {
  id: '',
  placas: '',
  tipo: '',
  eco: '',
  disponibilidad: 'Disponible',
  marca: '',
  anio: '',
  aseguradora: '',
  vencePoliza: '',
  permisoSCT: '',
  noPoliza: '', // NUEVO
}

export default function UnidadesView() {
  // --- Estado Principal ---
  const [data, setData] = React.useState<UnidadLTREx[]>([])
  const [q, setQ] = React.useState('')
  const [tipoFilter, setTipoFilter] = React.useState('')

  React.useEffect(() => {
    // Lee y mapea posibles registros existentes (si ya traen noPoliza, se conserva)
    setData(readAll().map(u => ({ ...u })))
  }, [])

  // --- Estado del Modal (Sheet) ---
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<UnidadLTREx>(EMPTY_UNIDAD)
  const [isEditing, setIsEditing] = React.useState(false)
  const importFileRef = React.useRef<HTMLInputElement | null>(null)

  // --- Lógica de Filtrado y Búsqueda ---
  const filteredData = React.useMemo(() => {
    return data
      .filter(u => tipoFilter ? u.tipo === tipoFilter : true)
      .filter(u => {
        const query = q.toLowerCase()
        return [u.id, u.tipo, u.placas, u.eco, u.disponibilidad].join(' ').toLowerCase().includes(query)
      })
  }, [data, q, tipoFilter])

  const tiposUnicos = React.useMemo(() => [...new Set(data.map(u => u.tipo))], [data])

  // --- Lógica de ID Secuencial ---
  function nextUnidadId(unidades: UnidadLTR[]): string {
    const maxId = unidades.reduce((max, u) => {
      const match = u.id.match(/^LTR-UN-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newNum = maxId + 1;
    return `LTR-UN-${String(newNum).padStart(2, '0')}`;
  }

  // --- Lógica CRUD ---
  function handleNew() {
    setIsEditing(false)
    setDraft({ ...EMPTY_UNIDAD, id: nextUnidadId(data) })
    setSheetOpen(true)
  }

  function handleEdit(unidad: UnidadLTR) {
    setIsEditing(true)
    setDraft(unidad)
    setSheetOpen(true)
  }

  function handleDelete(id: string) {
    remove(id)
    setData(prev => prev.filter(u => u.id !== id))
  }

  function handleSave() {
    if (!draft.placas || !draft.tipo) {
      alert('Placas y Tipo son campos obligatorios.')
      return
    }
    // Persiste (el store puede ignorar campos extra si no los usa)
    upsert(draft as UnidadLTR)

    if (isEditing) {
      setData(prev => prev.map(u => u.id === draft.id ? draft : u))
    } else {
      setData(prev => [...prev, draft])
    }
    setSheetOpen(false)
  }

  // --- Lógica de Importación/Exportación ---
  function handleExport() {
    if (data.length === 0) {
      alert("No hay unidades para exportar.")
      return
    }
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "UnidadesLTR")
    XLSX.writeFile(workbook, "UnidadesLTR.xlsx")
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const binaryStr = e.target?.result
        const workbook = XLSX.read(binaryStr, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<UnidadLTR>(worksheet)
        
        const newData = [...data]
        jsonData.forEach(item => {
          upsert(item)
          newData.push(item)
        })

        setData(newData)
        alert(`${jsonData.length} unidades importadas.`)
      } catch (error) {
        alert("Error al importar el archivo.")
        console.error(error)
      }
    }
    reader.readAsBinaryString(file)
    event.target.value = ''
  }

  return (
    <>
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Unidades LTR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por Placas, Eco, Tipo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-grow"
            />
            <Select 
              value={tipoFilter} 
              onValueChange={(value) => {
                setTipoFilter(value === 'all' ? '' : value)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposUnicos.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleNew} className="gap-2"><Plus className="h-4 w-4" /> Agregar Unidad</Button>
            
            <input
              type="file"
              ref={importFileRef}
              onChange={handleImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <Button variant="outline" className="gap-1" onClick={() => importFileRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" className="gap-1" onClick={handleExport}>
              <FileDown className="h-4 w-4" /> Exportar
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Eco</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.id}</TableCell>
                    <TableCell>{u.tipo}</TableCell>
                    <TableCell>{u.placas}</TableCell>
                    <TableCell>{u.eco || 'N/A'}</TableCell>
                    <TableCell>{u.disponibilidad}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la unidad {u.placas} permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(u.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Sin resultados</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- Modal para Agregar/Editar Unidad --- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>{isEditing ? `Editar Unidad ${draft.placas}` : 'Alta de Unidad LTR'}</SheetTitle>
              <SheetDescription>Completa los datos de la unidad.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ltrUPlacas">Placas*</Label>
                  <Input id="ltrUPlacas" value={draft.placas} onChange={e => setDraft(d => ({ ...d, placas: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUEco">Eco</Label>
                  <Input id="ltrUEco" value={draft.eco || ''} onChange={e => setDraft(d => ({ ...d, eco: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUTipo">Tipo*</Label>
                  <Select value={draft.tipo} onValueChange={val => setDraft(d => ({ ...d, tipo: val }))}>
                    <SelectTrigger id="ltrUTipo"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tractor">Tractor</SelectItem>
                      <SelectItem value="Unidad seca 53">Unidad seca 53"</SelectItem>
                      <SelectItem value="Refrigerada 53">Refrigerada 53"</SelectItem>
                      <SelectItem value="Torton">Torton</SelectItem>
                      <SelectItem value="Rabón">Rabón</SelectItem>
                      <SelectItem value="3.5">3.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUDisponibilidad">Disponibilidad</Label>
                  <Select value={draft.disponibilidad} onValueChange={(val: 'Disponible' | 'En Mtto') => setDraft(d => ({ ...d, disponibilidad: val }))}>
                    <SelectTrigger id="ltrUDisponibilidad"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="En Mtto">En Mtto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUMarca">Marca</Label>
                  <Input id="ltrUMarca" value={draft.marca || ''} onChange={e => setDraft(d => ({ ...d, marca: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUAnio">Año</Label>
                  <Input id="ltrUAnio" type="number" value={draft.anio || ''} onChange={e => setDraft(d => ({ ...d, anio: e.target.value ? Number(e.target.value) : '' }))} />
                </div>
                { /* NUEVO: No de Póliza (texto) */ }
                <div className="space-y-2">
                  <Label htmlFor="ltrUNoPoliza">No de Póliza</Label>
                  <Input
                    id="ltrUNoPoliza"
                    type="text"
                    value={draft.noPoliza || ''}
                    onChange={(e) => setDraft(d => ({ ...d, noPoliza: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUAseguradora">Aseguradora</Label>
                  <Input id="ltrUAseguradora" value={draft.aseguradora || ''} onChange={e => setDraft(d => ({ ...d, aseguradora: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUVencePoliza">Vencimiento Póliza</Label>
                  <Input id="ltrUVencePoliza" type="date" value={draft.vencePoliza || ''} onChange={e => setDraft(d => ({ ...d, vencePoliza: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUPermisoSCT">Permiso SCT</Label>
                  <Input id="ltrUPermisoSCT" value={draft.permisoSCT || ''} onChange={e => setDraft(d => ({ ...d, permisoSCT: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUTarjetaFile">Tarjeta de Circulación</Label>
                  <Input id="ltrUTarjetaFile" type="file" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUPolizaFile">Póliza de Seguro</Label>
                  <Input id="ltrUPolizaFile" type="file" />
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
