<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import confetti from 'canvas-confetti'
import type { DonksPlayoffLeaderboardEntry } from '@/types/donks'

const props = defineProps<{
  entries: DonksPlayoffLeaderboardEntry[]
  getAvatar: (username: string) => string
}>()

const first = computed(() => props.entries[0]!)
const second = computed(() => props.entries[1]!)
const third = computed(() => props.entries[2]!)

function formatPts(pts: number): string {
  return pts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let loopTimer: ReturnType<typeof setTimeout> | null = null

const CYCLE_MS = 4000

onMounted(() => {
  if (!canvasRef.value) return

  const fire = confetti.create(canvasRef.value, { resize: true, useWorker: true })

  const gold = '#c9a227'
  const silver = '#a8a8a8'
  const bronze = '#cd7f32'

  function burst() {
    fire({ particleCount: 60, spread: 55, origin: { y: 0.65, x: 0.5 }, colors: [gold, silver, bronze, '#e85d04', '#1a759f'], startVelocity: 30, gravity: 0.8, ticks: 120 })

    setTimeout(() => {
      fire({ particleCount: 35, angle: 60, spread: 50, origin: { x: 0.15, y: 0.7 }, colors: [gold, '#fff4c2', silver], startVelocity: 25, gravity: 0.9, ticks: 100 })
      fire({ particleCount: 35, angle: 120, spread: 50, origin: { x: 0.85, y: 0.7 }, colors: [gold, '#fff4c2', bronze], startVelocity: 25, gravity: 0.9, ticks: 100 })
    }, 500)

    setTimeout(() => {
      fire({ particleCount: 25, spread: 100, origin: { y: 0.55, x: 0.5 }, colors: [gold, silver, bronze], startVelocity: 18, gravity: 1, ticks: 80, scalar: 0.8 })
    }, 1000)
  }

  function loop() {
    burst()
    loopTimer = setTimeout(loop, CYCLE_MS)
  }

  // First cycle starts after the podium rise animation
  loopTimer = setTimeout(loop, 1600)
})

onBeforeUnmount(() => {
  if (loopTimer) clearTimeout(loopTimer)
})
</script>

<template>
  <div class="podium-stage">
    <div class="podium-stage__glow" />
    <canvas ref="canvasRef" class="podium-stage__canvas" />

    <div class="podium" aria-label="Playoff top 3 finishers">
      <!-- 2nd place — left -->
      <div class="podium__slot podium__slot--silver">
        <div class="podium__avatar-area podium__avatar-area--silver">
          <img :src="getAvatar(second.username)" :alt="second.username" class="podium__avatar podium__avatar--silver" />
        </div>
        <div class="podium__block podium__block--silver">
          <span class="podium__name">{{ second.username }}</span>
          <span class="podium__pts">{{ formatPts(second.totalPoints) }}</span>
          <span class="podium__medal podium__medal--silver">SILVER</span>
        </div>
      </div>

      <!-- 1st place — center -->
      <div class="podium__slot podium__slot--gold">
        <div class="podium__avatar-area podium__avatar-area--gold">
          <svg class="podium__crown" viewBox="0 0 24 24" fill="none"><path d="M2 18L4.5 7L8.5 12L12 4L15.5 12L19.5 7L22 18H2Z" fill="currentColor"/></svg>
          <img :src="getAvatar(first.username)" :alt="first.username" class="podium__avatar podium__avatar--gold" />
        </div>
        <div class="podium__block podium__block--gold">
          <div class="podium__shimmer" />
          <span class="podium__name podium__name--gold">{{ first.username }}</span>
          <span class="podium__pts podium__pts--gold">{{ formatPts(first.totalPoints) }}</span>
          <span class="podium__medal podium__medal--gold">GOLD</span>
        </div>
      </div>

      <!-- 3rd place — right -->
      <div class="podium__slot podium__slot--bronze">
        <div class="podium__avatar-area podium__avatar-area--bronze">
          <img :src="getAvatar(third.username)" :alt="third.username" class="podium__avatar podium__avatar--bronze" />
        </div>
        <div class="podium__block podium__block--bronze">
          <span class="podium__name">{{ third.username }}</span>
          <span class="podium__pts">{{ formatPts(third.totalPoints) }}</span>
          <span class="podium__medal podium__medal--bronze">BRONZE</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Stage Wrapper ─────────────────────────────────────── */

.podium-stage {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 1rem 0.5rem 1.5rem;
  margin: 0.5rem 0;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.97) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.6) 80%,
    transparent 100%
  );
}

/* ─── Pulsating Gold Glow ───────────────────────────────── */

.podium-stage__glow {
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(201, 162, 39, 0.18) 0%,
    rgba(201, 162, 39, 0.08) 35%,
    transparent 65%
  );
  animation: stageGlow 3.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes stageGlow {
  0%, 100% { opacity: 0.6; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
}

/* ─── Confetti Canvas ───────────────────────────────────── */

.podium-stage__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

/* ─── Container ─────────────────────────────────────────── */

.podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: 2.5rem 1rem 0.5rem;
  max-width: 520px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ─── Slot (column) ─────────────────────────────────────── */

.podium__slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 160px;
}

/* ─── Avatar Area ───────────────────────────────────────── */

.podium__avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: -14px;
  z-index: 2;
  position: relative;
}

.podium__avatar {
  border-radius: 50%;
  object-fit: cover;
  opacity: 0;
  animation: avatarReveal 0.4s ease forwards;
}

.podium__avatar--gold {
  width: 64px;
  height: 64px;
  box-shadow: 0 0 0 3px #c9a227, 0 0 18px rgba(201, 162, 39, 0.35);
  animation-delay: 0.9s;
}

.podium__avatar--silver {
  width: 48px;
  height: 48px;
  box-shadow: 0 0 0 3px #a8a8a8, 0 0 12px rgba(168, 168, 168, 0.25);
  animation-delay: 0.55s;
}

.podium__avatar--bronze {
  width: 48px;
  height: 48px;
  box-shadow: 0 0 0 3px #cd7f32, 0 0 12px rgba(205, 127, 50, 0.25);
  animation-delay: 1.2s;
}

/* ─── Crown ─────────────────────────────────────────────── */

.podium__crown {
  width: 28px;
  height: 28px;
  color: #c9a227;
  margin-bottom: 2px;
  opacity: 0;
  animation: crownDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.3s forwards;
  filter: drop-shadow(0 1px 4px rgba(201, 162, 39, 0.45));
}

/* ─── Blocks ────────────────────────────────────────────── */

.podium__block {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  border-radius: 10px 10px 4px 4px;
  padding: 1.6rem 0.5rem 0.7rem;
  position: relative;
  overflow: hidden;
  height: 0;
}

.podium__block--gold {
  background: linear-gradient(180deg, rgba(201, 162, 39, 0.18) 0%, rgba(201, 162, 39, 0.08) 100%);
  border: 1px solid rgba(201, 162, 39, 0.3);
  animation: podiumRise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
  --target-height: 180px;
}

.podium__block--silver {
  background: linear-gradient(180deg, rgba(168, 168, 168, 0.15) 0%, rgba(168, 168, 168, 0.06) 100%);
  border: 1px solid rgba(168, 168, 168, 0.25);
  animation: podiumRise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
  --target-height: 140px;
}

.podium__block--bronze {
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.15) 0%, rgba(205, 127, 50, 0.06) 100%);
  border: 1px solid rgba(205, 127, 50, 0.25);
  animation: podiumRise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards;
  --target-height: 110px;
}

/* ─── Block Content ─────────────────────────────────────── */

.podium__name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-donks-text);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.15rem;
}

.podium__name--gold {
  font-size: 0.88rem;
}

.podium__pts {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-donks-text-secondary);
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.5rem;
}

.podium__pts--gold {
  font-size: 0.8rem;
  color: #c9a227;
}

.podium__medal {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
}

.podium__medal--gold {
  background: rgba(201, 162, 39, 0.15);
  color: #b8941e;
  border: 1px solid rgba(201, 162, 39, 0.3);
}

.podium__medal--silver {
  background: rgba(168, 168, 168, 0.12);
  color: #777;
  border: 1px solid rgba(168, 168, 168, 0.25);
}

.podium__medal--bronze {
  background: rgba(205, 127, 50, 0.12);
  color: #a0632a;
  border: 1px solid rgba(205, 127, 50, 0.25);
}

/* ─── Shimmer ───────────────────────────────────────────── */

.podium__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 70%
  );
  animation: shimmer 0.8s ease 2s forwards;
  pointer-events: none;
}

/* ─── Keyframes ─────────────────────────────────────────── */

@keyframes podiumRise {
  from {
    height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
  }
  to {
    height: var(--target-height);
    padding-top: 1.6rem;
    padding-bottom: 0.7rem;
    opacity: 1;
  }
}

@keyframes avatarReveal {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes crownDrop {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.6);
  }
  70% {
    opacity: 1;
    transform: translateY(2px) scale(1.1);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shimmer {
  from {
    left: -60%;
  }
  to {
    left: 120%;
  }
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 600px) {
  .podium-stage {
    padding: 0.5rem 0.25rem 1rem;
    border-radius: 16px;
  }

  .podium {
    gap: 4px;
    padding: 2rem 0.5rem 0.5rem;
  }

  .podium__avatar--gold {
    width: 48px;
    height: 48px;
  }

  .podium__avatar--silver,
  .podium__avatar--bronze {
    width: 36px;
    height: 36px;
  }

  .podium__block--gold {
    --target-height: 140px;
  }

  .podium__block--silver {
    --target-height: 100px;
  }

  .podium__block--bronze {
    --target-height: 80px;
  }

  .podium__name {
    font-size: 0.68rem;
  }

  .podium__name--gold {
    font-size: 0.75rem;
  }

  .podium__pts {
    font-size: 0.64rem;
  }

  .podium__medal {
    font-size: 0.48rem;
    padding: 0.1rem 0.4rem;
  }

  .podium__crown {
    width: 22px;
    height: 22px;
  }
}
</style>
