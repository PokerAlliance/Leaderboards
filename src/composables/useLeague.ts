/**
 * useLeague Composable
 * Fetch and manage league data from ReplayPoker API
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { replayApi } from '@/services/api'
import { getLeagueConfig } from '@/config/leagues'
import type { LeagueSlug, ApiLeagueResponse, ApiLeagueTournament } from '@/types'

export interface LeagueInfo {
  id: number
  name: string
  description: string
  url: string
  membersCount: number
}

export interface ParsedTournament {
  id: number
  name: string
  state: 'announced' | 'registering' | 'running' | 'finished'
  url: string
  startTime: Date
  registrationTime: Date
  prizePool: number
  buyIn: number
  fee: number
  registeredPlayers: number
  tableSeats: number
  gameType: string
  gameLimit: string
  isFast: boolean
}

export interface UseLeagueReturn {
  leagueInfo: Ref<LeagueInfo | null>
  tournaments: Ref<ParsedTournament[]>
  upcomingGames: ComputedRef<ParsedTournament[]>
  liveGame: ComputedRef<ParsedTournament | null>
  recentGames: ComputedRef<ParsedTournament[]>
  mostRecentFinished: ComputedRef<ParsedTournament | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  load: () => Promise<void>
  refresh: () => Promise<void>
}

function parseTournament(api: ApiLeagueTournament): ParsedTournament {
  return {
    id: api.id,
    name: api.name,
    state: api.state,
    url: api.url,
    startTime: new Date(api.start),
    registrationTime: new Date(api.registration),
    prizePool: api.prizes.chips,
    buyIn: api.buyIns.chips,
    fee: api.buyIns.fee,
    registeredPlayers: api.playersIds.length,
    tableSeats: api.tableSeats,
    gameType: api.game.variation,
    gameLimit: api.game.limit,
    isFast: api.fast,
  }
}

function parseLeagueInfo(api: ApiLeagueResponse): LeagueInfo {
  return {
    id: api.league.id,
    name: api.league.name,
    description: api.league.description,
    url: api.league.url,
    membersCount: api.league.membersCount,
  }
}

export function useLeague(leagueSlug: LeagueSlug): UseLeagueReturn {
  const config = getLeagueConfig(leagueSlug)
  const leagueId = config.replayLeagueId

  const leagueInfo = ref<LeagueInfo | null>(null)
  const tournaments = ref<ParsedTournament[]>([])
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  const upcomingGames = computed(() => {
    return tournaments.value
      .filter((t) => t.state === 'announced' || t.state === 'registering')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  })

  const liveGame = computed(() => {
    return tournaments.value.find((t) => t.state === 'running') ?? null
  })

  const recentGames = computed(() => {
    return tournaments.value
      .filter((t) => t.state === 'finished')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  })

  const mostRecentFinished = computed(() => {
    return recentGames.value[0] ?? null
  })

  async function load(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const response = await replayApi.getLeague(leagueId)
      leagueInfo.value = parseLeagueInfo(response)
      tournaments.value = response.league.tournaments.map(parseTournament)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load league data')
      console.error('Failed to load league:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function refresh(): Promise<void> {
    await load()
  }

  return {
    leagueInfo,
    tournaments,
    upcomingGames,
    liveGame,
    recentGames,
    mostRecentFinished,
    error,
    isLoading,
    load,
    refresh,
  }
}
