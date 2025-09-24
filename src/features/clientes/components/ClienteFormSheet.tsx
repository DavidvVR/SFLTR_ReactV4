import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Folder, Eye, Trash2, Pencil } from 'lucide-react'
import type { DocKey, Tarifa as TarifaModel, Cliente } from '@/features/clientes/clientesLocal'
import { addCliente, updateCliente } from '@/features/clientes/clientesSupabase'

type ClienteErrors = { nombre?: string; estatus?: string; rfc?: string }

const MX_STATES = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Coahuila','Colima','Chiapas','Chihuahua',
  'Ciudad de México','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','Estado de México','Michoacán','Morelos',
  'Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco',
  'Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]
const UNIT_TYPES = ['Unidad seca de 53"', 'Refrigerada de 53"', 'Thorton', '3.5']
const RFC_REGEX = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{2})([A\d])$/i

const STATE_ABBR: Record<string, string> = {
  Aguascalientes: 'AGS', 'Baja California': 'BC', 'Baja California Sur': 'BCS', Campeche: 'CAM',
  Coahuila: 'COAH', Colima: 'COL', Chiapas: 'CHIS', Chihuahua: 'CHIH', 'Ciudad de México': 'CDMX',
  Durango: 'DGO', Guanajuato: 'GTO', Guerrero: 'GRO', Hidalgo: 'HGO', Jalisco: 'JAL',
  'Estado de México': 'MEX', Michoacán: 'MICH', Morelos: 'MOR', Nayarit: 'NAY', 'Nuevo León': 'NL',
  Oaxaca: 'OAX', Puebla: 'PUE', Querétaro: 'QRO', 'Quintana Roo': 'QROO', 'San Luis Potosí': 'SLP',
  Sinaloa: 'SIN', Sonora: 'SON', Tabasco: 'TAB', Tamaulipas: 'TAMPS', Tlaxcala: 'TLAX',
  Veracruz: 'VER', Yucatán: 'YUC', Zacatecas: 'ZAC',
}
function abbrState(n: string) { return STATE_ABBR[n] ?? n }

export interface ClienteFormValues {
  id?: string
  nombre: string
  estatus: 'Activo' | 'Inactivo'
  rfc?: string
  direccion?: string
  contactos?: {
    operaciones?: { nombre?: string; email?: string; tel?: string }
    administracion?: { nombre?: string; email?: string; tel?: string }
    comercial?: { nombre?: string; email?: string; tel?: string }
  }
  docs?: Record<DocKey, boolean>
  tarifas: TarifaModel[]
  comentarios?: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialValue?: Cliente | null
}

export function ClienteFormContainer(props: Props) {
  async function onSave(data: ClienteFormValues) {
    if (data.id) {
      await updateCliente(data.id, {
        nombre: data.nombre,
        estatus: data.estatus,
        rfc: data.rfc?.toUpperCase(),
        direccion: data.direccion ?? undefined,
        contactos: data.contactos ?? {},
        docs: data.docs ?? { acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false },
        tarifas: data.tarifas ?? [],
        comentarios: data.comentarios ?? '',
      })
    } else {
      await addCliente({
        nombre: data.nombre,
        estatus: data.estatus,
        rfc: data.rfc?.toUpperCase(),
        direccion: data.direccion ?? undefined,
        contactos: data.contactos ?? {},
        docs: data.docs ?? { acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false },
        tarifas: data.tarifas ?? [],
        comentarios: data.comentarios ?? '',
      })
    }
  }

  return <ClienteFormSheet {...props} onSave={onSave} />
}

export default function ClienteFormSheet({ open, onOpenChange, initialValue, onSave }: Props) {
  const isEditing = !!initialValue?.id
  const [isSaving, setIsSaving] = React.useState(false)

  // Avisos inline
  const [flash, setFlash] = React.useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  function showFlash(type: 'success' | 'error', msg: string) {
    setFlash({ type, msg }); window.setTimeout(() => setFlash(null), 2500)
  }

  // Datos generales
  const [nombre, setNombre] = React.useState('')
  const [estatus, setEstatus] = React.useState<'Activo' | 'Inactivo'>('Activo')
  const [rfc, setRfc] = React.useState('')
  const [direccion, setDireccion] = React.useState('')
  const [opNombre, setOpNombre] = React.useState('')
  const [opEmail, setOpEmail] = React.useState('')
  const [opTel, setOpTel] = React.useState('')
  const [adNombre, setAdNombre] = React.useState('')
  const [adEmail, setAdEmail] = React.useState('')
  const [adTel, setAdTel] = React.useState('')
  const [coNombre, setCoNombre] = React.useState('')
  const [coEmail, setCoEmail] = React.useState('')
  const [coTel, setCoTel] = React.useState('')
  const [errors, setErrors] = React.useState<ClienteErrors>({})

  // Documentación
  const [docsFiles, setDocsFiles] = React.useState<Record<DocKey, File | null>>({
    acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null,
  })
  const [docsFlags, setDocsFlags] = React.useState<Record<DocKey, boolean>>({
    acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false,
  })
  const fileRefs = React.useRef<Record<DocKey, HTMLInputElement | null>>({
    acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null,
  })
  function clickFile(key: DocKey) { fileRefs.current[key]?.click() }
  function onChangeFile(key: DocKey, f: File | null) {
    setDocsFiles((prev) => ({ ...prev, [key]: f }))
    setDocsFlags((prev) => ({ ...prev, [key]: !!f }))
  }
  function viewFile(key: DocKey) {
    const f = docsFiles[key]; if (!f) return
    const url = URL.createObjectURL(f)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Tarifas
  const [tarifas, setTarifas] = React.useState<TarifaModel[]>([])
  const [openTarifa, setOpenTarifa] = React.useState(false)
  const [editingTarifaId, setEditingTarifaId] = React.useState<string | null>(null)
  const [estadoOrigen, setEstadoOrigen] = React.useState('')
  const [municipioOrigen, setMunicipioOrigen] = React.useState('')
  const [estadoDestino, setEstadoDestino] = React.useState('')
  const [municipioDestino, setMunicipioDestino] = React.useState('')
  const [tipoUnidad, setTipoUnidad] = React.useState('')
  const [diasCredito, setDiasCredito] = React.useState<number | ''>('')
  const [kmRecorrer, setKmRecorrer] = React.useState<number | ''>('')
  const [tarifa, setTarifa] = React.useState<number | ''>('')

  function genId() {
    try { return crypto.randomUUID() }
    catch { return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` }
  }

  function resetTarifaForm() {
    setEstadoOrigen(''); setMunicipioOrigen(''); setEstadoDestino(''); setMunicipioDestino('')
    setTipoUnidad(''); setDiasCredito(''); setKmRecorrer(''); setTarifa(''); setEditingTarifaId(null)
  }
  function startEditTarifa(id: string) {
    const t = tarifas.find((x) => x.id === id); if (!t) return
    setEstadoOrigen(t.estadoOrigen); setMunicipioOrigen(t.municipioOrigen ?? '')
    setEstadoDestino(t.estadoDestino); setMunicipioDestino(t.municipioDestino ?? '')
    setTipoUnidad(t.tipoUnidad); setDiasCredito(typeof t.diasCredito === 'number' ? t.diasCredito : '')
    setKmRecorrer(typeof t.kmRecorrer === 'number' ? t.kmRecorrer : ''); setTarifa(t.tarifa)
    setEditingTarifaId(t.id); setOpenTarifa(true)
  }
  function handleAddTarifa(e: React.FormEvent) {
    e.preventDefault()
    if (!estadoOrigen || !estadoDestino || !tipoUnidad || tarifa === '' || Number(tarifa) < 0) {
      showFlash('error', 'Completa los campos requeridos de la tarifa.'); return
    }
    const payload: TarifaModel = {
      id: editingTarifaId ?? genId(),
      estadoOrigen, municipioOrigen: municipioOrigen || undefined,
      estadoDestino, municipioDestino: municipioDestino || undefined,
      tipoUnidad, diasCredito: diasCredito === '' ? undefined : Number(diasCredito),
      kmRecorrer: kmRecorrer === '' ? undefined : Number(kmRecorrer),
      tarifa: Number(tarifa),
    }
    setTarifas((prev) => editingTarifaId ? prev.map((t) => t.id === editingTarifaId ? payload : t) : [payload, ...prev])
    setOpenTarifa(false); resetTarifaForm(); showFlash('success', 'Tarifa guardada.')
  }
  function handleDeleteTarifa(id: string) {
    setTarifas((p) => p.filter((t) => t.id !== id)); showFlash('success', 'Tarifa eliminada.')
  }

  const [comentarios, setComentarios] = React.useState('')

  function resetForm() {
    setNombre(''); setEstatus('Activo'); setRfc(''); setDireccion('')
    setOpNombre(''); setOpEmail(''); setOpTel('')
    setAdNombre(''); setAdEmail(''); setAdTel('')
    setCoNombre(''); setCoEmail(''); setCoTel('')
    setDocsFiles({ acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null })
    setDocsFlags({ acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false })
    setTarifas([]); setComentarios(''); setErrors({})
  }

  React.useEffect(() => {
    if (!open) return
    if (initialValue) {
      setNombre(initialValue.nombre)
      setEstatus(initialValue.estatus)
      setRfc(initialValue.rfc || '')
      setDireccion(initialValue.direccion || '')
      setOpNombre(initialValue.contactos?.operaciones?.nombre || '')
      setOpEmail(initialValue.contactos?.operaciones?.email || '')
      setOpTel(initialValue.contactos?.operaciones?.tel || '')
      setAdNombre(initialValue.contactos?.administracion?.nombre || '')
      setAdEmail(initialValue.contactos?.administracion?.email || '')
      setAdTel(initialValue.contactos?.administracion?.tel || '')
      setCoNombre(initialValue.contactos?.comercial?.nombre || '')
      setCoEmail(initialValue.contactos?.comercial?.email || '')
      setCoTel(initialValue.contactos?.comercial?.tel || '')
      setDocsFlags({
        acta: !!initialValue.docs?.acta, poder: !!initialValue.docs?.poder, compDomicilio: !!initialValue.docs?.compDomicilio,
        csf: !!initialValue.docs?.csf, ine: !!initialValue.docs?.ine, contrato: !!initialValue.docs?.contrato,
      })
      setDocsFiles({ acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null })
      setTarifas(initialValue.tarifas ?? [])
      setComentarios(initialValue.comentarios ?? '')
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function validateCliente(): ClienteErrors {
    const next: ClienteErrors = {}
    if (!nombre.trim()) next.nombre = 'El nombre/razón social es requerido.'
    if (!estatus) next.estatus = 'Selecciona un estatus.'
    if (rfc && !RFC_REGEX.test(rfc.trim())) next.rfc = 'RFC no tiene un formato válido.'
    return next
  }

  function handleCancel() { onOpenChange(false); setFlash(null) }

  async function handleSave() {
    const v = validateCliente()
    setErrors(v)
    if (v.nombre || v.estatus || v.rfc) { showFlash('error', 'Corrige los campos requeridos.'); return }
    const payload: ClienteFormValues = {
      id: initialValue?.id,
      nombre, estatus,
      rfc: rfc || undefined,
      direccion: direccion || undefined,
      contactos: {
        operaciones: { nombre: opNombre || '', email: opEmail || '', tel: opTel || '' },
        administracion: { nombre: adNombre || '', email: adEmail || '', tel: adTel || '' },
        comercial: { nombre: coNombre || '', email: coEmail || '', tel: coTel || '' },
      },
      docs: {
        acta: docsFlags.acta, poder: docsFlags.poder, compDomicilio: docsFlags.compDomicilio,
        csf: docsFlags.csf, ine: docsFlags.ine, contrato: docsFlags.contrato,
      },
      tarifas, comentarios: comentarios || '',
    }
    try {
      setIsSaving(true)
      await Promise.resolve(onSave(payload)) // soporta onSave async o sync
      showFlash('success', 'Cliente guardado.')
      onOpenChange(false)
    } catch (e: any) {
      showFlash('error', e?.message || 'Error al guardar.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
              <SheetDescription>Completa los datos generales, documentación y tarifas.</SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </div>
          {flash && (
            <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${flash.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'}`}>
              {flash.msg}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="px-6 pb-6 pt-4 flex h-[calc(100vh-6rem)] flex-col">
          <Tabs defaultValue="datos" className="flex flex-1 flex-col">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="datos">Datos Generales</TabsTrigger>
              <TabsTrigger value="docs">Documentación</TabsTrigger>
              <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
              <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
            </TabsList>

            {/* DATOS GENERALES */}
            <TabsContent value="datos" className="flex-1 overflow-y-auto">
              <form className="space-y-6 py-4" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
                <section className="space-y-4">
                  <h3 className="text-base font-semibold">Datos Generales</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inpNombre">Nombre / Razón Social</Label>
                      <Input id="inpNombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Transportes y Logística Roque" required aria-invalid={!!errors.nombre} />
                      {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="selEstatus">Estatus</Label>
                      <select
                        id="selEstatus" value={estatus} onChange={(e) => setEstatus(e.target.value as 'Activo' | 'Inactivo')}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-invalid={!!errors.estatus}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                      {errors.estatus && <p className="text-xs text-destructive">{errors.estatus}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inpRFC">RFC</Label>
                      <Input id="inpRFC" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} placeholder="Ej. ABC123456789" aria-invalid={!!errors.rfc} />
                      {errors.rfc && <p className="text-xs text-destructive">{errors.rfc}</p>}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="txtDireccion">Dirección</Label>
                      <Textarea id="txtDireccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, número, colonia, municipio, estado, CP" className="h-24" />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-base font-semibold">Contactos</h3>
                  <div className="grid gap-2">
                    <Label>Operaciones</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input placeholder="Nombre" value={opNombre} onChange={(e) => setOpNombre(e.target.value)} />
                      <Input type="email" placeholder="Email" value={opEmail} onChange={(e) => setOpEmail(e.target.value)} />
                      <Input placeholder="Tel." value={opTel} onChange={(e) => setOpTel(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Administración</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input placeholder="Nombre" value={adNombre} onChange={(e) => setAdNombre(e.target.value)} />
                      <Input type="email" placeholder="Email" value={adEmail} onChange={(e) => setAdEmail(e.target.value)} />
                      <Input placeholder="Tel." value={adTel} onChange={(e) => setAdTel(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Comercial</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input placeholder="Nombre" value={coNombre} onChange={(e) => setCoNombre(e.target.value)} />
                      <Input type="email" placeholder="Email" value={coEmail} onChange={(e) => setCoEmail(e.target.value)} />
                      <Input placeholder="Tel." value={coTel} onChange={(e) => setCoTel(e.target.value)} />
                    </div>
                  </div>
                </section>
              </form>
            </TabsContent>

            {/* DOCUMENTACIÓN */}
            <TabsContent value="docs" className="flex-1 overflow-y-auto">
              <div className="space-y-4 py-4">
                <h3 className="text-base font-semibold">Documentación</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] text-center">Comprobante</TableHead>
                      <TableHead className="w-[140px] text-center">Estatus</TableHead>
                      <TableHead className="text-center">Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(['acta','poder','compDomicilio','csf','ine','contrato'] as DocKey[]).map((key) => {
                      const labelMap: Record<DocKey, string> = {
                        acta: 'Acta Constitutiva', poder: 'Poder Rep. Legal', compDomicilio: 'Comprobante de Domicilio',
                        csf: 'Constancia de Situación Fiscal', ine: 'INE Rep. Legal', contrato: 'Contrato',
                      }
                      const has = !!docsFiles[key] || !!docsFlags[key]
                      const canPreview = !!docsFiles[key]
                      return (
                        <TableRow key={key}>
                          <TableCell className="align-middle text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button type="button" variant="outline" size="icon" title="Seleccionar archivo" onClick={() => clickFile(key)}>
                                <Folder className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="outline" size="icon" title={canPreview ? 'Ver documento' : 'Sin archivo para previsualizar'} disabled={!canPreview} onClick={() => viewFile(key)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <input
                                ref={(el) => { fileRefs.current[key] = el }} type="file" className="hidden"
                                onChange={(e) => onChangeFile(key, e.target.files?.[0] ?? null)} accept="application/pdf,image/*"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            {has ? <span className="text-green-600">✅ Sí</span> : <span className="text-red-600">❌ No</span>}
                          </TableCell>
                          <TableCell className="align-middle text-center">{labelMap[key]}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* TARIFAS */}
            <TabsContent value="tarifas" className="flex-1 overflow-y-auto">
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Tarifas</h3>
                  <div>
                    <Button className="gap-2" onClick={() => setOpenTarifa(true)}>
                      <Plus className="h-4 w-4" />
                      Agregar Ruta/Tarifa
                    </Button>
                  </div>
                </div>

                {/* Editor de tarifa (modal inferior simple dentro del mismo Sheet) */}
                {openTarifa && (
                  <div className="rounded-md border">
                    <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{editingTarifaId ? 'Editar Ruta/Tarifa' : 'Agregar Nueva Ruta/Tarifa'}</p>
                        <p className="text-sm text-muted-foreground">Completa los campos requeridos.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={() => { setOpenTarifa(false); resetTarifaForm() }}>Cancelar</Button>
                        <Button type="button" onClick={(e) => handleAddTarifa(e as any)}>Guardar</Button>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-4">
                      <form onSubmit={handleAddTarifa} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="estadoOrigen">Estado de Origen*</Label>
                            <select id="estadoOrigen" required value={estadoOrigen} onChange={(e) => setEstadoOrigen(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                              <option value="">Seleccione un estado...</option>
                              {MX_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="municipioOrigen">Municipio de Origen</Label>
                            <Input id="municipioOrigen" value={municipioOrigen} onChange={(e) => setMunicipioOrigen(e.target.value)} placeholder="Opcional" />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="estadoDestino">Estado de Destino*</Label>
                            <select id="estadoDestino" required value={estadoDestino} onChange={(e) => setEstadoDestino(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                              <option value="">Seleccione un estado...</option>
                              {MX_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="municipioDestino">Municipio de Destino</Label>
                            <Input id="municipioDestino" value={municipioDestino} onChange={(e) => setMunicipioDestino(e.target.value)} placeholder="Opcional" />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="tipoUnidad">Tipo de unidad*</Label>
                          <select id="tipoUnidad" required value={tipoUnidad} onChange={(e) => setTipoUnidad(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <option value="">Seleccione...</option>
                            {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor="diasCredito">Días de Crédito</Label>
                            <Input id="diasCredito" type="number" min={0} value={diasCredito} onChange={(e) => setDiasCredito(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="kmRecorrer">Km a recorrer</Label>
                            <Input id="kmRecorrer" type="number" min={0} value={kmRecorrer} onChange={(e) => setKmRecorrer(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="tarifa">Tarifa*</Label>
                          <Input id="tarifa" type="number" min="0" step="0.01" required value={tarifa} onChange={(e) => setTarifa(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Tabla de tarifas */}
                <div className="rounded-md border mt-4">
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Origen - Destino</TableHead>
                          <TableHead className="text-center">Tipo de Unidad</TableHead>
                          <TableHead className="text-center">Tarifa</TableHead>
                          <TableHead className="text-center">Días de Crédito</TableHead>
                          <TableHead className="text-center">Km a recorrer</TableHead>
                          <TableHead className="w-[160px] text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tarifas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Sin tarifas capturadas.
                            </TableCell>
                          </TableRow>
                        ) : (
                          tarifas.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="text-center">{abbrState(t.estadoOrigen)} → {abbrState(t.estadoDestino)}</TableCell>
                              <TableCell className="text-center">{t.tipoUnidad}</TableCell>
                              <TableCell className="text-center">{t.tarifa.toLocaleString(undefined, { style: 'currency', currency: 'MXN' })}</TableCell>
                              <TableCell className="text-center">{t.diasCredito ?? 0}</TableCell>
                              <TableCell className="text-center">{t.kmRecorrer ?? 0}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="outline" size="icon" title="Editar" onClick={() => startEditTarifa(t.id)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Eliminar tarifa</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer. ¿Deseas eliminar esta ruta/tarifa?</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTarifa(t.id)}>Eliminar</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button variant="outline" size="icon" title="Eliminar" onClick={() => handleDeleteTarifa(t.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* COMENTARIOS */}
            <TabsContent value="comentarios" className="flex-1 overflow-y-auto">
              <div className="space-y-4 py-4">
                <h3 className="text-base font-semibold">Comentarios</h3>
                <div className="grid gap-2">
                  <Label htmlFor="txtComentarios">Notas / comentarios (opcional)</Label>
                  <Textarea
                    id="txtComentarios"
                    placeholder="Observaciones generales del cliente, acuerdos, etc."
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    className="min-h-[160px]"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {comentarios.length} caracteres
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}