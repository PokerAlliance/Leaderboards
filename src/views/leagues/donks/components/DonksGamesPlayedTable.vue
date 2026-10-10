<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DonksGamesPlayedRow } from '@/types/donks'
import { getMilestoneTier } from '@/config/donks'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'

const props = defineProps<{
  rows: DonksGamesPlayedRow[]
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  rowClick: [username: string]
}>()

const search = ref('')
const sortBy = ref<'games' | 'name'>('games')

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const filtered = q ? props.rows.filter((r) => r.username.toLowerCase().includes(q)) : props.rows
  return sortBy.value === 'name'
    ? [...filtered].sort((a, b) => a.username.localeCompare(b.username))
    : filtered
})

function tierStyle(milestone: number) {
  const t = getMilestoneTier(Math.max(milestone, 500))
  return {
    '--tier-light': t.colors.light,
    '--tier-base': t.colors.base,
    '--tier-dark': t.colors.dark,
  }
}

function tierLabel(milestone: number): string {
  return milestone % 1000 === 0 ? `${milestone / 1000}K` : milestone.toLocaleString('en-US')
}
</script>

<template>
  <div class="ms-table">
    <div class="ms-table__controls">
      <label class="ms-table__search">
        <i class="i-lucide-search" aria-hidden="true" />
        <input v-model="search" type="search" placeholder="Search players…" aria-label="Search players" />
      </label>
      <div class="ms-table__sort" role="group" aria-label="Sort by">
        <button type="button" :class="{ active: sortBy === 'games' }" @click="sortBy = 'games'">Most games</button>
        <button type="button" :class="{ active: sortBy === 'name' }" @click="sortBy = 'name'">A–Z</button>
      </div>
    </div>

    <div class="ms-table__head" aria-hidden="true">
      <span>#</span>
      <span>Player</span>
      <span class="ms-table__col-games">Games</span>
      <span class="ms-table__col-badge">Milestone</span>
      <span class="ms-table__col-next">Next</span>
    </div>

    <ul class="ms-table__rows">
      <li v-for="row in visibleRows" :key="row.username">
        <button type="button" class="ms-table__row" @click="emit('rowClick', row.username)">
          <span class="ms-table__rank" :class="{ 'ms-table__rank--top': row.rank <= 3 }">{{ row.rank }}</span>
          <span class="ms-table__player">
            <PlayerAvatar :src="getAvatar(row.username)" :username="row.username" :size="28" class="ms-table__avatar" />
            <span class="ms-table__name">{{ row.username }}</span>
          </span>
          <span class="ms-table__games">{{ row.gamesPlayed.toLocaleString('en-US') }}</span>
          <span class="ms-table__col-badge">
            <span v-if="row.milestone > 0" class="ms-table__badge" :style="tierStyle(row.milestone)">
              <i class="i-lucide-trophy" aria-hidden="true" /> {{ tierLabel(row.milestone) }}
            </span>
            <span v-else class="ms-table__none">—</span>
          </span>
          <span class="ms-table__col-next ms-table__next" :style="tierStyle(row.nextMilestone)">
            <span class="ms-table__bar"><span :style="{ width: `${Math.round(row.progress * 100)}%` }" /></span>
            <span class="ms-table__togo">{{ row.nextMilestone - row.gamesPlayed }} to {{ tierLabel(row.nextMilestone) }}</span>
          </span>
        </button>
      </li>
    </ul>

    <p v-if="visibleRows.length === 0" class="ms-table__empty">No players match “{{ search }}”.</p>
  </div>
</template>

<style scoped>
.ms-table__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.ms-table__search {
  flex: 1 1 220px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: var(--color-donks-ivory);
  border: 1px solid var(--color-donks-card-border);
  color: var(--color-donks-text-muted);
}

.ms-table__search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.85rem;
  color: var(--color-donks-text);
}

.ms-table__sort {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
}

.ms-table__sort button {
  padding: 0.35rem 0.9rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-donks-text-secondary);
  cursor: pointer;
}

.ms-table__sort button.active {
  background: var(--color-donks-felt);
  color: #fff;
}

.ms-table__head,
.ms-table__row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) 5rem 6.5rem 9rem;
  align-items: center;
  gap: 0.75rem;
}

.ms-table__head {
  padding: 0 0.75rem 0.4rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-donks-text-muted);
  border-bottom: 2px solid var(--color-donks-gold);
}

.ms-table__rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ms-table__row {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font: inherit;
  text-align: left;
  color: var(--color-donks-text);
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(201, 162, 39, 0.15);
  cursor: pointer;
  transition: background 0.15s ease;
}

.ms-table__row:hover,
.ms-table__row:focus-visible {
  background: rgba(201, 162, 39, 0.1);
  outline: none;
}

.ms-table__rank {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-donks-text-muted);
  text-align: center;
}

.ms-table__rank--top { color: var(--color-donks-gold-dark); }

.ms-table__player {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.ms-table__avatar { border-radius: 50%; flex-shrink: 0; }

.ms-table__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-table__col-games,
.ms-table__games {
  text-align: right;
}

.ms-table__games {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ms-table__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #1a1a2e;
  background: linear-gradient(135deg, var(--tier-light), var(--tier-base));
  border: 1px solid var(--tier-dark);
}

.ms-table__none { color: var(--color-donks-text-muted); }

.ms-table__next {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ms-table__bar {
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.ms-table__bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--tier-dark), var(--tier-base));
}

.ms-table__togo {
  font-size: 0.66rem;
  color: var(--color-donks-text-muted);
  font-variant-numeric: tabular-nums;
}

.ms-table__empty {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-donks-text-muted);
}

@media (max-width: 640px) {
  .ms-table__head,
  .ms-table__row {
    grid-template-columns: 2rem minmax(0, 1fr) 4rem 4.5rem;
    gap: 0.5rem;
  }
  .ms-table__col-next { display: none; }
}
</style>
