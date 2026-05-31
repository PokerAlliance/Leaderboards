<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Constants ──────────────────────────────────────────────────────────────

const COLS = 8
const INITIAL_ROWS = 6
const BUBBLE_R = 16
const BUBBLE_D = BUBBLE_R * 2
const CANVAS_W = COLS * BUBBLE_D + BUBBLE_R
const CANVAS_H = 420
const SHOOT_SPEED = 480
const MIN_ANGLE = Math.PI * 0.08
const MAX_ANGLE = Math.PI * 0.92

interface BubbleType {
  id: number
  symbol: string
  color: string
  glow: string
}

const TYPES: BubbleType[] = [
  { id: 0, symbol: '\u2660', color: '#00B4D8', glow: 'rgba(0,180,216,0.5)' },
  { id: 1, symbol: '\u2665', color: '#EF4444', glow: 'rgba(239,68,68,0.5)' },
  { id: 2, symbol: '\u2666', color: '#7C3AED', glow: 'rgba(124,58,237,0.5)' },
  { id: 3, symbol: '\u2663', color: '#10B981', glow: 'rgba(16,185,129,0.5)' },
  { id: 4, symbol: '\u2605', color: '#D4AF37', glow: 'rgba(212,175,55,0.5)' },
]
const WILD_ID = 4
const WILD_CHANCE = 0.08

interface GridBubble {
  row: number
  col: number
  type: BubbleType
  x: number
  y: number
  popping: boolean
  popTimer: number
  dropping: boolean
  dropVy: number
  dropY: number
}

interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  type: BubbleType
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  r: number
}

// ─── State ──────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let dpr = 1
let animId = 0
let lastTime = 0

let grid: GridBubble[] = []
let projectile: Projectile | null = null
let particles: Particle[] = []
let currentType: BubbleType = randomType(false)
let nextType: BubbleType = randomType(false)
let aimAngle = Math.PI / 2
let score = 0
let canShoot = true

const shooterX = CANVAS_W / 2
const shooterY = CANVAS_H - 30

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomType(allowWild: boolean): BubbleType {
  if (allowWild && Math.random() < WILD_CHANCE) return TYPES[WILD_ID]!
  const idx = Math.floor(Math.random() * (TYPES.length - 1))
  return TYPES[idx]!
}

function bubbleX(row: number, col: number): number {
  const offset = row % 2 === 1 ? BUBBLE_R : 0
  return col * BUBBLE_D + BUBBLE_R + offset
}

function bubbleY(row: number): number {
  return row * (BUBBLE_D - 2) + BUBBLE_R + 4
}

function getNeighbors(row: number, col: number): [number, number][] {
  const isOdd = row % 2 === 1
  const neighbors: [number, number][] = [
    [row, col - 1], [row, col + 1],
    [row - 1, col], [row + 1, col],
  ]
  if (isOdd) {
    neighbors.push([row - 1, col + 1], [row + 1, col + 1])
  } else {
    neighbors.push([row - 1, col - 1], [row + 1, col - 1])
  }
  return neighbors
}

function getGridBubble(row: number, col: number): GridBubble | undefined {
  return grid.find((b) => b.row === row && b.col === col && !b.popping && !b.dropping)
}

function maxColsForRow(row: number): number {
  return row % 2 === 1 ? COLS - 1 : COLS
}

// ─── Grid Init ──────────────────────────────────────────────────────────────

function initGrid() {
  grid = []
  for (let row = 0; row < INITIAL_ROWS; row++) {
    const cols = maxColsForRow(row)
    for (let col = 0; col < cols; col++) {
      grid.push({
        row, col,
        type: randomType(false),
        x: bubbleX(row, col),
        y: bubbleY(row),
        popping: false,
        popTimer: 0,
        dropping: false,
        dropVy: 0,
        dropY: 0,
      })
    }
  }
  score = 0
  currentType = randomType(false)
  nextType = randomType(false)
  canShoot = true
  projectile = null
  particles = []
}

// ─── Snap & Match ───────────────────────────────────────────────────────────

function findNearestCell(px: number, py: number): [number, number] {
  let bestRow = 0
  let bestCol = 0
  let bestDist = Infinity

  const maxRow = Math.max(0, ...grid.map((b) => b.row)) + 2
  for (let row = 0; row <= maxRow; row++) {
    const cols = maxColsForRow(row)
    for (let col = 0; col < cols; col++) {
      if (getGridBubble(row, col)) continue
      const cx = bubbleX(row, col)
      const cy = bubbleY(row)
      const d = Math.hypot(px - cx, py - cy)
      if (d < bestDist) {
        bestDist = d
        bestRow = row
        bestCol = col
      }
    }
  }
  return [bestRow, bestCol]
}

function findMatches(startRow: number, startCol: number): GridBubble[] {
  const start = getGridBubble(startRow, startCol)
  if (!start) return []

  const visited = new Set<string>()
  const matched: GridBubble[] = []
  const queue: GridBubble[] = [start]
  visited.add(`${startRow},${startCol}`)

  while (queue.length > 0) {
    const b = queue.shift()!
    matched.push(b)

    for (const [nr, nc] of getNeighbors(b.row, b.col)) {
      const key = `${nr},${nc}`
      if (visited.has(key)) continue
      visited.add(key)
      const nb = getGridBubble(nr, nc)
      if (!nb) continue
      const isMatch =
        nb.type.id === start.type.id ||
        nb.type.id === WILD_ID ||
        start.type.id === WILD_ID
      if (isMatch) queue.push(nb)
    }
  }
  return matched
}

function findFloating(): GridBubble[] {
  const connected = new Set<string>()
  const queue: GridBubble[] = []

  for (const b of grid) {
    if (b.row === 0 && !b.popping && !b.dropping) {
      connected.add(`${b.row},${b.col}`)
      queue.push(b)
    }
  }

  while (queue.length > 0) {
    const b = queue.shift()!
    for (const [nr, nc] of getNeighbors(b.row, b.col)) {
      const key = `${nr},${nc}`
      if (connected.has(key)) continue
      const nb = getGridBubble(nr, nc)
      if (nb) {
        connected.add(key)
        queue.push(nb)
      }
    }
  }

  return grid.filter(
    (b) => !b.popping && !b.dropping && !connected.has(`${b.row},${b.col}`),
  )
}

function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const speed = 60 + Math.random() * 80
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.6 + Math.random() * 0.3,
      color,
      r: 2 + Math.random() * 3,
    })
  }
}

function snapProjectile(p: Projectile) {
  const [row, col] = findNearestCell(p.x, p.y)
  const newBubble: GridBubble = {
    row, col,
    type: p.type,
    x: bubbleX(row, col),
    y: bubbleY(row),
    popping: false,
    popTimer: 0,
    dropping: false,
    dropVy: 0,
    dropY: 0,
  }
  grid.push(newBubble)
  projectile = null

  const matches = findMatches(row, col)
  if (matches.length >= 3) {
    for (const b of matches) {
      b.popping = true
      b.popTimer = 0.3
      spawnParticles(b.x, b.y, b.type.color, 5)
    }
    score += matches.length * 10

    setTimeout(() => {
      grid = grid.filter((b) => !b.popping)

      const floating = findFloating()
      if (floating.length > 0) {
        for (const b of floating) {
          b.dropping = true
          b.dropVy = 0
          b.dropY = b.y
          spawnParticles(b.x, b.y, b.type.color, 3)
        }
        score += floating.length * 5
      }

      canShoot = true
      if (grid.filter((b) => !b.dropping).length === 0) {
        initGrid()
      }
    }, 300)
  } else {
    canShoot = true
  }
}

// ─── Shoot ──────────────────────────────────────────────────────────────────

function shoot() {
  if (!canShoot || projectile) return
  canShoot = false

  const vx = Math.cos(aimAngle) * SHOOT_SPEED
  const vy = -Math.sin(aimAngle) * SHOOT_SPEED

  projectile = {
    x: shooterX,
    y: shooterY,
    vx,
    vy,
    type: currentType,
  }

  currentType = nextType
  nextType = randomType(true)
}

// ─── Update ─────────────────────────────────────────────────────────────────

function update(dt: number) {
  // Update projectile
  if (projectile) {
    projectile.x += projectile.vx * dt
    projectile.y += projectile.vy * dt

    // Wall bounce
    if (projectile.x - BUBBLE_R <= 0) {
      projectile.x = BUBBLE_R
      projectile.vx = Math.abs(projectile.vx)
    } else if (projectile.x + BUBBLE_R >= CANVAS_W) {
      projectile.x = CANVAS_W - BUBBLE_R
      projectile.vx = -Math.abs(projectile.vx)
    }

    // Ceiling
    if (projectile.y - BUBBLE_R <= 0) {
      projectile.y = BUBBLE_R
      snapProjectile(projectile)
      return
    }

    // Collision with grid bubbles
    for (const b of grid) {
      if (b.popping || b.dropping) continue
      const d = Math.hypot(projectile.x - b.x, projectile.y - b.y)
      if (d < BUBBLE_D - 2) {
        snapProjectile(projectile)
        return
      }
    }
  }

  // Update dropping bubbles
  for (const b of grid) {
    if (b.dropping) {
      b.dropVy += 600 * dt
      b.dropY += b.dropVy * dt
      b.y = b.dropY
    }
  }
  grid = grid.filter((b) => !b.dropping || b.y < CANVAS_H + 50)

  // Update pop timers
  for (const b of grid) {
    if (b.popping) {
      b.popTimer -= dt
    }
  }

  // Update particles
  for (const p of particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 120 * dt
    p.life -= dt
  }
  particles = particles.filter((p) => p.life > 0)
}

// ─── Draw ───────────────────────────────────────────────────────────────────

function drawBubble(
  c: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  type: BubbleType,
  scale: number = 1,
) {
  const sr = r * scale
  c.save()

  // Glow
  c.shadowColor = type.glow
  c.shadowBlur = 12 * scale
  c.beginPath()
  c.arc(x, y, sr, 0, Math.PI * 2)
  c.fillStyle = `rgba(15,23,42,0.7)`
  c.fill()
  c.shadowBlur = 0

  // Border ring
  c.beginPath()
  c.arc(x, y, sr, 0, Math.PI * 2)
  c.strokeStyle = type.color
  c.lineWidth = 1.5
  c.stroke()

  // Inner gradient highlight
  const grad = c.createRadialGradient(x - sr * 0.3, y - sr * 0.3, sr * 0.1, x, y, sr)
  grad.addColorStop(0, 'rgba(255,255,255,0.15)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  c.beginPath()
  c.arc(x, y, sr, 0, Math.PI * 2)
  c.fillStyle = grad
  c.fill()

  // Symbol
  c.font = `bold ${Math.round(sr * 1.1)}px sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.shadowColor = type.glow
  c.shadowBlur = 8
  c.fillStyle = type.color
  c.fillText(type.symbol, x, y + 1)
  c.shadowBlur = 0

  c.restore()
}

function drawAimLine(c: CanvasRenderingContext2D) {
  const len = 120
  const endX = shooterX + Math.cos(aimAngle) * len
  const endY = shooterY - Math.sin(aimAngle) * len

  c.save()
  c.setLineDash([4, 6])
  c.strokeStyle = 'rgba(0,180,216,0.4)'
  c.lineWidth = 1.5
  c.shadowColor = 'rgba(0,180,216,0.3)'
  c.shadowBlur = 6
  c.beginPath()
  c.moveTo(shooterX, shooterY)
  c.lineTo(endX, endY)
  c.stroke()
  c.setLineDash([])
  c.shadowBlur = 0
  c.restore()
}

function drawShooter(c: CanvasRenderingContext2D) {
  // Cannon base
  c.save()
  c.translate(shooterX, shooterY)
  c.rotate(-aimAngle + Math.PI / 2)

  c.shadowColor = 'rgba(0,180,216,0.4)'
  c.shadowBlur = 8
  c.beginPath()
  c.moveTo(-8, 8)
  c.lineTo(0, -14)
  c.lineTo(8, 8)
  c.closePath()
  c.fillStyle = 'rgba(15,23,42,0.8)'
  c.fill()
  c.strokeStyle = 'rgba(0,180,216,0.6)'
  c.lineWidth = 1.5
  c.stroke()
  c.shadowBlur = 0

  c.restore()

  // Current bubble at shooter
  drawBubble(c, shooterX, shooterY, BUBBLE_R, currentType, 0.85)

  // Next bubble preview
  const nx = shooterX + 40
  const ny = shooterY + 4
  drawBubble(c, nx, ny, BUBBLE_R * 0.55, nextType, 0.7)

  c.save()
  c.font = '8px sans-serif'
  c.textAlign = 'center'
  c.fillStyle = 'rgba(255,255,255,0.35)'
  c.fillText('NEXT', nx, ny + 14)
  c.restore()
}

function drawScore(c: CanvasRenderingContext2D) {
  c.save()
  c.font = 'bold 13px sans-serif'
  c.textAlign = 'left'
  c.textBaseline = 'top'
  c.shadowColor = 'rgba(0,180,216,0.5)'
  c.shadowBlur = 6
  c.fillStyle = '#00B4D8'
  c.fillText(`Score: ${score}`, 8, 6)
  c.shadowBlur = 0
  c.restore()
}

function draw() {
  if (!ctx) return
  const c = ctx

  c.save()
  c.scale(dpr, dpr)
  c.clearRect(0, 0, CANVAS_W, CANVAS_H)

  // Grid bubbles
  for (const b of grid) {
    if (b.dropping) {
      drawBubble(c, b.x, b.y, BUBBLE_R, b.type, 0.9)
      continue
    }
    if (b.popping) {
      const progress = 1 - b.popTimer / 0.3
      const popScale = 1 + progress * 0.4
      const alpha = 1 - progress
      c.globalAlpha = alpha
      drawBubble(c, b.x, b.y, BUBBLE_R, b.type, popScale)
      c.globalAlpha = 1
      continue
    }
    drawBubble(c, b.x, b.y, BUBBLE_R, b.type)
  }

  // Projectile
  if (projectile) {
    drawBubble(c, projectile.x, projectile.y, BUBBLE_R, projectile.type)
  }

  // Particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    c.save()
    c.globalAlpha = alpha
    c.shadowColor = p.color
    c.shadowBlur = 6
    c.beginPath()
    c.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2)
    c.fillStyle = p.color
    c.fill()
    c.restore()
  }

  // Aim line + shooter
  if (!projectile && canShoot) {
    drawAimLine(c)
  }
  drawShooter(c)
  drawScore(c)

  c.restore()
}

// ─── Game Loop ──────────────────────────────────────────────────────────────

function gameLoop(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time
  update(dt)
  draw()
  animId = requestAnimationFrame(gameLoop)
}

// ─── Events ─────────────────────────────────────────────────────────────────

function getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left) * (CANVAS_W / rect.width),
    y: (clientY - rect.top) * (CANVAS_H / rect.height),
  }
}

function updateAim(cx: number, cy: number) {
  const pos = getCanvasPos(cx, cy)
  const dx = pos.x - shooterX
  const dy = shooterY - pos.y
  let angle = Math.atan2(dy, dx)
  angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle))
  aimAngle = angle
}

function onMouseMove(e: MouseEvent) {
  updateAim(e.clientX, e.clientY)
}

function onClick(e: MouseEvent) {
  updateAim(e.clientX, e.clientY)
  shoot()
}

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const t = e.touches[0]
  if (!t) return
  updateAim(t.clientX, t.clientY)
  shoot()
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  dpr = window.devicePixelRatio || 1
  canvas.width = CANVAS_W * dpr
  canvas.height = CANVAS_H * dpr
  canvas.style.width = `${CANVAS_W}px`
  canvas.style.height = `${CANVAS_H}px`

  ctx = canvas.getContext('2d')
  if (!ctx) return

  initGrid()
  lastTime = performance.now()
  animId = requestAnimationFrame(gameLoop)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="mk-bubble-canvas"
    @mousemove="onMouseMove"
    @click="onClick"
    @touchstart.passive="onTouchStart"
  />
</template>

<style scoped>
.mk-bubble-canvas {
  display: block;
  cursor: crosshair;
  border-radius: 8px;
  touch-action: none;
  max-width: 100%;
  height: auto;
}
</style>
