import * as React from 'react'
import { listResumen, listEvents, addEvent, setStatus } from '../data/monitoreo-local'
import { MonitoreoResumen, MonitoreoStatus, TrackingEventType } from '../types'
import { listAsignaciones } from '@/features/asignacion/data/asignacion-store'
import { getServiceMeta } from '@/features/asignacion/data/service-meta-store'

export function useMonitoreo() {
  const [resumen, setResumen] = React.useState<MonitoreoResumen[]>([])
  const [q, setQ] = React.useState('')

  const refresh = React.useCallback(() => {
    setResumen(listResumen())
  }, [])

  React.useEffect(() => { refresh() }, [refresh])

  const items = React.useMemo(() => {
    const base = listAsignaciones()
    const term = q.trim().toLowerCase()
    return resumen
      .map(r => {
        const rec = base.find(b => b.id === r.serviceId)
        const meta = getServiceMeta(r.serviceId)
        return {
          serviceId: r.serviceId,
          status: r.status,
          lastEventAt: r.lastEventAt,
          cliente: rec?.cliente?.nombreRazonSocial ?? '',
          ruta: rec?.ruta ?? '',
          operador: rec?.operadores?.[0]?.nombre ?? '',
          unidad: `ECO ${rec?.unidades?.[0]?.eco ?? ''} / ${rec?.unidades?.[0]?.placa ?? ''}`,
          clienteRFC: meta?.clienteRFC ?? '',
        }
      })
      .filter(item => {
        if (!term) return true
        return [
          item.serviceId,
          item.cliente,
          item.ruta,
          item.operador,
          item.unidad,
          item.clienteRFC,
          item.status,
        ].some(v => (v ?? '').toString().toLowerCase().includes(term))
      })
  }, [resumen, q])

  function registrarEvento(serviceId: string, type: TrackingEventType, status?: MonitoreoStatus, message?: string, coords?: { lat: number; lng: number }) {
    addEvent(serviceId, { type, status, message, lat: coords?.lat, lng: coords?.lng })
    refresh()
  }

  function cambiarEstado(serviceId: string, status: MonitoreoStatus) {
    setStatus(serviceId, status)
    refresh()
  }

  function eventosDe(serviceId: string) {
    return listEvents(serviceId)
  }

  return { items, q, setQ, refresh, registrarEvento, cambiarEstado, eventosDe }
}