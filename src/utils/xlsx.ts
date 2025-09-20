// Utilidades para importar xlsx de forma segura (ESM) y solo cuando se necesita.
export async function getXLSX() {
  // Entrada ESM que no intenta cargar cpexcel.js
  const XLSX = await import('xlsx/xlsx.mjs')
  return XLSX
}

// Helpers opcionales de conveniencia
export async function readWorkbookFromFile(file: File) {
  const XLSX = await getXLSX()
  const buf = await file.arrayBuffer()
  return XLSX.read(buf, { type: 'array' })
}

export async function exportWorkbook(workbook: any, filename: string) {
  const XLSX = await getXLSX()
  XLSX.writeFile(workbook, filename)
}




import { getXLSX as getXLSXClient } from '@/utils/xlsx'
import { getXLSXServer } from '@/utils/xlsx.server'

async function handleExportXLSX() {
  const XLSX = await getXLSX()
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja')
  XLSX.writeFile(wb, 'archivo.xlsx') // descarga en navegador
}

export async function generarExcelEnServidor(rows: unknown[]) {
  const XLSX = await getXLSXServer()
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  // En Vercel Serverless, escribe solo en /tmp
  const out = `/tmp/reporte_${Date.now()}.xlsx`
  XLSX.writeFile(wb, out)
  return out
}