<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { MUCKERS_SCHEDULE } from '@/config/muckers'
import type { MuckersPrimarySlot, MuckersTeamSlug } from '@/types/muckers'
import MuckersTimelineGameCard from './MuckersTimelineGameCard.vue'
import MuckersTimelineWeekCard from './MuckersTimelineWeekCard.vue'
import MuckersTimelineStartCard from './MuckersTimelineStartCard.vue'
import MuckersTeamModal from './MuckersTeamModal.vue'

const store = useMuckersStore()

type TimelineEntry =
  | { type: 'game'; weekNum: number; slot: MuckersPrimarySlot; date: Date; slotLabel: string; key: string }
  | { type: 'weekRecap'; weekNum: number; date: Date; key: string }
  | { type: 'quarterStart'; key: string }

const slotOrder: MuckersPrimarySlot[] = ['D', 'B', 'A']

const entries = computed<TimelineEntry[]>(() => {
  const weeks = [...store.weekNumbers.value].reverse()
  const games = store.games.value
  const result: TimelineEntry[] = []

  for (const wk of weeks) {
    for (const slot of slotOrder) {
      const game = games.find((g) => {
        const cfg = MUCKERS_SCHEDULE.find((s) => s.slot === slot)
        if (!cfg) return false
        const weekStart = getWeekStartDate(wk)
        const dayOffset = cfg.dayOfWeek - 4
        const gameDay = new Date(weekStart)
        gameDay.setDate(gameDay.getDate() + dayOffset)
        const gd = g.gameDate
        return g.gameSlot === slot
          && gd.getFullYear() === gameDay.getFullYear()
          && gd.getMonth() === gameDay.getMonth()
          && gd.getDate() === gameDay.getDate()
      })

      const cfg = MUCKERS_SCHEDULE.find((s) => s.slot === slot)!
      const weekStart = getWeekStartDate(wk)
      const dayOffset = cfg.dayOfWeek - 4
      const entryDate = game ? game.gameDate : new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayOffset)

      result.push({
        type: 'game',
        weekNum: wk,
        slot,
        date: entryDate,
        slotLabel: `Barnyard Muckers ${slot}`,
        key: `game-${wk}-${slot}`,
      })
    }

    result.push({
      type: 'weekRecap',
      weekNum: wk,
      date: getWeekStartDate(wk),
      key: `recap-${wk}`,
    })
  }

  result.push({ type: 'quarterStart', key: 'quarter-start' })
  return result
})

function getWeekStartDate(weekNumber: number): Date {
  return store.getWeekStartDate(weekNumber)
}

function getEntryDate(entry: TimelineEntry): Date | null {
  if (entry.type === 'quarterStart') return null
  return entry.date
}

function showMonthDivider(entry: TimelineEntry, idx: number): boolean {
  const date = getEntryDate(entry)
  if (!date) return false
  if (idx === 0) return true
  const prev = entries.value[idx - 1]
  const prevDate = getEntryDate(prev)
  if (!prevDate) return true
  return date.getMonth() !== prevDate.getMonth() || date.getFullYear() !== prevDate.getFullYear()
}

function monthLabel(entry: TimelineEntry): string {
  const date = getEntryDate(entry)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function dayOfWeek(entry: TimelineEntry): string {
  if (entry.type !== 'game') return ''
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(entry.date).toUpperCase()
}

function shortDate(entry: TimelineEntry): string {
  const date = getEntryDate(entry)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

function nodeClass(entry: TimelineEntry): string {
  if (entry.type === 'weekRecap') return 'mk-tl-node--week'
  if (entry.type === 'quarterStart') return 'mk-tl-node--start'
  return 'mk-tl-node--game'
}

function itemClass(entry: TimelineEntry): string {
  if (entry.type === 'weekRecap') return 'mk-tl-item--recap'
  if (entry.type === 'quarterStart') return 'mk-tl-item--start'
  return 'mk-tl-item--game'
}

// Team modal
const selectedTeamSlug = ref<MuckersTeamSlug | null>(null)

function onTeamClick(slug: MuckersTeamSlug) {
  selectedTeamSlug.value = slug
}

// IntersectionObserver
const railRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (!railRef.value) return
  observer = new IntersectionObserver(
    (observedEntries) => {
      for (const oe of observedEntries) {
        if (oe.isIntersecting) {
          ;(oe.target as HTMLElement).classList.add('mk-tl-visible')
        }
      }
    },
    { threshold: 0.1 },
  )
  const items = railRef.value.querySelectorAll('.mk-tl-item')
  items.forEach((el) => observer!.observe(el))
}

onMounted(() => {
  nextTick(setupObserver)
})

watch(() => store.weekNumbers.value, () => {
  nextTick(() => {
    if (observer) observer.disconnect()
    setupObserver()
  })
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="mk-timeline">
    <div class="mk-timeline__header mk-glass">
      <h2 class="mk-timeline__title">Quarter Timeline</h2>
      <p class="mk-timeline__subtitle">{{ store.loadedQuarterLabel.value }} &mdash; scroll to explore</p>
    </div>

    <div ref="railRef" class="mk-timeline__rail">
      <template v-for="(entry, idx) in entries" :key="entry.key">
        <div
          v-if="showMonthDivider(entry, idx)"
          class="mk-tl-month-divider"
        >
          <span class="mk-tl-month-divider__label">{{ monthLabel(entry) }}</span>
        </div>

        <div class="mk-tl-item" :class="itemClass(entry)">
          <!-- Node (glass circle with date/label content) -->
          <div class="mk-tl-node" :class="nodeClass(entry)">
            <template v-if="entry.type === 'game'">
              <span class="mk-tl-node__day">{{ dayOfWeek(entry) }}</span>
              <span class="mk-tl-node__slot">{{ entry.slot }}</span>
              <span class="mk-tl-node__date">{{ shortDate(entry) }}</span>
            </template>
            <template v-else-if="entry.type === 'weekRecap'">
              <span class="mk-tl-node__label">WK</span>
              <span class="mk-tl-node__slot mk-tl-node__slot--week">{{ entry.weekNum }}</span>
            </template>
            <template v-else>
              <span class="mk-tl-node__slot mk-tl-node__slot--start">{{ store.loadedQuarter.value?.quarter }}</span>
              <span class="mk-tl-node__date">{{ store.loadedQuarter.value?.year }}</span>
            </template>
          </div>

          <!-- Card -->
          <div class="mk-tl-card">
            <MuckersTimelineGameCard
              v-if="entry.type === 'game'"
              :week-number="entry.weekNum"
              :slot-id="entry.slot"
              @team-click="onTeamClick"
            />
            <MuckersTimelineWeekCard
              v-if="entry.type === 'weekRecap'"
              :week-number="entry.weekNum"
              @team-click="onTeamClick"
            />
            <MuckersTimelineStartCard
              v-if="entry.type === 'quarterStart'"
            />
          </div>
        </div>
      </template>
    </div>

    <MuckersTeamModal
      v-if="selectedTeamSlug !== null"
      :team-slug="selectedTeamSlug"
      @close="selectedTeamSlug = null"
    />
  </div>
</template>

<style scoped>
.mk-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mk-timeline__header {
  padding: 1rem 1.5rem;
}

.mk-timeline__title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0;
}

.mk-timeline__subtitle {
  font-size: 0.75rem;
  color: var(--color-mk-text-muted, #64748B);
  margin: 0.15rem 0 0;
}

/* ─── Rail ───────────────────────────── */

.mk-timeline__rail {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 2rem;
}

.mk-timeline__rail::before {
  content: '';
  position: absolute;
  left: 33px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    rgba(0, 180, 216, 0.05),
    rgba(0, 180, 216, 0.35) 10%,
    rgba(0, 180, 216, 0.35) 90%,
    rgba(0, 180, 216, 0.05)
  );
  box-shadow: 0 0 8px rgba(0, 180, 216, 0.15);
  border-radius: 1px;
}

/* ─── Timeline Item ──────────────────── */

.mk-tl-item {
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 0;
  align-items: start;
  padding: 0.4rem 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.mk-tl-item--recap {
  padding: 0.75rem 0;
  transform: translateY(20px) scale(0.97);
}

.mk-tl-item--start {
  padding: 1rem 0;
}

.mk-tl-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ─── Node (glass circle with content) ─ */

.mk-tl-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  align-self: start;
  justify-self: center;
  gap: 0;
  line-height: 1;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.mk-tl-node--game {
  border-color: rgba(0, 180, 216, 0.35);
}

.mk-tl-node--week {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(255, 250, 230, 0.6);
}

.mk-tl-node--start {
  border-color: rgba(0, 180, 216, 0.5);
  background: rgba(27, 42, 74, 0.12);
  border-width: 2.5px;
}

.mk-tl-node__day {
  font-size: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-mk-text-muted, #64748B);
}

.mk-tl-node__slot {
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color-mk-cyan, #00B4D8);
  line-height: 1.15;
}

.mk-tl-node__slot--week {
  color: #B8960F;
  font-size: 1.25rem;
}

.mk-tl-node__slot--start {
  color: var(--color-mk-navy, #1B2A4A);
  font-size: 1.1rem;
}

.mk-tl-node__label {
  font-size: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #B8960F;
}

.mk-tl-node__date {
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--color-mk-text-muted, #64748B);
  margin-top: 1px;
}

.mk-tl-visible .mk-tl-node {
  animation: mk-node-pop 0.5s ease-out;
}

@keyframes mk-node-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}

/* ─── Card ───────────────────────────── */

.mk-tl-card {
  padding-left: 0.75rem;
  min-width: 0;
}

/* ─── Month Divider ──────────────────── */

.mk-tl-month-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0 0.5rem;
  margin-left: 76px;
}

.mk-tl-month-divider::before,
.mk-tl-month-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(100, 120, 160, 0.15);
}

.mk-tl-month-divider__label {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-mk-text-muted, #64748B);
  white-space: nowrap;
}

/* ─── Responsive ─────────────────────── */

@media (max-width: 640px) {
  .mk-tl-node {
    width: 56px;
    height: 56px;
  }

  .mk-tl-item {
    grid-template-columns: 56px 1fr;
  }

  .mk-timeline__rail::before {
    left: 27px;
  }

  .mk-tl-node__day {
    font-size: 0.45rem;
  }

  .mk-tl-node__slot {
    font-size: 0.95rem;
  }

  .mk-tl-node__date {
    font-size: 0.48rem;
  }

  .mk-tl-card {
    padding-left: 0.5rem;
  }

  .mk-tl-month-divider {
    margin-left: 60px;
  }
}
</style>
