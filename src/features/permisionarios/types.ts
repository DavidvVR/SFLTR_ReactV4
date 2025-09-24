export interface Permisionario {
  id: string
  rfc: string
  razonSocial: string
  alias?: string
  estatus: 'Activo' | 'Inactivo'
  unidades?: any[]
  operadores?: any[]
}