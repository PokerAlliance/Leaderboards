<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import type { DonksMilestoneEvent } from '@/types/donks'
import { getDonksCup, getMilestoneTier } from '@/config/donks'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'
import DonksMilestoneTrophy from './DonksMilestoneTrophy.vue'

const props = defineProps<{
  event: DonksMilestoneEvent | null
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  close: []
  viewStats: [username: string]
}>()

const tier = computed(() => (props.event ? getMilestoneTier(props.event.milestone) : null))
const cup = computed(() => (props.event?.cupSlug ? getDonksCup(props.event.cupSlug) : undefined))
const dateLabel = computed(() => (props.event ? format(props.event.date, 'MMMM d, yyyy') : ''))

const cardStyle = computed(() => tier.value
  ? {
      '--tier-light': tier.value.colors.light,
      '--tier-base': tier.value.colors.base,
      '--tier-dark': tier.value.colors.dark,
    }
  : {})

function celebrate() {
  if (!tier.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = [tier.value.colors.light, tier.value.colors.base, '#c9a227', '#ffffff']
  const shared = { colors, zIndex: 10001, disableForReducedMotion: true }
  confetti({ ...shared, particleCount: 90, spread: 75, startVelocity: 38, origin: { x: 0.5, y: 0.45 } })
  setTimeout(() => {
    confetti({ ...shared, particleCount: 45, angle: 60, spread: 55, origin: { x: 0.1, y: 0.7 } })
    confetti({ ...shared, particleCount: 45, angle: 120, spread: 55, origin: { x: 0.9, y: 0.7 } })
  }, 250)
}

watch(() => props.event, (ev, prev) => {
  if (ev && ev !== prev) setTimeout(celebrate, 200)
})

function onViewStats() {
  // The card is still clickable while its leave transition runs, after event is cleared
  if (props.event) emit('viewStats', props.event.username)
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.event) emit('close')
}
onMounted(() => document.addEventListener('keydown', onEscape))
onUnmounted(() => document.removeEventListener('keydown', onEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="ms-share">
      <div v-if="event && tier" class="ms-share" role="dialog" aria-modal="true" @click.self="emit('close')">
        <div class="ms-share__stage">
          <button type="button" class="ms-share__x" aria-label="Close" @click="emit('close')">
            <i class="i-lucide-x" />
          </button>

          <!-- ── Screenshot frame ─────────────────────────── -->
          <article class="ms-card" :style="cardStyle">
            <div class="ms-card__rays" />
            <div class="ms-card__frame" />
            <span class="ms-card__corner ms-card__corner--tl">♠</span>
            <span class="ms-card__corner ms-card__corner--tr">♥</span>
            <span class="ms-card__corner ms-card__corner--bl">♦</span>
            <span class="ms-card__corner ms-card__corner--br">♣</span>

            <header class="ms-card__head">
              <span class="ms-card__league">The Badonk's Donks</span>
              <span class="ms-card__ribbon">{{ tier.name }} Milestone</span>
            </header>

            <div class="ms-card__trophy">
              <DonksMilestoneTrophy :milestone="event.milestone" :size="200" plaque="♠ ♥ ♦ ♣" />
            </div>

            <div class="ms-card__count">{{ event.milestone.toLocaleString('en-US') }}</div>
            <div class="ms-card__unit">Games Played</div>

            <div class="ms-card__player">
              <PlayerAvatar class="ms-card__avatar" :src="getAvatar(event.username)" :username="event.username" :size="96" />
              <span class="ms-card__name">{{ event.username }}</span>
            </div>

            <div class="ms-card__meta">
              <span>Reached {{ dateLabel }}</span>
              <span v-if="cup" class="ms-card__cup" :style="{ '--cup-c': cup.color }">{{ cup.name }}</span>
            </div>

            <footer class="ms-card__foot">
              <span class="ms-card__foot-line" />
              <span>Congratulations from the Donks family</span>
              <span class="ms-card__foot-brand">♠ Poker Alliance ♠</span>
            </footer>
          </article>

          <!-- Controls stay outside the frame so screenshots are clean -->
          <div class="ms-share__actions">
            <button type="button" class="ms-share__btn ms-share__btn--ghost" @click="onViewStats">
              <i class="i-lucide-bar-chart-3" /> View player stats
            </button>
            <button type="button" class="ms-share__btn" @click="emit('close')">Close</button>
          </div>
          <p class="ms-share__hint">Screenshot the card to share it in the forums</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.ms-share {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(5, 12, 8, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow-y: auto;
}

.ms-share__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin: auto;
}

.ms-share__x {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 1.1rem;
}

.ms-share__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.ms-share__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #e4c95a, #c9a227);
  color: #1a1a2e;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.ms-share__btn--ghost {
  background: transparent;
  color: #f5f0e8;
  border: 1px solid rgba(228, 201, 90, 0.5);
}

.ms-share__hint {
  margin: 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
}

/* ── The card (4:5, typography scales with its width) ── */
.ms-card {
  --gold: #c9a227;
  --gold-light: #f3dc85;
  /* cqw can't size the container's own box, so padding derives from --card-w */
  --card-w: min(540px, calc(100vw - 32px), calc((100vh - 150px) * 0.8));
  position: relative;
  width: var(--card-w);
  aspect-ratio: 4 / 5;
  container-type: inline-size;
  overflow: hidden;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--card-w) * 0.1) calc(var(--card-w) * 0.07) calc(var(--card-w) * 0.08);
  text-align: center;
  color: #f5f0e8;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.08), transparent 60%),
    radial-gradient(ellipse at center, #1f6b3b 0%, #14472a 45%, #0b2a19 80%, #07170e 100%);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(228, 201, 90, 0.35),
    0 0 60px color-mix(in srgb, var(--tier-base) 35%, transparent);
}

.ms-card__frame {
  position: absolute;
  inset: 2.6cqw;
  border: 2px solid var(--gold);
  border-radius: 12px;
  pointer-events: none;
}

.ms-card__frame::after {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(228, 201, 90, 0.4);
  border-radius: 8px;
}

.ms-card__rays {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 160cqw;
  height: 160cqw;
  transform: translate(-50%, -50%);
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--tier-base) 22%, transparent) 0deg 7deg,
    transparent 7deg 18deg
  );
  mask-image: radial-gradient(circle, #000 0%, transparent 55%);
  -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 55%);
  animation: ms-rays 40s linear infinite;
  pointer-events: none;
}

@keyframes ms-rays {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.ms-card__corner {
  position: absolute;
  font-size: 5cqw;
  color: var(--gold);
  opacity: 0.55;
  line-height: 1;
}
.ms-card__corner--tl { top: 5cqw; left: 5.5cqw; }
.ms-card__corner--tr { top: 5cqw; right: 5.5cqw; color: #c9184a; }
.ms-card__corner--bl { bottom: 5cqw; left: 5.5cqw; color: #c9184a; }
.ms-card__corner--br { bottom: 5cqw; right: 5.5cqw; }

.ms-card > :not(.ms-card__rays):not(.ms-card__frame):not(.ms-card__corner) {
  position: relative;
  z-index: 1;
}

.ms-card__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2cqw;
}

.ms-card__league {
  font-family: var(--font-display);
  font-size: 3.4cqw;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--gold-light);
}

.ms-card__ribbon {
  position: relative;
  padding: 1.2cqw 5cqw;
  font-family: var(--font-display);
  font-size: 3.6cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #14141f;
  background: linear-gradient(90deg, var(--tier-dark), var(--tier-base) 25%, var(--tier-light) 50%, var(--tier-base) 75%, var(--tier-dark));
  clip-path: polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%);
}

.ms-card__trophy {
  width: 36cqw;
  margin-top: 1cqw;
}

.ms-card__trophy :deep(svg) {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 2cqw 4cqw rgba(0, 0, 0, 0.5)) drop-shadow(0 0 6cqw color-mix(in srgb, var(--tier-base) 45%, transparent));
}

.ms-card__count {
  font-family: var(--font-display);
  font-size: 19cqw;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, var(--tier-light) 10%, var(--tier-base) 55%, var(--tier-dark) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0.6cqw 0 rgba(0, 0, 0, 0.45));
}

.ms-card__unit {
  margin-top: -1cqw;
  font-family: var(--font-display);
  font-size: 4.2cqw;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.85);
}

.ms-card__player {
  display: flex;
  align-items: center;
  gap: 3cqw;
}

.ms-card__avatar {
  width: 13cqw !important;
  height: 13cqw !important;
  border-radius: 50%;
  object-fit: cover;
  border: 0.8cqw solid var(--tier-base);
  box-shadow: 0 0 0 0.5cqw rgba(0, 0, 0, 0.4), 0 0 4cqw color-mix(in srgb, var(--tier-base) 60%, transparent);
  background: #0b2a19;
}

.ms-card__name {
  font-family: var(--font-display);
  font-size: 7.4cqw;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0.5cqw 2cqw rgba(0, 0, 0, 0.5);
  max-width: 58cqw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-card__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5cqw 2.5cqw;
  font-size: 3.2cqw;
  color: rgba(245, 240, 232, 0.8);
}

.ms-card__cup {
  padding: 0.6cqw 2.4cqw;
  border-radius: 999px;
  font-weight: 600;
  color: #fff;
  background: color-mix(in srgb, var(--cup-c) 70%, #000);
  border: 1px solid color-mix(in srgb, var(--cup-c) 80%, #fff);
}

.ms-card__foot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2cqw;
  font-size: 3cqw;
  font-style: italic;
  color: rgba(245, 240, 232, 0.7);
}

.ms-card__foot-line {
  width: 14cqw;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.ms-card__foot-brand {
  font-style: normal;
  font-family: var(--font-display);
  font-size: 2.8cqw;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
}

/* ── Transition ──────────────────────────────────────── */
.ms-share-enter-active,
.ms-share-leave-active {
  transition: opacity 0.25s ease;
}
.ms-share-enter-active .ms-card {
  animation: ms-pop 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.ms-share-enter-from,
.ms-share-leave-to {
  opacity: 0;
}

@keyframes ms-pop {
  from { transform: scale(0.85) translateY(20px); opacity: 0; }
  to { transform: none; opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ms-card__rays { animation: none; }
  .ms-share-enter-active .ms-card { animation: none; }
}
</style>
