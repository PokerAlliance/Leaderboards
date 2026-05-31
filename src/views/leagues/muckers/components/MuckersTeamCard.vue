<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getMuckersTeam } from '@/config/teams'
import type { MuckersTeamSlug } from '@/types/muckers'

const props = defineProps<{
  teamSlug: string
}>()

const store = useMuckersStore()
const expanded = ref(false)

const slug = computed(() => props.teamSlug as MuckersTeamSlug)
const teamConfig = computed(() => getMuckersTeam(slug.value))
const detail = computed(() => store.getTeamDetail(slug.value))
const isDissolved = computed(() => slug.value === 'maniac_muckers')

const teamRank = computed(() => {
  const standing = store.teamStandings.value.find(s => s.teamSlug === slug.value)
  return standing?.rank ?? null
})

const teamPoints = computed(() => {
  const standing = store.teamStandings.value.find(s => s.teamSlug === slug.value)
  return standing?.totalPoints ?? detail.value?.quarterlyTotal ?? 0
})

const accentColor = computed(() => teamConfig.value?.color ?? '#64748B')
</script>

<template>
  <div
    class="mk-tcard mk-glass"
    :style="{ '--team-accent': accentColor }"
  >
    <!-- Header -->
    <div class="mk-tcard__header">
      <img
        v-if="teamConfig?.logoUrl"
        :src="teamConfig.logoUrl"
        :alt="teamConfig.name"
        class="mk-tcard__logo"
        loading="lazy"
      />
      <div class="mk-tcard__info">
        <div class="mk-tcard__name-row">
          <span class="mk-tcard__name">{{ teamConfig?.name ?? teamSlug }}</span>
          <span v-if="isDissolved" class="mk-tcard__dissolved">DISSOLVED</span>
        </div>
        <div class="mk-tcard__meta">
          <span v-if="detail?.captain" class="mk-tcard__captain">
            Captain: <strong>{{ detail.captain }}</strong>
          </span>
          <span class="mk-tcard__members">{{ detail?.memberCount ?? 0 }} members</span>
        </div>
      </div>
      <div class="mk-tcard__stats">
        <span class="mk-tcard__points">{{ teamPoints }}</span>
        <span class="mk-tcard__points-label">pts</span>
        <span v-if="teamRank" class="mk-tcard__rank">Rank #{{ teamRank }}</span>
      </div>
    </div>

    <!-- Toggle -->
    <button class="mk-tcard__toggle" @click="expanded = !expanded">
      <span class="mk-tcard__toggle-icon" :class="{ 'mk-tcard__toggle-icon--open': expanded }">
        &#9662;
      </span>
      {{ expanded ? 'Hide Members' : 'Show Members' }}
    </button>

    <!-- Member List -->
    <Transition name="mk-expand">
      <div v-if="expanded && detail" class="mk-tcard__members-list">
        <div
          v-for="member in detail.members"
          :key="member.username"
          class="mk-tcard__member"
        >
          <img
            v-if="store.getAvatar(member.username)"
            :src="store.getAvatar(member.username)"
            class="mk-tcard__member-avatar"
            alt=""
            loading="lazy"
          />
          <span class="mk-tcard__member-name">{{ member.username }}</span>
          <span class="mk-tcard__member-pts">{{ member.totalPoints }} pts</span>
          <span class="mk-tcard__member-gp">{{ member.gamesPlayed }} GP</span>
          <span class="mk-tcard__member-avg">
            {{ member.gamesPlayed > 0 ? member.averagePerGame.toFixed(1) : '0.0' }} avg
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mk-tcard {
  border-left: 4px solid var(--team-accent, #64748B);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Header ──────────────────────── */

.mk-tcard__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
}

.mk-tcard__logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-tcard__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mk-tcard__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mk-tcard__name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-mk-navy, #1B2A4A);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-tcard__dissolved {
  display: inline-block;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #EF4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 0.1rem 0.45rem;
  border-radius: 3px;
}

.mk-tcard__meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.72rem;
  color: var(--color-mk-text-muted, #64748B);
  flex-wrap: wrap;
}

.mk-tcard__captain strong {
  color: var(--color-mk-navy, #1B2A4A);
  font-weight: 600;
}

.mk-tcard__stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 0;
}

.mk-tcard__points {
  font-weight: 800;
  font-size: 1.3rem;
  color: var(--color-mk-cyan, #00B4D8);
  line-height: 1;
}

.mk-tcard__points-label {
  font-size: 0.6rem;
  color: var(--color-mk-text-muted, #64748B);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.mk-tcard__rank {
  font-size: 0.68rem;
  color: var(--color-mk-text-muted, #64748B);
  font-weight: 600;
  margin-top: 0.15rem;
}

/* ─── Toggle ──────────────────────── */

.mk-tcard__toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-mk-cyan, #00B4D8);
  background: rgba(0, 180, 216, 0.04);
  border: none;
  border-top: 1px solid rgba(100, 120, 160, 0.1);
  cursor: pointer;
  transition: background 0.15s ease;
}

.mk-tcard__toggle:hover {
  background: rgba(0, 180, 216, 0.08);
}

.mk-tcard__toggle-icon {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.6rem;
}

.mk-tcard__toggle-icon--open {
  transform: rotate(180deg);
}

/* ─── Member List ─────────────────── */

.mk-tcard__members-list {
  border-top: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-tcard__member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1.25rem;
  font-size: 0.78rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.05);
}

.mk-tcard__member:last-child {
  border-bottom: none;
}

.mk-tcard__member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-tcard__member-name {
  font-weight: 600;
  color: var(--color-mk-navy, #1B2A4A);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-tcard__member-pts {
  font-weight: 700;
  color: var(--color-mk-navy, #1B2A4A);
  font-size: 0.75rem;
  white-space: nowrap;
}

.mk-tcard__member-gp {
  color: var(--color-mk-text-muted, #64748B);
  font-size: 0.7rem;
  white-space: nowrap;
}

.mk-tcard__member-avg {
  color: var(--color-mk-text-muted, #64748B);
  font-size: 0.65rem;
  white-space: nowrap;
}

/* ─── Expand transition ──────────── */

.mk-expand-enter-active,
.mk-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.mk-expand-enter-from,
.mk-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.mk-expand-enter-to,
.mk-expand-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
