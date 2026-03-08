<script setup lang="ts">
import { computed } from 'vue'
import { getTeams } from '@/config/teams'
import { getLeagueConfig } from '@/config/leagues'
import type { LeagueSlug } from '@/types'
import type { LeagueInfo } from '@/composables/useLeague'

interface Props {
  leagueSlug: LeagueSlug
  leagueInfo?: LeagueInfo | null
}

const props = defineProps<Props>()

const config = computed(() => getLeagueConfig(props.leagueSlug))
const teams = computed(() => getTeams(props.leagueSlug))

const memberCount = computed(() => props.leagueInfo?.membersCount ?? 0)
</script>

<template>
  <header class="league-header">
    <div class="league-header__content">
      <div class="league-header__info">
        <h1 class="league-header__name">{{ config.name }}</h1>
        <div class="league-header__meta">
          <span class="league-header__badge">{{ config.seasonType }} League</span>
          <span v-if="memberCount > 0" class="league-header__members">
            {{ memberCount }} members
          </span>
        </div>
      </div>

      <div v-if="teams.length > 0" class="league-header__teams">
        <div
          v-for="team in teams"
          :key="team.slug"
          class="league-header__team"
          :title="team.name"
        >
          <img :src="team.logoUrl" :alt="team.name" class="league-header__team-logo" />
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.league-header {
  padding: var(--space-6) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.league-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.league-header__info {
  flex: 1;
  min-width: 200px;
}

.league-header__name {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.league-header__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.league-header__badge {
  font-size: var(--text-xs);
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(212, 175, 55, 0.15);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.league-header__members {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.league-header__teams {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.league-header__team {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-elevated);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all var(--transition-base);
}

.league-header__team:hover {
  transform: scale(1.1);
  border-color: var(--color-gold);
  box-shadow: var(--shadow-glow);
}

.league-header__team-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .league-header__name {
    font-size: var(--text-2xl);
  }

  .league-header__team {
    width: 40px;
    height: 40px;
  }
}
</style>
