/**
 * Muckers Store — Module-Level Reactive Singleton
 *
 * One instance shared across all Muckers views. Data is fetched once on entry
 * (via navigation guard), then cached for seamless navigation between pages.
 *
 * Quarter changes trigger a fresh fetch and replace the cache.
 */

import { ref, computed } from 'vue'
import type {
  MuckersGame,
  MuckersPlayerResult,
  MuckersTeamRoster,
  MuckersQuarterKey,
  MuckersTeamStanding,
  MuckersPlayerStanding,
  MuckersWeekData,
  MuckersWeekDetail,
  MuckersTeamDetail,
  MuckersPlayerWeekScore,
  MuckersTeamSlug,
} from '@/types/muckers'
import {
  getCurrentMuckersQuarter,
  getMuckersQuarterDateRange,
  getMuckersQuarterLabel,
  MUCKERS_GAME_SLOTS,
  MUCKERS_SCHEDULE,
} from '@/config/muckers'
import { getMuckersTeam, MUCKERS_TEAMS } from '@/config/teams'
import { appScriptClient } from '@/services/appscript'

// ─── Module-Level State ───────────────────────────────────────────────────────

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const loadedQuarter = ref<MuckersQuarterKey | null>(null)

const _games = ref<MuckersGame[]>([])
const _playerResults = ref<MuckersPlayerResult[]>([])
const _teams = ref<MuckersTeamRoster[]>([])
const _avatarMap = ref<Record<string, string>>({})
const _weekOffset = ref(0)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTeamName(slug: MuckersTeamSlug): string {
  return getMuckersTeam(slug)?.name ?? slug
}

/**
 * Thursday-anchored week numbering within a quarter.
 * Week 1 starts on the first Thursday on or after the quarter start date.
 */
function getWeekNumber(gameDate: Date, quarterStart: Date): number {
  const firstThursday = new Date(quarterStart)
  while (firstThursday.getDay() !== 4) {
    firstThursday.setDate(firstThursday.getDate() + 1)
  }
  const diffMs = gameDate.getTime() - firstThursday.getTime()
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
}

function getQuarterStart(): Date {
  const q = loadedQuarter.value ?? getCurrentMuckersQuarter()
  return getMuckersQuarterDateRange(q).start
}

/** Build a gameId → weekNumber lookup map (normalised so first played week = 1) */
function buildGameWeekMap(): Map<string, number> {
  const qStart = getQuarterStart()
  const map = new Map<string, number>()
  for (const g of _games.value) {
    map.set(g.gameId, getWeekNumber(g.gameDate, qStart))
  }
  const rawWeeks = [...map.values()]
  const minWeek = rawWeeks.length > 0 ? Math.min(...rawWeeks) : 1
  const offset = minWeek - 1
  _weekOffset.value = offset
  if (offset > 0) {
    for (const [id, wk] of map) {
      map.set(id, wk - offset)
    }
  }
  return map
}

/** Build a gameId → MuckersGame lookup */
function buildGameMap(): Map<string, MuckersGame> {
  const map = new Map<string, MuckersGame>()
  for (const g of _games.value) {
    map.set(g.gameId, g)
  }
  return map
}

/** Get the Thursday date for a given (normalised) week number */
function getWeekStartDate(weekNumber: number): Date {
  const actualWeek = weekNumber + _weekOffset.value
  const qStart = getQuarterStart()
  const firstThursday = new Date(qStart)
  while (firstThursday.getDay() !== 4) {
    firstThursday.setDate(firstThursday.getDate() + 1)
  }
  const d = new Date(firstThursday)
  d.setDate(d.getDate() + (actualWeek - 1) * 7)
  return d
}

// ─── Computed: Week Numbers ───────────────────────────────────────────────────

const weekNumbers = computed<number[]>(() => {
  const gameWeekMap = buildGameWeekMap()
  const weeks = new Set<number>()
  for (const wk of gameWeekMap.values()) {
    weeks.add(wk)
  }
  return [...weeks].sort((a, b) => a - b)
})

// ─── Computed: Team Standings ─────────────────────────────────────────────────

function buildTeamStandingsFromResults(
  results: MuckersPlayerResult[],
  games: MuckersGame[],
  teams: MuckersTeamRoster[],
): Omit<MuckersTeamStanding, 'rankDiff'>[] {
  const qStart = getQuarterStart()
  const gameMap = new Map<string, MuckersGame>()
  for (const g of games) gameMap.set(g.gameId, g)

  const gameWeekMap = new Map<string, number>()
  for (const g of games) {
    gameWeekMap.set(g.gameId, getWeekNumber(g.gameDate, qStart))
  }

  const uniqueSlugs = new Set<MuckersTeamSlug>()
  for (const t of teams) {
    if (t.isActive) uniqueSlugs.add(t.teamSlug)
  }
  for (const r of results) uniqueSlugs.add(r.teamSlug)

  const standings: Omit<MuckersTeamStanding, 'rankDiff'>[] = []

  for (const slug of uniqueSlugs) {
    const teamResults = results.filter((r) => r.teamSlug === slug)

    const weekMap = new Map<number, MuckersWeekData>()
    for (const r of teamResults) {
      const wk = gameWeekMap.get(r.gameId)
      if (wk === undefined) continue

      let weekData = weekMap.get(wk)
      if (!weekData) {
        weekData = {
          weekNumber: wk,
          weekStartDate: getWeekStartDate(wk),
          totalPoints: 0,
          games: [],
        }
        weekMap.set(wk, weekData)
      }

      const game = gameMap.get(r.gameId)
      weekData.games.push({
        slot: r.gameSlot,
        playerUsername: r.username,
        finishPosition: r.finishPosition,
        totalPlayers: game?.totalPlayers ?? 0,
        pointsEarned: r.pointsEarned,
      })
      weekData.totalPoints += r.pointsEarned
    }

    const weeklyScores = [...weekMap.values()].sort((a, b) => a.weekNumber - b.weekNumber)
    const totalPoints = weeklyScores.reduce((sum, w) => sum + w.totalPoints, 0)
    const weeksPlayed = weeklyScores.filter((w) => w.games.length > 0).length

    standings.push({
      teamSlug: slug,
      teamName: getTeamName(slug),
      rank: 0,
      totalPoints,
      averagePerWeek: weeksPlayed > 0 ? totalPoints / weeksPlayed : 0,
      weeksPlayed,
      weeklyScores,
    })
  }

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((s, i) => { s.rank = i + 1 })

  return standings
}

const teamStandings = computed<MuckersTeamStanding[]>(() => {
  const current = buildTeamStandingsFromResults(
    _playerResults.value,
    _games.value,
    _teams.value,
  )

  const maxWeek = weekNumbers.value.length > 0
    ? weekNumbers.value[weekNumbers.value.length - 1]!
    : 0

  const gameWeekMap = buildGameWeekMap()
  const prevResults = maxWeek > 1
    ? _playerResults.value.filter((r) => {
        const wk = gameWeekMap.get(r.gameId)
        return wk !== undefined && wk < maxWeek
      })
    : []
  const prevGames = maxWeek > 1
    ? _games.value.filter((g) => {
        const wk = gameWeekMap.get(g.gameId)
        return wk !== undefined && wk < maxWeek
      })
    : []

  const previous = maxWeek > 1
    ? buildTeamStandingsFromResults(prevResults, prevGames, _teams.value)
    : []

  const prevRankMap = new Map<MuckersTeamSlug, number>()
  for (const s of previous) prevRankMap.set(s.teamSlug, s.rank)

  return current.map((s) => {
    const prevRank = prevRankMap.get(s.teamSlug)
    let rankDiff: number | null = null
    if (prevRank !== undefined) {
      rankDiff = prevRank - s.rank
    }
    return { ...s, rankDiff }
  })
})

// ─── Computed: Player Standings ───────────────────────────────────────────────

const playerStandings = computed<MuckersPlayerStanding[]>(() => {
  const gameWeekMap = buildGameWeekMap()
  const gameMap = buildGameMap()
  const playerMap = new Map<string, {
    username: string
    teamSlug: MuckersTeamSlug
    totalPoints: number
    gamesPlayed: number
    weeklyScores: Record<number, MuckersPlayerWeekScore>
  }>()

  for (const r of _playerResults.value) {
    const wk = gameWeekMap.get(r.gameId)
    if (wk === undefined) continue
    const game = gameMap.get(r.gameId)

    let entry = playerMap.get(r.username)
    if (!entry) {
      entry = {
        username: r.username,
        teamSlug: r.teamSlug,
        totalPoints: 0,
        gamesPlayed: 0,
        weeklyScores: {},
      }
      playerMap.set(r.username, entry)
    }

    entry.totalPoints += r.pointsEarned
    entry.gamesPlayed++
    entry.weeklyScores[wk] = {
      weekNumber: wk,
      gameSlot: r.gameSlot,
      finishPosition: r.finishPosition,
      totalPlayers: game?.totalPlayers ?? 0,
      pointsEarned: r.pointsEarned,
    }
  }

  const standings: MuckersPlayerStanding[] = [...playerMap.values()].map((p) => ({
    username: p.username,
    teamSlug: p.teamSlug,
    teamName: getTeamName(p.teamSlug),
    rank: 0,
    totalPoints: p.totalPoints,
    gamesPlayed: p.gamesPlayed,
    averagePerGame: p.gamesPlayed > 0 ? p.totalPoints / p.gamesPlayed : 0,
    weeklyScores: p.weeklyScores,
  }))

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((s, i) => { s.rank = i + 1 })

  return standings
})

// ─── Query: Week Detail ───────────────────────────────────────────────────────

function getWeekDetail(weekNum: number): MuckersWeekDetail | null {
  const gameWeekMap = buildGameWeekMap()

  const weekResults = _playerResults.value.filter((r) => gameWeekMap.get(r.gameId) === weekNum)
  if (weekResults.length === 0) return null

  const tables: MuckersWeekDetail['tables'] = MUCKERS_GAME_SLOTS.map((slot) => {
    const slotResults = weekResults
      .filter((r) => r.gameSlot === slot)
      .sort((a, b) => a.finishPosition - b.finishPosition)

    return {
      slot,
      results: slotResults.map((r) => ({
        username: r.username,
        teamSlug: r.teamSlug,
        teamName: getTeamName(r.teamSlug),
        finishPosition: r.finishPosition,
        pointsEarned: r.pointsEarned,
      })),
    }
  })

  const teamTotals = new Map<MuckersTeamSlug, number>()
  for (const r of weekResults) {
    teamTotals.set(r.teamSlug, (teamTotals.get(r.teamSlug) ?? 0) + r.pointsEarned)
  }

  const weeklyTeamTally = [...teamTotals.entries()]
    .map(([slug, pts]) => ({
      teamSlug: slug,
      teamName: getTeamName(slug),
      weekPoints: pts,
      rank: 0,
    }))
    .sort((a, b) => b.weekPoints - a.weekPoints)
  weeklyTeamTally.forEach((t, i) => { t.rank = i + 1 })

  const best = weeklyTeamTally[0]!
  const bestTeam = { teamSlug: best.teamSlug, teamName: best.teamName, weekPoints: best.weekPoints }

  const snapshotResults = _playerResults.value.filter((r) => {
    const wk = gameWeekMap.get(r.gameId)
    return wk !== undefined && wk <= weekNum
  })
  const snapshotGames = _games.value.filter((g) => {
    const wk = gameWeekMap.get(g.gameId)
    return wk !== undefined && wk <= weekNum
  })
  const snapshot = buildTeamStandingsFromResults(snapshotGames.length ? snapshotResults : [], snapshotGames, _teams.value)
  const leaderboardSnapshot: MuckersTeamStanding[] = snapshot.map((s) => ({ ...s, rankDiff: null }))

  return {
    weekNumber: weekNum,
    weekStartDate: getWeekStartDate(weekNum),
    tables,
    weeklyTeamTally,
    bestTeam,
    leaderboardSnapshot,
  }
}

// ─── Query: Team Detail ───────────────────────────────────────────────────────

function getTeamDetail(teamSlug: MuckersTeamSlug): MuckersTeamDetail | null {
  const roster = _teams.value.filter((t) => t.teamSlug === teamSlug)
  if (roster.length === 0) return null

  const teamResults = _playerResults.value.filter((r) => r.teamSlug === teamSlug)

  const memberMap = new Map<string, { totalPoints: number; gamesPlayed: number }>()
  for (const m of roster) {
    memberMap.set(m.username, { totalPoints: 0, gamesPlayed: 0 })
  }
  for (const r of teamResults) {
    let entry = memberMap.get(r.username)
    if (!entry) {
      entry = { totalPoints: 0, gamesPlayed: 0 }
      memberMap.set(r.username, entry)
    }
    entry.totalPoints += r.pointsEarned
    entry.gamesPlayed++
  }

  const members = [...memberMap.entries()]
    .map(([username, stats]) => ({
      username,
      totalPoints: stats.totalPoints,
      gamesPlayed: stats.gamesPlayed,
      averagePerGame: stats.gamesPlayed > 0 ? stats.totalPoints / stats.gamesPlayed : 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  const captain = roster.find((t) => t.isCaptain)?.username ?? null
  const quarterlyTotal = teamResults.reduce((sum, r) => sum + r.pointsEarned, 0)

  return {
    teamSlug,
    teamName: getTeamName(teamSlug),
    captain,
    members,
    quarterlyTotal,
    memberCount: roster.length,
  }
}

// ─── Query: Avatar ────────────────────────────────────────────────────────────

function getAvatar(username: string): string {
  return _avatarMap.value[username] ?? ''
}

/** Member count for a team from roster */
function getTeamMemberCount(teamSlug: MuckersTeamSlug): number {
  return _teams.value.filter((t) => t.teamSlug === teamSlug && t.isActive).length
}

// ─── Derived ──────────────────────────────────────────────────────────────────

const loadedQuarterLabel = computed(() => {
  return loadedQuarter.value ? getMuckersQuarterLabel(loadedQuarter.value) : ''
})

// ─── Actions ──────────────────────────────────────────────────────────────────

function populateStore(data: import('@/types/muckers').MuckersStoreData) {
  _games.value = data.games
  _playerResults.value = data.playerResults
  _teams.value = data.teams
  _avatarMap.value = data.avatarMap
}

async function loadQuarter(key: MuckersQuarterKey): Promise<void> {
  const loaded = loadedQuarter.value
  if (loaded && loaded.quarter === key.quarter && loaded.year === key.year) {
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    const data = await appScriptClient.getMuckersData(key.quarter, key.year)
    populateStore(data)
    loadedQuarter.value = key
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err)
    console.error('[useMuckersStore] Failed to load quarter data:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

async function forceRefresh(): Promise<void> {
  const current = loadedQuarter.value ?? getCurrentMuckersQuarter()
  loadedQuarter.value = null
  await loadQuarter(current)
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function useMuckersStore() {
  return {
    // State
    isLoading,
    loadError,
    loadedQuarter,
    loadedQuarterLabel,

    // Raw data
    games: _games,
    playerResults: _playerResults,
    teams: _teams,
    avatarMap: _avatarMap,

    // Computed leaderboards
    teamStandings,
    playerStandings,
    weekNumbers,

    // Config pass-through
    allTeams: MUCKERS_TEAMS,
    schedule: MUCKERS_SCHEDULE,

    // Actions
    loadQuarter,
    forceRefresh,

    // Queries
    getWeekDetail,
    getWeekStartDate,
    getTeamDetail,
    getAvatar,
    getTeamMemberCount,
  }
}
