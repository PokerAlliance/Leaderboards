/**
 * Badonks Donks League Types
 *
 * Individual play league (no teams) with 6 recurring cups,
 * 2 composite medals, and quarterly seasons.
 */

// ─── Identifiers ─────────────────────────────────────────────────────────────

export type DonksCupSlug =
  | 'badonkidonk'
  | 'puggywug'
  | 'blackwidow'
  | 'ladycon'
  | 'boyd2'
  | 'bopflop'

export type DonksCompositeSlug = 'chuckcox' | 'omaha'

export type DonksGameType = 'holdem' | 'omaha'

export type DonksQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface DonksQuarterKey {
  quarter: DonksQuarter
  year: number
}

// ─── Cup & Medal Config (used in src/config/donks.ts) ────────────────────────

export interface DonksCupConfig {
  slug: DonksCupSlug
  name: string
  shortName: string
  gameType: DonksGameType
  day: 'monday' | 'wednesday' | 'sunday'
  timeET: string          // e.g. "1:00 PM"
  color: string           // hex accent color
  compositeSlug: DonksCompositeSlug
}

export interface DonksMedalConfig {
  slug: DonksCompositeSlug
  name: string
  shortName: string
  gameType: DonksGameType
  cupSlugs: DonksCupSlug[]
  color: string
}

// ─── Sheet / API Data ─────────────────────────────────────────────────────────

/** One row from donks_results_YYYY sheet */
export interface DonksPlayerResult {
  gameId: string
  gameDate: Date
  cupSlug: DonksCupSlug
  tournamentId: number
  totalPlayers: number
  username: string
  finishPosition: number
  pointsEarned: number
  lockedBy: string
  lockedAt: Date
}

/** Derived game metadata (grouped from player results) */
export interface DonksGame {
  gameId: string
  gameDate: Date
  cupSlug: DonksCupSlug
  tournamentId: number
  totalPlayers: number
  lockedBy: string
  lockedAt: Date
}

/** A recent/live tournament entry from the Replay API */
export interface DonksRecentTournament {
  tournamentId: number
  name: string
  cupSlug: DonksCupSlug
  state: string
  startTime: string
  totalPlayers: number
  isLocked: boolean
}

// ─── Leaderboard Computation ──────────────────────────────────────────────────

/** One row in a rendered leaderboard table */
export interface DonksLeaderboardEntry {
  rank: number
  username: string
  /** Sum of best 9 scores for this leaderboard scope */
  totalPoints: number
  gamesPlayed: number
  /** Rank change since last game: positive = improved, negative = dropped, 0 = no change, null = new */
  diff: number | null
}

/** A single game record in a player's history, used in the User Modal */
export interface DonksGameHistory {
  gameId: string
  gameDate: Date
  cupSlug: DonksCupSlug
  tournamentId: number
  finishPosition: number
  totalPlayers: number
  pointsEarned: number
  /** Whether this score is counted in the player's best-9 total */
  countedInBest9: boolean
}

/** One row in a game results panel (single-game finishing order) */
export interface DonksGameResultEntry {
  username: string
  finishPosition: number
  totalPlayers: number
  pointsEarned: number
}

// ─── Store Shape ──────────────────────────────────────────────────────────────

/** The full payload returned by GET_DONKS_DATA and cached in useDonksStore */
export interface DonksStoreData {
  playerResults: DonksPlayerResult[]
  /** username → avatar URL (current, from Replay league member list) */
  avatarMap: Record<string, string>
  /** keyed by DonksCupSlug — recent/live/upcoming tournament info */
  recentTournaments: Partial<Record<DonksCupSlug, DonksRecentTournament>>
}

// ─── Lock Payload ─────────────────────────────────────────────────────────────

export interface DonksLockPlayerRow {
  username: string
  finishPosition: number
  pointsEarned: number
}

export interface DonksLockPayload {
  action: 'save_donks_game'
  key: string
  gameData: {
    gameId: string
    gameDate: string
    cupSlug: DonksCupSlug
    tournamentId: number
    totalPlayers: number
    lockedBy: string
    playerResults: DonksLockPlayerRow[]
  }
}
