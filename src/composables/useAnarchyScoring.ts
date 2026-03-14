/**
 * useAnarchyScoring Composable
 * 
 * Calculate Anarchy league scores with:
 * - Inverse position scoring (totalPlayers - position + 1)
 * - Bounty extraction from API data
 * - Top 5 team aggregation for Primary score
 * - All bounties count for Bounty score
 */

import { ref, computed, type ComputedRef } from 'vue'
import type { Tournament, TournamentWinner } from '@/types'
import type {
  AnarchyTeamSlug,
  AnarchyPlayerResult,
  AnarchyTeamScore,
  AnarchyGameResult,
} from '@/types/anarchy'
import { getAnarchyScoringStrategy, type BountyWinner } from '@/services/scoring'
import { ANARCHY_TEAMS } from '@/config/teams'

export interface UseAnarchyScoringOptions {
  getPlayerTeam: (username: string) => { teamSlug: AnarchyTeamSlug; teamName: string } | null
}

export interface UseAnarchyScoringReturn {
  playerResults: ComputedRef<AnarchyPlayerResult[]>
  teamScores: ComputedRef<AnarchyTeamScore[]>
  unassignedPlayers: ComputedRef<AnarchyPlayerResult[]>
  calculateFromTournament: (
    tournament: Tournament,
    bountyWinners?: BountyWinner[],
    bountyValue?: number
  ) => AnarchyGameResult
  calculateFromWinners: (
    winners: TournamentWinner[],
    totalPlayers: number,
    bountyWinners?: BountyWinner[],
    bountyValue?: number
  ) => AnarchyGameResult
}

export function useAnarchyScoring(options: UseAnarchyScoringOptions): UseAnarchyScoringReturn {
  const { getPlayerTeam } = options
  const strategy = getAnarchyScoringStrategy()

  const currentPlayerResults = ref<AnarchyPlayerResult[]>([])
  const currentTeamScores = ref<AnarchyTeamScore[]>([])
  const currentUnassignedPlayers = ref<AnarchyPlayerResult[]>([])

  const playerResults = computed(() => currentPlayerResults.value)
  const teamScores = computed(() => currentTeamScores.value)
  const unassignedPlayers = computed(() => currentUnassignedPlayers.value)

  function calculatePlayerResult(
    username: string,
    position: number,
    totalPlayers: number,
    bounties: Map<string, number>,
    avatar: string = ''
  ): AnarchyPlayerResult {
    const teamAssignment = getPlayerTeam(username)
    const points = strategy.calculatePlayerPoints(position, totalPlayers)
    const bountiesCollected = bounties.get(username) || 0

    return {
      username,
      avatar,
      teamSlug: teamAssignment?.teamSlug || null,
      teamName: teamAssignment?.teamName || null,
      finishPosition: position,
      pointsEarned: points,
      bountiesCollected,
      isInTop5: false,
    }
  }

  function calculateFromTournament(
    tournament: Tournament,
    bountyWinners?: BountyWinner[],
    bountyValue: number = 0
  ): AnarchyGameResult {
    const totalPlayers = tournament.totalPlayers
    const bounties = strategy.extractBounties(bountyWinners, bountyValue)
    const results: AnarchyPlayerResult[] = []

    if (tournament.state === 'finished' && tournament.winners.length > 0) {
      for (const winner of tournament.winners) {
        const player = tournament.players.find((p) => p.username === winner.username)
        results.push(
          calculatePlayerResult(
            winner.username,
            winner.position,
            totalPlayers,
            bounties,
            player?.avatar || ''
          )
        )
      }
    } else {
      const sortedPlayers = [...tournament.players].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1
        if (!a.isEliminated && b.isEliminated) return -1
        if (a.isEliminated && b.isEliminated) return 0
        return (b.chips ?? 0) - (a.chips ?? 0)
      })

      sortedPlayers.forEach((player, index) => {
        const position = player.isEliminated
          ? totalPlayers - tournament.players.filter((p) => !p.isEliminated).length + index + 1
          : index + 1

        results.push(
          calculatePlayerResult(
            player.username,
            position,
            totalPlayers,
            bounties,
            player.avatar || ''
          )
        )
      })
    }

    return processResults(results, tournament.id, totalPlayers, bountyValue)
  }

  function calculateFromWinners(
    winners: TournamentWinner[],
    totalPlayers: number,
    bountyWinners?: BountyWinner[],
    bountyValue: number = 0
  ): AnarchyGameResult {
    const bounties = strategy.extractBounties(bountyWinners, bountyValue)
    const results: AnarchyPlayerResult[] = winners.map((winner) =>
      calculatePlayerResult(
        winner.username,
        winner.position,
        totalPlayers,
        bounties,
        ''
      )
    )

    return processResults(results, 0, totalPlayers, bountyValue)
  }

  function processResults(
    results: AnarchyPlayerResult[],
    tournamentId: number,
    totalPlayers: number,
    bountyValue: number
  ): AnarchyGameResult {
    currentPlayerResults.value = results

    const teamResultsMap = new Map<AnarchyTeamSlug, AnarchyPlayerResult[]>()
    const unassigned: AnarchyPlayerResult[] = []

    for (const result of results) {
      if (result.teamSlug) {
        const existing = teamResultsMap.get(result.teamSlug) || []
        existing.push(result)
        teamResultsMap.set(result.teamSlug, existing)
      } else {
        unassigned.push(result)
      }
    }

    const teams: AnarchyTeamScore[] = ANARCHY_TEAMS
      .filter((team) => teamResultsMap.has(team.slug as AnarchyTeamSlug))
      .map((team) => {
        const teamSlug = team.slug as AnarchyTeamSlug
        const teamResults = teamResultsMap.get(teamSlug) || []
        return strategy.calculateAnarchyTeamScore(teamSlug, team.name, teamResults)
      })
      .sort((a, b) => b.primaryScore - a.primaryScore)
      .map((score, index) => ({ ...score, rank: index + 1 }))

    currentTeamScores.value = teams
    currentUnassignedPlayers.value = unassigned

    const now = new Date()
    const gameId = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`
    const day = now.getDay()
    const gameSlot: 'wed_1pm' | 'sat_7pm' = day === 3 ? 'wed_1pm' : 'sat_7pm'

    return {
      gameId,
      tournamentId,
      gameDate: now,
      gameSlot,
      totalPlayers,
      bountyValue,
      teamScores: teams,
      playerResults: results,
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
