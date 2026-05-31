<script setup lang="ts">
import { useMuckersStore } from '@/composables/useMuckersStore'
import MuckersLoadingGate from './components/MuckersLoadingGate.vue'
import MuckersQuarterSelector from './components/MuckersQuarterSelector.vue'
import MuckersPlayerTable from './components/MuckersPlayerTable.vue'
import { RouterLink } from 'vue-router'

const store = useMuckersStore()
</script>

<template>
  <MuckersLoadingGate>
    <main class="mk-players">
      <div class="mk-players__container">

        <div class="mk-players__header mk-glass">
          <div class="mk-players__header-left">
            <h1 class="mk-players__title">Individual Player Standings</h1>
            <p class="mk-players__subtitle">All players ranked by quarterly points</p>
          </div>
          <div class="mk-players__header-right">
            <MuckersQuarterSelector />
          </div>
        </div>

        <div class="mk-players__nav mk-glass">
          <RouterLink to="/league/muckers/standings" class="mk-btn mk-btn--outline mk-players__nav-btn">
            &larr; Standings
          </RouterLink>
          <RouterLink to="/league/muckers/teams" class="mk-btn mk-btn--outline mk-players__nav-btn">
            Teams
          </RouterLink>
          <RouterLink to="/league/muckers" class="mk-btn mk-btn--outline mk-players__nav-btn">
            Rules
          </RouterLink>
        </div>

        <div v-if="store.loadError.value" class="mk-players__error mk-glass">
          <p>Failed to load data: {{ store.loadError.value }}</p>
          <button class="mk-btn mk-btn--primary" @click="store.forceRefresh()">
            Retry
          </button>
        </div>

        <MuckersPlayerTable />

      </div>
    </main>
  </MuckersLoadingGate>
</template>

<style scoped>
.mk-players {
  min-height: 100vh;
  padding: 1.5rem 1rem 4rem;
}

.mk-players__container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mk-players__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.mk-players__header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mk-players__title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0;
}

.mk-players__subtitle {
  font-size: 0.78rem;
  color: var(--color-mk-text-muted, #94A3B8);
  margin: 0;
}

.mk-players__nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  flex-wrap: wrap;
}

.mk-players__nav-btn {
  text-decoration: none;
  font-size: 0.78rem;
  padding: 0.4rem 1rem;
}

.mk-players__error {
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-mk-danger, #EF4444);
}

@media (max-width: 640px) {
  .mk-players__header {
    flex-direction: column;
    align-items: flex-start;
  }
  .mk-players__title {
    font-size: 1.1rem;
  }
}
</style>
