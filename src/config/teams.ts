/**
 * Team Configuration
 */

import type { Team, DreamweaverTeamSlug, LeagueSlug, AnarchyTeamSlug, MuckersTeamSlug } from '@/types'

const BASE = import.meta.env.BASE_URL

export const DREAMWEAVER_TEAMS: Team[] = [
  {
    id: 'pirates',
    name: 'Pirates',
    slug: 'pirates',
    color: '#00a5a5',
    logoUrl: `${BASE}assets/sprites/dreamweaver/pirates.png`,
  },
  {
    id: 'con',
    name: 'Con Artist',
    slug: 'con',
    color: '#d946ef',
    logoUrl: `${BASE}assets/sprites/dreamweaver/con.png`,
  },
  {
    id: 'outlaws',
    name: 'Outlaws',
    slug: 'outlaws',
    color: '#c9a66b',
    logoUrl: `${BASE}assets/sprites/dreamweaver/outlaws.png`,
  },
  {
    id: 'renegades',
    name: 'Renegades',
    slug: 'renegades',
    color: '#f97316',
    logoUrl: `${BASE}assets/sprites/dreamweaver/renegades.png`,
  },
]

export const ANARCHY_TEAMS: Team[] = [
  {
    id: 'crusaders',
    name: 'Crusaders',
    slug: 'crusaders',
    color: '#8B4513',
    logoUrl: `${BASE}assets/sprites/anarchy/crusaders.png`,
  },
  {
    id: 'chaos',
    name: 'Chaos',
    slug: 'chaos',
    color: '#FF0080',
    logoUrl: `${BASE}assets/sprites/anarchy/chaos.jpg`,
  },
  {
    id: 'harmonic',
    name: 'Harmonic Force',
    slug: 'harmonic',
    color: '#7B2D8E',
    logoUrl: `${BASE}assets/sprites/anarchy/harmonic.jpg`,
  },
]

export const MUCKERS_TEAMS: Team[] = [
  {
    id: 'maniac_muckers',
    name: 'Maniac Muckers',
    slug: 'maniac_muckers',
    color: '#A0522D',
    logoUrl: `${BASE}assets/sprites/muckers/maniac_muckers.png`,
  },
  {
    id: 'moosicians',
    name: 'Moosicians',
    slug: 'moosicians',
    color: '#4682B4',
    logoUrl: `${BASE}assets/sprites/muckers/moosicians.png`,
  },
  {
    id: 'barnstormers',
    name: 'BarnStormers',
    slug: 'barnstormers',
    color: '#8B0000',
    logoUrl: `${BASE}assets/sprites/muckers/barnstormers.png`,
  },
  {
    id: 'final_straw',
    name: 'The Final Straw',
    slug: 'final_straw',
    color: '#DAA520',
    logoUrl: `${BASE}assets/sprites/muckers/final_straw.png`,
  },
  {
    id: 'desperados',
    name: 'Desperados',
    slug: 'desperados',
    color: '#2F4F4F',
    logoUrl: `${BASE}assets/sprites/muckers/desperados.png`,
  },
  {
    id: 'shameless',
    name: 'Shameless',
    slug: 'shameless',
    color: '#9932CC',
    logoUrl: `${BASE}assets/sprites/muckers/shameless.png`,
  },
  {
    id: 'mucker_luckers',
    name: 'Mucker Luckers',
    slug: 'mucker_luckers',
    color: '#006400',
    logoUrl: `${BASE}assets/sprites/muckers/mucker_luckers.png`,
  },
  {
    id: 'howlers',
    name: "Freeto's Howlers",
    slug: 'howlers',
    color: '#B8860B',
    logoUrl: `${BASE}assets/sprites/muckers/howlers.png`,
  },
  {
    id: 'cobra_chickens',
    name: 'Cobra Chickens',
    slug: 'cobra_chickens',
    color: '#191970',
    logoUrl: `${BASE}assets/sprites/muckers/cobra_chickens.png`,
  },
  {
    id: 'mucku20',
    name: 'MUCK U 2.0',
    slug: 'mucku20',
    color: '#DC143C',
    logoUrl: `${BASE}assets/sprites/muckers/mucku20.png`,
  },
]

export const LEAGUE_TEAMS: Record<LeagueSlug, Team[]> = {
  dreamweaver: DREAMWEAVER_TEAMS,
  tpp: [],
  fpl: [],
  anarchy: ANARCHY_TEAMS,
  donks: [],
  muckers: MUCKERS_TEAMS,
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

export function getAnarchyTeam(teamSlug: AnarchyTeamSlug): Team | undefined {
  return ANARCHY_TEAMS.find((team) => team.slug === teamSlug)
}

export function getMuckersTeam(teamSlug: MuckersTeamSlug): Team | undefined {
  return MUCKERS_TEAMS.find((team) => team.slug === teamSlug)
}

export function getTeamColor(leagueSlug: LeagueSlug, teamSlug: string): string {
  const team = getTeamBySlug(leagueSlug, teamSlug)
  return team?.color || '#888888'
}

export function getTeamName(leagueSlug: LeagueSlug, teamSlug: string): string {
  const team = getTeamBySlug(leagueSlug, teamSlug)
  return team?.name || teamSlug
}
