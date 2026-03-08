/**
 * ReplayPoker API Client
 * Uses AppScript proxy when configured to bypass CORS
 */

import { ofetch, type FetchOptions } from 'ofetch'
import { ApiTournamentResponseSchema, ApiLeagueResponseSchema } from './schemas'
import { appScriptClient, isAppScriptConfigured } from '@/services/appscript'
import type { ApiTournamentResponse, ApiLeagueResponse } from '@/types'

const BASE_URL = 'https://www.casino.org/replaypoker'

const defaultOptions: FetchOptions = {
  retry: 2,
  retryDelay: 1000,
  timeout: 15000,
}

export class ReplayApiError extends Error {
  statusCode?: number
  endpoint?: string

  constructor(message: string, statusCode?: number, endpoint?: string) {
    super(message)
    this.name = 'ReplayApiError'
    this.statusCode = statusCode
    this.endpoint = endpoint
  }
}

async function fetchWithValidation<T>(
  url: string,
  schema: { parse: (data: unknown) => T },
  options?: FetchOptions
): Promise<T> {
  try {
    const response = await ofetch(url, { ...defaultOptions, ...options })
    return schema.parse(response)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('API response validation failed:', error)
      throw new ReplayApiError(`Invalid API response format from ${url}`, undefined, url)
    }
    throw error
  }
}

export const replayApi = {
  /**
   * Fetch a league by ID
   */
  async getLeague(leagueId: number): Promise<ApiLeagueResponse> {
    if (isAppScriptConfigured()) {
      const response = await appScriptClient.getLeague(leagueId)
      return ApiLeagueResponseSchema.parse(response)
    }
    
    const url = `${BASE_URL}/leagues/${leagueId}.json`
    return fetchWithValidation(url, ApiLeagueResponseSchema)
  },

  /**
   * Fetch a tournament by ID
   */
  async getTournament(tournamentId: number): Promise<ApiTournamentResponse> {
    if (isAppScriptConfigured()) {
      const response = await appScriptClient.getTournament(tournamentId)
      return ApiTournamentResponseSchema.parse(response)
    }
    
    const url = `${BASE_URL}/tournaments/${tournamentId}.json`
    return fetchWithValidation(url, ApiTournamentResponseSchema)
  },

  /**
   * Fetch a tournament without validation (faster, for known-good sources)
   */
  async getTournamentRaw(tournamentId: number): Promise<ApiTournamentResponse> {
    if (isAppScriptConfigured()) {
      return appScriptClient.getTournament(tournamentId)
    }
    const url = `${BASE_URL}/tournaments/${tournamentId}.json`
    return ofetch<ApiTournamentResponse>(url, { ...defaultOptions, responseType: 'json' })
  },

  /**
   * Fetch a league without validation (faster, for known-good sources)
   */
  async getLeagueRaw(leagueId: number): Promise<ApiLeagueResponse> {
    if (isAppScriptConfigured()) {
      return appScriptClient.getLeague(leagueId)
    }
    const url = `${BASE_URL}/leagues/${leagueId}.json`
    return ofetch<ApiLeagueResponse>(url, { ...defaultOptions, responseType: 'json' })
  },
}

export default replayApi
