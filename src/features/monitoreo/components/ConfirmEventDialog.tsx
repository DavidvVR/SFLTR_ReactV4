import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { MonitoreoStatus, TrackingEventType } from '../types'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// Interfaz simplificada sin datos del servicio
export interface ConfirmEventData {
  serviceId: string
  type: TrackingEventType
  status: MonitoreoStatus
  message?: string
  coords?: { lat: number; lng: number }
  user?: string
  evidencias?: File[]
}

interface ConfirmEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ConfirmEventData
  onConfirm: () => void
}

export function ConfirmEventDialog({ open, onOpenChange, data, onConfirm }: ConfirmEventDialogProps) {
  // Destructuración simplificada sin campos de servicio
  const {
    serviceId, type, status, message, coords, user, evidencias,
  } = data

  const googleUrl = React.useMemo(
    () => (coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : ''),
    [coords]
  )

  const previews = React.useMemo(
    () => (evidencias ?? []).map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    [evidencias]
  )
  React.useEffect(() => {
    return () => { previews.forEach((p) => URL.revokeObjectURL(p.url)) }
  }, [previews])

  const pdfRef = React.useRef<HTMLDivElement | null>(null)

  const handleDownloadPDF = async () => {
    try {
      if (!pdfRef.current) return
      const node = pdfRef.current
      await new Promise(requestAnimationFrame)
      const canvas = await html2canvas(node, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, allowTaint: true, foreignObjectRendering: false,
        onclone: (doc) => {
          doc.documentElement.style.background = '#ffffff'
          doc.body.style.background = '#ffffff'
          doc.documentElement.className = ''
          doc.body.className = ''
          doc.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => n.parentNode?.removeChild(n))
          const el = doc.getElementById('pdf-print')
          if (el) {
            el.removeAttribute('class')
            el.setAttribute('style', [
              'position:static','background:#ffffff','color:#111111','padding:24px','width:900px','margin:0 auto',
              'font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif',
            ].join(';'))
            el.querySelectorAll<HTMLElement>('*').forEach((child) => {
              child.removeAttribute('class')
              child.style.background = 'transparent'
              child.style.backgroundImage = 'none'
              child.style.color = '#111111'
              child.style.borderColor = '#e5e7eb'
              child.style.boxShadow = 'none'
              child.style.filter = 'none'
              child.style.textShadow = 'none'
            })
          }
        },
        windowWidth: node.scrollWidth, windowHeight: node.scrollHeight,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`evento_${serviceId || 'sin_id'}.pdf`)
    } catch (e) {
      console.error('Error al generar PDF:', e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[calc(100vh-96px)] flex flex-col overflow-hidden"
        aria-describedby="confirm-desc"
      >
        <DialogHeader>
          <DialogTitle>Confirmar guardado de evento</DialogTitle>
          <DialogDescription id="confirm-desc">Vista previa del evento a registrar.</DialogDescription>
        </DialogHeader>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-auto">
          {/* Resumen del evento */}
          <div className="space-y-3 text-sm pr-1">
            <p><strong>ID Servicio:</strong> {serviceId || '-'}</p>
            <p><strong>Tipo:</strong> {type}</p>
            <p><strong>Estado:</strong> {status}</p>
            <p><strong>Usuario:</strong> {user || '-'}</p>
            <p><strong>Coordenadas:</strong> {coords ? `${coords.lat}, ${coords.lng}` : '-'}</p>
            {googleUrl && (
              <p>
                <strong>Liga de ubicación:</strong>{' '}
                <a className="text-blue-600 underline" href={googleUrl} target="_blank" rel="noreferrer">
                  {googleUrl}
                </a>
              </p>
            )}
            <p className="whitespace-pre-wrap"><strong>Mensaje:</strong> {message || '-'}</p>

            {/* SECCIÓN DE DATOS DE SERVICIO ELIMINADA */}

            {previews.length > 0 && (
              <div className="space-y-2">
                <p><strong>Evidencia:</strong></p>
                <div className="flex flex-wrap items-start gap-2">
                  {previews.map((p) => (
                    <img key={p.url} src={p.url} alt={p.name} className="max-h-56 max-w-full rounded border object-contain" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido invisible para PDF */}
        <div
          id="pdf-print"
          ref={pdfRef}
          style={{ position: 'fixed', inset: 0, opacity: 0, pointerEvents: 'none', width: 900, margin: '0 auto', background: 'white', padding: 24, color: '#111' }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Evento de Monitoreo</h2>

          {/* Datos de evento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
            <div>
              <p><strong>ID Servicio:</strong> {serviceId || '-'}</p>
              <p><strong>Tipo:</strong> {type}</p>
              <p><strong>Estado:</strong> {status}</p>
            </div>
            <div>
              <p><strong>Usuario:</strong> {user || '-'}</p>
              <p><strong>Coordenadas:</strong> {coords ? `${coords.lat}, ${coords.lng}` : '-'}</p>
              {googleUrl && (<p style={{ wordBreak: 'break-all' }}><strong>Liga:</strong> {googleUrl}</p>)}
            </div>
          </div>

          {/* SECCIÓN DE DATOS DE SERVICIO ELIMINADA DEL PDF */}

          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600 }}>Mensaje</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{message || '-'}</p>
          </div>

          {previews.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Evidencias</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {previews.map((p) => (
                  <img key={p.url} src={p.url} alt={p.name} style={{ width: '100%', maxHeight: 520, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="outline" onClick={handleDownloadPDF}>Descargar PDF</Button>
          <Button onClick={onConfirm} disabled={!serviceId}>Confirmar y guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}