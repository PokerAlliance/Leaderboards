/**
 * Team and Roster Types
 */

export type DreamweaverTeamSlug = 'pirates' | 'con' | 'outlaws' | 'renegades'
export type LeagueSlug = 'dreamweaver' | 'tpp' | 'fpl'

export interface Team {
  id: string
  name: string
  slug: string
  color: string
  logoUrl?: string
}

export interface TeamMember {
  playerId: number
  username: string
  teamSlug: string
  joinedDate: Date
}

export interface TeamRoster {
  team: Team
  members: TeamMember[]
}

export interface PlayerTeamAssignment {
  playerId: number
  teamSlug: string
  teamName: string
}

export interface LeagueTeams {
  leagueSlug: LeagueSlug
  teams: Team[]
  rosters: Map<string, TeamMember[]>
}
