<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksQuarterKey } from '@/types/donks'
import { getLeagueConfig } from '@/config/leagues'
import { getCurrentDonksQuarter, getCupsByGameType, getMedalForGameType } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksQuarterSelector from './components/DonksQuarterSelector.vue'
import DonksLeaderboardTable from './components/DonksLeaderboardTable.vue'
import DonksCupCard from './components/DonksCupCard.vue'
import DonksUserModal from './components/DonksUserModal.vue'
import DonksRaceChart from './components/DonksRaceChart.vue'

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const selectedQuarter = ref<DonksQuarterKey>(
  store.loadedQuarter.value ?? getCurrentDonksQuarter()
)

const medal = getMedalForGameType('omaha')!
const cups = getCupsByGameType('omaha')

const compositeEntries = computed(() => store.getOmahaComposite())
const cupEntries = computed(() =>
  cups.map((cup) => ({
    cup,
    entries: store.getCupLeaderboard(cup.slug),
  }))
)

const selectedPlayer = ref<string | null>(null)

function onPlayerClick(username: string) {
  selectedPlayer.value = username
}

watch(selectedQuarter, async (newQ) => {
  const loaded = store.loadedQuarter.value
  if (loaded && loaded.quarter === newQ.quarter && loaded.year === newQ.year) return
  await store.loadQuarter(newQ)
})
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="donks-omaha">
        <!-- Page Header -->
        <div class="donks-omaha__header">
          <RouterLink to="/league/donks" class="donks-btn donks-btn--outline donks-omaha__back">
            ← Donks Home
          </RouterLink>
          <div class="donks-omaha__header-left">
            <h1 class="donks-omaha__title">Omaha Leaderboards</h1>
            <p class="donks-omaha__subtitle">
              {{ medal.name }} &middot;
              <span v-for="(cup, i) in cups" :key="cup.slug">
                {{ cup.shortName }}<span v-if="i < cups.length - 1"> &middot; </span>
              </span>
            </p>
          </div>
          <DonksQuarterSelector v-model="selectedQuarter" />
        </div>

        <!-- Composite Medal Leaderboard -->
        <section class="donks-omaha__composite donks-card">
          <div class="composite-header">
            <div class="composite-icon">&#127941;</div>
            <div>
              <h2 class="composite-title">{{ medal.name }}</h2>
              <p class="composite-desc">Best 9 scores across both PLO8 opens</p>
            </div>
          </div>
          <DonksLeaderboardTable
            :entries="compositeEntries"
            :get-avatar="store.getAvatar"
            :collapsible="5"
            @row-click="onPlayerClick"
          />
        </section>

       

        <!-- Cup Cards Grid -->
        <section class="donks-omaha__cups">
          <h2 class="donks-section-title">Individual Open Standings</h2>
          <div class="cups-grid">
            <DonksCupCard
              v-for="{ cup, entries } in cupEntries"
              :key="cup.slug"
              :cup="cup"
              :entries="entries"
              :get-avatar="store.getAvatar"
              @player-click="onPlayerClick"
            />
          </div>
        </section>
        <!-- Points Race Chart -->
        <section class="donks-omaha__race donks-card">
          <div class="race-header">
            <div class="race-icon">&#128200;</div>
            <div>
              <h2 class="race-title">Points Race</h2>
              <p class="race-desc">Cumulative best-9 total evolving game by game</p>
            </div>
          </div>
          <DonksRaceChart game-type="omaha" @player-click="onPlayerClick" />
        </section>
        <!-- Player Modal -->
        <DonksUserModal
          :username="selectedPlayer"
          game-type="omaha"
          @close="selectedPlayer = null"
        />
      </div>
    </DonksLoadingGate>
  </main>
</template>

<style scoped>
.donks-page {
  min-height: 100vh;
  position: relative;
}

.donks-omaha {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

/* Page Header -- frosted bar */
.donks-omaha__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  background: var(--color-donks-card-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-donks-card-border);
  box-shadow: var(--shadow-donks-card);
}

.donks-omaha__back {
  font-size: 0.72rem;
  padding: 0.4em 0.85em;
  flex-shrink: 0;
}

.donks-omaha__title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.25rem;
}

.donks-omaha__subtitle {
  font-size: 0.82rem;
  color: var(--color-donks-text-secondary);
  margin: 0;
}

/* Composite Section */
.donks-omaha__composite {
  padding: 1.25rem;
  margin-bottom: 1.75rem;
}

.composite-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 0.5rem;
}

.composite-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.composite-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.1rem;
}

.composite-desc {
  font-size: 0.78rem;
  color: var(--color-donks-text-muted);
  margin: 0;
}

/* Points Race */
.donks-omaha__race {
  padding: 1.25rem;
  margin-top: 1.75rem;
  border-top: 3px solid var(--color-donks-felt);
}

.race-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 0.75rem;
}

.race-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.race-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.1rem;
}

.race-desc {
  font-size: 0.75rem;
  color: var(--color-donks-text-muted);
  margin: 0;
}

/* Cup Grid (2-col for Omaha since only 2 cups) */
.donks-omaha__cups {
  margin-top: 1.25rem;
}

.cups-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

@media (max-width: 700px) {
  .cups-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .donks-omaha {
    padding: 2rem 1rem 3rem;
  }

  .donks-omaha__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .donks-omaha__composite {
    padding: 1rem;
  }
}
</style>
