<script setup lang="ts">
/**
 * Anarchy League View
 * 
 * League homepage with dual standings (Primary + Bounty)
 * - Quarterly Primary standings (65% width)
 * - Monthly Bounty board (35% width)
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLeague, useQuickLock } from '@/composables'
import { getLeagueConfig } from '@/config/leagues'
import LeagueHeader from '@/components/league/LeagueHeader.vue'
import LeagueDescription from '@/components/league/LeagueDescription.vue'
import GameCalendar from '@/components/calendar/GameCalendar.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { ANARCHY_TEAMS } from '@/config/teams'
import type { LeagueSlug, AnarchyQuarterlyStanding, AnarchyMonthlyBountyStanding, AnarchyTeamSlug } from '@/types'
import { getCurrentQuarter } from '@/types/anarchy'

const LEAGUE_SLUG: LeagueSlug = 'anarchy'

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

const currentQuarter = computed(() => {
  const now = new Date()
  const quarter = getCurrentQuarter(now)
  return `${quarter} ${now.getFullYear()}`
})

const currentMonth = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const quarterlyStandings = ref<AnarchyQuarterlyStanding[]>([])
const monthlyBountyStandings = ref<AnarchyMonthlyBountyStanding[]>([])

function initializePlaceholderStandings() {
  quarterlyStandings.value = ANARCHY_TEAMS.map((team, index) => ({
    teamSlug: team.slug as AnarchyTeamSlug,
    teamName: team.name,
    totalPrimaryPoints: 0,
    gamesPlayed: 0,
    rank: index + 1,
  }))
  
  monthlyBountyStandings.value = ANARCHY_TEAMS.map((team, index) => ({
    teamSlug: team.slug as AnarchyTeamSlug,
    teamName: team.name,
    totalBounties: 0,
    gamesPlayed: 0,
    rank: index + 1,
  }))
}

function handleLockGame(tournamentId: number) {
  router.push(`/league/${LEAGUE_SLUG}/game/${tournamentId}`)
}

function navigateToGame(tournamentId: number) {
  router.push(`/league/${LEAGUE_SLUG}/game/${tournamentId}`)
}

const getTeamColor = (teamSlug: string) => {
  const team = ANARCHY_TEAMS.find((t) => t.slug === teamSlug)
  return team?.color || '#888888'
}

const getTeamLogo = (teamSlug: string) => {
  const team = ANARCHY_TEAMS.find((t) => t.slug === teamSlug)
  return team?.logoUrl || ''
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🏆'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}.`
}

onMounted(async () => {
  initializePlaceholderStandings()
  await Promise.all([load(), quickLock.loadHistory()])
})
</script>

<template>
  <div class="league-view theme-anarchy">
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

        <div class="league-view__dual-standings">
          <BaseCard variant="glass" padding="lg" class="standings-panel standings-panel--primary">
            <template #header>
              <div class="standings-header">
                <h3 class="standings-title">PRIMARY STANDINGS</h3>
                <span class="standings-period">{{ currentQuarter }}</span>
              </div>
            </template>
            
            <div class="standings-list">
              <div 
                v-for="standing in quarterlyStandings" 
                :key="standing.teamSlug"
                class="standing-row"
                :style="{ '--team-color': getTeamColor(standing.teamSlug) }"
              >
                <span class="standing-row__rank">{{ getRankIcon(standing.rank) }}</span>
                <img 
                  :src="getTeamLogo(standing.teamSlug)" 
                  :alt="standing.teamName"
                  class="standing-row__logo"
                />
                <span class="standing-row__name">{{ standing.teamName }}</span>
                <span class="standing-row__score">{{ standing.totalPrimaryPoints }}</span>
              </div>
            </div>
            
            <div class="standings-footer">
              <span>{{ quarterlyStandings[0]?.gamesPlayed || 0 }} games played</span>
            </div>
          </BaseCard>

          <BaseCard variant="glass" padding="lg" class="standings-panel standings-panel--bounty">
            <template #header>
              <div class="standings-header">
                <h3 class="standings-title standings-title--bounty">BOUNTY BOARD</h3>
                <span class="standings-period">{{ currentMonth }}</span>
              </div>
            </template>
            
            <div class="standings-list">
              <div 
                v-for="standing in monthlyBountyStandings" 
                :key="standing.teamSlug"
                class="standing-row"
                :style="{ '--team-color': getTeamColor(standing.teamSlug) }"
              >
                <span class="standing-row__rank">{{ standing.rank === 1 ? '🎯' : `${standing.rank}.` }}</span>
                <img 
                  :src="getTeamLogo(standing.teamSlug)" 
                  :alt="standing.teamName"
                  class="standing-row__logo"
                />
                <span class="standing-row__name">{{ standing.teamName }}</span>
                <span class="standing-row__score standing-row__score--bounty">
                  <svg class="crosshair-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                  </svg>
                  {{ standing.totalBounties }}
                </span>
              </div>
            </div>
            
            <div class="standings-footer">
              <span>{{ monthlyBountyStandings[0]?.gamesPlayed || 0 }} games this month</span>
            </div>
          </BaseCard>
        </div>

        <div class="league-view__grid">
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

          <section v-if="mostRecentFinished" class="league-view__recent">
            <BaseCard variant="glass" padding="md" class="recent-game-card">
              <template #header>
                <h3>Most Recent Game</h3>
              </template>
              <div class="recent-game-info">
                <p class="recent-game-date">
                  {{ new Date(mostRecentFinished.startTime).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  }) }}
                </p>
                <p class="recent-game-players">{{ mostRecentFinished.registeredPlayers }} players</p>
                <button 
                  class="recent-game-btn"
                  @click="navigateToGame(mostRecentFinished.id)"
                >
                  View Scoreboard →
                </button>
              </div>
            </BaseCard>
          </section>
        </div>

        <section class="league-view__rules">
          <BaseCard variant="glass" padding="lg" class="anarchy-rules">
            <template #header>
              <h2 class="anarchy-rules__title">Rules & Scoring</h2>
            </template>

            <div class="anarchy-rules__content">
              <!-- Game Schedule -->
              <div class="anarchy-rules__section">
                <div class="anarchy-rules__section-header">
                  <span class="anarchy-rules__icon">📅</span>
                  <h3 class="anarchy-rules__subtitle">Game Schedule</h3>
                </div>
                <div class="anarchy-rules__schedule">
                  <div class="anarchy-rules__schedule-item">
                    <span class="anarchy-rules__day">Wednesday</span>
                    <span class="anarchy-rules__time">1:00 PM ET</span>
                  </div>
                  <div class="anarchy-rules__schedule-item">
                    <span class="anarchy-rules__day">Saturday</span>
                    <span class="anarchy-rules__time">7:00 PM ET</span>
                  </div>
                </div>
              </div>

              <!-- League Concept -->
              <div class="anarchy-rules__section">
                <div class="anarchy-rules__section-header">
                  <span class="anarchy-rules__icon">🎯</span>
                  <h3 class="anarchy-rules__subtitle">The Anarchy Concept</h3>
                </div>
                <div class="anarchy-rules__concept">
                  <p class="anarchy-rules__text">
                    Unlike traditional poker leagues, <strong>Anarchy allows open table discussion</strong> between teammates. 
                    Strategize openly, share reads, and coordinate plays - silence is broken and chaos reigns!
                  </p>
                  <div class="anarchy-rules__highlight">
                    <span class="anarchy-rules__highlight-icon">💬</span>
                    <span>Talk strategy with your teammates at the table!</span>
                  </div>
                </div>
              </div>

              <!-- Dual Leaderboards -->
              <div class="anarchy-rules__section">
                <div class="anarchy-rules__section-header">
                  <span class="anarchy-rules__icon">🏆</span>
                  <h3 class="anarchy-rules__subtitle">Dual Leaderboard System</h3>
                </div>
                <div class="anarchy-rules__dual-boards">
                  <div class="anarchy-rules__board anarchy-rules__board--primary">
                    <div class="anarchy-rules__board-header">
                      <span class="anarchy-rules__board-icon">📊</span>
                      <h4>Primary Standings</h4>
                    </div>
                    <p class="anarchy-rules__board-desc">Tracks team performance based on finishing positions</p>
                    <ul class="anarchy-rules__board-list">
                      <li>Aggregated <strong>quarterly</strong></li>
                      <li>Only <strong>Top 5 players</strong> per team count</li>
                      <li>Determines overall league champion</li>
                    </ul>
                  </div>
                  <div class="anarchy-rules__board anarchy-rules__board--bounty">
                    <div class="anarchy-rules__board-header">
                      <span class="anarchy-rules__board-icon">🎯</span>
                      <h4>Bounty Board</h4>
                    </div>
                    <p class="anarchy-rules__board-desc">Tracks knockouts collected by each team</p>
                    <ul class="anarchy-rules__board-list">
                      <li>Aggregated <strong>monthly</strong></li>
                      <li><strong>All bounties</strong> count for the team</li>
                      <li>Rewards aggressive play</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Scoring System -->
              <div class="anarchy-rules__section">
                <div class="anarchy-rules__section-header">
                  <span class="anarchy-rules__icon">🔢</span>
                  <h3 class="anarchy-rules__subtitle">Point Calculation</h3>
                </div>
                <div class="anarchy-rules__scoring">
                  <div class="anarchy-rules__formula">
                    <span class="anarchy-rules__formula-label">Points Earned</span>
                    <span class="anarchy-rules__formula-equals">=</span>
                    <span class="anarchy-rules__formula-value">Total Players − Finish Position + 1</span>
                  </div>
                  <div class="anarchy-rules__examples">
                    <div class="anarchy-rules__example">
                      <span class="anarchy-rules__example-pos">1st place</span>
                      <span class="anarchy-rules__example-calc">in 40 players</span>
                      <span class="anarchy-rules__example-result">= 40 pts</span>
                    </div>
                    <div class="anarchy-rules__example">
                      <span class="anarchy-rules__example-pos">5th place</span>
                      <span class="anarchy-rules__example-calc">in 40 players</span>
                      <span class="anarchy-rules__example-result">= 36 pts</span>
                    </div>
                    <div class="anarchy-rules__example">
                      <span class="anarchy-rules__example-pos">10th place</span>
                      <span class="anarchy-rules__example-calc">in 40 players</span>
                      <span class="anarchy-rules__example-result">= 31 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Teams -->
              <div class="anarchy-rules__section">
                <div class="anarchy-rules__section-header">
                  <span class="anarchy-rules__icon">👥</span>
                  <h3 class="anarchy-rules__subtitle">The Teams</h3>
                </div>
                <div class="anarchy-rules__teams">
                  <div 
                    v-for="team in ANARCHY_TEAMS" 
                    :key="team.slug"
                    class="anarchy-rules__team"
                    :style="{ '--team-color': team.color }"
                  >
                    <img :src="team.logoUrl" :alt="team.name" class="anarchy-rules__team-logo" />
                    <span class="anarchy-rules__team-name">{{ team.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </BaseCard>
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
    rgba(10, 10, 10, 0.55) 0%,
    rgba(10, 10, 10, 0.65) 50%,
    rgba(10, 10, 10, 0.75) 100%
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

.league-view__dual-standings {
  display: flex;
  gap: var(--space-4);
}

.standings-panel {
  flex: 1;
}

.standings-panel--primary {
  flex: 0 0 65%;
}

.standings-panel--bounty {
  flex: 0 0 35%;
}

.standings-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.standings-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-an-primary, #22c55e);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.standings-title--bounty {
  color: var(--color-an-bounty, #ef4444);
}

.standings-period {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.standings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.standing-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border-left: 3px solid var(--team-color, #888);
}

.standing-row__rank {
  font-size: 1rem;
  min-width: 28px;
  text-align: center;
}

.standing-row__logo {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.standing-row__name {
  flex: 1;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.standing-row__score {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-an-primary, #22c55e);
}

.standing-row__score--bounty {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-an-bounty, #ef4444);
}

.crosshair-icon {
  width: 16px;
  height: 16px;
}

.standings-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.league-view__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.recent-game-card h3 {
  margin: 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.recent-game-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.recent-game-date {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.recent-game-players {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.recent-game-btn {
  background: var(--color-an-bounty, #ef4444);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
}

.recent-game-btn:hover {
  opacity: 0.9;
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
  color: var(--color-an-bounty, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 900px) {
  .league-view__dual-standings {
    flex-direction: column;
  }
  
  .standings-panel--primary,
  .standings-panel--bounty {
    flex: 1;
  }
  
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

/* Anarchy Rules Styles */
.anarchy-rules__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.anarchy-rules__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.anarchy-rules__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anarchy-rules__section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.anarchy-rules__icon {
  font-size: 1.25rem;
}

.anarchy-rules__subtitle {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-an-bounty, #ef4444);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.anarchy-rules__text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.anarchy-rules__text strong {
  color: var(--color-text-primary);
}

/* Schedule */
.anarchy-rules__schedule {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.anarchy-rules__schedule-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 140px;
}

.anarchy-rules__day {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.anarchy-rules__time {
  font-size: var(--text-sm);
  color: var(--color-an-primary, #22c55e);
  font-weight: 500;
}

/* Concept Highlight */
.anarchy-rules__concept {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anarchy-rules__highlight {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.anarchy-rules__highlight-icon {
  font-size: 1.5rem;
}

/* Dual Boards */
.anarchy-rules__dual-boards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.anarchy-rules__board {
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg);
  border-left: 3px solid;
}

.anarchy-rules__board--primary {
  border-color: var(--color-an-primary, #22c55e);
}

.anarchy-rules__board--bounty {
  border-color: var(--color-an-bounty, #ef4444);
}

.anarchy-rules__board-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.anarchy-rules__board-header h4 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.anarchy-rules__board--primary .anarchy-rules__board-header h4 {
  color: var(--color-an-primary, #22c55e);
}

.anarchy-rules__board--bounty .anarchy-rules__board-header h4 {
  color: var(--color-an-bounty, #ef4444);
}

.anarchy-rules__board-icon {
  font-size: 1rem;
}

.anarchy-rules__board-desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.anarchy-rules__board-list {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.anarchy-rules__board-list strong {
  color: var(--color-text-primary);
}

/* Scoring Formula */
.anarchy-rules__scoring {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anarchy-rules__formula {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}

.anarchy-rules__formula-label {
  font-weight: 600;
  color: var(--color-an-primary, #22c55e);
}

.anarchy-rules__formula-equals {
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.anarchy-rules__formula-value {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
}

.anarchy-rules__examples {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.anarchy-rules__example {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.anarchy-rules__example-pos {
  font-weight: 600;
  color: var(--color-text-primary);
}

.anarchy-rules__example-calc {
  color: var(--color-text-muted);
}

.anarchy-rules__example-result {
  font-weight: 700;
  color: var(--color-an-primary, #22c55e);
}

/* Teams */
.anarchy-rules__teams {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.anarchy-rules__team {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, color-mix(in srgb, var(--team-color) 20%, transparent) 0%, rgba(0, 0, 0, 0.3) 100%);
  border: 1px solid color-mix(in srgb, var(--team-color) 40%, transparent);
  border-radius: var(--radius-lg);
}

.anarchy-rules__team-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.anarchy-rules__team-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .anarchy-rules__dual-boards {
    grid-template-columns: 1fr;
  }
  
  .anarchy-rules__formula {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
