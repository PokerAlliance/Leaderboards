/**
 * Muckers League Scoring
 *
 * Position-based points from a configurable lookup table.
 * Unlike Donks (formula) or Anarchy (inverse position),
 * Muckers uses a fixed table: 1st=25, 2nd=18, 3rd=16, etc.
 */

import { MUCKERS_POINTS_TABLE } from '@/config/muckers'

export function getMuckersPoints(position: number): number {
  return MUCKERS_POINTS_TABLE[position] ?? 0
}
