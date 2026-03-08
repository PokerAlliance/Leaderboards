/**
 * Admin Authentication and Data Types
 */

export type AdminLeagueSlug = 'dreamweaver' | 'tpp' | 'fpl' | 'all'

export interface AuthState {
  isLoggedIn: boolean
  adminKey: string | null
  username: string | null
  leagueSlug: AdminLeagueSlug | null
}

export interface AuthResponse {
  success: boolean
  key?: string
  username?: string
  leagueSlug?: string
  error?: string
}

export interface GameSavePayload {
  gameId: string
  tournamentId: number
  gameDate: string
  gameDay: string
  totalPlayers: number
  teamScores: TeamScorePayload[]
  playerResults: PlayerResultPayload[]
}

export interface TeamScorePayload {
  teamSlug: string
  teamName: string
  totalPoints: number
  rank: number
  monthPoints: number
  penalty: number
}

export interface PlayerResultPayload {
  playerId: number
  username: string
  teamSlugAtGame: string | null
  finishPosition: number
  pointsEarned: number
}

export interface SaveGameResponse {
  success: boolean
  gameId?: string
  rowId?: number
  message?: string
  error?: string
}
