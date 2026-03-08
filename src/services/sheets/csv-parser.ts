/**
 * CSV Parser Utility
 * Parses CSV data from Google Sheets
 */

export function parseCSV(
  csvText: string,
  options: { trimValues?: boolean } = {}
): Record<string, string>[] {
  const { trimValues = true } = options

  const lines = csvText.split('\n').filter((line) => line.trim() !== '')
  if (lines.length < 2) return []

  const firstLine = lines[0]
  if (!firstLine) return []

  const headers = parseCSVLine(firstLine).map((h) => (trimValues ? h.trim() : h))
  const results: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      let value: string = values[index] ?? ''
      if (trimValues) {
        value = value.trim()
      }
      row[header] = value
    })

    results.push(row)
  }

  return results
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current)
  return result
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  return false
}

export function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? new Date() : date
  }
  return new Date()
}
