/**
 * Barnyard Muckers League — Static Configuration
 *
 * Single source of truth for all hardcoded league data.
 * No API calls here — purely configuration.
 */

import type {
  MuckersQuarterKey,
  MuckersQuarter,
  MuckersSlotConfig,
  MuckersGameSlot,
  MuckersPrimarySlot,
} from '@/types/muckers'

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Points awarded by finishing position.
 * Stored as a configurable object so scoring adjustments
 * (e.g. 26 for first instead of 25) only require this one change.
 */
export const MUCKERS_POINTS_TABLE: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
}

export function getMuckersPoints(position: number): number {
  return MUCKERS_POINTS_TABLE[position] ?? 0
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export const MUCKERS_LEAGUE_ID = 35

export const MUCKERS_GAME_SLOTS: MuckersPrimarySlot[] = ['A', 'B', 'D']

export const MUCKERS_SCHEDULE: MuckersSlotConfig[] = [
  { slot: 'A', dayOfWeek: 4, dayLabel: 'Thursday', timeEST: '7:00 PM' },
  { slot: 'B', dayOfWeek: 5, dayLabel: 'Friday', timeEST: '10:00 AM' },
  { slot: 'D', dayOfWeek: 6, dayLabel: 'Saturday', timeEST: '1:00 PM' },
]

/** Maps Replay API tournament name → game slot identifier */
export const MUCKERS_TOURNAMENT_NAME_MAP: Record<string, MuckersGameSlot> = {
  'Barnyard Muckers A': 'A',
  'Barnyard Muckers B': 'B',
  'Barnyard Muckers C': 'C',
  'Barnyard Muckers D': 'D',
  'Barnyard Muckers A2': 'A2',
  'Barnyard Muckers B2': 'B2',
  'Barnyard Muckers C2': 'C2',
  'Barnyard Muckers D2': 'D2',
}

// ─── Data Cutoff ─────────────────────────────────────────────────────────────

/** No data is tracked before this quarter. Quarter selector shows Q2 2026 as minimum. */
export const DATA_CUTOFF_QUARTER: MuckersQuarterKey = {
  quarter: 'Q2',
  year: 2026,
}

// ─── Static Content ──────────────────────────────────────────────────────────

export const LEAGUE_DESCRIPTION =
  'Barnyard Muckers is a team-based SNG poker league on ReplayPoker. ' +
  'Teams of up to 6 members compete across 3 weekly tables, fielding different players each game. ' +
  'The team with the most cumulative points at the end of each quarter wins the trophy.'

export const RULES_SUMMARY = [
  'Each team has up to 6 members',
  'Teams choose 3 different players each week (one per table)',
  'The same player cannot play twice in a week',
  'Points are awarded based on finishing position',
  'Season resets quarterly — champion crowned at end',
  'Bye tables are used when the primary table has issues',
]

// ─── Quarter Utilities ───────────────────────────────────────────────────────

const QUARTER_MONTHS: Record<MuckersQuarter, { startMonth: number; endMonth: number }> = {
  Q1: { startMonth: 0, endMonth: 2 },
  Q2: { startMonth: 3, endMonth: 5 },
  Q3: { startMonth: 6, endMonth: 8 },
  Q4: { startMonth: 9, endMonth: 11 },
}

const QUARTER_END_DAYS: Record<MuckersQuarter, number> = {
  Q1: 31,
  Q2: 30,
  Q3: 30,
  Q4: 31,
}

/**
 * Returns the inclusive start and end dates for a given quarter.
 * e.g. Q2 2026 → { start: 2026-04-01, end: 2026-06-30 }
 */
export function getMuckersQuarterDateRange(key: MuckersQuarterKey): { start: Date; end: Date } {
  const { quarter, year } = key
  const { startMonth, endMonth } = QUARTER_MONTHS[quarter]
  const endDay = QUARTER_END_DAYS[quarter]
  return {
    start: new Date(year, startMonth, 1, 0, 0, 0, 0),
    end: new Date(year, endMonth, endDay, 23, 59, 59, 999),
  }
}

/** Returns current quarter based on today's date */
export function getCurrentMuckersQuarter(): MuckersQuarterKey {
  const now = new Date()
  const month = now.getMonth()
  let quarter: MuckersQuarter
  if (month <= 2) quarter = 'Q1'
  else if (month <= 5) quarter = 'Q2'
  else if (month <= 8) quarter = 'Q3'
  else quarter = 'Q4'
  return { quarter, year: now.getFullYear() }
}

/**
 * Returns all selectable quarters from DATA_CUTOFF_QUARTER to current.
 * Sorted descending (most recent first).
 */
export function getSelectableMuckersQuarters(): MuckersQuarterKey[] {
  const current = getCurrentMuckersQuarter()
  const result: MuckersQuarterKey[] = []
  const cutoff = DATA_CUTOFF_QUARTER
  const quarterOrder: MuckersQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

  let { quarter, year } = current

  while (true) {
    result.push({ quarter, year })

    if (quarter === cutoff.quarter && year === cutoff.year) break

    const idx = quarterOrder.indexOf(quarter)
    if (idx === 0) {
      quarter = 'Q4'
      year -= 1
    } else {
      quarter = quarterOrder[idx - 1]!
    }

    if (year < 2025) break
  }

  return result
}

/** Returns a display label like "Q2 2026" */
export function getMuckersQuarterLabel(key: MuckersQuarterKey): string {
  return `${key.quarter} ${key.year}`
}

/** Formats a Date as 'YYYY-MM-DD' */
export function formatDateForQuery(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Re-export types for convenience
export type { MuckersQuarter, MuckersPrimarySlot, MuckersGameSlot }
