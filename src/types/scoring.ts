/**
 * Scoring Engine Types
 */

import type { LeagueSlug } from './team'

export interface PlayerGameResult {
  playerId: number
  username: string
  teamSlug: string | null
  teamName: string | null
  finishPosition: number
  pointsEarned: number
}

export interface TeamGameScore {
  teamSlug: string
  teamName: string
  totalPoints: number
  playerResults: PlayerGameResult[]
  rank: number
}

export interface GameResult {
  gameId: string
  tournamentId: number
  gameDate: Date
  gameDay: string
  totalPlayers: number
  playerResults: PlayerGameResult[]
  teamScores: TeamGameScore[]
  unassignedPlayers: PlayerGameResult[]
}

export interface MonthlyTeamScore {
  teamSlug: string
  teamName: string
  gamesPlayed: number
  totalGamePoints: number
  monthPoints: number
  rank: number
  gameResults: {
    gameId: string
    points: number
    rank: number
  }[]
}

export interface MonthlyLeaderboard {
  leagueSlug: LeagueSlug
  month: string
  year: number
  teamScores: MonthlyTeamScore[]
  totalGames: number
  gamesCompleted: number
}

export interface ScoringStrategy {
  leagueSlug: LeagueSlug
  
  calculatePlayerPoints(position: number, totalPlayers: number): number
  
  calculateTeamScore(
    teamSlug: string,
    teamName: string,
    playerResults: PlayerGameResult[],
    totalPlayers: number
  ): TeamGameScore
  
  calculateMonthPoints(teamRank: number, totalTeams: number): number
  
  getPointsTable(): number[]
}

export interface ScoringConfig {
  leagueSlug: LeagueSlug
  pointsTable: number[]
  monthPointsTable: number[]
  minPlayersForPoints: number
}
