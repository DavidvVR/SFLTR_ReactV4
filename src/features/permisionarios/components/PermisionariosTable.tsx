import * as React from 'react'
import type { Permisionario } from '../permisionarioslocal'

type Props = {
  rows: Permisionario[]
  onEdit?: (row: Permisionario) => void
}

export default function PermisionariosTable({ rows, onEdit }: Props) {
  if (!rows.length) {
    return <div className="text-sm text-muted-foreground">Sin registros aún.</div>
  }

  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-3 py-2 text-left">ID</th>
            <th className="px-3 py-2 text-left">RFC</th>
            <th className="px-3 py-2 text-left">Razón social</th>
            <th className="px-3 py-2 text-left">Alias</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.id}</td>
              <td className="px-3 py-2">{r.rfc}</td>
              <td className="px-3 py-2">{r.razonSocial}</td>
              <td className="px-3 py-2">{r.alias || '—'}</td>
              <td className="px-3 py-2 text-right">
                <button
                  className="rounded border px-2 py-1 hover:bg-muted"
                  onClick={() => onEdit?.(r)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
