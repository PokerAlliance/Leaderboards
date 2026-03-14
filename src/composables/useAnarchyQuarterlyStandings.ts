/**
 * useAnarchyQuarterlyStandings Composable
 * 
 * Calculates quarterly Primary standings for Anarchy league
 * - Aggregates team primary scores by quarter
 * - Handles quarter boundaries and transitions
 */

import { ref, computed, type ComputedRef, type Ref } from 'vue'
import type {
  AnarchyTeamSlug,
  AnarchyQuarterlyStanding,
  AnarchyQuarter,
  ParsedAnarchyGame,
  ParsedAnarchyPlayerResult,
} from '@/types/anarchy'
import { getCurrentQuarter, getQuarterBounds } from '@/types/anarchy'
import { ANARCHY_TEAMS } from '@/config/teams'

export interface UseAnarchyQuarterlyStandingsReturn {
  standings: ComputedRef<AnarchyQuarterlyStanding[]>
  currentQuarter: ComputedRef<AnarchyQuarter>
  currentYear: ComputedRef<number>
  quarterLabel: ComputedRef<string>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  load: () => Promise<void>
  setQuarter: (year: number, quarter: AnarchyQuarter) => void
}

export function useAnarchyQuarterlyStandings(
  games: Ref<ParsedAnarchyGame[]>,
  playerResults: Ref<ParsedAnarchyPlayerResult[]>
): UseAnarchyQuarterlyStandingsReturn {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const selectedYear = ref(new Date().getFullYear())
  const selectedQuarter = ref<AnarchyQuarter>(getCurrentQuarter())

  const currentQuarter = computed(() => selectedQuarter.value)
  const currentYear = computed(() => selectedYear.value)
  
  const quarterLabel = computed(() => {
    return `${selectedQuarter.value} ${selectedYear.value}`
  })

  const quarterGames = computed(() => {
    const { start, end } = getQuarterBounds(selectedYear.value, selectedQuarter.value)
    
    return games.value.filter((game) => {
      const gameDate = new Date(game.gameDate)
      return gameDate >= start && gameDate <= end
    })
  })

  const standings = computed((): AnarchyQuarterlyStanding[] => {
    const teamStats = new Map<AnarchyTeamSlug, { primaryPoints: number; gamesPlayed: Set<string> }>()
    
    for (const team of ANARCHY_TEAMS) {
      teamStats.set(team.slug as AnarchyTeamSlug, {
        primaryPoints: 0,
        gamesPlayed: new Set(),
      })
    }

    for (const game of quarterGames.value) {
      const gameResults = playerResults.value.filter((r) => r.gameId === game.gameId)
      
      const teamResultsMap = new Map<AnarchyTeamSlug, ParsedAnarchyPlayerResult[]>()
      
      for (const result of gameResults) {
        if (result.teamSlug) {
          const existing = teamResultsMap.get(result.teamSlug) || []
          existing.push(result)
          teamResultsMap.set(result.teamSlug, existing)
        }
      }

      for (const [teamSlug, results] of teamResultsMap) {
        const stats = teamStats.get(teamSlug)
        if (stats) {
          const sortedByPoints = [...results].sort((a, b) => b.pointsEarned - a.pointsEarned)
          const top5 = sortedByPoints.slice(0, 5)
          const primaryScore = top5.reduce((sum, r) => sum + r.pointsEarned, 0)
          
          stats.primaryPoints += primaryScore
          stats.gamesPlayed.add(game.gameId)
        }
      }
    }

    const standingsList: AnarchyQuarterlyStanding[] = ANARCHY_TEAMS.map((team) => {
      const stats = teamStats.get(team.slug as AnarchyTeamSlug)!
      return {
        teamSlug: team.slug as AnarchyTeamSlug,
        teamName: team.name,
        totalPrimaryPoints: stats.primaryPoints,
        gamesPlayed: stats.gamesPlayed.size,
        rank: 0,
      }
    })

    standingsList.sort((a, b) => b.totalPrimaryPoints - a.totalPrimaryPoints)

    let currentRank = 1
    for (let i = 0; i < standingsList.length; i++) {
      if (i > 0 && standingsList[i]!.totalPrimaryPoints < standingsList[i - 1]!.totalPrimaryPoints) {
        currentRank = i + 1
      }
      standingsList[i]!.rank = currentRank
    }

    return standingsList
  })

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      // Data is provided via refs, no loading needed here
      // This method is kept for API consistency
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load standings'
    } finally {
      isLoading.value = false
    }
  }

  function setQuarter(year: number, quarter: AnarchyQuarter) {
    selectedYear.value = year
    selectedQuarter.value = quarter
  }

  return {
    standings,
    currentQuarter,
    currentYear,
    quarterLabel,
    isLoading,
    error,
    load,
    setQuarter,
  }
}
