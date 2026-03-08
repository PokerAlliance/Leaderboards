<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useGameHistory } from '@/composables'
import { getTeamBySlug } from '@/config/teams'
import type { ParsedTournament } from '@/composables/useLeague'
import type { LeagueSlug, TeamGameScore } from '@/types'

interface Props {
  game: ParsedTournament
  leagueSlug: LeagueSlug
}

const props = defineProps<Props>()

const { load, getGameByTournamentId, getGameResults } = useGameHistory(props.leagueSlug)

const teamScores = ref<TeamGameScore[]>([])
const isLoading = ref(true)

const formattedDate = computed(() => format(props.game.startTime, 'EEEE, MMMM d, yyyy'))

const topTeams = computed(() => teamScores.value.slice(0, 3))

function getRankClass(rank: number): string {
  if (rank === 1) return 'team-score--gold'
  if (rank === 2) return 'team-score--silver'
  if (rank === 3) return 'team-score--bronze'
  return ''
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

function getTeamLogo(teamSlug: string): string {
  const team = getTeamBySlug(props.leagueSlug, teamSlug)
  return team?.logoUrl || ''
}

onMounted(async () => {
  await load()
  const game = getGameByTournamentId(props.game.id)
  if (game) {
    const results = getGameResults(game.game_id)
    if (results) {
      teamScores.value = results.teamScores
    }
  }
  isLoading.value = false
})
</script>

<template>
  <BaseCard variant="glass" padding="lg" class="recent-game">
    <template #header>
      <div class="recent-game__header">
        <span class="recent-game__badge">Most Recent Game</span>
        <span class="recent-game__date">{{ formattedDate }}</span>
      </div>
    </template>

    <div class="recent-game__content">
      <h3 class="recent-game__name">{{ game.name }}</h3>

      <div v-if="isLoading" class="recent-game__loading">
        <p>Loading results...</p>
      </div>

      <div v-else-if="topTeams.length > 0" class="recent-game__results">
        <div
          v-for="team in topTeams"
          :key="team.teamSlug"
          class="team-score"
          :class="getRankClass(team.rank)"
        >
          <span class="team-score__rank">{{ getRankIcon(team.rank) }}</span>
          <img
            :src="getTeamLogo(team.teamSlug)"
            :alt="team.teamName"
            class="team-score__logo"
          />
          <span class="team-score__name">{{ team.teamName }}</span>
          <span class="team-score__points">{{ team.totalPoints }} pts</span>
        </div>
      </div>

      <div v-else class="recent-game__no-results">
        <p>Results not yet available</p>
      </div>

      <RouterLink :to="`/league/${leagueSlug}/game/${game.id}`" class="recent-game__link">
        <BaseButton variant="primary" size="md" full-width>
          View Full Scoreboard
        </BaseButton>
      </RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
.recent-game__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.recent-game__badge {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.recent-game__date {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.recent-game__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.recent-game__name {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.recent-game__loading,
.recent-game__no-results {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.recent-game__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.team-score {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.team-score--gold {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.3);
}

.team-score--silver {
  background: rgba(168, 168, 168, 0.1);
  border-color: rgba(168, 168, 168, 0.3);
}

.team-score--bronze {
  background: rgba(205, 127, 50, 0.1);
  border-color: rgba(205, 127, 50, 0.3);
}

.team-score__rank {
  font-size: var(--text-xl);
  width: 32px;
  text-align: center;
}

.team-score__logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.team-score__name {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.team-score__points {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.team-score--gold .team-score__points {
  color: var(--color-gold);
}

.recent-game__link {
  text-decoration: none;
  margin-top: var(--space-2);
}
</style>
