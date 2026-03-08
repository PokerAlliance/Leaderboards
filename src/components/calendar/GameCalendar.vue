<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns'
import BaseCard from '@/components/common/BaseCard.vue'
import LiveBadge from '@/components/scoreboard/LiveBadge.vue'
import type { ParsedTournament } from '@/composables/useLeague'
import type { LeagueSlug } from '@/types'

interface Props {
  upcoming: ParsedTournament[]
  recent: ParsedTournament[]
  live?: ParsedTournament | null
  leagueSlug: LeagueSlug
  maxUpcoming?: number
  maxRecent?: number
}

const props = withDefaults(defineProps<Props>(), {
  live: null,
  maxUpcoming: 5,
  maxRecent: 5,
})

const upcomingGames = computed(() => props.upcoming.slice(0, props.maxUpcoming))
const recentGames = computed(() => props.recent.slice(0, props.maxRecent))

function formatGameDate(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

function formatGameTime(date: Date): string {
  return format(date, 'h:mm a')
}

function formatLiveTime(date: Date): string {
  return `Started ${formatDistanceToNow(date, { addSuffix: true })}`
}
</script>

<template>
  <BaseCard variant="glass" padding="lg" class="game-calendar">
    <template #header>
      <h2 class="game-calendar__title">Game Schedule</h2>
    </template>

    <div class="game-calendar__content">
      <section v-if="live" class="game-calendar__section game-calendar__section--live">
        <div class="game-calendar__section-header">
          <LiveBadge size="sm" />
          <span class="game-calendar__section-title">Live Now</span>
        </div>

        <RouterLink
          :to="`/game/${live.id}`"
          class="game-calendar__live-game"
        >
          <div class="game-calendar__live-info">
            <span class="game-calendar__live-name">{{ live.name }}</span>
            <span class="game-calendar__live-meta">
              {{ formatLiveTime(live.startTime) }} • {{ live.registeredPlayers }} players
            </span>
          </div>
          <span class="game-calendar__live-action">Watch Live →</span>
        </RouterLink>
      </section>

      <section v-if="upcomingGames.length > 0" class="game-calendar__section">
        <div class="game-calendar__section-header">
          <span class="game-calendar__section-icon">📅</span>
          <span class="game-calendar__section-title">Upcoming</span>
        </div>

        <div class="game-calendar__list">
          <div
            v-for="game in upcomingGames"
            :key="game.id"
            class="game-calendar__item"
          >
            <div class="game-calendar__item-date">
              <span class="game-calendar__date-day">{{ formatGameDate(game.startTime) }}</span>
              <span class="game-calendar__date-time">{{ formatGameTime(game.startTime) }} EST</span>
            </div>
            <div class="game-calendar__item-info">
              <span class="game-calendar__item-name">{{ game.name }}</span>
              <span
                v-if="game.state === 'registering'"
                class="game-calendar__item-status game-calendar__item-status--open"
              >
                Registration Open
              </span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="recentGames.length > 0" class="game-calendar__section">
        <div class="game-calendar__section-header">
          <span class="game-calendar__section-icon">✓</span>
          <span class="game-calendar__section-title">Recent Results</span>
        </div>

        <div class="game-calendar__list">
          <RouterLink
            v-for="game in recentGames"
            :key="game.id"
            :to="`/game/${game.id}`"
            class="game-calendar__item game-calendar__item--clickable"
          >
            <div class="game-calendar__item-date">
              <span class="game-calendar__date-day">{{ formatGameDate(game.startTime) }}</span>
            </div>
            <div class="game-calendar__item-info">
              <span class="game-calendar__item-name">{{ game.name }}</span>
            </div>
            <span class="game-calendar__item-arrow">View →</span>
          </RouterLink>
        </div>
      </section>

      <div
        v-if="!live && upcomingGames.length === 0 && recentGames.length === 0"
        class="game-calendar__empty"
      >
        <p>No scheduled games at this time.</p>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.game-calendar__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.game-calendar__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.game-calendar__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.game-calendar__section--live {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.game-calendar__section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.game-calendar__section-icon {
  font-size: var(--text-base);
}

.game-calendar__section-title {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.game-calendar__live-game {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--transition-base);
}

.game-calendar__live-game:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

.game-calendar__live-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.game-calendar__live-name {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.game-calendar__live-meta {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.game-calendar__live-action {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-live);
  white-space: nowrap;
}

.game-calendar__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.game-calendar__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.game-calendar__item--clickable {
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
}

.game-calendar__item--clickable:hover {
  background: var(--color-bg-card);
  border-color: rgba(212, 175, 55, 0.3);
}

.game-calendar__item-date {
  display: flex;
  flex-direction: column;
  min-width: 90px;
}

.game-calendar__date-day {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
}

.game-calendar__date-time {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.game-calendar__item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.game-calendar__item-name {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.game-calendar__item-status {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
}

.game-calendar__item-status--open {
  color: var(--color-success);
}

.game-calendar__item-arrow {
  font-size: var(--text-sm);
  color: var(--color-gold);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.game-calendar__item--clickable:hover .game-calendar__item-arrow {
  opacity: 1;
}

.game-calendar__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
</style>
