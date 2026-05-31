<script setup lang="ts">
import { computed } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getMuckersQuarterDateRange } from '@/config/muckers'

const store = useMuckersStore()

const label = computed(() => store.loadedQuarterLabel.value)
const teamCount = computed(() => store.allTeams.length)

const dateRange = computed(() => {
  const q = store.loadedQuarter.value
  if (!q) return ''
  const { start, end } = getMuckersQuarterDateRange(q)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${fmt.format(start)} \u2013 ${fmt.format(end)}`
})
</script>

<template>
  <div class="mk-sc mk-glass mk-sc--accent">
    <div class="mk-sc__icon">&#9824;</div>
    <h3 class="mk-sc__title">{{ label }} &mdash; Barnyard Muckers League</h3>
    <p class="mk-sc__meta">
      {{ teamCount }} teams &middot; 3 games per week &middot; 9-position scoring
    </p>
    <p class="mk-sc__dates">{{ dateRange }}</p>
  </div>
</template>

<style scoped>
.mk-sc {
  text-align: center;
  padding: 1.5rem 1.25rem;
}

.mk-sc--accent {
  border: 1px solid rgba(0, 180, 216, 0.15);
  box-shadow: 0 2px 20px rgba(0, 180, 216, 0.06);
}

.mk-sc__icon {
  font-size: 2rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  color: var(--color-mk-cyan, #00B4D8);
  opacity: 0.6;
}

.mk-sc__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0 0 0.35rem;
}

.mk-sc__meta {
  font-size: 0.72rem;
  color: var(--color-mk-text-muted, #64748B);
  margin: 0 0 0.25rem;
}

.mk-sc__dates {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-mk-cyan, #00B4D8);
  margin: 0;
}
</style>
