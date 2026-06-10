<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'
import type {
  DonksPlayoffLeaderboardEntry,
  DonksPlayoffGameSummary,
  DonksPlayoffPhase,
  DonksPlayoffConfig,
  DonksPlayoffQualifier,
} from '@/types/donks'
import { getDonksCup } from '@/config/donks'

const VISIBLE_LIMIT = 10

const props = defineProps<{
  entries: DonksPlayoffLeaderboardEntry[]
  games: DonksPlayoffGameSummary[]
  phase: DonksPlayoffPhase
  config: DonksPlayoffConfig
  getAvatar: (username: string) => string
  qualifiers: DonksPlayoffQualifier[]
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const qualifierMap = computed(() => {
  const m = new Map<string, DonksPlayoffQualifier>()
  for (const q of props.qualifiers) m.set(q.username, q)
  return m
})

const isPrePlayoffs = computed(() => props.phase === 'pre_playoffs')

const expanded = ref(false)

watch(() => props.phase, () => { expanded.value = false })

const rankedEntries = computed(() => props.entries.filter((e) => e.rank > 0))
const unrankedEntries = computed(() =>
  isPrePlayoffs.value ? props.entries : props.entries.filter((e) => e.rank === 0)
)

const visibleRanked = computed(() =>
  expanded.value ? rankedEntries.value : rankedEntries.value.slice(0, VISIBLE_LIMIT)
)
const visibleUnranked = computed(() => {
  if (expanded.value) return unrankedEntries.value
  if (isPrePlayoffs.value) return unrankedEntries.value.slice(0, VISIBLE_LIMIT)
  return []
})
const hiddenCount = computed(() => {
  if (isPrePlayoffs.value) {
    return Math.max(0, unrankedEntries.value.length - VISIBLE_LIMIT)
  }
  const total = rankedEntries.value.length + unrankedEntries.value.length
  return Math.max(0, total - VISIBLE_LIMIT)
})

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

function qualLabel(q: DonksPlayoffQualifier): string {
  if (q.qualifiedVia === 'omaha_wildcard') {
    return `Omaha Wild Card (#${q.qualifyingRank})`
  }
  const cup = getDonksCup(q.qualifiedVia)
  return `Qualified via ${cup?.name ?? q.qualifiedVia} (#${q.qualifyingRank})`
}

function qualColor(q: DonksPlayoffQualifier): string {
  if (q.qualifiedVia === 'omaha_wildcard') return '#2d6a4f'
  return getDonksCup(q.qualifiedVia)?.color ?? '#888'
}
</script>

<template>
  <div class="po-lb">
    <!-- Table (renders for all phases except no_data) -->
    <div v-if="entries.length > 0" class="po-lb__scroll">
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
          <!-- Ranked entries (only when not pre_playoffs) -->
          <template v-if="!isPrePlayoffs">
            <tr
              v-for="(entry, ri) in visibleRanked"
              :key="entry.username"
              class="po-row"
              :style="{ '--rank-accent': rankAccent(entry.rank), '--ri': Math.min(ri, 8) }"
              @click="emit('row-click', entry.username)"
            >
              <td class="po-cell po-cell--rank">{{ entry.rank }}</td>
              <td class="po-cell po-cell--player">
                <PlayerAvatar :src="getAvatar(entry.username)" :username="entry.username" class="po-cell__avatar" />
                <span class="po-cell__name">{{ entry.username }}</span>
                <span v-if="qualifierMap.get(entry.username)" class="po-qual-wrap" tabindex="0">
                  <svg class="po-qual-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                  <span class="po-qual-pop">
                    <span class="po-qual-pop__dot" :style="{ background: qualColor(qualifierMap.get(entry.username)!) }" />
                    {{ qualLabel(qualifierMap.get(entry.username)!) }}
                  </span>
                </span>
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
            <tr v-if="visibleUnranked.length > 0" class="po-row po-row--divider">
              <td :colspan="4 + games.length" class="po-cell po-cell--divider-label">
                Qualified but not yet played
              </td>
            </tr>
          </template>

          <!-- Pre-playoffs header label -->
          <tr v-if="isPrePlayoffs" class="po-row po-row--divider">
            <td :colspan="4 + games.length" class="po-cell po-cell--divider-label po-cell--divider-label-pre">
              Qualified players &middot; standings will appear once playoff games are locked
            </td>
          </tr>

          <!-- Unranked / pre-playoffs entries -->
          <tr
            v-for="entry in visibleUnranked"
            :key="entry.username"
            class="po-row po-row--unranked"
            @click="emit('row-click', entry.username)"
          >
            <td class="po-cell po-cell--rank po-cell--muted">&ndash;&ndash;</td>
            <td class="po-cell po-cell--player">
              <PlayerAvatar :src="getAvatar(entry.username)" :username="entry.username" class="po-cell__avatar" />
              <span class="po-cell__name" :class="{ 'po-cell--muted': !isPrePlayoffs }">{{ entry.username }}</span>
              <span v-if="qualifierMap.get(entry.username)" class="po-qual-wrap" tabindex="0">
                <svg class="po-qual-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                <span class="po-qual-pop">
                  <span class="po-qual-pop__dot" :style="{ background: qualColor(qualifierMap.get(entry.username)!) }" />
                  {{ qualLabel(qualifierMap.get(entry.username)!) }}
                </span>
              </span>
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

    <!-- Expand button -->
    <button v-if="!expanded && hiddenCount > 0" class="po-lb__expand" @click="expanded = true">
      <span>Show remaining {{ hiddenCount }} players</span>
      <i class="i-heroicons-chevron-down-20-solid po-lb__expand-icon" />
    </button>
  </div>
</template>

<style scoped>
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
  animation: poRowFadeIn 0.3s ease both;
  animation-delay: calc(var(--ri, 0) * 0.04s);
}

.po-row:hover {
  background: rgba(201, 162, 39, 0.04);
}

.po-row--unranked {
  border-left-color: transparent;
  opacity: 0.7;
}

.po-row--unranked:hover {
  opacity: 0.9;
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
  position: relative;
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

.po-cell--divider-label-pre {
  border-top: none;
  padding-bottom: 0.5rem;
}

/* ─── Qualification Popover ─────────────────────────────── */

.po-qual-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  z-index: 1;
  cursor: help;
  margin-left: 0.1rem;
  flex-shrink: 0;
}

.po-qual-icon {
  width: 13px;
  height: 13px;
  color: var(--color-donks-text-muted);
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.po-qual-wrap:hover,
.po-qual-wrap:focus-within {
  z-index: 50;
}

.po-qual-wrap:hover .po-qual-icon,
.po-qual-wrap:focus-within .po-qual-icon {
  opacity: 1;
  color: var(--color-donks-gold);
}

.po-qual-pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.08));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 0.68rem;
  font-weight: 600;
  font-style: normal;
  color: var(--color-donks-text);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 100;
}

.po-qual-pop::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: var(--color-donks-card-border, rgba(0, 0, 0, 0.08));
}

.po-qual-pop::after {
  content: '';
  position: absolute;
  bottom: calc(100% - 1px);
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: var(--color-donks-card-bg, rgba(255, 255, 255, 0.95));
}

.po-qual-wrap:hover .po-qual-pop,
.po-qual-wrap:focus-within .po-qual-pop {
  opacity: 1;
}

.po-qual-pop__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Row Entrance Animation ────────────────────────────── */

@keyframes poRowFadeIn {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .po-row { animation: none; }
}

/* ─── Expand Button ─────────────────────────────────────── */

.po-lb__expand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 0.25rem;
  border: none;
  border-top: 1px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.06));
  background: none;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-donks-text-muted);
  transition: color 0.15s ease;
}

.po-lb__expand:hover {
  color: var(--color-donks-gold, #c9a227);
}

.po-lb__expand-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.po-lb__expand:hover .po-lb__expand-icon {
  transform: translateY(2px);
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
