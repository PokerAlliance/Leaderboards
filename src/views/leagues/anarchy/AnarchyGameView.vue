<script setup lang="ts">
/**
 * Anarchy Game View
 * 
 * Custom game scoreboard for Anarchy league with:
 * - Dual-panel layout (65% Primary / 35% Bounty)
 * - Top 5 player badges per team
 * - Full player rankings table
 */
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTournament, useTeamRoster, useAnarchyScoring, useAuth, useQuickLock } from '@/composables'
import { getLeagueConfig } from '@/config/leagues'
import { ANARCHY_TEAMS } from '@/config/teams'
import LiveBadge from '@/components/scoreboard/LiveBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import { AnarchyTeamStandings, AnarchyBountyBoard } from './components'
import type { LeagueSlug, AnarchyTeamSlug, AnarchyTeamScore, AnarchyPlayerResult } from '@/types'

const LEAGUE_SLUG: LeagueSlug = 'anarchy'

interface Props {
  tournamentId: string
}

const props = defineProps<Props>()
const router = useRouter()

const parsedTournamentId = computed(() => {
  const id = parseInt(props.tournamentId, 10)
  return isNaN(id) ? null : id
})

const leagueConfig = computed(() => getLeagueConfig(LEAGUE_SLUG))

const backgroundStyle = computed(() => {
  const bgImage = leagueConfig.value.backgroundImage
  return bgImage ? { backgroundImage: `url(${bgImage})` } : {}
})

const {
  tournament,
  raw: rawTournament,
  isLoading,
  error,
  isLive,
  isFinished,
  load: loadTournament,
  startPolling,
  stopPolling,
} = useTournament(parsedTournamentId.value || undefined, { enablePolling: true })

const { getPlayerTeam, load: loadRoster } = useTeamRoster(LEAGUE_SLUG)

const getAnarchyPlayerTeam = (username: string) => {
  const team = getPlayerTeam(username)
  if (!team) return null
  return {
    teamSlug: team.teamSlug as AnarchyTeamSlug,
    teamName: team.teamName,
  }
}

const { calculateFromTournament } = useAnarchyScoring({ getPlayerTeam: getAnarchyPlayerTeam })

const gameResult = ref<{ teamScores: AnarchyTeamScore[]; playerResults: AnarchyPlayerResult[] } | null>(null)

const { isLoggedIn, leagueSlug: userLeagueSlug } = useAuth()
const quickLock = useQuickLock(LEAGUE_SLUG)

const canLockGame = computed(() => {
  if (!isLoggedIn.value) return false
  if (!isFinished.value) return false
  if (quickLock.savedTournamentIds.value.includes(parsedTournamentId.value || 0)) return false
  return userLeagueSlug.value === 'anarchy' || userLeagueSlug.value === 'all'
})

const showLockDialog = ref(false)
const isLocking = ref(false)

function processResults() {
  if (!tournament.value) return
  
  // #region agent log
  const raw = rawTournament.value as any;
  const activePlayerIds = new Set(raw?.playersLeftIds || []);
  const eliminatedSeats = raw?.seats?.filter((s: any) => !activePlayerIds.has(s.id)) || [];
  const seatsWithBounty = raw?.seats?.filter((s: any) => s.bounty > 0) || [];
  fetch('http://127.0.0.1:7243/ingest/0c04544e-83a2-40f4-b335-81378515735c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AnarchyGameView:processResults',message:'Deep bounty check',data:{state:raw?.state,playersTotal:raw?.playersIds?.length,playersLeft:raw?.playersLeftIds?.length,eliminatedCount:eliminatedSeats.length,eliminatedSeats:eliminatedSeats.slice(0,5),seatsWithBountyCount:seatsWithBounty.length,seatsWithBounty:seatsWithBounty.slice(0,5),prizes:raw?.prizes,winners:raw?.winners,bountyWinners:raw?.bounty_winners},timestamp:Date.now(),hypothesisId:'H7'})}).catch(()=>{});
  // #endregion
  
  const bountyWinners = rawTournament.value?.bounty_winners || []
  const bountyValue = rawTournament.value?.prizes?.bounty || 0
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0c04544e-83a2-40f4-b335-81378515735c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AnarchyGameView:processResults:afterExtract',message:'Extracted bounty data',data:{bountyWinnersCount:bountyWinners.length,bountyValue,bountyWinners},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
  // #endregion
  
  const result = calculateFromTournament(tournament.value, bountyWinners, bountyValue)
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/0c04544e-83a2-40f4-b335-81378515735c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AnarchyGameView:processResults:result',message:'Calculation result',data:{teamScoresBounties:result.teamScores.map((t: any)=>({team:t.teamName,bounty:t.bountyScore})),playerBounties:result.playerResults.slice(0,5).map((p: any)=>({name:p.username,bounties:p.bountiesCollected}))},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
  // #endregion
  
  gameResult.value = {
    teamScores: result.teamScores,
    playerResults: result.playerResults,
  }
}

async function handleLockGame() {
  if (!parsedTournamentId.value || !tournament.value || !gameResult.value) return
  
  isLocking.value = true
  try {
    await quickLock.lockGame(tournament.value, gameResult.value.teamScores as any, gameResult.value.playerResults as any)
    showLockDialog.value = false
  } catch (e) {
    console.error('Failed to lock game:', e)
  } finally {
    isLocking.value = false
  }
}

watch(tournament, () => {
  if (tournament.value) {
    processResults()
  }
})

watch(isLive, (live) => {
  if (live) {
    startPolling()
  } else {
    stopPolling()
  }
})

onMounted(async () => {
  await Promise.all([loadRoster(), quickLock.loadHistory()])
  if (parsedTournamentId.value) {
    await loadTournament(parsedTournamentId.value)
    if (isLive.value) {
      startPolling()
    }
  }
})

onUnmounted(() => {
  stopPolling()
})

function goBack() {
  router.push(`/league/${LEAGUE_SLUG}`)
}

const formattedDate = computed(() => {
  if (!tournament.value?.startTime) return ''
  return new Date(tournament.value.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const formattedTime = computed(() => {
  if (!tournament.value?.startTime) return ''
  return new Date(tournament.value.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
})

const getTeamColor = (teamSlug: string) => {
  const team = ANARCHY_TEAMS.find((t) => t.slug === teamSlug)
  return team?.color || '#888888'
}
</script>

<template>
  <main class="game-view">
    <div class="game-view__bg" :style="backgroundStyle"></div>
    
    <div v-if="!parsedTournamentId" class="game-view__error">
      <h1>Invalid Tournament ID</h1>
      <p>The tournament ID "{{ tournamentId }}" is not valid.</p>
      <button class="game-view__back-btn" @click="goBack">
        Go Back
      </button>
    </div>

    <template v-else>
      <nav class="game-view__nav">
        <button class="game-view__back-btn" @click="goBack">
          <span class="game-view__back-icon">←</span>
          <span>Back to Anarchy</span>
        </button>
      </nav>

      <div class="game-view__container">
        <div v-if="isLoading" class="game-view__loading">
          <p>Loading tournament data...</p>
        </div>

        <div v-else-if="error" class="game-view__error-message">
          <p>{{ error }}</p>
        </div>

        <template v-else-if="gameResult">
          <div class="game-view__dual-panel">
            <div class="game-view__primary-panel">
              <AnarchyTeamStandings
                :team-scores="gameResult.teamScores"
                title="TEAM PRIMARY STANDINGS"
                :show-player-badges="true"
              />
            </div>
            
            <div class="game-view__info-panel">
              <!-- Game Info Card -->
              <div class="game-info-card">
                <div class="game-info-card__title-row">
                  <h1 class="game-info-card__title">ANARCHY</h1>
                  <LiveBadge v-if="isLive" />
                  <span v-else-if="isFinished" class="game-info-card__status game-info-card__status--finished">FINISHED</span>
                </div>
                
                <div class="game-info-card__meta">
                  <div class="game-info-card__row">
                    <span class="game-info-card__icon">📅</span>
                    <span class="game-info-card__value">{{ formattedDate }}</span>
                  </div>
                  <div class="game-info-card__row">
                    <span class="game-info-card__icon">🕐</span>
                    <span class="game-info-card__value">{{ formattedTime }}</span>
                  </div>
                  <div v-if="tournament" class="game-info-card__row">
                    <span class="game-info-card__icon">👥</span>
                    <span class="game-info-card__value">{{ tournament.playersRemaining }} / {{ tournament.totalPlayers }} players</span>
                  </div>
                </div>
                
                <p class="game-info-card__tagline">"Embrace the Chaos"</p>
              </div>
              
              <!-- Bounty Board below -->
              <AnarchyBountyBoard
                :team-scores="gameResult.teamScores"
                title="BOUNTY HUNTERS"
              />
            </div>
          </div>

          <BaseCard variant="glass" padding="md" class="game-view__player-table">
            <template #header>
              <h3>PLAYER RANKINGS</h3>
            </template>
            
            <div class="player-table">
              <div class="player-table__header">
                <span class="player-table__col--rank">#</span>
                <span class="player-table__col--player">Player</span>
                <span class="player-table__col--team">Team</span>
                <span class="player-table__col--points">Pts</span>
                <span class="player-table__col--bounties">KOs</span>
              </div>
              
              <div 
                v-for="player in gameResult.playerResults" 
                :key="player.username"
                class="player-table__row"
                :class="{ 'player-table__row--top5': player.isInTop5 }"
                :style="player.teamSlug ? { '--team-color': getTeamColor(player.teamSlug) } : {}"
              >
                <span class="player-table__col--rank">{{ player.finishPosition }}</span>
                <span class="player-table__col--player">
                  <img 
                    v-if="player.avatar" 
                    :src="player.avatar.startsWith('http') ? player.avatar : `https://www.replaypoker.com${player.avatar}`" 
                    class="player-avatar"
                  />
                  {{ player.username }}
                </span>
                <span class="player-table__col--team" :class="{ 'no-team': !player.teamSlug }">
                  {{ player.teamName || '—' }}
                </span>
                <span class="player-table__col--points">{{ player.pointsEarned }}</span>
                <span class="player-table__col--bounties" :class="{ 'has-bounties': player.bountiesCollected > 0 }">
                  {{ player.bountiesCollected }}
                </span>
              </div>
            </div>
          </BaseCard>

          <div v-if="canLockGame" class="game-view__lock-section">
            <button class="lock-btn" @click="showLockDialog = true">
              🔒 Lock Results
            </button>
          </div>
        </template>

        <footer class="game-footer">
          <span v-if="tournament">Tournament #{{ tournament.id }}</span>
          <span>ANARCHY LEAGUE</span>
        </footer>
      </div>
    </template>

    <ConfirmDialog
      :open="showLockDialog"
      title="Lock Game Results"
      message="Are you sure you want to save these results to the leaderboard? This action cannot be undone."
      confirm-text="Lock Results"
      :loading="isLocking"
      @confirm="handleLockGame"
      @cancel="showLockDialog = false"
    />
  </main>
</template>

<style scoped>
.game-view {
  min-height: 100vh;
  position: relative;
}

.game-view__bg {
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

.game-view__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.8) 0%,
    rgba(10, 10, 10, 0.9) 50%,
    rgba(10, 10, 10, 0.95) 100%
  );
}

.game-view__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
  padding-top: var(--space-16);
  position: relative;
  z-index: 1;
}

.game-view__nav {
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 100;
}

.game-view__back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.game-view__back-btn:hover {
  background: rgba(20, 20, 20, 0.9);
  border-color: var(--color-an-bounty, #ef4444);
}

.game-view__back-icon {
  font-size: var(--text-lg);
}

/* Game Info Card - moved to right column */
.game-info-card {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: var(--space-4);
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(8px);
}

.game-info-card__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.game-info-card__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-an-bounty, #ef4444);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.game-info-card__status {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.game-info-card__status--finished {
  background: rgba(34, 197, 94, 0.2);
  color: var(--color-an-primary, #22c55e);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.game-info-card__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.game-info-card__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.game-info-card__icon {
  font-size: 0.9rem;
  opacity: 0.8;
}

.game-info-card__value {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
}

.game-info-card__tagline {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  font-size: 0.8rem;
  margin: var(--space-3) 0 0;
  text-align: center;
}

.game-view__loading,
.game-view__error-message {
  text-align: center;
  padding: var(--space-16);
  color: var(--color-text-muted);
}

.game-view__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-8);
  text-align: center;
}

.game-view__error h1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

.game-view__dual-panel {
  display: flex;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  align-items: flex-start;
}

.game-view__primary-panel {
  flex: 0 0 calc(65% - var(--space-3));
}

.game-view__info-panel {
  flex: 0 0 calc(35% - var(--space-3));
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.game-view__player-table {
  margin-bottom: var(--space-6);
}

.game-view__player-table h3 {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.player-table {
  margin-top: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.player-table__header,
.player-table__row {
  display: grid;
  grid-template-columns: 50px 1fr 120px 60px 60px;
  gap: 8px;
  padding: 8px 12px;
  align-items: center;
}

.player-table__header {
  background: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 1;
}

.player-table__row {
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid var(--team-color, transparent);
  font-size: 0.875rem;
}

.player-table__row:nth-child(even) {
  background: rgba(0, 0, 0, 0.15);
}

.player-table__row--top5 {
  background: rgba(34, 197, 94, 0.1);
}

.player-table__col--rank {
  text-align: center;
  font-weight: 600;
}

.player-table__col--player {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.player-table__col--team {
  color: rgba(255, 255, 255, 0.8);
}

.player-table__col--team.no-team {
  color: rgba(255, 255, 255, 0.4);
}

.player-table__col--points {
  text-align: center;
  font-weight: 600;
  color: var(--color-an-primary, #22c55e);
}

.player-table__col--bounties {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.player-table__col--bounties.has-bounties {
  color: var(--color-an-bounty, #ef4444);
  font-weight: 600;
}

.game-view__lock-section {
  text-align: center;
  margin-bottom: var(--space-6);
}

.lock-btn {
  background: var(--color-an-bounty, #ef4444);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.lock-btn:hover {
  opacity: 0.9;
}

.game-footer {
  display: flex;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 900px) {
  .game-view__dual-panel {
    flex-direction: column;
  }
  
  .game-view__primary-panel,
  .game-view__info-panel {
    flex: 1 1 100%;
  }

  .game-info-card {
    order: -1;
  }
  
  .player-table__header,
  .player-table__row {
    grid-template-columns: 40px 1fr 80px 50px 50px;
  }
}

@media (max-width: 640px) {
  .game-view__container {
    padding: var(--space-4);
    padding-top: var(--space-14);
  }
  
  .game-header__title {
    font-size: var(--text-2xl);
  }
  
  .player-table__header,
  .player-table__row {
    grid-template-columns: 30px 1fr 60px 40px 40px;
    font-size: 0.75rem;
  }
}
</style>
