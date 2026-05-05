/**
 * Scoring Engine - Strategy Registry
 */

import type { LeagueSlug } from '@/types'
import type { ScoringStrategy } from './types'
import { dreamweaverStrategy } from './strategies/dreamweaver'
import { anarchyStrategy } from './strategies/anarchy'

const strategies: Record<LeagueSlug, ScoringStrategy> = {
  dreamweaver: dreamweaverStrategy,
  tpp: dreamweaverStrategy,
  fpl: dreamweaverStrategy,
  anarchy: anarchyStrategy,
  // Donks uses formula-based individual scoring (see src/services/scoring/strategies/donks.ts)
  // Not registered here as it doesn't conform to the team-based ScoringStrategy interface
  donks: dreamweaverStrategy,
}

export function getScoringStrategy(leagueSlug: LeagueSlug): ScoringStrategy {
  const strategy = strategies[leagueSlug]
  if (!strategy) {
    console.warn(`No scoring strategy found for league: ${leagueSlug}, using dreamweaver as fallback`)
    return dreamweaverStrategy
  }
  return strategy
}

export function getAnarchyScoringStrategy() {
  return anarchyStrategy
}

export function registerScoringStrategy(leagueSlug: LeagueSlug, strategy: ScoringStrategy): void {
  strategies[leagueSlug] = strategy
}

export { type ScoringStrategy, type ScoringConfig, BaseScoringStrategy } from './types'
export { dreamweaverStrategy, DreamweaverScoringStrategy } from './strategies/dreamweaver'
export { anarchyStrategy, AnarchyScoringStrategy, type BountyWinner } from './strategies/anarchy'
export { calculateDonksPoints, calculateTopN, getCountedGameIds } from './strategies/donks'