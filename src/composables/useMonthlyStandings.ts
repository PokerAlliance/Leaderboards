/**
 * useMonthlyStandings Composable
 * Aggregate team standings for the current month from game history
 *
 * For MTT leagues like Dreamweaver, standings are based on cumulative month points
 * (4-3-2-1 awarded per game based on team rank), not individual game points.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useGameHistory } from './useGameHistory'
import { getTeams } from '@/config/teams'
import { getScoringStrategy } from '@/services/scoring'
import type { LeagueSlug, Team } from '@/types'

export interface TeamStanding {
  team: Team
  totalMonthPoints: number
  gamesPlayed: number
  rank: number
  projectedBonus: number
}

export interface UseMonthlyStandingsReturn {
  standings: ComputedRef<TeamStanding[]>
  currentMonth: Ref<{ year: number; month: number }>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  load: () => Promise<void>
  setMonth: (year: number, month: number) => void
}

export function useMonthlyStandings(leagueSlug: LeagueSlug): UseMonthlyStandingsReturn {
  const gameHistory = useGameHistory(leagueSlug)
  const scoringStrategy = getScoringStrategy(leagueSlug)

  const now = new Date()
  const currentMonth = ref({
    year: now.getFullYear(),
    month: now.getMonth(),
  })

  const standings = computed(() => {
    const teams = getTeams(leagueSlug)
    if (teams.length === 0) return []

    const monthlyGames = gameHistory.getMonthlyGames(currentMonth.value.year, currentMonth.value.month)

    const teamStatsMap = new Map<
      string,
      {
        totalMonthPoints: number
        gamesPlayed: Set<string>
      }
    >()

    for (const team of teams) {
      teamStatsMap.set(team.slug, {
        totalMonthPoints: 0,
        gamesPlayed: new Set(),
      })
    }

    for (const game of monthlyGames) {
      if (!game.teamScores || game.teamScores.length === 0) continue

      for (const teamScore of game.teamScores) {
        const stats = teamStatsMap.get(teamScore.teamSlug)
        if (stats) {
          stats.totalMonthPoints += teamScore.monthPts
          stats.gamesPlayed.add(game.game_id)
        }
      }
    }

    const unsortedStandings: Omit<TeamStanding, 'rank' | 'projectedBonus'>[] = teams.map((team) => {
      const stats = teamStatsMap.get(team.slug) || { totalMonthPoints: 0, gamesPlayed: new Set() }
      const gamesPlayed = stats.gamesPlayed.size

      return {
        team,
        totalMonthPoints: stats.totalMonthPoints,
        gamesPlayed,
      }
    })

    const sortedStandings = unsortedStandings.sort((a, b) => b.totalMonthPoints - a.totalMonthPoints)

    return sortedStandings.map((standing, index) => ({
      ...standing,
      rank: index + 1,
      projectedBonus: scoringStrategy.calculateMonthPoints(index + 1, teams.length),
    }))
  })

  async function load(): Promise<void> {
    await gameHistory.load()
  }

  function setMonth(year: number, month: number): void {
    currentMonth.value = { year, month }
  }

  return {
    standings,
    currentMonth,
    isLoading: gameHistory.isLoading,
    error: gameHistory.error,
    load,
    setMonth,
  }
}
