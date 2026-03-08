/**
 * useScoring Composable
 * Connect scoring strategy to tournament data, compute results
 */

import { ref, computed, type ComputedRef } from 'vue'
import type {
  LeagueSlug,
  Tournament,
  TournamentWinner,
  PlayerGameResult,
  TeamGameScore,
  GameResult,
} from '@/types'
import { getScoringStrategy } from '@/services/scoring'

export interface UseScoringOptions {
  getPlayerTeam: (playerId: number) => { teamSlug: string; teamName: string } | null
}

export interface UseScoringReturn {
  playerResults: ComputedRef<PlayerGameResult[]>
  teamScores: ComputedRef<TeamGameScore[]>
  unassignedPlayers: ComputedRef<PlayerGameResult[]>
  calculateFromTournament: (tournament: Tournament) => GameResult
  calculateFromWinners: (winners: TournamentWinner[], totalPlayers: number) => GameResult
}

export function useScoring(leagueSlug: LeagueSlug, options: UseScoringOptions): UseScoringReturn {
  const { getPlayerTeam } = options

  const strategy = getScoringStrategy(leagueSlug)

  const currentPlayerResults = ref<PlayerGameResult[]>([])
  const currentTeamScores = ref<TeamGameScore[]>([])
  const currentUnassignedPlayers = ref<PlayerGameResult[]>([])

  const playerResults = computed(() => currentPlayerResults.value)
  const teamScores = computed(() => currentTeamScores.value)
  const unassignedPlayers = computed(() => currentUnassignedPlayers.value)

  function calculatePlayerResult(
    playerId: number,
    username: string,
    position: number,
    totalPlayers: number
  ): PlayerGameResult {
    const teamAssignment = getPlayerTeam(playerId)
    const points = strategy.calculatePlayerPoints(position, totalPlayers)

    return {
      playerId,
      username,
      teamSlug: teamAssignment?.teamSlug || null,
      teamName: teamAssignment?.teamName || null,
      finishPosition: position,
      pointsEarned: points,
    }
  }

  function calculateFromTournament(tournament: Tournament): GameResult {
    const totalPlayers = tournament.totalPlayers
    const results: PlayerGameResult[] = []

    if (tournament.state === 'finished' && tournament.winners.length > 0) {
      for (const winner of tournament.winners) {
        const player = tournament.players.find((p) => p.username === winner.username)
        results.push(
          calculatePlayerResult(
            player?.id || 0,
            winner.username,
            winner.position,
            totalPlayers
          )
        )
      }
    } else {
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1
        if (!a.isEliminated && b.isEliminated) return -1
        if (a.isEliminated && b.isEliminated) return 0
        return b.chips - a.chips
      })

      sortedPlayers.forEach((player, index) => {
        const position = player.isEliminated
          ? totalPlayers - tournament.players.filter((p) => !p.isEliminated).length + index + 1
          : index + 1

        results.push(calculatePlayerResult(player.id, player.username, position, totalPlayers))
      })
    }

    return processResults(results, tournament.id, totalPlayers)
  }

  function calculateFromWinners(
    winners: TournamentWinner[],
    totalPlayers: number
  ): GameResult {
    const results: PlayerGameResult[] = winners.map((winner) =>
      calculatePlayerResult(winner.playerId || 0, winner.username, winner.position, totalPlayers)
    )

    return processResults(results, 0, totalPlayers)
  }

  function processResults(
    results: PlayerGameResult[],
    tournamentId: number,
    totalPlayers: number
  ): GameResult {
    currentPlayerResults.value = results

    const teamResultsMap = new Map<string, PlayerGameResult[]>()
    const unassigned: PlayerGameResult[] = []

    for (const result of results) {
      if (result.teamSlug) {
        const existing = teamResultsMap.get(result.teamSlug) || []
        existing.push(result)
        teamResultsMap.set(result.teamSlug, existing)
      } else {
        unassigned.push(result)
      }
    }

    const teams: TeamGameScore[] = Array.from(teamResultsMap.entries())
      .map(([teamSlug, playerResults]) =>
        strategy.calculateTeamScore(
          teamSlug,
          playerResults[0]?.teamName || teamSlug,
          playerResults,
          totalPlayers
        )
      )
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((score, index) => ({ ...score, rank: index + 1 }))

    currentTeamScores.value = teams
    currentUnassignedPlayers.value = unassigned

    const now = new Date()
    const gameId = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

    return {
      gameId,
      tournamentId,
      gameDate: now,
      gameDay: dayNames[now.getDay()] ?? 'monday',
      totalPlayers,
      playerResults: results,
      teamScores: teams,
      unassignedPlayers: unassigned,
    }
  }

  return {
    playerResults,
    teamScores,
    unassignedPlayers,
    calculateFromTournament,
    calculateFromWinners,
  }
}
