/**
 * Player-name search helpers.
 *
 * Query syntax:
 *   - case, accents and surrounding/duplicate whitespace are ignored
 *   - punctuation is ignored: "black widow" matches "-BlackWidow-"
 *   - words inside one term must all match:   "fat sassy"  → FatnSassy
 *   - commas (or "|") separate alternatives:  "fatn, shadow" → FatnSassy OR Shadowone
 *   - "#12" matches the player ranked 12 (when ranks are available)
 *   - if nothing matches exactly, callers can fall back to fuzzy matching
 *     (letters in order, gaps allowed): "fnssy" → FatnSassy
 */

export interface ParsedSearch {
  /** OR-groups of AND-tokens, each token already compacted */
  groups: string[][]
  /** Ranks requested with "#n" */
  ranks: number[]
  /** First plain term as typed (lowercased), used for highlighting */
  highlight: string
  isEmpty: boolean
}

/** Lowercase, strip accents, collapse whitespace */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalised text with everything except letters and digits removed */
export function compactSearchText(text: string): string {
  return normalizeSearchText(text).replace(/[^\p{L}\p{N}]/gu, '')
}

export function parseSearchQuery(query: string): ParsedSearch {
  const groups: string[][] = []
  const ranks: number[] = []
  let highlight = ''

  for (const rawTerm of query.split(/[,|]/)) {
    const term = normalizeSearchText(rawTerm)
    if (!term) continue

    const rankMatch = /^#\s*(\d+)$/.exec(term)
    if (rankMatch) {
      ranks.push(Number(rankMatch[1]))
      continue
    }

    const tokens = term.split(' ').map(compactSearchText).filter(Boolean)
    if (tokens.length === 0) continue
    groups.push(tokens)
    if (!highlight) highlight = term
  }

  return { groups, ranks, highlight, isEmpty: groups.length === 0 && ranks.length === 0 }
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (const ch of haystack) {
    if (ch === needle[i]) i++
    if (i === needle.length) return true
  }
  return needle.length === 0
}

/**
 * Does `name` (optionally ranked `rank`) match the parsed query?
 * `fuzzy` swaps substring matching for in-order letter matching.
 */
export function matchesSearch(name: string, parsed: ParsedSearch, rank?: number, fuzzy = false): boolean {
  if (parsed.isEmpty) return true
  if (rank !== undefined && parsed.ranks.includes(rank)) return true

  const compactName = compactSearchText(name)
  return parsed.groups.some((tokens) =>
    tokens.every((t) => (fuzzy ? t.length >= 3 && isSubsequence(t, compactName) : compactName.includes(t))),
  )
}

/** Split `text` around the first case-insensitive occurrence of `term` (for <mark> highlighting) */
export function splitHighlight(text: string, term: string): [string, string, string] | null {
  if (!term) return null
  const idx = normalizeSearchText(text).indexOf(term)
  // Only safe when normalisation didn't change the length (no stripped accents/whitespace)
  if (idx === -1 || normalizeSearchText(text).length !== text.length) return null
  return [text.slice(0, idx), text.slice(idx, idx + term.length), text.slice(idx + term.length)]
}
