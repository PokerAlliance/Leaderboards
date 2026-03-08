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

const pointsTable = computed(() => {
  if (props.leagueSlug === 'dreamweaver') {
    return [
      { position: '1st', points: 21 },
      { position: '2nd', points: 18 },
      { position: '3rd', points: 16 },
      { position: '4th', points: 15 },
      { position: '5th', points: 14 },
      { position: '6th', points: 13 },
      { position: '7th', points: 12 },
      { position: '8th', points: 11 },
      { position: '9th', points: 10 },
      { position: '10th', points: 9 },
      { position: '11th', points: 8 },
      { position: '12th', points: 7 },
      { position: '13th', points: 6 },
      { position: '14th', points: 5 },
      { position: '15th', points: 4 },
      { position: '16th', points: 3 },
      { position: '17th', points: 2 },
      { position: '18th', points: 1 },
    ]
  }
  return []
})

const monthPoints = computed(() => {
  if (props.leagueSlug === 'dreamweaver') {
    return [
      { position: '1st', points: 4 },
      { position: '2nd', points: 3 },
      { position: '3rd', points: 2 },
      { position: '4th', points: 1 },
    ]
  }
  return []
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
        <p class="league-rules__note">Games start at 9:30 PM EST</p>
      </section>

      <section class="league-rules__section">
        <h3 class="league-rules__subtitle">Player Points</h3>
        <p class="league-rules__description">
          Points are awarded to the top 18 finishers in each game. Team scores are the sum of all team members' points.
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

      <section class="league-rules__section">
        <h3 class="league-rules__subtitle">Month-End Bonus</h3>
        <p class="league-rules__description">
          At the end of each month, teams receive bonus points based on their final standings.
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
