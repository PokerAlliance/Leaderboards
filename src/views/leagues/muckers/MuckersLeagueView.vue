<script setup lang="ts">
import { useMuckersStore } from '@/composables/useMuckersStore'
import MuckersLoadingGate from './components/MuckersLoadingGate.vue'
import MuckersQuarterSelector from './components/MuckersQuarterSelector.vue'
import MuckersTeamTable from './components/MuckersTeamTable.vue'
import MuckersTimeline from './components/MuckersTimeline.vue'
import { RouterLink } from 'vue-router'

const store = useMuckersStore()
</script>

<template>
  <MuckersLoadingGate>
    <main class="mk-standings">
      <div class="mk-standings__container">

        <!-- Header -->
        <div class="mk-standings__header mk-glass">
          <div class="mk-standings__header-left">
            <h1 class="mk-standings__title">Barnyard Muckers Standings</h1>
            <p class="mk-standings__subtitle">Quarterly team leaderboard</p>
          </div>
          <div class="mk-standings__header-right">
            <MuckersQuarterSelector />
          </div>
        </div>

        <!-- Nav Row -->
        <div class="mk-standings__nav mk-glass">
          <RouterLink to="/league/muckers" class="mk-btn mk-btn--outline mk-standings__nav-btn">
            &larr; Rules
          </RouterLink>
          <RouterLink to="/league/muckers/players" class="mk-btn mk-btn--outline mk-standings__nav-btn">
            Individual Players
          </RouterLink>
          <RouterLink to="/league/muckers/teams" class="mk-btn mk-btn--outline mk-standings__nav-btn">
            Teams
          </RouterLink>
        </div>

        <!-- Error state -->
        <div v-if="store.loadError.value" class="mk-standings__error mk-glass">
          <p>Failed to load data: {{ store.loadError.value }}</p>
          <button class="mk-btn mk-btn--primary" @click="store.forceRefresh()">
            Retry
          </button>
        </div>

        <!-- Team Table -->
        <MuckersTeamTable />

        <!-- Quarter Timeline -->
        <MuckersTimeline />

      </div>
    </main>
  </MuckersLoadingGate>
</template>

<style scoped>
.mk-standings {
  min-height: 100vh;
  padding: 1.5rem 1rem 4rem;
}

.mk-standings__container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── Header ──────────────────────────────── */

.mk-standings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.mk-standings__header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mk-standings__title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0;
}

.mk-standings__subtitle {
  font-size: 0.78rem;
  color: var(--color-mk-text-muted, #64748B);
  margin: 0;
}

/* ─── Nav Row ─────────────────────────────── */

.mk-standings__nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  flex-wrap: wrap;
}

.mk-standings__nav-btn {
  text-decoration: none;
  font-size: 0.78rem;
  padding: 0.4rem 1rem;
}

/* ─── Error ───────────────────────────────── */

.mk-standings__error {
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-mk-danger, #EF4444);
}

/* ─── Responsive ──────────────────────────── */

@media (max-width: 640px) {
  .mk-standings__header {
    flex-direction: column;
    align-items: flex-start;
  }
  .mk-standings__title {
    font-size: 1.1rem;
  }
}
</style>
