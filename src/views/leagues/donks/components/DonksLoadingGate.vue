<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDonksStore } from '@/composables/useDonksStore'
import { DONKS_CUPS, DONKS_MEDALS } from '@/config/donks'
import DonksHighLow from './DonksHighLow.vue'

const store = useDonksStore()

const MIN_ANIMATION_MS = 600
const SLOW_THRESHOLD_MS = 3000

const animationStarted = ref(0)
const animationFinished = ref(false)
const showSlowMessage = ref(false)
const showGame = ref(false)
let slowTimer: ReturnType<typeof setTimeout> | null = null
let gameTimer: ReturnType<typeof setTimeout> | null = null

const leaderboardNames = computed(() => [
  ...DONKS_CUPS.map((c) => c.shortName),
  ...DONKS_MEDALS.map((m) => m.shortName),
])

const progressMessages = ['Shuffling the deck...', 'Dealing the cards...', 'Reading the board...']
const currentMessage = ref(0)
let messageTimer: ReturnType<typeof setInterval> | null = null

const shouldShowGate = computed(() => {
  return store.isLoading.value && !animationFinished.value
})

function startAnimation() {
  animationStarted.value = Date.now()
  currentMessage.value = 0
  showSlowMessage.value = false
  showGame.value = false

  messageTimer = setInterval(() => {
    currentMessage.value = (currentMessage.value + 1) % progressMessages.length
  }, 900)

  slowTimer = setTimeout(() => {
    showSlowMessage.value = true
  }, SLOW_THRESHOLD_MS)

  gameTimer = setTimeout(() => {
    showGame.value = true
  }, 1000)
}

function finishAnimation() {
  const elapsed = Date.now() - animationStarted.value
  const remaining = Math.max(0, MIN_ANIMATION_MS - elapsed)

  setTimeout(() => {
    animationFinished.value = true
    cleanup()
  }, remaining)
}

function cleanup() {
  if (messageTimer) { clearInterval(messageTimer); messageTimer = null }
  if (slowTimer) { clearTimeout(slowTimer); slowTimer = null }
  if (gameTimer) { clearTimeout(gameTimer); gameTimer = null }
}

// Start animation when loading begins
watch(() => store.isLoading.value, (loading, wasLoading) => {
  if (loading && !wasLoading) {
    animationFinished.value = false
    startAnimation()
  }
  if (!loading && wasLoading) {
    finishAnimation()
  }
}, { immediate: true })

// If store already loaded by the time we mount, skip the gate
onMounted(() => {
  if (store.loadedQuarter.value && !store.isLoading.value) {
    animationFinished.value = true
  } else if (store.isLoading.value && animationStarted.value === 0) {
    startAnimation()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="loading-gate">
    <!-- Loading overlay -->
    <Transition name="gate-fade">
      <div v-if="shouldShowGate" class="gate-overlay">
        <div class="gate-felt" />

        <div class="gate-content">
          <!-- Card fan -->
          <div class="gate-cards">
            <div
              v-for="(name, idx) in leaderboardNames"
              :key="name"
              class="gate-card"
              :style="{
                '--card-idx': idx,
                '--card-total': leaderboardNames.length,
                '--card-delay': `${idx * 0.08}s`,
              }"
            >
              <div class="gate-card__face">
                <span class="gate-card__suit">{{ idx % 2 === 0 ? '♠' : '♦' }}</span>
                <span class="gate-card__name">{{ name }}</span>
                <span class="gate-card__suit gate-card__suit--bottom">{{ idx % 2 === 0 ? '♣' : '♥' }}</span>
              </div>
            </div>
          </div>

          <!-- Progress message -->
          <div class="gate-message">
            <Transition name="msg-fade" mode="out-in">
              <span :key="currentMessage" class="gate-message__text">
                {{ progressMessages[currentMessage] }}
              </span>
            </Transition>
          </div>

          <!-- Slow loading fallback -->
          <Transition name="msg-fade">
            <p v-if="showSlowMessage" class="gate-slow">
              Still loading... The first request may take a moment.
            </p>
          </Transition>

          <!-- Higher or Lower mini-game -->
          <Transition name="game-fade">
            <div v-if="showGame" class="gate-game">
              <p class="gate-game__prompt">While you wait...</p>
              <DonksHighLow />
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Actual content (always in DOM, hidden under overlay while loading) -->
    <div v-show="!shouldShowGate" class="gate-slot">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.loading-gate {
  position: relative;
  min-height: 100vh;
}

/* Overlay */
.gate-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 3vh 0;
}

.gate-felt {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    #1a5c32 0%,
    #14472a 40%,
    #0d3520 70%,
    #091f14 100%
  );
}

.gate-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: 2rem;
}

/* Card fan animation */
.gate-cards {
  display: flex;
  justify-content: center;
  position: relative;
  height: 160px;
  width: 400px;
}

@keyframes dealCard {
  0% {
    opacity: 0;
    transform:
      translateX(80px) translateY(-40px)
      rotate(20deg) scale(0.7);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform:
      translateX(calc(var(--spread-x)))
      translateY(0)
      rotate(var(--spread-rot))
      scale(1);
  }
}

.gate-card {
  position: absolute;
  width: 65px;
  height: 95px;
  perspective: 400px;
  --spread-x: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 48px);
  --spread-rot: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 4deg);
  animation: dealCard 0.5s ease-out forwards;
  animation-delay: var(--card-delay);
  opacity: 0;
}

.gate-card__face {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    145deg,
    #fffef8 0%,
    #f5f0e4 50%,
    #ebe4d4 100%
  );
  border: 1.5px solid rgba(201, 162, 39, 0.5);
  border-radius: 6px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  position: relative;
  overflow: hidden;
}

.gate-card__face::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(201, 162, 39, 0.25);
  border-radius: 4px;
  pointer-events: none;
}

.gate-card__suit {
  font-size: 0.9rem;
  color: var(--color-donks-gold-dark);
  opacity: 0.5;
  line-height: 1;
}

.gate-card__suit--bottom {
  transform: rotate(180deg);
  color: var(--color-donks-burgundy);
}

.gate-card__name {
  font-family: var(--font-display);
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-text, #1a1a2e);
  text-align: center;
  line-height: 1.15;
}

/* Progress message */
.gate-message {
  text-align: center;
  min-height: 2rem;
  display: flex;
  align-items: center;
}

.gate-message__text {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.gate-slow {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

/* Mini-game area */
.gate-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(201, 162, 39, 0.15);
  width: 100%;
  max-width: 340px;
}

.gate-game__prompt {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.game-fade-enter-active { transition: all 0.5s ease; }
.game-fade-leave-active { transition: all 0.3s ease; }
.game-fade-enter-from { opacity: 0; transform: translateY(12px); }
.game-fade-leave-to { opacity: 0; }

/* Slot content */
.gate-slot {
  min-height: 100vh;
}

/* Transitions */
.gate-fade-enter-active {
  transition: opacity 0.3s ease;
}

.gate-fade-leave-active {
  transition: opacity 0.5s ease;
}

.gate-fade-enter-from,
.gate-fade-leave-to {
  opacity: 0;
}

.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: opacity 0.25s ease;
}

.msg-fade-enter-from,
.msg-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 500px) {
  .gate-cards {
    width: 280px;
    height: 130px;
  }

  .gate-card {
    width: 50px;
    height: 75px;
    --spread-x: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 34px);
  }

  .gate-card__name {
    font-size: 0.45rem;
  }
}
</style>
