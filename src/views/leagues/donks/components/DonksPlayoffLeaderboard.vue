<script setup lang="ts">
import { computed } from 'vue'
import type {
  DonksPlayoffLeaderboardEntry,
  DonksPlayoffGameSummary,
  DonksPlayoffPhase,
  DonksPlayoffConfig,
} from '@/types/donks'
import { getDonksCup } from '@/config/donks'

const props = defineProps<{
  entries: DonksPlayoffLeaderboardEntry[]
  games: DonksPlayoffGameSummary[]
  phase: DonksPlayoffPhase
  config: DonksPlayoffConfig
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const rankedEntries = computed(() => props.entries.filter((e) => e.rank > 0))
const unrankedEntries = computed(() => props.entries.filter((e) => e.rank === 0))

function rankAccent(rank: number): string {
  if (rank === 1) return 'var(--color-gold, #c9a227)'
  if (rank === 2) return 'var(--color-silver, #a8a8a8)'
  if (rank === 3) return 'var(--color-bronze, #cd7f32)'
  return 'transparent'
}

function cupShortName(cupSlug: string): string {
  return getDonksCup(cupSlug as any)?.shortName ?? cupSlug
}

function getCountedGameIds(entry: DonksPlayoffLeaderboardEntry): Set<string> {
  const scored = Object.entries(entry.gameScores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
  const top = scored.slice(0, props.config.topNScores)
  return new Set(top.map(([id]) => id))
}

function displayScore(score: number | undefined): string {
  return score && score > 0 ? score.toLocaleString() : '\u2014'
}
</script>

<template>
  <div class="po-lb">
    <!-- Winner banner -->
    <div v-if="phase === 'playoffs_complete' && rankedEntries.length > 0" class="po-winner-banner">
      <span class="po-winner-icon">&#127942;</span>
      <span>{{ rankedEntries[0].username }} wins {{ config.medalName }}!</span>
    </div>

    <!-- Pre-playoffs empty state -->
    <div v-if="phase === 'pre_playoffs'" class="po-lb__empty">
      <p>The playoff leaderboard will appear once the first playoff game is completed.</p>
    </div>

    <!-- Table -->
    <div v-else-if="entries.length > 0" class="po-lb__scroll">
      <table class="po-lb__table">
        <thead>
          <tr>
            <th class="po-th po-th--rank">#</th>
            <th class="po-th po-th--player">Player</th>
            <th class="po-th po-th--pts">Best {{ config.topNScores }} Pts</th>
            <th class="po-th po-th--games">Games</th>
            <th
              v-for="game in games"
              :key="game.gameId"
              class="po-th po-th--game"
            >
              {{ cupShortName(game.cupSlug) }}
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Ranked entries -->
          <tr
            v-for="entry in rankedEntries"
            :key="entry.username"
            class="po-row"
            :style="{ '--rank-accent': rankAccent(entry.rank) }"
            @click="emit('row-click', entry.username)"
          >
            <td class="po-cell po-cell--rank">{{ entry.rank }}</td>
            <td class="po-cell po-cell--player">
              <img :src="getAvatar(entry.username)" :alt="entry.username" class="po-cell__avatar" />
              <span class="po-cell__name">{{ entry.username }}</span>
            </td>
            <td class="po-cell po-cell--pts" :class="{ 'po-cell--top3': entry.rank <= 3 }">
              {{ entry.totalPoints.toLocaleString() }}
            </td>
            <td class="po-cell po-cell--games">
              {{ entry.gamesPlayed }}/{{ games.length }}
            </td>
            <td
              v-for="game in games"
              :key="game.gameId"
              class="po-cell po-cell--game"
              :class="{ 'po-cell--counted': getCountedGameIds(entry).has(game.gameId) }"
            >
              {{ displayScore(entry.gameScores[game.gameId]) }}
            </td>
          </tr>

          <!-- Unranked divider -->
          <tr v-if="unrankedEntries.length > 0" class="po-row po-row--divider">
            <td :colspan="4 + games.length" class="po-cell po-cell--divider-label">
              Qualified but not yet played
            </td>
          </tr>

          <!-- Unranked entries -->
          <tr
            v-for="entry in unrankedEntries"
            :key="entry.username"
            class="po-row po-row--unranked"
            @click="emit('row-click', entry.username)"
          >
            <td class="po-cell po-cell--rank po-cell--muted">&ndash;&ndash;</td>
            <td class="po-cell po-cell--player">
              <img :src="getAvatar(entry.username)" :alt="entry.username" class="po-cell__avatar" />
              <span class="po-cell__name po-cell--muted">{{ entry.username }}</span>
            </td>
            <td class="po-cell po-cell--pts po-cell--muted">&mdash;</td>
            <td class="po-cell po-cell--games po-cell--muted">0/{{ games.length }}</td>
            <td
              v-for="game in games"
              :key="game.gameId"
              class="po-cell po-cell--game po-cell--muted"
            >
              &mdash;
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* ─── Winner Banner ─────────────────────────────────────── */

.po-winner-banner {
  text-align: center;
  padding: 0.85rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(201, 162, 39, 0.06) 100%);
  border: 1px solid rgba(201, 162, 39, 0.25);
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-donks-text);
  animation: slideDown 0.4s ease;
}

.po-winner-icon {
  margin-right: 0.4rem;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Empty State ───────────────────────────────────────── */

.po-lb__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-donks-text-secondary);
  font-size: 0.85rem;
}

/* ─── Table Container ───────────────────────────────────── */

.po-lb__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
}

.po-lb__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  white-space: nowrap;
}

/* ─── Header ────────────────────────────────────────────── */

.po-th {
  padding: 0.55rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-donks-text-muted);
  border-bottom: 1.5px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.06));
  text-align: center;
}

.po-th--rank {
  width: 36px;
  text-align: center;
}

.po-th--player {
  text-align: left;
  min-width: 140px;
}

.po-th--pts {
  min-width: 80px;
}

.po-th--games {
  min-width: 55px;
}

.po-th--game {
  min-width: 65px;
}

/* ─── Rows ──────────────────────────────────────────────── */

.po-row {
  cursor: pointer;
  transition: background 0.15s ease;
  border-left: 3px solid var(--rank-accent, transparent);
}

.po-row:hover {
  background: rgba(201, 162, 39, 0.04);
}

.po-row--unranked {
  border-left-color: transparent;
  opacity: 0.6;
}

.po-row--unranked:hover {
  opacity: 0.8;
}

.po-row--divider {
  cursor: default;
  border-left-color: transparent;
}

.po-row--divider:hover {
  background: none;
}

/* ─── Cells ─────────────────────────────────────────────── */

.po-cell {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  text-align: center;
  color: var(--color-donks-text-secondary);
}

.po-cell--rank {
  font-weight: 700;
  font-size: 0.72rem;
  color: var(--color-donks-text);
  text-align: center;
  width: 36px;
}

.po-cell--player {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-align: left;
}

.po-cell__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.po-cell__name {
  font-weight: 600;
  color: var(--color-donks-text);
  font-size: 0.78rem;
}

.po-cell--pts {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.po-cell--top3 {
  color: var(--color-donks-gold, #c9a227);
}

.po-cell--games {
  font-variant-numeric: tabular-nums;
  font-size: 0.72rem;
}

.po-cell--game {
  font-variant-numeric: tabular-nums;
  font-size: 0.74rem;
}

.po-cell--counted {
  background: rgba(212, 160, 23, 0.08);
  color: var(--color-donks-text);
  font-weight: 600;
  border-radius: 4px;
}

.po-cell--muted {
  color: var(--color-donks-text-muted) !important;
  font-weight: 400 !important;
}

.po-cell--divider-label {
  padding: 0.65rem 0.6rem 0.35rem;
  font-size: 0.65rem;
  font-style: italic;
  text-align: left;
  color: var(--color-donks-text-muted);
  border-bottom: none;
  border-top: 1px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.08));
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 700px) {
  .po-lb__scroll {
    mask-image: linear-gradient(to right, transparent 0%, black 1%, black 92%, transparent 100%);
  }

  .po-th--rank,
  .po-cell--rank,
  .po-th--player,
  .po-cell--player {
    position: sticky;
    background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
    z-index: 2;
  }

  .po-th--rank,
  .po-cell--rank {
    left: 0;
  }

  .po-th--player,
  .po-cell--player {
    left: 36px;
  }
}
</style>
