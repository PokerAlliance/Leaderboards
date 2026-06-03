<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DONKS_CUPS, DONKS_MEDALS } from '@/config/donks'
import type { DonksCupConfig, DonksMedalConfig } from '@/types/donks'
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

const holdemCups = computed(() => DONKS_CUPS.filter((c) => c.gameType === 'holdem'))
const omahaCups = computed(() => DONKS_CUPS.filter((c) => c.gameType === 'omaha'))

const holdemMedal = computed(() => DONKS_MEDALS.find((m) => m.gameType === 'holdem')!)
const omahaMedal = computed(() => DONKS_MEDALS.find((m) => m.gameType === 'omaha')!)

const dayLabel: Record<string, string> = {
  monday: 'Mon',
  wednesday: 'Wed',
  sunday: 'Sun',
}

function getDayLabel(cup: DonksCupConfig) {
  return dayLabel[cup.day] || cup.day
}

function getMedalRoute(medal: DonksMedalConfig) {
  return medal.gameType === 'holdem' ? '/league/donks/holdem' : '/league/donks/omaha'
}

// SVG arrow system
const containerRef = ref<HTMLElement | null>(null)
const svgWidth = ref(0)
const svgHeight = ref(0)

interface ArrowPath {
  d: string
  color: string
  id: string
  dashed: boolean
}

const arrows = ref<ArrowPath[]>([])

function getCenter(el: HTMLElement | null, container: HTMLElement): { x: number; y: number } {
  if (!el || !container) return { x: 0, y: 0 }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  return {
    x: elRect.left - cRect.left + elRect.width / 2,
    y: elRect.top - cRect.top + elRect.height / 2,
  }
}

function getRightCenter(el: HTMLElement | null, container: HTMLElement): { x: number; y: number } {
  if (!el || !container) return { x: 0, y: 0 }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  return {
    x: elRect.right - cRect.left,
    y: elRect.top - cRect.top + elRect.height / 2,
  }
}

function getLeftCenter(el: HTMLElement | null, container: HTMLElement): { x: number; y: number } {
  if (!el || !container) return { x: 0, y: 0 }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  return {
    x: elRect.left - cRect.left,
    y: elRect.top - cRect.top + elRect.height / 2,
  }
}

function getBottomCenter(el: HTMLElement | null, container: HTMLElement): { x: number; y: number } {
  if (!el || !container) return { x: 0, y: 0 }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  return {
    x: elRect.left - cRect.left + elRect.width / 2,
    y: elRect.bottom - cRect.top,
  }
}

function getTopCenter(el: HTMLElement | null, container: HTMLElement): { x: number; y: number } {
  if (!el || !container) return { x: 0, y: 0 }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  return {
    x: elRect.left - cRect.left + elRect.width / 2,
    y: elRect.top - cRect.top,
  }
}

function cubicBezier(
  start: { x: number; y: number },
  end: { x: number; y: number },
  horizontal: boolean
): string {
  if (horizontal) {
    const dx = (end.x - start.x) * 0.5
    return `M ${start.x},${start.y} C ${start.x + dx},${start.y} ${end.x - dx},${end.y} ${end.x},${end.y}`
  }
  const dy = (end.y - start.y) * 0.5
  return `M ${start.x},${start.y} C ${start.x},${start.y + dy} ${end.x},${end.y - dy} ${end.x},${end.y}`
}

const isNarrow = ref(false)

function computeConnections() {
  const c = containerRef.value
  if (!c) return

  const rect = c.getBoundingClientRect()
  svgWidth.value = rect.width
  svgHeight.value = rect.height

  isNarrow.value = rect.width < 700

  const horizontal = !isNarrow.value
  const paths: ArrowPath[] = []

  // Holdem cups -> medal
  const heCups = c.querySelectorAll<HTMLElement>('.dg-cup--holdem')
  const heMedal = c.querySelector<HTMLElement>('.dg-medal--holdem')
  heCups.forEach((cupEl, i) => {
    const cupConfig = holdemCups.value[i]
    if (!cupConfig || !heMedal) return
    const start = horizontal ? getRightCenter(cupEl, c) : getBottomCenter(cupEl, c)
    const end = horizontal ? getLeftCenter(heMedal, c) : getTopCenter(heMedal, c)
    paths.push({
      d: cubicBezier(start, end, horizontal),
      color: cupConfig.color,
      id: `he-cup-${i}`,
      dashed: false,
    })
  })

  // Omaha cups -> medal
  const omCups = c.querySelectorAll<HTMLElement>('.dg-cup--omaha')
  const omMedal = c.querySelector<HTMLElement>('.dg-medal--omaha')
  omCups.forEach((cupEl, i) => {
    const cupConfig = omahaCups.value[i]
    if (!cupConfig || !omMedal) return
    const start = horizontal ? getRightCenter(cupEl, c) : getBottomCenter(cupEl, c)
    const end = horizontal ? getLeftCenter(omMedal, c) : getTopCenter(omMedal, c)
    paths.push({
      d: cubicBezier(start, end, horizontal),
      color: cupConfig.color,
      id: `om-cup-${i}`,
      dashed: false,
    })
  })

  // Holdem cups -> Playoffs (dashed, "Top 15 each" path)
  const playoffsNode = c.querySelector<HTMLElement>('.dg-playoffs')
  if (playoffsNode) {
    heCups.forEach((cupEl, i) => {
      const cupConfig = holdemCups.value[i]
      if (!cupConfig) return
      const start = getBottomCenter(cupEl, c)
      const end = getLeftCenter(playoffsNode, c)
      const startAdj = { x: start.x, y: start.y }
      const endAdj = { x: end.x, y: end.y }
      const dy = (endAdj.y - startAdj.y) * 0.4
      const dx = (endAdj.x - startAdj.x) * 0.3
      const d = `M ${startAdj.x},${startAdj.y} C ${startAdj.x},${startAdj.y + dy} ${endAdj.x - dx},${endAdj.y} ${endAdj.x},${endAdj.y}`
      paths.push({
        d,
        color: cupConfig.color,
        id: `he-cup-po-${i}`,
        dashed: true,
      })
    })
  }

  // Omaha medal -> Playoffs (dashed, "3 Wild Cards" path)
  if (omMedal && playoffsNode) {
    const start = getBottomCenter(omMedal, c)
    const end = getTopCenter(playoffsNode, c)
    paths.push({
      d: cubicBezier(start, end, false),
      color: '#2d6a4f',
      id: 'om-medal-playoffs',
      dashed: true,
    })
  }

  arrows.value = paths
}

let observer: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    computeConnections()
  })
  if (containerRef.value) {
    observer = new ResizeObserver(() => computeConnections())
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const hoveredCupId = ref<string | null>(null)
</script>

<template>
  <div ref="containerRef" class="diagram">
    <!-- SVG overlay -->
    <svg
      v-if="arrows.length > 0"
      class="diagram__svg"
      :width="svgWidth"
      :height="svgHeight"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    >
      <defs>
        <marker
          v-for="arrow in arrows"
          :key="'ah-' + arrow.id"
          :id="`ah-${arrow.id}`"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 8 3, 0 6" :fill="arrow.color" opacity="0.7" />
        </marker>
      </defs>
      <path
        v-for="arrow in arrows"
        :key="arrow.id"
        :d="arrow.d"
        :stroke="arrow.color"
        :stroke-width="arrow.dashed ? 1.5 : 2"
        :stroke-dasharray="arrow.dashed ? '6 4' : 'none'"
        fill="none"
        :opacity="hoveredCupId && !arrow.id.includes(hoveredCupId) && !arrow.id.startsWith('om-medal') ? 0.15 : 0.55"
        :marker-end="`url(#ah-${arrow.id})`"
        class="diagram__arrow"
        :class="{ 'diagram__arrow--dashed': arrow.dashed }"
      />
    </svg>

    <h3 class="diagram__title">
      <span class="diagram__title-icon">♠</span>
      Leaderboard Structure
      <span class="diagram__title-icon">♦</span>
    </h3>
    <p class="diagram__subtitle">6 weekly cups feed into 8 ranked leaderboards. Top 9 scores counted per player.</p>

    <!-- Hold'em Group -->
    <div class="diagram__group">
      <div class="diagram__group-label diagram__group-label--holdem">NL Hold'em</div>

      <div class="diagram__row">
        <!-- Cups Column -->
        <div class="diagram__cups">
          <RouterLink
            v-for="(cup, i) in holdemCups"
            :key="cup.slug"
            :to="`/league/donks/cup/${cup.slug}`"
            class="diagram__cup-node dg-cup--holdem"
            :style="{ '--cup-color': cup.color }"
            @mouseenter="hoveredCupId = `he-cup-${i}`"
            @mouseleave="hoveredCupId = null"
          >
            <span class="diagram__cup-dot" />
            <div class="diagram__cup-info">
              <span class="diagram__cup-name">{{ cup.name }}</span>
              <span class="diagram__cup-schedule">{{ getDayLabel(cup) }} · {{ cup.timeET }} ET</span>
            </div>
            <span class="diagram__cup-qual-badge">Top 15 → PO</span>
          </RouterLink>
        </div>

        <!-- Medal -->
        <RouterLink :to="getMedalRoute(holdemMedal)" class="diagram__medal-node dg-medal--holdem">
          <span class="diagram__medal-icon">🏅</span>
          <span class="diagram__medal-name">{{ holdemMedal.name }}</span>
          <span class="diagram__medal-sub">Best 9 from 4 cups</span>
          <span class="diagram__medal-hint">View Leaderboard →</span>
        </RouterLink>
      </div>
    </div>

    <!-- Divider -->
    <div class="diagram__divider" />

    <!-- Omaha Group -->
    <div class="diagram__group">
      <div class="diagram__group-label diagram__group-label--omaha">PL Omaha Hi/Lo</div>

      <div class="diagram__row">
        <div class="diagram__cups">
          <RouterLink
            v-for="(cup, i) in omahaCups"
            :key="cup.slug"
            :to="`/league/donks/cup/${cup.slug}`"
            class="diagram__cup-node dg-cup--omaha"
            :style="{ '--cup-color': cup.color }"
            @mouseenter="hoveredCupId = `om-cup-${i}`"
            @mouseleave="hoveredCupId = null"
          >
            <span class="diagram__cup-dot" />
            <div class="diagram__cup-info">
              <span class="diagram__cup-name">{{ cup.name }}</span>
              <span class="diagram__cup-schedule">{{ getDayLabel(cup) }} · {{ cup.timeET }} ET</span>
            </div>
          </RouterLink>
        </div>

        <RouterLink :to="getMedalRoute(omahaMedal)" class="diagram__medal-node dg-medal--omaha">
          <span class="diagram__medal-icon">🏅</span>
          <span class="diagram__medal-name">{{ omahaMedal.name }}</span>
          <span class="diagram__medal-sub">Best 9 from 2 cups</span>
          <span class="diagram__qual-badge diagram__qual-badge--omaha">
            <i class="i-lucide-clover diagram__qual-badge-icon" />
            3 Wild Cards → Playoffs
          </span>
          <span class="diagram__medal-hint">View Leaderboard →</span>
        </RouterLink>
      </div>
    </div>

    <!-- Playoffs Node -->
    <div class="diagram__divider" />
    <div class="diagram__bottom-row">
      <RouterLink to="/league/donks/playoffs" class="diagram__playoffs-node dg-playoffs">
        <i class="i-lucide-swords diagram__playoffs-icon" />
        <span class="diagram__playoffs-name">FatnSassy Playoffs</span>
        <span class="diagram__playoffs-sub">Top qualifiers compete for the Medal</span>
        <span class="diagram__medal-hint">View Playoffs →</span>
      </RouterLink>

      <!-- Hall of Fame -->
      <RouterLink to="/league/donks/hall-of-fame" class="diagram__hof-node">
        <span class="diagram__hof-icon">&#127942;</span>
        <span class="diagram__hof-name">Hall of Fame</span>
        <span class="diagram__hof-sub">All-time award winners</span>
        <span class="diagram__medal-hint">View Hall of Fame →</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.diagram {
  position: relative;
  padding: 2rem;
}

.diagram__svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.diagram__arrow {
  transition: opacity 0.25s ease;
}

.diagram__arrow--dashed {
  animation: arrowFlow 1.5s linear infinite;
}

@keyframes arrowFlow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -20; }
}

.diagram__title {
  position: relative;
  z-index: 1;
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-donks-gold-dark);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.diagram__title-icon {
  color: var(--color-donks-gold);
  font-size: 1rem;
  opacity: 0.6;
}

.diagram__subtitle {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-donks-text-secondary);
  margin-bottom: 2rem;
}

/* Group */
.diagram__group {
  position: relative;
  z-index: 1;
  margin-bottom: 1.5rem;
}

.diagram__group-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-donks-text-secondary);
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-donks-gold);
}

.diagram__group-label--omaha {
  border-left-color: var(--color-donks-felt);
}

/* Row layout */
.diagram__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 3rem;
}

/* Cup nodes */
.diagram__cups {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.diagram__cup-node {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.85rem;
  padding-right: 1.6rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 3px solid var(--cup-color, #999);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-donks-text);
  transition: all 0.25s ease;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.diagram__cup-node::after {
  content: '›';
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cup-color, #999);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.diagram__cup-node:hover {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(3px);
  border-left-width: 4px;
}

.diagram__cup-node:hover::after {
  opacity: 0.8;
  transform: translateY(-50%) translateX(2px);
}

.diagram__cup-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cup-color, #999);
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--cup-color, #999) 50%, transparent);
}

.diagram__cup-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.diagram__cup-name {
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diagram__cup-schedule {
  font-size: 0.68rem;
  color: var(--color-donks-text-muted);
}

.diagram__cup-qual-badge {
  margin-left: auto;
  padding: 0.12rem 0.4rem;
  border-radius: 4px;
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
  background: rgba(201, 162, 39, 0.12);
  color: #b8941e;
  border: 1px dashed rgba(201, 162, 39, 0.35);
  flex-shrink: 0;
}

/* Medal nodes */
.diagram__medal-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.4rem 1.2rem 1rem;
  background: linear-gradient(
    145deg,
    rgba(201, 162, 39, 0.12) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(201, 162, 39, 0.08) 100%
  );
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(201, 162, 39, 0.4);
  border-top: 3px solid var(--color-donks-gold);
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-donks-text);
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  text-align: center;
  min-height: 120px;
  animation: medalGlow 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes medalGlow {
  0%, 100% { border-color: rgba(201, 162, 39, 0.4); }
  50% { border-color: rgba(201, 162, 39, 0.7); }
}

.diagram__medal-node:hover {
  box-shadow: 0 6px 28px rgba(201, 162, 39, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  animation: none;
  border-color: var(--color-donks-gold);
}

.diagram__medal-icon {
  font-size: 2.2rem;
  margin-bottom: 0.3rem;
  filter: drop-shadow(0 2px 4px rgba(201, 162, 39, 0.3));
}

.diagram__medal-name {
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-gold-dark);
}

.diagram__medal-sub {
  font-size: 0.65rem;
  color: var(--color-donks-text-muted);
  margin-top: 0.15rem;
}

.diagram__medal-hint {
  font-size: 0.58rem;
  color: var(--color-donks-gold);
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.diagram__medal-node:hover .diagram__medal-hint,
.diagram__hof-node:hover .diagram__medal-hint,
.diagram__playoffs-node:hover .diagram__medal-hint {
  opacity: 0.8;
}

/* Qualifier badge (inside omaha medal node) */
.diagram__qual-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.4rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.diagram__qual-badge--omaha {
  background: rgba(45, 106, 79, 0.1);
  color: #2d6a4f;
  border: 1px dashed rgba(45, 106, 79, 0.3);
}

.diagram__qual-badge-icon {
  width: 11px;
  height: 11px;
}

/* Divider */
.diagram__divider {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 1.5rem 2rem;
  background: linear-gradient(90deg, transparent, var(--color-donks-card-border), transparent);
}

/* Bottom row: Playoffs + HoF side by side */
.diagram__bottom-row {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: stretch;
}

/* Playoffs node */
.diagram__playoffs-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 1.4rem 0.85rem;
  background: linear-gradient(
    145deg,
    rgba(212, 160, 23, 0.14) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(212, 160, 23, 0.1) 100%
  );
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(201, 162, 39, 0.4);
  border-top: 3px solid var(--color-donks-gold);
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-donks-text);
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  text-align: center;
  flex: 1;
  max-width: 280px;
}

.diagram__playoffs-node:hover {
  box-shadow: 0 6px 28px rgba(201, 162, 39, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  border-color: var(--color-donks-gold);
}

.diagram__playoffs-icon {
  width: 28px;
  height: 28px;
  color: var(--color-donks-gold);
  margin-bottom: 0.3rem;
  filter: drop-shadow(0 2px 4px rgba(201, 162, 39, 0.3));
}

.diagram__playoffs-name {
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-gold-dark);
}

.diagram__playoffs-sub {
  font-size: 0.65rem;
  color: var(--color-donks-text-muted);
  margin-top: 0.15rem;
}

/* Hall of Fame node */
.diagram__hof-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 1.5rem 0.85rem;
  background: linear-gradient(
    145deg,
    rgba(201, 162, 39, 0.12) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(201, 162, 39, 0.08) 100%
  );
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(201, 162, 39, 0.4);
  border-top: 3px solid var(--color-donks-gold);
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-donks-text);
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  text-align: center;
  flex: 1;
  max-width: 280px;
}

.diagram__hof-node:hover {
  box-shadow: 0 6px 28px rgba(201, 162, 39, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  border-color: var(--color-donks-gold);
}

.diagram__hof-icon {
  font-size: 2rem;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 2px 4px rgba(201, 162, 39, 0.3));
}

.diagram__hof-name {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-gold-dark);
}

.diagram__hof-sub {
  font-size: 0.65rem;
  color: var(--color-donks-text-muted);
  margin-top: 0.1rem;
}

/* Responsive */
@media (max-width: 700px) {
  .diagram__row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .diagram__medal-node {
    min-height: auto;
    padding: 0.85rem;
  }

  .diagram__cup-node {
    padding: 0.45rem 0.65rem;
    padding-right: 1.4rem;
  }

  .diagram__cup-name {
    font-size: 0.75rem;
  }

  .diagram__bottom-row {
    flex-direction: column;
    align-items: center;
  }

  .diagram__playoffs-node,
  .diagram__hof-node {
    max-width: 100%;
    padding: 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .diagram__arrow--dashed { animation: none; }
  .diagram__medal-node { animation: none; }
}
</style>
