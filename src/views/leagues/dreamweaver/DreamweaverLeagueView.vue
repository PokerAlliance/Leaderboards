<script setup lang="ts">
/**
 * Dreamweaver League View
 * League-specific homepage for the Dreamweaver league
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLeague, useQuickLock } from '@/composables'
import { getLeagueConfig } from '@/config/leagues'
import LeagueHeader from '@/components/league/LeagueHeader.vue'
import LeagueDescription from '@/components/league/LeagueDescription.vue'
import LeagueRules from '@/components/league/LeagueRules.vue'
import RecentGameCard from '@/components/league/RecentGameCard.vue'
import GameCalendar from '@/components/calendar/GameCalendar.vue'
import MonthlyStandings from '@/components/leaderboard/MonthlyStandings.vue'
import type { LeagueSlug } from '@/types'

const LEAGUE_SLUG: LeagueSlug = 'dreamweaver'

const router = useRouter()

const leagueConfig = computed(() => getLeagueConfig(LEAGUE_SLUG))

const backgroundStyle = computed(() => {
  const bgImage = leagueConfig.value.backgroundImage
  return bgImage ? { backgroundImage: `url(${bgImage})` } : {}
})

const {
  leagueInfo,
  upcomingGames,
  liveGames,
  recentGames,
  mostRecentFinished,
  isLoading,
  error,
  load,
} = useLeague(LEAGUE_SLUG)

const quickLock = useQuickLock(LEAGUE_SLUG)

function handleLockGame(tournamentId: number) {
  router.push(`/league/${LEAGUE_SLUG}/game/${tournamentId}`)
}

onMounted(async () => {
  await Promise.all([load(), quickLock.loadHistory()])
})
</script>

<template>
  <div class="league-view theme-dreamweaver">
    <div class="league-view__bg" :style="backgroundStyle"></div>

    <div class="league-view__container">
      <LeagueHeader :league-slug="LEAGUE_SLUG" :league-info="leagueInfo" />

      <div v-if="isLoading" class="league-view__loading">
        <p>Loading league data...</p>
      </div>

      <div v-else-if="error" class="league-view__error">
        <p>Failed to load league data. Please try again later.</p>
      </div>

      <main v-else class="league-view__content">
        <section v-if="leagueInfo?.description" class="league-view__description">
          <LeagueDescription :description="leagueInfo.description" />
        </section>

        <div class="league-view__grid">
          <section class="league-view__standings">
            <MonthlyStandings :league-slug="LEAGUE_SLUG" />
          </section>

          <section class="league-view__calendar">
            <GameCalendar
              :upcoming="upcomingGames"
              :recent="recentGames"
              :live-games="liveGames"
              :league-slug="LEAGUE_SLUG"
              :saved-tournament-ids="quickLock.savedTournamentIds.value"
              :can-lock="quickLock.canLock.value"
              @lock="handleLockGame"
            />
          </section>
        </div>

        <section v-if="mostRecentFinished" class="league-view__recent">
          <RecentGameCard :game="mostRecentFinished" :league-slug="LEAGUE_SLUG" />
        </section>

        <section class="league-view__rules">
          <LeagueRules :league-slug="LEAGUE_SLUG" />
        </section>
      </main>

      <nav class="league-view__nav">
        <router-link to="/" class="league-view__back">
          ← Back to Home
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.league-view {
  min-height: 100vh;
  position: relative;
}

.league-view__bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  z-index: 0;
}

.league-view__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 15, 20, 0.7) 0%,
    rgba(10, 15, 20, 0.85) 50%,
    rgba(10, 15, 20, 0.95) 100%
  );
}

.league-view__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
  position: relative;
}

.league-view__loading,
.league-view__error {
  text-align: center;
  padding: var(--space-16);
  color: var(--color-text-muted);
}

.league-view__error {
  color: var(--color-error);
}

.league-view__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-6) 0;
}

.league-view__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.league-view__nav {
  padding: var(--space-8) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: var(--space-8);
}

.league-view__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.league-view__back:hover {
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.1);
}

@media (max-width: 900px) {
  .league-view__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .league-view__container {
    padding: var(--space-4);
  }

  .league-view__content {
    gap: var(--space-6);
  }
}
</style>
