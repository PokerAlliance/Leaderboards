/**
 * Google Sheets Client
 * Fetches data via AppScript proxy (preferred) or direct CSV (fallback)
 */

import { ofetch } from 'ofetch'
import { parseCSV, parseNumber, parseBoolean, parseDate } from './csv-parser'
import { appScriptClient, isAppScriptConfigured } from '@/services/appscript'
import type {
  ParsedSheetConfig,
  ParsedSheetTeamMember,
  ParsedSheetGame,
  ParsedSheetPlayerResult,
} from '@/types'

export class SheetsClientError extends Error {
  sheetName?: string

  constructor(message: string, sheetName?: string) {
    super(message)
    this.name = 'SheetsClientError'
    this.sheetName = sheetName
  }
}

function getSpreadsheetId(): string {
  const id = import.meta.env.VITE_SHEETS_ID as string | undefined
  if (!id) {
    throw new SheetsClientError(
      'VITE_SHEETS_ID environment variable not set. Please configure your Google Sheets ID.'
    )
  }
  return id
}

function buildSheetUrl(sheetName: string): string {
  const spreadsheetId = getSpreadsheetId()
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
}

async function fetchSheetDirect<T>(sheetName: string): Promise<T[]> {
  const url = buildSheetUrl(sheetName)
  const csv = await ofetch(url, {
    responseType: 'text' as const,
    retry: 2,
    retryDelay: 1000,
  })
  return parseCSV(csv as string) as T[]
}

async function fetchSheet<T>(sheetName: string): Promise<T[]> {
  try {
    if (isAppScriptConfigured()) {
      return await appScriptClient.getSheet<T>(sheetName)
    } else {
      return await fetchSheetDirect<T>(sheetName)
    }
  } catch (error) {
    if (error instanceof SheetsClientError) throw error
    throw new SheetsClientError(`Failed to fetch sheet: ${sheetName}`, sheetName)
  }
}

interface RawSheetRow {
  [key: string]: string | undefined
}

export const sheetsClient = {
  /**
   * Fetch league configuration
   */
  async getConfig(): Promise<ParsedSheetConfig[]> {
    const raw = await fetchSheet<RawSheetRow>('config')
    return raw.map((row) => ({
      league_slug: (row.league_slug || '') as ParsedSheetConfig['league_slug'],
      league_name: row.league_name || '',
      replay_league_id: parseNumber(row.replay_league_id),
      season_type: (row.season_type || 'monthly') as 'monthly' | 'quarterly',
      active: parseBoolean(row.active),
    }))
  },

  /**
   * Fetch team roster for a specific league
   */
  async getTeamRoster(leagueSlug: string): Promise<ParsedSheetTeamMember[]> {
    const sheetName = `${leagueSlug}_teams`
    const raw = await fetchSheet<RawSheetRow>(sheetName)
    return raw.map((row) => ({
      player_id: parseNumber(row.player_id),
      username: row.username || '',
      team_slug: row.team_slug || '',
      joined_date: parseDate(row.joined_date),
    }))
  },

  /**
   * Fetch game history for a specific league
   */
  async getGames(leagueSlug: string): Promise<ParsedSheetGame[]> {
    const sheetName = `${leagueSlug}_games`
    const raw = await fetchSheet<RawSheetRow>(sheetName)
    return raw.map((row) => ({
      game_id: row.game_id || '',
      tournament_id: parseNumber(row.tournament_id),
      game_date: parseDate(row.game_date),
      game_day: row.game_day || '',
      total_players: parseNumber(row.total_players),
      locked_by: row.locked_by || '',
      locked_at: parseDate(row.locked_at),
    }))
  },

  /**
   * Fetch player results for a specific league
   */
  async getPlayerResults(leagueSlug: string): Promise<ParsedSheetPlayerResult[]> {
    const sheetName = `${leagueSlug}_player_results`
    const raw = await fetchSheet<RawSheetRow>(sheetName)
    return raw.map((row) => ({
      game_id: row.game_id || '',
      player_id: parseNumber(row.player_id),
      username: row.username || '',
      team_slug_at_game: row.team_slug_at_game || null,
      finish_position: parseNumber(row.finish_position),
      points_earned: parseNumber(row.points_earned),
    }))
  },

  /**
   * Get player results for a specific game
   */
  async getGameResults(leagueSlug: string, gameId: string): Promise<ParsedSheetPlayerResult[]> {
    const allResults = await this.getPlayerResults(leagueSlug)
    return allResults.filter((result) => result.game_id === gameId)
  },

  /**
   * Get games for a specific month
   */
  async getMonthlyGames(leagueSlug: string, year: number, month: number): Promise<ParsedSheetGame[]> {
    const allGames = await this.getGames(leagueSlug)
    return allGames.filter((game) => {
      const gameDate = game.game_date
      return gameDate.getFullYear() === year && gameDate.getMonth() === month
    })
  },
}

export default sheetsClient
