<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  MUCKERS_POINTS_TABLE,
  MUCKERS_SCHEDULE,
  LEAGUE_DESCRIPTION,
} from '@/config/muckers'

const pointsEntries = computed(() =>
  Object.entries(MUCKERS_POINTS_TABLE)
    .map(([pos, pts]) => ({ position: Number(pos), points: pts }))
    .sort((a, b) => a.position - b.position)
)

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th')
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

function podiumClass(pos: number): string {
  if (pos === 1) return 'mk-bp__pts-cell--gold'
  if (pos === 2) return 'mk-bp__pts-cell--silver'
  if (pos === 3) return 'mk-bp__pts-cell--bronze'
  return ''
}
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

      <!-- Schedule (moved here, right below hero) -->
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

      <!-- League Blueprint -->
      <section class="mk-card mk-home__section mk-bp">
        <h2 class="mk-section-title">League Blueprint</h2>

        <div class="mk-bp__flow">
          <!-- Stage 1: The Teams -->
          <div class="mk-bp__stage">
            <div class="mk-bp__stage-card">
              <h3 class="mk-bp__stage-heading">The Teams</h3>
              <p class="mk-bp__stage-text">
                9 teams compete, each with up to 6 members.
                Every week, teams select 3 different players &mdash; one for each table.
                No player may repeat in the same week.
              </p>
            </div>
          </div>

          <div class="mk-bp__connector">
            <span class="mk-bp__node" />
          </div>

          <!-- Stage 2: Weekly Tables -->
          <div class="mk-bp__stage">
            <div class="mk-bp__stage-card">
              <h3 class="mk-bp__stage-heading">Weekly Tables</h3>
              <div class="mk-bp__tables-grid">
                <div class="mk-bp__table-mini">
                  <span class="mk-bp__table-badge">A</span>
                  <span class="mk-bp__table-day">Thursday</span>
                  <span class="mk-bp__table-time">7:00 PM EST</span>
                </div>
                <div class="mk-bp__table-mini">
                  <span class="mk-bp__table-badge">B</span>
                  <span class="mk-bp__table-day">Friday</span>
                  <span class="mk-bp__table-time">10:00 AM EST</span>
                </div>
                <div class="mk-bp__table-mini">
                  <span class="mk-bp__table-badge">D</span>
                  <span class="mk-bp__table-day">Saturday</span>
                  <span class="mk-bp__table-time">1:00 PM EST</span>
                </div>
              </div>
              <p class="mk-bp__stage-note">1 player per team per table &middot; 9 players per game</p>
            </div>
          </div>

          <div class="mk-bp__connector">
            <span class="mk-bp__node" />
          </div>

          <!-- Stage 3: Scoring -->
          <div class="mk-bp__stage">
            <div class="mk-bp__stage-card">
              <h3 class="mk-bp__stage-heading">Points Per Finish</h3>
              <div class="mk-bp__pts-grid">
                <div
                  v-for="entry in pointsEntries"
                  :key="entry.position"
                  class="mk-bp__pts-cell"
                  :class="podiumClass(entry.position)"
                >
                  <span class="mk-bp__pts-pos">{{ ordinal(entry.position) }}</span>
                  <span class="mk-bp__pts-val">{{ entry.points }}</span>
                </div>
              </div>
              <p class="mk-bp__stage-note">Team weekly total = sum of 3 players' scores</p>
            </div>
          </div>

          <div class="mk-bp__connector">
            <span class="mk-bp__node" />
          </div>

          <!-- Stage 4: Champion -->
          <div class="mk-bp__stage">
            <div class="mk-bp__stage-card mk-bp__stage-card--champion">
              <h3 class="mk-bp__stage-heading">Quarterly Champion</h3>
              <p class="mk-bp__stage-text">
                Points stack across every week of the quarter.
                The team with the highest cumulative total at season end is crowned champion.
                Season resets at the start of each new quarter.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Founders Tribute -->
      <section class="mk-card mk-home__founders">
        <div class="mk-founders__ornament">&diams;</div>
        <span class="mk-founders__label">Founded by</span>
        <h3 class="mk-founders__name">John Danner</h3>
        <span class="mk-founders__handle">12beat22</span>
        <p class="mk-founders__tribute">From a simple idea to nine teams strong.</p>
        <div class="mk-founders__divider">
          <span>Co-Organizers</span>
        </div>
        <p class="mk-founders__co">Saratogatom &middot; Mystrygirl &middot; MCCats</p>
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

/* ─── League Blueprint ────────────────────────── */

.mk-bp {
  padding: 2rem 2rem 2.5rem;
}

.mk-bp__flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.mk-bp__connector {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2px;
  height: 32px;
  background: linear-gradient(
    to bottom,
    rgba(0, 180, 216, 0.15),
    rgba(0, 180, 216, 0.35)
  );
  position: relative;
}

.mk-bp__node {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-mk-cyan, #00B4D8);
  border: 2px solid #fff;
  box-shadow: 0 0 6px rgba(0, 180, 216, 0.3);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.mk-bp__stage {
  width: 100%;
}

.mk-bp__stage-card {
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(100, 120, 160, 0.12);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.2s ease;
}

.mk-bp__stage-card:hover {
  border-color: rgba(0, 180, 216, 0.2);
}

.mk-bp__stage-card--champion {
  border-bottom: 2px solid rgba(212, 175, 55, 0.35);
}

.mk-bp__stage-heading {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0 0 0.6rem;
}

.mk-bp__stage-text {
  font-size: 0.85rem;
  color: var(--color-mk-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.mk-bp__stage-note {
  font-size: 0.78rem;
  color: var(--color-mk-text-muted);
  text-align: center;
  margin: 0.75rem 0 0;
  font-style: italic;
}

/* Blueprint: Tables Grid */

.mk-bp__tables-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 540px) {
  .mk-bp__tables-grid {
    grid-template-columns: 1fr;
  }
}

.mk-bp__table-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.75rem 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 180, 216, 0.15);
  border-radius: 10px;
  transition: border-color 0.2s ease;
}

.mk-bp__table-mini:hover {
  border-color: rgba(0, 180, 216, 0.35);
}

.mk-bp__table-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-mk-cyan, #00B4D8);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
}

.mk-bp__table-day {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-mk-navy, #1B2A4A);
}

.mk-bp__table-time {
  font-size: 0.7rem;
  color: var(--color-mk-text-muted);
  font-weight: 600;
}

/* Blueprint: Points Grid */

.mk-bp__pts-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0.35rem;
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .mk-bp__pts-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 380px) {
  .mk-bp__pts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.mk-bp__pts-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.55rem 0.25rem;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid rgba(100, 120, 160, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mk-bp__pts-cell:hover {
  background: rgba(0, 180, 216, 0.06);
  border-color: rgba(0, 180, 216, 0.2);
}

.mk-bp__pts-cell--gold {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.25);
}

.mk-bp__pts-cell--silver {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.25);
}

.mk-bp__pts-cell--bronze {
  background: rgba(180, 83, 9, 0.08);
  border-color: rgba(180, 83, 9, 0.2);
}

.mk-bp__pts-pos {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-mk-text-muted);
}

.mk-bp__pts-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  line-height: 1;
}

.mk-bp__pts-cell--gold .mk-bp__pts-val {
  color: var(--color-mk-gold, #D4AF37);
}

.mk-bp__pts-cell--silver .mk-bp__pts-val {
  color: #64748B;
}

.mk-bp__pts-cell--bronze .mk-bp__pts-val {
  color: #B45309;
}

/* ─── Founders Tribute ─────────────────────────── */

.mk-home__founders {
  text-align: center;
  padding: 2.5rem 2rem;
  max-width: 520px;
  margin: 0 auto;
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent 15%, rgba(212, 175, 55, 0.4) 50%, transparent 85%) 1;
}

.mk-founders__ornament {
  font-size: 1rem;
  color: rgba(212, 175, 55, 0.5);
  margin-bottom: 0.75rem;
  letter-spacing: 0.5em;
}

.mk-founders__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-mk-text-muted);
  margin-bottom: 0.25rem;
}

.mk-founders__name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0 0 0.15rem;
}

.mk-founders__handle {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-mk-cyan, #00B4D8);
  font-style: italic;
  margin-bottom: 0.75rem;
}

.mk-founders__tribute {
  font-size: 0.88rem;
  color: var(--color-mk-text-secondary);
  line-height: 1.5;
  font-style: italic;
  margin: 0 0 1.25rem;
}

.mk-founders__divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.mk-founders__divider::before,
.mk-founders__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(212, 175, 55, 0.2);
}

.mk-founders__divider span {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-mk-text-muted);
  white-space: nowrap;
}

.mk-founders__co {
  font-size: 0.82rem;
  color: var(--color-mk-text-secondary);
  margin: 0;
  letter-spacing: 0.02em;
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
