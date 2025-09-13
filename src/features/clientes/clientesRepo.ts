// src/features/clientes/clientesRepo.ts
import type { Cliente, NewCliente } from "@/features/clientes/clientesLocal"
import * as local from "@/features/clientes/clientesLocal"

export interface ClientesRepo {
  list(): Promise<Cliente[]>
  get(id: string): Promise<Cliente | undefined>
  add(input: NewCliente): Promise<Cliente>
  update(id: string, patch: Partial<Omit<Cliente, "id" | "createdAt">>): Promise<Cliente>
  remove(id: string): Promise<boolean>
}

const localRepo: ClientesRepo = {
  async list() { return local.listClientes() },
  async get(id) { return local.getCliente(id) },
  async add(input) { return local.addCliente(input) },
  async update(id, patch) { return local.updateCliente(id, patch) },
  async remove(id) { return local.removeCliente(id) },
}

export const clientesRepo = localRepo // mañana lo cambias a apiRepo
