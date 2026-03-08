/**
 * useTournament Composable
 * Fetch and normalize tournament data from ReplayPoker API
 * 
 * Smart polling behavior:
 * - Initial load: always fetch once
 * - Polling: only when isLive === true AND enablePolling !== false
 * - Auto-stop: when state changes from 'running' to 'finished'
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { replayApi } from '@/services/api'
import { usePolling } from './usePolling'
import type {
  ApiTournamentResponse,
  Tournament,
  TournamentPlayer,
  TournamentWinner,
  TournamentTable,
  BlindLevel,
  CurrentBlinds,
} from '@/types'

export interface UseTournamentOptions {
  pollInterval?: number
  enablePolling?: boolean
}

export interface UseTournamentReturn {
  tournament: Ref<Tournament | null>
  raw: Ref<ApiTournamentResponse | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  isPolling: Ref<boolean>
  lastUpdated: Ref<Date | null>
  isLive: ComputedRef<boolean>
  isFinished: ComputedRef<boolean>
  isPending: ComputedRef<boolean>
  startPolling: () => void
  stopPolling: () => void
  refresh: () => Promise<void>
  load: (tournamentId: number) => Promise<void>
}

function normalizeTournament(api: ApiTournamentResponse): Tournament {
  const players: TournamentPlayer[] = api.seats.map((seat, index) => ({
    id: seat.id,
    username: seat.username,
    chips: seat.chips,
    avatar: seat.avatar,
    country: seat.country,
    isEliminated: seat.chips === 0,
    position: seat.chips === 0 ? api.seats.length - index : undefined,
  }))

  const winners: TournamentWinner[] = (api.winners || []).map((winner) => ({
    username: winner.username,
    position: winner.position,
    prizes: winner.prizes,
    playerId: api.seats.find((s) => s.username === winner.username)?.id,
  }))

  const tables: TournamentTable[] = api.tables.map((table) => ({
    id: table.id,
    stackMin: table.stacks.min,
    stackMax: table.stacks.max,
    players: table.players.map((p) => ({
      id: p.id,
      username: p.username,
      chips: p.chips,
      avatar: p.avatar,
      country: p.country,
      isEliminated: false,
    })),
  }))

  const blindLevels: BlindLevel[] = api.blindLevels
    .filter((level) => level.level !== null)
    .map((level) => ({
      level: level.level!,
      smallBlind: level.small!,
      bigBlind: level.big!,
      ante: level.ante ?? 0,
      durationMinutes: level.minutes,
    }))

  let currentBlinds: CurrentBlinds | undefined
  if (api.blinds) {
    currentBlinds = {
      level: api.blinds.current.level,
      smallBlind: api.blinds.current.small,
      bigBlind: api.blinds.current.big,
      ante: api.blinds.current.ante,
      nextLevelAt: api.blinds.next?.time ? new Date(api.blinds.next.time) : undefined,
    }
  }

  const playersRemaining = players.filter((p) => !p.isEliminated).length

  return {
    id: api.id,
    name: api.name,
    state: api.state,
    url: api.url,
    startTime: new Date(api.start),
    endTime: api.end ? new Date(api.end) : undefined,
    registrationTime: new Date(api.registration),
    totalPlayers: api.playersIds.length,
    playersRemaining,
    startingChips: api.startingChips,
    buyIn: api.buyIns.chips,
    fee: api.buyIns.fee,
    prizePool: api.prizes.chips,
    tables,
    players,
    winners,
    currentBlinds,
    blindLevels,
    isFast: api.fast,
    tableSize: api.tableSeats,
    gameType: api.game.variation,
    gameLimit: api.game.limit,
  }
}

export function useTournament(
  initialTournamentId?: number,
  options: UseTournamentOptions = {}
): UseTournamentReturn {
  const { pollInterval = 30000, enablePolling = true } = options

  const tournamentId = ref<number | null>(initialTournamentId ?? null)
  const raw = ref<ApiTournamentResponse | null>(null)
  const tournament = ref<Tournament | null>(null)

  const fetchTournament = async (): Promise<ApiTournamentResponse> => {
    if (!tournamentId.value) {
      throw new Error('No tournament ID set')
    }
    return replayApi.getTournament(tournamentId.value)
  }

  const polling = usePolling(fetchTournament, {
    interval: pollInterval,
    immediate: false,
    onError: (err) => console.error('Tournament fetch error:', err),
  })

  const isLive = computed(() => tournament.value?.state === 'running')
  const isFinished = computed(() => tournament.value?.state === 'finished')
  const isPending = computed(() => tournament.value?.state === 'registering')

  async function load(id: number): Promise<void> {
    tournamentId.value = id
    polling.stop()
    await refresh()
    
    if (enablePolling && isLive.value) {
      startPollingIfLive()
    }
  }

  async function refresh(): Promise<void> {
    await polling.refresh()
    if (polling.data.value) {
      raw.value = polling.data.value
      tournament.value = normalizeTournament(polling.data.value)
    }
  }

  function startPollingIfLive(): void {
    if (!enablePolling) return
    if (!tournamentId.value) return
    if (!isLive.value) return
    if (polling.isPolling.value) return
    
    polling.start()
  }

  function startPolling(): void {
    if (!enablePolling) {
      console.warn('Polling is disabled for this tournament instance')
      return
    }
    if (tournamentId.value) {
      startPollingIfLive()
    }
  }

  function stopPolling(): void {
    polling.stop()
  }

  watch(isFinished, (finished) => {
    if (finished && polling.isPolling.value) {
      polling.stop()
    }
  })

  watch(isLive, (live) => {
    if (live && enablePolling && !polling.isPolling.value) {
      polling.start()
    }
  })

  return {
    tournament,
    raw,
    error: polling.error,
    isLoading: polling.isLoading,
    isPolling: polling.isPolling,
    lastUpdated: polling.lastUpdated,
    isLive,
    isFinished,
    isPending,
    startPolling,
    stopPolling,
    refresh,
    load,
  }
}
