import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'
import type { Servicio } from './ServiciosTable'
import { listClientesConTarifas } from '../data/clientes-supabase'

// --- Tipos de Datos (Sección de Servicio) ---
interface Tarifa {
  tipoUnidad: string;
  estadoOrigen: string;
  estadoDestino: string;
  tarifa: number;
}
interface Cliente {
  id: string;
  nombre: string;
  rfc?: string;
  tarifas?: Tarifa[];
}

// --- Tipos de Datos (Sección de Unidad) ---
interface UnidadBase {
  id: string;
  placas: string;
  eco?: string;
  vencePoliza?: string;
}
interface OperadorBase {
  id: string;
  nombre: string;
}
interface Permisionario {
  id: string;
  razonSocial: string; // CORREGIDO: de 'nombre' a 'razonSocial'
  unidades: UnidadBase[];
  operadores: OperadorBase[];
}

// --- Helpers para leer de LocalStorage ---
const LTR_UNITS_KEY = 'SFLTR_LTR_UNIDADES'; 
const LTR_OPS_KEY = 'SFLTR_LTR_OPERADORES';
const PERMISIONARIOS_KEY = 'sr_permisionarios';

function _readLS<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch { return []; }
}

function normalizeClient(c: any): Cliente {
  return {
    id: String(c.id || c.clienteId || c.codigo || c.clave || ''),
    nombre: c.nombre || c.razonSocial || c.nombreRazon || c.nombre_comercial || 'Sin Nombre',
    rfc: c.rfc || c.RFC || '',
    tarifas: c.tarifas || [],
  };
}

function normalizeUnit(u: any): UnidadBase {
  return {
    id: String(u.id || ''),
    placas: u.placas || '',
    eco: u.eco || '',
    vencePoliza: u.vencePoliza || '',
  };
}

function normalizeOperator(o: any): OperadorBase {
  return {
    id: String(o.id || ''),
    nombre: o.nombre || 'Sin Nombre',
  };
}

// --- Componente Principal ---
interface NuevoServicioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Omit<Servicio, 'id'>) => void;
  mode?: 'create' | 'edit';           // NUEVO
  initialData?: Servicio;             // NUEVO
  onSaveEdit?: (id: string, data: Omit<Servicio, 'id'>) => void; // NUEVO
}

export function NuevoServicioSheet({ open, onOpenChange, onSave, mode = 'create', initialData, onSaveEdit }: NuevoServicioSheetProps) {
  // --- ESTADO: Datos del Servicio ---
  const [clients, setClients] = React.useState<Cliente[]>([]);
  const [clientsLoading, setClientsLoading] = React.useState(false);
  const [clientsError, setClientsError] = React.useState<string | null>(null);
  const [unitTypes, setUnitTypes] = React.useState<string[]>([]);
  const [journeys, setJourneys] = React.useState<Tarifa[]>([]);
  const [price, setPrice] = React.useState<number | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = React.useState<string | null>(null);
  const [selectedJourneyIndex, setSelectedJourneyIndex] = React.useState<string | null>(null);

  // --- ESTADO: Información de la Unidad ---
  const [fleetType, setFleetType] = React.useState<string | null>(null);
  const [permisionarios, setPermisionarios] = React.useState<Permisionario[]>([]);
  const [ltrUnits, setLtrUnits] = React.useState<UnidadBase[]>([]);
  const [ltrOperators, setLtrOperators] = React.useState<OperadorBase[]>([]);
  const [availableUnits, setAvailableUnits] = React.useState<UnidadBase[]>([]);
  const [availableOperators, setAvailableOperators] = React.useState<OperadorBase[]>([]);
  const [selectedPermisionarioId, setSelectedPermisionarioId] = React.useState<string | null>(null);
  const [selectedPlaca, setSelectedPlaca] = React.useState<string | null>(null);
  const [selectedEco, setSelectedEco] = React.useState<string | null>(null);
  const [policyAlertOpen, setPolicyAlertOpen] = React.useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = React.useState<string>('')

  const destinoRef = React.useRef<HTMLInputElement>(null)
  const remolqueRef = React.useRef<HTMLInputElement>(null)
  const ligaGpsRef = React.useRef<HTMLInputElement>(null)
  const costoExtraRef = React.useRef<HTMLInputElement>(null)
  const observacionesRef = React.useRef<HTMLTextAreaElement>(null)

  // NUEVO: estado controlado para datetime-local
  const [citaCargaLocal, setCitaCargaLocal] = React.useState<string>('')

  // NUEVO: estados controlados para destino, costo extra y comentarios
  const [destinoLocal, setDestinoLocal] = React.useState<string>('')
  const [costoExtraLocal, setCostoExtraLocal] = React.useState<string>('') // se guarda como string y se convierte al guardar
  const [comentariosLocal, setComentariosLocal] = React.useState<string>('')

  // NUEVO: estado controlado para Remolque
  const [remolqueLocal, setRemolqueLocal] = React.useState<string>('')

  // --- EFECTOS: Carga de datos inicial ---
  React.useEffect(() => {
    if (open) {
      void loadClients()
      // Cargar flota propia (LTR) desde las claves correctas
      const ltrUnitsData = _readLS<any>(LTR_UNITS_KEY).map(normalizeUnit);
      const ltrOperatorsData = _readLS<any>(LTR_OPS_KEY).map(normalizeOperator);
      setLtrUnits(ltrUnitsData);
      setLtrOperators(ltrOperatorsData);
      
      console.log('✅ Flota LTR cargada:', { unidades: ltrUnitsData.length, operadores: ltrOperatorsData.length });

      // Cargar flota de terceros (Permisionarios)
      const rawPermisionarios = _readLS<any>(PERMISIONARIOS_KEY);
      
      // CORRECCIÓN: Generar IDs únicos para los operadores de permisionarios.
      const permisionariosData = rawPermisionarios.map(p => ({
        ...p,
        unidades: (p.unidades || []).map(normalizeUnit),
        // Para cada operador, crea un ID único combinando el ID del permisionario y el índice del operador.
        operadores: (p.operadores || []).map((op: Partial<OperadorBase>, index: number) => ({
          id: `${p.id}-op-${index}`, // Genera un ID único como "LTR-PR-0003-op-0"
          nombre: op.nombre || 'Sin Nombre',
        })),
      }));

      setPermisionarios(permisionariosData);
      console.log('✅ Permisionarios cargados:', permisionariosData.length);
    }
  }, [open]);

  async function loadClients() {
    setClientsLoading(true)
    setClientsError(null)
    try {
      const rows = await listClientesConTarifas()
      // Normaliza al tipo local
      setClients(rows.map(r => ({
        id: r.id,
        nombre: r.nombre,
        rfc: r.rfc || '',
        tarifas: r.tarifas?.map(t => ({
          tipoUnidad: t.tipoUnidad,
          estadoOrigen: t.estadoOrigen,
          estadoDestino: t.estadoDestino,
          tarifa: t.tarifa,
        })) || [],
      })))
    } catch (e: any) {
      console.error('Error cargando clientes', e)
      setClientsError(e?.message || 'Error cargando clientes')
    } finally {
      setClientsLoading(false)
    }
  }

  // --- EFECTOS: Lógica encadenada de "Datos del Servicio" ---
  React.useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    const uniqueTypes = client?.tarifas ? [...new Set(client.tarifas.map(t => t.tipoUnidad).filter(Boolean))] : [];
    setUnitTypes(uniqueTypes);
    setSelectedUnitType(null);
  }, [selectedClientId, clients]);

  React.useEffect(() => {
    if (!selectedClientId || !selectedUnitType) return;
    const client = clients.find(c => c.id === selectedClientId);
    const validJourneys = client?.tarifas?.filter(t => t.tipoUnidad === selectedUnitType) || [];
    setJourneys(validJourneys);
    setSelectedJourneyIndex(null);
  }, [selectedUnitType, selectedClientId, clients]);

  React.useEffect(() => {
    if (selectedJourneyIndex === null) { setPrice(undefined); return; }
    const journey = journeys[parseInt(selectedJourneyIndex, 10)];
    if (journey?.tarifa) {
      setPrice(journey.tarifa);
    }
  }, [selectedJourneyIndex, journeys]);

  // --- EFECTOS: Lógica encadenada de "Información de la Unidad" ---
  // CORREGIDO: Unificar la lógica de selección de flota en un solo useEffect
  React.useEffect(() => {
    // Primero, limpiar selecciones previas al cambiar de flota o permisionario
    setSelectedPlaca(null);
    setSelectedEco(null);

    if (fleetType === 'LTR') {
      setAvailableUnits(ltrUnits);
      setAvailableOperators(ltrOperators);
      setSelectedPermisionarioId(null); // Limpiar selección de permisionario si se cambia a LTR
    } else if (fleetType === 'Permisionario') {
      if (selectedPermisionarioId) {
        // Encuentra el permisionario específico que fue seleccionado
        const perm = permisionarios.find(p => p.id === selectedPermisionarioId);
        
        // CORRECCIÓN: Asigna las unidades Y los operadores que pertenecen a ESE permisionario.
        setAvailableUnits(perm?.unidades || []);
        setAvailableOperators(perm?.operadores || []);
      } else {
        // Si es Permisionario pero aún no se ha seleccionado uno, la lista está vacía
        setAvailableUnits([]);
        setAvailableOperators([]);
      }
    } else {
      // Si no se ha seleccionado tipo de flota, las listas están vacías
      setAvailableUnits([]);
      setAvailableOperators([]);
    }
  }, [fleetType, selectedPermisionarioId, ltrUnits, ltrOperators, permisionarios]);

  // Sincronización Placa -> Eco
  React.useEffect(() => {
    if (!selectedPlaca) return;
    const unit = availableUnits.find(u => u.placas === selectedPlaca);
    if (unit?.eco && unit.eco !== selectedEco) {
      setSelectedEco(unit.eco);
    }
  }, [selectedPlaca, availableUnits]);

  // Sincronización Eco -> Placa
  React.useEffect(() => {
    if (!selectedEco) return;
    const unit = availableUnits.find(u => u.eco === selectedEco);
    if (unit?.placas && unit.placas !== selectedPlaca) {
      setSelectedPlaca(unit.placas);
    }
  }, [selectedEco, availableUnits]);

  // Precargar datos cuando abras en modo edición
  React.useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      // Texto/numéricos
      setDestinoLocal(initialData.destino ?? '')
      setCostoExtraLocal(initialData.costoExtra != null ? String(initialData.costoExtra) : '')
      setComentariosLocal(initialData.comentarios ?? '')
      setRemolqueLocal(initialData.remolque ?? '')            // NUEVO

      setCitaCargaLocal(toDatetimeLocal(initialData.citaCarga))
      // Selects básicos
      setFleetType(initialData.tipoFlota || '')
      setSelectedEco(initialData.eco || '')
      setSelectedPlaca(initialData.placa || '')
      setPrice(initialData.tarifa)
    }
    // Si es creación, limpia los campos
    if (open && mode === 'create') {
      setCitaCargaLocal('')
      setDestinoLocal('')
      setCostoExtraLocal('')
      setComentariosLocal('')
      setRemolqueLocal('')                                    // NUEVO
    }
  }, [open, mode, initialData])

  // 1) Seleccionar el cliente por nombre (coincide con initialData.cliente)
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (clients.length === 0) return
    const byName = clients.find(c => c.nombre?.toLowerCase() === (initialData.cliente || '').toLowerCase())
    if (byName) setSelectedClientId(byName.id)
  }, [open, mode, initialData, clients])

  // 2) Seleccionar el tipo de unidad cuando ya están los unitTypes del cliente
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (unitTypes.length === 0) return
    if (initialData.tipoUnidad && unitTypes.includes(initialData.tipoUnidad)) {
      setSelectedUnitType(initialData.tipoUnidad)
    }
  }, [open, mode, initialData, unitTypes])

  // 3) Seleccionar trayecto usando la ruta (Origen — Destino) o por tarifa como fallback
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (journeys.length === 0) return
    let idx = -1
    if (initialData.ruta) {
      const [o, d] = initialData.ruta.split(/—|-/).map(s => s.trim())
      if (o && d) {
        idx = journeys.findIndex(j =>
          j.estadoOrigen?.toLowerCase() === o.toLowerCase() &&
          j.estadoDestino?.toLowerCase() === d.toLowerCase(),
        )
      }
    }
    if (idx === -1 && typeof initialData.tarifa === 'number') {
      idx = journeys.findIndex(j => j.tarifa === initialData.tarifa)
    }
    if (idx >= 0) setSelectedJourneyIndex(String(idx))
  }, [open, mode, initialData, journeys])

  // 4) Si es Permisionario, deducir el permisionario por la placa/eco de la unidad
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (fleetType !== 'Permisionario' || permisionarios.length === 0) return
    const match = permisionarios.find(p =>
      (p.unidades || []).some(u => u.placas === initialData.placa || u.eco === initialData.eco),
    )
    if (match) setSelectedPermisionarioId(match.id)
  }, [open, mode, initialData, fleetType, permisionarios])

  // 5) Seleccionar operador cuando ya están disponibles (LTR o permisionario)
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (availableOperators.length === 0) return
    const op = availableOperators.find(o => o.nombre?.toLowerCase() === (initialData.operador || '').toLowerCase())
    if (op) setSelectedOperatorId(op.id)
  }, [open, mode, initialData, availableOperators])

  // NUEVO: cuando ya están las unidades disponibles, re-aplica placa/eco de initialData si quedaron vacías
  React.useEffect(() => {
    if (!open || mode !== 'edit' || !initialData) return
    if (availableUnits.length === 0) return
    if (!selectedPlaca && initialData.placa) setSelectedPlaca(initialData.placa)
    if (!selectedEco && initialData.eco) setSelectedEco(initialData.eco)
  }, [open, mode, initialData, availableUnits, selectedPlaca, selectedEco])

  // Validación de Póliza
  const handleUnitSelection = (value: string, type: 'placa' | 'eco') => {
    const unit = availableUnits.find(u => (type === 'placa' ? u.placas === value : u.eco === value));
    if (unit?.vencePoliza) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vencimiento = new Date(unit.vencePoliza);
      if (vencimiento < hoy) {
        setPolicyAlertOpen(true);
        return; // No actualiza el estado si la póliza está vencida
      }
    }
    // Si la póliza es válida, actualiza el estado
    if (type === 'placa') setSelectedPlaca(value);
    if (type === 'eco') setSelectedEco(value);
  };

  const handleGuardar = () => {
    const cli = clients.find(c => c.id === selectedClientId)
    const journey = (selectedJourneyIndex !== null && selectedJourneyIndex !== undefined)
      ? journeys[Number(selectedJourneyIndex)]
      : undefined
    const unit = availableUnits.find(u => u.eco === selectedEco)
    const op = availableOperators.find(o => o.id === selectedOperatorId)

    const citaCargaStr = citaCargaLocal?.trim()
    const destino = destinoLocal.trim()
    const remolque = remolqueLocal.trim()                     // CAMBIO: usar estado controlado
    const costoExtra = costoExtraLocal ? Number(costoExtraLocal) : undefined
    const comentarios = comentariosLocal.trim()

    const payload = {
      cliente: (cli?.nombre || (cli as any)?.razonSocial || initialData?.cliente || '').trim(),
      ruta: journey ? `${journey.estadoOrigen} — ${journey.estadoDestino}` : (initialData?.ruta || ''),
      destino,
      tipoFlota: fleetType || initialData?.tipoFlota || '',
      tipoUnidad: selectedUnitType || initialData?.tipoUnidad || '',
      operador: op?.nombre || initialData?.operador || '',
      eco: selectedEco || initialData?.eco || '',
      placa: selectedPlaca || initialData?.placa || '',
      remolque,
      citaCarga: citaCargaStr ? new Date(citaCargaStr) : initialData?.citaCarga,
      tarifa: typeof price === 'number' ? price : initialData?.tarifa,
      costoExtra,
      comentarios,
    } as Omit<Servicio, 'id'>

    if (mode === 'edit' && initialData?.id && onSaveEdit) {
      onSaveEdit(initialData.id, payload)
    } else {
      onSave(payload)
    }
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>{mode === 'edit' ? 'Editar servicio' : 'Nuevo Servicio'}</SheetTitle>
              <SheetDescription>
                {mode === 'edit'
                  ? 'Modifica los datos del servicio.'
                  : 'Completa los datos para crear una nueva asignación de servicio.'}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* --- Datos del Servicio --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Datos del servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asigClienteSelect">Cliente*</Label>
                    <Select
                      onValueChange={setSelectedClientId}
                      value={selectedClientId || ''}
                      disabled={clientsLoading || clients.length === 0}
                    >
                      <SelectTrigger id="asigClienteSelect">
                        <SelectValue
                          placeholder={
                            clientsLoading
                              ? "Cargando..."
                              : clientsError
                                ? "Error"
                                : clients.length > 0
                                  ? "Selecciona..."
                                  : "Sin clientes"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clientsError && (
                      <div className="text-xs text-red-500 mt-1">
                        {clientsError} <button className="underline" onClick={() => loadClients()}>Reintentar</button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigTipoUnidad">Tipo de unidad*</Label>
                    <Select onValueChange={setSelectedUnitType} value={selectedUnitType || ''} disabled={unitTypes.length === 0}>
                      <SelectTrigger id="asigTipoUnidad"><SelectValue placeholder={selectedClientId ? "Selecciona..." : "Selecciona cliente"} /></SelectTrigger>
                      <SelectContent>{unitTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigTrayecto">Trayecto (Origen — Destino)*</Label>
                    <Select onValueChange={setSelectedJourneyIndex} value={selectedJourneyIndex || ''} disabled={journeys.length === 0}>
                      <SelectTrigger id="asigTrayecto"><SelectValue placeholder={selectedUnitType ? "Selecciona..." : "Selecciona tipo"} /></SelectTrigger>
                      <SelectContent>{journeys.map((j, i) => <SelectItem key={i} value={String(i)}>{j.estadoOrigen} — {j.estadoDestino}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigPrecio">Precio (MXN)</Label>
                    <Input id="asigPrecio" value={price !== undefined ? price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : ''} placeholder="$0.00" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigCitaCarga">Cita de Carga</Label>
                    <Input
                      id="asigCitaCarga"
                      type="datetime-local"
                      value={citaCargaLocal}
                      onChange={(e) => setCitaCargaLocal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigDestino">Destino</Label>
                    <Input
                      id="asigDestino"
                      type="text"
                      placeholder="Ej Wualmart Monterrey"
                      value={destinoLocal}
                      onChange={(e) => setDestinoLocal(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* --- Info Unidad --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Información de la Unidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ns-unidadTipo">Tipo de Flota</Label>
                    <Select onValueChange={setFleetType} value={fleetType || ''}>
                      <SelectTrigger id="ns-unidadTipo"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LTR">LTR</SelectItem>
                        <SelectItem value="Permisionario">Permisionario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-permisionario">Permisionario</Label>
                    <Select onValueChange={setSelectedPermisionarioId} value={selectedPermisionarioId || ''} disabled={fleetType !== 'Permisionario' || permisionarios.length === 0}>
                      <SelectTrigger id="ns-permisionario"><SelectValue placeholder={fleetType === 'Permisionario' ? "Selecciona..." : "N/A"} /></SelectTrigger>
                      <SelectContent>{permisionarios.map(p => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-placa">Placa</Label>
                    <Select onValueChange={(v) => handleUnitSelection(v, 'placa')} value={selectedPlaca || ''} disabled={availableUnits.length === 0}>
                      <SelectTrigger id="ns-placa"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{[...new Set(availableUnits.map(u => u.placas))].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-eco">Eco</Label>
                    <Select onValueChange={(v) => handleUnitSelection(v, 'eco')} value={selectedEco || ''} disabled={availableUnits.length === 0}>
                      <SelectTrigger id="ns-eco"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{[...new Set(availableUnits.map(u => u.eco).filter(Boolean))] .map(e => <SelectItem key={e} value={e!}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-operador">Operador</Label>
                    <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId} disabled={availableOperators.length === 0}>
                      <SelectTrigger id="ns-operador"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{availableOperators.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-remolque">Remolque</Label>
                    <Input
                      id="ns-remolque"
                      placeholder="Número o descripción"
                      value={remolqueLocal}                      // NUEVO
                      onChange={(e) => setRemolqueLocal(e.target.value)} // NUEVO
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-ligaGps">Liga GPS</Label>
                  <Input id="ns-ligaGps" placeholder="https://www.gps.com/unidad" ref={ligaGpsRef} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-costoExtra">Costo extra (MXN)</Label>
                  <Input
                    id="ns-costoExtra"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="$0.00"
                    value={costoExtraLocal}
                    onChange={(e) => setCostoExtraLocal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-observaciones">Observaciones</Label>
                  <Textarea
                    id="ns-observaciones"
                    placeholder="Notas u observaciones del servicio"
                    value={comentariosLocal}
                    onChange={(e) => setComentariosLocal(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleGuardar}>{mode === 'edit' ? 'Guardar cambios' : 'Guardar Servicio'}</Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- Modal de Alerta de Póliza Vencida --- */}
      <AlertDialog open={policyAlertOpen} onOpenChange={setPolicyAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Póliza de Seguro Vencida</AlertDialogTitle>
            <AlertDialogDescription>
              La unidad seleccionada tiene la póliza de seguro vencida. No es posible asignarla a un nuevo servicio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setPolicyAlertOpen(false)}>Entendido</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Helper para formatear Date/String a 'YYYY-MM-DDTHH:mm' en hora local
function toDatetimeLocal(value?: Date | string): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return ''
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

// SQL Query to insert data into cliente_tarifas
const insertClienteTarifasQuery = `
insert into cliente_tarifas (cliente_id, tipo_unidad, estado_origen, estado_destino, tarifa)
select
  c.id,
  coalesce(t->>'tipoUnidad', t->>'tipo_unidad') as tipo_unidad,
  coalesce(t->>'estadoOrigen', t->>'estado_origen') as estado_origen,
  coalesce(t->>'estadoDestino', t->>'estado_destino') as estado_destino,
  nullif(t->>'tarifa','')::numeric as tarifa
from clientes c
cross join lateral jsonb_array_elements(c.tarifas) t
where jsonb_typeof(c.tarifas) = 'array'
  and coalesce(t->>'tipoUnidad', t->>'tipo_unidad') is not null
  and not exists (
    select 1 from cliente_tarifas ct
    where ct.cliente_id = c.id
      and ct.tipo_unidad = coalesce(t->>'tipoUnidad', t->>'tipo_unidad')
      and ct.estado_origen = coalesce(t->>'estadoOrigen', t->>'estado_origen')
      and ct.estado_destino = coalesce(t->>'estadoDestino', t->>'estado_destino')
  );
`;