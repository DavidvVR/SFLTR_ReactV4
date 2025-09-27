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
  type UnidadLTRRemote as UnidadLTR,
  listUnidadesLTR,
  searchUnidadesLTR,
  addUnidadLTR,
  updateUnidadLTR,
  deleteUnidadLTR,
  importUnidadesLTR,
  subscribeUnidadesLTR,
} from '../data/ltr-unidades-supabase'

// Extiende el tipo localmente para incluir No de Póliza
type UnidadLTREx = UnidadLTR & {
  noPoliza?: string
  tarjetaUrl?: string   // URL pública (OneDrive/Drive) de Tarjeta de Circulación
  polizaUrl?: string    // URL pública (OneDrive/Drive) de Póliza de Seguro
}

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
  tarjetaUrl: '',
  polizaUrl: '',
}

export default function UnidadesView() {
  // --- Estado Principal ---
  const [data, setData] = React.useState<UnidadLTREx[]>([])
  const [q, setQ] = React.useState('')
  const [tipoFilter, setTipoFilter] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    void load()
    const unsub = subscribeUnidadesLTR(() => { void loadSilent() })
    return () => unsub()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const rows = await listUnidadesLTR()
      setData(rows as UnidadLTREx[])
    } catch (e) {
      console.error('Error cargando unidades', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadSilent() {
    try {
      const rows = await listUnidadesLTR()
      setData(rows as UnidadLTREx[])
    } catch (e) {
      console.error(e)
    }
  }

  const searchTimer = React.useRef<number | undefined>()
  React.useEffect(() => {
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      void doSearch(q, tipoFilter)
    }, 350)
    return () => window.clearTimeout(searchTimer.current)
  }, [q, tipoFilter])

  async function doSearch(term: string, tipo: string) {
    if (!term.trim() && !tipo) return load()
    setLoading(true)
    try {
      const rows = await searchUnidadesLTR(term, tipo || undefined)
      setData(rows as UnidadLTREx[])
    } catch (e) {
      console.error('Error buscando', e)
    } finally {
      setLoading(false)
    }
  }

  // --- Estado del Modal (Sheet) ---
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<UnidadLTREx>(EMPTY_UNIDAD)
  const [isEditing, setIsEditing] = React.useState(false)
  const importFileRef = React.useRef<HTMLInputElement | null>(null)

  // --- Lógica de Filtrado y Búsqueda ---
  const filteredData = data

  const tiposUnicos = React.useMemo(() => [...new Set(data.map(u => u.tipo))], [data])

  // --- Lógica CRUD ---
  function handleNew() {
    setIsEditing(false)
    setDraft({ ...EMPTY_UNIDAD, id: '' })
    setSheetOpen(true)
  }

  function handleEdit(unidad: UnidadLTR) {
    setIsEditing(true)
    setDraft(unidad)
    setSheetOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar unidad?')) return
    try {
      await deleteUnidadLTR(id)
    } catch (e) {
      console.error(e)
      alert('Error eliminando.')
    }
  }

  async function handleSave() {
    if (!draft.placas || !draft.tipo) {
      alert('Placas y Tipo obligatorios.')
      return
    }
    const payload: UnidadLTR = {
      ...draft,
      id: draft.id?.trim() || undefined,
      anio: draft.anio ? Number(draft.anio) : undefined,
      vencePoliza: draft.vencePoliza || null,
      noPoliza: draft.noPoliza || null,
      polizaUrl: draft.polizaUrl || null,
      tarjetaUrl: draft.tarjetaUrl || null,
    }
    try {
      if (isEditing && payload.id) {
        await updateUnidadLTR(payload.id, payload)
      } else {
        const newId = await addUnidadLTR(payload)
        payload.id = newId
      }
      setSheetOpen(false)
      await load()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Error guardando.')
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataBuf = await file.arrayBuffer()
      const wb = XLSX.read(dataBuf, { type: 'array' })
      const sheet = wb.SheetNames[0]
      const json = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheet])
      const rows = json.map(r => ({
        placas: r.placas || r.Placas,
        tipo: r.tipo || r.Tipo,
        eco: r.eco || r.Eco || null,
        disponibilidad: r.disponibilidad || 'Disponible',
        marca: r.marca || null,
        anio: r.anio ? Number(r.anio) : null,
        aseguradora: r.aseguradora || null,
        vencePoliza: r.vencePoliza || null,
        permisoSCT: r.permisoSCT || null,
        noPoliza: r.noPoliza || null,
        polizaUrl: r.polizaUrl || null,
        tarjetaUrl: r.tarjetaUrl || null,
      }))
      await importUnidadesLTR(rows)
      await load()
      alert(`${rows.length} unidades importadas.`)
    } catch (e) {
      console.error(e)
      alert('Error importando.')
    } finally {
      event.target.value = ''
    }
  }

  async function handleExport() {
    if (!data.length) {
      alert('No hay unidades para exportar.')
      return
    }
    try {
      const rows = data.map(u => ({
        id: u.id,
        placas: u.placas,
        eco: u.eco || '',
        tipo: u.tipo,
        disponibilidad: u.disponibilidad,
        marca: u.marca || '',
        anio: u.anio || '',
        aseguradora: u.aseguradora || '',
        vencePoliza: u.vencePoliza || '',
        permisoSCT: u.permisoSCT || '',
        noPoliza: u.noPoliza || '',
        polizaUrl: u.polizaUrl || '',
        tarjetaUrl: u.tarjetaUrl || '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Unidades')
      XLSX.writeFile(wb, 'ltr_unidades.xlsx')
    } catch (e) {
      console.error('Error exportando', e)
      alert('Error exportando.')
    }
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

          {loading && <div className="text-sm text-muted-foreground">Cargando...</div>}

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
                  <Input
                    placeholder="o pega URL pública (OneDrive/Drive)"
                    value={draft.tarjetaUrl || ''}
                    onChange={(e) => setDraft(d => ({ ...d, tarjetaUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltrUPolizaFile">Póliza de Seguro</Label>
                  <Input id="ltrUPolizaFile" type="file" />
                  <Input
                    placeholder="o pega URL pública (OneDrive/Drive)"
                    value={draft.polizaUrl || ''}
                    onChange={(e) => setDraft(d => ({ ...d, polizaUrl: e.target.value }))}
                  />
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
