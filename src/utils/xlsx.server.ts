// Wrapper de uso exclusivo en servidor (Node) para xlsx (ESM).
// Evita importar cpexcel por defecto y configura fs para readFile/writeFile.
export async function getXLSXServer() {
  if (typeof window !== 'undefined') {
    throw new Error('getXLSXServer solo debe usarse en el servidor')
  }
  const XLSX: any = await import('xlsx/xlsx.mjs')
  const fs = await import('node:fs')
  XLSX.set_fs?.(fs)
  return XLSX
}

// Versión opcional con codepages extendidas (solo si realmente lo necesitas)
// Nota: añade peso al bundle de la función server.
export async function getXLSXServerWithCptable() {
  const XLSX: any = await getXLSXServer()
  const cpexcel = await import('xlsx/dist/cpexcel.full.mjs')
  XLSX.set_cptable?.(cpexcel)
  return XLSX
}

// Helpers

export async function readWorkbookFromFilePath(filePath: string) {
  const XLSX = await getXLSXServer()
  // Usa fs configurado vía set_fs
  return XLSX.readFile(filePath)
}

export async function readWorkbookFromBuffer(buf: ArrayBuffer | Buffer) {
  const XLSX = await getXLSXServer()
  const nodeBuf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBufferLike)
  return XLSX.read(nodeBuf, { type: 'buffer' })
}

export async function writeWorkbookToFilePath(workbook: any, filePath: string) {
  const XLSX = await getXLSXServer()
  XLSX.writeFile(workbook, filePath)
}

export async function jsonToWorkbook(sheets: Record<string, unknown[]>) {
  const XLSX = await getXLSXServer()
  const wb = XLSX.utils.book_new()
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows ?? [])
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  return wb
}