/**
 * Dreamweaver Scoring Strategy
 * 
 * Points system:
 * - 1st place: 21 points
 * - 2nd place: 18 points
 * - 3rd place: 16 points
 * - 4th-18th: descending by 1 (15, 14, 13, ..., 1)
 * - 19th+: 0 points
 * 
 * Month-end points:
 * - 1st place team: 4 points
 * - 2nd place team: 3 points
 * - 3rd place team: 2 points
 * - 4th place team: 1 point
 */

import type { LeagueSlug } from '@/types'
import { BaseScoringStrategy, type ScoringConfig } from '../types'

const DREAMWEAVER_POINTS_TABLE = [
  21, 18, 16, 15, 14, 13, 12, 11, 10, 9,
  8, 7, 6, 5, 4, 3, 2, 1
]

const DREAMWEAVER_MONTH_POINTS = [4, 3, 2, 1]

const DREAMWEAVER_CONFIG: ScoringConfig = {
  leagueSlug: 'dreamweaver',
  pointsTable: DREAMWEAVER_POINTS_TABLE,
  monthPointsTable: DREAMWEAVER_MONTH_POINTS,
  minPlayersForPoints: 18,
}

export class DreamweaverScoringStrategy extends BaseScoringStrategy {
  leagueSlug: LeagueSlug = 'dreamweaver'
  protected config = DREAMWEAVER_CONFIG

  /**
   * Dreamweaver uses a fixed points table regardless of total players
   */
  calculatePlayerPoints(position: number, _totalPlayers: number): number {
    if (position < 1 || position > DREAMWEAVER_POINTS_TABLE.length) {
      return 0
    }
    return DREAMWEAVER_POINTS_TABLE[position - 1] ?? 0
  }
}

export const dreamweaverStrategy = new DreamweaverScoringStrategy()
