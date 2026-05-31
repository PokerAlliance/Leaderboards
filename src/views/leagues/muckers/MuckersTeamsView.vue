<script setup lang="ts">
import { useMuckersStore } from '@/composables/useMuckersStore'
import MuckersLoadingGate from './components/MuckersLoadingGate.vue'
import MuckersQuarterSelector from './components/MuckersQuarterSelector.vue'
import MuckersTeamCard from './components/MuckersTeamCard.vue'
import { RouterLink } from 'vue-router'

const store = useMuckersStore()
</script>

<template>
  <MuckersLoadingGate>
    <main class="mk-teams">
      <div class="mk-teams__container">

        <div class="mk-teams__header mk-glass">
          <div class="mk-teams__header-left">
            <h1 class="mk-teams__title">Muckers Teams</h1>
            <p class="mk-teams__subtitle">All teams and their rosters</p>
          </div>
          <div class="mk-teams__header-right">
            <MuckersQuarterSelector />
          </div>
        </div>

        <div class="mk-teams__nav mk-glass">
          <RouterLink to="/league/muckers/standings" class="mk-btn mk-btn--outline mk-teams__nav-btn">
            &larr; Standings
          </RouterLink>
          <RouterLink to="/league/muckers/players" class="mk-btn mk-btn--outline mk-teams__nav-btn">
            Individual Players
          </RouterLink>
          <RouterLink to="/league/muckers" class="mk-btn mk-btn--outline mk-teams__nav-btn">
            Rules
          </RouterLink>
        </div>

        <div v-if="store.loadError.value" class="mk-teams__error mk-glass">
          <p>Failed to load data: {{ store.loadError.value }}</p>
          <button class="mk-btn mk-btn--primary" @click="store.forceRefresh()">
            Retry
          </button>
        </div>

        <div class="mk-teams__grid">
          <MuckersTeamCard
            v-for="team in store.allTeams"
            :key="team.slug"
            :team-slug="team.slug"
          />
        </div>

      </div>
    </main>
  </MuckersLoadingGate>
</template>

<style scoped>
.mk-teams {
  min-height: 100vh;
  padding: 1.5rem 1rem 4rem;
}

.mk-teams__container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mk-teams__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.mk-teams__header-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mk-teams__title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0;
}

.mk-teams__subtitle {
  font-size: 0.78rem;
  color: var(--color-mk-text-muted, #94A3B8);
  margin: 0;
}

.mk-teams__nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  flex-wrap: wrap;
}

.mk-teams__nav-btn {
  text-decoration: none;
  font-size: 0.78rem;
  padding: 0.4rem 1rem;
}

.mk-teams__error {
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-mk-danger, #EF4444);
}

.mk-teams__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .mk-teams__header {
    flex-direction: column;
    align-items: flex-start;
  }
  .mk-teams__title {
    font-size: 1.1rem;
  }
  .mk-teams__grid {
    grid-template-columns: 1fr;
  }
}
</style>
