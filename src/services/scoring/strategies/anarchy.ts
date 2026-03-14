/**
 * Anarchy Scoring Strategy
 * 
 * Points system:
 * - Inverse position scoring: totalPlayers - finishPosition + 1
 * - Example: 40 players, 1st place = 40 - 1 + 1 = 40 points
 * 
 * Team scoring:
 * - Primary Score: Sum of TOP 5 players' points only
 * - Bounty Score: All bounties collected by team members
 * - Zero-fill if team has fewer than 5 players (disadvantage)
 * 
 * Dual leaderboards:
 * - Primary: Quarterly aggregation
 * - Bounty: Monthly aggregation
 */

import type { LeagueSlug, PlayerGameResult, TeamGameScore } from '@/types'
import type {
  AnarchyTeamSlug,
  AnarchyTeamScore,
  AnarchyPlayerResult,
  AnarchyTop5Player,
} from '@/types/anarchy'
import { BaseScoringStrategy, type ScoringConfig } from '../types'

const ANARCHY_CONFIG: ScoringConfig = {
  leagueSlug: 'anarchy',
  pointsTable: [],
  monthPointsTable: [],
  minPlayersForPoints: 0,
}

export interface BountyWinner {
  username: string
  prizes: string[]
}

export class AnarchyScoringStrategy extends BaseScoringStrategy {
  leagueSlug: LeagueSlug = 'anarchy'
  protected config = ANARCHY_CONFIG

  /**
   * Anarchy uses inverse position scoring
   * Points = totalPlayers - position + 1
   */
  calculatePlayerPoints(position: number, totalPlayers: number): number {
    if (position < 1 || position > totalPlayers) {
      return 0
    }
    return totalPlayers - position + 1
  }

  /**
   * Parse bounty count from bounty_winners array
   * Each player's chips_won / bounty_value = knockouts
   */
  extractBounties(bountyWinners: BountyWinner[] | undefined, bountyValue: number): Map<string, number> {
    const bounties = new Map<string, number>()
    
    if (!bountyWinners || bountyValue <= 0) {
      return bounties
    }
    
    for (const winner of bountyWinners) {
      if (winner.prizes && winner.prizes.length > 0) {
        const chipsStr = winner.prizes[0] ?? ''
        const chips = this.parseChips(chipsStr)
        const knockouts = Math.floor(chips / bountyValue)
        if (knockouts > 0) {
          bounties.set(winner.username, knockouts)
        }
      }
    }
    
    return bounties
  }

  /**
   * Parse chips from string like "3,105 chips" -> 3105
   */
  private parseChips(chipsStr: string): number {
    if (!chipsStr) return 0
    const cleaned = chipsStr.replace(/[^0-9]/g, '')
    return parseInt(cleaned, 10) || 0
  }

  /**
   * Calculate team score with top-5 logic for Anarchy
   * Only top 5 players count for Primary score
   * All bounties count for Bounty score
   */
  calculateTeamScore(
    teamSlug: string,
    teamName: string,
    playerResults: PlayerGameResult[],
    _totalPlayers: number
  ): TeamGameScore {
    const sortedByPoints = [...playerResults].sort((a, b) => b.pointsEarned - a.pointsEarned)
    
    const top5 = sortedByPoints.slice(0, 5)
    const totalPoints = top5.reduce((sum, r) => sum + r.pointsEarned, 0)
    
    return {
      teamSlug,
      teamName,
      totalPoints,
      playerResults: sortedByPoints,
      rank: 0,
    }
  }

  /**
   * Calculate Anarchy team scores with bounty data
   * Returns enriched AnarchyTeamScore with top5Players and bounty info
   */
  calculateAnarchyTeamScore(
    teamSlug: AnarchyTeamSlug,
    teamName: string,
    playerResults: AnarchyPlayerResult[]
  ): AnarchyTeamScore {
    const sortedByPoints = [...playerResults].sort((a, b) => b.pointsEarned - a.pointsEarned)
    
    const top5 = sortedByPoints.slice(0, 5)
    const primaryScore = top5.reduce((sum, r) => sum + r.pointsEarned, 0)
    
    const bountyScore = playerResults.reduce((sum, r) => sum + r.bountiesCollected, 0)
    
    const top5Players: AnarchyTop5Player[] = top5.map((p) => ({
      username: p.username,
      avatar: p.avatar,
      finishPosition: p.finishPosition,
      pointsEarned: p.pointsEarned,
      bounties: p.bountiesCollected,
    }))

    sortedByPoints.forEach((p, index) => {
      p.isInTop5 = index < 5
    })

    return {
      teamSlug,
      teamName,
      primaryScore,
      bountyScore,
      rank: 0,
      playerCount: playerResults.length,
      top5Players,
    }
  }

  /**
   * Anarchy doesn't use traditional month points (uses dual quarterly/monthly system)
   */
  calculateMonthPoints(_teamRank: number, _totalTeams: number): number {
    return 0
  }

  /**
   * Anarchy has no fixed points table - it's dynamic based on player count
   */
  getPointsTable(): number[] {
    return []
  }
}

export const anarchyStrategy = new AnarchyScoringStrategy()
