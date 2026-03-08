/**
 * League Configuration
 */

import type { LeagueSlug } from '@/types'

export type SeasonType = 'monthly' | 'quarterly'
export type GameDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type GameFormat = 'mtt' | 'sng'

export interface LeagueScoringRules {
  pointsTable: number[]
  monthPointsTable: number[]
  gameStartTime: string
  rulesDescription: string
}

export interface LeagueConfig {
  slug: LeagueSlug
  name: string
  shortName: string
  replayLeagueId: number
  scoringStrategy: string
  seasonType: SeasonType
  gameFormat: GameFormat
  gameDays: GameDay[]
  theme: string
  description: string
  isActive: boolean
  scoringRules: LeagueScoringRules
  backgroundImage: string
}

const BASE = import.meta.env.BASE_URL

export const LEAGUES: Record<LeagueSlug, LeagueConfig> = {
  dreamweaver: {
    slug: 'dreamweaver',
    name: 'Dreamweavers',
    shortName: 'DW',
    replayLeagueId: 30,
    scoringStrategy: 'dreamweaver',
    seasonType: 'monthly',
    gameFormat: 'mtt',
    gameDays: ['monday', 'wednesday', 'thursday', 'sunday'],
    theme: 'dreamweaver',
    description: 'A team league where four teams compete for monthly supremacy',
    isActive: true,
    scoringRules: {
      pointsTable: [21, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      monthPointsTable: [4, 3, 2, 1],
      gameStartTime: '9:30 PM EST',
      rulesDescription: "Points are awarded to the top 18 finishers in each game. Teams are ranked by game points, then earn 4/3/2/1 month points based on that ranking. Monthly standings show cumulative month points.",
    },
    backgroundImage: `${BASE}assets/backgrounds/dw-background.png`,
  },
  tpp: {
    slug: 'tpp',
    name: 'TPP',
    shortName: 'TPP',
    replayLeagueId: 0,
    scoringStrategy: 'tpp',
    seasonType: 'quarterly',
    gameFormat: 'mtt',
    gameDays: [],
    theme: 'tpp',
    description: 'Team Poker League with quarterly seasons',
    isActive: false,
    scoringRules: {
      pointsTable: [],
      monthPointsTable: [],
      gameStartTime: '',
      rulesDescription: '',
    },
    backgroundImage: '',
  },
  fpl: {
    slug: 'fpl',
    name: 'FPL Lightning Pairs',
    shortName: 'FPL',
    replayLeagueId: 0,
    scoringStrategy: 'fpl',
    seasonType: 'monthly',
    gameFormat: 'sng',
    gameDays: [],
    theme: 'fpl',
    description: '6-max SNG pairs tournament',
    isActive: false,
    scoringRules: {
      pointsTable: [],
      monthPointsTable: [],
      gameStartTime: '',
      rulesDescription: '',
    },
    backgroundImage: '',
  },
}

export function getLeagueConfig(slug: LeagueSlug): LeagueConfig {
  return LEAGUES[slug]
}

export function getActiveLeagues(): LeagueConfig[] {
  return Object.values(LEAGUES).filter((league) => league.isActive)
}

export function getLeagueByReplayId(replayLeagueId: number): LeagueConfig | undefined {
  return Object.values(LEAGUES).find((league) => league.replayLeagueId === replayLeagueId)
}
