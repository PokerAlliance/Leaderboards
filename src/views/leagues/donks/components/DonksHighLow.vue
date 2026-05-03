<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Card {
  rank: number
  suit: string
  label: string
  color: string
}

const SUITS = [
  { symbol: '♠', color: '#1a1a2e' },
  { symbol: '♥', color: '#dc2626' },
  { symbol: '♦', color: '#dc2626' },
  { symbol: '♣', color: '#1a1a2e' },
]
const RANKS = [
  { rank: 2, label: '2' }, { rank: 3, label: '3' }, { rank: 4, label: '4' },
  { rank: 5, label: '5' }, { rank: 6, label: '6' }, { rank: 7, label: '7' },
  { rank: 8, label: '8' }, { rank: 9, label: '9' }, { rank: 10, label: '10' },
  { rank: 11, label: 'J' }, { rank: 12, label: 'Q' }, { rank: 13, label: 'K' },
  { rank: 14, label: 'A' },
]

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r.rank, suit: s.symbol, label: r.label, color: s.color })
    }
  }
  return deck
}

function shuffle(arr: Card[]): Card[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

type Phase = 'idle' | 'playing' | 'revealing' | 'result'

const deck = ref<Card[]>([])
const deckIndex = ref(0)
const currentCard = ref<Card | null>(null)
const nextCard = ref<Card | null>(null)
const phase = ref<Phase>('idle')
const streak = ref(0)
const bestStreak = ref(0)
const lastGuessCorrect = ref(true)
const isNewBest = ref(false)
const guessDirection = ref<'higher' | 'lower' | null>(null)

const BEST_STREAK_KEY = 'donks-highlow-best'

onMounted(() => {
  const saved = sessionStorage.getItem(BEST_STREAK_KEY)
  if (saved) bestStreak.value = parseInt(saved, 10) || 0
  startGame()
})

function dealTwo() {
  if (deckIndex.value >= deck.value.length - 2) {
    deck.value = shuffle(buildDeck())
    deckIndex.value = 0
  }
  currentCard.value = deck.value[deckIndex.value]!
  nextCard.value = deck.value[deckIndex.value + 1]!
  deckIndex.value += 2
}

function startGame() {
  deck.value = shuffle(buildDeck())
  deckIndex.value = 0
  streak.value = 0
  isNewBest.value = false
  lastGuessCorrect.value = true
  guessDirection.value = null
  dealTwo()
  phase.value = 'playing'
}

function guess(direction: 'higher' | 'lower') {
  if (phase.value !== 'playing' || !currentCard.value || !nextCard.value) return
  guessDirection.value = direction
  phase.value = 'revealing'

  setTimeout(() => {
    const curr = currentCard.value!.rank
    const next = nextCard.value!.rank
    const correct =
      next === curr ||
      (direction === 'higher' ? next > curr : next < curr)

    lastGuessCorrect.value = correct
    phase.value = 'result'

    if (correct) {
      streak.value++
      if (streak.value > bestStreak.value) {
        bestStreak.value = streak.value
        sessionStorage.setItem(BEST_STREAK_KEY, String(bestStreak.value))
        isNewBest.value = true
      }
      setTimeout(() => advance(), 600)
    } else {
      setTimeout(() => startGame(), 1400)
    }
  }, 500)
}

function advance() {
  if (deckIndex.value >= deck.value.length) {
    deck.value = shuffle(buildDeck())
    deckIndex.value = 0
  }
  currentCard.value = nextCard.value
  nextCard.value = deck.value[deckIndex.value]!
  deckIndex.value++
  guessDirection.value = null
  phase.value = 'playing'
}

const streakLabel = computed(() =>
  streak.value === 0 ? '' : `${streak.value}`
)
</script>

<template>
  <div class="hl">
    <div class="hl__streak-bar">
      <span class="hl__streak" :class="{ 'hl__streak--pop': streak > 0 }">
        Streak: <strong>{{ streakLabel || '0' }}</strong>
      </span>
      <span class="hl__best" :class="{ 'hl__best--glow': isNewBest }">
        <span class="i-heroicons-trophy-20-solid hl__trophy-icon" />
        {{ bestStreak }}
      </span>
    </div>

    <div class="hl__table">
      <!-- Current card -->
      <div class="hl__card-slot">
        <div
          v-if="currentCard"
          class="hl__card hl__card--current"
          :class="{ 'hl__card--exit': phase === 'result' && lastGuessCorrect }"
          :style="{ '--card-color': currentCard.color }"
        >
          <span class="hl__card-corner hl__card-corner--top">
            <span class="hl__card-rank">{{ currentCard.label }}</span>
            <span class="hl__card-suit">{{ currentCard.suit }}</span>
          </span>
          <span class="hl__card-center">{{ currentCard.suit }}</span>
          <span class="hl__card-corner hl__card-corner--bottom">
            <span class="hl__card-rank">{{ currentCard.label }}</span>
            <span class="hl__card-suit">{{ currentCard.suit }}</span>
          </span>
        </div>
      </div>

      <div class="hl__vs">vs</div>

      <!-- Next card (flipping) -->
      <div class="hl__card-slot">
        <div
          v-if="nextCard"
          class="hl__card-flip"
          :class="{ 'hl__card-flip--revealed': phase === 'revealing' || phase === 'result' }"
        >
          <div class="hl__card hl__card--back">
            <div class="hl__card-back-design">
              <span class="hl__card-back-suit">♠</span>
              <span class="hl__card-back-suit">♥</span>
              <span class="hl__card-back-suit">♦</span>
              <span class="hl__card-back-suit">♣</span>
            </div>
          </div>
          <div
            class="hl__card hl__card--front"
            :class="{
              'hl__card--correct': phase === 'result' && lastGuessCorrect,
              'hl__card--wrong': phase === 'result' && !lastGuessCorrect,
            }"
            :style="{ '--card-color': nextCard.color }"
          >
            <span class="hl__card-corner hl__card-corner--top">
              <span class="hl__card-rank">{{ nextCard.label }}</span>
              <span class="hl__card-suit">{{ nextCard.suit }}</span>
            </span>
            <span class="hl__card-center">{{ nextCard.suit }}</span>
            <span class="hl__card-corner hl__card-corner--bottom">
              <span class="hl__card-rank">{{ nextCard.label }}</span>
              <span class="hl__card-suit">{{ nextCard.suit }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="hl__actions">
      <button
        class="hl__btn hl__btn--lower"
        :disabled="phase !== 'playing'"
        @click="guess('lower')"
      >
        <span class="i-heroicons-chevron-down-20-solid" />
        Lower
      </button>
      <button
        class="hl__btn hl__btn--higher"
        :disabled="phase !== 'playing'"
        @click="guess('higher')"
      >
        <span class="i-heroicons-chevron-up-20-solid" />
        Higher
      </button>
    </div>

    <!-- Result flash -->
    <Transition name="hl-result">
      <div v-if="phase === 'result'" class="hl__result" :class="lastGuessCorrect ? 'hl__result--correct' : 'hl__result--wrong'">
        {{ lastGuessCorrect ? '✓' : '✗ Game Over' }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0 0;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  position: relative;
}

/* Streak bar */
.hl__streak-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.7);
  width: 100%;
}

.hl__streak {
  transition: transform 0.15s ease;
}

.hl__streak--pop {
  animation: streakPop 0.25s ease;
}

@keyframes streakPop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.hl__streak strong {
  color: #fff;
  font-size: 0.85rem;
}

.hl__best {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s;
}

.hl__trophy-icon {
  font-size: 0.8rem;
  color: #c9a227;
}

.hl__best--glow {
  color: #c9a227;
  text-shadow: 0 0 8px rgba(201, 162, 39, 0.5);
}

/* Card table */
.hl__table {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.hl__vs {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
}

.hl__card-slot {
  width: 80px;
  height: 112px;
  position: relative;
  perspective: 600px;
}

/* Card base */
.hl__card {
  position: absolute;
  inset: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 6px 5px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.hl__card--current {
  background: linear-gradient(145deg, #fffef8 0%, #f5f0e4 50%, #ebe4d4 100%);
  border: 1.5px solid rgba(201, 162, 39, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: cardSlideIn 0.3s ease-out;
}

.hl__card--exit {
  animation: cardSlideOut 0.35s ease-in forwards;
}

@keyframes cardSlideIn {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes cardSlideOut {
  to { transform: translateX(-40px) scale(0.9); opacity: 0; }
}

.hl__card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  align-self: flex-start;
}

.hl__card-corner--bottom {
  align-self: flex-end;
  transform: rotate(180deg);
}

.hl__card-rank {
  font-family: var(--font-display, Georgia, serif);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--card-color, #1a1a2e);
}

.hl__card-suit {
  font-size: 0.6rem;
  color: var(--card-color, #1a1a2e);
}

.hl__card-center {
  font-size: 1.6rem;
  color: var(--card-color, #1a1a2e);
  opacity: 0.25;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Card back */
.hl__card--back {
  background: linear-gradient(145deg, #1a3a5c 0%, #0d2240 60%, #091a33 100%);
  border: 1.5px solid rgba(201, 162, 39, 0.4);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  justify-content: center;
  padding: 0;
}

.hl__card-back-design {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 12px;
  opacity: 0.25;
}

.hl__card-back-suit {
  font-size: 1rem;
  color: #c9a227;
  text-align: center;
}

/* Card front (revealed) */
.hl__card--front {
  background: linear-gradient(145deg, #fffef8 0%, #f5f0e4 50%, #ebe4d4 100%);
  border: 1.5px solid rgba(201, 162, 39, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: rotateY(180deg);
}

.hl__card--correct {
  box-shadow: 0 0 20px rgba(22, 163, 74, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2);
  border-color: #16a34a;
}

.hl__card--wrong {
  box-shadow: 0 0 20px rgba(220, 38, 38, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2);
  border-color: #dc2626;
  animation: cardShake 0.4s ease;
}

@keyframes cardShake {
  0%, 100% { transform: rotateY(180deg) translateX(0); }
  20%, 60% { transform: rotateY(180deg) translateX(-4px); }
  40%, 80% { transform: rotateY(180deg) translateX(4px); }
}

/* Flip container */
.hl__card-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.45s ease;
}

.hl__card-flip--revealed {
  transform: rotateY(180deg);
}

/* Action buttons */
.hl__actions {
  display: flex;
  gap: 0.75rem;
}

.hl__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.5em 1.2em;
  border-radius: 999px;
  border: 1.5px solid;
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hl__btn:disabled {
  opacity: 0.35;
  pointer-events: none;
}

.hl__btn--higher {
  background: rgba(22, 163, 74, 0.12);
  border-color: rgba(22, 163, 74, 0.4);
  color: #4ade80;
}

.hl__btn--higher:hover:not(:disabled) {
  background: rgba(22, 163, 74, 0.25);
  transform: translateY(-1px);
}

.hl__btn--lower {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.4);
  color: #f87171;
}

.hl__btn--lower:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.25);
  transform: translateY(-1px);
}

/* Result flash */
.hl__result {
  position: absolute;
  bottom: -0.2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2em 0.8em;
  border-radius: 999px;
  pointer-events: none;
}

.hl__result--correct {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.15);
}

.hl__result--wrong {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.15);
}

.hl-result-enter-active { transition: all 0.2s ease; }
.hl-result-leave-active { transition: all 0.3s ease; }
.hl-result-enter-from { opacity: 0; transform: translateX(-50%) translateY(6px); }
.hl-result-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 500px) {
  .hl__card-slot {
    width: 65px;
    height: 92px;
  }

  .hl__card-rank { font-size: 0.75rem; }
  .hl__card-center { font-size: 1.3rem; }
  .hl__btn { font-size: 0.68rem; padding: 0.45em 1em; }
}
</style>
