import * as React from 'react'
<<<<<<< HEAD
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'

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
const CLIENT_STORAGE_KEYS = ['sr_clientes', 'sr_clientes_registrados', 'srClientes'];

// CORRECCIÓN DEFINITIVA: Usar las claves correctas encontradas en tu localStorage.
const LTR_UNITS_KEY = 'SFLTR_LTR_UNIDADES'; 
=======
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Servicio } from './ServiciosTable'

// --- Tipos de Datos y Helpers ---
interface Client { id: string; nombre: string; tarifas?: any[] }
interface Permisionario { id: string; razonSocial: string; unidades?: any[]; operadores?: any[] }
interface UnidadBase { id: string; eco: string; placas: string; poliza?: string }
interface OperadorBase { id: string; nombre: string }

const CLIENT_STORAGE_KEYS = ['sr_clientes', 'sr_clientes_registrados', 'srClientes'];
const LTR_UNITS_KEY = 'SFLTR_LTR_UNIDADES';
>>>>>>> Modulo de asiganación60
const LTR_OPS_KEY = 'SFLTR_LTR_OPERADORES';
const PERMISIONARIOS_KEY = 'sr_permisionarios';

function _readLS<T>(key: string): T[] {
  try {
<<<<<<< HEAD
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

function getAllClients(): Cliente[] {
  for (const key of CLIENT_STORAGE_KEYS) {
    const data = _readLS<any>(key);
    if (data.length > 0) return data.map(normalizeClient).filter(c => c.id && c.nombre);
=======
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error al leer del LocalStorage la clave "${key}":`, e);
    return [];
  }
}

function normalizeUnit(u: any): UnidadBase { return { id: String(u.id || u.placas || Date.now()), eco: u.eco || 'N/A', placas: u.placas || 'N/A', poliza: u.poliza }; }
function normalizeOperator(o: any): OperadorBase { return { id: String(o.id || o.nombre || Date.now()), nombre: o.nombre || 'Sin Nombre' }; }
function getAllClients(): Client[] {
  for (const key of CLIENT_STORAGE_KEYS) {
    const clients = _readLS<Client>(key);
    if (clients.length > 0) return clients;
>>>>>>> Modulo de asiganación60
  }
  return [];
}

<<<<<<< HEAD
// --- Componente Principal ---
interface NuevoServicioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function NuevoServicioSheet({ open, onOpenChange, onSave }: NuevoServicioSheetProps) {
  // --- ESTADO: Datos del Servicio ---
  const [clients, setClients] = React.useState<Cliente[]>([]);
  const [unitTypes, setUnitTypes] = React.useState<string[]>([]);
  const [journeys, setJourneys] = React.useState<Tarifa[]>([]);
  const [price, setPrice] = React.useState('');
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = React.useState<string | null>(null);
  const [selectedJourneyIndex, setSelectedJourneyIndex] = React.useState<string | null>(null);

  // --- ESTADO: Información de la Unidad ---
  const [fleetType, setFleetType] = React.useState<string | null>(null);
  const [permisionarios, setPermisionarios] = React.useState<Permisionario[]>([]);
  const [ltrUnits, setLtrUnits] = React.useState<UnidadBase[]>([]);
  const [ltrOperators, setLtrOperators] = React.useState<OperadorBase[]>([]);
=======
// NUEVO: Helper para formatear moneda
const formatCurrency = (value: string | number | undefined) => {
  if (value === undefined || value === '') return '';
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numberValue)) return '';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(numberValue);
};

interface NuevoServicioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Servicio, 'id'>) => void;
}

export function NuevoServicioSheet({ open, onOpenChange, onSave }: NuevoServicioSheetProps) {
  // --- Estados del Componente ---
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [unitTypes, setUnitTypes] = React.useState<string[]>([]);
  const [selectedUnitType, setSelectedUnitType] = React.useState<string | null>(null);
  const [journeys, setJourneys] = React.useState<any[]>([]);
  const [selectedJourneyIndex, setSelectedJourneyIndex] = React.useState<string | null>(null);
  const [fleetType, setFleetType] = React.useState<string | null>(null);
  const [ltrUnits, setLtrUnits] = React.useState<UnidadBase[]>([]);
  const [ltrOperators, setLtrOperators] = React.useState<OperadorBase[]>([]);
  const [permisionarios, setPermisionarios] = React.useState<Permisionario[]>([]);
>>>>>>> Modulo de asiganación60
  const [availableUnits, setAvailableUnits] = React.useState<UnidadBase[]>([]);
  const [availableOperators, setAvailableOperators] = React.useState<OperadorBase[]>([]);
  const [selectedPermisionarioId, setSelectedPermisionarioId] = React.useState<string | null>(null);
  const [selectedPlaca, setSelectedPlaca] = React.useState<string | null>(null);
  const [selectedEco, setSelectedEco] = React.useState<string | null>(null);
<<<<<<< HEAD
  const [policyAlertOpen, setPolicyAlertOpen] = React.useState(false);

  // --- EFECTOS: Carga de datos inicial ---
  React.useEffect(() => {
    if (open) {
      setClients(getAllClients());

      // Cargar flota propia (LTR) desde las claves correctas
=======
  const [selectedOperatorId, setSelectedOperatorId] = React.useState<string | null>(null);
  const [destino, setDestino] = React.useState('');
  const [costoExtra, setCostoExtra] = React.useState('');
  const [citaCarga, setCitaCarga] = React.useState('');
  const [remolque, setRemolque] = React.useState('');
  const [comentarios, setComentarios] = React.useState('');
  const [tarifa, setTarifa] = React.useState('');

  // --- Efectos ---
  React.useEffect(() => {
    if (open) {
      setClients(getAllClients());
>>>>>>> Modulo de asiganación60
      const ltrUnitsData = _readLS<any>(LTR_UNITS_KEY).map(normalizeUnit);
      const ltrOperatorsData = _readLS<any>(LTR_OPS_KEY).map(normalizeOperator);
      setLtrUnits(ltrUnitsData);
      setLtrOperators(ltrOperatorsData);
<<<<<<< HEAD
      
      console.log('✅ Flota LTR cargada:', { unidades: ltrUnitsData.length, operadores: ltrOperatorsData.length });

      // Cargar flota de terceros (Permisionarios)
      const rawPermisionarios = _readLS<any>(PERMISIONARIOS_KEY);
      
      // CORRECCIÓN: Generar IDs únicos para los operadores de permisionarios.
      const permisionariosData = rawPermisionarios.map(p => ({
        ...p,
        unidades: (p.unidades || []).map(normalizeUnit),
        // Para cada operador, crea un ID único combinando el ID del permisionario y el índice del operador.
        operadores: (p.operadores || []).map((op, index) => ({
          id: `${p.id}-op-${index}`, // Genera un ID único como "LTR-PR-0003-op-0"
          nombre: op.nombre || 'Sin Nombre',
        })),
      }));

      setPermisionarios(permisionariosData);
      console.log('✅ Permisionarios cargados:', permisionariosData.length);
    }
  }, [open]);

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
=======
      const rawPermisionarios = _readLS<any>(PERMISIONARIOS_KEY);
      const permisionariosData = rawPermisionarios.map(p => ({
        ...p,
        unidades: (p.unidades || []).map(normalizeUnit),
        operadores: (p.operadores || []).map((op: { nombre?: string }, index: number) => ({ id: `${p.id}-op-${index}`, nombre: op.nombre || 'Sin Nombre' })),
      }));
      setPermisionarios(permisionariosData);
    }
  }, [open]);

  React.useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      const tarifas = client?.tarifas || [];
      const uniqueUnitTypes = [...new Set(tarifas.map(t => t.tipoUnidad))];
      setUnitTypes(uniqueUnitTypes as string[]);
    } else {
      setUnitTypes([]);
    }
    setSelectedUnitType(null);
    setJourneys([]);
    setSelectedJourneyIndex(null);
  }, [selectedClientId, clients]);

  React.useEffect(() => {
    if (selectedClientId && selectedUnitType) {
      const client = clients.find(c => c.id === selectedClientId);
      const relevantJourneys = (client?.tarifas || []).filter(t => t.tipoUnidad === selectedUnitType);
      setJourneys(relevantJourneys);
    } else {
      setJourneys([]);
    }
>>>>>>> Modulo de asiganación60
    setSelectedJourneyIndex(null);
  }, [selectedUnitType, selectedClientId, clients]);

  React.useEffect(() => {
<<<<<<< HEAD
    if (selectedJourneyIndex === null) { setPrice(''); return; }
    const journey = journeys[parseInt(selectedJourneyIndex, 10)];
    if (journey?.tarifa) {
      setPrice(Number(journey.tarifa).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
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
=======
    if (selectedJourneyIndex) {
      const journey = journeys[parseInt(selectedJourneyIndex, 10)];
      if (journey && journey.tarifa) {
        setTarifa(String(journey.tarifa));
      } else {
        setTarifa('');
      }
    } else {
      setTarifa('');
    }
  }, [selectedJourneyIndex, journeys]);

  React.useEffect(() => {
    setSelectedPlaca(null);
    setSelectedEco(null);
    if (fleetType === 'LTR') {
      setAvailableUnits(ltrUnits);
      setAvailableOperators(ltrOperators);
      setSelectedPermisionarioId(null);
    } else if (fleetType === 'Permisionario') {
      if (selectedPermisionarioId) {
        const perm = permisionarios.find(p => p.id === selectedPermisionarioId);
        setAvailableUnits(perm?.unidades || []);
        setAvailableOperators(perm?.operadores || []);
      } else {
>>>>>>> Modulo de asiganación60
        setAvailableUnits([]);
        setAvailableOperators([]);
      }
    } else {
<<<<<<< HEAD
      // Si no se ha seleccionado tipo de flota, las listas están vacías
=======
>>>>>>> Modulo de asiganación60
      setAvailableUnits([]);
      setAvailableOperators([]);
    }
  }, [fleetType, selectedPermisionarioId, ltrUnits, ltrOperators, permisionarios]);

<<<<<<< HEAD
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Nuevo Servicio</SheetTitle>
              <SheetDescription>Completa los datos para crear una nueva asignación de servicio.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* --- Datos del Servicio --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Datos del servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asigClienteSelect">Cliente*</Label>
                    <Select onValueChange={setSelectedClientId} value={selectedClientId || ''} disabled={clients.length === 0}>
                      <SelectTrigger id="asigClienteSelect"><SelectValue placeholder={clients.length > 0 ? "Selecciona..." : "No hay clientes"} /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                    </Select>
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
                    <Input id="asigPrecio" value={price} placeholder="$0.00" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asigCitaCarga">Cita de Carga</Label>
                    <Input id="asigCitaCarga" type="datetime-local" />
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
                    <Select disabled={availableOperators.length === 0}>
                      <SelectTrigger id="ns-operador"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{availableOperators.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ns-remolque">Remolque</Label>
                    <Input id="ns-remolque" placeholder="Número o descripción" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-ligaGps">Liga GPS</Label>
                  <Input id="ns-ligaGps" placeholder="https://www.gps.com/unidad" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-observaciones">Observaciones</Label>
                  <Textarea id="ns-observaciones" placeholder="Notas u observaciones del servicio" />
=======
  React.useEffect(() => {
    if (selectedPlaca) {
      const unit = availableUnits.find(u => u.placas === selectedPlaca);
      if (unit) setSelectedEco(unit.eco);
    }
  }, [selectedPlaca, availableUnits]);

  React.useEffect(() => {
    if (selectedEco) {
      const unit = availableUnits.find(u => u.eco === selectedEco);
      if (unit) setSelectedPlaca(unit.placas);
    }
  }, [selectedEco, availableUnits]);

  // --- Función de Guardado ---
  function handleSaveClick() {
    const client = clients.find(c => c.id === selectedClientId);
    const journey = selectedJourneyIndex ? journeys[parseInt(selectedJourneyIndex, 10)] : null;
    const operator = availableOperators.find(o => o.id === selectedOperatorId);
    const unit = availableUnits.find(u => u.placas === selectedPlaca);

    // CORRECCIÓN: Añadir los IDs al objeto que se guarda
    const serviceData: Omit<Servicio, 'id'> & {
      // IDs para búsqueda posterior
      _selectedClientId?: string | null;
      _selectedPermisionarioId?: string | null;
      _selectedUnitId?: string | null;
      _selectedOperatorId?: string | null;
    } = {
      // Datos para la UI
      cliente: client?.nombre || 'N/A',
      ruta: journey ? `${journey.estadoOrigen.substring(0,3).toUpperCase()}-${journey.estadoDestino.substring(0,3).toUpperCase()}` : 'N/A',
      tipoFlota: fleetType as 'LTR' | 'Permisionario' || 'N/A',
      tipoUnidad: selectedUnitType || 'N/A',
      destino: destino,
      costoExtra: costoExtra ? parseFloat(costoExtra) : undefined,
      tarifa: tarifa ? parseFloat(tarifa) : undefined,
      citaCarga: citaCarga ? new Date(citaCarga) : undefined,
      operador: operator?.nombre,
      eco: unit?.eco,
      placa: unit?.placas,
      remolque: remolque,
      comentarios: comentarios,
      // IDs para la lógica de guardado en JSON
      _selectedClientId: selectedClientId,
      _selectedPermisionarioId: selectedPermisionarioId,
      _selectedUnitId: unit?.id,
      _selectedOperatorId: selectedOperatorId,
    };
    onSave(serviceData);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Crear Nuevo Servicio</SheetTitle>
            <SheetDescription>Complete los detalles para asignar un nuevo servicio.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* --- Sección 1: Datos del Servicio --- */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Datos del Servicio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ns-cliente">Cliente</Label>
                  <Select onValueChange={setSelectedClientId} value={selectedClientId || ''}>
                    <SelectTrigger id="ns-cliente">
                      <SelectValue className="truncate" placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-tipounidad">Tipo de Unidad</Label>
                  <Select onValueChange={setSelectedUnitType} value={selectedUnitType || ''} disabled={!selectedClientId}>
                    <SelectTrigger id="ns-tipounidad"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{unitTypes.map(ut => <SelectItem key={ut} value={ut}>{ut}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-ruta">Ruta</Label>
                  <Select onValueChange={setSelectedJourneyIndex} value={selectedJourneyIndex || ''} disabled={!selectedUnitType}>
                    <SelectTrigger id="ns-ruta"><SelectValue className="truncate" placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{journeys.map((j, index) => <SelectItem key={index} value={String(index)}>{`${j.estadoOrigen} → ${j.estadoDestino}`}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-tarifa">Tarifa</Label>
                  <Input id="ns-tarifa" type="text" placeholder="$0.00" value={formatCurrency(tarifa)} readOnly />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ns-destino">Destino</Label>
                  <Input id="ns-destino" placeholder="Ej: Walmart Monterrey" value={destino} onChange={e => setDestino(e.target.value)} />
                </div>
              </div>
            </div>

            {/* --- Sección 2: Información de la Unidad (REESTRUCTURADA) --- */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información de la Unidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ns-tipoflota">Tipo de Flota</Label>
                  <Select onValueChange={setFleetType} value={fleetType || ''}>
                    <SelectTrigger id="ns-tipoflota"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LTR">LTR (Propia)</SelectItem>
                      <SelectItem value="Permisionario">Permisionario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fleetType === 'Permisionario' && (
                  <div className="space-y-2">
                    <Label htmlFor="ns-permisionario">Permisionario</Label>
                    <Select onValueChange={setSelectedPermisionarioId} value={selectedPermisionarioId || ''}>
                      <SelectTrigger id="ns-permisionario"><SelectValue className="truncate" placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{permisionarios.map(p => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="ns-placa">Placa</Label>
                  <Select onValueChange={setSelectedPlaca} value={selectedPlaca || ''} disabled={availableUnits.length === 0}>
                    <SelectTrigger id="ns-placa"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{availableUnits.map(u => <SelectItem key={u.id} value={u.placas}>{u.placas}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-eco">Eco</Label>
                  <Select onValueChange={setSelectedEco} value={selectedEco || ''} disabled={availableUnits.length === 0}>
                    <SelectTrigger id="ns-eco"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{availableUnits.map(u => <SelectItem key={u.id} value={u.eco}>{u.eco}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-remolque">Remolque</Label>
                  <Input id="ns-remolque" placeholder="Ej: R-123" value={remolque} onChange={e => setRemolque(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="ns-operador">Operador</Label>
                  <Select onValueChange={setSelectedOperatorId} value={selectedOperatorId || ''} disabled={availableOperators.length === 0}>
                    <SelectTrigger id="ns-operador"><SelectValue className="truncate" placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>{availableOperators.map(o => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}</SelectContent>
                  </Select>
>>>>>>> Modulo de asiganación60
                </div>
              </div>
            </div>

<<<<<<< HEAD
            <SheetFooter className="px-6 py-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={onSave}>Guardar Servicio</Button>
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
=======
            {/* --- Sección 3: Detalles Adicionales --- */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalles Adicionales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ns-citacarga">Cita de Carga</Label>
                  <Input id="ns-citacarga" type="datetime-local" value={citaCarga} onChange={e => setCitaCarga(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ns-costoextra">Costo Extra (Opcional)</Label>
                  <Input id="ns-costoextra" type="number" placeholder="Ej: 500.00" value={costoExtra} onChange={e => setCostoExtra(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ns-comentarios">Comentarios</Label>
                  <Textarea id="ns-comentarios" placeholder="Añade notas o instrucciones especiales..." value={comentarios} onChange={e => setComentarios(e.target.value)} />
                </div>
              </div>
            </div>

          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSaveClick}>Revisar y Guardar</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
>>>>>>> Modulo de asiganación60
}