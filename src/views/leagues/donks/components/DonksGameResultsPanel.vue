<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksCupSlug, DonksGameResultEntry, DonksPlayoffQualifier } from '@/types/donks'
import { getDonksCup } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import { fetchTournamentWithProxy } from '@/services/api/corsProxy'
import { calculateDonksPoints } from '@/services/scoring/strategies/donks'

const props = withDefaults(defineProps<{
  cupSlug: DonksCupSlug
  selectedGameId: string | null
  selectedTournamentId: number | null
  isPlayoffGame?: boolean
  qualifiers?: DonksPlayoffQualifier[]
}>(), {
  isPlayoffGame: false,
  qualifiers: () => [],
})

const qualifierMap = computed(() => {
  const map = new Map<string, DonksPlayoffQualifier>()
  for (const q of props.qualifiers) map.set(q.username, q)
  return map
})

function qualBadgeLabel(username: string): string {
  const q = qualifierMap.value.get(username)
  if (!q) return ''
  if (q.qualifiedVia === 'omaha_wildcard') return 'OMA'
  const cup = getDonksCup(q.qualifiedVia)
  return cup?.shortName ?? q.qualifiedVia.toUpperCase()
}

const store = useDonksStore()
const results = ref<DonksGameResultEntry[]>([])
const isLoadingGame = ref(false)
const gameState = ref<string>('finished')
const gameDate = ref<string | null>(null)
const playerCount = ref(0)

let pollTimer: ReturnType<typeof setInterval> | null = null

const isLive = computed(() =>
  gameState.value === 'running' || gameState.value === 'late_registration'
)

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling(tournamentId: number) {
  stopPolling()
  pollTimer = setInterval(() => {
    fetchAndParseTournament(tournamentId, true)
  }, 30_000)
}

async function fetchAndParseTournament(tournamentId: number, silent = false) {
  if (!silent) isLoadingGame.value = true
  try {
    const data = await fetchTournamentWithProxy<any>(tournamentId)
    const tournament = data?.tournament ?? data
    gameState.value = tournament.state ?? 'finished'
    gameDate.value = tournament.start ?? tournament.startTime ?? null
    const winners: any[] = tournament.winners ?? []
    playerCount.value = tournament.total_players ?? tournament.totalPlayers ?? winners.length

    results.value = winners.map((w: any) => ({
      username: w.username ?? w.name ?? '',
      finishPosition: w.position ?? w.rank ?? 0,
      totalPlayers: playerCount.value,
      pointsEarned: calculateDonksPoints(playerCount.value, w.position ?? w.rank ?? 1),
    })).sort((a: DonksGameResultEntry, b: DonksGameResultEntry) => a.finishPosition - b.finishPosition)

    if (isLive.value) {
      startPolling(tournamentId)
    } else {
      stopPolling()
    }
  } catch (err) {
    console.error('[DonksGameResultsPanel] fetch error:', err)
  } finally {
    isLoadingGame.value = false
  }
}

function loadFromCache(gameId: string) {
  const cached = store.getGameResults(gameId)
  if (cached.length > 0) {
    gameState.value = 'finished'
    gameDate.value = cached[0]!.gameDate.toLocaleDateString()
    playerCount.value = cached[0]!.totalPlayers
    results.value = cached.map((r) => ({
      username: r.username,
      finishPosition: r.finishPosition,
      totalPlayers: r.totalPlayers,
      pointsEarned: r.pointsEarned,
    }))
    stopPolling()
    isLoadingGame.value = false
    return true
  }
  return false
}

const VISIBLE_LIMIT = 10
const expanded = ref(false)

watch(
  () => [props.selectedGameId, props.selectedTournamentId] as const,
  ([gameId, tournamentId]) => {
    stopPolling()
    expanded.value = false
    if (gameId && loadFromCache(gameId)) return
    if (tournamentId) {
      fetchAndParseTournament(tournamentId)
    } else {
      results.value = []
    }
  },
  { immediate: true }
)

onUnmounted(() => stopPolling())

const visibleResults = computed(() =>
  expanded.value ? results.value : results.value.slice(0, VISIBLE_LIMIT)
)

const hiddenCount = computed(() =>
  Math.max(0, results.value.length - VISIBLE_LIMIT)
)

function formatPoints(pts: number): string {
  return Math.round(pts).toLocaleString()
}
</script>

<template>
  <div class="results-panel donks-card">
    <div class="results-panel__header">
      <div class="results-panel__title-row">
        <h3 class="results-panel__title">Game Results</h3>
        <span
          v-if="isLive"
          class="results-panel__live-badge"
        >
          <span class="results-panel__live-dot" /> LIVE
        </span>
        <span
          v-else-if="gameState === 'finished'"
          class="results-panel__status-badge results-panel__status-badge--finished"
        >
          FINISHED
        </span>
        <span
          v-else-if="gameState === 'upcoming' || gameState === 'registering'"
          class="results-panel__status-badge results-panel__status-badge--upcoming"
        >
          UPCOMING
        </span>
      </div>
      <div v-if="gameDate || playerCount" class="results-panel__meta">
        <span v-if="gameDate" class="results-panel__meta-item">{{ gameDate }}</span>
        <span v-if="playerCount" class="results-panel__meta-item">{{ playerCount }} players</span>
      </div>
    </div>

    <!-- Playoff Game Banner -->
    <div v-if="isPlayoffGame" class="results-panel__playoff-banner">
      <i class="i-lucide-swords results-panel__playoff-icon" />
      <div class="results-panel__playoff-text">
        <strong>PLAYOFF GAME</strong> — Results count toward the FatnSassy Playoffs Medal for qualified players
      </div>
      <RouterLink to="/league/donks/playoffs" class="results-panel__playoff-link">
        View Playoff Standings &rarr;
      </RouterLink>
    </div>

    <div v-if="isLoadingGame" class="results-panel__loading">
      <div class="results-panel__spinner" />
      Loading results...
    </div>

    <div v-else-if="results.length === 0" class="results-panel__empty">
      No results available for this game.
    </div>

    <table v-else class="results-panel__table">
      <thead>
        <tr>
          <th class="results-panel__th results-panel__th--rank">#</th>
          <th class="results-panel__th results-panel__th--player">Player</th>
          <th class="results-panel__th results-panel__th--pts">Points</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in visibleResults"
          :key="entry.username"
          class="results-panel__row"
          :class="{ 'results-panel__row--qualifier': isPlayoffGame && qualifierMap.has(entry.username) }"
        >
          <td class="results-panel__cell results-panel__cell--rank">{{ entry.finishPosition }}</td>
          <td class="results-panel__cell results-panel__cell--player">
            <img
              :src="store.getAvatar(entry.username)"
              :alt="entry.username"
              class="results-panel__avatar"
              loading="lazy"
            />
            <span class="results-panel__username">{{ entry.username }}</span>
            <span
              v-if="isPlayoffGame && qualifierMap.has(entry.username)"
              class="results-panel__qual-badge"
            >{{ qualBadgeLabel(entry.username) }}</span>
          </td>
          <td class="results-panel__cell results-panel__cell--pts">{{ formatPoints(entry.pointsEarned) }}</td>
        </tr>
      </tbody>
    </table>

    <button
      v-if="hiddenCount > 0"
      class="results-panel__toggle"
      @click="expanded = !expanded"
    >
      <template v-if="!expanded">
        Show all {{ results.length }} players ▾
      </template>
      <template v-else>
        Show top {{ VISIBLE_LIMIT }} ▴
      </template>
    </button>
  </div>
</template>

<style scoped>
.results-panel {
  padding: 1rem 1.25rem;
  border-top: 3px solid var(--cup-color, var(--color-donks-gold));
}

.results-panel__header {
  margin-bottom: 0.75rem;
}

.results-panel__title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.results-panel__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-donks-text);
  margin: 0;
}

.results-panel__live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.2em 0.65em;
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 999px;
}

.results-panel__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dc2626;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
}

.results-panel__status-badge {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2em 0.6em;
  border-radius: 999px;
}

.results-panel__status-badge--finished {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.results-panel__status-badge--upcoming {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.results-panel__meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.3rem;
}

.results-panel__meta-item {
  font-size: 0.72rem;
  color: var(--color-donks-text-muted);
}

.results-panel__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2rem;
  color: var(--color-donks-text-muted);
  font-size: 0.82rem;
}

.results-panel__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-donks-card-border);
  border-top-color: var(--color-donks-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-panel__empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-donks-text-muted);
  font-size: 0.82rem;
}

/* Playoff Game Banner */
.results-panel__playoff-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  background: rgba(201, 162, 39, 0.08);
  border: 1px solid rgba(201, 162, 39, 0.2);
}

.results-panel__playoff-icon {
  width: 18px;
  height: 18px;
  color: #c9a227;
  flex-shrink: 0;
}

.results-panel__playoff-text {
  font-size: 0.72rem;
  color: var(--color-donks-text);
  flex: 1;
}

.results-panel__playoff-text strong {
  color: #b8941e;
  letter-spacing: 0.04em;
}

.results-panel__playoff-link {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #b8941e;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.results-panel__playoff-link:hover {
  color: #96790f;
}

/* Qualifier row styling */
.results-panel__row--qualifier {
  border-left: 3px solid #c9a227;
}

.results-panel__qual-badge {
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: rgba(201, 162, 39, 0.15);
  color: #b8941e;
  border: 1px solid rgba(201, 162, 39, 0.3);
  border-radius: 6px;
  padding: 0.05rem 0.3rem;
  margin-left: 0.3rem;
  flex-shrink: 0;
}

/* Table */
.results-panel__table {
  width: 100%;
  border-collapse: collapse;
}

.results-panel__th {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-muted);
  padding: 0.4rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.results-panel__th--rank { width: 32px; text-align: center; }
.results-panel__th--pts { text-align: right; }

.results-panel__row {
  transition: background 0.15s ease;
}

.results-panel__row:hover {
  background: rgba(201, 162, 39, 0.04);
}

.results-panel__row:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.results-panel__cell {
  padding: 0.4rem 0.5rem;
  font-size: 0.78rem;
  color: var(--color-donks-text);
  vertical-align: middle;
}

.results-panel__cell--rank {
  text-align: center;
  font-weight: 700;
  color: var(--color-donks-text-secondary);
  font-size: 0.72rem;
}

.results-panel__cell--player {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.results-panel__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(201, 162, 39, 0.2);
  flex-shrink: 0;
}

.results-panel__username {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.results-panel__cell--pts {
  text-align: right;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
}

/* Expand/Collapse toggle */
.results-panel__toggle {
  display: block;
  width: 100%;
  padding: 0.55rem 1rem;
  margin-top: 0.25rem;
  background: rgba(201, 162, 39, 0.06);
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: var(--color-donks-gold-dark);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  border-radius: 0 0 12px 12px;
}

.results-panel__toggle:hover {
  background: rgba(201, 162, 39, 0.12);
  color: var(--color-donks-gold);
}

@media (max-width: 600px) {
  .results-panel {
    padding: 0.75rem;
  }

  .results-panel__cell {
    padding: 0.35rem 0.4rem;
    font-size: 0.72rem;
  }

  .results-panel__avatar {
    width: 20px;
    height: 20px;
  }
}
</style>
