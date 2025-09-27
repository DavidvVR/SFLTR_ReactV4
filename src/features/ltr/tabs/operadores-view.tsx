import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Pencil, FileUp, FileDown, Eye } from 'lucide-react'
import {
  type OperadorRemote as OperadorLTR,
  listOperadores,
  searchOperadores,
  addOperador,
  updateOperador,
  deleteOperador,
  importOperadores,
  subscribeOperadores
} from '../data/ltr-operadores-supabase'

// Extiende el tipo local sin tocar el archivo fuente
type OperadorEx = OperadorLTR & {
  licenciaUrl?: string
  licenciaNombre?: string
  aptoMedicoUrl?: string
  aptoMedicoNombre?: string
}

const EMPTY_OPERADOR: OperadorEx = {
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
  licenciaUrl: '',
  licenciaNombre: '',
  aptoMedicoUrl: '',
  aptoMedicoNombre: '',
}

export default function OperadoresView() {
  // --- Estado Principal ---
  const [data, setData] = React.useState<OperadorEx[]>([])
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Carga inicial + Realtime
  React.useEffect(() => {
    void load()
    const unsub = subscribeOperadores(() => { void silentReload() })
    return () => unsub()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const rows = await listOperadores()
      setData(rows as OperadorEx[])
    } catch (e) {
      console.error('Error cargando operadores', e)
    } finally {
      setLoading(false)
    }
  }

  async function silentReload() {
    try {
      const rows = await listOperadores()
      setData(rows as OperadorEx[])
    } catch {}
  }

  // Debounce búsqueda
  const searchTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => {
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      void doSearch(q)
    }, 350)
    return () => window.clearTimeout(searchTimer.current)
  }, [q])

  async function doSearch(term: string) {
    if (!term.trim()) return load()
    setLoading(true)
    try {
      const rows = await searchOperadores(term)
      setData(rows as OperadorEx[])
    } catch (e) {
      console.error('Error buscando', e)
    } finally {
      setLoading(false)
    }
  }

  // --- Estado del Modal (Sheet) ---
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<OperadorEx>(EMPTY_OPERADOR)
  const [isEditing, setIsEditing] = React.useState(false)

  // Limpia object URLs al cerrar
  React.useEffect(() => {
    if (!sheetOpen) {
      return () => {}
    }
    return () => {
      if (draft.licenciaUrl?.startsWith('blob:')) URL.revokeObjectURL(draft.licenciaUrl)
      if (draft.aptoMedicoUrl?.startsWith('blob:')) URL.revokeObjectURL(draft.aptoMedicoUrl)
    }
  }, [sheetOpen])

  // --- Lógica de Filtrado ---
  const filteredData = React.useMemo(() => {
    const query = q.toLowerCase()
    return data.filter(o => [o.id, o.nombre, o.numLicencia, o.estatus, o.rfc, o.curp].join(' ').toLowerCase().includes(query))
  }, [data, q])

  // --- Lógica CRUD ---
  function handleNew() {
    setIsEditing(false)
    setDraft({ ...EMPTY_OPERADOR, id: '' })
    setSheetOpen(true)
  }

  function handleEdit(operador: OperadorEx) {
    setIsEditing(true)
    setDraft(operador)
    setSheetOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar operador?')) return
    try {
      await deleteOperador(id)
    } catch (e) {
      console.error(e)
      alert('Error eliminando.')
    }
  }

  async function handleSave() {
    if (!draft.nombre || !draft.numLicencia || !draft.curp) {
      alert('Nombre, No. de Licencia y CURP son obligatorios.')
      return
    }
    const payload = {
      id: draft.id?.trim() || undefined,
      nombre: draft.nombre.trim(),
      numLicencia: draft.numLicencia.trim(),
      venceLicencia: draft.venceLicencia || null,
      expMedico: draft.expMedico || null,
      venceAptoMedico: draft.venceAptoMedico || null,
      rfc: draft.rfc?.trim().toUpperCase() || null,
      curp: draft.curp.trim().toUpperCase(),
      telefono: draft.telefono || null,
      nss: draft.nss || null,
      estatus: draft.estatus as any,
      licenciaUrl: draft.licenciaUrl || null,
      licenciaNombre: draft.licenciaNombre || null,
      aptoMedicoUrl: draft.aptoMedicoUrl || null,
      aptoMedicoNombre: draft.aptoMedicoNombre || null,
    }
    try {
      if (isEditing && payload.id) {
        await updateOperador(payload.id, payload)
      } else {
        const newId = await addOperador(payload)
        payload.id = newId
      }
      setSheetOpen(false)
      await load()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Error guardando.')
    }
  }

  async function handleExport() {
    if (!data.length) {
      alert('Sin operadores para exportar.')
      return
    }
    const rows = data.map(o => ({
      id: o.id,
      nombre: o.nombre,
      numLicencia: o.numLicencia,
      venceLicencia: o.venceLicencia || '',
      expMedico: o.expMedico || '',
      venceAptoMedico: o.venceAptoMedico || '',
      rfc: o.rfc || '',
      curp: o.curp,
      telefono: o.telefono || '',
      nss: o.nss || '',
      estatus: o.estatus,
      licenciaUrl: o.licenciaUrl || '',
      aptoMedicoUrl: o.aptoMedicoUrl || '',
    }))
    try {
      const XLSX = await import('@/utils/xlsx').then(m => m.getXLSX())
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Operadores')
      XLSX.writeFile(wb, 'ltr_operadores.xlsx')
    } catch (e) {
      console.error('Error exportando', e)
      alert('Error exportando.')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const XLSX = await import('@/utils/xlsx').then(m => m.getXLSX())
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.SheetNames[0]
      const json = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheet])
      const rows = json.map(r => ({
        nombre: r.nombre || r.Nombre,
        numLicencia: r.numLicencia || r.NoLicencia,
        curp: (r.curp || r.CURP || '').toUpperCase(),
        rfc: (r.rfc || r.RFC || null),
        estatus: r.estatus || 'Activo',
        venceLicencia: r.venceLicencia || null,
        venceAptoMedico: r.venceAptoMedico || null,
        expMedico: r.expMedico || null,
        telefono: r.telefono || null,
        nss: r.nss || null,
        licenciaUrl: r.licenciaUrl || null,
        aptoMedicoUrl: r.aptoMedicoUrl || null,
      })).filter(r => r.nombre && r.numLicencia && r.curp)
      await importOperadores(rows)
      await load()
      alert(`${rows.length} operadores importados.`)
    } catch (err) {
      console.error(err)
      alert('Error importando.')
    } finally {
      e.target.value = ''
    }
  }

  function handleFileChange(kind: 'licencia' | 'apto', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setDraft(d => {
      if (kind === 'licencia') {
        if (d.licenciaUrl?.startsWith('blob:')) URL.revokeObjectURL(d.licenciaUrl)
        return { ...d, licenciaUrl: url, licenciaNombre: file.name }
      } else {
        if (d.aptoMedicoUrl?.startsWith('blob:')) URL.revokeObjectURL(d.aptoMedicoUrl)
        return { ...d, aptoMedicoUrl: url, aptoMedicoNombre: file.name }
      }
    })
  }

  function openDoc(url?: string) {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
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
            <input type="file" className="hidden" id="opImport" accept=".xlsx,.xls" onChange={handleImport} />
            <Button variant="outline" className="gap-1" onClick={() => document.getElementById('opImport')?.click()}>
              <FileUp className="h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" className="gap-1" onClick={handleExport} disabled={!data.length}>
              <FileDown className="h-4 w-4" /> Exportar
            </Button>
          </div>
          {loading && <div className="text-xs text-muted-foreground">Cargando...</div>}
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
                            <AlertDialogAction onClick={() => o.id && handleDelete(o.id)}>Eliminar</AlertDialogAction>
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
                  <Input
                    id="opLicenciaFile"
                    type="file"
                    onChange={(e) => handleFileChange('licencia', e)}
                  />
                  <Input
                    placeholder="o pega URL pública (OneDrive/Drive)"
                    value={draft.licenciaUrl || ''}
                    onChange={(e) => setDraft(d => ({ ...d, licenciaUrl: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!draft.licenciaUrl}
                      onClick={() => openDoc(draft.licenciaUrl)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" /> Ver
                    </Button>
                    {draft.licenciaNombre && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={draft.licenciaNombre}>
                        {draft.licenciaNombre}
                      </span>
                    )}
                    {!draft.licenciaNombre && draft.licenciaUrl && !draft.licenciaUrl.startsWith('blob:') && (
                      <span className="text-xs text-muted-foreground italic">URL externa</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opAptoFile">Archivo Apto Médico</Label>
                  <Input
                    id="opAptoFile"
                    type="file"
                    onChange={(e) => handleFileChange('apto', e)}
                  />
                  <Input
                    placeholder="o pega URL pública (OneDrive/Drive)"
                    value={draft.aptoMedicoUrl || ''}
                    onChange={(e) => setDraft(d => ({ ...d, aptoMedicoUrl: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!draft.aptoMedicoUrl}
                      onClick={() => openDoc(draft.aptoMedicoUrl)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" /> Ver
                    </Button>
                    {draft.aptoMedicoNombre && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={draft.aptoMedicoNombre}>
                        {draft.aptoMedicoNombre}
                      </span>
                    )}
                    {!draft.aptoMedicoNombre && draft.aptoMedicoUrl && !draft.aptoMedicoUrl.startsWith('blob:') && (
                      <span className="text-xs text-muted-foreground italic">URL externa</span>
                    )}
                  </div>
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
