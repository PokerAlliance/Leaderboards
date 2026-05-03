/**
 * Donks League Scoring Formula
 *
 * Points = (1000 × √Runners / √Position) × (1 + log₁₀(BuyIn))
 *
 * Since buy-in is always 100,000, the multiplier is constant:
 * (1 + log₁₀(100000)) = 1 + 5 = 6
 *
 * Simplified: Points = 6000 × √Runners / √Position
 *
 * This function is intentionally isolated so the formula can be
 * adjusted without touching any other code.
 */

/**
 * Calculate points for a single player finish.
 *
 * @param runners   - Total players who entered the tournament
 * @param position  - Player's finishing position (1 = winner)
 * @param buyIn     - Buy-in amount in chips (default: 100,000)
 * @returns Floating-point score (round when displaying)
 */
export function calculateDonksPoints(
  runners: number,
  position: number,
  buyIn: number = 100_000
): number {
  if (runners <= 0 || position <= 0) return 0
  return (1000 * Math.sqrt(runners) / Math.sqrt(position)) * (1 + Math.log10(buyIn))
}

/**
 * Sum the top N scores from a list (best-9 rule by default).
 *
 * @param scores - All scores earned by a player
 * @param n      - Number of top scores to count (default: 9)
 * @returns Sum of the best N scores
 */
export function calculateTopN(scores: number[], n: number = 9): number {
  if (scores.length === 0) return 0
  return [...scores]
    .sort((a, b) => b - a)
    .slice(0, n)
    .reduce((sum, score) => sum + score, 0)
}

/**
 * Determines which scores from a player's history are counted in their Top-N.
 * Returns a Set of game IDs whose score is included.
 *
 * @param gameScores - Array of { gameId, points } objects
 * @param n          - Number of top scores to count
 * @returns Set of counted game IDs
 */
export function getCountedGameIds(
  gameScores: Array<{ gameId: string; points: number }>,
  n: number = 9
): Set<string> {
  const sorted = [...gameScores].sort((a, b) => b.points - a.points)
  return new Set(sorted.slice(0, n).map((g) => g.gameId))
}
