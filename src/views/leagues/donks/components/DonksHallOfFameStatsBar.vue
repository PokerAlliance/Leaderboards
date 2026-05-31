<script setup lang="ts">
import { computed } from 'vue'
import type { DonksHallOfFameEntry } from '@/types/donks'

const props = defineProps<{
  entries: DonksHallOfFameEntry[]
}>()

function totalForEntry(e: DonksHallOfFameEntry): number {
  return e.goldenCrowns + e.silverCrowns + e.bronzeCrowns
    + e.annualChampionship + e.tournamentOfChampions
    + e.allDonksInPlayoffs + e.omaha
}

const totalInductees = computed(() => props.entries.length)

const totalAwards = computed(() =>
  props.entries.reduce((sum, e) => sum + totalForEntry(e), 0)
)

const mostDecorated = computed(() => {
  if (props.entries.length === 0) return null
  let best = props.entries[0]!
  let bestCount = totalForEntry(best)
  for (const e of props.entries) {
    const count = totalForEntry(e)
    if (count > bestCount) {
      best = e
      bestCount = count
    }
  }
  return { username: best.username, count: bestCount }
})
</script>

<template>
  <div v-if="entries.length > 0" class="hof-stats">
    <div class="hof-stats__item">
      <span class="hof-stats__value">{{ totalInductees }}</span>
      <span class="hof-stats__label">Players Inducted</span>
    </div>
    <span class="hof-stats__sep">&middot;</span>
    <div class="hof-stats__item">
      <span class="hof-stats__value">{{ totalAwards.toLocaleString() }}</span>
      <span class="hof-stats__label">Total Awards</span>
    </div>
    <span class="hof-stats__sep">&middot;</span>
    <div v-if="mostDecorated" class="hof-stats__item">
      <span class="hof-stats__value">{{ mostDecorated.username }}</span>
      <span class="hof-stats__label">Most Decorated ({{ mostDecorated.count }})</span>
    </div>
  </div>
</template>

<style scoped>
.hof-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid var(--color-donks-card-border, rgba(201, 162, 39, 0.2));
  margin-top: 0.75rem;
}

.hof-stats__item {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.hof-stats__value {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-donks-text);
}

.hof-stats__label {
  font-size: 0.68rem;
  color: var(--color-donks-text-muted);
  font-weight: 500;
}

.hof-stats__sep {
  color: var(--color-donks-text-muted);
  font-size: 0.75rem;
  opacity: 0.5;
}
</style>
