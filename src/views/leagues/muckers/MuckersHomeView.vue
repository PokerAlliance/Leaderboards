<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  MUCKERS_POINTS_TABLE,
  MUCKERS_SCHEDULE,
  LEAGUE_DESCRIPTION,
  RULES_SUMMARY,
} from '@/config/muckers'

const pointsEntries = computed(() =>
  Object.entries(MUCKERS_POINTS_TABLE)
    .map(([pos, pts]) => ({ position: Number(pos), points: pts }))
    .sort((a, b) => a.position - b.position)
)

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const localSchedule = computed(() =>
  MUCKERS_SCHEDULE.map((slot) => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    const estHour = parseInt(slot.timeEST)
    const isPM = slot.timeEST.includes('PM')
    let h24 = isPM && estHour !== 12 ? estHour + 12 : estHour
    if (!isPM && estHour === 12) h24 = 0

    const probe = new Date()
    probe.setUTCFullYear(2026, 4, 7 + (slot.dayOfWeek - probe.getUTCDay() + 7) % 7)
    const estOffset = -5
    probe.setUTCHours(h24 - estOffset, 0, 0, 0)

    return {
      slot: slot.slot,
      dayLabel: slot.dayLabel,
      timeEST: slot.timeEST,
      localTime: fmt.format(probe),
    }
  })
)
</script>

<template>
  <main class="mk-home">
    <div class="mk-home__container">

      <!-- Hero -->
      <section class="mk-card mk-card--accent mk-home__hero">
        <div class="mk-home__hero-bg-text">SNG</div>
        <h1 class="mk-home__hero-title">
          <span class="mk-home__hero-title-accent">Barnyard</span>
          <span class="mk-home__hero-title-rule" />
          <span class="mk-home__hero-title-main">Muckers</span>
        </h1>
        <p class="mk-home__hero-desc">{{ LEAGUE_DESCRIPTION }}</p>

        <div class="mk-home__hero-meta">
          <span class="mk-badge mk-badge--cyan">9 Teams</span>
          <span class="mk-badge mk-badge--navy">SNG Format</span>
          <span class="mk-badge mk-badge--violet">Quarterly Seasons</span>
        </div>

        <div class="mk-home__hero-divider" />

        <div class="mk-home__hero-cta">
          <RouterLink to="/league/muckers/standings" class="mk-btn mk-btn--primary">
            View Standings
          </RouterLink>
          <RouterLink to="/league/muckers/players" class="mk-btn mk-btn--outline">
            Player Stats
          </RouterLink>
          <RouterLink to="/league/muckers/teams" class="mk-btn mk-btn--outline">
            Teams
          </RouterLink>
        </div>
      </section>

      <!-- How It Works -->
      <section class="mk-card mk-home__section">
        <h2 class="mk-section-title">How It Works</h2>
        <div class="mk-home__how-grid">
          <div class="mk-home__how-item">
            <div class="mk-home__how-icon">3</div>
            <h3 class="mk-home__how-label">Games Per Week</h3>
            <p class="mk-home__how-desc">Thursday, Friday &amp; Saturday tables run each week throughout the quarter.</p>
          </div>
          <div class="mk-home__how-item">
            <div class="mk-home__how-icon">1</div>
            <h3 class="mk-home__how-label">Player Per Team</h3>
            <p class="mk-home__how-desc">Each team fields one player per table. No player can play twice in the same week.</p>
          </div>
          <div class="mk-home__how-item">
            <div class="mk-home__how-icon">+</div>
            <h3 class="mk-home__how-label">Points Per Finish</h3>
            <p class="mk-home__how-desc">Points are awarded by finishing position. Team totals accumulate across the quarter.</p>
          </div>
        </div>
      </section>

      <!-- Scoring Table -->
      <section class="mk-card mk-home__section">
        <h2 class="mk-section-title">Scoring Table</h2>
        <div class="mk-home__scoring-grid">
          <div
            v-for="entry in pointsEntries"
            :key="entry.position"
            class="mk-home__scoring-cell"
            :class="{
              'mk-home__scoring-cell--gold': entry.position === 1,
              'mk-home__scoring-cell--silver': entry.position === 2,
              'mk-home__scoring-cell--bronze': entry.position === 3,
            }"
          >
            <span class="mk-home__scoring-pos">{{ ordinal(entry.position) }}</span>
            <span class="mk-home__scoring-pts">{{ entry.points }}</span>
            <span class="mk-home__scoring-label">pts</span>
          </div>
        </div>
        <p class="mk-home__scoring-note">
          Team's weekly total = sum of 3 players' scores. Quarterly champion = highest cumulative team total.
        </p>
      </section>

      <!-- Schedule -->
      <section class="mk-card mk-home__section">
        <h2 class="mk-section-title">Weekly Schedule</h2>
        <div class="mk-home__schedule">
          <div
            v-for="s in localSchedule"
            :key="s.slot"
            class="mk-home__schedule-row"
          >
            <div class="mk-home__schedule-slot">
              <span class="mk-home__schedule-slot-badge">{{ s.slot }}</span>
              Barnyard Muckers {{ s.slot }}
            </div>
            <div class="mk-home__schedule-day">{{ s.dayLabel }}</div>
            <div class="mk-home__schedule-time">
              <span class="mk-home__schedule-est">{{ s.timeEST }} EST</span>
              <span class="mk-home__schedule-local">{{ s.localTime }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Rules -->
      <section class="mk-card mk-home__section">
        <h2 class="mk-section-title">Rules</h2>
        <ul class="mk-home__rules">
          <li v-for="(rule, i) in RULES_SUMMARY" :key="i" class="mk-home__rules-item">
            <span class="mk-home__rules-marker" />
            {{ rule }}
          </li>
        </ul>
      </section>

      <!-- Footer -->
      <footer class="mk-home__footer">
        <RouterLink to="/" class="mk-btn mk-btn--outline mk-home__back">
          &larr; Back to Home
        </RouterLink>
      </footer>

    </div>
  </main>
</template>

<style scoped>
.mk-home {
  min-height: 100vh;
  padding: 2rem 1rem 4rem;
}

.mk-home__container {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Hero ──────────────────────────────────────── */

.mk-home__hero {
  position: relative;
  padding: 3rem 2.5rem;
  text-align: center;
  overflow: hidden;
}

.mk-home__hero-bg-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: rgba(0, 180, 216, 0.04);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.mk-home__hero-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
}

.mk-home__hero-title-accent {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-mk-cyan-dark);
}

.mk-home__hero-title-rule {
  display: block;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-mk-cyan), transparent);
  margin: 0.25rem 0;
}

.mk-home__hero-title-main {
  font-family: var(--font-display);
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--color-mk-navy);
  letter-spacing: 0.02em;
  line-height: 1.1;
}

.mk-home__hero-desc {
  max-width: 580px;
  margin: 0 auto 1.5rem;
  color: var(--color-mk-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.mk-home__hero-meta {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.mk-home__hero-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 5%, var(--color-mk-card-border) 50%, transparent 95%);
  margin-bottom: 1.5rem;
}

.mk-home__hero-cta {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ─── Sections (shared) ────────────────────────── */

.mk-home__section {
  padding: 2rem 2rem;
}

/* ─── How It Works ─────────────────────────────── */

.mk-home__how-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .mk-home__how-grid {
    grid-template-columns: 1fr;
  }
}

.mk-home__how-item {
  text-align: center;
  padding: 1rem;
}

.mk-home__how-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 180, 216, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%);
  border: 1.5px solid rgba(0, 180, 216, 0.2);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-mk-cyan-dark);
  margin-bottom: 0.75rem;
}

.mk-home__how-label {
  font-weight: 700;
  color: var(--color-mk-navy);
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
}

.mk-home__how-desc {
  font-size: 0.82rem;
  color: var(--color-mk-text-secondary);
  line-height: 1.5;
}

/* ─── Scoring Table ────────────────────────────── */

.mk-home__scoring-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .mk-home__scoring-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 380px) {
  .mk-home__scoring-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mk-home__scoring-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.75rem 0.5rem;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(100, 120, 160, 0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.mk-home__scoring-cell:hover {
  background: rgba(0, 180, 216, 0.06);
  border-color: rgba(0, 180, 216, 0.2);
}

.mk-home__scoring-cell--gold {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.25);
}

.mk-home__scoring-cell--silver {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.25);
}

.mk-home__scoring-cell--bronze {
  background: rgba(180, 83, 9, 0.08);
  border-color: rgba(180, 83, 9, 0.2);
}

.mk-home__scoring-pos {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-mk-text-muted);
}

.mk-home__scoring-pts {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-mk-navy);
  line-height: 1;
}

.mk-home__scoring-label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-mk-text-muted);
}

.mk-home__scoring-cell--gold .mk-home__scoring-pts {
  color: var(--color-mk-gold);
}

.mk-home__scoring-cell--silver .mk-home__scoring-pts {
  color: #64748B;
}

.mk-home__scoring-cell--bronze .mk-home__scoring-pts {
  color: #B45309;
}

.mk-home__scoring-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-mk-text-muted);
  font-style: italic;
}

/* ─── Schedule ─────────────────────────────────── */

.mk-home__schedule {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mk-home__schedule-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.5rem;
  align-items: center;
  padding: 0.85rem 1rem;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(100, 120, 160, 0.08);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mk-home__schedule-row:hover {
  background: rgba(0, 180, 216, 0.04);
  border-color: rgba(0, 180, 216, 0.15);
}

@media (max-width: 540px) {
  .mk-home__schedule-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }
}

.mk-home__schedule-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-mk-navy);
  font-size: 0.88rem;
}

.mk-home__schedule-slot-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--color-mk-cyan);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.mk-home__schedule-day {
  font-weight: 600;
  color: var(--color-mk-text-secondary);
  font-size: 0.85rem;
}

.mk-home__schedule-time {
  display: flex;
  flex-direction: column;
  text-align: right;
}

@media (max-width: 540px) {
  .mk-home__schedule-time {
    text-align: left;
  }
}

.mk-home__schedule-est {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-mk-navy);
}

.mk-home__schedule-local {
  font-size: 0.72rem;
  color: var(--color-mk-text-muted);
}

/* ─── Rules ────────────────────────────────────── */

.mk-home__rules {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.mk-home__rules-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.88rem;
  color: var(--color-mk-text);
  line-height: 1.5;
}

.mk-home__rules-marker {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-mk-cyan);
  margin-top: 0.45rem;
}

/* ─── Footer ───────────────────────────────────── */

.mk-home__footer {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

.mk-home__back {
  text-decoration: none;
}
</style>
