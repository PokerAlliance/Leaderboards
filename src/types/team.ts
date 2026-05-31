/**
 * Team and Roster Types
 */

export type DreamweaverTeamSlug = 'pirates' | 'con' | 'outlaws' | 'renegades'
export type LeagueSlug = 'dreamweaver' | 'tpp' | 'fpl' | 'anarchy' | 'donks' | 'muckers'

export interface Team {
  id: string
  name: string
  slug: string
  color: string
  logoUrl?: string
}

export interface TeamMember {
  username: string
  teamSlug: string
  joinedDate: Date
}

export interface TeamRoster {
  team: Team
  members: TeamMember[]
}

export interface PlayerTeamAssignment {
  username: string
  teamSlug: string
  teamName: string
}

export interface LeagueTeams {
  leagueSlug: LeagueSlug
  teams: Team[]
  rosters: Map<string, TeamMember[]>
}
