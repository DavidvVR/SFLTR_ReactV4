import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { MonitoreoTable } from '@/features/monitoreo/components/MonitoreoTable'
import { useMonitoreo } from '@/features/monitoreo/hooks/useMonitoreo'
import { ConfirmEventDialog, type ConfirmEventData } from '@/features/monitoreo/components/ConfirmEventDialog'
import { AddEventDialog } from '@/features/monitoreo/components/AddEventDialog'

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

export const Route = createFileRoute('/dashboard/monitoreo')({
  component: function MonitoreoPage() {
    const { items, q, setQ, registrarEvento } = useMonitoreo()
    const [open, setOpen] = React.useState(false)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [staged, setStaged] = React.useState<ConfirmEventData | null>(null)
    const [initialServiceId, setInitialServiceId] = React.useState<string>('')

    const currentUserName = React.useMemo(() => getLoggedUserName(), [])

    const handleStageSubmit = (data: ConfirmEventData) => {
      setStaged(data)
      setConfirmOpen(true)
    }

    const handleConfirmGuardar = () => {
      if (!staged) return
      registrarEvento(
        staged.serviceId,
        staged.type,
        staged.status,
        staged.message,
        staged.coords
      )
      setConfirmOpen(false)
      setOpen(false)
      setInitialServiceId('')
      setStaged(null)
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Monitoreo</h1>
            <p className="text-muted-foreground">Seguimiento de servicios por ID</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpen(true)}>Agregar evento</Button>
          </div>
        </div>

        <MonitoreoTable items={items} q={q} onQChange={setQ} onVerEventos={(id) => setInitialServiceId(id)} />

        <AddEventDialog
          open={open}
          onOpenChange={setOpen}
          initialServiceId={initialServiceId}
          onSubmit={handleStageSubmit}
          currentUserName={currentUserName}
          userEditable={false}
        />

        {staged && (
          <ConfirmEventDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            data={staged}
            onConfirm={handleConfirmGuardar}
          />
        )}
      </div>
    )
  },
})
