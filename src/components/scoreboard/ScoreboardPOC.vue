<script setup lang="ts">
  import { computed } from 'vue'
  import { format } from 'date-fns'
  import TeamRow from './TeamRow.vue'
  import PlayerRow from './PlayerRow.vue'
  import LiveBadge from './LiveBadge.vue'
  import type { MockTournament } from '@/mocks/dreamweaver-game'

  interface Props {
    tournament: MockTournament
  }

  const props = defineProps<Props>()

  const isLive = computed(() => props.tournament.state === 'running')

  const formattedDate = computed(() => {
    const date = new Date(props.tournament.start)
    return format(date, "EEEE, MMMM d, yyyy • h:mm a 'EST'")
  })

  const sortedTeams = computed(() =>
    [...props.tournament.teams].sort((a, b) => b.totalPoints - a.totalPoints)
  )

  const topPlayers = computed(() => props.tournament.players.slice(0, 10))

  const showChips = computed(() => isLive.value)
</script>

<template>
  <div class="scoreboard theme-dreamweaver">
    <div class="scoreboard__bg-fixed" />

    <div class="scoreboard__wrapper">
      <header class="scoreboard__header">
        <div class="scoreboard__league-logo">
          <div class="alliance-logo" />
        </div>

        <div class="scoreboard__title">
          <h1>{{ tournament.name }}</h1>
          <p class="scoreboard__date">{{ formattedDate }}</p>
        </div>

        <div class="scoreboard__status">
          <LiveBadge v-if="isLive" />
          <span v-else class="scoreboard__finished">FINAL</span>
        </div>
      </header>

      <div class="scoreboard__content">
        <section class="scoreboard__teams">
          <h2 class="section-header">Team Standings</h2>
          <div class="scoreboard__teams-list">
            <TeamRow
              v-for="(team, index) in sortedTeams"
              :key="team.id"
              :team="team"
              :rank="index + 1"
              :show-month-points="!isLive"
            />
          </div>
        </section>

        <section class="scoreboard__players">
          <h2 class="section-header">Player Rankings</h2>
          <div class="scoreboard__players-list">
            <PlayerRow
              v-for="player in topPlayers"
              :key="player.id"
              :player="player"
              :show-chips="showChips"
            />
          </div>

          <div v-if="tournament.unassignedPlayers.length > 0" class="unassigned-section">
            <span class="unassigned-label">Unassigned Players</span>
            <div class="scoreboard__unassigned-list">
              <PlayerRow
                v-for="player in tournament.unassignedPlayers"
                :key="player.id"
                :player="player"
                :show-team="false"
              />
            </div>
          </div>
        </section>
      </div>

      <footer class="scoreboard__footer">
        <span class="scoreboard__total">{{ tournament.totalPlayers }} players</span>
        <span class="scoreboard__league">{{ tournament.leagueName }}</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
  .scoreboard {
    position: relative;
    min-height: 100vh;
    width: 100%;
  }

  .scoreboard__bg-fixed {
    position: fixed;
    inset: 0;
    background-image: url('/assets/backgrounds/dw-background.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    z-index: 1;
  }

  .scoreboard__wrapper {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .scoreboard__header {
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

  .scoreboard__league-logo {
    flex-shrink: 0;
  }

  .scoreboard__title {
    flex: 1;
  }

  .scoreboard__title h1 {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  }

  .scoreboard__date {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: var(--space-1) 0 0;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  }

  .scoreboard__status {
    flex-shrink: 0;
  }

  .scoreboard__finished {
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

  .scoreboard__content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    max-width: 1000px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-8) var(--space-6);
  }

  .scoreboard__teams,
  .scoreboard__players {
    background: rgba(10, 15, 20, 0.75);
    backdrop-filter: blur(12px);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    border: 1px solid rgba(212, 175, 55, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .scoreboard__teams-list,
  .scoreboard__players-list,
  .scoreboard__unassigned-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .scoreboard__footer {
    display: flex;
    justify-content: space-between;
    padding: var(--space-3) var(--space-6);
    background: rgba(10, 15, 20, 0.85);
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    backdrop-filter: blur(8px);
  }

  @media (max-width: 900px) {
    .scoreboard__content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .scoreboard__header {
      flex-direction: column;
      text-align: center;
      gap: var(--space-2);
    }

    .scoreboard__title h1 {
      font-size: var(--text-2xl);
    }

    .scoreboard__content {
      padding: var(--space-4);
      gap: var(--space-4);
    }

    .scoreboard__teams,
    .scoreboard__players {
      padding: var(--space-3);
    }
  }
</style>
