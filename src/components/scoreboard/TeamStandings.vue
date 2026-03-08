<script setup lang="ts">
import { computed } from 'vue'
import TeamRow from './TeamRow.vue'
import type { TeamGameScore } from '@/types'

interface Props {
  teams: TeamGameScore[]
  isLive?: boolean
  showMonthPoints?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLive: false,
  showMonthPoints: false,
})

const sortedTeams = computed(() =>
  [...props.teams].sort((a, b) => b.totalPoints - a.totalPoints)
)

const formattedTeams = computed(() =>
  sortedTeams.value.map((team) => ({
    id: team.teamSlug,
    name: team.teamName,
    slug: team.teamSlug,
    totalPoints: team.totalPoints,
    monthPoints: undefined,
    playerCount: team.playerResults.length,
  }))
)
</script>

<template>
  <section class="team-standings">
    <h2 class="team-standings__header">Team Standings</h2>
    <div class="team-standings__list">
      <TeamRow
        v-for="(team, index) in formattedTeams"
        :key="team.id"
        :team="team"
        :rank="index + 1"
        :show-month-points="showMonthPoints && !isLive"
      />
    </div>
  </section>
</template>

<style scoped>
.team-standings {
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.team-standings__header {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.team-standings__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .team-standings {
    padding: var(--space-3);
  }
}
</style>
