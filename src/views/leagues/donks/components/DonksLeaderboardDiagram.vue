<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DONKS_CUPS, DONKS_MEDALS } from '@/config/donks'
import type { DonksCupConfig, DonksMedalConfig } from '@/types/donks'
import { computed } from 'vue'

const holdemCups = computed(() => DONKS_CUPS.filter((c) => c.gameType === 'holdem'))
const omahaCups = computed(() => DONKS_CUPS.filter((c) => c.gameType === 'omaha'))

const holdemMedal = computed(() => DONKS_MEDALS.find((m) => m.gameType === 'holdem')!)
const omahaMedal = computed(() => DONKS_MEDALS.find((m) => m.gameType === 'omaha')!)

const dayLabel: Record<string, string> = {
  monday: 'Mon',
  wednesday: 'Wed',
  sunday: 'Sun',
}

function getDayLabel(cup: DonksCupConfig) {
  return dayLabel[cup.day] || cup.day
}

function getMedalRoute(medal: DonksMedalConfig) {
  return medal.gameType === 'holdem' ? '/league/donks/holdem' : '/league/donks/omaha'
}
</script>

<template>
  <div class="diagram">
    <h3 class="diagram__title">
      <span class="diagram__title-icon">♠</span>
      Leaderboard Structure
      <span class="diagram__title-icon">♦</span>
    </h3>
    <p class="diagram__subtitle">6 weekly cups feed into 8 ranked leaderboards. Top 9 scores counted per player.</p>

    <!-- Hold'em Group -->
    <div class="diagram__group">
      <div class="diagram__group-label diagram__group-label--holdem">NL Hold'em</div>

      <div class="diagram__row">
        <!-- Cups Column -->
        <div class="diagram__cups">
          <RouterLink
            v-for="cup in holdemCups"
            :key="cup.slug"
            :to="`/league/donks/cup/${cup.slug}`"
            class="diagram__cup-node"
            :style="{ '--cup-color': cup.color }"
          >
            <span class="diagram__cup-dot" />
            <div class="diagram__cup-info">
              <span class="diagram__cup-name">{{ cup.name }}</span>
              <span class="diagram__cup-schedule">{{ getDayLabel(cup) }} · {{ cup.timeET }} ET</span>
            </div>
          </RouterLink>
        </div>

        <!-- Connectors -->
        <div class="diagram__connectors">
          <div v-for="cup in holdemCups" :key="cup.slug" class="diagram__connector-line" :style="{ '--cup-color': cup.color }" />
        </div>

        <!-- Medal -->
        <RouterLink :to="getMedalRoute(holdemMedal)" class="diagram__medal-node">
          <span class="diagram__medal-icon">🏅</span>
          <span class="diagram__medal-name">{{ holdemMedal.name }}</span>
          <span class="diagram__medal-sub">Best 9 from 4 cups</span>
          <span class="diagram__medal-hint">View Leaderboard →</span>
        </RouterLink>
      </div>
    </div>

    <!-- Divider -->
    <div class="diagram__divider" />

    <!-- Omaha Group -->
    <div class="diagram__group">
      <div class="diagram__group-label diagram__group-label--omaha">PL Omaha Hi/Lo</div>

      <div class="diagram__row">
        <div class="diagram__cups">
          <RouterLink
            v-for="cup in omahaCups"
            :key="cup.slug"
            :to="`/league/donks/cup/${cup.slug}`"
            class="diagram__cup-node"
            :style="{ '--cup-color': cup.color }"
          >
            <span class="diagram__cup-dot" />
            <div class="diagram__cup-info">
              <span class="diagram__cup-name">{{ cup.name }}</span>
              <span class="diagram__cup-schedule">{{ getDayLabel(cup) }} · {{ cup.timeET }} ET</span>
            </div>
          </RouterLink>
        </div>

        <div class="diagram__connectors diagram__connectors--omaha">
          <div v-for="cup in omahaCups" :key="cup.slug" class="diagram__connector-line" :style="{ '--cup-color': cup.color }" />
        </div>

        <RouterLink :to="getMedalRoute(omahaMedal)" class="diagram__medal-node">
          <span class="diagram__medal-icon">🏅</span>
          <span class="diagram__medal-name">{{ omahaMedal.name }}</span>
          <span class="diagram__medal-sub">Best 9 from 2 cups</span>
          <span class="diagram__medal-hint">View Leaderboard →</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagram {
  padding: 2rem;
}

.diagram__title {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-donks-gold-dark);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.diagram__title-icon {
  color: var(--color-donks-gold);
  font-size: 1rem;
  opacity: 0.6;
}

.diagram__subtitle {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-donks-text-secondary);
  margin-bottom: 2rem;
}

/* Group */
.diagram__group {
  margin-bottom: 1.5rem;
}

.diagram__group-label {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-donks-text-secondary);
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-donks-gold);
}

.diagram__group-label--omaha {
  border-left-color: var(--color-donks-felt);
}

/* Row layout */
.diagram__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
}

/* Cup nodes */
.diagram__cups {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.diagram__cup-node {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.85rem;
  padding-right: 1.6rem;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 3px solid var(--cup-color, #999);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-donks-text);
  transition: all 0.25s ease;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  position: relative;
}

.diagram__cup-node::after {
  content: '›';
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cup-color, #999);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.diagram__cup-node:hover {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(3px);
  border-left-width: 4px;
}

.diagram__cup-node:hover::after {
  opacity: 0.8;
  transform: translateY(-50%) translateX(2px);
}

.diagram__cup-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cup-color, #999);
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--cup-color, #999) 50%, transparent);
}

.diagram__cup-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.diagram__cup-name {
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diagram__cup-schedule {
  font-size: 0.68rem;
  color: var(--color-donks-text-muted);
}

/* Connector lines */
.diagram__connectors {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 60px;
  position: relative;
}

.diagram__connector-line {
  width: 100%;
  height: 2.5px;
  position: relative;
  margin: 0.75rem 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--cup-color, #ccc) 30%,
    var(--color-donks-gold) 70%,
    transparent 100%
  );
  background-size: 60px 2.5px;
  animation: flowRight 2.5s linear infinite;
  opacity: 0.7;
}

.diagram__connector-line::after {
  content: '';
  position: absolute;
  right: -3px;
  top: -3.5px;
  width: 9px;
  height: 9px;
  border-right: 2.5px solid var(--color-donks-gold);
  border-bottom: 2.5px solid var(--color-donks-gold);
  transform: rotate(-45deg);
  opacity: 0.8;
}

@keyframes flowRight {
  0% { background-position: -60px 0; }
  100% { background-position: 60px 0; }
}

/* Medal nodes */
.diagram__medal-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.4rem 1.2rem 1rem;
  background: linear-gradient(
    145deg,
    rgba(201, 162, 39, 0.12) 0%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(201, 162, 39, 0.08) 100%
  );
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(201, 162, 39, 0.4);
  border-top: 3px solid var(--color-donks-gold);
  border-radius: 14px;
  text-decoration: none;
  color: var(--color-donks-text);
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  text-align: center;
  min-height: 120px;
  animation: medalGlow 3s ease-in-out infinite;
}

@keyframes medalGlow {
  0%, 100% { border-color: rgba(201, 162, 39, 0.4); }
  50% { border-color: rgba(201, 162, 39, 0.7); }
}

.diagram__medal-node:hover {
  box-shadow: 0 6px 28px rgba(201, 162, 39, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  animation: none;
  border-color: var(--color-donks-gold);
}

.diagram__medal-icon {
  font-size: 2.2rem;
  margin-bottom: 0.3rem;
  filter: drop-shadow(0 2px 4px rgba(201, 162, 39, 0.3));
}

.diagram__medal-name {
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-gold-dark);
}

.diagram__medal-sub {
  font-size: 0.65rem;
  color: var(--color-donks-text-muted);
  margin-top: 0.15rem;
}

.diagram__medal-hint {
  font-size: 0.58rem;
  color: var(--color-donks-gold);
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.diagram__medal-node:hover .diagram__medal-hint {
  opacity: 0.8;
}

/* Divider */
.diagram__divider {
  height: 1px;
  margin: 1.5rem 2rem;
  background: linear-gradient(90deg, transparent, var(--color-donks-card-border), transparent);
}

/* Responsive */
@media (max-width: 700px) {
  .diagram__row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .diagram__connectors {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    gap: 0.5rem;
    height: auto;
  }

  .diagram__connector-line {
    width: 40px;
    height: 2.5px;
    margin: 0;
  }

  .diagram__connectors--omaha .diagram__connector-line {
    width: 40px;
  }

  .diagram__medal-node {
    min-height: auto;
    padding: 0.85rem;
  }

  .diagram__cup-node {
    padding: 0.45rem 0.65rem;
    padding-right: 1.4rem;
  }

  .diagram__cup-name {
    font-size: 0.75rem;
  }
}
</style>
