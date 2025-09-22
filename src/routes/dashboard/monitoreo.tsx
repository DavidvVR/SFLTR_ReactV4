import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MonitoreoTable } from '@/features/monitoreo/components/MonitoreoTable'
import { useMonitoreo } from '@/features/monitoreo/hooks/useMonitoreo'
import { ConfirmEventDialog, type ConfirmEventData } from '@/features/monitoreo/components/ConfirmEventDialog'
import { AddEventDialog } from '@/features/monitoreo/components/AddEventDialog'
import { ViewEventsDialog } from '@/features/monitoreo/components/Mvereventos'
import { ConfirmarCitaDialog } from '@/features/monitoreo/components/ConfirmarCitaDialog' // <-- 1. Importar el nuevo modal




// Abreviaturas de estados MX
const MX_STATE_ABBR: Record<string, string> = {
  'Aguascalientes': 'AGS',
  'Baja California': 'BC',
  'Baja California Sur': 'BCS',
  'Campeche': 'CAMP',
  'Coahuila': 'COAH',
  'Colima': 'COL',
  'Chiapas': 'CHIS',
  'Chihuahua': 'CHIH',
  'Ciudad de México': 'CDMX',
  'Durango': 'DGO',
  'Guanajuato': 'GTO',
  'Guerrero': 'GRO',
  'Hidalgo': 'HGO',
  'Jalisco': 'JAL',
  'Estado de México': 'MEX',
  'Michoacán': 'MICH',
  'Morelos': 'MOR',
  'Nayarit': 'NAY',
  'Nuevo León': 'NL',
  'Oaxaca': 'OAX',
  'Puebla': 'PUE',
  'Querétaro': 'QRO',
  'Quintana Roo': 'QROO',
  'San Luis Potosí': 'SLP',
  'Sinaloa': 'SIN',
  'Sonora': 'SON',
  'Tabasco': 'TAB',
  'Tamaulipas': 'TAMPS',
  'Tlaxcala': 'TLAX',
  'Veracruz': 'VER',
  'Yucatán': 'YUC',
  'Zacatecas': 'ZAC',
}

// Normaliza texto (sin acentos, minúsculas)
function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Mapa normalizado para búsqueda flexible
const STATE_MAP = new Map<string, string>([
  ...Object.entries(MX_STATE_ABBR).map(([k, v]) => [norm(k), v] as const),
  ['ciudad de mexico', 'CDMX'],
  ['cdmx', 'CDMX'],
  ['df', 'CDMX'],
  ['edo de mexico', 'MEX'],
  ['estado de mexico', 'MEX'],
  ['nuevo leon', 'NL'],
  ['san luis potosi', 'SLP'],
])

function abbrState(val?: string | null): string {
  if (!val) return ''
  const v = String(val)
  const key = norm(v.replace(/^estado de\s+/i, ''))
  return STATE_MAP.get(key) ?? v.slice(0, 3).toUpperCase()
}

// Helpers para buscar en Asignación por ID (local/sessionStorage)
function safeJSON<T = unknown>(raw?: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

function findAsignacionById(id: string): any | null {
  if (!id) return null
  const keys = ['SFLTR_ASIGNACIONES','ASIGNACIONES','SFLTR_SERVICIOS','SERVICIOS','SFLTR_ASIGN_V1','ASIGN_V1']
  for (const k of keys) {
    const arr = safeJSON<any[]>(localStorage.getItem(k)) ?? safeJSON<any[]>(sessionStorage.getItem(k))
    if (Array.isArray(arr)) {
      const found = arr.find(r => r?.id === id || r?.serviceId === id || r?.folio === id || r?.folioServicio === id)
      if (found) return found
    }
  }
  return null
}

function destinoFromAsignacion(rec: any): string {
  if (!rec) return ''
  const o = rec.estadoOrigen ?? rec.estado_origen ?? rec.origen?.estado ?? rec.origenEstado ?? rec.ruta?.estadoOrigen ?? rec.tarifa?.estadoOrigen
  const d = rec.estadoDestino ?? rec.estado_destino ?? rec.destino?.estado ?? rec.destinoEstado ?? rec.ruta?.estadoDestino ?? rec.tarifa?.estadoDestino
  const oa = abbrState(o), da = abbrState(d)
  return oa && da ? `${oa}-${da}` : ''
}

// Construye campos planos del servicio (cliente, ruta, destino, operador, tipoUnidad, eco, placas)
function buildFlatServiceFields(svc: any | null, id: string) {
  const asign = findAsignacionById(id)

  const estadoOrigenRaw =
    svc?.estadoOrigen ?? svc?.estado_origen ?? svc?.origen?.estado ?? svc?.origenEstado ??
    svc?.ruta?.estadoOrigen ?? svc?.tarifa?.estadoOrigen ??
    asign?.estadoOrigen ?? asign?.estado_origen ?? asign?.origen?.estado ?? asign?.origenEstado ?? asign?.ruta?.estadoOrigen ?? asign?.tarifa?.estadoOrigen

  const estadoDestinoRaw =
    svc?.estadoDestino ?? svc?.estado_destino ?? svc?.destino?.estado ?? svc?.destinoEstado ??
    svc?.ruta?.estadoDestino ?? svc?.tarifa?.estadoDestino ??
    asign?.estadoDestino ?? asign?.estado_destino ?? asign?.destino?.estado ?? asign?.destinoEstado ?? asign?.ruta?.estadoDestino ?? asign?.tarifa?.estadoDestino

  const oa = abbrState(estadoOrigenRaw), da = abbrState(estadoDestinoRaw)
  const destino =
    (oa && da) ? `${oa}-${da}` :
    (typeof svc?.destino === 'string' ? svc.destino :
      (svc?.destino?.nombre ?? svc?.destino?.descripcion ??
       (typeof asign?.destino === 'string' ? asign.destino : (asign?.destino?.nombre ?? asign?.destino?.descripcion ?? '')) ?? ''))

  const cliente =
    svc?.cliente?.nombreRazonSocial ?? svc?.cliente?.nombre ??
    (typeof svc?.cliente === 'string' ? svc.cliente : '') ??
    asign?.cliente?.nombreRazonSocial ?? asign?.cliente?.nombre ??
    (typeof asign?.cliente === 'string' ? asign.cliente : '') ?? ''

  const ruta = svc?.ruta ?? asign?.ruta ?? ''

  const operador =
    svc?.operadores?.[0]?.nombre ?? svc?.operador?.nombre ??
    (typeof svc?.operador === 'string' ? svc.operador : '') ??
    asign?.operadores?.[0]?.nombre ?? asign?.operador?.nombre ??
    (typeof asign?.operador === 'string' ? asign.operador : '') ?? ''

  const tipoUnidad =
    svc?.unidades?.[0]?.tipoUnidad ?? svc?.unidades?.[0]?.tipo ??
    svc?.unidad?.tipoUnidad ?? svc?.unidad?.tipo ?? svc?.tipoUnidad ?? svc?.tipo_unidad ??
    asign?.unidades?.[0]?.tipoUnidad ?? asign?.unidades?.[0]?.tipo ??
    asign?.unidad?.tipoUnidad ?? asign?.unidad?.tipo ?? asign?.tipoUnidad ?? asign?.tipo_unidad ?? ''

  const eco =
    svc?.unidades?.[0]?.eco ?? svc?.unidad?.eco ??
    asign?.unidades?.[0]?.eco ?? asign?.unidad?.eco ?? ''

  const placas =
    svc?.unidades?.[0]?.placa ?? svc?.unidad?.placa ??
    asign?.unidades?.[0]?.placa ?? asign?.unidad?.placa ?? ''

  return { cliente, ruta, destino, operador, tipoUnidad, eco, placas }
}

function getLoggedUserName(): string {
  const plain = localStorage.getItem('SFLTR_USER_NAME') || sessionStorage.getItem('SFLTR_USER_NAME')
  if (plain) return plain
  const candidates = ['SFLTR_AUTH_V1', 'SFLTR_USER', 'auth', 'user', 'session']
  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key)
      if (!raw) continue
      const obj = JSON.parse(raw)
      const name =
        obj?.name ||
        obj?.nombre ||
        obj?.username ||
        obj?.user?.name ||
        obj?.user?.username ||
        obj?.profile?.name ||
        obj?.usuario?.nombre
      if (name) return String(name)
    } catch {}
  }
  return ''
}

// Busca un item por varias llaves posibles y normaliza el ID
function findItemByAnyId(items: any[], id: string) {
  const normId = String(id ?? '').trim()
  if (!normId) return null
  const keys = ['id', 'serviceId', 'service_id', 'servicioId', 'servicio_id', 'folio', 'folioServicio']
  return items.find((it) =>
    keys.some((k) => it?.[k] != null && String(it[k]).trim() === normId),
  ) ?? null
}

export const Route = createFileRoute('/dashboard/monitoreo')({
  component: function MonitoreoPage() {
    const { items, q, setQ, registrarEvento } = useMonitoreo()
    const [open, setOpen] = React.useState(false)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [staged, setStaged] = React.useState<ConfirmEventData | null>(null)
    const [initialServiceId, setInitialServiceId] = React.useState<string>('')
    const [eventsOpen, setEventsOpen] = React.useState(false)
    const [citaOpen, setCitaOpen] = React.useState(false) // <-- 2. Añadir estado para el nuevo modal

    const currentUserName = React.useMemo(() => getLoggedUserName(), [])

    const handleStageSubmit = (data: ConfirmEventData) => {
      const svcId = (data.serviceId || initialServiceId || '').toString().trim()
      const svc = findItemByAnyId(items as any[], svcId) ?? findAsignacionById(svcId)
      const flat = buildFlatServiceFields(svc, svcId)
      setStaged({
        ...data,
        serviceId: svcId,
        user: data.user || getLoggedUserName(),
        ...flat,
      })
      setConfirmOpen(true)
    }

    const handleConfirmGuardar = () => {
      if (!staged) return
      registrarEvento(staged.serviceId, staged.type, staged.status, staged.message, staged.coords)
      setConfirmOpen(false)
      setOpen(false)
      setInitialServiceId('')
      setStaged(null)
    }

    return (
      <div className="p-6 flex flex-col gap-4 h-screen">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoreo</h1>
            <p className="text-muted-foreground">Seguimiento de servicios por ID</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar servicio..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[240px] sm:w-[320px]"
            />
            {/* 3. Actualizar el onClick del botón */}
            <Button onClick={() => setCitaOpen(true)}>Confirmar Cita</Button>
            <Button onClick={() => setOpen(true)}>Agregar Evento.</Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-md border">
          <div className="h-full overflow-auto">
            <MonitoreoTable
              items={items}
              q={q}
              onQChange={setQ}
              onVerEventos={(id) => { setInitialServiceId(id); setEventsOpen(true) }}
              hideSearch
            />
          </div>
        </div>

        <AddEventDialog
          open={open}
          onOpenChange={setOpen}
          initialServiceId={initialServiceId}
          onSubmit={handleStageSubmit}
          currentUserName={currentUserName}
          userEditable
        />

        {staged && (
          <ConfirmEventDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            data={staged}
            onConfirm={handleConfirmGuardar}
          />
        )}

        <ViewEventsDialog
          open={eventsOpen}
          onOpenChange={setEventsOpen}
          serviceId={initialServiceId}
          items={items as any}
        />

        {/* 4. Renderizar el nuevo modal */}
        <ConfirmarCitaDialog
          open={citaOpen}
          onOpenChange={setCitaOpen}
          items={items as any[]}
        />
      </div>
    )
  },
})
