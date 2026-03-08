<script setup lang="ts">
import { computed, watch, onUnmounted, ref } from 'vue'
import { useTournament } from '@/composables/useTournament'
import { useTeamRoster } from '@/composables/useTeamRoster'
import { useScoring } from '@/composables/useScoring'
import { useQuickLock } from '@/composables/useQuickLock'
import { getLeagueConfig } from '@/config/leagues'
import { formatGameDateTime } from '@/utils/datetime'
import TeamStandings from './TeamStandings.vue'
import PlayerRankings from './PlayerRankings.vue'
import UnassignedPlayers from './UnassignedPlayers.vue'
import ScoreboardSkeleton from './ScoreboardSkeleton.vue'
import LiveBadge from './LiveBadge.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import type { LeagueSlug } from '@/types'

interface Props {
  tournamentId: number
  leagueSlug?: LeagueSlug
  pollInterval?: number
  showTeamStandings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pollInterval: 30000,
  showTeamStandings: undefined,
})

const emit = defineEmits<{
  (e: 'update', data: { isLive: boolean; isFinished: boolean }): void
  (e: 'error', error: Error): void
  (e: 'locked'): void
}>()

const leagueConfig = computed(() =>
  props.leagueSlug ? getLeagueConfig(props.leagueSlug) : null
)

const shouldShowTeams = computed(() => {
  if (props.showTeamStandings !== undefined) return props.showTeamStandings
  return !!props.leagueSlug
})

const { tournament, isLive, isFinished, isLoading, error, load, lastUpdated } =
  useTournament(undefined, {
    pollInterval: props.pollInterval,
    enablePolling: true,
  })

const rosterLoaded = ref(false)
const teamRoster = props.leagueSlug 
  ? useTeamRoster(props.leagueSlug) 
  : null

const getPlayerTeam = teamRoster?.getPlayerTeam ?? (() => null)

const scoring = props.leagueSlug
  ? useScoring(props.leagueSlug, { getPlayerTeam })
  : null

const playerResults = computed(() => {
  if (!tournament.value) return []
  if (!scoring) {
    return tournament.value.players.map((p, index) => ({
      playerId: p.id,
      username: p.username,
      teamSlug: null,
      teamName: null,
      finishPosition: p.position ?? index + 1,
      pointsEarned: 0,
      chips: p.chips,
      avatar: p.avatar,
      country: p.country,
      isEliminated: p.isEliminated,
    }))
  }
  scoring.calculateFromTournament(tournament.value)
  return scoring.playerResults.value.map((r) => {
    const player = tournament.value!.players.find((p) => p.id === r.playerId)
    return {
      ...r,
      chips: player?.chips,
      avatar: player?.avatar,
      country: player?.country,
      isEliminated: player?.isEliminated ?? false,
    }
  })
})

const teamScores = computed(() => scoring?.teamScores.value ?? [])
const unassignedPlayers = computed(() => scoring?.unassignedPlayers.value ?? [])

const quickLock = props.leagueSlug ? useQuickLock(props.leagueSlug) : null

const showLockConfirm = ref(false)
const lockError = ref<string | null>(null)
const lockSuccess = ref(false)

const showLockButton = computed(() => {
  if (!quickLock || !tournament.value) return false
  return (
    quickLock.canLock.value &&
    isFinished.value &&
    !quickLock.isGameSaved(tournament.value.id) &&
    !lockSuccess.value
  )
})

const formattedDate = computed(() => {
  if (!tournament.value) return ''
  return formatGameDateTime(tournament.value.startTime)
})

const backgroundClass = computed(() =>
  props.leagueSlug ? `theme-${props.leagueSlug}` : ''
)

const backgroundStyle = computed(() => {
  const bgImage = leagueConfig.value?.backgroundImage
  return bgImage ? { backgroundImage: `url(${bgImage})` } : {}
})

async function initialize() {
  try {
    if (teamRoster) {
      await teamRoster.load()
      rosterLoaded.value = true
    }
    if (quickLock) {
      await quickLock.loadHistory()
    }
    await load(props.tournamentId)
  } catch (e) {
    emit('error', e instanceof Error ? e : new Error(String(e)))
  }
}

async function handleLock() {
  if (!quickLock || !tournament.value) return

  lockError.value = null

  const result = await quickLock.lockGame(
    tournament.value,
    teamScores.value,
    playerResults.value
  )

  if (result.success) {
    lockSuccess.value = true
    showLockConfirm.value = false
    emit('locked')
  } else {
    lockError.value = result.error || 'Failed to lock results'
  }
}

watch(
  () => props.tournamentId,
  () => initialize(),
  { immediate: true }
)

watch([isLive, isFinished], () => {
  emit('update', { isLive: isLive.value, isFinished: isFinished.value })
})

watch(error, (e) => {
  if (e) emit('error', e)
})

onUnmounted(() => {
  // Cleanup handled by useTournament
})
</script>

<template>
  <div class="game-scoreboard" :class="backgroundClass">
    <div class="game-scoreboard__bg-fixed" :style="backgroundStyle" />

    <div class="game-scoreboard__wrapper">
      <ScoreboardSkeleton v-if="isLoading && !tournament" />

      <template v-else-if="tournament">
        <header class="game-scoreboard__header">
          <div v-if="leagueConfig" class="game-scoreboard__league-logo">
            <div class="alliance-logo" />
          </div>

          <div class="game-scoreboard__title">
            <h1>{{ tournament.name }}</h1>
            <p class="game-scoreboard__date">{{ formattedDate }}</p>
          </div>

          <div class="game-scoreboard__status">
            <LiveBadge v-if="isLive" />
            <span v-else-if="isFinished" class="game-scoreboard__finished">FINAL</span>
            <span v-else class="game-scoreboard__pending">UPCOMING</span>
          </div>
        </header>

        <div class="game-scoreboard__content">
          <TeamStandings
            v-if="shouldShowTeams && teamScores.length > 0"
            :teams="teamScores"
            :is-live="isLive"
          />

          <PlayerRankings
            :players="playerResults"
            :show-chips="isLive"
            :show-teams="shouldShowTeams"
            :max-display="18"
          />

          <UnassignedPlayers
            v-if="shouldShowTeams && unassignedPlayers.length > 0"
            :players="unassignedPlayers"
            :show-chips="isLive"
          />
        </div>

        <footer class="game-scoreboard__footer">
          <span class="game-scoreboard__total">
            {{ tournament.playersRemaining }} / {{ tournament.totalPlayers }} remaining
          </span>
          <span v-if="lastUpdated" class="game-scoreboard__updated">
            Updated {{ new Date(lastUpdated).toLocaleTimeString() }}
          </span>
          <span v-if="leagueConfig" class="game-scoreboard__league">
            {{ leagueConfig.name }}
          </span>

          <div v-if="showLockButton" class="game-scoreboard__lock-section">
            <button
              class="game-scoreboard__lock-btn"
              :disabled="quickLock?.isLocking.value"
              @click="showLockConfirm = true"
            >
              {{ quickLock?.isLocking.value ? 'Locking...' : 'Lock Results' }}
            </button>
          </div>

          <span v-if="lockSuccess" class="game-scoreboard__lock-success">
            Results saved
          </span>
        </footer>

        <ConfirmDialog
          :open="showLockConfirm"
          title="Lock Game Results"
          :message="`Are you sure you want to lock the results for this game? This will save the scores to the league history.${unassignedPlayers.length > 0 ? ` Warning: ${unassignedPlayers.length} player(s) are not assigned to teams.` : ''}${lockError ? `\n\nError: ${lockError}` : ''}`"
          confirm-text="Lock Results"
          :loading="quickLock?.isLocking.value ?? false"
          @confirm="handleLock"
          @cancel="showLockConfirm = false"
        />
      </template>

      <div v-else-if="error" class="game-scoreboard__error">
        <p class="game-scoreboard__error-message">{{ error.message }}</p>
        <button class="game-scoreboard__retry" @click="initialize">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-scoreboard {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.game-scoreboard__bg-fixed {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-color: var(--color-bg-primary);
  z-index: 0;
}

.game-scoreboard__wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.game-scoreboard__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: linear-gradient(
    to bottom,
    rgba(10, 15, 20, 0.9) 0%,
    rgba(10, 15, 20, 0.7) 100%
  );
  border-bottom: 2px solid var(--color-gold);
  backdrop-filter: blur(8px);
}

.game-scoreboard__league-logo {
  flex-shrink: 0;
}

.game-scoreboard__title {
  flex: 1;
}

.game-scoreboard__title h1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.game-scoreboard__date {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.game-scoreboard__status {
  flex-shrink: 0;
}

.game-scoreboard__finished {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-success);
  letter-spacing: 0.1em;
  backdrop-filter: blur(4px);
}

.game-scoreboard__pending {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: rgb(59, 130, 246);
  letter-spacing: 0.1em;
  backdrop-filter: blur(4px);
}

.game-scoreboard__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.game-scoreboard__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: rgba(10, 15, 20, 0.85);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  backdrop-filter: blur(8px);
}

.game-scoreboard__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.game-scoreboard__error-message {
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

.game-scoreboard__retry {
  padding: var(--space-2) var(--space-4);
  background: var(--color-gold);
  color: var(--color-bg-primary);
  font-weight: var(--font-bold);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.game-scoreboard__retry:hover {
  opacity: 0.9;
}

.game-scoreboard__lock-section {
  margin-left: auto;
}

.game-scoreboard__lock-btn {
  padding: var(--space-1) var(--space-3);
  background: var(--color-gold);
  color: var(--color-bg-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.game-scoreboard__lock-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.game-scoreboard__lock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-scoreboard__lock-success {
  padding: var(--space-1) var(--space-2);
  background: rgba(34, 197, 94, 0.2);
  color: var(--color-success);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-sm);
}

@media (max-width: 900px) {
  .game-scoreboard__content {
    padding: var(--space-4);
    gap: var(--space-4);
  }
}

@media (max-width: 640px) {
  .game-scoreboard__header {
    flex-direction: column;
    text-align: center;
    gap: var(--space-2);
  }

  .game-scoreboard__title h1 {
    font-size: var(--text-2xl);
  }

  .game-scoreboard__footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>
