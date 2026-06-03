<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksQuarterKey } from '@/types/donks'
import { getLeagueConfig } from '@/config/leagues'
import { getCurrentDonksQuarter } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksQuarterSelector from './components/DonksQuarterSelector.vue'
import DonksPlayoffExplainer from './components/DonksPlayoffExplainer.vue'
import DonksPlayoffTimeline from './components/DonksPlayoffTimeline.vue'
import DonksPlayoffLeaderboard from './components/DonksPlayoffLeaderboard.vue'
import DonksPlayoffPodium from './components/DonksPlayoffPodium.vue'
import DonksPlayoffGameResults from './components/DonksPlayoffGameResults.vue'
import DonksPlayoffQualifiers from './components/DonksPlayoffQualifiers.vue'
import DonksUserModal from './components/DonksUserModal.vue'

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const selectedQuarter = ref<DonksQuarterKey>(
  store.loadedQuarter.value ?? getCurrentDonksQuarter()
)

const playoffState = computed(() => store.getPlayoffState())
const config = computed(() => store.effectivePlayoffConfig.value)

const selectedGameId = ref<string | null>(null)
const selectedUsername = ref<string | null>(null)
const gameResultsEl = ref<HTMLElement | null>(null)

function onGameSelect(gameId: string) {
  selectedGameId.value = gameId
  nextTick(() => {
    gameResultsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

watch(selectedQuarter, async (newQ) => {
  selectedGameId.value = null
  const loaded = store.loadedQuarter.value
  if (loaded && loaded.quarter === newQ.quarter && loaded.year === newQ.year) return
  await store.loadQuarter(newQ)
})

const phaseBadge = computed(() => {
  switch (playoffState.value.phase) {
    case 'pre_playoffs':
      return { label: 'UPCOMING', cls: 'po-phase--upcoming' }
    case 'playoffs_active':
      return { label: 'IN PROGRESS', cls: 'po-phase--active' }
    case 'playoffs_complete':
      return { label: 'COMPLETE', cls: 'po-phase--complete' }
    default:
      return null
  }
})
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="po-page">
        <!-- Header -->
        <div class="po-page__header donks-card">
          <RouterLink to="/league/donks" class="donks-btn donks-btn--outline po-page__back">
            ← Back to Donks
          </RouterLink>

          <div class="po-page__header-right">
            <DonksQuarterSelector v-model="selectedQuarter" />
          </div>

          <h1 class="po-page__title">The FatnSassy Playoffs</h1>
          <p class="po-page__subtitle">Season-ending showdown for the top qualifiers</p>

          <span v-if="phaseBadge" class="po-phase-badge" :class="phaseBadge.cls">
            <span v-if="playoffState.phase === 'playoffs_complete'" class="po-phase-badge__icon">&#127942;</span>
            {{ phaseBadge.label }}
          </span>
        </div>

        <!-- No data -->
        <div v-if="playoffState.phase === 'no_data'" class="donks-card po-page__no-data">
          <p>Playoff data not available for this quarter.</p>
        </div>

        <!-- Main content (all other phases) -->
        <template v-else>
          <!-- Explainer -->
          <DonksPlayoffExplainer :config="config" />

          <!-- Timeline -->
          <section class="donks-card po-page__section">
            <h2 class="po-page__section-title">Playoff Games</h2>
            <DonksPlayoffTimeline
              :games="playoffState.playoffGames"
              :selected-game-id="selectedGameId"
              @select="onGameSelect"
            />
          </section>

          <!-- Game Results (when a game is selected) -->
          <section v-if="selectedGameId" ref="gameResultsEl" class="donks-card po-page__section">
            <h2 class="po-page__section-title">Game Results</h2>
            <DonksPlayoffGameResults
              :game-id="selectedGameId"
              :games="playoffState.playoffGames"
              :qualifiers="playoffState.qualifiers"
              :config="config"
              :get-avatar="store.getAvatar"
              @row-click="selectedUsername = $event"
            />
          </section>

          <!-- Podium (completed quarters) -->
          <DonksPlayoffPodium
            v-if="playoffState.phase === 'playoffs_complete' && playoffState.leaderboard.length >= 3"
            :entries="playoffState.leaderboard.slice(0, 3)"
            :get-avatar="store.getAvatar"
          />

          <!-- Leaderboard -->
          <section class="donks-card po-page__section">
            <h2 class="po-page__section-title">Playoff Standings</h2>
            <DonksPlayoffLeaderboard
              :entries="playoffState.leaderboard"
              :games="playoffState.playoffGames"
              :phase="playoffState.phase"
              :config="config"
              :get-avatar="store.getAvatar"
              :qualifiers="playoffState.qualifiers"
              @row-click="selectedUsername = $event"
            />
          </section>

          <!-- Qualification Breakdown -->
          <section class="donks-card po-page__section">
            <h2 class="po-page__section-title">How They Qualified</h2>
            <DonksPlayoffQualifiers
              :qualifiers="playoffState.qualifiers"
              :config="config"
              :phase="playoffState.phase"
              :get-avatar="store.getAvatar"
              @row-click="selectedUsername = $event"
            />
          </section>
        </template>

        <!-- Footer -->
        <footer class="po-page__footer donks-home__frosted">
          <div class="po-page__footer-divider" />
          <div class="po-page__footer-suits">♠ ♥ ♦ ♣</div>
        </footer>
      </div>
    </DonksLoadingGate>

    <DonksUserModal
      :username="selectedUsername"
      game-type="holdem"
      @close="selectedUsername = null"
    />
  </main>
</template>

<style scoped>
.po-page {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6, 1.5rem);
  padding-top: var(--space-8, 2rem);
}

/* ─── Header ────────────────────────────────────────────── */

.po-page__header {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 3px solid var(--color-donks-gold);
  margin-bottom: 1rem;
  position: relative;
}

.po-page__back {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.72rem;
}

.po-page__header-right {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.po-page__title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.35rem;
  text-shadow: 0 2px 12px rgba(201, 162, 39, 0.15);
}

.po-page__subtitle {
  font-size: 0.88rem;
  color: var(--color-donks-text-secondary);
  margin: 0 0 0.6rem;
}

/* ─── Phase Badge ───────────────────────────────────────── */

.po-phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.po-phase--upcoming {
  color: #92400e;
  background: rgba(146, 64, 14, 0.08);
  border: 1px solid rgba(146, 64, 14, 0.2);
}

.po-phase--active {
  color: #166534;
  background: rgba(22, 101, 52, 0.08);
  border: 1px solid rgba(22, 101, 52, 0.2);
  animation: subtlePulse 3s ease-in-out infinite;
}

.po-phase--complete {
  color: #92400e;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(201, 162, 39, 0.06) 100%);
  border: 1px solid rgba(201, 162, 39, 0.3);
}

.po-phase-badge__icon {
  font-size: 0.72rem;
}

@keyframes subtlePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ─── Sections ──────────────────────────────────────────── */

.po-page__section {
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.po-page__section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-muted);
  margin: 0 0 0.75rem;
}

/* ─── No Data ───────────────────────────────────────────── */

.po-page__no-data {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: var(--color-donks-text-secondary);
  font-size: 0.88rem;
}

/* ─── Footer ────────────────────────────────────────────── */

.po-page__footer {
  text-align: center;
  padding: 1.25rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.po-page__footer-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-donks-gold), transparent);
  border-radius: 2px;
}

.po-page__footer-suits {
  font-size: 1rem;
  letter-spacing: 0.5em;
  color: var(--color-donks-gold);
  opacity: 0.25;
  font-weight: 700;
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 600px) {
  .po-page__header {
    padding: 1.5rem 1rem 1rem;
  }

  .po-page__back {
    position: static;
    margin-bottom: 0.75rem;
  }

  .po-page__header-right {
    position: static;
    margin-bottom: 0.75rem;
  }

  .po-page__section {
    padding: 0.75rem;
  }
}
</style>
