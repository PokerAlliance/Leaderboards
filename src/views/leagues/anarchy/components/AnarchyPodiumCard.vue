<script setup lang="ts">
/**
 * AnarchyPodiumCard Component
 * 
 * Visually striking 3D podium display for quarterly/monthly standings.
 * Shows top 3 teams with metallic gradients and team branding.
 */

import type { AnarchyTeamSlug } from '@/types/anarchy'
import { getAnarchyTeam } from '@/config/teams'
import { computed } from 'vue'

export interface PodiumStanding {
  teamSlug: AnarchyTeamSlug
  teamName: string
  value: number
  rank: number
}

interface Props {
  title: string
  standings: PodiumStanding[]
  type: 'primary' | 'bounty'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const podiumOrder = computed(() => {
  if (props.standings.length < 3) return props.standings
  const sorted = [...props.standings].sort((a, b) => a.rank - b.rank)
  // Reorder for podium display: 2nd, 1st, 3rd
  return [sorted[1], sorted[0], sorted[2]].filter(Boolean) as PodiumStanding[]
})

const getTeamLogo = (teamSlug: AnarchyTeamSlug) => {
  const team = getAnarchyTeam(teamSlug)
  return team?.logoUrl || ''
}

const getTeamColor = (teamSlug: AnarchyTeamSlug) => {
  const team = getAnarchyTeam(teamSlug)
  return team?.color || '#888888'
}

const getPodiumHeight = (rank: number) => {
  if (rank === 1) return '70px'
  if (rank === 2) return '50px'
  return '35px'
}

const getMedalGradient = (rank: number) => {
  if (rank === 1) {
    return 'linear-gradient(180deg, #ffd700 0%, #b8860b 50%, #8b6914 100%)'
  }
  if (rank === 2) {
    return 'linear-gradient(180deg, #e8e8e8 0%, #b0b0b0 50%, #808080 100%)'
  }
  return 'linear-gradient(180deg, #cd7f32 0%, #a0522d 50%, #8b4513 100%)'
}

const getMedalGlow = (rank: number) => {
  if (rank === 1) return '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)'
  if (rank === 2) return '0 0 15px rgba(192, 192, 192, 0.4), 0 0 30px rgba(192, 192, 192, 0.2)'
  return '0 0 12px rgba(205, 127, 50, 0.4), 0 0 25px rgba(205, 127, 50, 0.2)'
}

const valueLabel = computed(() => props.type === 'primary' ? 'pts' : 'KOs')
</script>

<template>
  <div class="podium-card" :class="`podium-card--${type}`">
    <div class="podium-card__header">
      <span class="podium-card__title">{{ title }}</span>
      <span class="podium-card__badge" :class="`podium-card__badge--${type}`">
        {{ type === 'primary' ? 'SEASON' : 'MONTH' }}
      </span>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="podium-card__loading">
      <div class="podium-skeleton">
        <div class="skeleton-block skeleton-2nd"></div>
        <div class="skeleton-block skeleton-1st"></div>
        <div class="skeleton-block skeleton-3rd"></div>
      </div>
      <span class="loading-text">Loading standings...</span>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="standings.length === 0" class="podium-card__empty">
      <span>No data yet</span>
    </div>
    
    <!-- Podium Display -->
    <div v-else class="podium-card__content">
      <div class="podium-stage">
        <div 
          v-for="team in podiumOrder" 
          :key="team.teamSlug"
          class="podium-position"
          :class="`podium-position--${team.rank}`"
          :style="{ 
            '--team-color': getTeamColor(team.teamSlug),
            '--podium-height': getPodiumHeight(team.rank),
            '--medal-gradient': getMedalGradient(team.rank),
            '--medal-glow': getMedalGlow(team.rank)
          }"
        >
          <!-- Team Logo with Medal Ring -->
          <div class="podium-position__avatar-wrapper">
            <div class="podium-position__medal-ring"></div>
            <img 
              :src="getTeamLogo(team.teamSlug)" 
              :alt="team.teamName"
              class="podium-position__avatar"
            />
            <span class="podium-position__rank-badge">{{ team.rank }}</span>
          </div>
          
          <!-- Podium Block -->
          <div class="podium-position__block">
            <div class="podium-position__block-face podium-position__block-front">
              <span class="podium-position__value">{{ team.value }}</span>
              <span class="podium-position__label">{{ valueLabel }}</span>
            </div>
            <div class="podium-position__block-face podium-position__block-top"></div>
          </div>
        </div>
      </div>
      
      <!-- Team Names Row -->
      <div class="podium-names">
        <span 
          v-for="team in podiumOrder" 
          :key="`name-${team.teamSlug}`"
          class="podium-names__name"
          :style="{ color: getTeamColor(team.teamSlug) }"
        >
          {{ team.teamName.split(' ')[0] }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.podium-card {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.podium-card--primary {
  border-color: rgba(34, 197, 94, 0.2);
}

.podium-card--bounty {
  border-color: rgba(239, 68, 68, 0.2);
}

.podium-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.podium-card__title {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.podium-card__badge {
  font-size: 0.55rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.podium-card__badge--primary {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.podium-card__badge--bounty {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Loading State */
.podium-card__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.podium-skeleton {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skeleton-block {
  width: 50px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px 4px 0 0;
}

.skeleton-1st { height: 60px; }
.skeleton-2nd { height: 45px; }
.skeleton-3rd { height: 32px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.loading-text {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
}

/* Empty State */
.podium-card__empty {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

/* Podium Content */
.podium-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-stage {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  padding-top: 35px;
  width: 100%;
}

.podium-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 70px;
}

.podium-position__avatar-wrapper {
  position: relative;
  margin-bottom: 6px;
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.podium-position:hover .podium-position__avatar-wrapper {
  transform: translateY(-4px);
}

.podium-position__medal-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: var(--medal-gradient);
  box-shadow: var(--medal-glow);
  z-index: 0;
}

.podium-position__avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.podium-position--1 .podium-position__avatar {
  width: 42px;
  height: 42px;
}

.podium-position--1 .podium-position__medal-ring {
  inset: -5px;
}

.podium-position__rank-badge {
  position: absolute;
  bottom: -4px;
  right: -2px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--medal-gradient);
  border-radius: 50%;
  font-size: 0.6rem;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.8);
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Podium Block - 3D Effect */
.podium-position__block {
  position: relative;
  width: 100%;
  height: var(--podium-height);
  perspective: 200px;
}

.podium-position__block-face {
  position: absolute;
  width: 100%;
}

.podium-position__block-front {
  height: 100%;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--team-color) 40%, rgba(30, 30, 30, 0.9)) 0%,
    color-mix(in srgb, var(--team-color) 25%, rgba(15, 15, 15, 0.95)) 100%
  );
  border-radius: 4px 4px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.podium-position__block-top {
  height: 8px;
  top: -8px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--team-color) 50%, rgba(60, 60, 60, 0.9)) 0%,
    color-mix(in srgb, var(--team-color) 40%, rgba(40, 40, 40, 0.9)) 100%
  );
  border-radius: 4px 4px 0 0;
  transform: rotateX(45deg);
  transform-origin: bottom;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-bottom: none;
}

.podium-position--1 .podium-position__block-front {
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 0 20px color-mix(in srgb, var(--team-color) 30%, transparent),
    0 4px 12px rgba(0, 0, 0, 0.4);
}

.podium-position__value {
  font-size: 0.9rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

.podium-position--1 .podium-position__value {
  font-size: 1rem;
}

.podium-position__label {
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 1px;
}

/* Team Names */
.podium-names {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.podium-names__name {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex: 1;
  text-align: center;
  opacity: 0.9;
}
</style>
