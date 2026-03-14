/**
 * useAnarchyBountyBoard Composable
 * 
 * Calculates monthly bounty standings for Anarchy league
 * - Aggregates all bounties collected by team members
 * - Resets monthly
 */

import { ref, computed, type ComputedRef, type Ref } from 'vue'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import type {
  AnarchyTeamSlug,
  AnarchyMonthlyBountyStanding,
  ParsedAnarchyGame,
  ParsedAnarchyPlayerResult,
} from '@/types/anarchy'
import { ANARCHY_TEAMS } from '@/config/teams'

export interface UseAnarchyBountyBoardReturn {
  standings: ComputedRef<AnarchyMonthlyBountyStanding[]>
  currentMonth: ComputedRef<string>
  monthLabel: ComputedRef<string>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  load: () => Promise<void>
  setMonth: (year: number, month: number) => void
}

export function useAnarchyBountyBoard(
  games: Ref<ParsedAnarchyGame[]>,
  playerResults: Ref<ParsedAnarchyPlayerResult[]>
): UseAnarchyBountyBoardReturn {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const selectedDate = ref(new Date())

  const currentMonth = computed(() => {
    return format(selectedDate.value, 'yyyy-MM')
  })
  
  const monthLabel = computed(() => {
    return format(selectedDate.value, 'MMMM yyyy')
  })

  const monthGames = computed(() => {
    const start = startOfMonth(selectedDate.value)
    const end = endOfMonth(selectedDate.value)
    
    return games.value.filter((game) => {
      const gameDate = new Date(game.gameDate)
      return gameDate >= start && gameDate <= end
    })
  })

  const standings = computed((): AnarchyMonthlyBountyStanding[] => {
    const teamStats = new Map<AnarchyTeamSlug, { bounties: number; gamesPlayed: Set<string> }>()
    
    for (const team of ANARCHY_TEAMS) {
      teamStats.set(team.slug as AnarchyTeamSlug, {
        bounties: 0,
        gamesPlayed: new Set(),
      })
    }

    for (const game of monthGames.value) {
      const gameResults = playerResults.value.filter((r) => r.gameId === game.gameId)
      
      for (const result of gameResults) {
        if (result.teamSlug) {
          const stats = teamStats.get(result.teamSlug)
          if (stats) {
            stats.bounties += result.bountiesCollected
            stats.gamesPlayed.add(game.gameId)
          }
        }
      }
    }

    const standingsList: AnarchyMonthlyBountyStanding[] = ANARCHY_TEAMS.map((team) => {
      const stats = teamStats.get(team.slug as AnarchyTeamSlug)!
      return {
        teamSlug: team.slug as AnarchyTeamSlug,
        teamName: team.name,
        totalBounties: stats.bounties,
        gamesPlayed: stats.gamesPlayed.size,
        rank: 0,
      }
    })

    standingsList.sort((a, b) => b.totalBounties - a.totalBounties)

    let currentRank = 1
    for (let i = 0; i < standingsList.length; i++) {
      if (i > 0 && standingsList[i]!.totalBounties < standingsList[i - 1]!.totalBounties) {
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
      error.value = e instanceof Error ? e.message : 'Failed to load bounty board'
    } finally {
      isLoading.value = false
    }
  }

  function setMonth(year: number, month: number) {
    selectedDate.value = new Date(year, month, 1)
  }

  return {
    standings,
    currentMonth,
    monthLabel,
    isLoading,
    error,
    load,
    setMonth,
  }
}
