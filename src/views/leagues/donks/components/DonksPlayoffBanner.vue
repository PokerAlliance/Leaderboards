<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksPlayoffState, DonksPlayoffConfig } from '@/types/donks'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'

const props = defineProps<{
  playoffState: DonksPlayoffState
  config: DonksPlayoffConfig
  getAvatar: (username: string) => string
}>()

const phase = computed(() => props.playoffState.phase)

const gamesCompleted = computed(() =>
  props.playoffState.playoffGames.filter((g) => g.isLocked).length
)

const totalGames = computed(() => props.playoffState.playoffGames.length)

const leader = computed(() => {
  const lb = props.playoffState.leaderboard
  if (lb.length === 0 || lb[0]!.rank === 0) return null
  return lb[0]!
})

const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'pre_playoffs': return 'UPCOMING'
    case 'playoffs_active': return 'IN PROGRESS'
    case 'playoffs_complete': return 'COMPLETE'
    default: return ''
  }
})

const mainText = computed(() => {
  switch (phase.value) {
    case 'pre_playoffs': return 'Playoffs Approaching'
    case 'playoffs_active': return 'Playoffs In Progress'
    case 'playoffs_complete': return 'Playoffs Complete'
    default: return ''
  }
})

const detailText = computed(() => {
  switch (phase.value) {
    case 'pre_playoffs':
      return `${props.playoffState.qualifiers.length} qualifiers · ${totalGames.value} playoff games upcoming`
    case 'playoffs_active':
      return `${gamesCompleted.value} of ${totalGames.value} games completed`
    case 'playoffs_complete':
      return leader.value ? `${leader.value.username} wins the ${props.config.medalName}` : 'All games completed'
    default: return ''
  }
})

const ctaText = computed(() => {
  switch (phase.value) {
    case 'pre_playoffs': return 'Preview Qualifiers'
    case 'playoffs_active': return 'View Standings'
    case 'playoffs_complete': return 'View Results'
    default: return 'View Playoffs'
  }
})
</script>

<template>
  <RouterLink
    v-if="phase !== 'no_data'"
    to="/league/donks/playoffs"
    class="pb"
    :class="{
      'pb--upcoming': phase === 'pre_playoffs',
      'pb--active': phase === 'playoffs_active',
      'pb--complete': phase === 'playoffs_complete',
    }"
  >
    <!-- Icon zone -->
    <div class="pb__icon-zone">
      <div class="pb__icon-glow" :class="{ 'pb__icon-glow--pulse': phase === 'playoffs_active' }" />
      <i v-if="phase === 'pre_playoffs'" class="i-lucide-timer pb__icon" />
      <i v-else-if="phase === 'playoffs_active'" class="i-lucide-swords pb__icon" />
      <i v-else class="i-lucide-trophy pb__icon" />
    </div>

    <!-- Content zone -->
    <div class="pb__content">
      <span class="pb__phase">{{ phaseLabel }}</span>
      <span class="pb__main">{{ mainText }}</span>
      <span class="pb__detail">{{ detailText }}</span>
    </div>

    <!-- Leader avatar (active/complete) -->
    <div v-if="leader && (phase === 'playoffs_active' || phase === 'playoffs_complete')" class="pb__leader">
      <PlayerAvatar :src="getAvatar(leader.username)" :username="leader.username" class="pb__leader-avatar" />
      <span class="pb__leader-name">{{ leader.username }}</span>
      <span class="pb__leader-pts">{{ leader.totalPoints.toLocaleString() }} pts</span>
    </div>

    <!-- CTA zone -->
    <span class="pb__cta">
      {{ ctaText }}
      <i class="i-heroicons-arrow-right-20-solid pb__cta-arrow" />
    </span>

    <!-- Shimmer for complete -->
    <div v-if="phase === 'playoffs_complete'" class="pb__shimmer" />
  </RouterLink>
</template>

<style scoped>
.pb {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-donks-text);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 1.25rem;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.06));
  border-top: 3px solid var(--color-donks-gold);
  box-shadow: var(--shadow-donks-card, 0 2px 12px rgba(0, 0, 0, 0.06));
}

.pb:hover {
  box-shadow: 0 4px 20px rgba(201, 162, 39, 0.15);
  transform: translateY(-1px);
}

.pb--active {
  border-top-color: #166534;
}

.pb--complete {
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.06) 0%, var(--color-donks-card-bg, rgba(255, 255, 255, 0.88)) 50%);
}

/* ─── Icon Zone ─────────────────────────────────────────── */

.pb__icon-zone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.pb__icon {
  width: 24px;
  height: 24px;
  position: relative;
  z-index: 1;
}

.pb--upcoming .pb__icon { color: #92400e; }
.pb--active .pb__icon { color: #166534; }
.pb--complete .pb__icon { color: #c9a227; }

.pb__icon-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  opacity: 0.2;
}

.pb--upcoming .pb__icon-glow { background: radial-gradient(circle, rgba(146, 64, 14, 0.3) 0%, transparent 70%); }
.pb--active .pb__icon-glow { background: radial-gradient(circle, rgba(22, 101, 52, 0.3) 0%, transparent 70%); }
.pb--complete .pb__icon-glow { background: radial-gradient(circle, rgba(201, 162, 39, 0.4) 0%, transparent 70%); }

.pb__icon-glow--pulse {
  animation: glowPulse 2.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.15); }
}

/* ─── Content Zone ──────────────────────────────────────── */

.pb__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.pb__phase {
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.1rem;
}

.pb--upcoming .pb__phase { color: #92400e; }
.pb--active .pb__phase { color: #166534; }
.pb--complete .pb__phase { color: #b8941e; }

.pb__main {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-donks-text);
  line-height: 1.2;
}

.pb__detail {
  font-size: 0.68rem;
  color: var(--color-donks-text-muted);
  margin-top: 0.1rem;
}

/* ─── Leader Zone ───────────────────────────────────────── */

.pb__leader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  flex-shrink: 0;
}

.pb__leader-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-donks-gold);
}

.pb__leader-name {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--color-donks-text);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pb__leader-pts {
  font-size: 0.55rem;
  color: var(--color-donks-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ─── CTA Zone ──────────────────────────────────────────── */

.pb__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.pb--upcoming .pb__cta {
  background: rgba(146, 64, 14, 0.08);
  color: #92400e;
  border: 1px solid rgba(146, 64, 14, 0.2);
}

.pb--active .pb__cta {
  background: rgba(22, 101, 52, 0.08);
  color: #166534;
  border: 1px solid rgba(22, 101, 52, 0.2);
}

.pb--complete .pb__cta {
  background: rgba(201, 162, 39, 0.1);
  color: #b8941e;
  border: 1px solid rgba(201, 162, 39, 0.25);
}

.pb:hover .pb__cta {
  transform: translateX(2px);
}

.pb__cta-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.pb:hover .pb__cta-arrow {
  transform: translateX(2px);
}

/* ─── Shimmer ───────────────────────────────────────────── */

.pb__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(201, 162, 39, 0.08) 50%,
    transparent 70%
  );
  animation: bannerShimmer 4s ease-in-out infinite;
  pointer-events: none;
}

@keyframes bannerShimmer {
  0% { left: -50%; }
  50% { left: 120%; }
  100% { left: 120%; }
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 600px) {
  .pb {
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
  }

  .pb__leader {
    order: 4;
    flex-direction: row;
    gap: 0.4rem;
  }

  .pb__leader-avatar {
    width: 24px;
    height: 24px;
  }

  .pb__cta {
    width: 100%;
    justify-content: center;
    order: 5;
  }
}
</style>
