/**
 * League Configuration
 */

import type { LeagueSlug } from '@/types'

export type SeasonType = 'monthly' | 'quarterly' | 'dual'
export type GameDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type GameFormat = 'mtt' | 'sng' | 'bounty-mtt'

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
  anarchy: {
    slug: 'anarchy',
    name: 'Anarchy',
    shortName: 'AN',
    replayLeagueId: 86,
    scoringStrategy: 'anarchy',
    seasonType: 'dual',
    gameFormat: 'bounty-mtt',
    gameDays: ['wednesday', 'saturday'],
    theme: 'anarchy',
    description: 'Where silence is broken and strategy is shared. Team poker with bounties and open table discussion.',
    isActive: true,
    scoringRules: {
      pointsTable: [],
      monthPointsTable: [],
      gameStartTime: 'Wed 1pm ET / Sat 7pm ET',
      rulesDescription: 'Points = Total Players - Position + 1. Top 5 finishers per team form Primary score. All bounties count for Bounty leaderboard. Primary is quarterly, Bounty is monthly.',
    },
    backgroundImage: `${BASE}assets/backgrounds/anarchy-background.png`,
  },
  donks: {
    slug: 'donks',
    name: "Badonk's Donks League",
    shortName: 'DONKS',
    replayLeagueId: 14,
    scoringStrategy: 'donks',
    seasonType: 'quarterly',
    gameFormat: 'mtt',
    gameDays: ['monday', 'wednesday', 'sunday'],
    theme: 'donks',
    description: 'The toughest private poker tournaments on ReplayPoker. Individual play across 6 weekly cups with quarterly standings.',
    isActive: true,
    scoringRules: {
      pointsTable: [],
      monthPointsTable: [],
      gameStartTime: 'Mon 1PM / 5:30PM ET · Wed 1PM / 7PM ET · Sun 2PM / 6PM ET',
      rulesDescription: 'Points = (1000 × √Runners / √Position) × (1 + log₁₀(BuyIn)). Top 9 scores counted per leaderboard. 6 cup leaderboards + 2 composite medals per quarter.',
    },
    backgroundImage: `${BASE}assets/backgrounds/donks-background.png`,
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
