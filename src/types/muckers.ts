/**
 * Barnyard Muckers League Types
 *
 * Team-based SNG league with quarterly seasons.
 * Up to 9 teams, 3 weekly games (A/B/D), position-based scoring.
 */

// ─── Identifiers ─────────────────────────────────────────────────────────────

export type MuckersTeamSlug =
  | 'maniac_muckers'
  | 'moosicians'
  | 'barnstormers'
  | 'final_straw'
  | 'desperados'
  | 'shameless'
  | 'mucker_luckers'
  | 'howlers'
  | 'cobra_chickens'

export type MuckersGameSlot = 'A' | 'B' | 'C' | 'D' | 'A2' | 'B2' | 'C2' | 'D2'

export type MuckersPrimarySlot = 'A' | 'B' | 'C' | 'D'

export type MuckersQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface MuckersQuarterKey {
  quarter: MuckersQuarter
  year: number
}

// ─── Schedule Config ─────────────────────────────────────────────────────────

export interface MuckersSlotConfig {
  slot: MuckersPrimarySlot
  dayOfWeek: number
  dayLabel: string
  timeEST: string
}

// ─── Sheet / API Data ────────────────────────────────────────────────────────

/** One row from muckers_games sheet */
export interface MuckersGame {
  gameId: string
  tournamentId: number
  gameDate: Date
  gameSlot: MuckersPrimarySlot
  totalPlayers: number
  lockedBy: string
  lockedAt: Date
  /** Present when this game was included via a quarter override (makeup game) */
  overrideReason?: string
}

/** One row from muckers_player_results sheet */
export interface MuckersPlayerResult {
  gameId: string
  username: string
  teamSlug: MuckersTeamSlug
  finishPosition: number
  pointsEarned: number
  gameSlot: MuckersPrimarySlot
}

/** One row from muckers_teams sheet */
export interface MuckersTeamRoster {
  username: string
  teamSlug: MuckersTeamSlug
  isCaptain: boolean
  isActive: boolean
}

// ─── Computed / Display Data ─────────────────────────────────────────────────

/** Breakdown of a team's games within a single week */
export interface MuckersWeekData {
  weekNumber: number
  weekStartDate: Date
  totalPoints: number
  games: {
    slot: MuckersPrimarySlot
    playerUsername: string
    finishPosition: number
    totalPlayers: number
    pointsEarned: number
  }[]
}

/** One row in the team leaderboard */
export interface MuckersTeamStanding {
  teamSlug: MuckersTeamSlug
  teamName: string
  rank: number
  totalPoints: number
  averagePerWeek: number
  weeksPlayed: number
  weeklyScores: MuckersWeekData[]
  rankDiff: number | null
}

/** One row in the individual player leaderboard */
export interface MuckersPlayerStanding {
  username: string
  teamSlug: MuckersTeamSlug
  teamName: string
  rank: number
  totalPoints: number
  gamesPlayed: number
  averagePerGame: number
  weeklyScores: Record<number, MuckersPlayerWeekScore>
}

/** A player's score for a single week */
export interface MuckersPlayerWeekScore {
  weekNumber: number
  gameSlot: MuckersPrimarySlot
  finishPosition: number
  totalPlayers: number
  pointsEarned: number
}

/** Full detail for a single week (used in week detail modal) */
export interface MuckersWeekDetail {
  weekNumber: number
  weekStartDate: Date
  tables: {
    slot: MuckersPrimarySlot
    results: {
      username: string
      teamSlug: MuckersTeamSlug
      teamName: string
      finishPosition: number
      pointsEarned: number
    }[]
  }[]
  weeklyTeamTally: {
    teamSlug: MuckersTeamSlug
    teamName: string
    weekPoints: number
    rank: number
  }[]
  bestTeam: {
    teamSlug: MuckersTeamSlug
    teamName: string
    weekPoints: number
  }
  leaderboardSnapshot: MuckersTeamStanding[]
}

/** Team detail for the team modal */
export interface MuckersTeamDetail {
  teamSlug: MuckersTeamSlug
  teamName: string
  captain: string | null
  members: {
    username: string
    totalPoints: number
    gamesPlayed: number
    averagePerGame: number
  }[]
  quarterlyTotal: number
  memberCount: number
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

/** The full payload returned by GET_MUCKERS_DATA and cached in useMuckersStore */
export interface MuckersQuarterOverrideInfo {
  game_date: string
  slot: string
  target_quarter: string
  target_year: number
  reason: string
  created_by?: string
  created_at?: string
}

export interface MuckersStoreData {
  games: MuckersGame[]
  playerResults: MuckersPlayerResult[]
  teams: MuckersTeamRoster[]
  /** username → avatar URL (current, from Replay league member list) */
  avatarMap: Record<string, string>
  /** Active quarter overrides (makeup game assignments) */
  quarterOverrides?: MuckersQuarterOverrideInfo[]
}
