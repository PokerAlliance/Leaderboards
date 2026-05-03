<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksCupSlug, DonksQuarterKey } from '@/types/donks'
import { getLeagueConfig } from '@/config/leagues'
import { getDonksCup, getCurrentDonksQuarter } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksQuarterSelector from './components/DonksQuarterSelector.vue'
import DonksLeaderboardTable from './components/DonksLeaderboardTable.vue'
import DonksCompositeContextCard from './components/DonksCompositeContextCard.vue'
import DonksGameResultsPanel from './components/DonksGameResultsPanel.vue'
import DonksGameHistoryList from './components/DonksGameHistoryList.vue'

const props = defineProps<{ cupSlug: string }>()

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const cup = computed(() => getDonksCup(props.cupSlug as DonksCupSlug))
const cupName = computed(() => cup.value?.name ?? props.cupSlug)

const backRoute = computed(() =>
  cup.value?.gameType === 'omaha'
    ? '/league/donks/omaha'
    : '/league/donks/holdem'
)

const backLabel = computed(() =>
  cup.value?.gameType === 'omaha'
    ? '← Omaha Leaderboards'
    : '← Hold\'em Leaderboards'
)

const dayLabels: Record<string, string> = {
  monday: 'Monday',
  wednesday: 'Wednesday',
  sunday: 'Sunday',
}

const selectedQuarter = ref<DonksQuarterKey>(
  store.loadedQuarter.value ?? getCurrentDonksQuarter()
)

const cutoffDate = computed<Date | null>(() => {
  if (!selectedGameId.value || !cup.value) return null
  const g = store.games.value.find((g) => g.gameId === selectedGameId.value)
  return g?.gameDate ?? null
})

const isLatestSelected = computed(() => {
  if (!cup.value || !selectedGameId.value) return true
  const cupGames = store.getGamesForCup(cup.value.slug)
  return cupGames.length > 0 && cupGames[0]!.gameId === selectedGameId.value
})

const cupEntries = computed(() => {
  if (!cup.value) return []
  if (!cutoffDate.value || isLatestSelected.value) {
    return store.getCupLeaderboard(cup.value.slug)
  }
  const cutoff = cutoffDate.value
  const allResults = store.playerResults.value.filter((r) => r.cupSlug === cup.value!.slug)
  const allGames = store.games.value.filter((g) => g.cupSlug === cup.value!.slug)
  return store.buildLeaderboardAtCutoff(allResults, cutoff, allGames)
})

const selectedGameId = ref<string | null>(null)
const selectedTournamentId = ref<number | null>(null)
const showFutureMessage = ref(false)

function selectMostRecent() {
  showFutureMessage.value = false
  if (!cup.value) return
  const cupGames = store.getGamesForCup(cup.value.slug)
  if (cupGames.length > 0) {
    const latest = cupGames[0]!
    selectedGameId.value = latest.gameId
    selectedTournamentId.value = latest.tournamentId
  } else {
    const recent = store.recentTournaments.value[cup.value.slug]
    if (recent) {
      selectedGameId.value = null
      selectedTournamentId.value = recent.tournamentId
    } else {
      selectedGameId.value = null
      selectedTournamentId.value = null
    }
  }
}

selectMostRecent()

function onSelectGame(payload: { gameId: string; tournamentId: number }) {
  showFutureMessage.value = false
  selectedGameId.value = payload.gameId
  selectedTournamentId.value = payload.tournamentId
}

function onSelectLive(payload: { tournamentId: number }) {
  showFutureMessage.value = false
  selectedGameId.value = null
  selectedTournamentId.value = payload.tournamentId
}

function onSelectFuture() {
  showFutureMessage.value = true
  selectedGameId.value = null
  selectedTournamentId.value = null
}

watch(selectedQuarter, async (newQ) => {
  const loaded = store.loadedQuarter.value
  if (loaded && loaded.quarter === newQ.quarter && loaded.year === newQ.year) return
  await store.loadQuarter(newQ)
  selectMostRecent()
})

watch(() => props.cupSlug, () => {
  selectMostRecent()
})
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="donks-cup">
        <!-- Header Card (contains back, title, quarter selector, AND timeline) -->
        <div class="donks-cup__header" :style="{ '--cup-color': cup?.color }">
          <div class="donks-cup__header-top">
            <RouterLink :to="backRoute" class="donks-btn donks-btn--outline donks-cup__back">
              {{ backLabel }}
            </RouterLink>
            <DonksQuarterSelector v-model="selectedQuarter" />
          </div>
          <h1 class="donks-cup__title">{{ cupName }}</h1>
          <p class="donks-cup__subtitle" v-if="cup">
            {{ dayLabels[cup.day] ?? cup.day }} · {{ cup.timeET }} ET ·
            {{ cup.gameType === 'holdem' ? 'NL Hold\'em' : 'PLO8 Omaha' }}
          </p>

          <!-- Timeline integrated in header -->
          <div class="donks-cup__timeline">
            <DonksGameHistoryList
              v-if="cup"
              :cup-slug="cup.slug"
              :selected-game-id="selectedGameId"
              :selected-tournament-id="selectedTournamentId"
              :quarter="selectedQuarter"
              @select-game="onSelectGame"
              @select-live="onSelectLive"
              @select-future="onSelectFuture"
            />
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="donks-cup__grid">
          <!-- Left: Composite Context -->
          <div class="donks-cup__context">
            <DonksCompositeContextCard
              v-if="cup"
              :composite-slug="cup.compositeSlug"
              :cutoff-date="isLatestSelected ? null : cutoffDate"
            />
          </div>

          <!-- Right: Game Results or Future placeholder -->
          <div class="donks-cup__results">
            <div v-if="showFutureMessage" class="donks-cup__future-msg donks-card">
              <div class="donks-cup__future-icon">🃏</div>
              <h3 class="donks-cup__future-title">Game hasn't started yet</h3>
              <p class="donks-cup__future-desc">
                This game is scheduled for a future date. Results will appear here once the tournament begins.
              </p>
            </div>
            <DonksGameResultsPanel
              v-else-if="cup"
              :cup-slug="cup.slug"
              :selected-game-id="selectedGameId"
              :selected-tournament-id="selectedTournamentId"
            />
          </div>
        </div>

        <!-- Cup Leaderboard -->
        <section class="donks-cup__leaderboard donks-card">
          <div class="donks-cup__lb-header">
            <h2 class="donks-cup__lb-title">{{ cupName }} Leaderboard</h2>
            <p class="donks-cup__lb-desc">
              Best 9 scores · This quarter
              <span v-if="cutoffDate && !isLatestSelected" class="donks-cup__cutoff-badge">
                · Data up to {{ cutoffDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}
              </span>
            </p>
          </div>
          <DonksLeaderboardTable
            :entries="cupEntries"
            :get-avatar="store.getAvatar"
            :collapsible="10"
          />
        </section>
      </div>
    </DonksLoadingGate>
  </main>
</template>

<style scoped>
.donks-page {
  min-height: 100vh;
  position: relative;
}

.donks-cup {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

/* Header Card */
.donks-cup__header {
  background: var(--color-donks-card-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 1.25rem 1.5rem 0.75rem;
  border: 1px solid var(--color-donks-card-border);
  border-top: 3px solid var(--cup-color, var(--color-donks-gold));
  box-shadow: var(--shadow-donks-card);
  margin-bottom: 1.5rem;
}

.donks-cup__header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.donks-cup__back {
  font-size: 0.72rem;
  padding: 0.4em 0.85em;
}

.donks-cup__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3.5vw, 2.2rem);
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.2rem;
}

.donks-cup__subtitle {
  font-size: 0.82rem;
  color: var(--color-donks-text-secondary);
  margin: 0 0 0.75rem;
}

.donks-cup__timeline {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 0.5rem;
}

/* Main Grid */
.donks-cup__grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.donks-cup__context {
  min-width: 0;
}

.donks-cup__results {
  min-width: 0;
}

/* Future game placeholder */
.donks-cup__future-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  border-top: 3px solid var(--cup-color, var(--color-donks-gold));
  min-height: 200px;
}

.donks-cup__future-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.donks-cup__future-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-donks-text);
  margin: 0 0 0.4rem;
}

.donks-cup__future-desc {
  font-size: 0.82rem;
  color: var(--color-donks-text-muted);
  margin: 0;
  max-width: 320px;
}

/* Leaderboard Section */
.donks-cup__leaderboard {
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.donks-cup__lb-header {
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 0.5rem;
}

.donks-cup__lb-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.1rem;
}

.donks-cup__lb-desc {
  font-size: 0.72rem;
  color: var(--color-donks-text-muted);
  margin: 0;
}

.donks-cup__cutoff-badge {
  color: var(--color-donks-gold-dark);
  font-weight: 600;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .donks-cup__grid {
    grid-template-columns: 1fr;
  }

  .donks-cup {
    padding: 2rem 1rem 3rem;
  }

  .donks-cup__header-top {
    flex-wrap: wrap;
  }
}
</style>
