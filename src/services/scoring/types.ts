/**
 * Scoring Engine Types and Interfaces
 */

import type { LeagueSlug, PlayerGameResult, TeamGameScore } from '@/types'

export interface ScoringStrategy {
  leagueSlug: LeagueSlug
  
  /**
   * Calculate points for a player based on their finish position
   */
  calculatePlayerPoints(position: number, totalPlayers: number): number
  
  /**
   * Calculate team score from player results
   */
  calculateTeamScore(
    teamSlug: string,
    teamName: string,
    playerResults: PlayerGameResult[],
    totalPlayers: number
  ): TeamGameScore
  
  /**
   * Calculate month-end points based on team's final ranking
   */
  calculateMonthPoints(teamRank: number, totalTeams: number): number
  
  /**
   * Get the points table for display
   */
  getPointsTable(): number[]
}

export interface ScoringConfig {
  leagueSlug: LeagueSlug
  pointsTable: number[]
  monthPointsTable: number[]
  minPlayersForPoints: number
}

export abstract class BaseScoringStrategy implements ScoringStrategy {
  abstract leagueSlug: LeagueSlug
  protected abstract config: ScoringConfig

  calculatePlayerPoints(position: number, _totalPlayers: number): number {
    const { pointsTable } = this.config
    
    if (position > pointsTable.length) return 0
    if (position < 1) return 0
    
    return pointsTable[position - 1] ?? 0
  }

  calculateTeamScore(
    teamSlug: string,
    teamName: string,
    playerResults: PlayerGameResult[],
    _totalPlayers: number
  ): TeamGameScore {
    const totalPoints = playerResults.reduce((sum, r) => sum + r.pointsEarned, 0)
    
    return {
      teamSlug,
      teamName,
      totalPoints,
      playerResults: playerResults.sort((a, b) => a.finishPosition - b.finishPosition),
      rank: 0,
    }
  }

  calculateMonthPoints(teamRank: number, _totalTeams: number): number {
    const { monthPointsTable } = this.config
    
    if (teamRank < 1 || teamRank > monthPointsTable.length) return 0
    
    return monthPointsTable[teamRank - 1] ?? 0
  }

  getPointsTable(): number[] {
    return [...this.config.pointsTable]
  }
}
