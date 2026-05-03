<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import type { DonksGameType, DonksGame, DonksCupSlug } from '@/types/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import { getCupsByGameType, getQuarterDateRange } from '@/config/donks'

interface TimelineNode {
  key: string
  cupSlug: DonksCupSlug
  date: Date
  game: DonksGame | null
  isFuture: boolean
}

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

const props = defineProps<{
  gameType: DonksGameType
  selectedDate: Date | null
}>()

const emit = defineEmits<{
  'select': [date: Date | null]
}>()

const store = useDonksStore()
const scrollRef = ref<HTMLElement | null>(null)

const cups = computed(() => getCupsByGameType(props.gameType))

const cupColorMap = computed(() => {
  const m = new Map<string, string>()
  for (const c of cups.value) m.set(c.slug, c.color)
  return m
})

const cupShortMap = computed(() => {
  const m = new Map<string, string>()
  for (const c of cups.value) m.set(c.slug, c.shortName)
  return m
})

const allNodes = computed<TimelineNode[]>(() => {
  const quarter = store.loadedQuarter.value
  if (!quarter) return []

  const { start, end } = getQuarterDateRange(quarter)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const gamesByCupAndDate = new Map<string, DonksGame>()
  const slugs = new Set(cups.value.map((c) => c.slug))
  for (const g of store.games.value) {
    if (!slugs.has(g.cupSlug)) continue
    const dk = `${g.cupSlug}|${g.gameDate.getFullYear()}-${g.gameDate.getMonth()}-${g.gameDate.getDate()}`
    gamesByCupAndDate.set(dk, g)
  }

  const nodes: TimelineNode[] = []

  for (const cup of cups.value) {
    const dayNum = DAY_MAP[cup.day]
    if (dayNum === undefined) continue
    const d = new Date(start)
    while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1)

    while (d <= end) {
      const slotDate = new Date(d)
      const dk = `${cup.slug}|${slotDate.getFullYear()}-${slotDate.getMonth()}-${slotDate.getDate()}`
      const existingGame = gamesByCupAndDate.get(dk) ?? null
      const isFuture = !existingGame && slotDate > today

      nodes.push({
        key: existingGame?.gameId ?? `${cup.slug}-${slotDate.toISOString()}`,
        cupSlug: cup.slug as DonksCupSlug,
        date: existingGame?.gameDate ?? slotDate,
        game: existingGame,
        isFuture: isFuture || (!existingGame && slotDate <= today),
      })

      d.setDate(d.getDate() + 7)
    }
  }

  nodes.sort((a, b) => a.date.getTime() - b.date.getTime())
  return nodes
})

const hasRealGames = computed(() => allNodes.value.some((n) => n.game !== null))

const isActive = computed(() => props.selectedDate !== null)

function isSelected(node: TimelineNode): boolean {
  if (!props.selectedDate || !node.game) return false
  return node.game.gameDate.getTime() === props.selectedDate.getTime()
}

function isBeforeCutoff(node: TimelineNode): boolean {
  if (!props.selectedDate) return true
  return node.date <= props.selectedDate
}

function onClickNode(node: TimelineNode) {
  if (!node.game) return
  const realNodes = allNodes.value.filter((n) => n.game)
  const last = realNodes[realNodes.length - 1]
  if (last?.game && node.game.gameDate.getTime() === last.game.gameDate.getTime()) {
    emit('select', null)
  } else {
    emit('select', node.game.gameDate)
  }
}

function onReset() {
  emit('select', null)
}

function scrollToPresent() {
  nextTick(() => {
    if (!scrollRef.value) return
    const todayNode = scrollRef.value.querySelector('.gtt__node--today')
    if (todayNode) {
      todayNode.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
    } else {
      scrollRef.value.scrollTo({ left: scrollRef.value.scrollWidth, behavior: 'smooth' })
    }
  })
}

onMounted(scrollToPresent)
watch(() => store.games.value.length, scrollToPresent)
</script>

<template>
  <div class="gtt">
    <div class="gtt__header">
      <span class="gtt__label">Quarter Timeline</span>
      <button
        v-if="isActive"
        class="gtt__reset"
        @click="onReset"
      >
        Show All ×
      </button>
    </div>
    <div v-if="allNodes.length === 0" class="gtt__empty">
      No games scheduled this quarter.
    </div>
    <div v-else class="gtt__scroll" ref="scrollRef">
      <div class="gtt__track">
        <div class="gtt__line" />
        <div
          v-for="node in allNodes"
          :key="node.key"
          class="gtt__node"
          :class="{
            'gtt__node--selected': isSelected(node),
            'gtt__node--dimmed': isActive && !node.isFuture && !isBeforeCutoff(node),
            'gtt__node--future': node.isFuture,
            'gtt__node--today': !node.isFuture && hasRealGames && node === allNodes.filter(n => n.game)[allNodes.filter(n => n.game).length - 1],
          }"
          :style="{ '--dot-color': cupColorMap.get(node.cupSlug) ?? '#c9a227' }"
          @click="onClickNode(node)"
        >
          <div class="gtt__dot" />
          <span class="gtt__cup-label">{{ cupShortMap.get(node.cupSlug) ?? '' }}</span>
          <span class="gtt__date">{{ node.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}</span>
        </div>
      </div>
    </div>
    <div class="gtt__legend">
      <span
        v-for="cup in cups"
        :key="cup.slug"
        class="gtt__legend-item"
      >
        <span class="gtt__legend-dot" :style="{ background: cup.color }" />
        {{ cup.shortName }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.gtt {
  padding: 0.5rem 0 0;
}

.gtt__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem 0.35rem;
}

.gtt__label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-donks-text-muted);
}

.gtt__reset {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-donks-gold-dark);
  background: rgba(201, 162, 39, 0.1);
  border: 1px solid rgba(201, 162, 39, 0.2);
  border-radius: 999px;
  padding: 0.2em 0.65em;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gtt__reset:hover {
  background: rgba(201, 162, 39, 0.2);
}

.gtt__empty {
  text-align: center;
  padding: 0.75rem 0;
  font-size: 0.72rem;
  color: var(--color-donks-text-muted);
}

.gtt__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-donks-gold) transparent;
  mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%);
}

.gtt__track {
  display: flex;
  min-width: max-content;
  position: relative;
  padding: 0.4rem 0.75rem;
  align-items: flex-start;
}

.gtt__line {
  position: absolute;
  top: 14px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background: linear-gradient(90deg, var(--color-donks-card-border), var(--color-donks-gold), var(--color-donks-card-border));
  opacity: 0.4;
  pointer-events: none;
}

.gtt__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 46px;
  padding: 0 0.2rem;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: transform 0.15s ease, opacity 0.2s ease;
}

.gtt__node:hover {
  transform: translateY(-1px);
}

.gtt__node--dimmed {
  opacity: 0.3;
}

.gtt__node--future {
  opacity: 0.35;
  pointer-events: none;
  cursor: default;
}

.gtt__node--future .gtt__dot {
  background: transparent;
  border: 2px dashed var(--dot-color);
}

.gtt__node--future .gtt__cup-label,
.gtt__node--future .gtt__date {
  color: var(--color-donks-text-muted);
}

.gtt__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dot-color);
  border: 2px solid var(--dot-color);
  flex-shrink: 0;
  transition: all 0.2s ease;
  box-shadow: 0 0 0 0 transparent;
}

.gtt__node--selected .gtt__dot {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--dot-color) 35%, transparent);
  transform: scale(1.25);
}

.gtt__cup-label {
  font-size: 0.5rem;
  font-weight: 700;
  color: var(--dot-color);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.gtt__date {
  font-size: 0.5rem;
  font-weight: 600;
  color: var(--color-donks-text-muted);
  white-space: nowrap;
}

.gtt__node--selected .gtt__date {
  color: var(--color-donks-text);
  font-weight: 700;
}

.gtt__legend {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0.25rem 0;
  flex-wrap: wrap;
}

.gtt__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--color-donks-text-secondary);
}

.gtt__legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .gtt__node {
    min-width: 40px;
  }
}
</style>
