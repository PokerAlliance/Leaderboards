<script setup lang="ts">
import { computed } from 'vue'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'
import type {
  DonksPlayoffGameSummary,
  DonksPlayoffQualifier,
  DonksPlayoffConfig,
  DonksCupSlug,
} from '@/types/donks'
import { getDonksCup } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'

const props = defineProps<{
  gameId: string | null
  games: DonksPlayoffGameSummary[]
  qualifiers: DonksPlayoffQualifier[]
  config: DonksPlayoffConfig
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const store = useDonksStore()

const qualifierMap = computed(() => {
  const m = new Map<string, DonksPlayoffQualifier>()
  for (const q of props.qualifiers) m.set(q.username, q)
  return m
})

const selectedGame = computed(() =>
  props.games.find((g) => g.gameId === props.gameId) ?? null
)

const gameCup = computed(() =>
  selectedGame.value ? getDonksCup(selectedGame.value.cupSlug) : null
)

const gameResults = computed(() => {
  if (!props.gameId) return []
  return store.playerResults.value
    .filter((r) => r.gameId === props.gameId)
    .sort((a, b) => a.finishPosition - b.finishPosition)
})

/**
 * For each qualifier, determine which playoff game scores are "counted"
 * (in their top N). Returns a Set of gameIds that count for the given user.
 */
const countedGamesMap = computed(() => {
  const map = new Map<string, Set<string>>()
  const playoffGameIds = new Set(props.games.map((g) => g.gameId))

  for (const q of props.qualifiers) {
    const results = store.playerResults.value.filter(
      (r) => r.username === q.username && playoffGameIds.has(r.gameId)
    )
    const sorted = [...results].sort((a, b) => b.pointsEarned - a.pointsEarned)
    const topN = sorted.slice(0, props.config.topNScores)
    map.set(q.username, new Set(topN.map((r) => r.gameId)))
  }

  return map
})

function isCountedForUser(username: string): boolean {
  if (!props.gameId) return false
  return countedGamesMap.value.get(username)?.has(props.gameId) ?? false
}

function qualBadgeColor(q: DonksPlayoffQualifier): string {
  if (q.qualifiedVia === 'omaha_wildcard') return '#2d6a4f'
  return getDonksCup(q.qualifiedVia as DonksCupSlug)?.color ?? '#888'
}

function qualBadgeLabel(q: DonksPlayoffQualifier): string {
  if (q.qualifiedVia === 'omaha_wildcard') return 'OMA'
  return getDonksCup(q.qualifiedVia as DonksCupSlug)?.shortName ?? '?'
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="pgr">
    <!-- Empty state -->
    <div v-if="!gameId || !selectedGame" class="pgr__empty">
      <i class="i-heroicons-cursor-arrow-rays-20-solid pgr__empty-icon" />
      <span>Select a game from the timeline above to view results</span>
    </div>

    <!-- Upcoming game -->
    <div v-else-if="!selectedGame.isLocked" class="pgr__empty">
      <i class="i-lucide-timer pgr__empty-icon" />
      <span>This game hasn't been played yet. Results will appear once it's locked.</span>
    </div>

    <!-- Game results -->
    <template v-else>
      <div class="pgr__header" :style="{ '--cup-color': gameCup?.color ?? '#888' }">
        <span class="pgr__header-dot" />
        <div class="pgr__header-info">
          <span class="pgr__header-cup">{{ gameCup?.name ?? selectedGame.cupSlug }}</span>
          <span class="pgr__header-date">{{ formatDate(selectedGame.gameDate) }} &middot; {{ selectedGame.totalPlayers }} players</span>
        </div>
      </div>

      <div class="pgr__scroll">
        <table class="pgr__table">
          <thead>
            <tr>
              <th class="pgr__th pgr__th--pos">#</th>
              <th class="pgr__th pgr__th--player">Player</th>
              <th class="pgr__th pgr__th--position">Position</th>
              <th class="pgr__th pgr__th--pts">Points</th>
              <th class="pgr__th pgr__th--qual">Qualifier</th>
              <th class="pgr__th pgr__th--counted">Counted</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="result in gameResults"
              :key="result.username"
              class="pgr__row"
              :class="{
                'pgr__row--qualifier': qualifierMap.has(result.username),
                'pgr__row--non-qualifier': !qualifierMap.has(result.username),
              }"
              :style="qualifierMap.has(result.username) ? { '--q-color': qualBadgeColor(qualifierMap.get(result.username)!) } : undefined"
              @click="emit('row-click', result.username)"
            >
              <td class="pgr__cell pgr__cell--pos">{{ result.finishPosition }}</td>
              <td class="pgr__cell pgr__cell--player">
                <PlayerAvatar :src="getAvatar(result.username)" :username="result.username" class="pgr__avatar" />
                <span class="pgr__name">{{ result.username }}</span>
              </td>
              <td class="pgr__cell pgr__cell--position">
                {{ result.finishPosition }}/{{ result.totalPlayers }}
              </td>
              <td class="pgr__cell pgr__cell--pts">
                {{ result.pointsEarned.toLocaleString() }}
              </td>
              <td class="pgr__cell pgr__cell--qual">
                <span v-if="qualifierMap.has(result.username)" class="pgr__badge" :style="{ '--badge-color': qualBadgeColor(qualifierMap.get(result.username)!) }">
                  {{ qualBadgeLabel(qualifierMap.get(result.username)!) }}
                </span>
                <span v-else class="pgr__no-badge">&mdash;</span>
              </td>
              <td class="pgr__cell pgr__cell--counted">
                <i v-if="qualifierMap.has(result.username) && isCountedForUser(result.username)" class="i-lucide-star pgr__star" />
                <span v-else />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="pgr__legend">
        <span class="pgr__legend-item">
          <span class="pgr__badge pgr__badge--demo" style="--badge-color: #e85d04">BDK</span>
          Qualified via cup
        </span>
        <span class="pgr__legend-item">
          <i class="i-lucide-star pgr__star pgr__star--demo" />
          Score counts toward Best {{ config.topNScores }} total
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pgr {
  min-height: 80px;
}

/* ─── Empty State ───────────────────────────────────────── */

.pgr__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  font-size: 0.78rem;
  color: var(--color-donks-text-muted);
}

.pgr__empty-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.5;
}

/* ─── Header ────────────────────────────────────────────── */

.pgr__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 0.4rem;
}

.pgr__header-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--cup-color);
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--cup-color) 50%, transparent);
}

.pgr__header-info {
  display: flex;
  flex-direction: column;
}

.pgr__header-cup {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-donks-text);
}

.pgr__header-date {
  font-size: 0.68rem;
  color: var(--color-donks-text-muted);
}

/* ─── Table ─────────────────────────────────────────────── */

.pgr__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.pgr__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.74rem;
  white-space: nowrap;
}

.pgr__th {
  padding: 0.45rem 0.5rem;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-donks-text-muted);
  border-bottom: 1.5px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.06));
  text-align: center;
}

.pgr__th--pos { width: 30px; }
.pgr__th--player { text-align: left; min-width: 120px; }
.pgr__th--position { min-width: 55px; }
.pgr__th--pts { min-width: 70px; }
.pgr__th--qual { min-width: 60px; }
.pgr__th--counted { min-width: 50px; }

/* ─── Rows ──────────────────────────────────────────────── */

.pgr__row {
  cursor: pointer;
  transition: background 0.12s ease;
  border-left: 3px solid transparent;
}

.pgr__row:hover {
  background: rgba(201, 162, 39, 0.04);
}

.pgr__row--qualifier {
  border-left-color: var(--q-color, transparent);
}

.pgr__row--non-qualifier {
  opacity: 0.55;
}

.pgr__row--non-qualifier:hover {
  opacity: 0.75;
}

/* ─── Cells ─────────────────────────────────────────────── */

.pgr__cell {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  text-align: center;
  color: var(--color-donks-text-secondary);
}

.pgr__cell--pos {
  font-weight: 700;
  font-size: 0.68rem;
  color: var(--color-donks-text);
  width: 30px;
}

.pgr__cell--player {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-align: left;
}

.pgr__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.pgr__name {
  font-weight: 600;
  color: var(--color-donks-text);
  font-size: 0.74rem;
}

.pgr__cell--pts {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pgr__cell--position {
  font-variant-numeric: tabular-nums;
  font-size: 0.68rem;
}

/* ─── Qualifier Badge ───────────────────────────────────── */

.pgr__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge-color) 25%, transparent);
}

.pgr__badge--demo {
  font-size: 0.55rem;
}

.pgr__no-badge {
  color: var(--color-donks-text-muted);
  font-size: 0.68rem;
}

/* ─── Counted Star ──────────────────────────────────────── */

.pgr__star {
  width: 14px;
  height: 14px;
  color: var(--color-donks-gold, #c9a227);
  filter: drop-shadow(0 0 2px rgba(201, 162, 39, 0.4));
}

.pgr__star--demo {
  width: 12px;
  height: 12px;
}

/* ─── Legend ────────────────────────────────────────────── */

.pgr__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.55rem 0.5rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 0.4rem;
}

.pgr__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.62rem;
  color: var(--color-donks-text-muted);
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 600px) {
  .pgr__th--position,
  .pgr__cell--position {
    display: none;
  }
}
</style>
