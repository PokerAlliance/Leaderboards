<script setup lang="ts">
  import { computed } from 'vue'
  import { RouterLink } from 'vue-router'
  import BaseCard from '@/components/common/BaseCard.vue'

  interface League {
    slug: string
    name: string
    description: string
    teamCount: number
    format: string
    nextGame?: {
      name: string
      date: string
    }
  }

  interface Props {
    league: League
  }

  const props = defineProps<Props>()

  const leagueColors: Record<string, string> = {
    dreamweaver: 'var(--color-dw-pirates)',
    tpp: 'var(--color-tpp-team1)',
    fpl: 'var(--color-fpl-mystics)',
    anarchy: 'var(--color-warning)',
  }

  const accentColor = computed(() => leagueColors[props.league.slug] || 'var(--color-gold)')
</script>

<template>
  <RouterLink :to="`/league/${league.slug}`" class="league-card-link">
    <BaseCard variant="elevated" padding="none" class="league-card">
      <div class="league-card__accent" :style="{ backgroundColor: accentColor }" />
      <div class="league-card__content">
        <div class="league-card__header">
          <h3 class="league-card__name">{{ league.name }}</h3>
          <span class="league-card__format">{{ league.format }}</span>
        </div>

        <p class="league-card__description">{{ league.description }}</p>

        <div class="league-card__meta">
          <div class="league-card__stat">
            <span class="league-card__stat-value">{{ league.teamCount }}</span>
            <span class="league-card__stat-label">Teams</span>
          </div>

          <div v-if="league.nextGame" class="league-card__next">
            <span class="league-card__next-label">Next:</span>
            <span class="league-card__next-value">{{ league.nextGame.name }}</span>
          </div>
        </div>
      </div>

      <div class="league-card__arrow">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
  .league-card-link {
    text-decoration: none;
    display: block;
  }

  .league-card {
    position: relative;
    overflow: hidden;
  }

  .league-card__accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }

  .league-card__content {
    padding: var(--space-4);
    padding-left: calc(var(--space-4) + 4px);
  }

  .league-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .league-card__name {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .league-card__format {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--color-bg-base);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  .league-card__description {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-4);
    line-height: 1.5;
  }

  .league-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .league-card__stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .league-card__stat-value {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
  }

  .league-card__stat-label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }

  .league-card__next {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .league-card__next-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .league-card__next-value {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .league-card__arrow {
    position: absolute;
    right: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    opacity: 0;
    transition: all var(--transition-fast);
  }

  .league-card:hover .league-card__arrow {
    opacity: 1;
    transform: translateY(-50%) translateX(4px);
  }
</style>
