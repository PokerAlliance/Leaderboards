/**
 * Badonks Donks League — Static Configuration
 *
 * Single source of truth for all hardcoded league data.
 * No API calls here — purely configuration.
 */

import type {
  DonksCupSlug,
  DonksCupConfig,
  DonksMedalConfig,
  DonksQuarterKey,
  DonksQuarter,
  DonksGameType,
} from '@/types/donks'

// ─── Cup Definitions ──────────────────────────────────────────────────────────

export const DONKS_CUPS: DonksCupConfig[] = [
  {
    slug: 'badonkidonk',
    name: 'The Badonkidonk Cup',
    shortName: 'BDK',
    gameType: 'holdem',
    day: 'wednesday',
    timeET: '1:00 PM',
    color: '#e85d04',
    compositeSlug: 'chuckcox',
  },
  {
    slug: 'puggywug',
    name: 'The puggywug Cup',
    shortName: 'PUG',
    gameType: 'holdem',
    day: 'wednesday',
    timeET: '7:00 PM',
    color: '#7b2d8b',
    compositeSlug: 'chuckcox',
  },
  {
    slug: 'blackwidow',
    name: 'The -BlackWidow- Cup',
    shortName: 'BW',
    gameType: 'holdem',
    day: 'sunday',
    timeET: '2:00 PM',
    color: '#c9184a',
    compositeSlug: 'chuckcox',
  },
  {
    slug: 'ladycon',
    name: 'The LadyCon Cup',
    shortName: 'LC',
    gameType: 'holdem',
    day: 'sunday',
    timeET: '6:00 PM',
    color: '#1a759f',
    compositeSlug: 'chuckcox',
  },
  {
    slug: 'boyd2',
    name: 'The boyd2 Open',
    shortName: 'B2',
    gameType: 'omaha',
    day: 'monday',
    timeET: '1:00 PM',
    color: '#2d6a4f',
    compositeSlug: 'omaha',
  },
  {
    slug: 'bopflop',
    name: 'The bopflop Omaha Open',
    shortName: 'BPF',
    gameType: 'omaha',
    day: 'monday',
    timeET: '5:30 PM',
    color: '#40916c',
    compositeSlug: 'omaha',
  },
]

// ─── Composite Medal Definitions ──────────────────────────────────────────────

export const DONKS_MEDALS: DonksMedalConfig[] = [
  {
    slug: 'chuckcox',
    name: 'The chuckcox Medal',
    shortName: 'HE Medal',
    gameType: 'holdem',
    cupSlugs: ['badonkidonk', 'puggywug', 'blackwidow', 'ladycon'],
    color: '#c9a227',
  },
  {
    slug: 'omaha',
    name: 'The Badonks Omaha Medal',
    shortName: 'PLO Medal',
    gameType: 'omaha',
    cupSlugs: ['boyd2', 'bopflop'],
    color: '#2d6a4f',
  },
]

// ─── Name → Slug Map (matches Replay API tournament name field) ───────────────

export const CUP_NAME_MAP: Record<string, DonksCupSlug> = {
  'The Badonkidonk Cup': 'badonkidonk',
  'The puggywug Cup': 'puggywug',
  'The -BlackWidow- Cup': 'blackwidow',
  'The LadyCon Cup': 'ladycon',
  'The boyd2 Open': 'boyd2',
  'The bopflop Omaha Open': 'bopflop',
}

// ─── Data Cutoff ──────────────────────────────────────────────────────────────

/** No data is tracked before this quarter. Quarter selector shows Q2 2026 as minimum. */
export const DATA_CUTOFF_QUARTER: DonksQuarterKey = {
  quarter: 'Q2',
  year: 2026,
}

// ─── Scoring Config ───────────────────────────────────────────────────────────

/** Number of top scores counted per player per leaderboard */
export const TOP_N_SCORES = 9

/** Constant buy-in value used in points formula */
export const DONKS_BUY_IN = 100_000

// ─── Static Content ───────────────────────────────────────────────────────────

export const LEAGUE_DESCRIPTION =
  "Welcome to Badonk's Donks Leagues. Our aim is to host the toughest tournaments on Replay Poker. " +
  'Membership is open to players who meet the Donk\'s qualifying criteria.'

export const HOW_TO_JOIN =
  'Interested in joining? Contact flashlight or naffy on ReplayPoker to learn more about qualifying criteria.'

export const CONTACT_LINKS = {
  flashlight: 'https://www.casino.org/replaypoker/profile/flashlight',
  naffy: 'https://www.casino.org/replaypoker/profile/nafffy',
}

export const LEAGUE_ID = 14

// ─── Quarter Utilities ────────────────────────────────────────────────────────

const QUARTER_MONTHS: Record<DonksQuarter, { startMonth: number; endMonth: number }> = {
  Q1: { startMonth: 0, endMonth: 2 },   // Jan–Mar
  Q2: { startMonth: 3, endMonth: 5 },   // Apr–Jun
  Q3: { startMonth: 6, endMonth: 8 },   // Jul–Sep
  Q4: { startMonth: 9, endMonth: 11 },  // Oct–Dec
}

const QUARTER_END_DAYS: Record<DonksQuarter, number> = {
  Q1: 31,  // March 31
  Q2: 30,  // June 30
  Q3: 30,  // September 30
  Q4: 31,  // December 31
}

/**
 * Returns the inclusive start and end dates for a given quarter.
 * e.g. Q1 2026 → { start: 2026-01-01, end: 2026-03-31 }
 */
export function getQuarterDateRange(key: DonksQuarterKey): { start: Date; end: Date } {
  const { quarter, year } = key
  const { startMonth, endMonth } = QUARTER_MONTHS[quarter]
  const endDay = QUARTER_END_DAYS[quarter]
  return {
    start: new Date(year, startMonth, 1, 0, 0, 0, 0),
    end: new Date(year, endMonth, endDay, 23, 59, 59, 999),
  }
}

/** Formats a Date as 'YYYY-MM-DD' for use in Viz API SQL queries */
export function formatDateForQuery(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns current quarter based on today's date */
export function getCurrentDonksQuarter(): DonksQuarterKey {
  const now = new Date()
  const month = now.getMonth()
  let quarter: DonksQuarter
  if (month <= 2) quarter = 'Q1'
  else if (month <= 5) quarter = 'Q2'
  else if (month <= 8) quarter = 'Q3'
  else quarter = 'Q4'
  return { quarter, year: now.getFullYear() }
}

/**
 * Returns all selectable quarters (Q2 2026 onwards, up to current).
 * Sorted descending (most recent first).
 */
export function getSelectableQuarters(): DonksQuarterKey[] {
  const current = getCurrentDonksQuarter()
  const result: DonksQuarterKey[] = []
  const cutoff = DATA_CUTOFF_QUARTER

  let { quarter, year } = current
  const quarterOrder: DonksQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

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

    // Safety: don't go before 2026
    if (year < 2026) break
  }

  return result
}

/** Returns a display label like "Q2 2026" */
export function quarterLabel(key: DonksQuarterKey): string {
  return `${key.quarter} ${key.year}`
}

// ─── Cup Lookups ──────────────────────────────────────────────────────────────

export function getDonksCup(slug: DonksCupSlug): DonksCupConfig | undefined {
  return DONKS_CUPS.find((c) => c.slug === slug)
}

export function getDonksMedal(slug: string): DonksMedalConfig | undefined {
  return DONKS_MEDALS.find((m) => m.slug === slug)
}

export function getCupsByGameType(gameType: DonksGameType): DonksCupConfig[] {
  return DONKS_CUPS.filter((c) => c.gameType === gameType)
}

export function getMedalForGameType(gameType: DonksGameType): DonksMedalConfig | undefined {
  return DONKS_MEDALS.find((m) => m.gameType === gameType)
}

export function identifyCupFromName(tournamentName: string): DonksCupSlug | null {
  return CUP_NAME_MAP[tournamentName] ?? null
}

// Re-export types so config and types can be imported from same place
export type { DonksGameType, DonksCupSlug }
