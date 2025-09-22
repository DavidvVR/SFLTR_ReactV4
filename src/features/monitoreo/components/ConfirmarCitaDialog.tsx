import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

// Estructura de la respuesta de la API de colonias
interface ColoniaInfo {
  colonia: string
  municipio: string
  estado: string
}

export function ConfirmarCitaDialog({ open, onOpenChange, items }: ConfirmarCitaDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>('')
  const [tipoUbicacion, setTipoUbicacion] = React.useState<'origen' | 'destino'>('origen')
  const [domicilio, setDomicilio] = React.useState(initialDomicilioState)

  // Estados para la búsqueda por Código Postal
  const [isLoadingCP, setIsLoadingCP] = React.useState(false)
  const [coloniasFound, setColoniasFound] = React.useState<ColoniaInfo[]>([])
  const [errorCP, setErrorCP] = React.useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setDomicilio((prev) => ({ ...prev, [id]: value }))

    // Si el campo que cambia es el código postal, reseteamos la búsqueda
    if (id === 'codigoPostal') {
      setColoniasFound([])
      setErrorCP(null)
      // Limpiamos los campos que dependen del CP
      setDomicilio((prev) => ({ ...prev, colonia: '', municipio: '', estado: '' }))
    }
  }

  // Efecto para buscar el CP cuando tenga 5 dígitos
  React.useEffect(() => {
    if (domicilio.codigoPostal.length === 5) {
      const fetchCP = async () => {
        setIsLoadingCP(true)
        setErrorCP(null)
        setColoniasFound([])
        try {
          // Usamos una API pública para obtener la información del CP
          const response = await fetch(`https://api.copomex.com/query/info_cp/${domicilio.codigoPostal}?token=pruebas`)
          if (!response.ok) throw new Error('No se pudo obtener la información del CP.')
          
          const data = await response.json()

          // --- INICIO DE LA CORRECCIÓN ---
          // La API puede devolver un objeto de error o un array con el resultado.
          if (data.error) {
            throw new Error(data.error_message || 'Código postal no encontrado.')
          }

          // Si la respuesta es exitosa, es un array. Accedemos al primer elemento.
          const result = Array.isArray(data) ? data[0] : data;
          if (!result || result.error || !result.response || !result.response.asentamiento) {
            throw new Error('La respuesta de la API no tiene el formato esperado o el CP no es válido.')
          }
          
          const responseData = result.response;
          // --- FIN DE LA CORRECCIÓN ---

          const colonias = responseData.asentamiento.map((col: string) => ({
            colonia: col,
            municipio: responseData.municipio,
            estado: responseData.estado,
          }))
          setColoniasFound(colonias)

        } catch (err: any) {
          setErrorCP(err.message || 'Error al buscar el código postal.')
        } finally {
          setIsLoadingCP(false)
        }
      }
      fetchCP()
    }
  }, [domicilio.codigoPostal])

  const handleColoniaSelect = (selectedColonia: string) => {
    const coloniaData = coloniasFound.find(c => c.colonia === selectedColonia)
    if (coloniaData) {
      setDomicilio(prev => ({
        ...prev,
        colonia: coloniaData.colonia,
        municipio: coloniaData.municipio,
        estado: coloniaData.estado,
      }))
    }
  }

  const handleConfirm = () => {
    if (!selectedServiceId) {
      console.error('Debe seleccionar un ID de servicio.')
      return
    }
    console.log('Cita confirmada:', { serviceId: selectedServiceId, tipoUbicacion, domicilio })
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (!open) {
      setSelectedServiceId('')
      setTipoUbicacion('origen')
      setDomicilio(initialDomicilioState)
      setColoniasFound([])
      setErrorCP(null)
      setIsLoadingCP(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Cita de Carga/Descarga</DialogTitle>
          <DialogDescription>
            Seleccione el servicio y complete los datos de la ubicación.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="service-id">ID de Servicio</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger id="service-id"><SelectValue placeholder="Seleccione un servicio..." /></SelectTrigger>
              <SelectContent>
                {items.length > 0 ? (
                  items.map((it) => (
                    <SelectItem key={it.serviceId} value={it.serviceId}>
                      {it.serviceId} {it.cliente ? `(${it.cliente})` : ''}
                    </SelectItem>
                  ))
                ) : ( <SelectItem value="no-items" disabled>No hay servicios</SelectItem> )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de ubicación</Label>
            <RadioGroup defaultValue="origen" value={tipoUbicacion} onValueChange={(value: 'origen' | 'destino') => setTipoUbicacion(value)} className="flex items-center gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="origen" id="r-origen" /><Label htmlFor="r-origen">Origen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="destino" id="r-destino" /><Label htmlFor="r-destino">Destino</Label></div>
            </RadioGroup>
          </div>

          {/* Sección de Domicilio Modificada */}
          <div className="grid gap-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground">Domicilio</h3>
            <div className="grid gap-4">
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
                  <Input id="codigoPostal" value={domicilio.codigoPostal} onChange={handleInputChange} placeholder="Ej. 44100" maxLength={5} />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="colonia">Colonia</Label>
                {isLoadingCP && <p className="text-sm text-muted-foreground">Buscando...</p>}
                {errorCP && <p className="text-sm text-destructive">{errorCP}</p>}
                {coloniasFound.length > 0 ? (
                  <Select onValueChange={handleColoniaSelect} value={domicilio.colonia}>
                    <SelectTrigger id="colonia"><SelectValue placeholder="Seleccione una colonia..." /></SelectTrigger>
                    <SelectContent>
                      {coloniasFound.map(c => <SelectItem key={c.colonia} value={c.colonia}>{c.colonia}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="colonia" value={domicilio.colonia} onChange={handleInputChange} placeholder="Ej. Centro" disabled={isLoadingCP || coloniasFound.length > 0} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input id="municipio" value={domicilio.municipio} onChange={handleInputChange} placeholder="Ej. Guadalajara" disabled={coloniasFound.length > 0} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" value={domicilio.estado} onChange={handleInputChange} placeholder="Ej. Jalisco" disabled={coloniasFound.length > 0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedServiceId || isLoadingCP}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}