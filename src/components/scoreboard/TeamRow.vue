<script setup lang="ts">
  import { computed } from 'vue'
  import PositionBadge from './PositionBadge.vue'

  interface Team {
    id: string
    name: string
    slug: string
    totalPoints: number
    monthPoints?: number
    playerCount: number
  }

  interface Props {
    team: Team
    rank: number
    showMonthPoints?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showMonthPoints: true,
  })

  const teamColorClass = computed(() => `team-row--${props.team.slug}`)
  const teamLogoClass = computed(() => `team-logo--${props.team.slug}`)
</script>

<template>
  <div class="team-row" :class="teamColorClass">
    <div class="team-row__rank">
      <PositionBadge :position="rank" />
    </div>

    <div class="team-row__logo">
      <div class="team-logo" :class="teamLogoClass" />
    </div>

    <div class="team-row__info">
      <span class="team-row__name">{{ team.name }}</span>
      <span class="team-row__players">{{ team.playerCount }} players</span>
    </div>

    <div class="team-row__score">
      <span class="team-row__points">{{ team.totalPoints }}</span>
      <span class="team-row__points-label">pts</span>
    </div>

    <div v-if="showMonthPoints && team.monthPoints !== undefined" class="team-row__month">
      <span class="team-row__month-value">+{{ team.monthPoints }}</span>
      <span class="team-row__month-label">month pts</span>
    </div>
  </div>
</template>

<style scoped>
  .team-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: rgba(19, 27, 35, 0.8);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--team-color, var(--color-gold));
    transition: all var(--transition-fast);
  }

  .team-row:hover {
    background: rgba(26, 36, 47, 0.9);
  }

  .team-row--pirates {
    --team-color: var(--color-dw-pirates);
  }

  .team-row--con {
    --team-color: var(--color-dw-cons);
  }

  .team-row--outlaws {
    --team-color: var(--color-dw-outlaws);
  }

  .team-row--renegades {
    --team-color: var(--color-dw-renegades);
  }

  .team-row__rank {
    flex-shrink: 0;
  }

  .team-row__logo {
    flex-shrink: 0;
  }

  .team-row__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .team-row__name {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .team-row__players {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .team-row__score {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  .team-row__points {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
  }

  .team-row__points-label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .team-row__month {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    min-width: 60px;
  }

  .team-row__month-value {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-success);
  }

  .team-row__month-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  @media (max-width: 640px) {
    .team-row {
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .team-row__month {
      width: 100%;
      flex-direction: row;
      justify-content: flex-end;
      gap: var(--space-1);
    }
  }
</style>
