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
      <PlayerAvatar :src="getAvatar(row.username)" :username="row.username" :size="34" class="ms-brink__avatar" />
      <span class="ms-brink__info">
        <span class="ms-brink__name">{{ row.username }}</span>
        <span class="ms-brink__togo">
          <strong>{{ row.nextMilestone - row.gamesPlayed }}</strong> to {{ row.nextMilestone.toLocaleString('en-US') }}
        </span>
      </span>
      <span class="ms-brink__bar">
        <span class="ms-brink__fill" :style="{ width: `${Math.round(row.progress * 100)}%` }" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.ms-brink {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

/* Compact card: avatar beside name, progress bar along the bottom */
.ms-brink__card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.45rem 0.55rem;
  padding: 0.6rem 0.65rem;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
  background: var(--color-donks-ivory);
  border: 1px solid var(--color-donks-card-border);
  border-left: 3px solid var(--tier-base);
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

.ms-brink__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.ms-brink__name {
  font-weight: 700;
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-brink__togo {
  font-size: 0.7rem;
  color: var(--color-donks-text-muted);
  font-variant-numeric: tabular-nums;
}

.ms-brink__togo strong {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--color-donks-burgundy);
}

.ms-brink__bar {
  grid-column: 1 / -1;
  height: 5px;
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
</style>
