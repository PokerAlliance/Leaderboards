<script setup lang="ts">
/**
 * AnarchyBountyBoard Component
 * 
 * Bounty standings panel (35% width) with:
 * - Simple team ranking by total bounties
 * - Can be used for game-level or aggregate standings
 */

import type { AnarchyTeamScore, AnarchyMonthlyBountyStanding } from '@/types/anarchy'
import { getAnarchyTeam } from '@/config/teams'

interface Props {
  teamScores?: AnarchyTeamScore[]
  monthlyStandings?: AnarchyMonthlyBountyStanding[]
  title?: string
  subtitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'BOUNTY HUNTERS',
  subtitle: '',
})

const standings = computed(() => {
  if (props.monthlyStandings && props.monthlyStandings.length > 0) {
    return props.monthlyStandings.map((s) => ({
      teamSlug: s.teamSlug,
      teamName: s.teamName,
      bountyScore: s.totalBounties,
      rank: s.rank,
    }))
  }
  
  if (props.teamScores) {
    return [...props.teamScores]
      .sort((a, b) => b.bountyScore - a.bountyScore)
      .map((team, index, arr) => {
        let rank = 1
        if (index > 0 && arr[index - 1]!.bountyScore > team.bountyScore) {
          rank = index + 1
        } else if (index > 0) {
          rank = arr.findIndex((t) => t.bountyScore === team.bountyScore) + 1
        }
        return {
          teamSlug: team.teamSlug,
          teamName: team.teamName,
          bountyScore: team.bountyScore,
          rank,
        }
      })
  }
  
  return []
})

import { computed } from 'vue'

const getTeamLogo = (teamSlug: string) => {
  const team = getAnarchyTeam(teamSlug as 'crusaders' | 'chaos' | 'harmonic')
  return team?.logoUrl || ''
}

const getTeamColor = (teamSlug: string) => {
  const team = getAnarchyTeam(teamSlug as 'crusaders' | 'chaos' | 'harmonic')
  return team?.color || '#888888'
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🎯'
  if (rank === 2) return '2.'
  if (rank === 3) return '3.'
  return `${rank}.`
}
</script>

<template>
  <div class="bounty-board">
    <div class="bounty-board__header">
      <h3 class="bounty-board__title">{{ title }}</h3>
      <span v-if="subtitle" class="bounty-board__subtitle">{{ subtitle }}</span>
    </div>
    
    <div class="bounty-board__list">
      <div 
        v-for="team in standings" 
        :key="team.teamSlug"
        class="bounty-row"
        :style="{ '--team-color': getTeamColor(team.teamSlug) }"
      >
        <span class="bounty-row__rank">{{ getRankIcon(team.rank) }}</span>
        <img 
          :src="getTeamLogo(team.teamSlug)" 
          :alt="team.teamName"
          class="bounty-row__logo"
        />
        <span class="bounty-row__name">{{ team.teamName }}</span>
        <span class="bounty-row__score">
          <svg class="crosshair-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
          {{ team.bountyScore }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bounty-board {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 16px;
}

.bounty-board__header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.bounty-board__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-an-bounty, #ef4444);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.bounty-board__subtitle {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.bounty-board__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bounty-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid var(--team-color, #888);
}

.bounty-row__rank {
  font-size: 1rem;
  min-width: 24px;
  text-align: center;
}

.bounty-row__logo {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.bounty-row__name {
  flex: 1;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.bounty-row__score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-an-bounty, #ef4444);
}

.crosshair-icon {
  width: 16px;
  height: 16px;
}
</style>
