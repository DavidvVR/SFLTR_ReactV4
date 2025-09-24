// src/routes/dashboard/clientes.tsx
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
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
import { Plus, Folder, Eye, Trash2, Pencil, FileDown, FileUp } from "lucide-react"
import {
  addCliente,
  listClientes,
  removeCliente,
  updateCliente,
} from "@/features/clientes/clientesSupabase"
import type {
  DocKey,
  Tarifa as TarifaModel,
  Cliente,
} from "@/features/clientes/clientesLocal"
import { getXLSX } from '@/utils/xlsx'
import ClienteFormSheet, { type ClienteFormValues } from '@/features/clientes/components/ClienteFormSheet'

// Helpers fuera del componente
function genId() {
  try { return crypto.randomUUID() } catch { return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` }
}






const EMPTY_DOCS: Record<DocKey, boolean> = {
  acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false,
}

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

  const importFileRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => { void loadClientes() }, [])
  async function loadClientes() {
    try {
      const rows = await listClientes()
      setClientes(rows)
    } catch (e) {
      console.error('Error cargando clientes:', e)
      setClientes([])
    }
  }

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
  const [editingCliente, setEditingCliente] = React.useState<Cliente | null>(null)

  React.useEffect(() => { void loadClientes() }, [])

  function startNewCliente() { setEditingCliente(null); setOpen(true) }
  function startEditCliente(id: string) {
    const c = clientes.find((x) => x.id === id) || null
    setEditingCliente(c); setOpen(true)
  }

  async function confirmRemoveCliente(id: string) {
    try {
      await removeCliente(id)
      await loadClientes()
    } catch (e) { console.error(e) }
  }

  async function handleSaveCliente(data: ClienteFormValues) {
    try {
      if (editingCliente?.id || data.id) {
        const id = editingCliente?.id ?? data.id!
        const { id: _omit, ...payload } = data
        await updateCliente(id, payload as any)
      } else {
        await addCliente(data as any)
      }
      await loadClientes()
      setOpen(false)
      setEditingCliente(null)
    } catch (e) {
      console.error('Error guardando cliente:', e)
    }
  }

  // --- 3. Lógica de Importación (actualiza si existe RFC, crea si no) ---
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const XLSX = await getXLSX()
      const buf = await file.arrayBuffer()
      const workbook = XLSX.read(buf, { type: 'array' })
      const clientesSheet = workbook.Sheets['Clientes']
      const tarifasSheet = workbook.Sheets['Tarifas']
      if (!clientesSheet) { alert("No se encontró la hoja 'Clientes'."); return }

      const importedClientes = XLSX.utils.sheet_to_json<any>(clientesSheet)
      const importedTarifas = tarifasSheet ? XLSX.utils.sheet_to_json<any>(tarifasSheet) : []

      // Indexar clientes existentes por RFC normalizado
      const existing = await listClientes()
      const byRFC = new Map(
        existing
          .filter(c => !!c.rfc)
          .map(c => [c.rfc!.trim().toUpperCase(), c] as const)
      )

      let created = 0
      let updated = 0

      for (const row of importedClientes) {
        const rfcUpper = row["RFC"]?.toString().trim().toUpperCase()
        const nombre = row["Nombre / Razón Social"]?.toString().trim()
        if (!rfcUpper || !nombre) {
          console.warn("Fila omitida. Falta RFC o Nombre:", row)
          continue
        }

        // Tarifas del Excel para ese RFC
        const clienteTarifas: TarifaModel[] = importedTarifas
          .filter((t: any) => t["Cliente RFC"]?.toString().trim().toUpperCase() === rfcUpper)
          .map((t: any): TarifaModel => ({
            id: genId(),
            estadoOrigen: t["Estado Origen"],
            municipioOrigen: t["Municipio Origen"],
            estadoDestino: t["Estado Destino"],
            municipioDestino: t["Municipio Destino"],
            tipoUnidad: t["Tipo de Unidad"],
            tarifa: Number(t["Tarifa"] ?? 0),
            diasCredito: t["Días de Crédito"] ? Number(t["Días de Crédito"]) : undefined,
            kmRecorrer: t["Km a recorrer"] ? Number(t["Km a recorrer"]) : undefined,
          }))

        const baseData = {
          nombre,
          rfc: rfcUpper,
          estatus: (row["Estatus"] === "Inactivo" ? "Inactivo" : "Activo") as "Activo" | "Inactivo",
          direccion: row["Dirección"],
          contactos: {
            operaciones: { nombre: row["Contacto Operaciones (Nombre)"], email: row["Contacto Operaciones (Email)"], tel: row["Contacto Operaciones (Tel)"] },
            administracion: { nombre: row["Contacto Administración (Nombre)"], email: row["Contacto Administración (Email)"], tel: row["Contacto Administración (Tel)"] },
            comercial: { nombre: row["Contacto Comercial (Nombre)"], email: row["Contacto Comercial (Email)"], tel: row["Contacto Comercial (Tel)"] },
          },
          comentarios: row["Comentarios"],
        }

        const found = byRFC.get(rfcUpper)
        if (found) {
          await updateCliente(found.id, {
            ...baseData,
            tarifas: clienteTarifas,
            docs: found.docs, // preserva docs existentes
          } as any)
          updated++
        } else {
          await addCliente({
            ...baseData,
            docs: {
              acta: false, poder: false, compDomicilio: false, csf: false, ine: false, contrato: false,
            },
            tarifas: clienteTarifas,
          } as any)
          created++
        }
      }

      alert(`Importación finalizada.\nActualizados: ${updated}\nCreados: ${created}`)
      await loadClientes()
    } catch (error) {
      console.error("Error al importar el archivo:", error)
      alert("Hubo un problema al procesar el archivo XLSX.")
    } finally {
      if (e.target) e.target.value = ""
    }
  }

  async function handleExportXLSX() {
    if (clientes.length === 0) {
      alert("No hay clientes para exportar.")
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

    const XLSX = await getXLSX()
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
                                    Esta acción no se puede deshacer. ¿Deseas eliminar este cliente?
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

      {/* Reemplaza el Sheet inline por el componente extraído */}
      <ClienteFormSheet
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditingCliente(null) }}
        initialValue={editingCliente || undefined}
        onSave={handleSaveCliente}
      />
    </div>
  )
}

export default ClientesPage

// Cargar xlsx solo en cliente usando la entrada ESM
async function loadXLSX() {
  const xlsx = await import('xlsx/xlsx.mjs')
  return xlsx
}

