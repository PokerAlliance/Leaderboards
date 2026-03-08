/**
 * Team Configuration
 */

import type { Team, DreamweaverTeamSlug, LeagueSlug } from '@/types'

export const DREAMWEAVER_TEAMS: Team[] = [
  {
    id: 'pirates',
    name: 'Pirates',
    slug: 'pirates',
    color: '#00a5a5',
    logoUrl: '/assets/sprites/dreamweaver/pirates.png',
  },
  {
    id: 'con',
    name: 'Con Artist',
    slug: 'con',
    color: '#d946ef',
    logoUrl: '/assets/sprites/dreamweaver/con.png',
  },
  {
    id: 'outlaws',
    name: 'Outlaws',
    slug: 'outlaws',
    color: '#c9a66b',
    logoUrl: '/assets/sprites/dreamweaver/outlaws.png',
  },
  {
    id: 'renegades',
    name: 'Renegades',
    slug: 'renegades',
    color: '#f97316',
    logoUrl: '/assets/sprites/dreamweaver/renegades.png',
  },
]

export const LEAGUE_TEAMS: Record<LeagueSlug, Team[]> = {
  dreamweaver: DREAMWEAVER_TEAMS,
  tpp: [],
  fpl: [],
}

export function getTeams(leagueSlug: LeagueSlug): Team[] {
  return LEAGUE_TEAMS[leagueSlug] || []
}

export function getTeamBySlug(leagueSlug: LeagueSlug, teamSlug: string): Team | undefined {
  const teams = getTeams(leagueSlug)
  return teams.find((team) => team.slug === teamSlug)
}

export function getDreamweaverTeam(teamSlug: DreamweaverTeamSlug): Team | undefined {
  return DREAMWEAVER_TEAMS.find((team) => team.slug === teamSlug)
}

export function getTeamColor(leagueSlug: LeagueSlug, teamSlug: string): string {
  const team = getTeamBySlug(leagueSlug, teamSlug)
  return team?.color || '#888888'
}

export function getTeamName(leagueSlug: LeagueSlug, teamSlug: string): string {
  const team = getTeamBySlug(leagueSlug, teamSlug)
  return team?.name || teamSlug
}
