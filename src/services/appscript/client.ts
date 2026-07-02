/**
 * Google AppScript Proxy Client
 * Routes API calls through AppScript to bypass CORS restrictions
 */

import { ofetch } from 'ofetch'
import type { ApiLeagueResponse, ApiTournamentResponse } from '@/types'
import type { DonksStoreData, DonksQuarter } from '@/types/donks'
import type { MuckersStoreData, MuckersQuarter } from '@/types/muckers'

function getAppScriptUrl(): string | null {
  const url = import.meta.env.VITE_APPSCRIPT_URL as string | undefined
  if (!url || url === 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
    return null
  }
  return url
}

export function isAppScriptConfigured(): boolean {
  return getAppScriptUrl() !== null
}

async function fetchFromAppScript<T>(params: Record<string, string>): Promise<T> {
  const baseUrl = getAppScriptUrl()
  if (!baseUrl) {
    throw new Error('AppScript URL not configured. Set VITE_APPSCRIPT_URL in .env')
  }

  const searchParams = new URLSearchParams(params)
  const url = `${baseUrl}?${searchParams.toString()}`

  const response = await ofetch<T | { error: string }>(url, {
    retry: 2,
    retryDelay: 1000,
    timeout: 30000,
  })

  if (response && typeof response === 'object' && 'error' in response) {
    throw new Error((response as { error: string }).error)
  }

  return response as T
}

export const appScriptClient = {
  /**
   * Fetch league data via AppScript proxy
   */
  async getLeague(leagueId: number): Promise<ApiLeagueResponse> {
    return fetchFromAppScript<ApiLeagueResponse>({
      action: 'getLeague',
      leagueId: String(leagueId),
    })
  },

  /**
   * Fetch tournament data via AppScript proxy
   */
  async getTournament(tournamentId: number): Promise<ApiTournamentResponse> {
    return fetchFromAppScript<ApiTournamentResponse>({
      action: 'getTournament',
      tournamentId: String(tournamentId),
    })
  },

  /**
   * Fetch sheet data via AppScript proxy
   */
  async getSheet<T>(sheetName: string): Promise<T[]> {
    return fetchFromAppScript<T[]>({
      action: 'getSheet',
      sheetName,
    })
  },

  /**
   * Fetch config sheet
   */
  async getConfig<T>(): Promise<T[]> {
    return fetchFromAppScript<T[]>({
      action: 'getConfig',
    })
  },

  /**
   * Fetch team roster for a league
   */
  async getTeamRoster<T>(leagueSlug: string): Promise<T[]> {
    return fetchFromAppScript<T[]>({
      action: 'getTeamRoster',
      leagueSlug,
    })
  },

  /**
   * Fetch games for a league
   */
  async getGames<T>(leagueSlug: string): Promise<T[]> {
    return fetchFromAppScript<T[]>({
      action: 'getGames',
      leagueSlug,
    })
  },

  /**
   * Fetch player results for a league
   */
  async getPlayerResults<T>(leagueSlug: string): Promise<T[]> {
    return fetchFromAppScript<T[]>({
      action: 'getPlayerResults',
      leagueSlug,
    })
  },

  /**
   * Fetch all Donks league data for a specific quarter.
   * Calls GET_DONKS_DATA on AppScript which aggregates:
   *   - Player results from donks_results_{year} sheet
   *   - Member avatars from Replay API league JSON
   *   - Recent/live tournament metadata from Replay API
   *   - Hall of Fame award history
   *   - All-time games-played counters
   */
  async getDonksData(quarter: DonksQuarter, year: number): Promise<DonksStoreData> {
    const raw = await fetchFromAppScript<{
      playerResults: Array<Record<string, unknown>>
      avatarMap: Record<string, string>
      recentTournaments: Record<string, unknown>
      hallOfFame: Array<Record<string, unknown>>
      gamesPlayedAllTime: Array<Record<string, unknown>>
      playoffConfig: Record<string, unknown> | null
    }>({
      action: 'GET_DONKS_DATA',
      quarter,
      year: String(year),
    })

    const playerResults = (raw.playerResults ?? []).map((r) => ({
      gameId: String(r.game_id ?? ''),
      gameDate: new Date(String(r.game_date ?? '')),
      cupSlug: String(r.cup_slug ?? '') as import('@/types/donks').DonksCupSlug,
      tournamentId: Number(r.tournament_id ?? 0),
      totalPlayers: Number(r.total_players ?? 0),
      username: String(r.username ?? ''),
      finishPosition: Number(r.finish_position ?? 0),
      pointsEarned: Number(r.points_earned ?? 0),
      lockedBy: String(r.locked_by ?? ''),
      lockedAt: new Date(String(r.locked_at ?? '')),
    }))

    const hallOfFame = (raw.hallOfFame ?? []).map((r) => ({
      username: String(r.username ?? ''),
      goldenCrowns: Number(r.golden_crowns ?? 0),
      silverCrowns: Number(r.silver_crowns ?? 0),
      bronzeCrowns: Number(r.bronze_crowns ?? 0),
      annualChampionship: Number(r.annual_championship ?? 0),
      tournamentOfChampions: Number(r.tournament_of_champions ?? 0),
      allDonksInPlayoffs: Number(r.all_donks_in_playoffs ?? 0),
      omaha: Number(r.omaha ?? 0),
    }))

    const gamesPlayedAllTime = (raw.gamesPlayedAllTime ?? []).map((r) => ({
      username: String(r.username ?? ''),
      allTimeGamesPlayed: Number(r.all_time_games_played ?? 0),
    }))

    const playoffConfig = raw.playoffConfig ? {
      qualifiersPerCup: Number(raw.playoffConfig.qualifiers_per_cup ?? 15),
      omahaWildCards: Number(raw.playoffConfig.omaha_wild_cards ?? 3),
      topNScores: Number(raw.playoffConfig.top_n_scores ?? 2),
      playoffGames: Number(raw.playoffConfig.playoff_games ?? 4),
    } : null

    return {
      playerResults,
      avatarMap: raw.avatarMap ?? {},
      recentTournaments: (raw.recentTournaments ?? {}) as DonksStoreData['recentTournaments'],
      hallOfFame,
      gamesPlayedAllTime,
      playoffConfig,
    }
  },

  /**
   * Fetch all Muckers league data for a specific quarter.
   * Calls GET_MUCKERS_DATA on AppScript which aggregates:
   *   - Game summaries from muckers_games sheet
   *   - Player results from muckers_player_results sheet
   *   - Team roster from muckers_teams sheet
   *   - Member avatars from Replay API league JSON
   */
  async getMuckersData(quarter: MuckersQuarter, year: number): Promise<MuckersStoreData> {
    const raw = await fetchFromAppScript<{
      games: Array<Record<string, unknown>>
      playerResults: Array<Record<string, unknown>>
      teams: Array<Record<string, unknown>>
      avatarMap: Record<string, string>
      quarterOverrides?: Array<Record<string, unknown>>
    }>({
      action: 'GET_MUCKERS_DATA',
      quarter,
      year: String(year),
    })

    const games = (raw.games ?? []).map((r) => {
      const gameId = String(r.game_id ?? '')
      const idParts = gameId.split('_')
      const [y, m, d] = [Number(idParts[0]), Number(idParts[1]), Number(idParts[2])]
      const gameDate = (!isNaN(y) && !isNaN(m) && !isNaN(d))
        ? new Date(y, m - 1, d)
        : new Date(String(r.game_date ?? ''))
      const game: import('@/types/muckers').MuckersGame = {
        gameId,
        tournamentId: Number(r.tournament_id ?? 0),
        gameDate,
        gameSlot: String(r.game_slot ?? '') as import('@/types/muckers').MuckersPrimarySlot,
        totalPlayers: Number(r.total_players ?? 0),
        lockedBy: String(r.locked_by ?? ''),
        lockedAt: new Date(String(r.locked_at ?? '')),
      }
      if (r._override_reason) game.overrideReason = String(r._override_reason)
      return game
    })

    const playerResults = (raw.playerResults ?? []).map((r) => ({
      gameId: String(r.game_id ?? ''),
      username: String(r.username ?? ''),
      teamSlug: String(r.team_slug ?? '') as import('@/types/muckers').MuckersTeamSlug,
      finishPosition: Number(r.finish_position ?? 0),
      pointsEarned: Number(r.points_earned ?? 0),
      gameSlot: String(r.game_slot ?? '') as import('@/types/muckers').MuckersPrimarySlot,
    }))

    const teams = (raw.teams ?? []).map((r) => ({
      username: String(r.username ?? ''),
      teamSlug: String(r.team_slug ?? '') as import('@/types/muckers').MuckersTeamSlug,
      isCaptain: Boolean(r.is_captain),
      isActive: Boolean(r.is_active),
    }))

    const quarterOverrides = (raw.quarterOverrides ?? []).map((r) => ({
      game_date: String(r.game_date ?? ''),
      slot: String(r.slot ?? ''),
      target_quarter: String(r.target_quarter ?? ''),
      target_year: Number(r.target_year ?? 0),
      reason: String(r.reason ?? ''),
    }))

    return {
      games,
      playerResults,
      teams,
      avatarMap: raw.avatarMap ?? {},
      quarterOverrides,
    }
  },
}

export default appScriptClient
