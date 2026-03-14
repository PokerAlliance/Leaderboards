/**
 * Anarchy League Types
 * 
 * Anarchy is a bounty MTT league with:
 * - Inverse position scoring (totalPlayers - position + 1)
 * - Top 5 players per team count for Primary score
 * - All bounties count for Bounty score
 * - Dual leaderboards: Quarterly (Primary) + Monthly (Bounty)
 */

export type AnarchyTeamSlug = 'crusaders' | 'chaos' | 'harmonic'

export interface AnarchyTop5Player {
  username: string
  avatar: string
  finishPosition: number
  pointsEarned: number
  bounties: number
}

export interface AnarchyTeamScore {
  teamSlug: AnarchyTeamSlug
  teamName: string
  primaryScore: number
  bountyScore: number
  rank: number
  playerCount: number
  top5Players: AnarchyTop5Player[]
}

export interface AnarchyPlayerResult {
  username: string
  avatar: string
  teamSlug: AnarchyTeamSlug | null
  teamName: string | null
  finishPosition: number
  pointsEarned: number
  bountiesCollected: number
  isInTop5: boolean
  country?: string
}

export interface AnarchyGameResult {
  gameId: string
  tournamentId: number
  gameDate: Date
  gameSlot: 'wed_1pm' | 'sat_7pm'
  totalPlayers: number
  bountyValue: number
  teamScores: AnarchyTeamScore[]
  playerResults: AnarchyPlayerResult[]
}

export interface AnarchyQuarterlyStanding {
  teamSlug: AnarchyTeamSlug
  teamName: string
  totalPrimaryPoints: number
  gamesPlayed: number
  rank: number
}

export interface AnarchyMonthlyBountyStanding {
  teamSlug: AnarchyTeamSlug
  teamName: string
  totalBounties: number
  gamesPlayed: number
  rank: number
}

export interface AnarchySheetGame {
  game_id: string
  tournament_id: number
  game_date: string
  game_slot: string
  total_players: number
  bounty_value: number
  locked_by: string
  locked_at: string
}

export interface AnarchySheetPlayerResult {
  game_id: string
  username: string
  team_slug: string
  finish_position: number
  points_earned: number
  bounties_collected: number
  counted_in_top5: boolean
}

export interface ParsedAnarchyGame {
  gameId: string
  tournamentId: number
  gameDate: Date
  gameSlot: 'wed_1pm' | 'sat_7pm'
  totalPlayers: number
  bountyValue: number
  lockedBy: string
  lockedAt: Date
}

export interface ParsedAnarchyPlayerResult {
  gameId: string
  username: string
  teamSlug: AnarchyTeamSlug | null
  finishPosition: number
  pointsEarned: number
  bountiesCollected: number
  countedInTop5: boolean
}

export type AnarchyQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export function getCurrentQuarter(date: Date = new Date()): AnarchyQuarter {
  const month = date.getMonth()
  if (month <= 2) return 'Q1'
  if (month <= 5) return 'Q2'
  if (month <= 8) return 'Q3'
  return 'Q4'
}

export function getQuarterBounds(year: number, quarter: AnarchyQuarter): { start: Date; end: Date } {
  const quarterMonths: Record<AnarchyQuarter, { start: number; end: number }> = {
    Q1: { start: 0, end: 2 },
    Q2: { start: 3, end: 5 },
    Q3: { start: 6, end: 8 },
    Q4: { start: 9, end: 11 },
  }
  
  const { start, end } = quarterMonths[quarter]
  return {
    start: new Date(year, start, 1),
    end: new Date(year, end + 1, 0, 23, 59, 59, 999),
  }
}
