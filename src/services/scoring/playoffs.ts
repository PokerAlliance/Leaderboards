/**
 * Donks Playoff Engine — Pure Computation Module
 *
 * All playoff logic extracted here for testability. No Vue reactivity,
 * no store access, no side effects. Every function is pure.
 *
 * The store calls computePlayoffState() which orchestrates everything.
 */

import type {
  DonksPlayerResult,
  DonksGame,
  DonksCupSlug,
  DonksPlayoffConfig,
  DonksPlayoffPhase,
  DonksPlayoffQualifier,
  DonksPlayoffLeaderboardEntry,
  DonksPlayoffGameSummary,
  DonksPlayoffState,
  DonksQuarterKey,
  DonksQuarter,
} from '@/types/donks'
import { calculateTopN } from '@/services/scoring/strategies/donks'
import { HOLDEM_CUP_SLUGS, DONKS_CUPS, TOP_N_SCORES, getQuarterDateRange } from '@/config/donks'

// ─── Playoff Window Detection ─────────────────────────────────────────────────

const HOLDEM_CUP_ORDER: DonksCupSlug[] = ['badonkidonk', 'puggywug', 'blackwidow', 'ladycon']
const OMAHA_CUP_SLUGS: ReadonlySet<DonksCupSlug> = new Set(['boyd2', 'bopflop'] as DonksCupSlug[])

// ─── Schedule Helpers ──────────────────────────────────────────────────────────

const DAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

function formatGameId(date: Date, cupSlug: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `game_${y}_${m}_${d}_${cupSlug}`
}

function isGameIdInQuarter(gameId: string, quarterKey: DonksQuarterKey): boolean {
  const m = gameId.match(/^game_(\d{4})_(\d{2})_(\d{2})_/)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  if (year !== quarterKey.year) return false
  const qMonths: Record<DonksQuarter, [number, number]> = {
    Q1: [1, 3], Q2: [4, 6], Q3: [7, 9], Q4: [10, 12],
  }
  const [startM, endM] = qMonths[quarterKey.quarter]
  return month >= startM && month <= endM
}

/**
 * Compute the expected playoff game slots from the quarter's schedule.
 * Uses the cup config to determine which cups play on which days,
 * then finds the last occurrence of each game day within the quarter.
 */
function computeExpectedPlayoffSlots(
  quarterKey: DonksQuarterKey
): Array<{ gameId: string; gameDate: Date; cupSlug: DonksCupSlug }> {
  const { end } = getQuarterDateRange(quarterKey)

  const holdemCups = DONKS_CUPS.filter((c) => c.gameType === 'holdem')
  const dayGroups = new Map<string, DonksCupSlug[]>()
  for (const cup of holdemCups) {
    if (!dayGroups.has(cup.day)) dayGroups.set(cup.day, [])
    dayGroups.get(cup.day)!.push(cup.slug)
  }

  const slots: Array<{ gameId: string; gameDate: Date; cupSlug: DonksCupSlug }> = []

  for (const [dayName, cupSlugs] of dayGroups) {
    const dayNum = DAY_NAME_TO_NUM[dayName]
    if (dayNum === undefined) continue

    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    while (d.getDay() !== dayNum) d.setDate(d.getDate() - 1)

    for (const cupSlug of cupSlugs) {
      slots.push({
        gameId: formatGameId(d, cupSlug),
        gameDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0),
        cupSlug,
      })
    }
  }

  slots.sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())
  return slots
}

/**
 * Identify the playoff games for a quarter using schedule-based logic.
 * Computes expected playoff dates from the quarter end, then matches
 * against actual game data. Missing games become synthetic "upcoming" entries.
 */
export function identifyPlayoffGames(
  games: DonksGame[],
  _config: DonksPlayoffConfig,
  quarterKey: DonksQuarterKey
): DonksGame[] {
  const expectedSlots = computeExpectedPlayoffSlots(quarterKey)
  const gamesById = new Map(games.map((g) => [g.gameId, g]))

  return expectedSlots.map((slot) => {
    const existing = gamesById.get(slot.gameId)
    if (existing) return existing
    return {
      gameId: slot.gameId,
      gameDate: slot.gameDate,
      cupSlug: slot.cupSlug,
      tournamentId: 0,
      totalPlayers: 0,
      lockedBy: '',
      lockedAt: new Date(0),
    }
  })
}

/**
 * Find the last Hold'em game before the playoff window (the qualification cutoff).
 * Filters to games within the quarter and excludes playoff games.
 */
export function identifyCutoffGame(
  allHoldemGames: DonksGame[],
  playoffGames: DonksGame[],
  quarterKey: DonksQuarterKey
): DonksGame | null {
  const playoffIds = new Set(playoffGames.map((g) => g.gameId))
  const regularGames = allHoldemGames
    .filter((g) => !playoffIds.has(g.gameId) && isGameIdInQuarter(g.gameId, quarterKey))
    .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())

  return regularGames.length > 0 ? regularGames[regularGames.length - 1]! : null
}

// ─── Qualification Snapshot ───────────────────────────────────────────────────

interface CupLeaderboardEntry {
  username: string
  totalPoints: number
  gamesPlayed: number
  rank: number
}

/**
 * Build a simple leaderboard for a single cup from filtered results.
 * Uses best-9 scoring (same as regular season).
 */
function buildCupLeaderboard(results: DonksPlayerResult[]): CupLeaderboardEntry[] {
  const playerScores = new Map<string, number[]>()

  for (const r of results) {
    if (!playerScores.has(r.username)) {
      playerScores.set(r.username, [])
    }
    playerScores.get(r.username)!.push(r.pointsEarned)
  }

  const entries: Array<{ username: string; totalPoints: number; gamesPlayed: number }> = []
  for (const [username, scores] of playerScores.entries()) {
    entries.push({
      username,
      totalPoints: calculateTopN(scores, TOP_N_SCORES),
      gamesPlayed: scores.length,
    })
  }

  entries.sort((a, b) => b.totalPoints - a.totalPoints || a.gamesPlayed - b.gamesPlayed)

  return entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }))
}

/**
 * Compute the playoff qualifier list and cross-qualification map.
 *
 * Algorithm:
 * 1. Filter results up to the cutoff game date
 * 2. Build leaderboards for each Hold'em cup
 * 3. Extract top-N per cup, de-duplicating across cups (first-cup-wins)
 * 4. Add Omaha wild cards from non-qualified Omaha top players
 */
export function computePlayoffQualifiers(
  playerResults: DonksPlayerResult[],
  _cutoffGame: DonksGame | null,
  config: DonksPlayoffConfig,
  quarterKey: DonksQuarterKey,
  playoffGameIds: Set<string>
): {
  qualifiers: DonksPlayoffQualifier[]
  crossQualification: Map<string, DonksCupSlug[]>
} {
  const quarterResults = playerResults.filter((r) => isGameIdInQuarter(r.gameId, quarterKey))

  // Hold'em qualification: all quarter Hold'em results EXCEPT playoff games
  const cupLeaderboards = new Map<DonksCupSlug, CupLeaderboardEntry[]>()
  for (const cupSlug of HOLDEM_CUP_ORDER) {
    const cupResults = quarterResults.filter((r) => r.cupSlug === cupSlug && !playoffGameIds.has(r.gameId))
    cupLeaderboards.set(cupSlug, buildCupLeaderboard(cupResults))
  }

  // Track which cups each player is top-N in (before de-dup)
  const crossQualification = new Map<string, DonksCupSlug[]>()
  for (const [cupSlug, lb] of cupLeaderboards.entries()) {
    const topN = lb.slice(0, config.qualifiersPerCup)
    for (const entry of topN) {
      if (!crossQualification.has(entry.username)) {
        crossQualification.set(entry.username, [])
      }
      crossQualification.get(entry.username)!.push(cupSlug)
    }
  }

  // De-duplicate: process cups in order, first appearance wins
  const qualifiedUsernames = new Set<string>()
  const qualifiers: DonksPlayoffQualifier[] = []

  for (const cupSlug of HOLDEM_CUP_ORDER) {
    const lb = cupLeaderboards.get(cupSlug)!
    const topN = lb.slice(0, config.qualifiersPerCup)
    for (const entry of topN) {
      if (!qualifiedUsernames.has(entry.username)) {
        qualifiedUsernames.add(entry.username)
        qualifiers.push({
          username: entry.username,
          qualifiedVia: cupSlug,
          qualifyingRank: entry.rank,
          qualifyingPoints: entry.totalPoints,
        })
      }
    }
  }

  // Omaha wild cards: ALL quarter Omaha results (playoffs are Hold'em-only)
  const omahaResults = quarterResults.filter((r) => OMAHA_CUP_SLUGS.has(r.cupSlug))
  const omahaLb = buildCupLeaderboard(omahaResults)
  let wildcardCount = 0

  for (const entry of omahaLb) {
    if (wildcardCount >= config.omahaWildCards) break
    if (qualifiedUsernames.has(entry.username)) continue
    qualifiedUsernames.add(entry.username)
    qualifiers.push({
      username: entry.username,
      qualifiedVia: 'omaha_wildcard',
      qualifyingRank: entry.rank,
      qualifyingPoints: entry.totalPoints,
    })
    wildcardCount++
  }

  // Attach allCupRanks to each qualifier
  for (const q of qualifiers) {
    const ranks: Partial<Record<DonksCupSlug, number>> = {}
    for (const [cupSlug, lb] of cupLeaderboards.entries()) {
      const entry = lb.find((e) => e.username === q.username)
      if (entry && entry.rank <= config.qualifiersPerCup) {
        ranks[cupSlug] = entry.rank
      }
    }
    q.allCupRanks = ranks
  }

  return { qualifiers, crossQualification }
}

// ─── Playoff Leaderboard ──────────────────────────────────────────────────────

/**
 * Compute the playoff leaderboard from qualifier results in playoff games.
 * Uses best-2 scoring. Unranked players (0 games) go to the bottom.
 */
export function computePlayoffLeaderboard(
  playerResults: DonksPlayerResult[],
  qualifiers: DonksPlayoffQualifier[],
  playoffGames: DonksGame[],
  config: DonksPlayoffConfig
): DonksPlayoffLeaderboardEntry[] {
  const qualifierSet = new Set(qualifiers.map((q) => q.username))
  const playoffGameIds = new Set(playoffGames.map((g) => g.gameId))

  // Collect each qualifier's scores in playoff games
  const playoffResults = playerResults.filter(
    (r) => playoffGameIds.has(r.gameId) && qualifierSet.has(r.username)
  )

  const scoresByPlayer = new Map<string, Record<string, number>>()
  for (const r of playoffResults) {
    if (!scoresByPlayer.has(r.username)) {
      scoresByPlayer.set(r.username, {})
    }
    scoresByPlayer.get(r.username)![r.gameId] = r.pointsEarned
  }

  // Build entries for all qualifiers
  const ranked: DonksPlayoffLeaderboardEntry[] = []
  const unranked: DonksPlayoffLeaderboardEntry[] = []

  for (const q of qualifiers) {
    const gameScores = scoresByPlayer.get(q.username) ?? {}
    const scores = Object.values(gameScores)
    const gamesPlayed = scores.length

    const entry: DonksPlayoffLeaderboardEntry = {
      rank: 0,
      username: q.username,
      totalPoints: calculateTopN(scores, config.topNScores),
      gamesPlayed,
      gameScores,
    }

    if (gamesPlayed > 0) {
      ranked.push(entry)
    } else {
      unranked.push(entry)
    }
  }

  // Sort ranked: by totalPoints desc, tiebreak by highest single score, then fewer games
  ranked.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    const aMax = Math.max(...Object.values(a.gameScores))
    const bMax = Math.max(...Object.values(b.gameScores))
    if (bMax !== aMax) return bMax - aMax
    return a.gamesPlayed - b.gamesPlayed
  })

  // Assign sequential ranks to ranked players
  for (let i = 0; i < ranked.length; i++) {
    ranked[i]!.rank = i + 1
  }

  // Sort unranked alphabetically
  unranked.sort((a, b) => a.username.localeCompare(b.username))

  return [...ranked, ...unranked]
}

// ─── Phase Detection ──────────────────────────────────────────────────────────

/**
 * Determine the current playoff phase based on which games are locked.
 */
export function getPlayoffPhase(
  playoffGames: DonksGame[],
  lockedGameIds: Set<string>
): DonksPlayoffPhase {
  if (playoffGames.length === 0) return 'no_data'

  const lockedCount = playoffGames.filter((g) => lockedGameIds.has(g.gameId)).length

  if (lockedCount === 0) return 'pre_playoffs'
  if (lockedCount < playoffGames.length) return 'playoffs_active'
  return 'playoffs_complete'
}

// ─── Game Summaries ───────────────────────────────────────────────────────────

/**
 * Build summary objects for each playoff game slot.
 */
export function buildPlayoffGameSummaries(
  playoffGames: DonksGame[],
  playerResults: DonksPlayerResult[],
  qualifierUsernames: Set<string>
): DonksPlayoffGameSummary[] {
  // Index results by gameId for fast lookup
  const resultsByGame = new Map<string, DonksPlayerResult[]>()
  for (const r of playerResults) {
    if (!resultsByGame.has(r.gameId)) {
      resultsByGame.set(r.gameId, [])
    }
    resultsByGame.get(r.gameId)!.push(r)
  }

  return playoffGames.map((game) => {
    const gameResults = resultsByGame.get(game.gameId) ?? []
    const isLocked = gameResults.length > 0

    return {
      gameId: game.gameId,
      gameDate: game.gameDate,
      cupSlug: game.cupSlug,
      totalPlayers: isLocked ? game.totalPlayers : 0,
      qualifiersPlayed: isLocked
        ? gameResults.filter((r) => qualifierUsernames.has(r.username)).length
        : 0,
      isLocked,
    }
  })
}

// ─── Master Orchestrator ──────────────────────────────────────────────────────

const EMPTY_STATE: DonksPlayoffState = {
  phase: 'no_data',
  qualifiers: [],
  playoffGames: [],
  leaderboard: [],
  cutoffGameId: null,
}

/**
 * Compute the complete playoff state from raw store data.
 * This is the single entry point called by the store's computed property.
 */
export function computePlayoffState(
  playerResults: DonksPlayerResult[],
  games: DonksGame[],
  config: DonksPlayoffConfig,
  quarterKey: DonksQuarterKey
): DonksPlayoffState {
  const allHoldemGames = games
    .filter((g) => HOLDEM_CUP_SLUGS.has(g.cupSlug))
    .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())

  const playoffGames = identifyPlayoffGames(games, config, quarterKey)
  if (playoffGames.length === 0) return EMPTY_STATE

  const cutoffGame = identifyCutoffGame(allHoldemGames, playoffGames, quarterKey)

  const lockedGameIds = new Set(games.map((g) => g.gameId))
  const phase = getPlayoffPhase(playoffGames, lockedGameIds)

  const playoffGameIds = new Set(playoffGames.map((g) => g.gameId))
  const { qualifiers } = computePlayoffQualifiers(playerResults, cutoffGame, config, quarterKey, playoffGameIds)
  const qualifierUsernames = new Set(qualifiers.map((q) => q.username))

  const playoffGameSummaries = buildPlayoffGameSummaries(
    playoffGames, playerResults, qualifierUsernames
  )

  const leaderboard = computePlayoffLeaderboard(
    playerResults, qualifiers, playoffGames, config
  )

  return {
    phase,
    qualifiers,
    playoffGames: playoffGameSummaries,
    leaderboard,
    cutoffGameId: cutoffGame?.gameId ?? null,
  }
}
