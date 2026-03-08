<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PenaltyInput from './PenaltyInput.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { getTeamColor } from '@/config/teams'
import { getScoringStrategy } from '@/services/scoring'
import type {
  LeagueSlug,
  Tournament,
  TeamGameScore,
  PlayerGameResult,
  GameSavePayload,
  TeamScorePayload,
  PlayerResultPayload,
} from '@/types'

interface Props {
  tournament: Tournament
  leagueSlug: LeagueSlug
  teamScores: TeamGameScore[]
  playerResults: PlayerGameResult[]
  unassignedPlayers: PlayerGameResult[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [payload: GameSavePayload]
}>()

const penalties = ref<Record<string, number>>({})
const showConfirm = ref(false)
const isSaving = ref(false)

watch(
  () => props.teamScores,
  (scores) => {
    const newPenalties: Record<string, number> = {}
    for (const score of scores) {
      newPenalties[score.teamSlug] = penalties.value[score.teamSlug] || 0
    }
    penalties.value = newPenalties
  },
  { immediate: true }
)

const sortedTeamScores = computed(() => {
  const scores = props.teamScores.map((score) => ({
    ...score,
    penalty: penalties.value[score.teamSlug] || 0,
    finalPoints: score.totalPoints - (penalties.value[score.teamSlug] || 0),
  }))

  return scores.sort((a, b) => b.finalPoints - a.finalPoints)
})

const strategy = computed(() => getScoringStrategy(props.leagueSlug))

const rankedTeamScores = computed(() => {
  const ranked = sortedTeamScores.value.map((score, index) => ({
    ...score,
    rank: index + 1,
    monthPoints: strategy.value.calculateMonthPoints(index + 1, sortedTeamScores.value.length),
  }))

  for (let i = 1; i < ranked.length; i++) {
    const current = ranked[i]
    const previous = ranked[i - 1]
    if (current && previous && current.finalPoints === previous.finalPoints) {
      current.rank = previous.rank
      current.monthPoints = previous.monthPoints
    }
  }

  return ranked
})

const hasUnassignedPlayers = computed(() => props.unassignedPlayers.length > 0)

const gameInfo = computed(() => {
  const gameDate = new Date(props.tournament.startTime)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
  const dayIndex = gameDate.getDay()
  const dayName = dayNames[dayIndex] ?? 'Unknown'

  return {
    date: format(gameDate, 'MMMM d, yyyy'),
    day: dayName,
    gameId: format(gameDate, 'yyyy_MM_dd'),
    gameDay: dayName.toLowerCase(),
    totalPlayers: props.tournament.totalPlayers,
    isFinished: props.tournament.state === 'finished',
  }
})

function handleSaveClick() {
  showConfirm.value = true
}

function handleConfirm() {
  const teamScores: TeamScorePayload[] = rankedTeamScores.value.map((score) => ({
    teamSlug: score.teamSlug,
    teamName: score.teamName,
    totalPoints: score.totalPoints,
    rank: score.rank,
    monthPoints: score.monthPoints,
    penalty: score.penalty,
  }))

  const playerResultsPayload: PlayerResultPayload[] = props.playerResults.map((result) => ({
    playerId: result.playerId,
    username: result.username,
    teamSlugAtGame: result.teamSlug,
    finishPosition: result.finishPosition,
    pointsEarned: result.pointsEarned,
  }))

  const payload: GameSavePayload = {
    gameId: gameInfo.value.gameId,
    tournamentId: props.tournament.id,
    gameDate: format(new Date(props.tournament.startTime), 'yyyy-MM-dd'),
    gameDay: gameInfo.value.gameDay,
    totalPlayers: gameInfo.value.totalPlayers,
    teamScores,
    playerResults: playerResultsPayload,
  }

  isSaving.value = true
  emit('save', payload)
}

function handleCancel() {
  showConfirm.value = false
}

function resetSaving() {
  isSaving.value = false
  showConfirm.value = false
}

defineExpose({ resetSaving })
</script>

<template>
  <div class="score-editor">
    <BaseCard class="score-editor__header">
      <div class="score-editor__game-info">
        <h2 class="score-editor__title">{{ tournament.name }}</h2>
        <div class="score-editor__meta">
          <span>{{ gameInfo.date }}</span>
          <span class="score-editor__separator">•</span>
          <span>{{ gameInfo.day }}</span>
          <span class="score-editor__separator">•</span>
          <span>{{ gameInfo.totalPlayers }} players</span>
        </div>
        <div v-if="gameInfo.isFinished" class="score-editor__status score-editor__status--finished">
          Finished
        </div>
        <div v-else class="score-editor__status score-editor__status--live">
          In Progress
        </div>
      </div>
    </BaseCard>

    <div v-if="hasUnassignedPlayers" class="score-editor__warning">
      <span class="score-editor__warning-icon">⚠️</span>
      <span>
        {{ unassignedPlayers.length }} player(s) not assigned to any team.
        Results will still be saved, but these players won't contribute to team scores.
      </span>
    </div>

    <BaseCard class="score-editor__teams">
      <h3 class="score-editor__section-title">Team Scores & Penalties</h3>

      <div class="score-editor__team-list">
        <PenaltyInput
          v-for="score in sortedTeamScores"
          :key="score.teamSlug"
          :model-value="penalties[score.teamSlug] ?? 0"
          :team-name="score.teamName"
          :team-slug="score.teamSlug"
          :team-color="getTeamColor(leagueSlug, score.teamSlug)"
          :total-points="score.totalPoints"
          @update:model-value="penalties[score.teamSlug] = $event"
        />
      </div>
    </BaseCard>

    <BaseCard class="score-editor__rankings">
      <h3 class="score-editor__section-title">Final Rankings</h3>

      <div class="score-editor__ranking-list">
        <div
          v-for="score in rankedTeamScores"
          :key="score.teamSlug"
          class="score-editor__ranking-row"
        >
          <span class="score-editor__rank">#{{ score.rank }}</span>
          <span
            class="score-editor__team-color"
            :style="{ backgroundColor: getTeamColor(leagueSlug, score.teamSlug) }"
          />
          <span class="score-editor__team-name">{{ score.teamName }}</span>
          <span class="score-editor__final-score">{{ score.finalPoints }} pts</span>
          <span class="score-editor__month-points">+{{ score.monthPoints }} month pts</span>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="hasUnassignedPlayers" class="score-editor__unassigned">
      <h3 class="score-editor__section-title">Unassigned Players</h3>
      <div class="score-editor__unassigned-list">
        <div
          v-for="player in unassignedPlayers"
          :key="player.playerId"
          class="score-editor__unassigned-row"
        >
          <span class="score-editor__player-position">#{{ player.finishPosition }}</span>
          <span class="score-editor__player-name">{{ player.username }}</span>
          <span class="score-editor__player-points">{{ player.pointsEarned }} pts</span>
        </div>
      </div>
    </BaseCard>

    <div class="score-editor__actions">
      <BaseButton
        variant="primary"
        size="lg"
        :disabled="!gameInfo.isFinished"
        @click="handleSaveClick"
      >
        Lock In Results
      </BaseButton>
      <p v-if="!gameInfo.isFinished" class="score-editor__hint">
        Game must be finished before saving results
      </p>
    </div>

    <ConfirmDialog
      :open="showConfirm"
      title="Lock In Results"
      :message="
        hasUnassignedPlayers
          ? `Save these results? Note: ${unassignedPlayers.length} player(s) are not assigned to teams.`
          : 'Save these results to the spreadsheet? This action can be edited later if needed.'
      "
      confirm-text="Save Results"
      :loading="isSaving"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.score-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.score-editor__header {
  text-align: center;
}

.score-editor__game-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.score-editor__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.score-editor__meta {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.score-editor__separator {
  margin: 0 var(--space-2);
}

.score-editor__status {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-full);
}

.score-editor__status--finished {
  color: var(--color-success);
  background: rgba(34, 197, 94, 0.15);
}

.score-editor__status--live {
  color: var(--color-live);
  background: rgba(239, 68, 68, 0.15);
}

.score-editor__warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-warning);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
}

.score-editor__warning-icon {
  flex-shrink: 0;
}

.score-editor__section-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.score-editor__team-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.score-editor__ranking-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.score-editor__ranking-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
}

.score-editor__rank {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  min-width: 40px;
}

.score-editor__team-color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.score-editor__team-name {
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  flex: 1;
}

.score-editor__final-score {
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.score-editor__month-points {
  font-size: var(--text-sm);
  color: var(--color-gold);
}

.score-editor__unassigned-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.score-editor__unassigned-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: rgba(245, 158, 11, 0.05);
  border-radius: var(--radius-sm);
}

.score-editor__player-position {
  font-family: var(--font-mono);
  min-width: 30px;
}

.score-editor__player-name {
  flex: 1;
}

.score-editor__player-points {
  font-family: var(--font-mono);
}

.score-editor__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-4);
}

.score-editor__hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}
</style>
