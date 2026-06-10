<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { getTeamColor, getTeamName } from '@/config/teams'
import { DONKS_CUPS } from '@/config/donks'
import type { LockTournamentResponse, LockTournamentPlayerResult, LockTournamentTeamScore } from '@/types'

const props = defineProps<{
  result: LockTournamentResponse
}>()

const emit = defineEmits<{
  close: []
}>()

const league = computed(() => props.result.league || 'donks')
const isRecap = computed(() => !!props.result.alreadyLocked)
const tournament = computed(() => props.result.tournament)
const players = computed(() =>
  (props.result.playerResults || []).slice().sort((a, b) => a.finishPosition - b.finishPosition)
)
const teamScores = computed<LockTournamentTeamScore[]>(() =>
  (props.result.teamScores || []).slice().sort((a, b) => a.rank - b.rank)
)
const unidentified = computed(() => props.result.unidentifiedPlayers || [])

const cupConfig = computed(() => {
  if (league.value !== 'donks' || !props.result.cupSlug) return null
  return DONKS_CUPS.find(c => c.slug === props.result.cupSlug) || null
})

const accentColor = computed(() => {
  if (league.value === 'donks' && cupConfig.value) return cupConfig.value.color
  if (league.value === 'anarchy') return '#FF0080'
  if (league.value === 'muckers') return '#4682B4'
  return '#d4af37'
})

const leagueDisplayName = computed(() => {
  if (league.value === 'donks') return 'Donks'
  if (league.value === 'anarchy') return 'Anarchy'
  if (league.value === 'muckers') return 'Muckers'
  return league.value
})

const formattedDate = computed(() => {
  if (!tournament.value?.date) return ''
  try {
    const d = new Date(tournament.value.date + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return tournament.value.date
  }
})

function medalForPosition(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return ''
}

function getPlayerTeamColor(player: LockTournamentPlayerResult): string {
  if (!player.teamSlug || player.teamSlug === 'void' || player.teamSlug === 'unknown') return '#666'
  if (league.value === 'anarchy') return getTeamColor('anarchy', player.teamSlug)
  if (league.value === 'muckers') return getTeamColor('muckers', player.teamSlug)
  return '#888'
}

function getPlayerTeamName(player: LockTournamentPlayerResult): string {
  if (!player.teamSlug || player.teamSlug === 'void') return 'Unassigned'
  if (player.teamSlug === 'unknown') return 'Unknown'
  if (league.value === 'anarchy') return getTeamName('anarchy', player.teamSlug)
  if (league.value === 'muckers') return getTeamName('muckers', player.teamSlug)
  return player.teamSlug
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

watch(() => props.result, () => {
  document.body.style.overflow = 'hidden'
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lock-modal">
      <div
        class="lock-modal__backdrop"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
        tabindex="-1"
      >
        <div
          class="lock-modal"
          role="dialog"
          aria-modal="true"
          :style="{ '--accent': accentColor }"
        >
          <!-- Header -->
          <div class="lock-modal__header" :class="{ 'lock-modal__header--recap': isRecap }">
            <div class="lock-modal__header-top">
              <span class="lock-modal__league-badge">{{ leagueDisplayName }}</span>
              <button class="lock-modal__close" @click="emit('close')" aria-label="Close">&times;</button>
            </div>

            <h2 class="lock-modal__title">
              {{ tournament?.name || 'Tournament' }}
            </h2>

            <div class="lock-modal__meta">
              <span>{{ formattedDate }}</span>
              <span class="lock-modal__sep">&bull;</span>
              <span>{{ tournament?.totalPlayers || 0 }} players</span>
              <span class="lock-modal__sep">&bull;</span>
              <span>ID #{{ tournament?.id }}</span>
            </div>

            <!-- League-specific badges -->
            <div class="lock-modal__badges">
              <span v-if="league === 'donks' && result.cupDisplayName" class="lock-modal__badge lock-modal__badge--cup">
                {{ result.cupDisplayName }}
              </span>
              <span v-if="(league === 'anarchy' || league === 'muckers') && result.gameSlotDisplay" class="lock-modal__badge lock-modal__badge--slot">
                {{ result.gameSlotDisplay }}
              </span>
            </div>

            <!-- Status -->
            <div class="lock-modal__status" :class="isRecap ? 'lock-modal__status--warning' : 'lock-modal__status--success'">
              <span v-if="isRecap" class="lock-modal__status-icon">&#9888;</span>
              <span v-else class="lock-modal__status-icon">&#10003;</span>
              {{ isRecap ? 'Already Locked' : 'Locked Successfully' }}
            </div>

            <p v-if="isRecap && result.lockedBy" class="lock-modal__recap-info">
              Previously locked by <strong>{{ result.lockedBy }}</strong>
            </p>
          </div>

          <!-- Warning for unidentified players (Anarchy) -->
          <div v-if="unidentified.length > 0" class="lock-modal__warning">
            <strong>{{ unidentified.length }} unidentified player{{ unidentified.length > 1 ? 's' : '' }}:</strong>
            {{ unidentified.map(p => p.username).join(', ') }}
          </div>

          <!-- Team Scores (Anarchy) -->
          <div v-if="league === 'anarchy' && teamScores.length > 0" class="lock-modal__section">
            <h3 class="lock-modal__section-title">Team Standings</h3>
            <div class="lock-modal__teams">
              <div
                v-for="team in teamScores"
                :key="team.teamSlug"
                class="lock-modal__team-row"
                :style="{ '--team-color': getTeamColor('anarchy', team.teamSlug) }"
              >
                <span class="lock-modal__team-rank">{{ team.rank }}</span>
                <span class="lock-modal__team-name">{{ getTeamName('anarchy', team.teamSlug) }}</span>
                <span class="lock-modal__team-score">{{ team.primaryScore }} pts</span>
                <span v-if="team.bountyScore" class="lock-modal__team-bounty">{{ team.bountyScore }} KO</span>
              </div>
            </div>
          </div>

          <!-- Player Results Table -->
          <div class="lock-modal__section">
            <h3 class="lock-modal__section-title">Player Results</h3>
            <div class="lock-modal__table-wrap">
              <table class="lock-modal__table">
                <thead>
                  <tr>
                    <th class="lock-modal__th lock-modal__th--pos">#</th>
                    <th class="lock-modal__th">Player</th>
                    <th v-if="league !== 'donks'" class="lock-modal__th">Team</th>
                    <th class="lock-modal__th lock-modal__th--pts">Points</th>
                    <th v-if="league === 'anarchy'" class="lock-modal__th lock-modal__th--bounty">KO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="player in players"
                    :key="player.username"
                    class="lock-modal__tr"
                    :class="{ 'lock-modal__tr--podium': player.finishPosition <= 3 }"
                  >
                    <td class="lock-modal__td lock-modal__td--pos">
                      <span v-if="player.finishPosition <= 3" class="lock-modal__medal">{{ medalForPosition(player.finishPosition) }}</span>
                      <span v-else>{{ player.finishPosition }}</span>
                    </td>
                    <td class="lock-modal__td lock-modal__td--name">{{ player.username }}</td>
                    <td v-if="league !== 'donks'" class="lock-modal__td lock-modal__td--team">
                      <span
                        class="lock-modal__team-dot"
                        :style="{ background: getPlayerTeamColor(player) }"
                      />
                      {{ getPlayerTeamName(player) }}
                    </td>
                    <td class="lock-modal__td lock-modal__td--pts">
                      {{ league === 'donks' ? player.pointsEarned.toFixed(2) : player.pointsEarned }}
                    </td>
                    <td v-if="league === 'anarchy'" class="lock-modal__td lock-modal__td--bounty">
                      {{ player.bountiesCollected || 0 }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div class="lock-modal__footer">
            <span class="lock-modal__game-id">{{ result.gameId }}</span>
            <BaseButton variant="primary" @click="emit('close')">
              Close
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lock-modal__backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
  z-index: 1000;
}

.lock-modal {
  --accent: #d4af37;
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card, #1a1a2e);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg, 12px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* ─── Header ────────────────────────────────────────────── */

.lock-modal__header {
  padding: var(--space-5, 20px) var(--space-6, 24px) var(--space-4, 16px);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.04));
  border-bottom: 1px solid rgba(34, 197, 94, 0.15);
}

.lock-modal__header--recap {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));
  border-bottom-color: rgba(245, 158, 11, 0.15);
}

.lock-modal__header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2, 8px);
}

.lock-modal__league-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--accent);
  color: #000;
}

.lock-modal__close {
  background: none;
  border: none;
  color: var(--color-text-muted, #888);
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.15s;
}

.lock-modal__close:hover {
  color: var(--color-text-primary, #fff);
}

.lock-modal__title {
  font-family: var(--font-display, sans-serif);
  font-size: var(--text-xl, 20px);
  font-weight: 700;
  color: var(--color-text-primary, #fff);
  margin: 0 0 var(--space-1, 4px);
}

.lock-modal__meta {
  font-size: var(--text-sm, 13px);
  color: var(--color-text-secondary, #aaa);
  margin-bottom: var(--space-3, 12px);
}

.lock-modal__sep {
  margin: 0 6px;
  opacity: 0.4;
}

.lock-modal__badges {
  display: flex;
  gap: var(--space-2, 8px);
  margin-bottom: var(--space-3, 12px);
}

.lock-modal__badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
}

.lock-modal__badge--cup {
  background: rgba(255, 255, 255, 0.08);
  color: var(--accent);
  border: 1px solid var(--accent);
}

.lock-modal__badge--slot {
  background: rgba(255, 255, 255, 0.08);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

.lock-modal__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm, 13px);
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
}

.lock-modal__status--success {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.lock-modal__status--warning {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.lock-modal__status-icon {
  font-size: 14px;
}

.lock-modal__recap-info {
  font-size: var(--text-sm, 13px);
  color: var(--color-text-muted, #888);
  margin: var(--space-2, 8px) 0 0;
}

/* ─── Warning Banner ────────────────────────────────────── */

.lock-modal__warning {
  padding: var(--space-3, 12px) var(--space-6, 24px);
  font-size: var(--text-sm, 13px);
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
  border-bottom: 1px solid rgba(251, 191, 36, 0.15);
}

/* ─── Sections ──────────────────────────────────────────── */

.lock-modal__section {
  padding: var(--space-4, 16px) var(--space-6, 24px);
}

.lock-modal__section + .lock-modal__section {
  padding-top: 0;
}

.lock-modal__section-title {
  font-family: var(--font-display, sans-serif);
  font-size: var(--text-base, 15px);
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  margin: 0 0 var(--space-3, 12px);
}

/* ─── Team Scores (Anarchy) ─────────────────────────────── */

.lock-modal__teams {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  margin-bottom: var(--space-4, 16px);
}

.lock-modal__team-row {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md, 8px);
  border-left: 3px solid var(--team-color, #888);
}

.lock-modal__team-rank {
  font-weight: 700;
  font-size: var(--text-lg, 18px);
  color: var(--color-text-primary, #fff);
  min-width: 24px;
}

.lock-modal__team-name {
  flex: 1;
  font-weight: 600;
  color: var(--team-color, #888);
}

.lock-modal__team-score {
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  font-variant-numeric: tabular-nums;
}

.lock-modal__team-bounty {
  font-size: var(--text-sm, 13px);
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
}

/* ─── Player Table ──────────────────────────────────────── */

.lock-modal__table-wrap {
  overflow-y: auto;
  max-height: 340px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.lock-modal__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm, 13px);
}

.lock-modal__th {
  position: sticky;
  top: 0;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #888);
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 1;
}

.lock-modal__th--pos {
  width: 48px;
  text-align: center;
}

.lock-modal__th--pts,
.lock-modal__th--bounty {
  text-align: right;
  width: 80px;
}

.lock-modal__tr {
  transition: background 0.1s;
}

.lock-modal__tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.lock-modal__tr--podium {
  background: rgba(212, 175, 55, 0.04);
}

.lock-modal__td {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--color-text-secondary, #ccc);
}

.lock-modal__td--pos {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-muted, #888);
}

.lock-modal__td--name {
  font-weight: 500;
  color: var(--color-text-primary, #fff);
}

.lock-modal__td--team {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lock-modal__td--pts {
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.lock-modal__td--bounty {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #fbbf24;
}

.lock-modal__medal {
  font-size: 16px;
}

.lock-modal__team-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Footer ────────────────────────────────────────────── */

.lock-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3, 12px) var(--space-6, 24px) var(--space-4, 16px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.lock-modal__game-id {
  font-size: 11px;
  font-family: monospace;
  color: var(--color-text-muted, #888);
  opacity: 0.6;
}

/* ─── Transition ────────────────────────────────────────── */

.lock-modal-enter-active,
.lock-modal-leave-active {
  transition: opacity 0.2s ease;
}

.lock-modal-enter-active .lock-modal,
.lock-modal-leave-active .lock-modal {
  transition: transform 0.2s ease;
}

.lock-modal-enter-from,
.lock-modal-leave-to {
  opacity: 0;
}

.lock-modal-enter-from .lock-modal,
.lock-modal-leave-to .lock-modal {
  transform: scale(0.95) translateY(10px);
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 640px) {
  .lock-modal {
    max-height: 95vh;
    border-radius: var(--radius-md, 8px);
  }

  .lock-modal__header {
    padding: var(--space-4, 16px);
  }

  .lock-modal__section {
    padding: var(--space-3, 12px) var(--space-4, 16px);
  }

  .lock-modal__footer {
    padding: var(--space-3, 12px) var(--space-4, 16px);
  }
}
</style>
