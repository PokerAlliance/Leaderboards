<script setup lang="ts">
/**
 * Dreamweaver Game View
 * League-specific game scoreboard for Dreamweaver
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameScoreboard from '@/components/scoreboard/GameScoreboard.vue'
import type { LeagueSlug } from '@/types'

const LEAGUE_SLUG: LeagueSlug = 'dreamweaver'

interface Props {
  tournamentId: string
}

const props = defineProps<Props>()
const router = useRouter()

const parsedTournamentId = computed(() => {
  const id = parseInt(props.tournamentId, 10)
  return isNaN(id) ? null : id
})

const scoreboardError = ref<string | null>(null)

function handleError(error: Error) {
  scoreboardError.value = error.message
}

function handleUpdate(data: { isLive: boolean; isFinished: boolean }) {
  console.log('Scoreboard update:', data)
}

function handleLocked() {
  console.log('Game results locked')
}

function goBack() {
  router.push(`/league/${LEAGUE_SLUG}`)
}
</script>

<template>
  <main class="game-view">
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
          <span>Back to Dreamweaver</span>
        </button>
      </nav>

      <GameScoreboard
        :tournament-id="parsedTournamentId"
        :league-slug="LEAGUE_SLUG"
        :poll-interval="30000"
        @error="handleError"
        @update="handleUpdate"
        @locked="handleLocked"
      />
    </template>
  </main>
</template>

<style scoped>
.game-view {
  min-height: 100vh;
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
  background: rgba(10, 15, 20, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(8px);
}

.game-view__back-btn:hover {
  background: rgba(20, 30, 40, 0.9);
  border-color: var(--color-gold);
}

.game-view__back-icon {
  font-size: var(--text-lg);
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

.game-view__error p {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}
</style>
