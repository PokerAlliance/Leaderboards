<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { MUCKERS_TEAMS } from '@/config/teams'
import MuckersBubbleShooter from './MuckersBubbleShooter.vue'

const store = useMuckersStore()

const MIN_ANIMATION_MS = 600
const SLOW_THRESHOLD_MS = 3000

const animationStarted = ref(0)
const animationFinished = ref(false)
const showSlowMessage = ref(false)
const showGame = ref(false)
let slowTimer: ReturnType<typeof setTimeout> | null = null
let gameTimer: ReturnType<typeof setTimeout> | null = null

const teamNames = computed(() => MUCKERS_TEAMS.map((t) => t.name))

const progressMessages = ['Calculating edges...', 'Reading the solver...', 'Analyzing ranges...']
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

watch(() => store.isLoading.value, (loading, wasLoading) => {
  if (loading && !wasLoading) {
    animationFinished.value = false
    startAnimation()
  }
  if (!loading && wasLoading) {
    finishAnimation()
  }
}, { immediate: true })

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
  <div class="mk-loading-gate">
    <Transition name="mk-gate-fade">
      <div v-if="shouldShowGate" class="mk-gate-overlay">
        <div class="mk-gate-bg" />

        <div class="mk-gate-content">
          <!-- Card fan with team names -->
          <div class="mk-gate-cards">
            <div
              v-for="(name, idx) in teamNames"
              :key="name"
              class="mk-gate-card"
              :style="{
                '--card-idx': idx,
                '--card-total': teamNames.length,
                '--card-delay': `${idx * 0.08}s`,
              }"
            >
              <div class="mk-gate-card__face">
                <span class="mk-gate-card__icon">&#9670;</span>
                <span class="mk-gate-card__name">{{ name }}</span>
                <span class="mk-gate-card__icon mk-gate-card__icon--bottom">&#9670;</span>
              </div>
            </div>
          </div>

          <div class="mk-gate-message">
            <Transition name="mk-msg-fade" mode="out-in">
              <span :key="currentMessage" class="mk-gate-message__text">
                {{ progressMessages[currentMessage] }}
              </span>
            </Transition>
          </div>

          <Transition name="mk-msg-fade">
            <p v-if="showSlowMessage" class="mk-gate-slow">
              Still loading... The first request may take a moment.
            </p>
          </Transition>

          <Transition name="mk-game-fade">
            <div v-if="showGame" class="mk-gate-game">
              <p class="mk-gate-game__prompt">Pop some bubbles...</p>
              <MuckersBubbleShooter />
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <div v-show="!shouldShowGate" class="mk-gate-slot">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.mk-loading-gate {
  position: relative;
  min-height: 100vh;
}

.mk-gate-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 3vh 0;
}

.mk-gate-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    #1B2A4A 0%,
    #152240 40%,
    #0F172A 70%,
    #0a0f1a 100%
  );
}

.mk-gate-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding-top: calc(64px + 1rem);
}

/* Card fan */
.mk-gate-cards {
  display: flex;
  justify-content: center;
  position: relative;
  height: 160px;
  width: 440px;
}

@keyframes mkDealCard {
  0% {
    opacity: 0;
    transform: translateX(80px) translateY(-40px) rotate(20deg) scale(0.7);
  }
  40% { opacity: 1; }
  100% {
    opacity: 1;
    transform: translateX(var(--spread-x)) translateY(0) rotate(var(--spread-rot)) scale(1);
  }
}

.mk-gate-card {
  position: absolute;
  width: 60px;
  height: 90px;
  perspective: 400px;
  --spread-x: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 46px);
  --spread-rot: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 4deg);
  animation: mkDealCard 0.5s ease-out forwards;
  animation-delay: var(--card-delay);
  opacity: 0;
}

.mk-gate-card__face {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1.5px solid rgba(0, 180, 216, 0.4);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 6px 4px;
  backdrop-filter: blur(8px);
}

.mk-gate-card__icon {
  font-size: 0.75rem;
  color: var(--color-mk-cyan, #00B4D8);
  opacity: 0.6;
  line-height: 1;
}

.mk-gate-card__icon--bottom {
  transform: rotate(180deg);
  color: var(--color-mk-violet, #7C3AED);
}

.mk-gate-card__name {
  font-family: var(--font-display);
  font-size: 0.45rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  line-height: 1.15;
}

/* Progress message */
.mk-gate-message {
  text-align: center;
  min-height: 2rem;
  display: flex;
  align-items: center;
}

.mk-gate-message__text {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.mk-gate-slow {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.mk-gate-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 216, 0.15);
  width: 100%;
  max-width: 380px;
}

.mk-gate-game__prompt {
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0;
}

.mk-gate-slot {
  min-height: 100vh;
}

/* Transitions */
.mk-gate-fade-enter-active { transition: opacity 0.3s ease; }
.mk-gate-fade-leave-active { transition: opacity 0.5s ease; }
.mk-gate-fade-enter-from,
.mk-gate-fade-leave-to { opacity: 0; }

.mk-msg-fade-enter-active,
.mk-msg-fade-leave-active { transition: opacity 0.25s ease; }
.mk-msg-fade-enter-from,
.mk-msg-fade-leave-to { opacity: 0; }

.mk-game-fade-enter-active { transition: all 0.5s ease; }
.mk-game-fade-leave-active { transition: all 0.3s ease; }
.mk-game-fade-enter-from { opacity: 0; transform: translateY(12px); }
.mk-game-fade-leave-to { opacity: 0; }

@media (max-width: 500px) {
  .mk-gate-cards {
    width: 300px;
    height: 130px;
  }
  .mk-gate-card {
    width: 46px;
    height: 72px;
    --spread-x: calc((var(--card-idx) - var(--card-total) / 2 + 0.5) * 32px);
  }
  .mk-gate-card__name { font-size: 0.38rem; }
}
</style>
