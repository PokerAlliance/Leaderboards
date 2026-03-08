/**
 * Google Sheets Data Types
 * Types representing the structure of data stored in Google Sheets
 */

import type { LeagueSlug } from './team'

export interface SheetConfig {
  league_slug: LeagueSlug
  league_name: string
  replay_league_id: number
  season_type: 'monthly' | 'quarterly'
  active: boolean
}

export interface SheetTeamMember {
  player_id: number
  username: string
  team_slug: string
  joined_date: string
}

export interface SheetGame {
  game_id: string
  tournament_id: number
  game_date: string
  game_day: string
  total_players: number
  locked_by: string
  locked_at: string
}

export interface SheetPlayerResult {
  game_id: string
  player_id: number
  username: string
  team_slug_at_game: string | null
  finish_position: number
  points_earned: number
}

export interface ParsedSheetConfig extends Omit<SheetConfig, 'active'> {
  active: boolean
}

export interface ParsedSheetTeamMember extends Omit<SheetTeamMember, 'joined_date'> {
  joined_date: Date
}

export interface ParsedSheetGame extends Omit<SheetGame, 'game_date' | 'locked_at'> {
  game_date: Date
  locked_at: Date
}

export interface ParsedSheetPlayerResult extends SheetPlayerResult {}
