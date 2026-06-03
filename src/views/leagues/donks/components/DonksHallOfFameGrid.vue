<script setup lang="ts">
import type { DonksHallOfFameEntry } from '@/types/donks'

const props = defineProps<{
  entries: DonksHallOfFameEntry[]
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const TROPHY_DEFS = [
  { key: 'goldenCrowns', icon: 'i-lucide-crown', color: '#c9a227', label: 'Golden Crown' },
  { key: 'silverCrowns', icon: 'i-lucide-crown', color: '#a8a8a8', label: 'Silver Crown' },
  { key: 'bronzeCrowns', icon: 'i-lucide-crown', color: '#cd7f32', label: 'Bronze Crown' },
  { key: 'annualChampionship', icon: 'i-lucide-gem', color: '#2563eb', label: 'Annual Championship Ring' },
  { key: 'tournamentOfChampions', icon: 'i-lucide-award', color: '#7c3aed', label: 'Tournament of Champions' },
  { key: 'allDonksInPlayoffs', icon: 'i-lucide-swords', color: '#c9a227', label: 'Playoffs Bracelet' },
  { key: 'omaha', icon: 'i-lucide-clover', color: '#2d6a4f', label: 'Omaha Championship' },
] as const

function totalAwards(e: DonksHallOfFameEntry): number {
  return e.goldenCrowns + e.silverCrowns + e.bronzeCrowns
    + e.annualChampionship + e.tournamentOfChampions
    + e.allDonksInPlayoffs + e.omaha
}

function trophies(e: DonksHallOfFameEntry) {
  return TROPHY_DEFS
    .map((def) => ({ ...def, count: (e as any)[def.key] as number }))
    .filter((t) => t.count > 0)
}

function podiumClass(rank: number): string {
  if (rank === 1) return 'hof-card--gold'
  if (rank === 2) return 'hof-card--silver'
  if (rank === 3) return 'hof-card--bronze'
  return ''
}
</script>

<template>
  <div class="hof-grid">
    <div v-if="entries.length === 0" class="hof-grid__empty">
      No Hall of Fame data available yet.
    </div>

    <div
      v-for="(entry, idx) in entries"
      :key="entry.username"
      class="hof-card"
      :class="podiumClass(idx + 1)"
      :style="{ '--card-i': idx }"
      @click="emit('row-click', entry.username)"
    >
      <div class="hof-card__glow" />

      <!-- Rank badge -->
      <span class="hof-card__rank">#{{ idx + 1 }}</span>

      <!-- Avatar -->
      <img
        :src="getAvatar(entry.username)"
        :alt="entry.username"
        class="hof-card__avatar"
        loading="lazy"
      />

      <!-- Username -->
      <span class="hof-card__name">{{ entry.username }}</span>

      <!-- Trophies -->
      <div class="hof-card__trophies">
        <span
          v-for="t in trophies(entry)"
          :key="t.key"
          class="hof-card__trophy"
          :title="t.label"
        >
          <i :class="t.icon" class="hof-card__trophy-icon" :style="{ color: t.color }" />
          <span class="hof-card__trophy-count">{{ t.count }}</span>
        </span>
      </div>

      <!-- Total awards -->
      <span class="hof-card__total">{{ totalAwards(entry) }} award{{ totalAwards(entry) === 1 ? '' : 's' }}</span>
    </div>
  </div>
</template>

<style scoped>
.hof-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 0.85rem;
}

.hof-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-donks-text-muted);
  font-size: 0.85rem;
}

/* ─── Card ──────────────────────────────────────────────── */

.hof-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.2rem 0.75rem 0.9rem;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.85));
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: hofCardIn 0.35s ease both;
  animation-delay: calc(var(--card-i, 0) * 0.04s);
}

.hof-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.hof-card__glow {
  position: absolute;
  inset: -1px;
  border-radius: 14px;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: linear-gradient(
    135deg,
    rgba(201, 162, 39, 0.15),
    rgba(168, 168, 168, 0.1),
    rgba(201, 162, 39, 0.1)
  );
  background-size: 200% 200%;
  animation: hofGradientShift 4s ease infinite;
}

.hof-card:hover .hof-card__glow {
  opacity: 1;
}

/* Podium Cards */
.hof-card--gold {
  border-color: rgba(201, 162, 39, 0.35);
  background: linear-gradient(
    145deg,
    rgba(201, 162, 39, 0.08) 0%,
    var(--color-donks-card-bg, rgba(255, 255, 255, 0.9)) 50%,
    rgba(201, 162, 39, 0.06) 100%
  );
}

.hof-card--gold .hof-card__glow {
  opacity: 0.5;
  background: linear-gradient(
    135deg,
    rgba(201, 162, 39, 0.2),
    rgba(255, 215, 0, 0.1),
    rgba(201, 162, 39, 0.15)
  );
  background-size: 200% 200%;
  animation: hofGradientShift 3s ease infinite;
}

.hof-card--silver {
  border-color: rgba(168, 168, 168, 0.35);
  background: linear-gradient(
    145deg,
    rgba(168, 168, 168, 0.08) 0%,
    var(--color-donks-card-bg, rgba(255, 255, 255, 0.9)) 50%,
    rgba(168, 168, 168, 0.06) 100%
  );
}

.hof-card--silver .hof-card__glow {
  opacity: 0.4;
  background: linear-gradient(
    135deg,
    rgba(168, 168, 168, 0.2),
    rgba(192, 192, 192, 0.1),
    rgba(168, 168, 168, 0.15)
  );
  background-size: 200% 200%;
  animation: hofGradientShift 3.5s ease infinite;
}

.hof-card--bronze {
  border-color: rgba(205, 127, 50, 0.3);
  background: linear-gradient(
    145deg,
    rgba(205, 127, 50, 0.07) 0%,
    var(--color-donks-card-bg, rgba(255, 255, 255, 0.9)) 50%,
    rgba(205, 127, 50, 0.05) 100%
  );
}

.hof-card--bronze .hof-card__glow {
  opacity: 0.35;
  background: linear-gradient(
    135deg,
    rgba(205, 127, 50, 0.2),
    rgba(218, 165, 32, 0.1),
    rgba(205, 127, 50, 0.15)
  );
  background-size: 200% 200%;
  animation: hofGradientShift 3.8s ease infinite;
}

/* ─── Card internals ───────────────────────────────────── */

.hof-card__rank {
  position: absolute;
  top: 0.5rem;
  left: 0.6rem;
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--color-donks-text-muted);
  z-index: 1;
}

.hof-card--gold .hof-card__rank {
  color: #c9a227;
}

.hof-card--silver .hof-card__rank {
  color: #a8a8a8;
}

.hof-card--bronze .hof-card__rank {
  color: #cd7f32;
}

.hof-card__avatar {
  position: relative;
  z-index: 1;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(201, 162, 39, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.hof-card:hover .hof-card__avatar {
  transform: scale(1.05);
}

.hof-card--gold .hof-card__avatar {
  border-color: rgba(201, 162, 39, 0.5);
  box-shadow: 0 2px 12px rgba(201, 162, 39, 0.2);
}

.hof-card__name {
  position: relative;
  z-index: 1;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-donks-text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.hof-card__trophies {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0.15rem 0;
}

.hof-card__trophy {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  cursor: default;
  position: relative;
}

.hof-card__trophy-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.hof-card__trophy:hover .hof-card__trophy-icon {
  transform: scale(1.25);
}

.hof-card__trophy-count {
  font-size: 0.58rem;
  font-weight: 700;
  color: var(--color-donks-text-secondary);
}

.hof-card__total {
  position: relative;
  z-index: 1;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-donks-gold, #c9a227);
  margin-top: 0.1rem;
}

/* ─── Animations ───────────────────────────────────────── */

@keyframes hofGradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes hofCardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .hof-card { animation: none; }
  .hof-card__glow { animation: none; }
}

/* ─── Mobile ───────────────────────────────────────────── */

@media (max-width: 450px) {
  .hof-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  .hof-card {
    padding: 1rem 0.5rem 0.75rem;
  }

  .hof-card__avatar {
    width: 42px;
    height: 42px;
  }

  .hof-card__name {
    font-size: 0.7rem;
  }
}

@media (max-width: 320px) {
  .hof-grid {
    grid-template-columns: 1fr;
  }
}
</style>
