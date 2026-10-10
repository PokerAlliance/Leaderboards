<script setup lang="ts">
import type { DonksGamesPlayedRow } from '@/types/donks'
import { getMilestoneTier } from '@/config/donks'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'

defineProps<{
  rows: DonksGamesPlayedRow[]
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  select: [username: string]
}>()

function tierStyle(row: DonksGamesPlayedRow) {
  const t = getMilestoneTier(row.nextMilestone)
  return {
    '--tier-light': t.colors.light,
    '--tier-base': t.colors.base,
    '--tier-dark': t.colors.dark,
  }
}
</script>

<template>
  <div class="ms-brink">
    <button
      v-for="row in rows"
      :key="row.username"
      type="button"
      class="ms-brink__card"
      :style="tierStyle(row)"
      @click="emit('select', row.username)"
    >
      <PlayerAvatar :src="getAvatar(row.username)" :username="row.username" :size="40" class="ms-brink__avatar" />
      <span class="ms-brink__name">{{ row.username }}</span>
      <span class="ms-brink__togo">
        <strong>{{ row.nextMilestone - row.gamesPlayed }}</strong> to go
      </span>
      <span class="ms-brink__bar">
        <span class="ms-brink__fill" :style="{ width: `${Math.round(row.progress * 100)}%` }" />
      </span>
      <span class="ms-brink__target">
        {{ row.gamesPlayed.toLocaleString('en-US') }} → {{ row.nextMilestone.toLocaleString('en-US') }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.ms-brink {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .ms-brink { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.ms-brink__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.9rem 0.75rem;
  font: inherit;
  cursor: pointer;
  border-radius: 12px;
  background: var(--color-donks-ivory);
  border: 1px solid var(--color-donks-card-border);
  border-top: 3px solid var(--tier-base);
  color: var(--color-donks-text);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ms-brink__card:hover,
.ms-brink__card:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--tier-base);
  outline: none;
}

.ms-brink__avatar {
  border-radius: 50%;
  border: 2px solid var(--tier-base);
}

.ms-brink__name {
  max-width: 100%;
  font-weight: 700;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-brink__togo {
  font-size: 0.75rem;
  color: var(--color-donks-text-muted);
}

.ms-brink__togo strong {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--color-donks-burgundy);
}

.ms-brink__bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.ms-brink__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--tier-dark), var(--tier-base), var(--tier-light));
}

.ms-brink__target {
  font-size: 0.66rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-donks-text-muted);
}
</style>
