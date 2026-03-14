<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import LeagueCard from '@/components/league/LeagueCard.vue'
  import { mockLeagues } from '@/mocks/dreamweaver-game'

  const isHeroVisible = ref(false)
  const isTitleAnimated = ref(false)
  const isSubtitleVisible = ref(false)
  const isSectionVisible = ref(false)

  onMounted(() => {
    setTimeout(() => {
      isHeroVisible.value = true
    }, 100)

    setTimeout(() => {
      isTitleAnimated.value = true
    }, 300)

    setTimeout(() => {
      isSubtitleVisible.value = true
    }, 800)

    setTimeout(() => {
      isSectionVisible.value = true
    }, 1000)
  })

  const titleWords = ['Poker', 'Alliance']
</script>

<template>
  <main class="home-view">
    <!-- Floating card suits background -->
    <div class="home-view__particles">
      <span class="particle particle--spade">♠</span>
      <span class="particle particle--heart">♥</span>
      <span class="particle particle--diamond">♦</span>
      <span class="particle particle--club">♣</span>
      <span class="particle particle--spade-2">♠</span>
      <span class="particle particle--heart-2">♥</span>
      <span class="particle particle--diamond-2">♦</span>
      <span class="particle particle--club-2">♣</span>
    </div>

    <!-- Hero section -->
    <section class="home-view__hero" :class="{ 'home-view__hero--visible': isHeroVisible }">
      <div class="home-view__logo">
        <span class="home-view__logo-icon">♠</span>
      </div>

      <h1 class="home-view__title">
        <span
          v-for="(word, idx) in titleWords"
          :key="word"
          class="home-view__title-word"
          :class="{ 'home-view__title-word--visible': isTitleAnimated }"
          :style="{ '--word-delay': `${idx * 0.2}s` }"
        >
          {{ word }}
        </span>
      </h1>

      <p
        class="home-view__subtitle"
        :class="{ 'home-view__subtitle--visible': isSubtitleVisible }"
      >
        Track scores across the best Replay Private Poker Leagues
      </p>

      <div
        class="home-view__hero-glow"
        :class="{ 'home-view__hero-glow--visible': isTitleAnimated }"
      />
    </section>

    <!-- Leagues section -->
    <section
      class="home-view__leagues"
      :class="{ 'home-view__leagues--visible': isSectionVisible }"
    >
      <div class="home-view__section-header">
        <h2 class="home-view__section-title">
          <span class="home-view__section-title-icon">♦</span>
          Our Leagues
          <span class="home-view__section-title-icon">♦</span>
        </h2>
        <p class="home-view__section-desc">Choose your battleground</p>
      </div>

      <div class="home-view__leagues-grid">
        <LeagueCard
          v-for="(league, index) in mockLeagues"
          :key="league.slug"
          :league="league"
          :index="index"
        />
      </div>
    </section>

    <!-- Footer accent -->
    <div class="home-view__footer">
      <div class="home-view__footer-line" />
      <span class="home-view__footer-suits">♠ ♥ ♦ ♣</span>
      <div class="home-view__footer-line" />
    </div>
  </main>
</template>

<style scoped>
  @keyframes float {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.1;
    }
    50% {
      transform: translateY(-20px) rotate(10deg);
      opacity: 0.2;
    }
  }

  @keyframes floatReverse {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.15;
    }
    50% {
      transform: translateY(20px) rotate(-10deg);
      opacity: 0.25;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes titleReveal {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
      filter: blur(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }

  @keyframes glowPulse {
    0%,
    100% {
      opacity: 0.3;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.5;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scaleX(0);
    }
    to {
      opacity: 1;
      transform: scaleX(1);
    }
  }

  .home-view {
    padding: var(--space-6);
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  /* Floating particles */
  .home-view__particles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    font-size: 3rem;
    opacity: 0.1;
    color: var(--color-gold);
  }

  .particle--spade {
    top: 10%;
    left: 5%;
    animation: float 8s ease-in-out infinite;
    animation-delay: 0s;
  }

  .particle--heart {
    top: 20%;
    right: 10%;
    animation: floatReverse 9s ease-in-out infinite;
    animation-delay: 1s;
    color: #ef4444;
  }

  .particle--diamond {
    bottom: 30%;
    left: 15%;
    animation: float 7s ease-in-out infinite;
    animation-delay: 2s;
    color: #ef4444;
  }

  .particle--club {
    bottom: 20%;
    right: 8%;
    animation: floatReverse 10s ease-in-out infinite;
    animation-delay: 0.5s;
  }

  .particle--spade-2 {
    top: 50%;
    left: 3%;
    animation: floatReverse 11s ease-in-out infinite;
    animation-delay: 3s;
    font-size: 2rem;
  }

  .particle--heart-2 {
    top: 60%;
    right: 5%;
    animation: float 8.5s ease-in-out infinite;
    animation-delay: 2.5s;
    font-size: 2rem;
    color: #ef4444;
  }

  .particle--diamond-2 {
    top: 5%;
    right: 25%;
    animation: floatReverse 9.5s ease-in-out infinite;
    animation-delay: 1.5s;
    font-size: 2.5rem;
    color: #ef4444;
  }

  .particle--club-2 {
    bottom: 10%;
    left: 25%;
    animation: float 7.5s ease-in-out infinite;
    animation-delay: 4s;
    font-size: 2.5rem;
  }

  /* Hero section */
  .home-view__hero {
    text-align: center;
    padding: var(--space-16) 0 var(--space-12);
    position: relative;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .home-view__hero--visible {
    opacity: 1;
  }

  .home-view__logo {
    margin-bottom: var(--space-4);
  }

  .home-view__logo-icon {
    font-size: 4rem;
    color: var(--color-gold);
    display: inline-block;
    animation: pulse 3s ease-in-out infinite;
    text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
  }

  .home-view__title {
    font-family: var(--font-display);
    font-size: var(--text-6xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
    margin: 0;
    display: flex;
    justify-content: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .home-view__title-word {
    display: inline-block;
    opacity: 0;
    text-shadow: 0 4px 20px rgba(212, 175, 55, 0.4);
  }

  .home-view__title-word--visible {
    animation: titleReveal 0.8s ease-out forwards;
    animation-delay: var(--word-delay, 0s);
  }

  .home-view__subtitle {
    font-size: var(--text-xl);
    color: var(--color-text-secondary);
    margin: var(--space-6) auto 0;
    max-width: 500px;
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;
  }

  .home-view__subtitle--visible {
    opacity: 1;
    transform: translateY(0);
  }

  .home-view__hero-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle,
      rgba(212, 175, 55, 0.15) 0%,
      transparent 70%
    );
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    pointer-events: none;
    z-index: -1;
    transition:
      opacity 1s ease,
      transform 1s ease;
  }

  .home-view__hero-glow--visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    animation: glowPulse 4s ease-in-out infinite;
    animation-delay: 1s;
  }

  /* Leagues section */
  .home-view__leagues {
    position: relative;
    z-index: 1;
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.6s ease,
      transform 0.6s ease;
  }

  .home-view__leagues--visible {
    opacity: 1;
    transform: translateY(0);
  }

  .home-view__section-header {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .home-view__section-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--color-text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
  }

  .home-view__section-title-icon {
    color: var(--color-gold);
    font-size: var(--text-xl);
    opacity: 0.6;
  }

  .home-view__section-desc {
    color: var(--color-text-muted);
    margin: var(--space-2) 0 0;
    font-size: var(--text-base);
  }

  .home-view__leagues-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: var(--space-5);
  }

  /* Footer accent */
  .home-view__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    margin-top: var(--space-16);
    padding: var(--space-8) 0;
    position: relative;
    z-index: 1;
  }

  .home-view__footer-line {
    height: 1px;
    width: 100px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(212, 175, 55, 0.4),
      transparent
    );
  }

  .home-view__footer-suits {
    color: var(--color-gold);
    font-size: var(--text-lg);
    opacity: 0.4;
    letter-spacing: 0.5em;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .home-view {
      padding: var(--space-4);
    }

    .home-view__hero {
      padding: var(--space-10) 0 var(--space-8);
    }

    .home-view__logo-icon {
      font-size: 3rem;
    }

    .home-view__title {
      font-size: var(--text-4xl);
      gap: var(--space-2);
    }

    .home-view__subtitle {
      font-size: var(--text-lg);
      padding: 0 var(--space-4);
    }

    .home-view__section-title {
      font-size: var(--text-2xl);
    }

    .home-view__leagues-grid {
      grid-template-columns: 1fr;
    }

    .particle {
      font-size: 2rem;
    }

    .particle--spade-2,
    .particle--heart-2,
    .particle--diamond-2,
    .particle--club-2 {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .home-view__title {
      font-size: var(--text-3xl);
      flex-direction: column;
      gap: 0;
    }

    .home-view__hero-glow {
      width: 250px;
      height: 250px;
    }
  }
</style>
