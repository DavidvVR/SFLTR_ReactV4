// src/routes/dashboard/clientes.tsx
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import * as XLSX from "xlsx" // <--- 1. Importar la librería
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Folder, Eye, Trash2, Pencil, FileDown, FileUp } from "lucide-react" // <--- 1. Importar ícono FileUp
import {
  addCliente,
  listClientes,
  removeCliente,
  updateCliente,
  type DocKey,
  type Tarifa as TarifaModel,
  type Cliente,
} from "@/features/clientes/clientesLocal"

export const Route = createFileRoute("/dashboard/clientes")({
  component: ClientesPage,
  loader: () => ({ crumb: "Clientes" }),
})

// ----- Auxiliares -----
const MX_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","Coahuila","Colima",
  "Chiapas","Chihuahua","Ciudad de México","Durango","Guanajuato","Guerrero",
  "Hidalgo","Jalisco","Estado de México","Michoacán","Morelos","Nayarit","Nuevo León",
  "Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora",
  "Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
]

// Abreviaturas para mostrar en la tabla (tarifas)
const STATE_ABBR: Record<string, string> = {
  Aguascalientes: "AGS", "Baja California": "BC", "Baja California Sur": "BCS", Campeche: "CAM",
  Coahuila: "COAH", Colima: "COL", Chiapas: "CHIS", Chihuahua: "CHIH", "Ciudad de México": "CDMX",
  Durango: "DGO", Guanajuato: "GTO", Guerrero: "GRO", Hidalgo: "HGO", Jalisco: "JAL",
  "Estado de México": "MEX", Michoacán: "MICH", Morelos: "MOR", Nayarit: "NAY", "Nuevo León": "NL",
  Oaxaca: "OAX", Puebla: "PUE", Querétaro: "QRO", "Quintana Roo": "QROO", "San Luis Potosí": "SLP",
  Sinaloa: "SIN", Sonora: "SON", Tabasco: "TAB", Tamaulipas: "TAMPS", Tlaxcala: "TLAX",
  Veracruz: "VER", Yucatán: "YUC", Zacatecas: "ZAC",
}
function abbrState(n: string) { return STATE_ABBR[n] ?? n }

const UNIT_TYPES = ['Unidad seca de 53"', 'Refrigerada de 53"', "Thorton", "3.5"]

// Validador RFC MX (simplificado)
const RFC_REGEX = /^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{2})([A\d])$/i

type ClienteErrors = { nombre?: string; estatus?: string; rfc?: string }

const DOCS_DEF: { key: DocKey; label: string }[] = [
  { key: "acta", label: "Acta Constitutiva" },
  { key: "poder", label: "Poder Rep. Legal" },
  { key: "compDomicilio", label: "Comprobante de Domicilio" },
  { key: "csf", label: "Constancia de Situación Fiscal" },
  { key: "ine", label: "INE Rep. Legal" },
  { key: "contrato", label: "Contrato" },
]

// ----- Componente principal -----
function ClientesPage() {
  // Lista principal (tabla)
  const [clientes, setClientes] = React.useState<Cliente[]>([])
  const [q, setQ] = React.useState("")

  const importFileRef = React.useRef<HTMLInputElement | null>(null) // <--- 2. Ref para input de archivo

  React.useEffect(() => { loadClientes() }, [])
  function loadClientes() { setClientes(listClientes()) }

  // Filtra clientes basado en la búsqueda 'q'
  const filteredClientes = React.useMemo(() => {
    if (!q) return clientes
    const lowerQ = q.toLowerCase()
    return clientes.filter(
      (c) =>
        c.id.toLowerCase().includes(lowerQ) ||
        c.nombre.toLowerCase().includes(lowerQ) ||
        c.rfc?.toLowerCase().includes(lowerQ),
    )
  }, [clientes, q])

  // Modal cliente
  const [open, setOpen] = React.useState(false)
  const [editingClienteId, setEditingClienteId] = React.useState<string | null>(null)
  const isEditing = !!editingClienteId

  const [activeTab, setActiveTab] = React.useState<"datos" | "docs" | "tarifas" | "comentarios">("datos")

  // Avisos inline tipo toast
  const [flash, setFlash] = React.useState<{ type: "success" | "error"; msg: string } | null>(null)
  function showFlash(type: "success" | "error", msg: string) {
    setFlash({ type, msg }); window.setTimeout(() => setFlash(null), 2500)
  }

  // ---- Datos Generales ----
  const [nombre, setNombre] = React.useState("")
  const [estatus, setEstatus] = React.useState<"Activo" | "Inactivo">("Activo")
  const [rfc, setRfc] = React.useState("")
  const [direccion, setDireccion] = React.useState("")
  const [opNombre, setOpNombre] = React.useState("")
  const [opEmail, setOpEmail] = React.useState("")
  const [opTel, setOpTel] = React.useState("")
  const [adNombre, setAdNombre] = React.useState("")
  const [adEmail, setAdEmail] = React.useState("")
  const [adTel, setAdTel] = React.useState("")
  const [coNombre, setCoNombre] = React.useState("")
  const [coEmail, setCoEmail] = React.useState("")
  const [coTel, setCoTel] = React.useState("")
  const [errors, setErrors] = React.useState<ClienteErrors>({})

  // ---- Documentación ----
  // Archivos seleccionados en esta sesión
  const [docsFiles, setDocsFiles] = React.useState<Record<DocKey, File | null>>({
    acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null,
  })
  // Flags (para precargar "tiene/no tiene" desde cliente guardado)
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
    const f = docsFiles[key]
    if (!f) return
    const url = URL.createObjectURL(f)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // ---- Tarifas ----
  const [tarifas, setTarifas] = React.useState<TarifaModel[]>([])
  const [openTarifa, setOpenTarifa] = React.useState(false)
  const [editingTarifaId, setEditingTarifaId] = React.useState<string | null>(null)
  const [estadoOrigen, setEstadoOrigen] = React.useState("")
  const [municipioOrigen, setMunicipioOrigen] = React.useState("")
  const [estadoDestino, setEstadoDestino] = React.useState("")
  const [municipioDestino, setMunicipioDestino] = React.useState("")
  const [tipoUnidad, setTipoUnidad] = React.useState("")
  const [diasCredito, setDiasCredito] = React.useState<number | "">("")
  const [kmRecorrer, setKmRecorrer] = React.useState<number | "">("")
  const [tarifa, setTarifa] = React.useState<number | "">("")

  function genId() {
    try { return crypto.randomUUID() }
    catch { return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}` }
  }
  function resetTarifaForm() {
    setEstadoOrigen(""); setMunicipioOrigen(""); setEstadoDestino(""); setMunicipioDestino("");
    setTipoUnidad(""); setDiasCredito(""); setKmRecorrer(""); setTarifa(""); setEditingTarifaId(null)
  }
  function startEditTarifa(id: string) {
    const t = tarifas.find((x) => x.id === id); if (!t) return
    setEstadoOrigen(t.estadoOrigen); setMunicipioOrigen(t.municipioOrigen ?? "")
    setEstadoDestino(t.estadoDestino); setMunicipioDestino(t.municipioDestino ?? "")
    setTipoUnidad(t.tipoUnidad); setDiasCredito(typeof t.diasCredito === "number" ? t.diasCredito : "")
    setKmRecorrer(typeof t.kmRecorrer === "number" ? t.kmRecorrer : ""); setTarifa(t.tarifa)
    setEditingTarifaId(t.id); setOpenTarifa(true)
  }
  function handleAddTarifa(e: React.FormEvent) {
    e.preventDefault()
    if (!estadoOrigen || !estadoDestino || !tipoUnidad || tarifa === "" || Number(tarifa) < 0) {
      showFlash("error", "Completa los campos requeridos de la tarifa."); return
    }
    const payload: TarifaModel = {
      id: editingTarifaId ?? genId(),
      estadoOrigen, municipioOrigen: municipioOrigen || undefined,
      estadoDestino, municipioDestino: municipioDestino || undefined,
      tipoUnidad, diasCredito: diasCredito === "" ? undefined : Number(diasCredito),
      kmRecorrer: kmRecorrer === "" ? undefined : Number(kmRecorrer),
      tarifa: Number(tarifa),
    }
    setTarifas((prev) => editingTarifaId ? prev.map((t) => t.id === editingTarifaId ? payload : t) : [payload, ...prev])
    setOpenTarifa(false); resetTarifaForm(); showFlash("success", "Tarifa guardada.")
  }
  function handleDeleteTarifa(id: string) { setTarifas((p) => p.filter((t) => t.id !== id)); showFlash("success", "Tarifa eliminada.") }

  // ---- Comentarios ----
  const [comentarios, setComentarios] = React.useState("")

  // ---- Helpers cliente ----
  function resetClienteForm() {
    setEditingClienteId(null)
    setActiveTab("datos")
    setNombre(""); setEstatus("Activo"); setRfc(""); setDireccion("")
    setOpNombre(""); setOpEmail(""); setOpTel("")
    setAdNombre(""); setAdEmail(""); setAdTel("")
    setCoNombre(""); setCoEmail(""); setCoTel("")
    setDocsFiles({ acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null })
    setDocsFlags({ acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false })
    setTarifas([]); setComentarios("")
    setErrors({})
  }

  function startNewCliente() {
    resetClienteForm()
    setOpen(true)
  }

  function startEditCliente(id: string) {
    const c = clientes.find((x) => x.id === id)
    if (!c) return
    setEditingClienteId(c.id)
    setNombre(c.nombre)
    setEstatus(c.estatus)
    setRfc(c.rfc || "")
    setDireccion(c.direccion || "")
    setOpNombre(c.contactos?.operaciones?.nombre || "")
    setOpEmail(c.contactos?.operaciones?.email || "")
    setOpTel(c.contactos?.operaciones?.tel || "")
    setAdNombre(c.contactos?.administracion?.nombre || "")
    setAdEmail(c.contactos?.administracion?.email || "")
    setAdTel(c.contactos?.administracion?.tel || "")
    setCoNombre(c.contactos?.comercial?.nombre || "")
    setCoEmail(c.contactos?.comercial?.email || "")
    setCoTel(c.contactos?.comercial?.tel || "")
    // flags de documentación (no restauramos archivos, solo el estado)
    setDocsFlags({
      acta: !!c.docs?.acta, poder: !!c.docs?.poder, compDomicilio: !!c.docs?.compDomicilio,
      csf: !!c.docs?.csf, ine: !!c.docs?.ine, contrato: !!c.docs?.contrato,
    })
    setDocsFiles({ acta: null, poder: null, compDomicilio: null, csf: null, ine: null, contrato: null })
    setTarifas(c.tarifas ?? [])
    setComentarios(c.comentarios ?? "")
    setActiveTab("datos")
    setOpen(true)
  }

  function validateCliente(): ClienteErrors {
    const next: ClienteErrors = {}
    if (!nombre.trim()) next.nombre = "El nombre/razón social es requerido."
    if (!estatus) next.estatus = "Selecciona un estatus."
    if (rfc && !RFC_REGEX.test(rfc.trim())) next.rfc = "RFC no tiene un formato válido."
    return next
  }
  const hasErrors = React.useMemo(() => {
    const v = validateCliente(); return !!(v.nombre || v.estatus || v.rfc)
  }, [nombre, estatus, rfc])

  function handleCancel() { setOpen(false); setFlash(null) }

  // --- 3. Lógica de Importación ---
  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: "binary" })

        // Leer hojas
        const clientesSheet = workbook.Sheets["Clientes"]
        const tarifasSheet = workbook.Sheets["Tarifas"]

        if (!clientesSheet) {
          showFlash("error", "No se encontró la hoja 'Clientes' en el archivo.")
          return
        }

        const importedClientes = XLSX.utils.sheet_to_json<any>(clientesSheet)
        const importedTarifas = tarifasSheet ? XLSX.utils.sheet_to_json<any>(tarifasSheet) : []

        let addedCount = 0
        // Procesar cada cliente del Excel
        for (const row of importedClientes) {
          const rfc = row["RFC"]?.trim().toUpperCase()
          if (!rfc || !row["Nombre / Razón Social"]) {
            console.warn("Omitiendo fila de cliente por falta de RFC o Nombre:", row)
            continue
          }

          // Buscar tarifas para este cliente
          const clienteTarifas = importedTarifas
            .filter(t => t["Cliente RFC"]?.trim().toUpperCase() === rfc)
            .map((t): TarifaModel => ({
              id: genId(), // Generar nuevo ID para la tarifa
              estadoOrigen: t["Estado Origen"],
              municipioOrigen: t["Municipio Origen"],
              estadoDestino: t["Estado Destino"],
              municipioDestino: t["Municipio Destino"],
              tipoUnidad: t["Tipo de Unidad"],
              tarifa: Number(t["Tarifa"] ?? 0),
              diasCredito: t["Días de Crédito"] ? Number(t["Días de Crédito"]) : undefined,
              kmRecorrer: t["Km a recorrer"] ? Number(t["Km a recorrer"]) : undefined,
            }))

          const payload = {
            nombre: row["Nombre / Razón Social"],
            rfc: rfc,
            estatus: (row["Estatus"] === "Inactivo" ? "Inactivo" : "Activo") as "Activo" | "Inactivo",
            direccion: row["Dirección"],
            contactos: {
              operaciones: { nombre: row["Contacto Operaciones (Nombre)"], email: row["Contacto Operaciones (Email)"], tel: row["Contacto Operaciones (Tel)"] },
              administracion: { nombre: row["Contacto Administración (Nombre)"], email: row["Contacto Administración (Email)"], tel: row["Contacto Administración (Tel)"] },
              comercial: { nombre: row["Contacto Comercial (Nombre)"], email: row["Contacto Comercial (Email)"], tel: row["Contacto Comercial (Tel)"] },
            },
            docs: {}, // La importación no maneja archivos
            tarifas: clienteTarifas,
            comentarios: row["Comentarios"],
          }
          addCliente(payload)
          addedCount++
        }

        showFlash("success", `${addedCount} clientes importados correctamente.`)
        loadClientes() // Recargar la lista
      } catch (error) {
        console.error("Error al importar el archivo:", error)
        showFlash("error", "Hubo un problema al procesar el archivo XLSX.")
      } finally {
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        if (e.target) e.target.value = ""
      }
    }
    reader.readAsBinaryString(file)
  }


  function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const v = validateCliente(); setErrors(v)
    if (v.nombre || v.estatus || v.rfc) { setActiveTab("datos"); showFlash("error", "Revisa los campos marcados en Datos Generales."); return }

    // Flags de docs a guardar: (archivo seleccionado) OR (flag precargado)
    const docsToSave = Object.fromEntries(
      DOCS_DEF.map(d => [d.key, !!docsFiles[d.key] || !!docsFlags[d.key]])
    ) as Record<DocKey, boolean>

    const payload = {
      nombre,
      estatus,
      rfc,
      direccion,
      contactos: {
        operaciones: { nombre: opNombre, email: opEmail, tel: opTel },
        administracion: { nombre: adNombre, email: adEmail, tel: adTel },
        comercial: { nombre: coNombre, email: coEmail, tel: coTel },
      },
      docs: docsToSave,
      tarifas,
      comentarios,
    }

    if (isEditing && editingClienteId) {
      const updated = updateCliente(editingClienteId, payload)
      setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      showFlash("success", "Cliente actualizado.")
    } else {
      const nuevo = addCliente(payload)
      setClientes((prev) => [nuevo, ...prev])
      showFlash("success", "Cliente guardado.")
    }

    setOpen(false)
  }

  function confirmRemoveCliente(id: string) {
    removeCliente(id)
    setClientes((prev) => prev.filter((c) => c.id !== id))
    showFlash("success", "Cliente eliminado.")
  }

  // 3. Función para exportar a XLSX
  function handleExportXLSX() {
    if (clientes.length === 0) {
      showFlash("error", "No hay clientes para exportar.")
      return
    }

    // Mapear los datos a un formato plano para la hoja de cálculo
    const dataToExport = clientes.map(c => ({
      'ID': c.id,
      'Nombre / Razón Social': c.nombre,
      'RFC': c.rfc ?? '',
      'Estatus': c.estatus,
      'Dirección': c.direccion ?? '',
      'Contacto Operaciones (Nombre)': c.contactos?.operaciones?.nombre ?? '',
      'Contacto Operaciones (Email)': c.contactos?.operaciones?.email ?? '',
      'Contacto Operaciones (Tel)': c.contactos?.operaciones?.tel ?? '',
      'Contacto Administración (Nombre)': c.contactos?.administracion?.nombre ?? '',
      'Contacto Administración (Email)': c.contactos?.administracion?.email ?? '',
      'Contacto Administración (Tel)': c.contactos?.administracion?.tel ?? '',
      'Contacto Comercial (Nombre)': c.contactos?.comercial?.nombre ?? '',
      'Contacto Comercial (Email)': c.contactos?.comercial?.email ?? '',
      'Contacto Comercial (Tel)': c.contactos?.comercial?.tel ?? '',
      'Comentarios': c.comentarios ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");

    // Ajustar anchos de columna (opcional, pero recomendado)
    const colWidths = Object.keys(dataToExport[0]).map(key => ({
      wch: Math.max(key.length, ...dataToExport.map(row => (row[key as keyof typeof row] ?? '').toString().length)) + 2
    }));
    worksheet["!cols"] = colWidths;

    // Generar y descargar el archivo
    XLSX.writeFile(workbook, `Reporte_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // ---- UI ----
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gestión de clientes y tarifas.</CardDescription>
            </div>

            {/* Abrir modal para nuevo */}
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por ID / Nombre / RFC"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-80"
              />
              {/* --- 4. Botones de Importar/Exportar --- */}
              <input
                type="file"
                ref={importFileRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <Button variant="outline" className="gap-2" onClick={() => importFileRef.current?.click()}>
                <FileUp className="h-4 w-4" />
                Importar
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExportXLSX}>
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2" onClick={startNewCliente}>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* TABLA: ID / Nombre / RFC / Estatus / Acciones (FUERA DEL MODAL) */}
          <div className="rounded-md border">
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">ID</TableHead>
                    <TableHead>Nombre / Razón Social</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="w-[160px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {q ? "No se encontraron clientes." : "No hay clientes registrados."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell>{c.nombre}</TableCell>
                        <TableCell>{c.rfc ?? "—"}</TableCell>
                        <TableCell>
                          <span className={c.estatus === "Activo" ? "text-green-600" : "text-red-600"}>
                            {c.estatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="icon" title="Editar" onClick={() => startEditCliente(c.id)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" title="Eliminar">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. ¿Deseas eliminar “{c.nombre}”?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => confirmRemoveCliente(c.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL (Sheet) Nuevo/Editar Cliente */}
      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v && !isEditing) resetClienteForm() }}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
          {/* Header con acciones */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
                <SheetDescription>
                  Completa los datos generales, documentación y tarifas.
                </SheetDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={handleCancel}>Cancelar</Button>
                <Button type="button" onClick={handleSave}>Guardar</Button>
              </div>
            </div>
            {flash && (
              <div
                className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                  flash.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {flash.msg}
              </div>
            )}
          </div>

          {/* Contenido del modal */}
          <div className="px-6 pb-6 pt-4 flex h-[calc(100vh-6rem)] flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-1 flex-col">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="datos">Datos Generales</TabsTrigger>
                <TabsTrigger value="docs">Documentación</TabsTrigger>
                <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
                <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
              </TabsList>

              {/* DATOS GENERALES */}
              <TabsContent value="datos" className="flex-1 overflow-y-auto">
                <form id="form-nuevo-cliente" onSubmit={handleSave} className="space-y-6 py-4">
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
                          id="selEstatus" value={estatus} onChange={(e) => setEstatus(e.target.value as "Activo" | "Inactivo")}
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
                        <Input id="opNombre" placeholder="Nombre" value={opNombre} onChange={(e) => setOpNombre(e.target.value)} />
                        <Input id="opEmail" type="email" placeholder="Email" value={opEmail} onChange={(e) => setOpEmail(e.target.value)} />
                        <Input id="opTel" placeholder="Tel." value={opTel} onChange={(e) => setOpTel(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Administración</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input id="adNombre" placeholder="Nombre" value={adNombre} onChange={(e) => setAdNombre(e.target.value)} />
                        <Input id="adEmail" type="email" placeholder="Email" value={adEmail} onChange={(e) => setAdEmail(e.target.value)} />
                        <Input id="adTel" placeholder="Tel." value={adTel} onChange={(e) => setAdTel(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Comercial</Label>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input id="coNombre" placeholder="Nombre" value={coNombre} onChange={(e) => setCoNombre(e.target.value)} />
                        <Input id="coEmail" type="email" placeholder="Email" value={coEmail} onChange={(e) => setCoEmail(e.target.value)} />
                        <Input id="coTel" placeholder="Tel." value={coTel} onChange={(e) => setCoTel(e.target.value)} />
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
                      {DOCS_DEF.map(({ key, label }) => {
                        const has = !!docsFiles[key] || !!docsFlags[key]
                        const canPreview = !!docsFiles[key] // solo si hay archivo cargado en esta sesión
                        return (
                          <TableRow key={key}>
                            <TableCell className="align-middle text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button type="button" variant="outline" size="icon" title="Seleccionar archivo" onClick={() => clickFile(key)}>
                                  <Folder className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="outline" size="icon" title={canPreview ? "Ver documento" : "Sin archivo para previsualizar"} disabled={!canPreview} onClick={() => viewFile(key)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <input
                                  ref={(el) => { fileRefs.current[key] = el; }} type="file" className="hidden"
                                  onChange={(e) => onChangeFile(key, e.target.files?.[0] ?? null)} accept="application/pdf,image/*"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="align-middle text-center">
                              {has ? <span className="text-green-600">✅ Sí</span> : <span className="text-red-600">❌ No</span>}
                            </TableCell>
                            <TableCell className="align-middle text-center">{label}</TableCell>
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
                    <Sheet open={openTarifa} onOpenChange={(v) => { setOpenTarifa(v); if (!v) resetTarifaForm() }}>
                      <SheetTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Agregar Ruta/Tarifa
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh] p-0">
                        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <SheetTitle>{editingTarifaId ? "Editar Ruta/Tarifa" : "Agregar Nueva Ruta/Tarifa"}</SheetTitle>
                              <SheetDescription>Completa los campos requeridos.</SheetDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" type="button" onClick={() => { setOpenTarifa(false); resetTarifaForm() }}>Cancelar</Button>
                              <Button type="submit" form="form-tarifa">Guardar</Button>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6 pt-4 overflow-y-auto h-[calc(80vh-4rem)]">
                          <form id="form-tarifa" onSubmit={handleAddTarifa} className="space-y-6">
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
                                <Input id="diasCredito" type="number" min={0} value={diasCredito} onChange={(e) => setDiasCredito(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="kmRecorrer">Km a recorrer</Label>
                                <Input id="kmRecorrer" type="number" min={0} value={kmRecorrer} onChange={(e) => setKmRecorrer(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="tarifa">Tarifa*</Label>
                              <Input id="tarifa" type="number" min="0" step="0.01" required value={tarifa} onChange={(e) => setTarifa(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0.00" />
                            </div>
                          </form>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Tabla de tarifas (interno del modal) */}
                  <div className="rounded-md border">
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
                                <TableCell className="text-center">{t.tarifa.toLocaleString(undefined, { style: "currency", currency: "MXN" })}</TableCell>
                                <TableCell className="text-center">{t.diasCredito ?? 0}</TableCell>
                                <TableCell className="text-center">{t.kmRecorrer ?? 0}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button variant="outline" size="icon" title="Editar" onClick={() => startEditTarifa(t.id)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon" title="Eliminar">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Eliminar tarifa</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción no se puede deshacer. ¿Deseas eliminar esta ruta/tarifa?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteTarifa(t.id)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
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
    </div>
  )
}

export default ClientesPage

