export interface Cliente {
  id: string
  rfc: string
  nombre: string
  telefono?: string | null
  correo?: string | null
  created_at?: string
}
