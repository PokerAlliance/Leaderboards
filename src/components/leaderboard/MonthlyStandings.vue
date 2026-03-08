<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { format } from 'date-fns'
import BaseCard from '@/components/common/BaseCard.vue'
import { useMonthlyStandings } from '@/composables'
import type { LeagueSlug } from '@/types'

interface Props {
  leagueSlug: LeagueSlug
}

const props = defineProps<Props>()

const { standings, currentMonth, isLoading, error, load } = useMonthlyStandings(props.leagueSlug)

const monthLabel = computed(() => {
  const date = new Date(currentMonth.value.year, currentMonth.value.month)
  return format(date, 'MMMM yyyy')
})

function getRankClass(rank: number): string {
  if (rank === 1) return 'standings-row--gold'
  if (rank === 2) return 'standings-row--silver'
  if (rank === 3) return 'standings-row--bronze'
  return ''
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

onMounted(() => {
  load()
})
</script>

<template>
  <BaseCard variant="glass" padding="lg" class="monthly-standings">
    <template #header>
      <div class="monthly-standings__header">
        <h2 class="monthly-standings__title">Team Standings</h2>
        <span class="monthly-standings__month">{{ monthLabel }}</span>
      </div>
    </template>

    <div class="monthly-standings__content">
      <div v-if="isLoading" class="monthly-standings__loading">
        <p>Loading standings...</p>
      </div>

      <div v-else-if="error" class="monthly-standings__error">
        <p>Failed to load standings</p>
      </div>

      <div v-else-if="standings.length === 0" class="monthly-standings__empty">
        <p>No games played this month yet.</p>
      </div>

      <div v-else class="monthly-standings__table">
        <div class="standings-header">
          <span class="standings-header__rank">#</span>
          <span class="standings-header__team">Team</span>
          <span class="standings-header__games">GP</span>
          <span class="standings-header__points">Pts</span>
        </div>

        <div
          v-for="standing in standings"
          :key="standing.team.slug"
          class="standings-row"
          :class="getRankClass(standing.rank)"
        >
          <span class="standings-row__rank">{{ getRankIcon(standing.rank) }}</span>

          <div class="standings-row__team">
            <img
              :src="standing.team.logoUrl"
              :alt="standing.team.name"
              class="standings-row__logo"
            />
            <span class="standings-row__name">{{ standing.team.name }}</span>
          </div>

          <span class="standings-row__games">{{ standing.gamesPlayed }}</span>

          <div class="standings-row__points-cell">
            <span class="standings-row__points">{{ standing.totalGamePoints }}</span>
            <span v-if="standing.monthPoints > 0" class="standings-row__month-bonus">
              +{{ standing.monthPoints }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="standings.length > 0" class="monthly-standings__legend">
        <span class="monthly-standings__legend-item">GP = Games Played</span>
        <span class="monthly-standings__legend-item">Pts = Total Points</span>
        <span class="monthly-standings__legend-item">+N = Month Bonus</span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.monthly-standings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.monthly-standings__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.monthly-standings__month {
  font-size: var(--text-sm);
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.monthly-standings__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.monthly-standings__loading,
.monthly-standings__error,
.monthly-standings__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

.monthly-standings__error {
  color: var(--color-error);
}

.monthly-standings__table {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.standings-header {
  display: grid;
  grid-template-columns: 40px 1fr 50px 80px;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.standings-header__rank {
  text-align: center;
}

.standings-header__games,
.standings-header__points {
  text-align: right;
}

.standings-row {
  display: grid;
  grid-template-columns: 40px 1fr 50px 80px;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all var(--transition-base);
}

.standings-row:hover {
  background: var(--color-bg-card);
}

.standings-row--gold {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.standings-row--silver {
  background: rgba(168, 168, 168, 0.1);
  border-color: rgba(168, 168, 168, 0.3);
}

.standings-row--bronze {
  background: rgba(205, 127, 50, 0.1);
  border-color: rgba(205, 127, 50, 0.3);
}

.standings-row__rank {
  text-align: center;
  font-size: var(--text-lg);
}

.standings-row__team {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.standings-row__logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.standings-row__name {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.standings-row__games {
  text-align: right;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.standings-row__points-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.standings-row__points {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.standings-row--gold .standings-row__points {
  color: var(--color-gold);
}

.standings-row__month-bonus {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-success);
  background: rgba(34, 197, 94, 0.15);
  padding: var(--space-1) var(--space-1);
  border-radius: var(--radius-sm);
}

.monthly-standings__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.monthly-standings__legend-item {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .standings-header,
  .standings-row {
    grid-template-columns: 32px 1fr 40px 60px;
  }

  .standings-row__logo {
    width: 24px;
    height: 24px;
  }

  .standings-row__name {
    font-size: var(--text-sm);
  }
}
</style>
