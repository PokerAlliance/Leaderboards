/**
 * useTeamRoster Composable
 * Load team rosters from Google Sheets and map usernames to teams
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { sheetsClient } from '@/services/sheets'
import { getTeams, getTeamBySlug } from '@/config/teams'
import type { LeagueSlug, Team, TeamMember, PlayerTeamAssignment, ParsedSheetTeamMember } from '@/types'

export interface UseTeamRosterOptions {
  autoLoad?: boolean
}

export interface UseTeamRosterReturn {
  members: Ref<TeamMember[]>
  teams: ComputedRef<Team[]>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  load: () => Promise<void>
  getPlayerTeam: (username: string) => PlayerTeamAssignment | null
  getTeamMembers: (teamSlug: string) => TeamMember[]
  isPlayerInLeague: (username: string) => boolean
}

export function useTeamRoster(
  leagueSlug: LeagueSlug,
  options: UseTeamRosterOptions = {}
): UseTeamRosterReturn {
  const { autoLoad = false } = options

  const members = ref<TeamMember[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const playerTeamMap = new Map<string, PlayerTeamAssignment>()

  const teams = computed(() => getTeams(leagueSlug))

  function transformMember(raw: ParsedSheetTeamMember): TeamMember {
    return {
      username: raw.username,
      teamSlug: raw.team_slug,
      joinedDate: raw.joined_date,
    }
  }

  function buildPlayerTeamMap(): void {
    playerTeamMap.clear()
    for (const member of members.value) {
      const team = getTeamBySlug(leagueSlug, member.teamSlug)
      playerTeamMap.set(member.username, {
        username: member.username,
        teamSlug: member.teamSlug,
        teamName: team?.name || member.teamSlug,
      })
    }
  }

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const rawMembers = await sheetsClient.getTeamRoster(leagueSlug)
      members.value = rawMembers.map(transformMember)
      buildPlayerTeamMap()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      console.error('Failed to load team roster:', e)
    } finally {
      isLoading.value = false
    }
  }

  function getPlayerTeam(username: string): PlayerTeamAssignment | null {
    return playerTeamMap.get(username) || null
  }

  function getTeamMembers(teamSlug: string): TeamMember[] {
    return members.value.filter((m) => m.teamSlug === teamSlug)
  }

  function isPlayerInLeague(username: string): boolean {
    return playerTeamMap.has(username)
  }

  if (autoLoad) {
    load()
  }

  return {
    members,
    teams,
    isLoading,
    error,
    load,
    getPlayerTeam,
    getTeamMembers,
    isPlayerInLeague,
  }
}
