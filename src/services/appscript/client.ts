/**
 * Google AppScript Proxy Client
 * Routes API calls through AppScript to bypass CORS restrictions
 */

import { ofetch } from 'ofetch'
import type { ApiLeagueResponse, ApiTournamentResponse } from '@/types'
import type { DonksStoreData, DonksQuarter } from '@/types/donks'

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
   */
  async getDonksData(quarter: DonksQuarter, year: number): Promise<DonksStoreData> {
    const raw = await fetchFromAppScript<{
      playerResults: Array<Record<string, unknown>>
      avatarMap: Record<string, string>
      recentTournaments: Record<string, unknown>
    }>({
      action: 'GET_DONKS_DATA',
      quarter,
      year: String(year),
    })

    // Normalise playerResults: coerce strings to proper types
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

    return {
      playerResults,
      avatarMap: raw.avatarMap ?? {},
      recentTournaments: (raw.recentTournaments ?? {}) as DonksStoreData['recentTournaments'],
    }
  },
}

export default appScriptClient
