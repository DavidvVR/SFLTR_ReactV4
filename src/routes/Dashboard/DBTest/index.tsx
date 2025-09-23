import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { listarClientes, crearCliente, borrarCliente } from '@/features/clientes/api'
import type { Cliente } from '@/features/clientes/types'

export const Route = createFileRoute('/Dashboard/DBTest/')({
  component: ClientesDBTest,
})

function ClientesDBTest() {
  const [clientes, setClientes] = React.useState<Cliente[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [form, setForm] = React.useState<Cliente>({
    id: 'LTR-CL-002',
    rfc: '',
    nombre: '',
    telefono: '',
    correo: '',
  })

  async function reload() {
    try {
      setLoading(true)
      setError(null)
      const list = await listarClientes()
      setClientes(list)
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { reload() }, [])

  async function onCrear() {
    try {
      setError(null)
      await crearCliente(form)
      setForm({ id: '', rfc: '', nombre: '', telefono: '', correo: '' })
      await reload()
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear cliente')
    }
  }

  async function onBorrar(id: string) {
    try {
      setError(null)
      await borrarCliente(id)
      await reload()
    } catch (e: any) {
      setError(e?.message ?? 'Error al borrar cliente')
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 820 }}>
      <h1>Prueba DB – Clientes</h1>
      {loading && <p>Cargando…</p>}
      {error && <p style={{ color: 'tomato' }}>{error}</p>}

      {!loading && (
        <>
          <ul style={{ padding: 0, listStyle: 'none', marginBottom: 16 }}>
            {clientes.map(c => (
              <li key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #333' }}>
                <strong>{c.id}</strong>
                <span>{c.nombre}</span>
                <small style={{ opacity: 0.7 }}>{c.rfc}</small>
                <button style={{ marginLeft: 'auto' }} onClick={() => onBorrar(c.id)}>Eliminar</button>
              </li>
            ))}
          </ul>

          <h3>Nuevo cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input placeholder="ID (ej. LTR-CL-003)" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
            <input placeholder="RFC" value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value })} />
            <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Teléfono" value={form.telefono ?? ''} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            <input placeholder="Correo" value={form.correo ?? ''} onChange={e => setForm({ ...form, correo: e.target.value })} />
          </div>
          <button onClick={onCrear}>Guardar</button>
        </>
      )}
    </div>
  )
}
