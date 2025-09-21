import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { listAsignaciones } from '@/features/asignacion/data/asignacion-store'
import { type ConfirmEventData } from './ConfirmEventDialog'
import type { MonitoreoStatus, TrackingEventType } from '../types'
import { FolderOpen } from 'lucide-react'





// Helper local: obtiene el nombre del usuario desde localStorage/sessionStorage
function getLoggedUserNameFromStorage(): string {
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialServiceId?: string
  onSubmit: (data: ConfirmEventData) => void
  currentUserName?: string
  userEditable?: boolean
}

export function AddEventDialog({
  open,
  onOpenChange,
  initialServiceId,
  onSubmit,
  currentUserName,
  userEditable = false,
}: Props) {
  const servicios = React.useMemo(() => listAsignaciones(), [])

  // NUEVO: resolver user desde prop o storage
  const resolvedUserName = React.useMemo(
    () => (currentUserName && currentUserName.trim() ? currentUserName : getLoggedUserNameFromStorage()),
    [currentUserName]
  )

  // Estado
  const [serviceId, setServiceId] = React.useState<string>(initialServiceId || '')
  const [status, setStatus] = React.useState<MonitoreoStatus>('En ruta')
  const [type, setType] = React.useState<TrackingEventType>('Nota')
  const [user, setUser] = React.useState<string>(resolvedUserName)
  const [coords, setCoords] = React.useState<string>('') // "lat,lng"
  const [message, setMessage] = React.useState<string>('')
  const [evidencias, setEvidencias] = React.useState<File[]>([])
  const [ubicacionRef, setUbicacionRef] = React.useState<'Origen' | 'Destino' | ''>('') // NUEVO
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const handlePickEvidence = () => fileInputRef.current?.click()
  const handleEvidenceChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? [])
    setEvidencias(files)
  }

  // Servicio seleccionado y detalles derivados (solo lectura)
  const selectedService = React.useMemo(
    () => servicios.find((s: any) => s.id === serviceId),
    [servicios, serviceId]
  )

  const svcDetails = React.useMemo(() => {
    if (!selectedService) return null

    const cliente =
      selectedService.cliente?.nombreRazonSocial ?? ''

    const ruta =
      selectedService.ruta ?? ''

    const destino =
      typeof selectedService.destino === 'string'
        ? selectedService.destino
        : ((selectedService.destino as unknown) as { nombre?: string })?.nombre ?? ''

    const operador =
      selectedService.operadores?.[0]?.nombre ??
      selectedService.operadores?.[0]?.nombre ?? ''

    // Nuevo: detectar tipo de unidad
    const tipoUnidad =
      selectedService.unidades?.[0]?.tipoUnidad ??
      selectedService.unidades?.[0]?.tipoUnidad ??
      '' // Removed reference to 'tipo' as it does not exist in 'UnidadAsignada'
      (selectedService as any).tipoUnidad ??
      (selectedService as any).tipo_unidad ??
      ''

    const eco =
      selectedService.unidades?.[0]?.eco ??
      selectedService.unidades?.[0]?.eco ?? ''

    const placas =
      selectedService.unidades?.[0]?.placa ??
      selectedService.unidades?.[0]?.placa ?? ''

    return { cliente, ruta, destino, operador, tipoUnidad, eco, placas }
  }, [selectedService])







  // Prefill al abrir
  React.useEffect(() => {
    if (open) {
      setServiceId(initialServiceId || '')
      setUser(resolvedUserName)
      setUbicacionRef('') // reset al abrir
    }
  }, [open, initialServiceId, resolvedUserName])

  // Reset al cerrar
  React.useEffect(() => {
    if (!open) {
      setServiceId(initialServiceId || '')
      setStatus('En ruta')
      setType('Nota')
      setUser(resolvedUserName)
      setCoords('')
      setMessage('')
      setUbicacionRef('') // reset al cerrar
      setEvidencias?.([]) // si existe el estado de evidencias, resetéalo
    }
  }, [open, initialServiceId, resolvedUserName])

  const parsed = React.useMemo(() => {
    const [la, lo] = coords.split(',').map(s => s?.trim()).filter(Boolean)
    const latNum = Number(la), lngNum = Number(lo)
    const valid =
      !Number.isNaN(latNum) && !Number.isNaN(lngNum) &&
      Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180
    return { lat: valid ? latNum : null, lng: valid ? lngNum : null, valid }
  }, [coords])

  const hasCoords = parsed.valid
  const googleUrl = React.useMemo(
    () => (hasCoords ? `https://www.google.com/maps?q=${parsed.lat},${parsed.lng}` : ''),
    [hasCoords, parsed]
  )
  const appleUrl = React.useMemo(
    () => (hasCoords ? `https://maps.apple.com/?ll=${parsed.lat},${parsed.lng}&q=Ubicación` : ''),
    [hasCoords, parsed]
  )

  const handleCopyLink = async () => {
    if (!googleUrl) return
    try { await navigator.clipboard.writeText(googleUrl) } catch {}
  }

  const handleGuardar = () => {
    if (!serviceId) return
    const data: ConfirmEventData = {
      serviceId,
      type,
      status,
      message: message.trim() || undefined,
      coords: hasCoords ? { lat: parsed.lat as number, lng: parsed.lng as number } : undefined,
      user: user.trim() || undefined,
      evidencias, // NUEVO: pasar archivos adjuntos al modal de confirmación
    }
    onSubmit(data)
  }

  const showUbicacion = type === 'Nota' && status === 'Pendiente'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo evento de monitoreo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-5">
          {/* Sección izquierda: Títulos (Servicio, Tipo, Estado) y Mensaje */}
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="Seleccione un servicio" /></SelectTrigger>
                <SelectContent>
                  {servicios.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.id} — {s.cliente?.nombreRazonSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {svcDetails && (
              <div className="rounded-md border p-3 bg-muted/40">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Cliente:</dt>
                  <dd className="truncate">{svcDetails.cliente || '-'}</dd>
                  <dt className="text-muted-foreground">Ruta:</dt>
                  <dd className="truncate">{svcDetails.ruta || '-'}</dd>
                  <dt className="text-muted-foreground">Destino:</dt>
                  <dd className="truncate">{svcDetails.destino || '-'}</dd>
                  <dt className="text-muted-foreground">Operador:</dt>
                  <dd className="truncate">{svcDetails.operador || '-'}</dd>
                  <dt className="text-muted-foreground">Tipo:</dt>
                  <dd className="truncate">{svcDetails.tipoUnidad || '-'}</dd>
                  <dt className="text-muted-foreground">Eco:</dt>
                  <dd className="truncate">{svcDetails.eco || '-'}</dd>
                  <dt className="text-muted-foreground">Placas:</dt>
                  <dd className="truncate">{svcDetails.placas || '-'}</dd>
                </dl>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as TrackingEventType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nota">Nota</SelectItem>
                    <SelectItem value="Ubicacion">Ubicación</SelectItem>
                    <SelectItem value="Estadia">Estadia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MonitoreoStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Encitio de carga">Encitio de carga</SelectItem>
                    <SelectItem value="En ruta">En ruta</SelectItem>
                    <SelectItem value="En destino">En destino</SelectItem>
                    <SelectItem value="Entregado">Entregado</SelectItem>
                    <SelectItem value="Incidencia">Incidencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showUbicacion && (
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Select value={ubicacionRef} onValueChange={(v) => setUbicacionRef(v as 'Origen' | 'Destino')}>
                  <SelectTrigger><SelectValue placeholder="Seleccione ubicación" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Origen">Origen</SelectItem>
                    <SelectItem value="Destino">Destino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mensaje / Nota</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Detalle del evento" />
            </div>
          </div>

          {/* Margen derecho: Usuario, Coordenadas, Liga, Copiar enlace, Evidencia */}
          <div className="md:col-span-2 md:border-l md:pl-6 space-y-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input
                placeholder="Usuario"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                readOnly={!userEditable}
              />
            </div>

            <div className="space-y-2">
              <Label>Coordenadas (Lat,Lng)</Label>
              <Input
                value={coords}
                onChange={(e) => setCoords(e.target.value)}
                placeholder="Ej. 25.6866,-100.3161"
              />
            </div>

            <div className="space-y-2">
              <Label>Liga de mapa (auto)</Label>
              <Input value={googleUrl} readOnly placeholder="Se generará con coordenadas válidas" />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={handleCopyLink} disabled={!googleUrl}>
                  Copiar enlace
                </Button>
                <a className="text-sm text-blue-600 underline" href={googleUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!googleUrl}>
                  Abrir en Google Maps
                </a>
                <span className="text-muted-foreground">/</span>
                <a className="text-sm text-blue-600 underline" href={appleUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!appleUrl}>
                  Abrir en Apple Maps
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Evidencia</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePickEvidence}
                  title="Evidencia"
                  aria-label="Adjuntar evidencia"
                >
                  <FolderOpen className="h-5 w-5" />
                </Button>
                {evidencias.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {evidencias.length} imagen(es) seleccionada(s)
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleEvidenceChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={!serviceId}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}