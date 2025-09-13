import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'




export type PermisionarioForm = {
  id: string
  razonSocial: string
  alias: string
  rfc: string
  estatus: 'Activo' | 'Inactivo'
  domicilio: string
  // Contactos
  opNombre: string;  opEmail: string;  opTel: string
  adNombre: string;  adEmail: string;  adTel: string
  coNombre: string;  coEmail: string;  coTel: string
  docs: DocRecord []
  unidades: Unidad[]
  operadores: Operador[]
}
// ---- Documentación: tipos y base ----
type DocKey =
  | 'acta'
  | 'poder'
  | 'comprobanteDomicilio'
  | 'constanciaFiscal'
  | 'ineRep'
  | 'contrato'

type DocRecord = {
  key: DocKey
  label: string
  url?: string      // puede ser un link pegado o un blob URL temporal
  fileName?: string // nombre del archivo subido
}
// ---- Unidades: tipos ----
export type Unidad = {
  id: string
  tarjetaNombre?: string
  tarjetaUrl?: string
  placas: string
  eco?: string
  tipo: string
  vencePoliza?: string // yyyy-mm-dd
  aseguradora?: string
  polizaNombre?: string
  polizaUrl?: string
  marca?: string
  anio?: number | ''
  permisoSCT?: string
}

// ---- Operadores: tipos ----
export type Operador = {
  id: string
  nombre: string
  numLicencia?: string
  licenciaUrl?: string
  licenciaNombre?: string
  venceLicencia?: string // yyyy-mm-dd
  aptoMedicoUrl?: string
  aptoMedicoNombre?: string
  venceAptoMedico?: string // yyyy-mm-dd
  rfc?: string
}


const DEFAULT_DOCS: DocRecord[] = [
  { key: 'acta',                label: 'Acta Constitutiva' },
  { key: 'poder',               label: 'Poder Rep. Legal' },
  { key: 'comprobanteDomicilio',label: 'Comprobante de Domicilio' },
  { key: 'constanciaFiscal',    label: 'Constancia de Situación Fiscal' },
  { key: 'ineRep',              label: 'INE Rep. Legal' },
  { key: 'contrato',            label: 'Contrato' },
]


export interface PermisionarioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue?: Partial<PermisionarioForm> | null
  onSave?: (data: PermisionarioForm) => void
}

const EMPTY: PermisionarioForm = {
  id: '',
  razonSocial: '',
  alias: '',
  rfc: '',
  estatus: 'Activo',
  domicilio: '',
  opNombre: '', opEmail: '', opTel: '',
  adNombre: '', adEmail: '', adTel: '',
  coNombre: '', coEmail: '', coTel: '',
  docs: DEFAULT_DOCS.map(d => ({ ...d })),
  unidades: [],
  operadores: [],
}

export default function PermisionarioModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: PermisionarioModalProps) {

  const [tab, setTab] = React.useState<'datos' | 'docs' | 'unidades' | 'operadores'>('datos')
  const [form, setForm] = React.useState<PermisionarioForm>({ ...EMPTY })

  React.useEffect(() => {
    if (!open) return
    setTab('datos')
    setForm((prev) => ({
      ...EMPTY,
      ...initialValue,
      id: initialValue?.id ?? prev.id ?? '',
      estatus: (initialValue?.estatus as any) ?? 'Activo',
      docs: initialValue?.docs?.length ? initialValue.docs as DocRecord[] : DEFAULT_DOCS.map(d => ({ ...d })),
      unidades: Array.isArray((initialValue as any)?.unidades) ? (initialValue as any).unidades : [],
      operadores: Array.isArray((initialValue as any)?.operadores) ? (initialValue as any)?.operadores : [],
    }))
  }, [open, initialValue])

  const update = <K extends keyof PermisionarioForm>(k: K) =>
    (v: PermisionarioForm[K]) =>
      setForm((f) => ({ ...f, [k]: v }))

  function handleSave() {
    const payload: PermisionarioForm = {
      ...form,
      rfc: form.rfc.trim().toUpperCase(),
      razonSocial: form.razonSocial.trim(),
      alias: form.alias.trim(),
    }
    onSave?.(payload)
    onOpenChange(false)
  }
  function setDocUrl(key: DocKey, url?: string, fileName?: string) {
    setForm((f) => ({
      ...f,
      docs: f.docs.map(d => d.key === key ? { ...d, url, fileName } : d)
    }))
  }
  
  function onFileChange(key: DocKey, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setDocUrl(key, blobUrl, file.name)
  }
  
  function onPasteUrl(key: DocKey, e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.trim()
    setDocUrl(key, v || undefined, v ? undefined : undefined)
  }
  
  function clearDoc(key: DocKey) {
    setDocUrl(key, undefined, undefined)
  }
  // ---- Helpers de Unidades ----
  function nextUnidadId(list: Unidad[]) {
    const max = list.reduce((m, u) => {
      const mm = (u.id || '').match(/^U-(\d+)$/)
      const n = mm ? parseInt(mm[1], 10) : 0
      return n > m ? n : m
    }, 0)
    return `U-${String(max + 1).padStart(4, '0')}`
  }

  // ---- Helpers de Operadores ----
  function nextOperadorId(list: Operador[]) {
    const max = list.reduce((m, op) => {
      const mm = (op.id || '').match(/^OP-(\d+)$/)
      const n = mm ? parseInt(mm[1], 10) : 0
      return n > m ? n : m
    }, 0)
    return `OP-${String(max + 1).padStart(4, '0')}`
  }

  const emptyUnidad: Unidad = {
    id: '',
    placas: '',
    eco: '',
    tipo: '',
    aseguradora: '',
    vencePoliza: '',
    marca: '',
    anio: '',
    permisoSCT: '',
  }

  const emptyOperador: Operador = {
    id: '',
    nombre: '',
    numLicencia: '',
    venceLicencia: '',
    venceAptoMedico: '',
    rfc: '',
  }

  const [unitOpen, setUnitOpen] = React.useState(false)
  const [unitDraft, setUnitDraft] = React.useState<Unidad>(emptyUnidad)
  const [unitIndex, setUnitIndex] = React.useState<number | null>(null) // null = nueva, number = edición

  const [opOpen, setOpOpen] = React.useState(false)
  const [opDraft, setOpDraft] = React.useState<Operador>(emptyOperador)
  const [opIndex, setOpIndex] = React.useState<number | null>(null) // null = nuevo, number = edición

  function openNewUnidad() {
  setUnitIndex(null)
  setUnitDraft({ ...emptyUnidad, id: nextUnidadId(form.unidades) })
  setUnitOpen(true)
  }

  function openEditUnidad(idx: number) {
  setUnitIndex(idx)
  setUnitDraft({ ...form.unidades[idx] })
  setUnitOpen(true)
  }

  function saveUnidad() {
  setForm((f) => {
    const list = [...f.unidades]
    if (unitIndex === null) list.push(unitDraft)
    else list[unitIndex] = unitDraft
    return { ...f, unidades: list }
  })
  setUnitOpen(false)
  setUnitIndex(null)
  }

  function deleteUnidad(idx: number) {
  setForm((f) => ({ ...f, unidades: f.unidades.filter((_, i) => i !== idx) }))
  }

  // file/url handlers
  function onUnidadTarjetaFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const blobUrl = URL.createObjectURL(file)
  setUnitDraft((u) => ({ ...u, tarjetaUrl: blobUrl, tarjetaNombre: file.name }))
  }
  function onUnidadPolizaFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  const blobUrl = URL.createObjectURL(file)
  setUnitDraft((u) => ({ ...u, polizaUrl: blobUrl, polizaNombre: file.name }))
  }

  function openNewOperador() {
    setOpIndex(null)
    setOpDraft({ ...emptyOperador, id: nextOperadorId(form.operadores) })
    setOpOpen(true)
  }

  function openEditOperador(idx: number) {
    setOpIndex(idx)
    setOpDraft({ ...form.operadores[idx] })
    setOpOpen(true)
  }

  function saveOperador() {
    if (!opDraft.nombre) {
      alert('El nombre del operador es obligatorio.')
      return
    }
    setForm((f) => {
      const list = [...f.operadores]
      if (opIndex === null) list.push(opDraft)
      else list[opIndex] = opDraft
      return { ...f, operadores: list }
    })
    setOpOpen(false)
  }

  function deleteOperador(idx: number) {
    if (window.confirm('¿Estás seguro de que quieres eliminar este operador?')) {
      setForm((f) => ({ ...f, operadores: f.operadores.filter((_, i) => i !== idx) }))
    }
  }

  function onOperadorLicenciaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setOpDraft((op) => ({ ...op, licenciaUrl: blobUrl, licenciaNombre: file.name }))
  }

  function onOperadorAptoMedicoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setOpDraft((op) => ({ ...op, aptoMedicoUrl: blobUrl, aptoMedicoNombre: file.name }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* ancho tipo cliente: más generoso en xl */}
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0">
        <div className="flex h-full flex-col min-h-0">
          {/* Header */}
          <div className="px-6 py-5">
            <SheetHeader className="text-left">
              <SheetTitle>Agregar Permisionario</SheetTitle>
              <SheetDescription>Completa los datos del permisionario. Puedes navegar entre pestañas.</SheetDescription>
            </SheetHeader>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex flex-1 flex-col min-h-0">
            <div className="px-6 pt-4">
              <TabsList>
                <TabsTrigger value="datos">Datos Generales</TabsTrigger>
                <TabsTrigger value="docs">Documentación</TabsTrigger>
                <TabsTrigger value="unidades">Unidades</TabsTrigger>
                <TabsTrigger value="operadores">Operadores</TabsTrigger>
              </TabsList>
            </div>

            {/* CONTENIDO PESTAÑAS */}
            {/* padding amplio y pb para que no choque con el footer */}
            <div className="flex-1 overflow-auto px-6 py-4 pb-24 space-y-6">
              {/* DATOS GENERALES */}
              <TabsContent value="datos" className="m-0 space-y-6">
                {/* ID / RFC / Razón social / Alias */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="id">ID</Label>
                    <Input id="id" value={form.id} onChange={(e) => update('id')(e.target.value)} placeholder="LTR-PR-0001" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input id="rfc" value={form.rfc} onChange={(e) => update('rfc')(e.target.value)} placeholder="XXXX010101XXX" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razon">Nombre / Razón social</Label>
                    <Input id="razon" value={form.razonSocial} onChange={(e) => update('razonSocial')(e.target.value)} placeholder="Permisionario S.A. de C.V." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias</Label>
                    <Input id="alias" value={form.alias} onChange={(e) => update('alias')(e.target.value)} placeholder="Alias comercial" />
                  </div>
                </div>

                {/* Estatus / Domicilio */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="estatus">Estatus</Label>
                    <Select value={form.estatus} onValueChange={(v) => update('estatus')(v as 'Activo' | 'Inactivo')}>
                      <SelectTrigger id="estatus">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domicilio">Domicilio</Label>
                    <Input id="domicilio" value={form.domicilio} onChange={(e) => update('domicilio')(e.target.value)} placeholder="Calle, número, colonia, CP, ciudad, estado" />
                  </div>
                </div>

                {/* Contactos */}
                <h3 className="text-base font-semibold">Contactos</h3>

                {/* Operaciones */}
                <div className="space-y-2">
                  <Label>Operaciones</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input placeholder="Nombre" value={form.opNombre} onChange={(e) => update('opNombre')(e.target.value)} />
                    <Input type="email" placeholder="Email" value={form.opEmail} onChange={(e) => update('opEmail')(e.target.value)} />
                    <Input placeholder="Tel." value={form.opTel} onChange={(e) => update('opTel')(e.target.value)} />
                  </div>
                </div>

                {/* Administración */}
                <div className="space-y-2">
                  <Label>Administración</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input placeholder="Nombre" value={form.adNombre} onChange={(e) => update('adNombre')(e.target.value)} />
                    <Input type="email" placeholder="Email" value={form.adEmail} onChange={(e) => update('adEmail')(e.target.value)} />
                    <Input placeholder="Tel." value={form.adTel} onChange={(e) => update('adTel')(e.target.value)} />
                  </div>
                </div>

                {/* Comercial */}
                <div className="space-y-2">
                  <Label>Comercial</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input placeholder="Nombre" value={form.coNombre} onChange={(e) => update('coNombre')(e.target.value)} />
                    <Input type="email" placeholder="Email" value={form.coEmail} onChange={(e) => update('coEmail')(e.target.value)} />
                    <Input placeholder="Tel." value={form.coTel} onChange={(e) => update('coTel')(e.target.value)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="m-0 space-y-4">
                <h3 className="text-base font-semibold">Documentación</h3>

                <div className="overflow-x-auto rounded border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left">Documento</th>
                        <th className="px-3 py-2 text-left">Estatus</th>
                        <th className="px-3 py-2 text-left">Archivo / URL</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.docs.map((d) => {
                        const hasDoc = !!d.url
                        return (
                          <tr key={d.key} className="border-t align-top">
                            <td className="px-3 py-2">{d.label}</td>

                            <td className="px-3 py-2">
                              {hasDoc ? '✅ Sí' : '❌ No'}
                              {d.fileName ? <div className="text-xs text-muted-foreground mt-1">{d.fileName}</div> : null}
                            </td>

                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-2">
                                {/* subir archivo */}
                                <Input
                                  type="file"
                                  onChange={(e) => onFileChange(d.key, e)}
                                />
                                {/* o pegar URL (Drive/OneDrive, etc.) */}
                                <Input
                                  placeholder="Pega un enlace (Drive/OneDrive/URL pública)"
                                  value={d.url ?? ''}
                                  onChange={(e) => onPasteUrl(d.key, e)}
                                />
                              </div>
                            </td>

                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    if (!d.url) return
                                    window.open(d.url, '_blank', 'noopener,noreferrer')
                                  }}
                                  disabled={!d.url}
                                >
                                  Ver
                                </Button>
                                <Button variant="outline" onClick={() => clearDoc(d.key)}>
                                  Limpiar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                     </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sugerencia: utiliza enlaces permanentes (Drive/OneDrive) para conservar la referencia del documento. Los archivos subidos aquí se
                  previsualizan con una URL temporal del navegador.
                </p>
              </TabsContent>


              <TabsContent value="unidades" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Unidades</h3>
                  <Button onClick={openNewUnidad}>+ Agregar Unidad</Button>
                </div>

                <div className="overflow-x-auto rounded border" style={{ maxHeight: 300 }}>
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Tarj. Circulación</th>
                        <th className="px-3 py-2 text-left">Placas</th>
                        <th className="px-3 py-2 text-left">Eco</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Venc. Póliza</th>
                        <th className="px-3 py-2 text-left">Aseguradora</th>
                        <th className="px-3 py-2 text-left">Marca</th>
                        <th className="px-3 py-2 text-left">Año</th>
                        <th className="px-3 py-2 text-left">Permiso SCT</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.unidades.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-muted-foreground" colSpan={10}>Sin unidades registradas.</td>
                        </tr>
                      ) : (
                        form.unidades.map((u, i) => (
                          <tr key={u.id} className="border-t align-top">
                            <td className="px-3 py-2">
                              {u.tarjetaUrl ? (
                                <Button variant="outline" size="sm" onClick={() => window.open(u.tarjetaUrl!, '_blank', 'noopener,noreferrer')}>
                                  Ver
                                </Button>
                              ) : '—'}
                              {u.tarjetaNombre ? <div className="text-xs text-muted-foreground mt-1">{u.tarjetaNombre}</div> : null}
                            </td>
                            <td className="px-3 py-2">{u.placas || '—'}</td>
                            <td className="px-3 py-2">{u.eco || '—'}</td>
                            <td className="px-3 py-2">{u.tipo || '—'}</td>
                            <td className="px-3 py-2">{u.vencePoliza || '—'}</td>
                            <td className="px-3 py-2">{u.aseguradora || '—'}</td>
                            <td className="px-3 py-2">{u.marca || '—'}</td>
                            <td className="px-3 py-2">{u.anio || '—'}</td>
                            <td className="px-3 py-2">{u.permisoSCT || '—'}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditUnidad(i)}>Editar</Button>
                                <Button variant="outline" size="sm" onClick={() => deleteUnidad(i)}>Eliminar</Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Dialog de Alta/Edición de Unidad */}
                <div>
                  {/* Usa tu diálogo favorito de shadcn; aquí con Dialog */}
                  {/* Si no lo tienes, puedes usar Sheet/AlertDialog. */}
                </div>
              </TabsContent>


              <TabsContent value="operadores" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Operadores</h3>
                  <Button onClick={openNewOperador}>+ Agregar Operador</Button>
                </div>

                <div className="overflow-x-auto rounded border" style={{ maxHeight: 300 }}>
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Licencia</th>
                        <th className="px-3 py-2 text-left">Venc. Licencia</th>
                        <th className="px-3 py-2 text-left">Apto Médico</th>
                        <th className="px-3 py-2 text-left">Venc. Apto Médico</th>
                        <th className="px-3 py-2 text-left">RFC</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.operadores.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-muted-foreground" colSpan={7}>Sin operadores registrados.</td>
                        </tr>
                      ) : (
                        form.operadores.map((op, i) => (
                          <tr key={op.id} className="border-t align-top">
                            <td className="px-3 py-2">{op.nombre || '—'}</td>
                            <td className="px-3 py-2">
                              {op.licenciaUrl ? (
                                <Button variant="outline" size="sm" onClick={() => window.open(op.licenciaUrl!, '_blank', 'noopener,noreferrer')}>
                                  Ver
                                </Button>
                              ) : '—'}
                              {op.licenciaNombre ? <div className="text-xs text-muted-foreground mt-1">{op.licenciaNombre}</div> : null}
                            </td>
                            <td className="px-3 py-2">{op.venceLicencia || '—'}</td>
                            <td className="px-3 py-2">
                              {op.aptoMedicoUrl ? (
                                <Button variant="outline" size="sm" onClick={() => window.open(op.aptoMedicoUrl!, '_blank', 'noopener,noreferrer')}>
                                  Ver
                                </Button>
                              ) : '—'}
                              {op.aptoMedicoNombre ? <div className="text-xs text-muted-foreground mt-1">{op.aptoMedicoNombre}</div> : null}
                            </td>
                            <td className="px-3 py-2">{op.venceAptoMedico || '—'}</td>
                            <td className="px-3 py-2">{op.rfc || '—'}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditOperador(i)}>Editar</Button>
                                <Button variant="outline" size="sm" onClick={() => deleteOperador(i)}>Eliminar</Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Dialog de Alta/Edición de Operador */}
                <div>
                  {/* Usa tu diálogo favorito de shadcn; aquí con Dialog */}
                  {/* Si no lo tienes, puedes usar Sheet/AlertDialog. */}
                </div>
              </TabsContent>
            </div>

            <Separator />

            {/* Footer sticky con borde y fondo */}
            <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t bg-background">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </div>
          </Tabs>
        </div>
        {/* Bottom Sheet: Alta/Edición de Unidad */}
<Sheet open={unitOpen} onOpenChange={setUnitOpen}>
  <SheetContent
    side="bottom"
    className="w-full max-w-none p-0 rounded-t-2xl border-t shadow-2xl"
  >
    <div className="flex h-[85vh] flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SheetHeader className="text-left">
          <SheetTitle>
            {unitIndex === null ? 'Alta de Unidad Vehicular' : `Editar Unidad ${unitDraft.id}`}
          </SheetTitle>
          <SheetDescription>
            Captura o actualiza los datos de la unidad.
          </SheetDescription>
        </SheetHeader>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta de circulación: archivo + URL */}
          <div className="space-y-2">
            <Label>Tarjeta de Circulación*</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onUnidadTarjetaFile} />
            <Input
              placeholder="o pega una URL pública (Drive/OneDrive)"
              value={unitDraft.tarjetaUrl || ''}
              onChange={(e) =>
                setUnitDraft((u) => ({ ...u, tarjetaUrl: e.target.value || undefined }))
              }
            />
            {unitDraft.tarjetaNombre ? (
              <div className="text-xs text-muted-foreground">Archivo: {unitDraft.tarjetaNombre}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uPlacas">Placas*</Label>
            <Input
              id="uPlacas"
              value={unitDraft.placas}
              onChange={(e) =>
                setUnitDraft((u) => ({ ...u, placas: e.target.value.toUpperCase() }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uEco">Eco</Label>
            <Input
              id="uEco"
              value={unitDraft.eco || ''}
              onChange={(e) => setUnitDraft((u) => ({ ...u, eco: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uTipo">Tipo*</Label>
            <Select
              value={unitDraft.tipo || ''}
              onValueChange={(v) => setUnitDraft((u) => ({ ...u, tipo: v }))}
            >
              <SelectTrigger id="uTipo">
                <SelectValue placeholder="Seleccione…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tractor">Tractor</SelectItem>
                <SelectItem value='Unidad seca 53"'>Unidad seca 53"</SelectItem>
                <SelectItem value='Refrigerada 53"'>Refrigerada 53"</SelectItem>
                <SelectItem value="Thorton">Thorton</SelectItem>
                <SelectItem value="3.5">3.5</SelectItem>
                <SelectItem value="Torton">Torton</SelectItem>
                <SelectItem value="Rabón">Rabón</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uAseguradora">Aseguradora</Label>
            <Input
              id="uAseguradora"
              value={unitDraft.aseguradora || ''}
              onChange={(e) => setUnitDraft((u) => ({ ...u, aseguradora: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uVencePoliza">Vencimiento Póliza</Label>
            <Input
              id="uVencePoliza"
              type="date"
              value={unitDraft.vencePoliza || ''}
              onChange={(e) => setUnitDraft((u) => ({ ...u, vencePoliza: e.target.value }))}
            />
          </div>

          {/* Póliza: archivo + URL */}
          <div className="space-y-2 md:col-span-2">
            <Label>Póliza de Seguro</Label>
            <Input type="file" accept="application/pdf,image/*" onChange={onUnidadPolizaFile} />
            <Input
              placeholder="o pega una URL pública de la póliza"
              value={unitDraft.polizaUrl || ''}
              onChange={(e) =>
                setUnitDraft((u) => ({ ...u, polizaUrl: e.target.value || undefined }))
              }
            />
            {unitDraft.polizaNombre ? (
              <div className="text-xs text-muted-foreground">Archivo: {unitDraft.polizaNombre}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uMarca">Marca</Label>
            <Input
              id="uMarca"
              value={unitDraft.marca || ''}
              onChange={(e) => setUnitDraft((u) => ({ ...u, marca: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uAnio">Año</Label>
            <Input
              id="uAnio"
              type="number"
              min={1980}
              max={2100}
              value={unitDraft.anio ?? ''}
              onChange={(e) =>
                setUnitDraft((u) => ({
                  ...u,
                  anio: e.target.value ? Number(e.target.value) : '',
                }))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="uPermisoSCT">Permiso SCT</Label>
            <Input
              id="uPermisoSCT"
              value={unitDraft.permisoSCT || ''}
              onChange={(e) => setUnitDraft((u) => ({ ...u, permisoSCT: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Footer sticky */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setUnitOpen(false)}>
          Cancelar
        </Button>
        <Button onClick={saveUnidad}>Guardar</Button>
      </div>
    </div>
  </SheetContent>
</Sheet>        

{/* Bottom Sheet: Alta/Edición de Operador */}
<Sheet open={opOpen} onOpenChange={setOpOpen}>
  <SheetContent
    side="bottom"
    className="w-full max-w-none p-0 rounded-t-2xl border-t shadow-2xl"
  >
    <div className="flex h-[85vh] flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SheetHeader className="text-left">
          <SheetTitle>
            {opIndex === null ? 'Alta de Operador' : `Editar Operador ${opDraft.id}`}
          </SheetTitle>
          <SheetDescription>
            Captura o actualiza los datos del operador.
          </SheetDescription>
        </SheetHeader>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opNombre">Nombre*</Label>
            <Input
              id="opNombre"
              value={opDraft.nombre}
              onChange={(e) =>
                setOpDraft((op) => ({ ...op, nombre: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opNumLicencia">Número de Licencia</Label>
            <Input
              id="opNumLicencia"
              value={opDraft.numLicencia || ''}
              onChange={(e) => setOpDraft((op) => ({ ...op, numLicencia: e.target.value }))}
            />
          </div>

          {/* Licencia: archivo + URL */}
          <div className="space-y-2">
            <Label>Licencia*</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onOperadorLicenciaFile} />
            <Input
              placeholder="o pega una URL pública (Drive/OneDrive)"
              value={opDraft.licenciaUrl || ''}
              onChange={(e) =>
                setOpDraft((op) => ({ ...op, licenciaUrl: e.target.value || undefined }))
              }
            />
            {opDraft.licenciaNombre ? (
              <div className="text-xs text-muted-foreground">Archivo: {opDraft.licenciaNombre}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opVenceLicencia">Vencimiento Licencia</Label>
            <Input
              id="opVenceLicencia"
              type="date"
              value={opDraft.venceLicencia || ''}
              onChange={(e) => setOpDraft((op) => ({ ...op, venceLicencia: e.target.value }))}
            />
          </div>

          {/* Apto Médico: archivo + URL */}
          <div className="space-y-2">
            <Label>Apto Médico</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onOperadorAptoMedicoFile} />
            <Input
              placeholder="o pega una URL pública (Drive/OneDrive)"
              value={opDraft.aptoMedicoUrl || ''}
              onChange={(e) =>
                setOpDraft((op) => ({ ...op, aptoMedicoUrl: e.target.value || undefined }))
              }
            />
            {opDraft.aptoMedicoNombre ? (
              <div className="text-xs text-muted-foreground">Archivo: {opDraft.aptoMedicoNombre}</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="opVenceAptoMedico">Vencimiento Apto Médico</Label>
            <Input
              id="opVenceAptoMedico"
              type="date"
              value={opDraft.venceAptoMedico || ''}
              onChange={(e) => setOpDraft((op) => ({ ...op, venceAptoMedico: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opRfc">RFC</Label>
            <Input
              id="opRfc"
              value={opDraft.rfc || ''}
              onChange={(e) => setOpDraft((op) => ({ ...op, rfc: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Footer sticky */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => setOpOpen(false)}>
          Cancelar
        </Button>
        <Button onClick={saveOperador}>Guardar</Button>
      </div>
    </div>
  </SheetContent>
</Sheet>
      </SheetContent>
    </Sheet>
  )
}
