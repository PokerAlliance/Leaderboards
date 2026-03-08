<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { getLeagueConfig } from '@/config/leagues'
import type { LeagueSlug } from '@/types'

interface Props {
  leagueSlug: LeagueSlug
}

const props = defineProps<Props>()

const config = computed(() => getLeagueConfig(props.leagueSlug))

const ordinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th'
  return n + suffix
}

const pointsTable = computed(() => {
  const table = config.value.scoringRules.pointsTable
  return table.map((points, index) => ({
    position: ordinalSuffix(index + 1),
    points,
  }))
})

const monthPoints = computed(() => {
  const table = config.value.scoringRules.monthPointsTable
  return table.map((points, index) => ({
    position: ordinalSuffix(index + 1),
    points,
  }))
})

const gameDays = computed(() => {
  const dayMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  }
  return config.value.gameDays.map((day) => dayMap[day] || day)
})

const gameStartTime = computed(() => config.value.scoringRules.gameStartTime)
const rulesDescription = computed(() => config.value.scoringRules.rulesDescription)
</script>

<template>
  <BaseCard variant="glass" padding="lg" class="league-rules">
    <template #header>
      <h2 class="league-rules__title">Scoring Rules</h2>
    </template>

    <div class="league-rules__content">
      <section class="league-rules__section">
        <h3 class="league-rules__subtitle">Game Schedule</h3>
        <div class="league-rules__schedule">
          <span
            v-for="day in gameDays"
            :key="day"
            class="league-rules__day"
          >
            {{ day }}
          </span>
        </div>
        <p v-if="gameStartTime" class="league-rules__note">Games start at {{ gameStartTime }}</p>
      </section>

      <section v-if="pointsTable.length > 0" class="league-rules__section">
        <h3 class="league-rules__subtitle">Player Points</h3>
        <p v-if="rulesDescription" class="league-rules__description">
          {{ rulesDescription }}
        </p>
        <div class="league-rules__points-grid">
          <div
            v-for="entry in pointsTable"
            :key="entry.position"
            class="league-rules__point-entry"
            :class="{ 'league-rules__point-entry--top': entry.points >= 16 }"
          >
            <span class="league-rules__position">{{ entry.position }}</span>
            <span class="league-rules__points">{{ entry.points }} pts</span>
          </div>
        </div>
      </section>

      <section v-if="monthPoints.length > 0" class="league-rules__section">
        <h3 class="league-rules__subtitle">Month-End Bonus</h3>
        <p class="league-rules__description">
          At the end of each {{ config.seasonType === 'quarterly' ? 'quarter' : 'month' }}, teams receive bonus points based on their final standings.
        </p>
        <div class="league-rules__month-points">
          <div
            v-for="entry in monthPoints"
            :key="entry.position"
            class="league-rules__month-entry"
          >
            <span class="league-rules__month-position">{{ entry.position }}</span>
            <span class="league-rules__month-pts">+{{ entry.points }} pts</span>
          </div>
        </div>
      </section>
    </div>
  </BaseCard>
</template>

<style scoped>
.league-rules__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.league-rules__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.league-rules__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.league-rules__subtitle {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.league-rules__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.league-rules__schedule {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.league-rules__day {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.league-rules__note {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.league-rules__points-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-2);
}

.league-rules__point-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.league-rules__point-entry--top {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.league-rules__position {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.league-rules__points {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.league-rules__point-entry--top .league-rules__points {
  color: var(--color-gold);
}

.league-rules__month-points {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.league-rules__month-entry {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.league-rules__month-position {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.league-rules__month-pts {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-gold);
}
</style>
