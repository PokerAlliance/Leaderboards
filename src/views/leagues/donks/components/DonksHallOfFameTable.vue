<script setup lang="ts">
import type { DonksHallOfFameEntry } from '@/types/donks'

defineProps<{
  entries: DonksHallOfFameEntry[]
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

function rankAccent(rank: number): string {
  if (rank === 1) return 'var(--color-gold, #c9a227)'
  if (rank === 2) return 'var(--color-silver, #a8a8a8)'
  if (rank === 3) return 'var(--color-bronze, #cd7f32)'
  return 'transparent'
}

function totalAwards(e: DonksHallOfFameEntry): number {
  return e.goldenCrowns + e.silverCrowns + e.bronzeCrowns
    + e.annualChampionship + e.tournamentOfChampions
    + e.allDonksInPlayoffs + e.omaha
}

function displayVal(n: number): string {
  return n > 0 ? String(n) : '\u2014'
}
</script>

<template>
  <div class="hof-table">
    <div v-if="entries.length === 0" class="hof-table__empty">
      No Hall of Fame data available yet.
    </div>

    <div v-else class="hof-table__scroll">
      <table class="hof-table__table">
        <thead>
          <tr>
            <th class="hof-th hof-th--rank">#</th>
            <th class="hof-th hof-th--player">Player</th>
            <th class="hof-th hof-th--award">Golden</th>
            <th class="hof-th hof-th--award">Silver</th>
            <th class="hof-th hof-th--award">Bronze</th>
            <th class="hof-th hof-th--award hof-th--legacy">Rings</th>
            <th class="hof-th hof-th--award hof-th--legacy">ToC</th>
            <th class="hof-th hof-th--award">Playoffs</th>
            <th class="hof-th hof-th--award">Omaha</th>
            <th class="hof-th hof-th--total">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, idx) in entries"
            :key="entry.username"
            class="hof-row"
            :style="{ '--rank-accent': rankAccent(idx + 1) }"
            @click="emit('row-click', entry.username)"
          >
            <td class="hof-cell hof-cell--rank">{{ idx + 1 }}</td>
            <td class="hof-cell hof-cell--player">
              <img
                :src="getAvatar(entry.username)"
                :alt="entry.username"
                class="hof-avatar"
                loading="lazy"
              />
              <span class="hof-username">{{ entry.username }}</span>
            </td>
            <td class="hof-cell hof-cell--award">{{ displayVal(entry.goldenCrowns) }}</td>
            <td class="hof-cell hof-cell--award">{{ displayVal(entry.silverCrowns) }}</td>
            <td class="hof-cell hof-cell--award">{{ displayVal(entry.bronzeCrowns) }}</td>
            <td class="hof-cell hof-cell--award hof-cell--legacy">{{ displayVal(entry.annualChampionship) }}</td>
            <td class="hof-cell hof-cell--award hof-cell--legacy">{{ displayVal(entry.tournamentOfChampions) }}</td>
            <td class="hof-cell hof-cell--award">{{ displayVal(entry.allDonksInPlayoffs) }}</td>
            <td class="hof-cell hof-cell--award">{{ displayVal(entry.omaha) }}</td>
            <td class="hof-cell hof-cell--total">{{ totalAwards(entry) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.hof-table__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-donks-text-muted);
  font-size: 0.85rem;
}

.hof-table__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%);
}

.hof-table__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.hof-th {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-muted);
  padding: 0.5rem 0.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.10);
  white-space: nowrap;
}

.hof-th--rank {
  width: 36px;
  text-align: center;
}

.hof-th--player {
  text-align: left;
  min-width: 140px;
}

.hof-th--total {
  font-weight: 800;
  color: var(--color-donks-text-secondary);
}

.hof-th--legacy {
  color: var(--color-donks-text-muted);
  font-style: italic;
  opacity: 0.7;
}

.hof-row {
  cursor: pointer;
  transition: background 0.15s ease;
  border-left: 3px solid var(--rank-accent, transparent);
}

.hof-row:hover {
  background: rgba(201, 162, 39, 0.06);
}

.hof-row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.hof-cell {
  padding: 0.5rem 0.5rem;
  font-size: 0.8rem;
  color: var(--color-donks-text);
  vertical-align: middle;
  text-align: center;
}

.hof-cell--rank {
  font-weight: 700;
  color: var(--color-donks-text-secondary);
  font-size: 0.75rem;
}

.hof-cell--player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
}

.hof-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(201, 162, 39, 0.25);
  flex-shrink: 0;
}

.hof-username {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hof-cell--award {
  font-family: var(--font-mono, monospace);
  font-size: 0.78rem;
  font-weight: 600;
}

.hof-cell--legacy {
  opacity: 0.55;
  background: rgba(0, 0, 0, 0.015);
}

.hof-cell--total {
  font-weight: 800;
  font-family: var(--font-mono, monospace);
  font-size: 0.82rem;
  color: var(--color-donks-gold, #c9a227);
}

@media (max-width: 700px) {
  .hof-table__scroll {
    mask-image: linear-gradient(to right, transparent 0%, black 1%, black 92%, transparent 100%);
  }

  .hof-th--rank,
  .hof-cell--rank,
  .hof-th--player,
  .hof-cell--player {
    position: sticky;
    background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
    z-index: 2;
  }

  .hof-th--rank,
  .hof-cell--rank {
    left: 0;
  }

  .hof-th--player,
  .hof-cell--player {
    left: 36px;
  }
}
</style>
