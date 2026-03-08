<script setup lang="ts">
import { computed } from 'vue'
import PlayerRow from './PlayerRow.vue'
import type { PlayerGameResult } from '@/types'

interface Props {
  players: PlayerGameResult[]
  showChips?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showChips: false,
})

const sortedPlayers = computed(() =>
  [...props.players].sort((a, b) => a.finishPosition - b.finishPosition)
)

const formattedPlayers = computed(() =>
  sortedPlayers.value.map((p) => ({
    id: p.playerId,
    username: p.username,
    avatar: undefined,
    teamId: null,
    teamName: null,
    teamSlug: null,
    finishPosition: p.finishPosition,
    pointsEarned: p.pointsEarned,
    chips: undefined,
  }))
)
</script>

<template>
  <section class="unassigned-players">
    <div class="unassigned-players__header">
      <span class="unassigned-players__icon">?</span>
      <h3 class="unassigned-players__title">Unassigned Players</h3>
      <span class="unassigned-players__count">{{ players.length }}</span>
    </div>
    <p class="unassigned-players__note">
      These players are not assigned to any team in the roster.
    </p>
    <div class="unassigned-players__list">
      <PlayerRow
        v-for="player in formattedPlayers"
        :key="player.id"
        :player="player"
        :show-team="false"
        :show-chips="showChips"
      />
    </div>
  </section>
</template>

<style scoped>
.unassigned-players {
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid rgba(234, 179, 8, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.unassigned-players__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.unassigned-players__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-radius: 50%;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: rgb(234, 179, 8);
}

.unassigned-players__title {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: rgb(234, 179, 8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.unassigned-players__count {
  padding: var(--space-1) var(--space-2);
  background: rgba(234, 179, 8, 0.1);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: rgb(234, 179, 8);
}

.unassigned-players__note {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid rgba(234, 179, 8, 0.15);
}

.unassigned-players__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .unassigned-players {
    padding: var(--space-3);
  }
}
</style>
