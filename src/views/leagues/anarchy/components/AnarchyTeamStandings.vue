<script setup lang="ts">
/**
 * AnarchyTeamStandings Component
 * 
 * Primary team standings panel (65% width) with:
 * - Team rank and score
 * - Inline top-5 player badges showing position and bounties
 */

import type { AnarchyTeamScore } from '@/types/anarchy'
import { getAnarchyTeam } from '@/config/teams'
import AnarchyPlayerBadge from './AnarchyPlayerBadge.vue'

interface Props {
  teamScores: AnarchyTeamScore[]
  title?: string
  showPlayerBadges?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'TEAM PRIMARY STANDINGS',
  showPlayerBadges: true,
})

const getTeamLogo = (teamSlug: string) => {
  const team = getAnarchyTeam(teamSlug as 'crusaders' | 'chaos' | 'harmonic')
  return team?.logoUrl || ''
}

const getTeamColor = (teamSlug: string) => {
  const team = getAnarchyTeam(teamSlug as 'crusaders' | 'chaos' | 'harmonic')
  return team?.color || '#888888'
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🏆'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}.`
}
</script>

<template>
  <div class="team-standings">
    <div class="team-standings__header">
      <h3 class="team-standings__title">{{ title }}</h3>
      <span class="team-standings__subtitle">Top 5 per team</span>
    </div>
    
    <div class="team-standings__list">
      <div 
        v-for="team in teamScores" 
        :key="team.teamSlug"
        class="team-row"
        :style="{ '--team-color': getTeamColor(team.teamSlug) }"
      >
        <div class="team-row__header">
          <span class="team-row__rank">{{ getRankIcon(team.rank) }}</span>
          <img 
            :src="getTeamLogo(team.teamSlug)" 
            :alt="team.teamName"
            class="team-row__logo"
          />
          <span class="team-row__name">{{ team.teamName.toUpperCase() }}</span>
          <span class="team-row__score">{{ team.primaryScore }} pts</span>
        </div>
        
        <div v-if="showPlayerBadges && team.top5Players.length > 0" class="team-row__players">
          <AnarchyPlayerBadge
            v-for="player in team.top5Players"
            :key="player.username"
            :player="player"
          />
        </div>
        
        <div v-else-if="showPlayerBadges" class="team-row__no-players">
          No players in this game
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.team-standings {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 20px;
}

.team-standings__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.team-standings__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.team-standings__subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.team-standings__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.team-row {
  border-radius: 10px;
  border-left: 4px solid var(--team-color, #888);
  overflow: hidden;
  position: relative;
  background: 
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--team-color) 45%, rgba(0, 0, 0, 0.6)) 0%,
      color-mix(in srgb, var(--team-color) 25%, rgba(0, 0, 0, 0.5)) 40%,
      rgba(0, 0, 0, 0.45) 80%,
      rgba(0, 0, 0, 0.5) 100%
    );
}

.team-row::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: radial-gradient(
    ellipse at 100% 50%,
    color-mix(in srgb, var(--team-color) 20%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.team-row__header {
  display: grid;
  grid-template-columns: 44px 44px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.15) 100%
  );
  position: relative;
  z-index: 1;
}

.team-row__rank {
  font-size: 1.5rem;
  text-align: center;
}

.team-row__logo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.team-row__name {
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.98);
  letter-spacing: 0.03em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.team-row__score {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-an-primary, #22c55e);
  text-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}

.team-row__players {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  position: relative;
  z-index: 1;
}

.team-row__no-players {
  padding: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.95rem;
  font-style: italic;
  position: relative;
  z-index: 1;
}
</style>
