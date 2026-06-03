<script setup lang="ts">
import type { DonksCupConfig, DonksLeaderboardEntry, DonksPlayoffQualifier } from '@/types/donks'
import DonksLeaderboardTable from './DonksLeaderboardTable.vue'

withDefaults(defineProps<{
  cup: DonksCupConfig
  entries: DonksLeaderboardEntry[]
  getAvatar: (username: string) => string
  qualifiers?: DonksPlayoffQualifier[]
}>(), {
  qualifiers: () => [],
})

const emit = defineEmits<{
  'player-click': [username: string]
}>()

const dayLabels: Record<string, string> = {
  monday: 'Mon',
  wednesday: 'Wed',
  sunday: 'Sun',
}
</script>

<template>
  <div class="cup-card donks-card" :style="{ '--cup-color': cup.color }">
    <div class="cup-card__header">
      <div class="cup-card__title-row">
        <h3 class="cup-card__name">{{ cup.name }}</h3>
        <span class="cup-card__badge">
          {{ dayLabels[cup.day] || cup.day }} &middot; {{ cup.timeET }} ET
        </span>
      </div>
      <div class="cup-card__accent" />
    </div>

    <div class="cup-card__body">
      <DonksLeaderboardTable
        :entries="entries"
        :get-avatar="getAvatar"
        :limit="10"
        :compact="true"
        :qualifiers="qualifiers"
        @row-click="(user) => emit('player-click', user)"
      />
    </div>

    <div class="cup-card__footer">
      <router-link
        :to="{ name: 'donks-cup', params: { cupSlug: cup.slug } }"
        class="cup-card__link"
      >
        View Full Leaderboard &rarr;
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.cup-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 3px solid var(--cup-color, var(--color-donks-gold));
}

.cup-card__header {
  padding: 0.85rem 1rem 0.65rem;
}

.cup-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cup-card__name {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-donks-text);
  margin: 0;
  white-space: nowrap;
}

.cup-card__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2em 0.6em;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: color-mix(in srgb, var(--cup-color) 12%, transparent);
  color: var(--cup-color);
  white-space: nowrap;
}

.cup-card__accent {
  height: 1px;
  margin-top: 0.55rem;
  background: linear-gradient(
    90deg,
    var(--cup-color) 0%,
    transparent 100%
  );
  opacity: 0.55;
}

.cup-card__body {
  flex: 1;
  padding: 0 0.5rem;
  overflow-y: auto;
  max-height: 420px;
}

.cup-card__footer {
  padding: 0.6rem 1rem;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.cup-card__link {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cup-color);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.cup-card__link:hover {
  opacity: 0.75;
}
</style>
