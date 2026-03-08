<script setup lang="ts">
  import { computed } from 'vue'
  import PositionBadge from './PositionBadge.vue'

  interface Player {
    id: number
    username: string
    avatar?: string
    teamId?: string | null
    teamName?: string | null
    teamSlug?: string | null
    finishPosition: number
    pointsEarned: number
    chips?: number
  }

  interface Props {
    player: Player
    showTeam?: boolean
    showChips?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showTeam: true,
    showChips: false,
  })

  const isTopThree = computed(() => props.player.finishPosition <= 3)
  const teamColorClass = computed(() =>
    props.player.teamSlug ? `player-row--team-${props.player.teamSlug}` : ''
  )

  const defaultAvatar = computed(() => {
    const initial = props.player.username.charAt(0).toUpperCase()
    return `https://ui-avatars.com/api/?name=${initial}&background=1a242f&color=f8fafc&size=40`
  })
</script>

<template>
  <div class="player-row" :class="[teamColorClass, { 'player-row--top-three': isTopThree }]">
    <div class="player-row__position">
      <PositionBadge :position="player.finishPosition" size="sm" />
    </div>

    <div class="player-row__avatar">
      <img
        :src="player.avatar || defaultAvatar"
        :alt="player.username"
        class="player-row__avatar-img"
        loading="lazy"
      />
    </div>

    <div class="player-row__info">
      <span class="player-row__username">{{ player.username }}</span>
      <span v-if="showTeam && player.teamName" class="player-row__team">
        {{ player.teamName }}
      </span>
    </div>

    <div v-if="showChips && player.chips !== undefined" class="player-row__chips">
      <span class="player-row__chips-value">{{ player.chips.toLocaleString() }}</span>
      <span class="player-row__chips-label">chips</span>
    </div>

    <div class="player-row__points">
      <span class="player-row__points-value">{{ player.pointsEarned }}</span>
      <span class="player-row__points-label">pts</span>
    </div>
  </div>
</template>

<style scoped>
  .player-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: rgba(19, 27, 35, 0.6);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .player-row:hover {
    background: rgba(26, 36, 47, 0.8);
  }

  .player-row--top-three {
    background: rgba(19, 27, 35, 0.8);
  }

  .player-row--team-pirates {
    border-left: 3px solid var(--color-dw-pirates);
  }

  .player-row--team-con {
    border-left: 3px solid var(--color-dw-cons);
  }

  .player-row--team-outlaws {
    border-left: 3px solid var(--color-dw-outlaws);
  }

  .player-row--team-renegades {
    border-left: 3px solid var(--color-dw-renegades);
  }

  .player-row__position {
    flex-shrink: 0;
    width: 40px;
  }

  .player-row__avatar {
    flex-shrink: 0;
  }

  .player-row__avatar-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-bg-elevated);
  }

  .player-row--top-three .player-row__avatar-img {
    border-color: var(--color-gold);
  }

  .player-row__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .player-row__username {
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-row__team {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .player-row__chips {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .player-row__chips-value {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .player-row__chips-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .player-row__points {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    flex-shrink: 0;
    min-width: 50px;
    justify-content: flex-end;
  }

  .player-row__points-value {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--color-gold);
  }

  .player-row__points-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  @media (max-width: 480px) {
    .player-row {
      gap: var(--space-2);
      padding: var(--space-2);
    }

    .player-row__avatar-img {
      width: 32px;
      height: 32px;
    }

    .player-row__chips {
      display: none;
    }
  }
</style>
