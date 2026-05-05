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
    isActive?: boolean
    isNew?: boolean
    themeColor?: string
    nextGame?: {
      name: string
      date: string
    }
  }

  interface Props {
    league: League
    index?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    index: 0,
  })

  const leagueColors: Record<string, string> = {
    dreamweaver: 'var(--color-dw-pirates)',
    tpp: 'var(--color-tpp-team1)',
    fpl: 'var(--color-fpl-mystics)',
    anarchy: '#ef4444',
    donks: '#c9a227',
  }

  const accentColor = computed(
    () => props.league.themeColor || leagueColors[props.league.slug] || 'var(--color-gold)'
  )

  const isComingSoon = computed(() => props.league.isActive === false)
  const isNewLeague = computed(() => props.league.isNew === true)
  const animationDelay = computed(() => `${props.index * 0.1}s`)
</script>

<template>
  <component
    :is="isComingSoon ? 'div' : RouterLink"
    :to="isComingSoon ? undefined : `/league/${league.slug}`"
    class="league-card-link"
    :class="{ 'league-card-link--disabled': isComingSoon }"
    :style="{ '--animation-delay': animationDelay, '--accent-color': accentColor }"
  >
    <BaseCard
      variant="elevated"
      padding="none"
      class="league-card"
      :class="{ 'league-card--coming-soon': isComingSoon }"
    >
      <!-- Accent bar -->
      <div class="league-card__accent" :style="{ backgroundColor: accentColor }" />

      <!-- NEW badge -->
      <span v-if="isNewLeague && !isComingSoon" class="league-card__new-badge">NEW</span>

      <!-- Coming Soon overlay -->
      <div v-if="isComingSoon" class="league-card__coming-soon-overlay">
        <span class="league-card__coming-soon-text">Coming Soon</span>
      </div>

      <div class="league-card__content">
        <div class="league-card__header">
          <h3 class="league-card__name">{{ league.name }}</h3>
          <span class="league-card__format">{{ league.format }}</span>
        </div>

        <p class="league-card__description">{{ league.description }}</p>

        <div class="league-card__meta">
          <div v-if="league.teamCount > 0" class="league-card__stat">
            <span class="league-card__stat-value">{{ league.teamCount }}</span>
            <span class="league-card__stat-label">Teams</span>
          </div>

          <div v-if="league.nextGame && !isComingSoon" class="league-card__next">
            <span class="league-card__next-label">Next:</span>
            <span class="league-card__next-value">{{ league.nextGame.name }}</span>
          </div>
        </div>
      </div>

      <div v-if="!isComingSoon" class="league-card__arrow">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Glow effect for hover -->
      <div class="league-card__glow" />
    </BaseCard>
  </component>
</template>

<style scoped>
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }

  .league-card-link {
    text-decoration: none;
    display: block;
    opacity: 0;
    animation: slideInUp 0.5s ease-out forwards;
    animation-delay: var(--animation-delay, 0s);
  }

  .league-card-link--disabled {
    cursor: default;
  }

  .league-card {
    position: relative;
    overflow: hidden;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .league-card:not(.league-card--coming-soon):hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 30px color-mix(in srgb, var(--accent-color) 30%, transparent);
  }

  .league-card--coming-soon {
    opacity: 0.7;
  }

  .league-card--coming-soon .league-card__content {
    filter: blur(1px);
  }

  .league-card__accent {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    transition: width 0.3s ease;
  }

  .league-card:not(.league-card--coming-soon):hover .league-card__accent {
    width: 6px;
  }

  .league-card__new-badge {
    position: absolute;
    top: var(--space-0);
    right: var(--space-3);
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    font-size: 0.65rem;
    font-weight: var(--font-bold);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    animation: pulse 2s infinite;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  }

  .league-card__coming-soon-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(2px);
  }

  .league-card__coming-soon-text {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    background-size: 200% 100%;
    animation: shimmer 3s infinite;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .league-card__content {
    padding: var(--space-4);
    padding-left: calc(var(--space-4) + 8px);
    position: relative;
    z-index: 1;
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
    transition: color 0.3s ease;
  }

  .league-card:not(.league-card--coming-soon):hover .league-card__name {
    color: var(--accent-color);
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
    transition: transform 0.3s ease;
  }

  .league-card:not(.league-card--coming-soon):hover .league-card__stat-value {
    transform: scale(1.1);
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
    transition: all 0.3s ease;
  }

  .league-card:hover .league-card__arrow {
    opacity: 1;
    transform: translateY(-50%) translateX(4px);
    color: var(--accent-color);
  }

  .league-card__glow {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--accent-color) 10%, transparent),
      transparent 70%
    );
  }

  .league-card:not(.league-card--coming-soon):hover .league-card__glow {
    opacity: 1;
  }
</style>
