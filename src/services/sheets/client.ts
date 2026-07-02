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
  SheetTeamScore,
  GameSavePayload,
  SaveGameResponse,
  ParsedAnarchyGame,
  ParsedAnarchyPlayerResult,
  AnarchyTeamSlug,
  LockTournamentResponse,
  LockableLeague,
  TournamentPoolEntry,
  ImportTournamentsResponse,
  MuckersQuarterOverride,
  ManageOverrideResponse,
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

function getAppScriptUrl(): string | null {
  const url = import.meta.env.VITE_APPSCRIPT_URL as string | undefined
  if (!url || url === 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
    return null
  }
  return url
}

async function postToAppScript<T>(data: Record<string, unknown>): Promise<T> {
  const baseUrl = getAppScriptUrl()
  if (!baseUrl) {
    throw new SheetsClientError('AppScript URL not configured for write operations')
  }

  // Use text/plain to avoid CORS preflight (OPTIONS request)
  // AppScript will still parse the JSON from e.postData.contents
  const response = await ofetch<T | { error: string }>(baseUrl, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'text/plain',
    },
    retry: 1,
    timeout: 60000,
  })

  if (response && typeof response === 'object' && 'error' in response && !('success' in response)) {
    throw new SheetsClientError((response as { error: string }).error)
  }

  return response as T
}

interface RawSheetRow {
  [key: string]: string | undefined
}

function parseTeamScoresFromRow(row: RawSheetRow): SheetTeamScore[] {
  const teamScoresMap = new Map<string, Partial<SheetTeamScore>>()

  for (const [key, value] of Object.entries(row)) {
    const match = key.match(/^(.+)_(score|rank|month_pts|penalty)$/)
    if (match && match[1] && match[2]) {
      const teamSlug = match[1]
      const field = match[2]

      if (!teamScoresMap.has(teamSlug)) {
        teamScoresMap.set(teamSlug, { teamSlug })
      }

      const teamScore = teamScoresMap.get(teamSlug)!
      switch (field) {
        case 'score':
          teamScore.score = parseNumber(value)
          break
        case 'rank':
          teamScore.rank = parseNumber(value)
          break
        case 'month_pts':
          teamScore.monthPts = parseNumber(value)
          break
        case 'penalty':
          teamScore.penalty = parseNumber(value)
          break
      }
    }
  }

  return Array.from(teamScoresMap.values())
    .filter((ts) => ts.teamSlug && ts.rank !== undefined && ts.rank > 0)
    .map((ts) => ({
      teamSlug: ts.teamSlug!,
      score: ts.score ?? 0,
      rank: ts.rank ?? 0,
      monthPts: ts.monthPts ?? 0,
      penalty: ts.penalty ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank)
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
      username: row.username || '',
      team_slug: row.team_slug || '',
      joined_date: parseDate(row.joined_date),
    }))
  },

  /**
   * Fetch game history for a specific league
   * Includes team scores parsed from columns like pirates_score, pirates_rank, etc.
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
      teamScores: parseTeamScoresFromRow(row),
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

  /**
   * Save game results to Google Sheets (admin only)
   * Requires valid admin key
   */
  async saveGameResults(
    leagueSlug: string,
    gameData: GameSavePayload,
    adminKey: string
  ): Promise<SaveGameResponse> {
    if (!adminKey) {
      return { success: false, error: 'Admin key is required' }
    }

    try {
      const response = await postToAppScript<SaveGameResponse>({
        action: 'save_game',
        key: adminKey,
        leagueSlug,
        gameData,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save game results',
      }
    }
  },

  /**
   * Fetch Anarchy game history
   * Uses team-agnostic structure (no team-specific columns in games sheet)
   */
  async getAnarchyGames(): Promise<ParsedAnarchyGame[]> {
    const sheetName = 'anarchy_games'
    const raw = await fetchSheet<RawSheetRow>(sheetName)
    return raw.map((row) => ({
      gameId: row.game_id || '',
      tournamentId: parseNumber(row.tournament_id),
      gameDate: parseDate(row.game_date),
      gameSlot: (row.game_slot || 'sat_7pm') as 'wed_1pm' | 'sat_7pm',
      totalPlayers: parseNumber(row.total_players),
      bountyValue: parseNumber(row.bounty_value),
      lockedBy: row.locked_by || '',
      lockedAt: parseDate(row.locked_at),
    }))
  },

  /**
   * Fetch Anarchy player results
   * Contains individual player data with bounties
   */
  async getAnarchyPlayerResults(): Promise<ParsedAnarchyPlayerResult[]> {
    const sheetName = 'anarchy_player_results'
    const raw = await fetchSheet<RawSheetRow>(sheetName)
    return raw.map((row) => {
      const teamSlug = row.team_slug || null
      return {
        gameId: row.game_id || '',
        username: row.username || '',
        teamSlug: teamSlug ? (teamSlug as AnarchyTeamSlug) : null,
        finishPosition: parseNumber(row.finish_position),
        pointsEarned: parseNumber(row.points_earned),
        bountiesCollected: parseNumber(row.bounties_collected),
        countedInTop5: parseBoolean(row.counted_in_top5),
      }
    })
  },

  /**
   * Get Anarchy player results for a specific game
   */
  async getAnarchyGameResults(gameId: string): Promise<ParsedAnarchyPlayerResult[]> {
    const allResults = await this.getAnarchyPlayerResults()
    return allResults.filter((result) => result.gameId === gameId)
  },

  /**
   * Get Anarchy games for a specific quarter
   */
  async getAnarchyQuarterlyGames(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): Promise<ParsedAnarchyGame[]> {
    const quarterMonths: Record<string, number[]> = {
      Q1: [0, 1, 2],
      Q2: [3, 4, 5],
      Q3: [6, 7, 8],
      Q4: [9, 10, 11],
    }
    const months = quarterMonths[quarter]
    
    const allGames = await this.getAnarchyGames()
    return allGames.filter((game) => {
      const gameDate = game.gameDate
      return gameDate.getFullYear() === year && months?.includes(gameDate.getMonth())
    })
  },

  /**
   * Get Anarchy games for a specific month
   */
  async getAnarchyMonthlyGames(year: number, month: number): Promise<ParsedAnarchyGame[]> {
    const allGames = await this.getAnarchyGames()
    return allGames.filter((game) => {
      const gameDate = game.gameDate
      return gameDate.getFullYear() === year && gameDate.getMonth() === month
    })
  },

  /**
   * Save Anarchy game results (admin only)
   */
  async saveAnarchyGameResults(
    gameData: {
      gameId: string
      tournamentId: number
      gameDate: string
      gameSlot: string
      totalPlayers: number
      bountyValue: number
      playerResults: Array<{
        username: string
        teamSlug: string | null
        finishPosition: number
        pointsEarned: number
        bountiesCollected: number
        countedInTop5: boolean
      }>
    },
    adminKey: string
  ): Promise<SaveGameResponse> {
    if (!adminKey) {
      return { success: false, error: 'Admin key is required' }
    }

    try {
      const response = await postToAppScript<SaveGameResponse>({
        action: 'save_anarchy_game',
        key: adminKey,
        gameData,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save Anarchy game results',
      }
    }
  },

  /**
   * Lock a tournament via the backend (admin only).
   * Fetches tournament from Replay API, resolves league metadata, and locks results.
   */
  async lockTournament(
    league: LockableLeague,
    tournamentId: number,
    adminKey: string
  ): Promise<LockTournamentResponse> {
    if (!adminKey) {
      return { success: false, error: 'Admin key is required' }
    }

    try {
      const response = await postToAppScript<LockTournamentResponse>({
        action: 'lock_tournament',
        key: adminKey,
        league,
        tournamentId,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to lock tournament',
      }
    }
  },

  /**
   * Get tournament pool entries for a league
   */
  async getTournamentPool(league: LockableLeague): Promise<TournamentPoolEntry[]> {
    const baseUrl = getAppScriptUrl()
    if (!baseUrl) {
      throw new SheetsClientError('AppScript URL not configured')
    }

    const url = `${baseUrl}?action=get_tournament_pool&league=${encodeURIComponent(league)}`
    const response = await ofetch<TournamentPoolEntry[]>(url, {
      retry: 1,
      timeout: 30000,
    })
    return response
  },

  /**
   * Import tournament IDs into the pool (admin only)
   */
  async importTournaments(
    league: LockableLeague,
    tournamentIds: number[],
    adminKey: string
  ): Promise<ImportTournamentsResponse> {
    if (!adminKey) {
      return { success: false, error: 'Admin key is required' }
    }

    try {
      const response = await postToAppScript<ImportTournamentsResponse>({
        action: 'import_tournaments',
        key: adminKey,
        league,
        tournamentIds,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import tournaments',
      }
    }
  },

  /**
   * Manage Muckers quarter overrides (add/remove/list)
   */
  async manageMuckersQuarterOverride(
    operation: 'add' | 'remove' | 'list',
    adminKey: string,
    overrideData?: Partial<MuckersQuarterOverride>
  ): Promise<ManageOverrideResponse> {
    if (!adminKey) {
      return { success: false, error: 'Admin key is required' }
    }

    try {
      const response = await postToAppScript<ManageOverrideResponse>({
        action: 'manage_muckers_quarter_override',
        key: adminKey,
        operation,
        override: overrideData || {},
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to manage quarter override',
      }
    }
  },
}

export default sheetsClient
