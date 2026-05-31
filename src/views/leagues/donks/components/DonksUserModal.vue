<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { DonksGameType, DonksCupSlug, DonksLeaderboardEntry, DonksGameHistory, DonksHallOfFameEntry } from '@/types/donks'
import { getCupsByGameType } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'

const props = defineProps<{
  username: string | null
  gameType: DonksGameType
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useDonksStore()
const activeTab = ref<DonksCupSlug | null>(null)

const relevantCups = computed(() => getCupsByGameType(props.gameType))

const compositeLeaderboard = computed<DonksLeaderboardEntry[]>(() => {
  if (props.gameType === 'holdem') return store.getHoldemComposite()
  return store.getOmahaComposite()
})

const playerCompositeEntry = computed(() =>
  compositeLeaderboard.value.find((e) => e.username === props.username) ?? null
)

const cupRecap = computed(() =>
  relevantCups.value.map((cup) => {
    const lb = store.getCupLeaderboard(cup.slug)
    const entry = lb.find((e) => e.username === props.username)
    return {
      cup,
      rank: entry?.rank ?? null,
      points: entry?.totalPoints ?? 0,
      games: entry?.gamesPlayed ?? 0,
    }
  })
)

const tabHistory = computed<DonksGameHistory[]>(() => {
  if (!props.username || !activeTab.value) return []
  return store.getPlayerHistory(props.username, activeTab.value)
})

const allTimeGames = computed(() => store.getAllTimeGamesPlayed(props.username ?? ''))
const hofEntry = computed<DonksHallOfFameEntry | null>(() => store.getHallOfFameEntry(props.username ?? ''))

watch(
  () => props.username,
  (name) => {
    if (name && relevantCups.value.length > 0) {
      activeTab.value = relevantCups.value[0]!.slug
    }
  },
  { immediate: true }
)

function formatPoints(pts: number): string {
  return Math.round(pts).toLocaleString()
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.classList.contains('modal-overlay')) {
    emit('close')
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onEscape))
onUnmounted(() => document.removeEventListener('keydown', onEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="username"
        class="modal-overlay theme-donks"
        @mousedown="onClickOutside"
      >
        <div class="modal-panel donks-card">
          <button class="modal-close" @click="emit('close')">&#10005;</button>

          <!-- Header -->
          <div class="modal-header">
            <img
              :src="store.getAvatar(username)"
              :alt="username"
              class="modal-avatar"
            />
            <div class="modal-header__info">
              <h2 class="modal-header__name">{{ username }}</h2>
              <span
                v-if="playerCompositeEntry"
                class="modal-header__rank"
              >
                Rank #{{ playerCompositeEntry.rank }}
                &middot;
                {{ formatPoints(playerCompositeEntry.totalPoints) }} pts
              </span>
              <span v-else class="modal-header__rank">Not ranked</span>
            </div>
          </div>

          <!-- All-Time Stats -->
          <div v-if="allTimeGames > 0 || hofEntry" class="modal-section modal-section--stats">
            <div class="modal-stats-row">
              <div v-if="allTimeGames > 0" class="modal-stat">
                <span class="modal-stat__value">{{ allTimeGames.toLocaleString() }}</span>
                <span class="modal-stat__label">All-Time Games</span>
              </div>
              <div v-if="hofEntry" class="modal-stat modal-stat--hof">
                <span class="modal-stat__value">Hall of Fame</span>
                <span class="modal-stat__label">
                  {{ hofEntry.goldenCrowns + hofEntry.silverCrowns + hofEntry.bronzeCrowns
                     + hofEntry.annualChampionship + hofEntry.tournamentOfChampions
                     + hofEntry.allDonksInPlayoffs + hofEntry.omaha }} awards
                </span>
              </div>
            </div>
          </div>

          <!-- Cup Recap -->
          <div class="modal-section">
            <h3 class="modal-section__title">Cup Summary</h3>
            <table class="recap-table">
              <thead>
                <tr>
                  <th>Cup</th>
                  <th>Rank</th>
                  <th>Points</th>
                  <th>Games</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in cupRecap" :key="row.cup.slug">
                  <td>
                    <span class="recap-cup-dot" :style="{ background: row.cup.color }" />
                    {{ row.cup.shortName }}
                  </td>
                  <td>{{ row.rank ? `#${row.rank}` : '—' }}</td>
                  <td>{{ formatPoints(row.points) }}</td>
                  <td>{{ row.games }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Game History Tabs -->
          <div class="modal-section">
            <h3 class="modal-section__title">Game History</h3>
            <div class="tab-bar">
              <button
                v-for="cup in relevantCups"
                :key="cup.slug"
                class="tab-btn"
                :class="{ 'tab-btn--active': activeTab === cup.slug }"
                :style="activeTab === cup.slug ? { '--tab-color': cup.color } : {}"
                @click="activeTab = cup.slug"
              >
                {{ cup.shortName }}
              </button>
            </div>

            <div class="history-scroll">
              <table v-if="tabHistory.length > 0" class="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pos</th>
                    <th>Players</th>
                    <th>Points</th>
                    <th>Best 9?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in tabHistory" :key="g.gameId">
                    <td>{{ formatDate(g.gameDate) }}</td>
                    <td class="history-pos">{{ g.finishPosition }} / {{ g.totalPlayers }}</td>
                    <td>{{ g.totalPlayers }}</td>
                    <td class="history-pts">{{ formatPoints(g.pointsEarned) }}</td>
                    <td class="history-counted">
                      <span v-if="g.countedInBest9" class="counted-yes">&#10003;</span>
                      <span v-else class="counted-no">&mdash;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="history-empty">No games played in this cup yet.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

/* Panel */
.modal-panel {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 16px !important;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  font-size: 0.85rem;
  color: var(--color-donks-text-muted);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--color-donks-text);
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
}

.modal-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid var(--color-donks-gold);
  box-shadow: 0 2px 12px rgba(201, 162, 39, 0.2);
  flex-shrink: 0;
}

.modal-header__name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.15rem;
}

.modal-header__rank {
  font-size: 0.8rem;
  color: var(--color-donks-text-secondary);
  font-weight: 600;
}

/* All-Time Stats */
.modal-section--stats {
  margin-bottom: 1.25rem;
}

.modal-stats-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.modal-stat {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: rgba(201, 162, 39, 0.06);
  border: 1px solid rgba(201, 162, 39, 0.12);
}

.modal-stat__value {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-donks-text);
}

.modal-stat__label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-text-muted);
}

.modal-stat--hof {
  background: linear-gradient(135deg, rgba(201, 162, 39, 0.1) 0%, rgba(201, 162, 39, 0.04) 100%);
  border-color: rgba(201, 162, 39, 0.25);
}

.modal-stat--hof .modal-stat__value {
  color: var(--color-donks-gold, #c9a227);
}

/* Section */
.modal-section {
  margin-bottom: 1.25rem;
}

.modal-section__title {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-muted);
  margin: 0 0 0.6rem;
}

/* Recap Table */
.recap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.recap-table th {
  text-align: left;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-donks-text-muted);
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.recap-table td {
  padding: 0.4rem 0.5rem;
  color: var(--color-donks-text);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.recap-cup-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.35rem;
  vertical-align: middle;
}

/* Tabs */
.tab-bar {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.35em 0.75em;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  background: transparent;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-donks-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.03);
}

.tab-btn--active {
  background: color-mix(in srgb, var(--tab-color, var(--color-donks-gold)) 12%, transparent);
  border-color: var(--tab-color, var(--color-donks-gold));
  color: var(--tab-color, var(--color-donks-gold));
}

/* History Table */
.history-scroll {
  max-height: 240px;
  overflow-y: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.history-table th {
  text-align: left;
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-donks-text-muted);
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: var(--color-donks-card-bg);
}

.history-table td {
  padding: 0.35rem 0.4rem;
  color: var(--color-donks-text);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.history-pos {
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
}

.history-pts {
  font-weight: 700;
  font-family: var(--font-mono, monospace);
}

.history-counted {
  text-align: center;
}

.counted-yes {
  color: #16a34a;
  font-weight: 700;
}

.counted-no {
  color: var(--color-donks-text-muted);
}

.history-empty {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--color-donks-text-muted);
  font-size: 0.78rem;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: translateY(16px) scale(0.97);
}

.modal-leave-to .modal-panel {
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 600px) {
  .modal-panel {
    max-height: 90vh;
    padding: 1rem;
    border-radius: 12px !important;
  }

  .modal-avatar {
    width: 48px;
    height: 48px;
  }

  .modal-header__name {
    font-size: 1rem;
  }

  .tab-btn {
    font-size: 0.62rem;
    padding: 0.3em 0.55em;
  }
}
</style>
