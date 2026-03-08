<script setup lang="ts">
import { computed, ref } from 'vue'
import PlayerRow from './PlayerRow.vue'

interface PlayerResult {
  playerId: number
  username: string
  teamSlug: string | null
  teamName: string | null
  finishPosition: number
  pointsEarned: number
  chips?: number
  avatar?: string
  country?: string
  isEliminated?: boolean
}

interface Props {
  players: PlayerResult[]
  showChips?: boolean
  showTeams?: boolean
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showChips: false,
  showTeams: true,
  maxDisplay: 18,
})

const showAll = ref(false)

const sortedPlayers = computed(() =>
  [...props.players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1
    if (!a.isEliminated && b.isEliminated) return -1
    return a.finishPosition - b.finishPosition
  })
)

const displayedPlayers = computed(() => {
  if (showAll.value) return sortedPlayers.value
  return sortedPlayers.value.slice(0, props.maxDisplay)
})

const hasMore = computed(() => sortedPlayers.value.length > props.maxDisplay)
const remainingCount = computed(() => sortedPlayers.value.length - props.maxDisplay)

const formattedPlayers = computed(() =>
  displayedPlayers.value.map((p) => ({
    id: p.playerId,
    username: p.username,
    avatar: p.avatar,
    teamId: p.teamSlug,
    teamName: p.teamName,
    teamSlug: p.teamSlug,
    finishPosition: p.finishPosition,
    pointsEarned: p.pointsEarned,
    chips: p.chips,
  }))
)
</script>

<template>
  <section class="player-rankings">
    <h2 class="player-rankings__header">Player Rankings</h2>
    <div class="player-rankings__list">
      <PlayerRow
        v-for="player in formattedPlayers"
        :key="player.id"
        :player="player"
        :show-team="showTeams"
        :show-chips="showChips"
      />
    </div>

    <button
      v-if="hasMore && !showAll"
      class="player-rankings__show-more"
      @click="showAll = true"
    >
      Show {{ remainingCount }} more players
    </button>

    <button
      v-if="showAll && hasMore"
      class="player-rankings__show-less"
      @click="showAll = false"
    >
      Show less
    </button>
  </section>
</template>

<style scoped>
.player-rankings {
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.player-rankings__header {
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

.player-rankings__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.player-rankings__show-more,
.player-rankings__show-less {
  width: 100%;
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.player-rankings__show-more:hover,
.player-rankings__show-less:hover {
  background: rgba(212, 175, 55, 0.2);
}

@media (max-width: 640px) {
  .player-rankings {
    padding: var(--space-3);
  }
}
</style>
