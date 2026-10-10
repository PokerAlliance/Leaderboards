<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getLeagueConfig } from '@/config/leagues'
import { useDonksStore } from '@/composables/useDonksStore'
import type { DonksMilestoneEvent } from '@/types/donks'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksMilestoneTimeline from './components/DonksMilestoneTimeline.vue'
import DonksMilestoneContenders from './components/DonksMilestoneContenders.vue'
import DonksGamesPlayedTable from './components/DonksGamesPlayedTable.vue'
import DonksMilestoneShareModal from './components/DonksMilestoneShareModal.vue'
import DonksUserModal from './components/DonksUserModal.vue'

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const rows = computed(() => store.gamesPlayedLeaderboard.value)
const events = computed(() => store.milestoneEvents.value)
const contenders = computed(() => store.milestoneContenders.value)

const totalGames = computed(() => rows.value.reduce((sum, r) => sum + r.gamesPlayed, 0))
const ironDonk = computed(() => rows.value[0] ?? null)

const selectedEvent = ref<DonksMilestoneEvent | null>(null)
const selectedUsername = ref<string | null>(null)

function openStats(username: string) {
  selectedEvent.value = null
  selectedUsername.value = username
}
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="ms-page">
        <!-- Header -->
        <header class="ms-page__header donks-card">
          <RouterLink to="/league/donks" class="donks-btn donks-btn--outline ms-page__back">
            ← Back to Donks
          </RouterLink>
          <p class="ms-page__eyebrow">♠ ♥ Hall of Grinders ♦ ♣</p>
          <h1 class="ms-page__title">Donks Milestones</h1>
          <p class="ms-page__subtitle">Every hand counts. Every 500 games, a legend is made.</p>
        </header>

        <!-- Stats strip -->
        <div class="ms-page__stats">
          <div class="ms-stat">
            <span class="ms-stat__value">{{ totalGames.toLocaleString('en-US') }}</span>
            <span class="ms-stat__label">Seats taken, all time</span>
          </div>
          <div class="ms-stat">
            <span class="ms-stat__value">{{ rows.length.toLocaleString('en-US') }}</span>
            <span class="ms-stat__label">Players tracked</span>
          </div>
          <div v-if="ironDonk" class="ms-stat">
            <span class="ms-stat__value ms-stat__value--name">{{ ironDonk.username }}</span>
            <span class="ms-stat__label">Iron Donk · {{ ironDonk.gamesPlayed.toLocaleString('en-US') }} games</span>
          </div>
          <div class="ms-stat">
            <span class="ms-stat__value">{{ events.length }}</span>
            <span class="ms-stat__label">Milestones celebrated</span>
          </div>
        </div>

        <!-- Timeline -->
        <section class="ms-page__section">
          <h2 class="ms-page__h2"><i class="i-lucide-trophy" /> Milestone Timeline</h2>
          <DonksMilestoneTimeline :events="events" :get-avatar="store.getAvatar" @select="selectedEvent = $event" />
        </section>

        <!-- On the brink -->
        <section v-if="contenders.length > 0" class="ms-page__section donks-card ms-page__panel">
          <h2 class="ms-page__h2 ms-page__h2--dark"><i class="i-lucide-flame" /> On the Brink</h2>
          <p class="ms-page__hint">Closest to their next milestone</p>
          <DonksMilestoneContenders :rows="contenders" :get-avatar="store.getAvatar" @select="openStats" />
        </section>

        <!-- All players -->
        <section class="ms-page__section donks-card ms-page__panel">
          <h2 class="ms-page__h2 ms-page__h2--dark"><i class="i-lucide-users" /> Games Played — All Players</h2>
          <DonksGamesPlayedTable :rows="rows" :get-avatar="store.getAvatar" @row-click="openStats" />
        </section>

        <footer class="ms-page__footer">
          <p>
            The timeline shows each player's most recent milestone. Milestone tracking began in October 2026.
          </p>
          <div class="ms-page__footer-suits">♠ ♥ ♦ ♣</div>
        </footer>
      </div>
    </DonksLoadingGate>

    <DonksMilestoneShareModal
      :event="selectedEvent"
      :get-avatar="store.getAvatar"
      @close="selectedEvent = null"
      @view-stats="openStats"
    />

    <DonksUserModal
      :username="selectedUsername"
      game-type="holdem"
      @close="selectedUsername = null"
    />
  </main>
</template>

<style scoped>
.ms-page {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6, 1.5rem);
  padding-top: var(--space-8, 2rem);
}

/* Header */
.ms-page__header {
  position: relative;
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 3px solid var(--color-donks-gold);
  margin-bottom: 1rem;
}

.ms-page__back {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.72rem;
}

.ms-page__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-donks-gold-dark);
}

.ms-page__title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 800;
  margin: 0 0 0.35rem;
  background: linear-gradient(180deg, #1a1a2e 30%, #7b1c2e 120%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ms-page__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-donks-text-secondary);
}

/* Stats strip */
.ms-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.ms-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.9rem 0.75rem;
  border-radius: 12px;
  text-align: center;
  color: #f5f0e8;
  background: radial-gradient(ellipse at top, #1f6b3b, #0d3520 80%);
  border: 1px solid rgba(228, 201, 90, 0.45);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
}

.ms-stat__value {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.1;
  color: #f3dc85;
  font-variant-numeric: tabular-nums;
}

.ms-stat__value--name {
  max-width: 100%;
  font-size: 1.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-stat__label {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.7);
}

/* Sections */
.ms-page__section {
  margin-bottom: 1.5rem;
}

.ms-page__panel {
  padding: 1.25rem;
}

.ms-page__h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}

.ms-page__h2 i { color: var(--color-donks-gold-light); }

.ms-page__h2--dark {
  margin-bottom: 0.25rem;
  color: var(--color-donks-text);
  text-shadow: none;
}

.ms-page__h2--dark i { color: var(--color-donks-gold-dark); }

.ms-page__hint {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  color: var(--color-donks-text-muted);
}

.ms-page__panel .ms-page__h2--dark + :not(.ms-page__hint) {
  margin-top: 0.75rem;
}

/* Footer */
.ms-page__footer {
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 162, 39, 0.15);
}

.ms-page__footer p {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  color: var(--color-donks-text-muted);
}

.ms-page__footer-suits {
  letter-spacing: 0.5em;
  color: var(--color-donks-gold);
  opacity: 0.35;
  font-weight: 700;
}

@media (max-width: 600px) {
  .ms-page { padding: 1rem; }
  .ms-page__header { padding: 1.5rem 1rem 1rem; }
  .ms-page__back {
    position: static;
    display: inline-block;
    margin-bottom: 0.75rem;
  }
}
</style>
