import * as React from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ServiceItem {
  serviceId: string
  cliente?: string
}

interface ConfirmarCitaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ServiceItem[]
}

const initialDomicilioState = {
  calle: '',
  numeroExt: '',
  codigoPostal: '',
  colonia: '',
  municipio: '',
  estado: '',
}

// Nuevos datos complementarios
const initialComplementarios = {
  rfc: '',
  nombre: '',
  fechaHora: '', // formato para <input type="datetime-local">
}



export function ConfirmarCitaDialog({ open, onOpenChange, items }: ConfirmarCitaDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>('')
  const [tipoUbicacion, setTipoUbicacion] = React.useState<'origen' | 'destinos'>('origen')
  const [domicilio, setDomicilio] = React.useState(initialDomicilioState)
  const [complementarios, setComplementarios] = React.useState(initialComplementarios)
  const [km, setKm] = React.useState<string>('') // NUEVO

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setDomicilio((prev) => ({ ...prev, [id]: value }))
  }

  // Handler para Datos complementarios
  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setComplementarios((prev) => ({ ...prev, [id]: value }))
  }

  // Obtiene datos del cliente a partir del servicio seleccionado
  const getClienteData = React.useCallback(() => {
    const it = items?.find(i => String(i.serviceId) === String(selectedServiceId))
    const nombre =
      it?.cliente ??
      (it as any)?.nombre ??
      (it as any)?.nombreCliente ??
      ''
    const rfc =
      (it as any)?.rfc ??
      (it as any)?.clienteRfc ??
      (it as any)?.rfcCliente ??
      (it as any)?.rfc_cliente ??
      ''
    return { nombre, rfc }
  }, [items, selectedServiceId])

  // Autollenar RFC y Nombre solo cuando se seleccione "origen" y haya servicio
  React.useEffect(() => {
    if (!selectedServiceId) return
    if (tipoUbicacion !== 'origen') return
    const { nombre, rfc } = getClienteData()
    if (!nombre && !rfc) return
    setComplementarios(prev => ({
      ...prev,
      nombre: prev.nombre || nombre || '',
      rfc: prev.rfc || rfc || '',
    }))
  }, [tipoUbicacion, selectedServiceId, getClienteData])

  const handleConfirm = () => {
    if (!selectedServiceId) return
    console.log('Cita confirmada:', {
      serviceId: selectedServiceId,
      tipoUbicacion,
      km: tipoUbicacion === 'destinos' && km !== '' ? Number(km) : undefined,
      complementarios,
      domicilio,
    })
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (!open) {
      setSelectedServiceId('')
      setTipoUbicacion('origen')
      setDomicilio(initialDomicilioState)
      setComplementarios(initialComplementarios)
      setKm('') // limpiar km
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="cita-desc">
        <DialogHeader>
          <DialogTitle>Confirmar Cita de Carga/Descarga</DialogTitle>
          <DialogDescription id="cita-desc">
            Seleccione el servicio y complete los datos de la ubicación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Servicio */}
          <div className="grid gap-2">
            <Label htmlFor="service-id">ID de Servicio</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger id="service-id">
                <SelectValue placeholder="Seleccione un servicio..." />
              </SelectTrigger>
              <SelectContent>
                {items.length > 0 ? (
                  items.map((it) => (
                    <SelectItem key={it.serviceId} value={it.serviceId}>
                      {it.serviceId} {it.cliente ? `(${it.cliente})` : ''}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-items" disabled>No hay servicios</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo ubicación */}
          <div className="grid gap-2">
            <Label>Tipo de ubicación</Label>
            <RadioGroup
              value={tipoUbicacion}
              onValueChange={(v: 'origen' | 'destinos') => {
                setTipoUbicacion(v)
                if (v !== 'destinos') setKm('')
              }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="origen" id="r-origen" />
                <Label htmlFor="r-origen">Origen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="destinos" id="r-destinos" />
                <Label htmlFor="r-destinos">Destinos</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Km: solo cuando tipoUbicacion = 'destinos' */}
          {tipoUbicacion === 'destinos' && (
            <div className="grid gap-2">
              <Label htmlFor="km">Km</Label>
              <Input
                id="km"
                type="number"
                inputMode="numeric"
                min={0}
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="Ej. 120"
              />
            </div>
          )}

          {/* Datos complementarios */}
          <div className="grid gap-4 pt-2">
            <h3 className="font-medium text-sm text-muted-foreground">Datos complementarios</h3>

            <div className="grid gap-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                value={complementarios.rfc}
                onChange={handleExtraChange}
                placeholder="Ej. ABCD123456XYZ"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={complementarios.nombre}
                onChange={handleExtraChange}
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fechaHora">Fecha y hora</Label>
              <Input
                id="fechaHora"
                type="datetime-local"
                value={complementarios.fechaHora}
                onChange={handleExtraChange}
              />
            </div>
          </div>

          {/* Domicilio */}
          <div className="grid gap-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground">Domicilio</h3>

            <div className="grid gap-2">
              <Label htmlFor="calle">Calle</Label>
              <Input id="calle" value={domicilio.calle} onChange={handleInputChange} placeholder="Ej. Av. Principal" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="numeroExt">Número ext.</Label>
                <Input id="numeroExt" value={domicilio.numeroExt} onChange={handleInputChange} placeholder="Ej. 123" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  value={domicilio.codigoPostal}
                  onChange={handleInputChange}
                  placeholder="Ej. 44100"
                  maxLength={5}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colonia">Colonia</Label>
              <Input id="colonia" value={domicilio.colonia} onChange={handleInputChange} placeholder="Ej. Centro" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="municipio">Municipio</Label>
                <Input id="municipio" value={domicilio.municipio} onChange={handleInputChange} placeholder="Ej. Guadalajara" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" value={domicilio.estado} onChange={handleInputChange} placeholder="Ej. Jalisco" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedServiceId}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}