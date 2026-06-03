<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getLeagueConfig } from '@/config/leagues'
import { useDonksStore } from '@/composables/useDonksStore'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksHallOfFameTable from './components/DonksHallOfFameTable.vue'
import DonksHallOfFameExplainer from './components/DonksHallOfFameExplainer.vue'
import DonksHallOfFameStatsBar from './components/DonksHallOfFameStatsBar.vue'
import DonksUserModal from './components/DonksUserModal.vue'

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const entries = computed(() => store.getHallOfFame())

const selectedUsername = ref<string | null>(null)

function onRowClick(username: string) {
  selectedUsername.value = username
}
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="hof-page">
        <!-- Header -->
        <div class="hof-page__header donks-card">
          <RouterLink to="/league/donks" class="donks-btn donks-btn--outline hof-page__back">
            ← Back to Donks
          </RouterLink>
          <h1 class="hof-page__title">Donks Hall of Fame</h1>
          <p class="hof-page__subtitle">Every player who has ever won a Donks award</p>
        </div>

        <!-- Explainer -->
        <DonksHallOfFameExplainer />

        <!-- Main table -->
        <section class="donks-card hof-page__table-card">
          <DonksHallOfFameTable
            :entries="entries"
            :get-avatar="store.getAvatar"
            @row-click="onRowClick"
          />
        </section>

        <!-- Stats bar -->
        <DonksHallOfFameStatsBar :entries="entries" />

        <!-- Footer -->
        <footer class="hof-page__footer donks-home__frosted">
          <div class="hof-page__footer-divider" />
          <div class="hof-page__footer-suits">♠ ♥ ♦ ♣</div>
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
.hof-page {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6, 1.5rem);
  padding-top: var(--space-8, 2rem);
}

.hof-page__header {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 3px solid var(--color-donks-gold);
  margin-bottom: 1rem;
  position: relative;
}

.hof-page__back {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.72rem;
}

.hof-page__title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.35rem;
  text-shadow: 0 2px 12px rgba(201, 162, 39, 0.15);
}

.hof-page__subtitle {
  font-size: 0.88rem;
  color: var(--color-donks-text-secondary);
  margin: 0;
}

.hof-page__table-card {
  padding: 0.75rem 0;
  overflow: hidden;
}

.hof-page__footer {
  text-align: center;
  padding: 1.25rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.hof-page__footer-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-donks-gold), transparent);
  border-radius: 2px;
}

.hof-page__footer-suits {
  font-size: 1rem;
  letter-spacing: 0.5em;
  color: var(--color-donks-gold);
  opacity: 0.25;
  font-weight: 700;
}

@media (max-width: 600px) {
  .hof-page__header {
    padding: 1.5rem 1rem 1rem;
  }

  .hof-page__back {
    position: static;
    margin-bottom: 0.75rem;
  }
}
</style>
