/**
 * Scoring Engine - Strategy Registry
 */

import type { LeagueSlug } from '@/types'
import type { ScoringStrategy } from './types'
import { dreamweaverStrategy } from './strategies/dreamweaver'

const strategies: Record<LeagueSlug, ScoringStrategy> = {
  dreamweaver: dreamweaverStrategy,
  tpp: dreamweaverStrategy,
  fpl: dreamweaverStrategy,
}

export function getScoringStrategy(leagueSlug: LeagueSlug): ScoringStrategy {
  const strategy = strategies[leagueSlug]
  if (!strategy) {
    console.warn(`No scoring strategy found for league: ${leagueSlug}, using dreamweaver as fallback`)
    return dreamweaverStrategy
  }
  return strategy
}

export function registerScoringStrategy(leagueSlug: LeagueSlug, strategy: ScoringStrategy): void {
  strategies[leagueSlug] = strategy
}

export { type ScoringStrategy, type ScoringConfig, BaseScoringStrategy } from './types'
export { dreamweaverStrategy, DreamweaverScoringStrategy } from './strategies/dreamweaver'
