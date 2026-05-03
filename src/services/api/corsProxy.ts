/**
 * CORSProxy Service — Tiered Replay API access
 *
 * Tier 1: corsproxy.io (fast, free for github.io domains)
 * Tier 2: AppScript proxy (fallback when corsproxy limits are reached)
 *
 * Used exclusively by the Donks module. Existing replay.ts is unchanged.
 */

import { ofetch } from 'ofetch'
import { appScriptClient, isAppScriptConfigured } from '@/services/appscript'

const CORS_PROXY_BASE = 'https://corsproxy.io/'

function getCorsProxyToken(): string | null {
  const token = import.meta.env.VITE_CORSPROXY_TOKEN as string | undefined
  if (!token || token.trim() === '') return null
  return token
}

function buildCorsProxyUrl(targetUrl: string): string {
  const token = getCorsProxyToken()
  if (token) {
    return `${CORS_PROXY_BASE}?${token}&url=${encodeURIComponent(targetUrl)}`
  }
  // Tokenless corsproxy.io still works for public URLs (lower rate limit)
  return `${CORS_PROXY_BASE}?url=${encodeURIComponent(targetUrl)}`
}

/**
 * Fetch any Replay API endpoint through the tiered proxy strategy.
 *
 * @param endpoint - Full URL of the Replay API resource
 * @returns Parsed JSON response
 */
export async function fetchReplayWithProxy<T>(endpoint: string): Promise<T> {
  // Tier 1: corsproxy.io
  const proxyUrl = buildCorsProxyUrl(endpoint)
  try {
    return await ofetch<T>(proxyUrl, {
      timeout: 12000,
      retry: 1,
    })
  } catch (corsError) {
    // Tier 2: AppScript fallback (slower, but always available if configured)
    if (isAppScriptConfigured()) {
      console.warn('[corsProxy] corsproxy.io failed, falling back to AppScript:', corsError)

      // AppScript can proxy league and tournament endpoints
      if (endpoint.includes('/leagues/')) {
        const leagueId = endpoint.match(/\/leagues\/(\d+)/)?.[1]
        if (leagueId) {
          return appScriptClient.getLeague(parseInt(leagueId)) as Promise<T>
        }
      }
      if (endpoint.includes('/tournaments/')) {
        const tournamentId = endpoint.match(/\/tournaments\/(\d+)/)?.[1]
        if (tournamentId) {
          return appScriptClient.getTournament(parseInt(tournamentId)) as Promise<T>
        }
      }
    }

    // Re-throw original error if no fallback available
    throw corsError
  }
}

/**
 * Fetch a Replay API league by ID.
 */
export function fetchLeagueWithProxy<T>(leagueId: number): Promise<T> {
  const base = import.meta.env.VITE_REPLAY_API_BASE as string
  return fetchReplayWithProxy<T>(`${base}/leagues/${leagueId}.json`)
}

/**
 * Fetch a Replay API tournament by ID.
 */
export function fetchTournamentWithProxy<T>(tournamentId: number): Promise<T> {
  const base = import.meta.env.VITE_REPLAY_API_BASE as string
  return fetchReplayWithProxy<T>(`${base}/tournaments/${tournamentId}.json`)
}
