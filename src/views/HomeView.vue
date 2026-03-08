<script setup lang="ts">
  import LeagueCard from '@/components/league/LeagueCard.vue'
  import { mockLeagues } from '@/mocks/dreamweaver-game'
</script>

<template>
  <main class="home-view">
    <section class="home-view__hero">
      <h1 class="home-view__title">Poker Alliance</h1>
      <p class="home-view__subtitle">Track scores across the best team poker leagues</p>
    </section>

    <section class="home-view__leagues">
      <h2 class="home-view__section-title">Our Leagues</h2>
      <div class="home-view__leagues-grid">
        <LeagueCard v-for="league in mockLeagues" :key="league.slug" :league="league" />
      </div>
    </section>

    <section class="home-view__cta">
      <router-link to="/poc" class="home-view__poc-link">
        View UI Components POC
      </router-link>
    </section>
  </main>
</template>

<style scoped>
  .home-view {
    padding: var(--space-6);
    max-width: 1200px;
    margin: 0 auto;
  }

  .home-view__hero {
    text-align: center;
    padding: var(--space-12) 0;
  }

  .home-view__title {
    font-family: var(--font-display);
    font-size: var(--text-5xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
    margin: 0;
    text-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  }

  .home-view__subtitle {
    font-size: var(--text-xl);
    color: var(--color-text-secondary);
    margin: var(--space-4) 0 0;
  }

  .home-view__section-title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  }

  .home-view__leagues-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-4);
  }

  .home-view__cta {
    margin-top: var(--space-12);
    text-align: center;
  }

  .home-view__poc-link {
    display: inline-block;
    padding: var(--space-3) var(--space-6);
    background: var(--color-bg-card);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: var(--radius-md);
    color: var(--color-gold);
    text-decoration: none;
    font-weight: var(--font-medium);
    transition: all var(--transition-fast);
  }

  .home-view__poc-link:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-gold);
    box-shadow: var(--shadow-glow);
  }

  @media (max-width: 640px) {
    .home-view {
      padding: var(--space-4);
    }

    .home-view__hero {
      padding: var(--space-8) 0;
    }

    .home-view__title {
      font-size: var(--text-3xl);
    }

    .home-view__subtitle {
      font-size: var(--text-base);
    }

    .home-view__leagues-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
