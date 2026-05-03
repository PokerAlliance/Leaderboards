/**
 * Google Visualization API Client
 *
 * Primary reader for Donks Google Sheets data.
 * Supports SQL-like query language for server-side filtering.
 *
 * Tier 1: Direct Visualization API (no quota, no auth needed for public sheets)
 * Tier 2: AppScript fallback (via appScriptClient.getSheet)
 *
 * Promoted from the proof-of-concept in SheetsApiPoc.vue.
 */

import { appScriptClient, isAppScriptConfigured } from '@/services/appscript'

const SPREADSHEET_ID = import.meta.env.VITE_SHEETS_ID as string

function buildVizUrl(sheetName: string, query?: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`
  const sheetParam = `&sheet=${encodeURIComponent(sheetName)}`
  const queryParam = query ? `&tq=${encodeURIComponent(query)}` : ''
  return `${base}${sheetParam}${queryParam}`
}

interface VizRow {
  c: Array<{ v: unknown; f?: string } | null>
}

interface VizTable {
  cols: Array<{ id: string; label: string; type: string }>
  rows: VizRow[]
}

interface VizResponse {
  status: 'ok' | 'error'
  table?: VizTable
  errors?: Array<{ reason: string; message: string; detailed_message?: string }>
}

async function parseVizResponse(text: string): Promise<VizResponse> {
  // Google wraps the JSON in a JSONP-style callback — strip it
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/)
  if (!match || !match[1]) {
    throw new Error('Failed to parse Google Visualization response: unexpected format')
  }
  return JSON.parse(match[1]) as VizResponse
}

/**
 * Fetch rows from a Google Sheet using the Visualization API with optional SQL query.
 *
 * @param sheetName  - Sheet tab name (e.g. 'donks_results_2026')
 * @param query      - Optional SQL-like query string (e.g. "SELECT * WHERE B >= date '2026-04-01'")
 * @param rowMapper  - Function to transform [colNames, rawCellValues] into typed objects
 * @returns Array of typed rows
 */
export async function fetchVizQuery<T>(
  sheetName: string,
  query: string,
  rowMapper: (cols: string[], cells: unknown[]) => T
): Promise<T[]> {
  const url = buildVizUrl(sheetName, query)

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) {
      throw new Error(`Visualization API HTTP error: ${response.status}`)
    }

    const text = await response.text()
    const data = await parseVizResponse(text)

    if (data.status === 'error') {
      const msgs = data.errors?.map((e) => e.detailed_message || e.message).join(', ') ?? 'Unknown error'
      throw new Error(`Visualization API query error: ${msgs}`)
    }

    if (!data.table) {
      return []
    }

    const cols = data.table.cols.map((c) => c.label || c.id)
    return (data.table.rows ?? []).map((row) => {
      const cells = row.c.map((cell) => cell?.v ?? null)
      return rowMapper(cols, cells)
    })
  } catch (vizError) {
    // Tier 2: AppScript fallback
    if (isAppScriptConfigured()) {
      console.warn('[vizApiClient] Visualization API failed, falling back to AppScript:', vizError)
      // AppScript fallback returns all rows; client-side filtering applied post-fetch
      const raw = await appScriptClient.getSheet<Record<string, string>>(sheetName)
      return raw.map((row) => {
        const cols = Object.keys(row)
        const cells = Object.values(row)
        return rowMapper(cols, cells)
      })
    }
    throw vizError
  }
}

/**
 * Fetch all rows from a sheet without a query filter.
 * Useful when you need the full dataset (e.g. config sheets).
 */
export async function fetchVizSheet<T>(
  sheetName: string,
  rowMapper: (cols: string[], cells: unknown[]) => T
): Promise<T[]> {
  return fetchVizQuery<T>(sheetName, 'SELECT *', rowMapper)
}

/**
 * Convenience helper: fetch a sheet as plain string-keyed records.
 * Column names are lowercased and spaces replaced with underscores.
 */
export async function fetchVizSheetRaw(sheetName: string, query = 'SELECT *'): Promise<Record<string, unknown>[]> {
  return fetchVizQuery<Record<string, unknown>>(sheetName, query, (cols, cells) => {
    const row: Record<string, unknown> = {}
    cols.forEach((col, i) => {
      const key = col.toLowerCase().replace(/\s+/g, '_') || `col_${i}`
      row[key] = cells[i]
    })
    return row
  })
}
