import * as React from 'react'
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
  nombre: string;
  unidades: UnidadBase[];
  operadores: OperadorBase[];
}

// --- Helpers para leer de LocalStorage ---
const CLIENT_STORAGE_KEYS = ['sr_clientes', 'sr_clientes_registrados', 'srClientes'];
const LTR_UNITS_KEY = 'SFLTR_LTR_UNIDADES';
const LTR_OPS_KEY = 'SFLTR_LTR_OPERADORES';
const PERMISIONARIOS_KEY = 'SFLTR_PERMISIONARIOS';

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

function getAllClients(): Cliente[] {
  for (const key of CLIENT_STORAGE_KEYS) {
    const data = _readLS<any>(key);
    if (data.length > 0) return data.map(normalizeClient).filter(c => c.id && c.nombre);
  }
  return [];
}

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
  const [availableUnits, setAvailableUnits] = React.useState<UnidadBase[]>([]);
  const [availableOperators, setAvailableOperators] = React.useState<OperadorBase[]>([]);
  const [selectedPermisionarioId, setSelectedPermisionarioId] = React.useState<string | null>(null);
  const [selectedPlaca, setSelectedPlaca] = React.useState<string | null>(null);
  const [selectedEco, setSelectedEco] = React.useState<string | null>(null);
  const [policyAlertOpen, setPolicyAlertOpen] = React.useState(false);

  // --- EFECTOS: Carga de datos inicial ---
  React.useEffect(() => {
    if (open) {
      setClients(getAllClients());
      setLtrUnits(_readLS<UnidadBase>(LTR_UNITS_KEY));
      setLtrOperators(_readLS<OperadorBase>(LTR_OPS_KEY));
      setPermisionarios(_readLS<Permisionario>(PERMISIONARIOS_KEY));
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
    setSelectedJourneyIndex(null);
  }, [selectedUnitType, selectedClientId, clients]);

  React.useEffect(() => {
    if (selectedJourneyIndex === null) { setPrice(''); return; }
    const journey = journeys[parseInt(selectedJourneyIndex, 10)];
    if (journey?.tarifa) {
      setPrice(Number(journey.tarifa).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    }
  }, [selectedJourneyIndex, journeys]);

  // --- EFECTOS: Lógica encadenada de "Información de la Unidad" ---
  React.useEffect(() => {
    setSelectedPermisionarioId(null);
    setAvailableUnits([]);
    setAvailableOperators([]);

    if (fleetType === 'LTR') {
      setAvailableUnits(ltrUnits);
      setAvailableOperators(ltrOperators);
    } else if (fleetType === 'Permisionario') {
      // No hacer nada hasta que se seleccione un permisionario
    }
  }, [fleetType, ltrUnits, ltrOperators]);

  React.useEffect(() => {
    if (fleetType !== 'Permisionario' || !selectedPermisionarioId) {
      if (fleetType !== 'Permisionario') {
        setAvailableUnits(ltrUnits);
        setAvailableOperators(ltrOperators);
      }
      return;
    }
    const perm = permisionarios.find(p => p.id === selectedPermisionarioId);
    setAvailableUnits(perm?.unidades || []);
    setAvailableOperators(perm?.operadores || []);
  }, [selectedPermisionarioId, fleetType, permisionarios, ltrUnits, ltrOperators]);

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
                    <Select onValueChange={setSelectedPermisionarioId} value={selectedPermisionarioId || ''} disabled={fleetType !== 'Permisionario'}>
                      <SelectTrigger id="ns-permisionario"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{permisionarios.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
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
                </div>
              </div>
            </div>

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
}