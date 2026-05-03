<script setup lang="ts">
import type { DonksLeaderboardEntry } from '@/types/donks'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  entries: DonksLeaderboardEntry[]
  getAvatar: (username: string) => string
  limit?: number
  compact?: boolean
  collapsible?: number
}>(), {
  limit: 0,
  compact: false,
  collapsible: 0,
})

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const expanded = ref(false)

const visibleEntries = computed(() => {
  if (props.collapsible > 0 && !expanded.value) {
    return props.entries.slice(0, props.collapsible)
  }
  return props.limit > 0 ? props.entries.slice(0, props.limit) : props.entries
})

const hiddenCount = computed(() => {
  if (props.collapsible <= 0) return 0
  return Math.max(0, props.entries.length - props.collapsible)
})

function formatPoints(pts: number): string {
  return Math.round(pts).toLocaleString()
}

function rankAccent(rank: number): string {
  if (rank === 1) return 'var(--color-gold, #c9a227)'
  if (rank === 2) return 'var(--color-silver, #a8a8a8)'
  if (rank === 3) return 'var(--color-bronze, #cd7f32)'
  return 'transparent'
}
</script>

<template>
  <div class="lb-table" :class="{ 'lb-table--compact': compact }">
    <div v-if="visibleEntries.length === 0" class="lb-table__empty">
      No results yet for this leaderboard.
    </div>

    <table v-else class="lb-table__table">
      <thead>
        <tr>
          <th class="lb-table__th lb-table__th--rank">#</th>
          <th class="lb-table__th lb-table__th--player">Player</th>
          <th class="lb-table__th lb-table__th--pts">Best 9 Pts</th>
          <th class="lb-table__th lb-table__th--games">Games</th>
          <th class="lb-table__th lb-table__th--diff">Diff</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in visibleEntries"
          :key="entry.username"
          class="lb-table__row"
          :style="{ '--rank-accent': rankAccent(entry.rank) }"
          @click="emit('row-click', entry.username)"
        >
          <td class="lb-table__cell lb-table__cell--rank">
            <span class="lb-table__rank-num">{{ entry.rank }}</span>
          </td>
          <td class="lb-table__cell lb-table__cell--player">
            <img
              :src="getAvatar(entry.username)"
              :alt="entry.username"
              class="lb-table__avatar"
              loading="lazy"
            />
            <span class="lb-table__username">{{ entry.username }}</span>
          </td>
          <td class="lb-table__cell lb-table__cell--pts">{{ formatPoints(entry.totalPoints) }}</td>
          <td class="lb-table__cell lb-table__cell--games">{{ entry.gamesPlayed }}</td>
          <td class="lb-table__cell lb-table__cell--diff">
            <span v-if="entry.diff === null" class="diff diff--new">NEW</span>
            <span v-else-if="entry.diff > 0" class="diff diff--up">&#9650;{{ entry.diff }}</span>
            <span v-else-if="entry.diff < 0" class="diff diff--down">&#9660;{{ Math.abs(entry.diff) }}</span>
            <span v-else class="diff diff--same">&mdash;</span>
          </td>
        </tr>
      </tbody>
    </table>

    <button
      v-if="collapsible > 0 && hiddenCount > 0"
      class="lb-table__toggle"
      @click="expanded = !expanded"
    >
      <template v-if="!expanded">
        Show all {{ entries.length }} players ▾
      </template>
      <template v-else>
        Show top {{ collapsible }} ▴
      </template>
    </button>
  </div>
</template>

<style scoped>
.lb-table__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-donks-text-muted);
  font-size: 0.85rem;
}

.lb-table__table {
  width: 100%;
  border-collapse: collapse;
}

.lb-table__th {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-muted);
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.10);
  white-space: nowrap;
}

.lb-table__th--rank { width: 36px; text-align: center; }
.lb-table__th--pts,
.lb-table__th--games,
.lb-table__th--diff { text-align: right; }

/* Rows */
.lb-table__row {
  cursor: pointer;
  transition: background 0.15s ease;
  border-left: 3px solid var(--rank-accent, transparent);
}

.lb-table__row:hover {
  background: rgba(201, 162, 39, 0.06);
}

.lb-table__row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

/* Cells */
.lb-table__cell {
  padding: 0.55rem 0.6rem;
  font-size: 0.82rem;
  color: var(--color-donks-text);
  vertical-align: middle;
}

.lb-table__cell--rank {
  text-align: center;
  font-weight: 700;
  color: var(--color-donks-text-secondary);
  font-size: 0.75rem;
}

.lb-table__rank-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
}

.lb-table__cell--player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lb-table__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(201, 162, 39, 0.25);
  flex-shrink: 0;
}

.lb-table__username {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lb-table__cell--pts,
.lb-table__cell--games,
.lb-table__cell--diff {
  text-align: right;
  white-space: nowrap;
}

.lb-table__cell--pts {
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
}

.lb-table__cell--games {
  color: var(--color-donks-text-secondary);
}

/* Diff badges */
.diff {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

.diff--up {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
}

.diff--down {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.diff--same {
  color: var(--color-donks-text-muted);
}

.diff--new {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Expand/Collapse toggle */
.lb-table__toggle {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 0.25rem;
  background: rgba(201, 162, 39, 0.06);
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: var(--color-donks-gold-dark);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  border-radius: 0 0 12px 12px;
}

.lb-table__toggle:hover {
  background: rgba(201, 162, 39, 0.12);
  color: var(--color-donks-gold);
}

/* Compact mode (for cup cards) */
.lb-table--compact .lb-table__th {
  font-size: 0.58rem;
  padding: 0.35rem 0.45rem;
}

.lb-table--compact .lb-table__cell {
  padding: 0.35rem 0.45rem;
  font-size: 0.75rem;
}

.lb-table--compact .lb-table__avatar {
  width: 24px;
  height: 24px;
}

.lb-table--compact .lb-table__cell--pts {
  font-size: 0.72rem;
}

.lb-table--compact .lb-table__rank-num {
  width: 18px;
  height: 18px;
  font-size: 0.62rem;
}

@media (max-width: 600px) {
  .lb-table__th--games,
  .lb-table__cell--games {
    display: none;
  }

  .lb-table__cell {
    padding: 0.4rem 0.35rem;
    font-size: 0.75rem;
  }

  .lb-table__avatar {
    width: 24px;
    height: 24px;
  }
}
</style>
