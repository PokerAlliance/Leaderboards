<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getMuckersTeam } from '@/config/teams'
import type { MuckersTeamStanding, MuckersTeamSlug } from '@/types/muckers'
import MuckersScorePopover from './MuckersScorePopover.vue'
import MuckersWeekModal from './MuckersWeekModal.vue'
import MuckersTeamModal from './MuckersTeamModal.vue'

const store = useMuckersStore()

const standings = computed(() => store.teamStandings.value)
const weeks = computed(() => store.weekNumbers.value)

function getTeamLogo(slug: string): string {
  return getMuckersTeam(slug as never)?.logoUrl ?? ''
}

function getTeamColor(slug: string): string {
  return getMuckersTeam(slug as never)?.color ?? '#888'
}

function getWeekScore(team: MuckersTeamStanding, weekNum: number): number | null {
  const week = team.weeklyScores.find((w) => w.weekNumber === weekNum)
  return week ? week.totalPoints : null
}

function formatDiff(diff: number | null): string {
  if (diff === null) return 'NEW'
  if (diff > 0) return `\u2191${diff}`
  if (diff < 0) return `\u2193${Math.abs(diff)}`
  return '\u2014'
}

function diffClass(diff: number | null): string {
  if (diff === null) return 'mk-diff--new'
  if (diff > 0) return 'mk-diff--up'
  if (diff < 0) return 'mk-diff--down'
  return 'mk-diff--same'
}

function podiumClass(rank: number): string {
  if (rank === 1) return 'mk-row--1st'
  if (rank === 2) return 'mk-row--2nd'
  if (rank === 3) return 'mk-row--3rd'
  return ''
}

// ─── Popover State ──────────────────────────────────────────────

interface HoverInfo {
  teamSlug: MuckersTeamSlug
  teamName: string
  weekNum: number
  rect: DOMRect
}

const hoverInfo = ref<HoverInfo | null>(null)
const popoverVisible = ref(false)
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearTimers() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

function onScoreEnter(team: MuckersTeamStanding, wk: number, event: MouseEvent) {
  clearTimers()
  const td = event.currentTarget as HTMLElement
  const rect = td.getBoundingClientRect()
  hoverInfo.value = { teamSlug: team.teamSlug, teamName: team.teamName, weekNum: wk, rect }
  showTimer = setTimeout(() => { popoverVisible.value = true }, 150)
}

function onScoreLeave() {
  clearTimers()
  hideTimer = setTimeout(() => { popoverVisible.value = false }, 100)
}

// ─── Modal State ────────────────────────────────────────────────

const selectedWeek = ref<number | null>(null)
const selectedTeamSlug = ref<MuckersTeamSlug | null>(null)

function onWeekClick(wk: number) {
  selectedWeek.value = wk
}

function onTeamClick(slug: MuckersTeamSlug) {
  selectedTeamSlug.value = slug
}

const scrollRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    const el = scrollRef.value
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = el.scrollWidth - el.clientWidth
    }
  })
})

onBeforeUnmount(() => { clearTimers() })
</script>

<template>
  <div class="mk-table-wrapper mk-glass">
    <div ref="scrollRef" class="mk-table-scroll">
      <table class="mk-table">
        <thead>
          <tr>
            <th class="mk-th--team">Team</th>
            <th
              v-for="wk in weeks"
              :key="wk"
              class="mk-th--week mk-th--clickable"
              @click="onWeekClick(wk)"
            >
              Wk{{ wk }}
            </th>
            <th class="mk-th--total">Total</th>
            <th class="mk-th--diff">Diff</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="team in standings"
            :key="team.teamSlug"
            class="mk-team-row"
            :class="podiumClass(team.rank)"
            :style="{ '--team-color': getTeamColor(team.teamSlug) }"
          >
            <td class="mk-td--team" @click="onTeamClick(team.teamSlug)">
              <div class="mk-team-cell">
                <img
                  :src="getTeamLogo(team.teamSlug)"
                  :alt="team.teamName"
                  class="mk-team-cell__logo"
                  loading="lazy"
                />
                <div class="mk-team-cell__info">
                  <span class="mk-team-cell__name">{{ team.teamName }}</span>
                  <span class="mk-team-cell__members">
                    {{ store.getTeamMemberCount(team.teamSlug) }} members
                  </span>
                </div>
              </div>
            </td>
            <td
              v-for="wk in weeks"
              :key="wk"
              class="mk-td--week"
              @mouseenter="onScoreEnter(team, wk, $event)"
              @mouseleave="onScoreLeave"
            >
              <span v-if="getWeekScore(team, wk) !== null" class="mk-score">
                {{ getWeekScore(team, wk) }}
              </span>
              <span v-else class="mk-score mk-score--empty">&ndash;</span>
            </td>
            <td class="mk-td--total">
              <div class="mk-total-cell">
                <span class="mk-total-cell__value">{{ team.totalPoints }}</span>
                <span class="mk-total-cell__avg">{{ team.averagePerWeek.toFixed(1) }} avg</span>
              </div>
            </td>
            <td class="mk-td--diff">
              <span :class="diffClass(team.rankDiff)">
                {{ formatDiff(team.rankDiff) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Score Popover -->
    <MuckersScorePopover
      v-if="hoverInfo"
      :team-slug="hoverInfo.teamSlug"
      :team-name="hoverInfo.teamName"
      :week-number="hoverInfo.weekNum"
      :anchor-rect="hoverInfo.rect"
      :visible="popoverVisible"
    />

    <!-- Week Modal -->
    <MuckersWeekModal
      v-if="selectedWeek !== null"
      :week-number="selectedWeek"
      @close="selectedWeek = null"
    />

    <!-- Team Modal -->
    <MuckersTeamModal
      v-if="selectedTeamSlug !== null"
      :team-slug="selectedTeamSlug"
      @close="selectedTeamSlug = null"
    />
  </div>
</template>

<style scoped>
.mk-table-wrapper {
  overflow: hidden;
}

.mk-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mk-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

/* ─── Headers ────────────────────────────── */

.mk-table th {
  color: var(--color-mk-text-muted, #64748B);
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid rgba(100, 120, 160, 0.15);
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mk-th--team {
  min-width: 180px;
  position: sticky;
  left: 0;
  z-index: 2;
}

.mk-th--week {
  min-width: 55px;
  text-align: center;
}

.mk-th--clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.mk-th--clickable:hover {
  color: var(--color-mk-cyan, #00B4D8);
}

.mk-th--total {
  min-width: 75px;
  text-align: center;
}

.mk-th--diff {
  min-width: 50px;
  text-align: center;
}

/* ─── Rows ───────────────────────────────── */

.mk-team-row {
  border-left: 3px solid var(--team-color, var(--color-mk-cyan, #00B4D8));
  transition: background 0.15s ease;
}

.mk-team-row:hover td {
  background: rgba(0, 180, 216, 0.03);
}

.mk-table td {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.08);
  vertical-align: middle;
}

/* Podium accents */
.mk-row--1st td:first-child {
  border-left: 3px solid var(--color-mk-gold, #D4AF37);
}

.mk-row--2nd td:first-child {
  border-left: 3px solid #64748B;
}

.mk-row--3rd td:first-child {
  border-left: 3px solid #B45309;
}

/* ─── Team Cell ──────────────────────────── */

.mk-td--team {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
}

.mk-team-row:hover .mk-td--team {
  background: rgba(255, 255, 255, 0.75);
}

.mk-team-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.mk-team-cell__logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(100, 120, 160, 0.15);
}

.mk-team-cell__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.mk-team-cell__name {
  font-weight: 700;
  color: var(--color-mk-navy, #1B2A4A);
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-team-cell__members {
  font-size: 0.68rem;
  color: var(--color-mk-text-muted, #64748B);
}

/* ─── Week Score Cells ───────────────────── */

.mk-td--week {
  text-align: center;
  cursor: default;
}

.mk-score {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--color-mk-text, #0F172A);
}

.mk-score--empty {
  color: var(--color-mk-text-muted, #64748B);
  font-weight: 400;
}

/* ─── Total Cell ─────────────────────────── */

.mk-td--total {
  text-align: center;
}

.mk-total-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.mk-total-cell__value {
  font-weight: 800;
  font-size: 1rem;
  color: var(--color-mk-navy, #1B2A4A);
}

.mk-total-cell__avg {
  font-size: 0.65rem;
  color: var(--color-mk-text-muted, #64748B);
}

/* ─── Diff Cell ──────────────────────────── */

.mk-td--diff {
  text-align: center;
  font-weight: 700;
  font-size: 0.8rem;
}

/* ─── Responsive ─────────────────────────── */

@media (max-width: 640px) {
  .mk-table { font-size: 0.8rem; }
  .mk-th--team { min-width: 150px; }
  .mk-team-cell__logo { width: 26px; height: 26px; }
  .mk-team-cell__name { font-size: 0.78rem; }
}
</style>
