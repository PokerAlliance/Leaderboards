/**
 * useQuickLock Composable
 * Provides quick lock functionality for saving game results directly from scoreboards
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { format } from 'date-fns'
import { useAuth } from './useAuth'
import { useGameHistory } from './useGameHistory'
import { sheetsClient } from '@/services/sheets'
import { getScoringStrategy } from '@/services/scoring'
import type {
  LeagueSlug,
  Tournament,
  TeamGameScore,
  PlayerGameResult,
  GameSavePayload,
  TeamScorePayload,
  PlayerResultPayload,
  SaveGameResponse,
} from '@/types'

export interface UseQuickLockReturn {
  canLock: ComputedRef<boolean>
  isGameSaved: (tournamentId: number) => boolean
  lockGame: (
    tournament: Tournament,
    teamScores: TeamGameScore[],
    playerResults: PlayerGameResult[]
  ) => Promise<SaveGameResponse>
  loadHistory: () => Promise<void>
  isLocking: Ref<boolean>
  savedTournamentIds: ComputedRef<number[]>
}

export function useQuickLock(leagueSlug: LeagueSlug): UseQuickLockReturn {
  const { isLoggedIn, canManageLeague, getAdminKey } = useAuth()
  const gameHistory = useGameHistory(leagueSlug)

  const isLocking = ref(false)

  const canLock = computed(() => isLoggedIn.value && canManageLeague(leagueSlug))

  const savedTournamentIds = computed(() =>
    gameHistory.games.value.map((g) => g.tournament_id)
  )

  function isGameSaved(tournamentId: number): boolean {
    return savedTournamentIds.value.includes(tournamentId)
  }

  function buildGamePayload(
    tournament: Tournament,
    teamScores: TeamGameScore[],
    playerResults: PlayerGameResult[]
  ): GameSavePayload {
    const gameDate = new Date(tournament.startTime)
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const
    const dayIndex = gameDate.getDay()
    const gameDay = dayNames[dayIndex] ?? 'monday'

    const strategy = getScoringStrategy(leagueSlug)

    const sortedTeams = [...teamScores].sort((a, b) => b.totalPoints - a.totalPoints)
    const rankedTeams: TeamScorePayload[] = sortedTeams.map((score, index) => {
      let rank = index + 1
      let monthPoints = strategy.calculateMonthPoints(rank, sortedTeams.length)

      if (index > 0) {
        const prev = sortedTeams[index - 1]
        if (prev && score.totalPoints === prev.totalPoints) {
          const prevPayload = rankedTeams[index - 1]
          if (prevPayload) {
            rank = prevPayload.rank
            monthPoints = prevPayload.monthPoints
          }
        }
      }

      return {
        teamSlug: score.teamSlug,
        teamName: score.teamName,
        totalPoints: score.totalPoints,
        rank,
        monthPoints,
        penalty: 0,
      }
    })

    const playerResultsPayload: PlayerResultPayload[] = playerResults.map((result) => ({
      playerId: result.playerId,
      username: result.username,
      teamSlugAtGame: result.teamSlug,
      finishPosition: result.finishPosition,
      pointsEarned: result.pointsEarned,
    }))

    return {
      gameId: format(gameDate, 'yyyy_MM_dd'),
      tournamentId: tournament.id,
      gameDate: format(gameDate, 'yyyy-MM-dd'),
      gameDay,
      totalPlayers: tournament.totalPlayers,
      teamScores: rankedTeams,
      playerResults: playerResultsPayload,
    }
  }

  async function lockGame(
    tournament: Tournament,
    teamScores: TeamGameScore[],
    playerResults: PlayerGameResult[]
  ): Promise<SaveGameResponse> {
    const adminKey = getAdminKey()
    if (!adminKey) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!canLock.value) {
      return { success: false, error: 'Not authorized to lock games for this league' }
    }

    if (tournament.state !== 'finished') {
      return { success: false, error: 'Game must be finished before locking' }
    }

    if (isGameSaved(tournament.id)) {
      return { success: false, error: 'Game is already saved' }
    }

    isLocking.value = true

    try {
      const payload = buildGamePayload(tournament, teamScores, playerResults)
      const result = await sheetsClient.saveGameResults(leagueSlug, payload, adminKey)

      if (result.success) {
        await gameHistory.load()
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save game',
      }
    } finally {
      isLocking.value = false
    }
  }

  return {
    canLock,
    isGameSaved,
    lockGame,
    loadHistory: gameHistory.load,
    isLocking,
    savedTournamentIds,
  }
}
