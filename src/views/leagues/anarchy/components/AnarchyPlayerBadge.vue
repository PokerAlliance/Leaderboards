<script setup lang="ts">
/**
 * AnarchyPlayerBadge Component
 * 
 * Compact inline badge showing player info for top-5 standings:
 * [points] [tiny avatar] username #position xN
 */

import type { AnarchyTop5Player, AnarchyTeamSlug } from '@/types/anarchy'
import { getAnarchyTeam } from '@/config/teams'
import { computed } from 'vue'

interface Props {
  player: AnarchyTop5Player
  teamSlug?: AnarchyTeamSlug
  showPoints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPoints: false,
})

const avatarUrl = (avatar: string) => {
  if (!avatar) return '/assets/default-avatar.png'
  if (avatar.startsWith('http')) return avatar
  return `https://www.replaypoker.com${avatar}`
}

const teamColor = computed(() => {
  if (!props.teamSlug) return '#3b82f6' // Default blue
  const team = getAnarchyTeam(props.teamSlug)
  return team?.color || '#3b82f6'
})
</script>

<template>
  <div class="player-badge" :style="{ '--badge-team-color': teamColor }">
    <!-- Points prefix section -->
    <div class="player-badge__points">
      <span class="points-value">{{ player.pointsEarned }}</span>
      <span class="points-label">Pts</span>
    </div>
    
    <!-- Player info section -->
    <div class="player-badge__info">
      <img 
        :src="avatarUrl(player.avatar)" 
        :alt="player.username"
        class="player-badge__avatar"
      />
      <span class="player-badge__name">{{ player.username }}</span>
    </div>
    
    <!-- Metrics section with contrasting background -->
    <div class="player-badge__metrics">
      <span class="player-badge__position" :class="`position-${player.finishPosition}`">
        <span class="metric-icon">#</span>
        <span class="metric-value">{{ player.finishPosition }}</span>
      </span>
      
      <span class="player-badge__bounties" :class="{ 'has-bounties': player.bounties > 0 }">
        <svg class="crosshair-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
        </svg>
        <span class="metric-value">{{ player.bounties }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.player-badge {
  display: inline-flex;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50px;
  font-size: 0.85rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.player-badge:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* Points prefix section - leftmost */
.player-badge__points {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 10px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--badge-team-color, #3b82f6) 50%, rgba(0, 0, 0, 0.4)) 0%,
    color-mix(in srgb, var(--badge-team-color, #3b82f6) 35%, rgba(0, 0, 0, 0.5)) 100%
  );
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50px 0 0 50px;
  color: color-mix(in srgb, var(--badge-team-color, #3b82f6) 30%, white);
  font-weight: 700;
  font-size: 0.85rem;
}

.player-badge__points .points-value {
  color: #fff;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.player-badge__points .points-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

/* Player info section - middle */
.player-badge__info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  flex-shrink: 0;
}

.player-badge__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.player-badge__name {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  font-size: 0.85rem;
}

/* Metrics section - right side with contrasting background */
.player-badge__metrics {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(0, 0, 0, 0.6);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  border-radius: 0 50px 50px 0;
}

.player-badge__position {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  font-weight: 700;
  font-size: 0.85rem;
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-an-primary, #22c55e);
}

.player-badge__position.position-1 {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.player-badge__position.position-2 {
  background: rgba(192, 192, 192, 0.15);
  color: #c0c0c0;
}

.player-badge__position.position-3 {
  background: rgba(205, 127, 50, 0.2);
  color: #cd7f32;
}

.player-badge__position .metric-icon {
  font-size: 0.75rem;
  opacity: 0.8;
}

.player-badge__position .metric-value {
  font-weight: 700;
}

.player-badge__bounties {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 10px 6px 8px;
  font-size: 0.85rem;
  background: rgba(239, 68, 68, 0.1);
  color: rgba(255, 255, 255, 0.45);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0 50px 50px 0;
}

.player-badge__bounties.has-bounties {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-an-bounty, #ef4444);
}

.player-badge__bounties .metric-value {
  font-weight: 700;
}

.crosshair-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
