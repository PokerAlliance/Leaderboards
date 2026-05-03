<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getLeagueConfig } from '@/config/leagues'
import {
  LEAGUE_DESCRIPTION,
  HOW_TO_JOIN,
  CONTACT_LINKS,
} from '@/config/donks'
import DonksLeaderboardDiagram from './components/DonksLeaderboardDiagram.vue'
import DonksScheduleCalendar from './components/DonksScheduleCalendar.vue'

const leagueConfig = getLeagueConfig('donks')

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))
</script>

<template>
  <main class="donks-home theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />

    <div class="donks-home__container">
      <!-- Hero Card -->
      <section class="donks-hero donks-card">
        <div class="donks-hero__watermark">♠ ♥ ♦ ♣</div>

        <h1 class="donks-hero__title">
          <span class="donks-hero__title-accent">Badonk's</span>
          <span class="donks-hero__title-rule" />
          <span class="donks-hero__title-main">Donks League</span>
        </h1>

        <p class="donks-hero__description">{{ LEAGUE_DESCRIPTION }}</p>

        <div class="donks-hero__meta">
          <span class="donks-badge donks-badge--felt">
            <span>🏆</span> 8 Leaderboards
          </span>
          <span class="donks-badge donks-badge--burgundy">
            <span>📅</span> Quarterly Seasons
          </span>
        </div>

        <div class="donks-hero__divider" />

        <div class="donks-hero__cta-group">
          <RouterLink to="/league/donks/holdem" class="donks-btn donks-btn--primary donks-hero__cta">
            ♠ Hold'em Leaderboards
          </RouterLink>
          <RouterLink to="/league/donks/omaha" class="donks-btn donks-btn--primary donks-hero__cta">
            ♦ Omaha Leaderboards
          </RouterLink>
        </div>
      </section>

      <!-- Contact Row -->
      <div class="donks-home__contact-row donks-home__frosted">
        <p class="donks-home__join-text">{{ HOW_TO_JOIN }}</p>
        <div class="donks-home__contact-links">
          <a
            :href="CONTACT_LINKS.flashlight"
            target="_blank"
            rel="noopener"
            class="donks-btn donks-btn--outline"
          >
            Contact flashlight
          </a>
          <a
            :href="CONTACT_LINKS.naffy"
            target="_blank"
            rel="noopener"
            class="donks-btn donks-btn--outline"
          >
            Contact naffy
          </a>
        </div>
      </div>

      <!-- Leaderboard Structure Diagram -->
      <section class="donks-home__section">
        <div class="donks-card">
          <DonksLeaderboardDiagram />
        </div>
      </section>

      <!-- Schedule Calendar -->
      <section class="donks-home__section">
        <div class="donks-card">
          <DonksScheduleCalendar />
        </div>
      </section>

      <!-- Footer -->
      <footer class="donks-home__footer donks-home__frosted">
        <div class="donks-home__footer-divider" />
        <RouterLink to="/" class="donks-btn donks-btn--outline donks-home__back">
          ← Back to Home
        </RouterLink>
        <div class="donks-home__footer-suits">♠ ♥ ♦ ♣</div>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.donks-home {
  min-height: 100vh;
  position: relative;
}

.donks-home__container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6, 1.5rem);
  padding-top: var(--space-8, 2rem);
}

/* ─── Hero Card ────────────────────────────────────────────── */
.donks-hero {
  position: relative;
  text-align: center;
  padding: 2.5rem 2rem 2rem;
  border-top: 3px solid var(--color-donks-gold);
  overflow: hidden;
}

.donks-hero__watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8rem;
  letter-spacing: 0.3em;
  color: var(--color-donks-gold);
  opacity: 0.035;
  pointer-events: none;
  white-space: nowrap;
  font-weight: 700;
}

.donks-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.3em 1em;
  background: rgba(201, 162, 39, 0.08);
  border: 1px solid var(--color-donks-card-border);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-donks-text-secondary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
}

.donks-hero__badge-icon {
  color: var(--color-donks-gold);
  font-size: 0.9rem;
}

.donks-hero__title {
  font-family: var(--font-display);
  margin: 0 0 1.25rem;
  line-height: 1.15;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donks-hero__title-accent {
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-donks-gold-dark);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.donks-hero__title-rule {
  display: block;
  width: 50px;
  height: 2px;
  margin: 0.5rem 0;
  background: linear-gradient(90deg, transparent, var(--color-donks-gold), transparent);
  border-radius: 2px;
}

.donks-hero__title-main {
  display: block;
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: var(--color-donks-text);
  text-shadow: 0 2px 12px rgba(201, 162, 39, 0.15);
}

.donks-hero__description {
  max-width: 600px;
  margin: 0 auto 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-donks-text-secondary);
}

.donks-hero__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0;
}

.donks-hero__divider {
  width: 80px;
  height: 1px;
  margin: 1.5rem auto;
  background: linear-gradient(90deg, transparent, var(--color-donks-card-border), transparent);
}

/* CTA buttons */
.donks-hero__cta-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.donks-hero__cta {
  font-size: 1rem;
  padding: 0.85em 2em;
  box-shadow: 0 3px 16px rgba(201, 162, 39, 0.25);
}

.donks-hero__cta:hover {
  box-shadow: 0 5px 24px rgba(201, 162, 39, 0.4);
}

/* ─── Frosted backdrop for elements on the background ──── */
.donks-home__frosted {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 162, 39, 0.15);
  border-radius: 12px;
}

/* ─── Contact Row ──────────────────────────────────────── */
.donks-home__contact-row {
  text-align: center;
  padding: 1.25rem 1rem;
}

.donks-home__join-text {
  font-size: 0.8rem;
  color: var(--color-donks-text-secondary);
  margin-bottom: 0.6rem;
}

.donks-home__contact-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}

/* ─── Sections ──────────────────────────────────────────────── */
.donks-home__section {
  margin-bottom: 1.25rem;
}

/* ─── Footer ────────────────────────────────────────────────── */
.donks-home__footer {
  text-align: center;
  padding: 2rem 0 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.donks-home__footer-divider {
  width: 120px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-donks-card-border), transparent);
}

.donks-home__back {
  font-size: 0.82rem;
}

.donks-home__footer-suits {
  color: var(--color-donks-gold);
  font-size: 1rem;
  opacity: 0.55;
  letter-spacing: 0.5em;
}

/* ─── Responsive ────────────────────────────────────────────── */
@media (max-width: 640px) {
  .donks-home__container {
    padding: var(--space-4, 1rem);
    padding-top: var(--space-6, 1.5rem);
  }

  .donks-hero {
    padding: 2rem 1rem 1.5rem;
  }

  .donks-hero__title-accent {
    font-size: 1rem;
  }

  .donks-hero__cta-group {
    flex-direction: column;
    align-items: center;
  }

  .donks-hero__cta {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }

  .donks-hero__watermark {
    font-size: 4rem;
  }
}
</style>
