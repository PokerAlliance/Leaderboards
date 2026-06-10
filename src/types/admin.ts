/**
 * Admin Authentication and Data Types
 */

export type AdminLeagueSlug = 'dreamweaver' | 'tpp' | 'fpl' | 'anarchy' | 'donks' | 'muckers' | 'all'

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

export type LockableLeague = 'donks' | 'anarchy' | 'muckers'

export interface LockTournamentPlayerResult {
  username: string
  finishPosition: number
  pointsEarned: number
  teamSlug?: string | null
  bountiesCollected?: number
}

export interface LockTournamentTeamScore {
  teamSlug: string
  primaryScore: number
  bountyScore: number
  rank: number
  playerCount?: number
  top5?: Array<{ username: string; position: number; points: number; bounties: number }>
}

export interface LockTournamentInfo {
  id: number
  name: string
  date: string
  state: string
  totalPlayers: number
}

export interface LockTournamentResponse {
  success: boolean
  error?: string
  alreadyLocked?: boolean
  league?: LockableLeague
  tournament?: LockTournamentInfo
  gameId?: string
  cupSlug?: string | null
  cupDisplayName?: string | null
  gameSlot?: string | null
  gameSlotDisplay?: string | null
  lockedBy?: string | null
  lockedAt?: string | null
  playerResults?: LockTournamentPlayerResult[]
  teamScores?: LockTournamentTeamScore[] | null
  unidentifiedPlayers?: Array<{ username: string; position: number }>
}
