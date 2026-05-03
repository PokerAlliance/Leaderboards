<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import type { DonksCupSlug, DonksQuarterKey, DonksRecentTournament } from '@/types/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import { getDonksCup, getQuarterDateRange } from '@/config/donks'

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  wednesday: 3,
}

interface TimelineEntry {
  date: Date
  dateLabel: string
  gameId: string | null
  tournamentId: number | null
  totalPlayers: number
  status: 'locked' | 'live' | 'upcoming' | 'past-unlocked' | 'future'
  isCurrent: boolean
}

const props = defineProps<{
  cupSlug: DonksCupSlug
  selectedGameId: string | null
  selectedTournamentId: number | null
  quarter: DonksQuarterKey
}>()

const emit = defineEmits<{
  'select-game': [payload: { gameId: string; tournamentId: number }]
  'select-live': [payload: { tournamentId: number }]
  'select-future': []
}>()

const store = useDonksStore()
const scrollRef = ref<HTMLElement | null>(null)

const cup = computed(() => getDonksCup(props.cupSlug))

const lockedGames = computed(() => store.getGamesForCup(props.cupSlug))
const lockedGameDates = computed(() => {
  const map = new Map<string, typeof lockedGames.value[number]>()
  for (const g of lockedGames.value) {
    const key = `${g.gameDate.getFullYear()}-${g.gameDate.getMonth()}-${g.gameDate.getDate()}`
    map.set(key, g)
  }
  return map
})

const recentTournament = computed<DonksRecentTournament | null>(
  () => store.recentTournaments.value[props.cupSlug] ?? null
)

function isLiveState(state: string): boolean {
  return state === 'running' || state === 'late_registration'
}

const timeline = computed<TimelineEntry[]>(() => {
  if (!cup.value) return []
  const c = cup.value
  const dayNum = DAY_MAP[c.day]
  if (dayNum === undefined) return []

  const { start, end } = getQuarterDateRange(props.quarter)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const entries: TimelineEntry[] = []

  const cursor = new Date(start)
  while (cursor.getDay() !== dayNum) {
    cursor.setDate(cursor.getDate() + 1)
  }

  while (cursor <= end) {
    const d = new Date(cursor)
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const locked = lockedGameDates.value.get(dateKey)
    const isPast = d < today
    const isToday = d.getTime() === today.getTime()

    let status: TimelineEntry['status'] = 'future'
    let gameId: string | null = null
    let tournamentId: number | null = null
    let totalPlayers = 0

    if (locked) {
      status = 'locked'
      gameId = locked.gameId
      tournamentId = locked.tournamentId
      totalPlayers = locked.totalPlayers
    } else if (isToday && recentTournament.value && isLiveState(recentTournament.value.state)) {
      status = 'live'
      tournamentId = recentTournament.value.tournamentId
      totalPlayers = recentTournament.value.totalPlayers
    } else if (isToday && recentTournament.value) {
      status = 'upcoming'
      tournamentId = recentTournament.value.tournamentId
      totalPlayers = recentTournament.value.totalPlayers
    } else if (isPast) {
      status = 'past-unlocked'
    }

    entries.push({
      date: d,
      dateLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      gameId,
      tournamentId,
      totalPlayers,
      status,
      isCurrent: false,
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  const todayIdx = entries.findIndex((e) => e.date >= today)
  const currentIdx = todayIdx >= 0 ? todayIdx : entries.length - 1
  if (currentIdx >= 0 && entries[currentIdx]) {
    entries[currentIdx]!.isCurrent = true
  }

  return entries
})

const currentIndex = computed(() => {
  const idx = timeline.value.findIndex((e) => e.isCurrent)
  return idx >= 0 ? idx : 0
})

function isSelected(entry: TimelineEntry): boolean {
  if (entry.gameId && entry.gameId === props.selectedGameId) return true
  if (!entry.gameId && entry.tournamentId && entry.tournamentId === props.selectedTournamentId && props.selectedGameId === null) return true
  return false
}

function onClickEntry(entry: TimelineEntry) {
  if (entry.status === 'future' || entry.status === 'past-unlocked') {
    emit('select-future')
    return
  }
  if (entry.gameId) {
    emit('select-game', { gameId: entry.gameId, tournamentId: entry.tournamentId! })
  } else if (entry.tournamentId) {
    emit('select-live', { tournamentId: entry.tournamentId })
  } else {
    emit('select-future')
  }
}

function scrollToCurrentPosition() {
  nextTick(() => {
    if (!scrollRef.value) return
    const idx = currentIndex.value
    const pills = scrollRef.value.querySelectorAll('.tl__node')
    if (pills[idx]) {
      const pill = pills[idx] as HTMLElement
      const container = scrollRef.value
      const scrollLeft = pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  })
}

onMounted(scrollToCurrentPosition)
watch(() => props.quarter, scrollToCurrentPosition)
</script>

<template>
  <div class="tl">
    <div class="tl__scroll" ref="scrollRef">
      <div class="tl__track">
        <div class="tl__line" />
        <div
          v-for="(entry, idx) in timeline"
          :key="idx"
          class="tl__node"
          :class="{
            'tl__node--selected': isSelected(entry),
            'tl__node--locked': entry.status === 'locked',
            'tl__node--live': entry.status === 'live',
            'tl__node--upcoming': entry.status === 'upcoming',
            'tl__node--future': entry.status === 'future' || entry.status === 'past-unlocked',
            'tl__node--current': entry.isCurrent,
          }"
          @click="onClickEntry(entry)"
        >
          <div class="tl__dot">
            <span v-if="entry.status === 'live'" class="tl__live-pulse" />
          </div>
          <span class="tl__date">{{ entry.dateLabel }}</span>
          <span v-if="entry.status === 'locked'" class="tl__badge tl__badge--locked">{{ entry.totalPlayers }} pl.</span>
          <span v-else-if="entry.status === 'live'" class="tl__badge tl__badge--live">LIVE</span>
          <span v-else-if="entry.status === 'upcoming'" class="tl__badge tl__badge--upcoming">TODAY</span>
          <span v-else class="tl__badge tl__badge--future">—</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-donks-gold) transparent;
  mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
}

.tl__track {
  display: flex;
  gap: 0;
  min-width: max-content;
  position: relative;
  padding: 0.5rem 1rem;
  align-items: flex-start;
}

.tl__line {
  position: absolute;
  top: 18px;
  left: 1rem;
  right: 1rem;
  height: 2px;
  background: linear-gradient(90deg, var(--color-donks-card-border), var(--color-donks-gold), var(--color-donks-card-border));
  opacity: 0.5;
  pointer-events: none;
}

.tl__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 68px;
  padding: 0 0.35rem;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: transform 0.15s ease;
}

.tl__node:hover {
  transform: translateY(-1px);
}

.tl__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--color-donks-card-border);
  background: #fff;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.tl__node--locked .tl__dot {
  background: var(--color-donks-gold);
  border-color: var(--color-donks-gold);
}

.tl__node--live .tl__dot {
  background: #dc2626;
  border-color: #dc2626;
}

.tl__node--upcoming .tl__dot {
  background: #2563eb;
  border-color: #2563eb;
}

.tl__node--future .tl__dot {
  background: transparent;
  border-color: rgba(0, 0, 0, 0.15);
}

.tl__node--current .tl__dot {
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.25);
}

.tl__node--selected .tl__dot {
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.4);
  transform: scale(1.15);
}

.tl__live-pulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #dc2626;
  animation: tlPulse 1.5s ease-in-out infinite;
}

@keyframes tlPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.6); }
}

.tl__date {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--color-donks-text);
  white-space: nowrap;
  margin-top: 0.15rem;
}

.tl__node--future .tl__date {
  color: var(--color-donks-text-muted);
}

.tl__node--selected .tl__date {
  color: var(--color-donks-gold-dark);
  font-weight: 700;
}

.tl__badge {
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1em 0.35em;
  border-radius: 3px;
  white-space: nowrap;
}

.tl__badge--locked {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
}

.tl__badge--live {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.tl__badge--upcoming {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.tl__badge--future {
  color: var(--color-donks-text-muted);
  background: transparent;
}

@media (max-width: 600px) {
  .tl__node {
    min-width: 58px;
  }

  .tl__date {
    font-size: 0.55rem;
  }
}
</style>
