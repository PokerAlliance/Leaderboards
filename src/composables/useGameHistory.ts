/**
 * useGameHistory Composable
 * Fetch historical game results from Google Sheets
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { sheetsClient } from '@/services/sheets'
import type {
  LeagueSlug,
  ParsedSheetGame,
  ParsedSheetPlayerResult,
  GameResult,
  PlayerGameResult,
  TeamGameScore,
} from '@/types'
import { getTeamBySlug } from '@/config/teams'

export interface UseGameHistoryOptions {
  autoLoad?: boolean
}

export interface UseGameHistoryReturn {
  games: Ref<ParsedSheetGame[]>
  playerResults: Ref<ParsedSheetPlayerResult[]>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  load: () => Promise<void>
  getGameById: (gameId: string) => ParsedSheetGame | undefined
  getGameByTournamentId: (tournamentId: number) => ParsedSheetGame | undefined
  getGameResults: (gameId: string) => GameResult | null
  getMonthlyGames: (year: number, month: number) => ParsedSheetGame[]
  totalGames: ComputedRef<number>
}

export function useGameHistory(
  leagueSlug: LeagueSlug,
  options: UseGameHistoryOptions = {}
): UseGameHistoryReturn {
  const { autoLoad = false } = options

  const games = ref<ParsedSheetGame[]>([])
  const playerResults = ref<ParsedSheetPlayerResult[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const totalGames = computed(() => games.value.length)

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const [gamesData, resultsData] = await Promise.all([
        sheetsClient.getGames(leagueSlug),
        sheetsClient.getPlayerResults(leagueSlug),
      ])
      games.value = gamesData
      playerResults.value = resultsData
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      console.error('Failed to load game history:', e)
    } finally {
      isLoading.value = false
    }
  }

  function getGameById(gameId: string): ParsedSheetGame | undefined {
    return games.value.find((g) => g.game_id === gameId)
  }

  function getGameByTournamentId(tournamentId: number): ParsedSheetGame | undefined {
    return games.value.find((g) => g.tournament_id === tournamentId)
  }

  function getGameResults(gameId: string): GameResult | null {
    const game = getGameById(gameId)
    if (!game) return null

    const gamePlayerResults = playerResults.value.filter((r) => r.game_id === gameId)

    const playerGameResults: PlayerGameResult[] = gamePlayerResults.map((r) => ({
      playerId: r.player_id,
      username: r.username,
      teamSlug: r.team_slug_at_game,
      teamName: r.team_slug_at_game
        ? getTeamBySlug(leagueSlug, r.team_slug_at_game)?.name || r.team_slug_at_game
        : null,
      finishPosition: r.finish_position,
      pointsEarned: r.points_earned,
    }))

    const teamScoresMap = new Map<string, PlayerGameResult[]>()
    const unassignedPlayers: PlayerGameResult[] = []

    for (const result of playerGameResults) {
      if (result.teamSlug) {
        const existing = teamScoresMap.get(result.teamSlug) || []
        existing.push(result)
        teamScoresMap.set(result.teamSlug, existing)
      } else {
        unassignedPlayers.push(result)
      }
    }

    const teamScores: TeamGameScore[] = Array.from(teamScoresMap.entries())
      .map(([teamSlug, results]) => ({
        teamSlug,
        teamName: getTeamBySlug(leagueSlug, teamSlug)?.name || teamSlug,
        totalPoints: results.reduce((sum, r) => sum + r.pointsEarned, 0),
        playerResults: results,
        rank: 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((score, index) => ({ ...score, rank: index + 1 }))

    return {
      gameId: game.game_id,
      tournamentId: game.tournament_id,
      gameDate: game.game_date,
      gameDay: game.game_day,
      totalPlayers: game.total_players,
      playerResults: playerGameResults,
      teamScores,
      unassignedPlayers,
    }
  }

  function getMonthlyGames(year: number, month: number): ParsedSheetGame[] {
    return games.value.filter((game) => {
      const gameDate = game.game_date
      return gameDate.getFullYear() === year && gameDate.getMonth() === month
    })
  }

  if (autoLoad) {
    load()
  }

  return {
    games,
    playerResults,
    isLoading,
    error,
    load,
    getGameById,
    getGameByTournamentId,
    getGameResults,
    getMonthlyGames,
    totalGames,
  }
}
