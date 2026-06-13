<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth, useTournament, useTeamRoster, useScoring } from '@/composables'
import { sheetsClient } from '@/services/sheets'
import { LoginForm, ScoreEditor, ConfirmDialog } from '@/components/admin'
import LockResultModal from '@/components/admin/LockResultModal.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { LeagueSlug, GameSavePayload, Tournament, LockTournamentResponse, LockableLeague } from '@/types'

const LOCKABLE_LEAGUES: LockableLeague[] = ['donks', 'anarchy', 'muckers']

const auth = useAuth()
const { isLoggedIn, username, leagueSlug: adminLeague, logout, initialize, getAdminKey } = auth

const selectedLeague = ref<LeagueSlug>('donks')
const tournamentIdInput = ref('')
const loadError = ref('')
const saveError = ref('')
const saveSuccess = ref(false)
const isLoading = ref(false)

const isQuickLockLeague = computed(() => LOCKABLE_LEAGUES.includes(selectedLeague.value as LockableLeague))

const lockResult = ref<LockTournamentResponse | null>(null)
const showLockModal = ref(false)
const lockError = ref('')

const showErrorDialog = ref(false)
const errorDialogTitle = ref('')
const errorDialogMessage = ref('')

const scoreEditorRef = ref<InstanceType<typeof ScoreEditor> | null>(null)

const {
  tournament: tournamentData,
  isLoading: tournamentLoading,
  error: tournamentError,
  load: loadTournament,
} = useTournament(undefined, { enablePolling: false })

const {
  load: loadRoster,
  getPlayerTeam,
  isLoading: rosterLoading,
} = useTeamRoster(selectedLeague.value)

const scoring = useScoring(selectedLeague.value, { getPlayerTeam })

const tournament = computed<Tournament | null>(() => tournamentData.value)
const hasScores = computed(() => scoring.teamScores.value.length > 0)

watch(selectedLeague, () => {
  tournamentIdInput.value = ''
  loadError.value = ''
  lockError.value = ''
  saveError.value = ''
  saveSuccess.value = false
  if (!isQuickLockLeague.value) {
    loadRoster()
  }
})

onMounted(async () => {
  await initialize()
  if (isLoggedIn.value && !isQuickLockLeague.value) {
    await loadRoster()
  }
})

async function handleLoginSuccess() {
  if (!isQuickLockLeague.value) {
    await loadRoster()
  }
}

async function handleLoadTournament() {
  const id = parseInt(tournamentIdInput.value, 10)
  if (isNaN(id) || id <= 0) {
    loadError.value = 'Please enter a valid tournament ID'
    return
  }

  loadError.value = ''
  saveSuccess.value = false
  saveError.value = ''
  isLoading.value = true

  try {
    await loadTournament(id)

    if (tournament.value) {
      scoring.calculateFromTournament(tournament.value)
    }
  } catch {
    loadError.value = tournamentError.value?.message || 'Failed to load tournament'
  } finally {
    isLoading.value = false
  }
}

async function handleQuickLock() {
  const id = parseInt(tournamentIdInput.value, 10)
  if (isNaN(id) || id <= 0) {
    lockError.value = 'Please enter a valid tournament ID'
    return
  }

  const adminKey = getAdminKey()
  if (!adminKey) {
    lockError.value = 'Session expired. Please log in again.'
    return
  }

  lockError.value = ''
  isLoading.value = true

  try {
    const result = await sheetsClient.lockTournament(
      selectedLeague.value as LockableLeague,
      id,
      adminKey
    )

    if (result.success) {
      lockResult.value = result
      showLockModal.value = true
    } else {
      errorDialogTitle.value = 'Lock Failed'
      errorDialogMessage.value = result.error || 'Failed to lock tournament'
      showErrorDialog.value = true
    }
  } catch (err) {
    errorDialogTitle.value = 'Unexpected Error'
    errorDialogMessage.value = err instanceof Error ? err.message : 'An unexpected error occurred'
    showErrorDialog.value = true
  } finally {
    isLoading.value = false
  }
}

function handleCloseLockModal() {
  showLockModal.value = false
  if (lockResult.value && !lockResult.value.alreadyLocked) {
    tournamentIdInput.value = ''
  }
}

async function handleSave(payload: GameSavePayload) {
  saveError.value = ''
  saveSuccess.value = false

  const adminKey = getAdminKey()
  if (!adminKey) {
    saveError.value = 'Session expired. Please log in again.'
    scoreEditorRef.value?.resetSaving()
    return
  }

  const result = await sheetsClient.saveGameResults(selectedLeague.value, payload, adminKey)

  if (result.success) {
    saveSuccess.value = true
    scoreEditorRef.value?.resetSaving()
  } else {
    saveError.value = result.error || 'Failed to save results'
    scoreEditorRef.value?.resetSaving()
  }
}

function handleLogout() {
  logout()
  tournamentIdInput.value = ''
  loadError.value = ''
  lockError.value = ''
  saveError.value = ''
  saveSuccess.value = false
}

const leagueLabel: Record<string, string> = {
  donks: 'Donks',
  anarchy: 'Anarchy',
  muckers: 'Muckers',
  dreamweaver: 'Dreamweaver',
}
</script>

<template>
  <main class="admin-view">
    <div class="admin-view__container">
      <header class="admin-view__header">
        <h1 class="admin-view__title">Admin Panel</h1>
        <p class="admin-view__subtitle">Manage league scores and lock in game results</p>
      </header>

      <template v-if="!isLoggedIn">
        <LoginForm @success="handleLoginSuccess" />
      </template>

      <template v-else>
        <BaseCard class="admin-view__user-info">
          <div class="admin-view__user-row">
            <div class="admin-view__user-details">
              <span class="admin-view__user-label">Logged in as:</span>
              <span class="admin-view__user-name">{{ username }}</span>
              <span v-if="adminLeague !== 'all'" class="admin-view__user-league">
                ({{ adminLeague }})
              </span>
            </div>
            <BaseButton variant="ghost" size="sm" @click="handleLogout">
              Logout
            </BaseButton>
          </div>
        </BaseCard>

        <!-- Quick Lock section for Donks / Anarchy / Muckers -->
        <BaseCard class="admin-view__loader">
          <h2 class="admin-view__section-title">
            {{ isQuickLockLeague ? 'Quick Lock Tournament' : 'Load Tournament' }}
          </h2>

          <div class="admin-view__form-row">
            <div class="admin-view__input-group">
              <label for="league-select" class="admin-view__label">League</label>
              <select
                id="league-select"
                v-model="selectedLeague"
                class="admin-view__select"
               
              >
                <option  :disabled="adminLeague !== 'all' && adminLeague !== 'donks'" value="donks">Donks</option>
                <option  :disabled="adminLeague !== 'all' && adminLeague !== 'anarchy'" value="anarchy">Anarchy</option>
                <option  :disabled="adminLeague !== 'all' && adminLeague !== 'muckers'" value="muckers">Muckers</option>
                <option  :disabled="adminLeague !== 'all' && adminLeague !== 'dreamweaver'" value="dreamweaver">Dreamweaver</option>
              </select>
            </div>

            <div class="admin-view__input-group admin-view__input-group--grow">
              <label for="tournament-id" class="admin-view__label">Tournament ID</label>
              <input
                id="tournament-id"
                v-model="tournamentIdInput"
                type="text"
                class="admin-view__input"
                placeholder="e.g., 8323877"
                @keyup.enter="isQuickLockLeague ? handleQuickLock() : handleLoadTournament()"
              />
            </div>

            <BaseButton
              v-if="isQuickLockLeague"
              variant="primary"
              :loading="isLoading"
              :disabled="!tournamentIdInput"
              class="admin-view__load-btn"
              @click="handleQuickLock"
            >
              <span class="admin-view__btn-icon">&#128274;</span>
              Lock {{ leagueLabel[selectedLeague] || selectedLeague }}
            </BaseButton>
            <BaseButton
              v-else
              variant="primary"
              :loading="isLoading || tournamentLoading || rosterLoading"
              :disabled="!tournamentIdInput"
              class="admin-view__load-btn"
              @click="handleLoadTournament"
            >
              Load
            </BaseButton>
          </div>

          <p v-if="isQuickLockLeague" class="admin-view__hint admin-view__hint--info">
            Enter a Replay tournament ID. The backend will fetch results, determine the
            {{ selectedLeague === 'donks' ? 'cup' : 'slot' }}, and lock the game automatically.
          </p>

          <div v-if="loadError && !isQuickLockLeague" class="admin-view__error">
            {{ loadError }}
          </div>
          <div v-if="lockError && isQuickLockLeague" class="admin-view__error">
            {{ lockError }}
          </div>
        </BaseCard>

        <!-- Dreamweaver: existing ScoreEditor flow -->
        <template v-if="!isQuickLockLeague">
          <div v-if="saveSuccess" class="admin-view__success">
            Results saved successfully!
          </div>

          <div v-if="saveError" class="admin-view__error">
            {{ saveError }}
          </div>

          <template v-if="tournament && hasScores">
            <ScoreEditor
              ref="scoreEditorRef"
              :tournament="tournament"
              :league-slug="selectedLeague"
              :team-scores="scoring.teamScores.value"
              :player-results="scoring.playerResults.value"
              :unassigned-players="scoring.unassignedPlayers.value"
              @save="handleSave"
            />
          </template>

          <template v-else-if="tournament && !hasScores">
            <BaseCard class="admin-view__empty">
              <p>Tournament loaded but no team scores calculated.</p>
              <p class="admin-view__hint">Make sure the team roster is set up correctly.</p>
            </BaseCard>
          </template>
        </template>
      </template>

      <nav class="admin-view__nav">
        <router-link to="/" class="admin-view__link">&larr; Back to Home</router-link>
      </nav>
    </div>

    <!-- Lock Result / Recap Modal -->
    <LockResultModal
      v-if="showLockModal && lockResult"
      :result="lockResult"
      @close="handleCloseLockModal"
    />

    <!-- Error Dialog -->
    <ConfirmDialog
      :open="showErrorDialog"
      :title="errorDialogTitle"
      :message="errorDialogMessage"
      confirm-text="OK"
      cancel-text="Dismiss"
      @confirm="showErrorDialog = false"
      @cancel="showErrorDialog = false"
    />
  </main>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  padding: var(--space-6);
  background: var(--color-bg-base);
}

.admin-view__container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-view__header {
  text-align: center;
}

.admin-view__title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  margin: 0 0 var(--space-2);
}

.admin-view__subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.admin-view__user-info {
  padding: var(--space-3) var(--space-4);
}

.admin-view__user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.admin-view__user-details {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.admin-view__user-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.admin-view__user-name {
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.admin-view__user-league {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.admin-view__section-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.admin-view__form-row {
  display: flex;
  gap: var(--space-4);
  align-items: flex-end;
}

.admin-view__input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.admin-view__input-group--grow {
  flex: 1;
}

.admin-view__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.admin-view__select,
.admin-view__input {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  min-height: 40px;
}

.admin-view__select:focus,
.admin-view__input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.admin-view__select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-view__load-btn {
  flex-shrink: 0;
}

.admin-view__btn-icon {
  margin-right: var(--space-1);
}

.admin-view__error {
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  margin-top: var(--space-4);
}

.admin-view__success {
  padding: var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-success);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
  text-align: center;
}

.admin-view__hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.admin-view__hint--info {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(96, 165, 250, 0.08);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.admin-view__empty {
  text-align: center;
  color: var(--color-text-secondary);
}

.admin-view__nav {
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-view__link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--transition-base);
}

.admin-view__link:hover {
  color: var(--color-gold);
}

@media (max-width: 640px) {
  .admin-view {
    padding: var(--space-4);
  }

  .admin-view__form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-view__load-btn {
    width: 100%;
  }

  .admin-view__user-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
</style>
