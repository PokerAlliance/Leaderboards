<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useResizeObserver } from '@vueuse/core'
import type { DonksCupSlug, DonksGameType, DonksPlayerResult, DonksGame } from '@/types/donks'
import { DONKS_CUPS, DONKS_MEDALS, TOP_N_SCORES } from '@/config/donks'
import { calculateTopN } from '@/services/scoring/strategies/donks'
import { useDonksStore } from '@/composables/useDonksStore'
import { format } from 'date-fns'

const props = defineProps<{
  gameType: DonksGameType
  cutoffDate?: Date | null
}>()

const emit = defineEmits<{
  'player-click': [username: string]
}>()

const store = useDonksStore()

const RANK_COLORS = ['#c9a227', '#a8a8a8', '#cd7f32', '#7b1c2e', '#1a6b3a']
const GHOST_COLOR = '#8a8a9a'
const MARGIN = { top: 16, right: 110, bottom: 62, left: 56 }
const AVATAR_R = 13
const AVATAR_R_TOP3 = 14

const chartWrapper = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const focusCount = ref(5)
const hoveredPlayer = ref<string | null>(null)
const hoveredGameIdx = ref<number | null>(null)
const animationKey = ref(0)
const containerWidth = ref(800)

const relevantCupSlugs = computed<Set<DonksCupSlug>>(() => {
  const medal = DONKS_MEDALS.find((m) => m.gameType === props.gameType)!
  return new Set(medal.cupSlugs)
})

const cupConfigMap = computed(() => {
  const map: Partial<Record<DonksCupSlug, (typeof DONKS_CUPS)[number]>> = {}
  for (const c of DONKS_CUPS) {
    if (relevantCupSlugs.value.has(c.slug)) map[c.slug] = c
  }
  return map
})

interface GameStep {
  game: DonksGame
  cupShort: string
  cupColor: string
  dayType: 'monday' | 'wednesday' | 'sunday'
  dateLabel: string
}

interface PlayerSeries {
  username: string
  points: (number | null)[]
  finalRank: number
  finalTotal: number
  gamesPlayed: number
  color: string
  strokeWidth: number
  opacity: number
}

interface OvertakeEvent {
  gameIdx: number
  oldLeader: string
  newLeader: string
}

const filteredResults = computed(() => {
  let results = store.playerResults.value.filter((r) => relevantCupSlugs.value.has(r.cupSlug))
  if (props.cutoffDate) {
    const cutoff = props.cutoffDate
    results = results.filter((r) => r.gameDate <= cutoff)
  }
  return results
})

const gameSteps = computed<GameStep[]>(() => {
  const results = filteredResults.value
  const gameMap = new Map<string, DonksGame>()
  for (const r of results) {
    if (!gameMap.has(r.gameId)) {
      gameMap.set(r.gameId, {
        gameId: r.gameId,
        gameDate: r.gameDate,
        cupSlug: r.cupSlug,
        tournamentId: r.tournamentId,
        totalPlayers: r.totalPlayers,
        lockedBy: r.lockedBy,
        lockedAt: r.lockedAt,
      })
    }
  }
  return [...gameMap.values()]
    .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime())
    .map((g) => {
      const cfg = cupConfigMap.value[g.cupSlug]
      return {
        game: g,
        cupShort: cfg?.shortName ?? g.cupSlug.slice(0, 3).toUpperCase(),
        cupColor: cfg?.color ?? '#888',
        dayType: (cfg?.day ?? 'wednesday') as 'monday' | 'wednesday' | 'sunday',
        dateLabel: format(g.gameDate, 'MMM d'),
      }
    })
})

const raceMatrix = computed(() => {
  const steps = gameSteps.value
  if (steps.length === 0) return { players: [], matrix: [], gamePoints: [] }

  const results = filteredResults.value
  const byGame = new Map<string, DonksPlayerResult[]>()
  for (const r of results) {
    if (!byGame.has(r.gameId)) byGame.set(r.gameId, [])
    byGame.get(r.gameId)!.push(r)
  }

  const playerScores = new Map<string, number[]>()
  const matrix: Map<string, number>[] = []
  const gamePoints: Map<string, number>[] = []

  for (const step of steps) {
    const gameResults = byGame.get(step.game.gameId) ?? []
    const gpMap = new Map<string, number>()

    for (const r of gameResults) {
      if (!playerScores.has(r.username)) playerScores.set(r.username, [])
      playerScores.get(r.username)!.push(r.pointsEarned)
      gpMap.set(r.username, r.pointsEarned)
    }

    const snapshot = new Map<string, number>()
    for (const [username, scores] of playerScores) {
      snapshot.set(username, calculateTopN(scores, TOP_N_SCORES))
    }
    matrix.push(snapshot)
    gamePoints.push(gpMap)
  }

  const lastSnapshot = matrix[matrix.length - 1]!
  const allPlayers = [...lastSnapshot.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([username], idx) => ({ username, rank: idx + 1, total: lastSnapshot.get(username)! }))

  return { players: allPlayers, matrix, gamePoints }
})

const playerSeries = computed<PlayerSeries[]>(() => {
  const { players, matrix } = raceMatrix.value
  if (players.length === 0) return []

  return players.map((p) => {
    const points = matrix.map((snap) => snap.get(p.username) ?? null)
    const rank = p.rank
    let color: string
    let strokeWidth: number
    let opacity: number

    if (rank <= 5) {
      color = RANK_COLORS[rank - 1]!
      strokeWidth = 2.5
      opacity = 1
    } else if (rank <= 10) {
      color = GHOST_COLOR
      strokeWidth = 1.5
      opacity = 0.55
    } else {
      color = GHOST_COLOR
      strokeWidth = 0.8
      opacity = 0.18
    }

    return {
      username: p.username,
      points,
      finalRank: rank,
      finalTotal: p.total,
      gamesPlayed: points.filter((v) => v !== null).length,
      color,
      strokeWidth,
      opacity,
    }
  })
})

const overtakes = computed<OvertakeEvent[]>(() => {
  const { matrix } = raceMatrix.value
  const events: OvertakeEvent[] = []
  let prevLeader: string | null = null

  for (let i = 0; i < matrix.length; i++) {
    const snap = matrix[i]!
    let leader: string | null = null
    let max = -1
    for (const [u, pts] of snap) {
      if (pts > max) { max = pts; leader = u }
    }
    if (leader && prevLeader && leader !== prevLeader) {
      events.push({ gameIdx: i, oldLeader: prevLeader, newLeader: leader })
    }
    prevLeader = leader
  }
  return events
})

const visiblePlayers = computed(() => {
  if (focusCount.value === 0) return new Set(playerSeries.value.map((p) => p.username))
  return new Set(playerSeries.value.filter((p) => p.finalRank <= focusCount.value).map((p) => p.username))
})

function getSeriesStyle(series: PlayerSeries) {
  const isVisible = visiblePlayers.value.has(series.username)
  const isHovered = hoveredPlayer.value === series.username
  const someoneHovered = hoveredPlayer.value !== null

  if (isHovered) {
    return { strokeWidth: 3.5, opacity: 1, filter: 'url(#glow)' }
  }
  if (someoneHovered) {
    return { strokeWidth: series.strokeWidth, opacity: 0.06, filter: 'none' }
  }
  if (!isVisible) {
    return { strokeWidth: 0.8, opacity: 0.10, filter: 'none' }
  }
  return { strokeWidth: series.strokeWidth, opacity: series.opacity, filter: 'none' }
}

// ─── D3 Rendering ──────────────────────────────────────────────────────────

const chartHeight = computed(() => {
  if (containerWidth.value < 600) return 220
  if (containerWidth.value < 900) return 260
  return 320
})

const innerWidth = computed(() => Math.max(100, containerWidth.value - MARGIN.left - MARGIN.right))
const innerHeight = computed(() => chartHeight.value - MARGIN.top - MARGIN.bottom)

const minChartWidth = computed(() => {
  const gamesCount = gameSteps.value.length
  return Math.max(containerWidth.value, gamesCount * 56)
})

const svgWidth = computed(() => {
  if (containerWidth.value < 600) return minChartWidth.value
  return containerWidth.value
})

const xScale = computed(() => {
  const steps = gameSteps.value
  if (steps.length === 0) return d3.scaleLinear().domain([0, 1]).range([0, innerWidth.value])
  if (steps.length === 1) return d3.scaleLinear().domain([0, 0]).range([innerWidth.value / 2, innerWidth.value / 2])
  const actualInner = svgWidth.value - MARGIN.left - MARGIN.right
  return d3.scaleLinear().domain([0, steps.length - 1]).range([0, actualInner])
})

const yScale = computed(() => {
  const visible = playerSeries.value.filter((p) => visiblePlayers.value.has(p.username))
  if (visible.length === 0) return d3.scaleLinear().domain([0, 100]).range([innerHeight.value, 0])
  const maxPts = d3.max(visible, (p) => d3.max(p.points.filter((v): v is number => v !== null)) ?? 0) ?? 100
  return d3.scaleLinear().domain([0, maxPts * 1.08]).range([innerHeight.value, 0]).nice()
})

function linePath(points: (number | null)[], username?: string): string {
  const lineGen = d3.line<[number, number]>()
    .x((d) => xScale.value(d[0]))
    .y((d) => yScale.value(d[1]))
    .curve(d3.curveMonotoneX)

  const validPoints: [number, number][] = []
  for (let i = 0; i < points.length; i++) {
    if (points[i] !== null) validPoints.push([i, points[i]!])
  }

  return lineGen(validPoints) ?? ''
}

function leaderAreaPath(): string {
  const leader = playerSeries.value.find((p) => p.finalRank === 1)
  if (!leader) return ''

  const areaGen = d3.area<[number, number]>()
    .x((d) => xScale.value(d[0]))
    .y0(innerHeight.value)
    .y1((d) => yScale.value(d[1]))
    .curve(d3.curveMonotoneX)

  const validPoints: [number, number][] = []
  for (let i = 0; i < leader.points.length; i++) {
    if (leader.points[i] !== null) validPoints.push([i, leader.points[i]!])
  }
  return areaGen(validPoints) ?? ''
}

function lastPoint(series: PlayerSeries): { x: number; y: number } | null {
  for (let i = series.points.length - 1; i >= 0; i--) {
    if (series.points[i] !== null) return { x: xScale.value(i), y: yScale.value(series.points[i]!) }
  }
  return null
}

function resolveAvatarPositions() {
  const positions: Array<{ username: string; x: number; y: number; rank: number }> = []
  for (const s of playerSeries.value) {
    if (!visiblePlayers.value.has(s.username)) continue
    const lp = lastPoint(s)
    if (lp) positions.push({ username: s.username, x: lp.x, y: lp.y, rank: s.finalRank })
  }

  positions.sort((a, b) => a.y - b.y)
  const minGap = 28
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < positions.length; i++) {
      const diff = positions[i]!.y - positions[i - 1]!.y
      if (diff < minGap) {
        const shift = (minGap - diff) / 2
        positions[i - 1]!.y -= shift
        positions[i]!.y += shift
      }
    }
  }

  return positions
}

const avatarPositions = computed(() => resolveAvatarPositions())

const yTicks = computed(() => {
  const ticks = yScale.value.ticks(5)
  return ticks.map((t) => ({ value: t, y: yScale.value(t), label: formatPts(t) }))
})

function formatPts(n: number): string {
  if (n >= 1000) return Math.round(n / 1000) + 'k'
  return String(Math.round(n))
}

function bandFill(dayType: string): string {
  if (dayType === 'monday') return 'rgba(26, 107, 58, 0.03)'
  if (dayType === 'sunday') return 'rgba(201, 162, 39, 0.025)'
  return 'rgba(201, 162, 39, 0.03)'
}

function bandWidth(idx: number): number {
  const total = gameSteps.value.length
  if (total <= 1) return innerWidth.value
  const step = xScale.value(1) - xScale.value(0)
  const halfStep = step / 2
  let left = idx === 0 ? 0 : halfStep
  let right = idx === total - 1 ? 0 : halfStep
  return left + right || step
}

function bandX(idx: number): number {
  const total = gameSteps.value.length
  if (total <= 1) return 0
  const step = xScale.value(1) - xScale.value(0)
  const halfStep = step / 2
  return xScale.value(idx) - (idx === 0 ? 0 : halfStep)
}

function ringColor(rank: number): string {
  if (rank === 1) return '#c9a227'
  if (rank === 2) return '#a8a8a8'
  if (rank === 3) return '#cd7f32'
  return 'rgba(0,0,0,0.1)'
}

function avatarRadius(): number {
  if (containerWidth.value < 600) return 9
  if (containerWidth.value < 900) return 11
  return AVATAR_R
}

// ─── Hover / Tooltip ────────────────────────────────────────────────────────

const tooltipData = computed(() => {
  if (!hoveredPlayer.value) return null
  const series = playerSeries.value.find((s) => s.username === hoveredPlayer.value)
  if (!series) return null
  const pos = avatarPositions.value.find((a) => a.username === hoveredPlayer.value)
  if (!pos) return null
  const screenPos = getTooltipPosition(pos)
  return {
    username: series.username,
    rank: series.finalRank,
    total: Math.round(series.finalTotal),
    games: series.gamesPlayed,
    avatar: store.getAvatar(series.username),
    x: screenPos.x,
    y: screenPos.y,
  }
})

function gameHoverPoints(gameIdx: number) {
  const { gamePoints } = raceMatrix.value
  if (!gamePoints[gameIdx]) return []
  const gpMap = gamePoints[gameIdx]!
  const results: Array<{ username: string; pts: number; x: number; y: number }> = []

  for (const s of playerSeries.value) {
    if (!visiblePlayers.value.has(s.username)) continue
    if (s.points[gameIdx] === null) continue
    const earned = gpMap.get(s.username)
    if (!earned) continue
    results.push({
      username: s.username,
      pts: Math.round(earned),
      x: xScale.value(gameIdx),
      y: yScale.value(s.points[gameIdx]!),
    })
  }
  return results
}

// ─── Entrance Animation ──────────────────────────────────────────────────────

const ready = ref(false)
const pathLengths = ref<Record<string, number>>({})

function measurePathLengths() {
  if (!svgRef.value) return
  const map: Record<string, number> = {}
  const paths = svgRef.value.querySelectorAll<SVGPathElement>('.race-chart__line')
  paths.forEach((el) => {
    const key = el.getAttribute('data-username')
    if (key) map[key] = el.getTotalLength()
  })
  pathLengths.value = map

}

function getPathLength(username: string): number {
  const measured = pathLengths.value[username]
  return measured ?? 1000
}

function animationDelay(rank: number): number {
  if (rank > 10) return 0
  if (rank > 5) return 200
  if (rank > 1) return 400
  return 600
}

function animationDuration(rank: number): number {
  if (rank <= 5) return 800
  if (rank <= 10) return 600
  return 400
}

// ─── ResizeObserver ──────────────────────────────────────────────────────────

useResizeObserver(chartWrapper, (entries) => {
  const entry = entries[0]
  if (entry) {
    const oldW = containerWidth.value
    containerWidth.value = entry.contentRect.width
    if (ready.value && Math.abs(oldW - entry.contentRect.width) > 5) {
      nextTick(() => measurePathLengths())
    }
  }
})

// ─── Touch support ──────────────────────────────────────────────────────────

let touchTimer: ReturnType<typeof setTimeout> | null = null

function onTouchStart(username: string) {
  touchTimer = setTimeout(() => {
    hoveredPlayer.value = username
  }, 300)
}

function onTouchEnd() {
  if (touchTimer) clearTimeout(touchTimer)
  setTimeout(() => { hoveredPlayer.value = null }, 2000)
}

// ─── Tooltip positioning relative to chart wrapper ──────────────────────────

function getTooltipPosition(pos: { x: number; y: number }) {
  if (!chartWrapper.value) return { x: 0, y: 0 }
  const rect = chartWrapper.value.getBoundingClientRect()
  return {
    x: rect.left + MARGIN.left + pos.x + 24,
    y: rect.top + MARGIN.top + pos.y,
  }
}

// Retrigger animation on quarter change
watch(() => store.loadedQuarter.value, () => {
  ready.value = false
  animationKey.value++
  nextTick(() => {
    ready.value = true
    nextTick(() => measurePathLengths())
  })
})

onMounted(() => {
  nextTick(() => {
    ready.value = true
    animationKey.value++
    nextTick(() => measurePathLengths())
  })
})
</script>

<template>
  <div class="race-chart" ref="chartWrapper">
    <!-- Top-N Toggle -->
    <div class="race-chart__controls">
      <button
        v-for="n in [5, 10, 20, 0]"
        :key="n"
        class="race-chart__pill"
        :class="{ 'race-chart__pill--active': focusCount === n }"
        @click="focusCount = n"
      >
        {{ n === 0 ? 'All' : `Top ${n}` }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="gameSteps.length === 0" class="race-chart__empty">
      No games played yet this quarter. The race begins with the first cup!
    </div>

    <!-- Chart -->
    <div
      v-else
      class="race-chart__scroll"
      :class="{ 'race-chart__scroll--scrollable': containerWidth < 600 && minChartWidth > containerWidth }"
    >
      <svg
        ref="svgRef"
        :key="animationKey"
        :width="svgWidth"
        :height="chartHeight"
        class="race-chart__svg"
        @mouseleave="hoveredPlayer = null; hoveredGameIdx = null"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="leaderFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(201,162,39,0.14)" />
            <stop offset="100%" stop-color="rgba(201,162,39,0)" />
          </linearGradient>
          <clipPath v-for="ap in avatarPositions" :key="'clip-' + ap.username" :id="'clip-' + ap.username">
            <circle :r="ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius()" cx="0" cy="0" />
          </clipPath>
        </defs>

        <g :transform="`translate(${MARGIN.left},${MARGIN.top})`">
          <!-- Background Bands -->
          <rect
            v-for="(step, idx) in gameSteps"
            :key="'band-' + idx"
            :x="bandX(idx)"
            :y="0"
            :width="bandWidth(idx)"
            :height="innerHeight"
            :fill="bandFill(step.dayType)"
          />

          <!-- Grid Lines (horizontal) -->
          <line
            v-for="tick in yTicks"
            :key="'hgrid-' + tick.value"
            :x1="0"
            :x2="svgWidth - MARGIN.left - MARGIN.right"
            :y1="tick.y"
            :y2="tick.y"
            stroke="rgba(0,0,0,0.06)"
            stroke-dasharray="3,4"
          />

          <!-- Grid Lines (vertical) -->
          <line
            v-for="(_, idx) in gameSteps"
            :key="'vgrid-' + idx"
            :x1="xScale(idx)"
            :x2="xScale(idx)"
            :y1="0"
            :y2="innerHeight"
            stroke="rgba(0,0,0,0.04)"
            stroke-dasharray="2,4"
          />

          <!-- Game hover highlight band -->
          <rect
            v-if="hoveredGameIdx !== null"
            :x="xScale(hoveredGameIdx) - 12"
            :y="0"
            :width="24"
            :height="innerHeight"
            fill="rgba(201,162,39,0.06)"
            rx="4"
          />

          <!-- Leader area fill -->
          <path
            v-if="leaderAreaPath()"
            :d="leaderAreaPath()"
            fill="url(#leaderFill)"
            class="race-chart__leader-area"
          />

          <!-- Player lines -->
          <path
            v-for="series in playerSeries"
            :key="'line-' + series.username"
            :data-username="series.username"
            :d="linePath(series.points, series.username)"
            fill="none"
            :stroke="series.finalRank <= 5 ? series.color : GHOST_COLOR"
            :stroke-width="getSeriesStyle(series).strokeWidth"
            :opacity="getSeriesStyle(series).opacity"
            :filter="getSeriesStyle(series).filter"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="race-chart__line"
            :class="{ 'race-chart__line--animate': ready }"
            :style="{
              '--path-length': getPathLength(series.username),
              '--anim-delay': animationDelay(series.finalRank) + 'ms',
              '--anim-duration': animationDuration(series.finalRank) + 'ms',
            }"
            @mouseenter="hoveredPlayer = series.username"
            @mouseleave="hoveredPlayer = null"
            @touchstart.passive="onTouchStart(series.username)"
            @touchend.passive="onTouchEnd()"
          />

          <!-- Overtake markers -->
          <g
            v-for="(ov, oi) in overtakes"
            :key="'ov-' + oi"
            :transform="`translate(${xScale(ov.gameIdx)}, ${yScale(raceMatrix.matrix[ov.gameIdx]?.get(ov.newLeader) ?? 0)})`"
            class="race-chart__overtake"
          >
            <circle r="7" fill="rgba(201,162,39,0.18)" stroke="rgba(201,162,39,0.4)" stroke-width="1" />
            <text text-anchor="middle" dy="0.35em" font-size="8" fill="var(--color-donks-gold-dark)">&#8645;</text>
          </g>

          <!-- Game markers on X axis -->
          <g v-for="(step, idx) in gameSteps" :key="'gm-' + idx">
            <circle
              :cx="xScale(idx)"
              :cy="innerHeight + 12"
              r="5"
              :fill="step.cupColor"
              :opacity="hoveredGameIdx === idx ? 1 : 0.7"
              class="race-chart__game-dot"
              @mouseenter="hoveredGameIdx = idx"
              @mouseleave="hoveredGameIdx = null"
            />
            <text
              :x="xScale(idx)"
              :y="innerHeight + 26"
              text-anchor="middle"
              font-size="9"
              fill="var(--color-donks-text-secondary)"
              :opacity="0.8"
            >
              {{ step.cupShort }}
            </text>
            <text
              :x="xScale(idx)"
              :y="innerHeight + 37"
              text-anchor="middle"
              font-size="8"
              fill="var(--color-donks-text-muted)"
              :opacity="0.65"
            >
              {{ step.dateLabel }}
            </text>
          </g>

          <!-- Game hover point pips -->
          <template v-if="hoveredGameIdx !== null">
            <g v-for="hp in gameHoverPoints(hoveredGameIdx)" :key="'hp-' + hp.username">
              <circle :cx="hp.x" :cy="hp.y" r="3.5" fill="var(--color-donks-gold)" stroke="#fff" stroke-width="1" />
              <rect
                :x="hp.x + 6"
                :y="hp.y - 10"
                :width="String('+' + hp.pts.toLocaleString()).length * 6 + 10"
                height="16"
                rx="4"
                fill="rgba(26,26,46,0.85)"
              />
              <text
                :x="hp.x + 11"
                :y="hp.y + 1"
                font-size="9"
                font-weight="600"
                fill="#e4c95a"
              >
                +{{ hp.pts.toLocaleString() }}
              </text>
            </g>
          </template>

          <!-- Y axis labels -->
          <text
            v-for="tick in yTicks"
            :key="'ylabel-' + tick.value"
            :x="-8"
            :y="tick.y"
            text-anchor="end"
            dominant-baseline="middle"
            font-size="10"
            fill="var(--color-donks-text-muted)"
          >
            {{ tick.label }}
          </text>

          <!-- Avatar terminals: outer <g> for SVG position, inner <g> for CSS animation -->
          <g
            v-for="ap in ready ? avatarPositions : []"
            :key="'avatar-' + ap.username"
            :transform="`translate(${ap.x}, ${ap.y})`"
          >
            <g
              class="race-chart__avatar"
              :class="{ 'race-chart__avatar--hovered': hoveredPlayer === ap.username }"
              @mouseenter="hoveredPlayer = ap.username"
              @mouseleave="hoveredPlayer = null"
              @click="emit('player-click', ap.username)"
              @touchstart.passive="onTouchStart(ap.username)"
              @touchend.passive="onTouchEnd()"
              style="cursor: pointer"
            >
              <circle
                :r="(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius()) + 2"
                :fill="ringColor(ap.rank)"
                :opacity="hoveredPlayer === ap.username ? 1 : 0.8"
              />
              <image
                :href="store.getAvatar(ap.username)"
                :width="(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius()) * 2"
                :height="(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius()) * 2"
                :x="-(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius())"
                :y="-(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius())"
                :clip-path="`url(#clip-${ap.username})`"
                preserveAspectRatio="xMidYMid slice"
              />
              <text
                v-if="hoveredPlayer !== ap.username"
                :x="(ap.rank <= 3 ? AVATAR_R_TOP3 : avatarRadius()) + 5"
                dy="0.35em"
                font-size="10"
                font-weight="600"
                :fill="ap.rank <= 5 ? RANK_COLORS[ap.rank - 1] : 'var(--color-donks-text-secondary)'"
              >
                {{ ap.username }}
              </text>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- Tooltip card -->
    <Teleport to="body">
      <div
        v-if="tooltipData"
        ref="tooltipRef"
        class="race-chart__tooltip"
        :style="{
          left: tooltipData.x + 'px',
          top: tooltipData.y + 'px',
        }"
      >
        <div class="race-chart__tooltip-header">
          <img :src="tooltipData.avatar" class="race-chart__tooltip-avatar" />
          <div>
            <div class="race-chart__tooltip-name">{{ tooltipData.username }}</div>
            <div class="race-chart__tooltip-rank">#{{ tooltipData.rank }}</div>
          </div>
        </div>
        <div class="race-chart__tooltip-stats">
          <span>{{ tooltipData.total.toLocaleString() }} pts</span>
          <span class="race-chart__tooltip-sep">&middot;</span>
          <span>{{ tooltipData.games }} games</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.race-chart {
  position: relative;
  width: 100%;
}

.race-chart__controls {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.race-chart__pill {
  padding: 0.3em 0.85em;
  border-radius: 999px;
  border: 1.5px solid var(--color-donks-card-border);
  background: transparent;
  color: var(--color-donks-text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.race-chart__pill:hover {
  background: rgba(201, 162, 39, 0.08);
  border-color: var(--color-donks-gold);
}

.race-chart__pill--active {
  background: linear-gradient(135deg, var(--color-donks-gold) 0%, var(--color-donks-gold-light) 100%);
  color: #1a1a2e;
  border-color: var(--color-donks-gold);
}

.race-chart__empty {
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-donks-text-muted);
  font-size: 0.85rem;
}

.race-chart__scroll {
  position: relative;
  width: 100%;
  overflow-x: hidden;
}

.race-chart__scroll--scrollable {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(201, 162, 39, 0.3) transparent;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
}

.race-chart__svg {
  display: block;
}

.race-chart__line {
  transition: stroke-width 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
  pointer-events: stroke;
}

.race-chart__line--animate {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: drawLine var(--anim-duration, 600ms) ease-out var(--anim-delay, 0ms) forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.race-chart__leader-area {
  opacity: 0;
  animation: fadeIn 600ms ease 700ms forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.race-chart__overtake {
  opacity: 0;
  animation: popIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 800ms forwards;
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}

.race-chart__game-dot {
  cursor: pointer;
  transition: opacity 0.2s ease, r 0.2s ease;
}

.race-chart__game-dot:hover {
  opacity: 1 !important;
}

.race-chart__avatar {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  opacity: 0;
  animation: avatarPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) 900ms forwards;
}

.race-chart__avatar--hovered {
  transform: scale(1.4);
  z-index: 100;
}

@keyframes avatarPop {
  0% { opacity: 0; transform: scale(0); }
  100% { opacity: 1; transform: scale(1); }
}
</style>

<style>
.race-chart__tooltip {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  background: rgba(26, 26, 46, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 162, 39, 0.4);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 0.78rem;
  min-width: 140px;
  transform: translateY(-50%);
  animation: tooltipFade 150ms ease forwards;
}

@keyframes tooltipFade {
  from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
  to { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.race-chart__tooltip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.race-chart__tooltip-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(201, 162, 39, 0.6);
}

.race-chart__tooltip-name {
  font-weight: 700;
  font-size: 0.82rem;
}

.race-chart__tooltip-rank {
  font-size: 0.7rem;
  color: #e4c95a;
  font-weight: 600;
}

.race-chart__tooltip-stats {
  display: flex;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.75);
}

.race-chart__tooltip-sep {
  opacity: 0.4;
}
</style>
