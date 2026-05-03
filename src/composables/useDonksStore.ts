/**
 * Donks Store — Module-Level Reactive Singleton
 *
 * One instance shared across all Donks views. Data is fetched once on entry
 * (via navigation guard), then cached for seamless navigation between Level A/B/C.
 *
 * Quarter changes trigger a fresh fetch and replace the cache.
 */

import { ref, computed } from 'vue'
import type {
  DonksPlayerResult,
  DonksGame,
  DonksStoreData,
  DonksLeaderboardEntry,
  DonksGameHistory,
  DonksQuarterKey,
  DonksCupSlug,
  DonksCompositeSlug,
} from '@/types/donks'
import { DONKS_CUPS, DONKS_MEDALS, TOP_N_SCORES, getCurrentDonksQuarter, quarterLabel } from '@/config/donks'
import { calculateTopN, getCountedGameIds } from '@/services/scoring/strategies/donks'
import { appScriptClient } from '@/services/appscript'

// ─── Module-Level State ───────────────────────────────────────────────────────
// These refs live outside the function, making them a true singleton shared
// across all component instances / route navigations.

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const loadedQuarter = ref<DonksQuarterKey | null>(null)

const _playerResults = ref<DonksPlayerResult[]>([])
const _avatarMap = ref<Record<string, string>>({})
const _recentTournaments = ref<DonksStoreData['recentTournaments']>({})

// ─── Derived: Games List ──────────────────────────────────────────────────────

const games = computed<DonksGame[]>(() => {
  const seen = new Set<string>()
  const result: DonksGame[] = []
  for (const r of _playerResults.value) {
    if (!seen.has(r.gameId)) {
      seen.add(r.gameId)
      result.push({
        gameId: r.gameId,
        gameDate: r.gameDate,
        cupSlug: r.cupSlug,
        tournamentId: r.tournamentId,
        totalPlayers: r.totalPlayers,
        lockedBy: r.lockedBy,
        lockedAt: r.lockedAt,
      })
    }
  }
  return result.sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())
})

// ─── Core Leaderboard Computation ────────────────────────────────────────────

/**
 * Build a leaderboard from a filtered set of player results.
 * Applies the Top-N rule per player.
 */
function buildLeaderboard(
  results: DonksPlayerResult[],
  previousRanks?: Record<string, number>
): DonksLeaderboardEntry[] {
  // Group scores by username
  const playerScores = new Map<string, Array<{ gameId: string; points: number; gameDate: Date }>>()

  for (const r of results) {
    if (!playerScores.has(r.username)) {
      playerScores.set(r.username, [])
    }
    playerScores.get(r.username)!.push({
      gameId: r.gameId,
      points: r.pointsEarned,
      gameDate: r.gameDate,
    })
  }

  // Compute top-N total per player
  const entries: Array<{ username: string; totalPoints: number; gamesPlayed: number }> = []
  for (const [username, scores] of playerScores.entries()) {
    entries.push({
      username,
      totalPoints: calculateTopN(scores.map((s) => s.points), TOP_N_SCORES),
      gamesPlayed: scores.length,
    })
  }

  // Sort descending by total points, then by games played (fewer = better tiebreak)
  entries.sort((a, b) => b.totalPoints - a.totalPoints || a.gamesPlayed - b.gamesPlayed)

  return entries.map((e, i) => {
    const currentRank = i + 1
    let diff: number | null = null
    if (previousRanks) {
      const prev = previousRanks[e.username]
      diff = prev !== undefined ? prev - currentRank : null
    }
    return {
      rank: currentRank,
      username: e.username,
      totalPoints: e.totalPoints,
      gamesPlayed: e.gamesPlayed,
      diff,
    }
  })
}

/**
 * Computes the leaderboard excluding the last game of a given cup.
 * Used for diff calculation.
 */
function buildPreviousLeaderboard(
  results: DonksPlayerResult[],
  lastGameId: string
): Record<string, number> {
  const withoutLast = results.filter((r) => r.gameId !== lastGameId)
  const entries = buildLeaderboard(withoutLast)
  const rankMap: Record<string, number> = {}
  for (const e of entries) {
    rankMap[e.username] = e.rank
  }
  return rankMap
}

/** Find the most recent game ID for a set of results */
function findLastGameId(results: DonksPlayerResult[]): string | null {
  if (results.length === 0) return null
  const sorted = [...results].sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime())
  return sorted[0]!.gameId
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the leaderboard for a specific cup.
 */
function getCupLeaderboard(cupSlug: DonksCupSlug): DonksLeaderboardEntry[] {
  const cupResults = _playerResults.value.filter((r) => r.cupSlug === cupSlug)
  const lastGameId = findLastGameId(cupResults)
  const previousRanks = lastGameId ? buildPreviousLeaderboard(cupResults, lastGameId) : undefined
  return buildLeaderboard(cupResults, previousRanks)
}

/**
 * Get the composite Hold'em leaderboard (chuckcox Medal).
 * Takes each player's best 9 scores across all 4 Hold'em cups.
 */
function getHoldemComposite(): DonksLeaderboardEntry[] {
  const medal = DONKS_MEDALS.find((m) => m.gameType === 'holdem')!
  const holdemCups = new Set<DonksCupSlug>(medal.cupSlugs)
  const holdemResults = _playerResults.value.filter((r) => holdemCups.has(r.cupSlug))
  const lastGameId = findLastGameId(holdemResults)
  const previousRanks = lastGameId ? buildPreviousLeaderboard(holdemResults, lastGameId) : undefined
  return buildLeaderboard(holdemResults, previousRanks)
}

/**
 * Get the composite Omaha leaderboard (Badonks Omaha Medal).
 * Takes each player's best 9 scores across both Omaha cups.
 */
function getOmahaComposite(): DonksLeaderboardEntry[] {
  const medal = DONKS_MEDALS.find((m) => m.gameType === 'omaha')!
  const omahaCups = new Set<DonksCupSlug>(medal.cupSlugs)
  const omahaResults = _playerResults.value.filter((r) => omahaCups.has(r.cupSlug))
  const lastGameId = findLastGameId(omahaResults)
  const previousRanks = lastGameId ? buildPreviousLeaderboard(omahaResults, lastGameId) : undefined
  return buildLeaderboard(omahaResults, previousRanks)
}

/**
 * Get the composite leaderboard by medal slug.
 */
function getCompositeLeaderboard(medalSlug: DonksCompositeSlug): DonksLeaderboardEntry[] {
  if (medalSlug === 'chuckcox') return getHoldemComposite()
  if (medalSlug === 'omaha') return getOmahaComposite()
  return []
}

/**
 * Get a player's game-by-game history, optionally filtered by cup.
 * Marks which scores are counted in the player's best-9.
 */
function getPlayerHistory(username: string, cupSlug?: DonksCupSlug): DonksGameHistory[] {
  const results = _playerResults.value.filter(
    (r) => r.username === username && (!cupSlug || r.cupSlug === cupSlug)
  )

  // Determine which games count in best-9 (within the relevant scope)
  const scopedResults = cupSlug
    ? _playerResults.value.filter((r) => r.username === username && r.cupSlug === cupSlug)
    : _playerResults.value.filter((r) => r.username === username)

  const countedIds = getCountedGameIds(
    scopedResults.map((r) => ({ gameId: r.gameId, points: r.pointsEarned })),
    TOP_N_SCORES
  )

  return results
    .map((r) => ({
      gameId: r.gameId,
      gameDate: r.gameDate,
      cupSlug: r.cupSlug,
      tournamentId: r.tournamentId,
      finishPosition: r.finishPosition,
      totalPlayers: r.totalPlayers,
      pointsEarned: r.pointsEarned,
      countedInBest9: countedIds.has(r.gameId),
    }))
    .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime())
}

/**
 * Get all locked games for a specific cup, sorted by date descending (most recent first).
 */
function getGamesForCup(cupSlug: DonksCupSlug): DonksGame[] {
  return games.value
    .filter((g) => g.cupSlug === cupSlug)
    .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime())
}

/**
 * Get the results for a specific locked game from cached data.
 */
function getGameResults(gameId: string): DonksPlayerResult[] {
  return _playerResults.value
    .filter((r) => r.gameId === gameId)
    .sort((a, b) => a.finishPosition - b.finishPosition)
}

/**
 * Get avatar URL for a username.
 * Falls back to the Replay default avatar if not in the map.
 */
function getAvatar(username: string): string {
  return _avatarMap.value[username] ?? `https://www.replaypoker.com/assets/images/avatar-placeholder.svg`
}

/**
 * Calculate the rank change (diff) for a player in a given leaderboard.
 * Returns null if the player is new (not in previous leaderboard).
 */
function getDiff(
  leaderboardType: DonksCupSlug | 'holdem' | 'omaha',
  username: string
): number | null {
  let results: DonksPlayerResult[]
  if (leaderboardType === 'holdem') {
    const cup = new Set<DonksCupSlug>(DONKS_MEDALS.find((m) => m.gameType === 'holdem')!.cupSlugs)
    results = _playerResults.value.filter((r) => cup.has(r.cupSlug))
  } else if (leaderboardType === 'omaha') {
    const cup = new Set<DonksCupSlug>(DONKS_MEDALS.find((m) => m.gameType === 'omaha')!.cupSlugs)
    results = _playerResults.value.filter((r) => cup.has(r.cupSlug))
  } else {
    results = _playerResults.value.filter((r) => r.cupSlug === leaderboardType)
  }

  const lastGameId = findLastGameId(results)
  if (!lastGameId) return null

  const previousRanks = buildPreviousLeaderboard(results, lastGameId)
  const currentEntries = buildLeaderboard(results)
  const currentEntry = currentEntries.find((e) => e.username === username)
  if (!currentEntry) return null

  const prevRank = previousRanks[username]
  return prevRank !== undefined ? prevRank - currentEntry.rank : null
}

// ─── Data Loading ─────────────────────────────────────────────────────────────

function populateStore(data: DonksStoreData): void {
  _playerResults.value = data.playerResults
  _avatarMap.value = data.avatarMap
  _recentTournaments.value = data.recentTournaments
}

/**
 * Load data for a specific quarter from AppScript.
 * No-ops if the requested quarter is already loaded.
 */
async function loadQuarter(key: DonksQuarterKey): Promise<void> {
  const loaded = loadedQuarter.value
  if (
    loaded &&
    loaded.quarter === key.quarter &&
    loaded.year === key.year
  ) {
    return // already cached
  }

  isLoading.value = true
  loadError.value = null

  try {
    const data = await appScriptClient.getDonksData(key.quarter, key.year)
    populateStore(data)
    loadedQuarter.value = key
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    console.error('[useDonksStore] Failed to load quarter data:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

/** Load data for the current quarter */
async function loadCurrentQuarter(): Promise<void> {
  return loadQuarter(getCurrentDonksQuarter())
}

/** Force reload — ignores cache */
async function forceRefresh(key?: DonksQuarterKey): Promise<void> {
  loadedQuarter.value = null
  return loadQuarter(key ?? getCurrentDonksQuarter())
}

// ─── Computed display helpers ─────────────────────────────────────────────────

const loadedQuarterLabel = computed(() =>
  loadedQuarter.value ? quarterLabel(loadedQuarter.value) : null
)

const allUsernames = computed(() => {
  const set = new Set<string>(_playerResults.value.map((r) => r.username))
  return [...set].sort()
})

/**
 * Build a leaderboard from an arbitrary pre-filtered set of results.
 * Useful for views that apply their own cutoff filtering before scoring.
 */
function buildLeaderboardFromResults(results: DonksPlayerResult[]): DonksLeaderboardEntry[] {
  return buildLeaderboard(results)
}

/**
 * Build a leaderboard at a specific cutoff date with correct diff values.
 * Diff = rank change compared to the leaderboard at the previous game date.
 */
function buildLeaderboardAtCutoff(
  allResults: DonksPlayerResult[],
  cutoffDate: Date,
  allGamesForScope: DonksGame[]
): DonksLeaderboardEntry[] {
  const filtered = allResults.filter((r) => r.gameDate <= cutoffDate)
  const gamesUpToCutoff = allGamesForScope
    .filter((g) => g.gameDate <= cutoffDate)
    .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())

  if (gamesUpToCutoff.length < 2) return buildLeaderboard(filtered)

  const prevGame = gamesUpToCutoff[gamesUpToCutoff.length - 2]!
  const prevResults = allResults.filter((r) => r.gameDate <= prevGame.gameDate)
  const prevEntries = buildLeaderboard(prevResults)
  const previousRanks: Record<string, number> = {}
  for (const e of prevEntries) previousRanks[e.username] = e.rank

  return buildLeaderboard(filtered, previousRanks)
}

// ─── Cup/Medal info pass-throughs ─────────────────────────────────────────────

const cups = DONKS_CUPS
const medals = DONKS_MEDALS

// ─── Export (composable interface) ───────────────────────────────────────────

export function useDonksStore() {
  return {
    // State
    isLoading,
    loadError,
    loadedQuarter,
    loadedQuarterLabel,

    // Raw data
    games,
    playerResults: _playerResults,
    avatarMap: _avatarMap,
    recentTournaments: _recentTournaments,

    // Config
    cups,
    medals,
    allUsernames,

    // Actions
    loadQuarter,
    loadCurrentQuarter,
    forceRefresh,

    // Queries
    getCupLeaderboard,
    getHoldemComposite,
    getOmahaComposite,
    getCompositeLeaderboard,
    getPlayerHistory,
    getAvatar,
    getDiff,
    getGamesForCup,
    getGameResults,
    buildLeaderboardFromResults,
    buildLeaderboardAtCutoff,
  }
}
