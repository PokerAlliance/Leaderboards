<script setup lang="ts">
import { computed } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getMuckersTeam } from '@/config/teams'
import type { MuckersTeamSlug } from '@/types/muckers'

const props = defineProps<{ weekNumber: number }>()
const emit = defineEmits<{ teamClick: [slug: MuckersTeamSlug] }>()

const store = useMuckersStore()
const detail = computed(() => store.getWeekDetail(props.weekNumber))

function getTeamLogo(slug: string): string {
  return getMuckersTeam(slug as never)?.logoUrl ?? ''
}

function formatDateRange(date: Date): string {
  const start = new Date(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 2)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const fmt = new Intl.DateTimeFormat('en-US', opts)
  return `${fmt.format(start)}\u2013${fmt.format(end)}, ${start.getFullYear()}`
}
</script>

<template>
  <div v-if="detail" class="mk-wrc mk-glass mk-wrc--accent">
    <!-- Header -->
    <div class="mk-wrc__header">
      <div class="mk-wrc__header-left">
        <h3 class="mk-wrc__title">Week {{ detail.weekNumber }}</h3>
        <span class="mk-wrc__dates">{{ formatDateRange(detail.weekStartDate) }}</span>
      </div>
      <span class="mk-wrc__tag">RECAP</span>
    </div>

    <!-- Best Team -->
    <div class="mk-wrc__best">
      <img
        :src="getTeamLogo(detail.bestTeam.teamSlug)"
        class="mk-wrc__best-logo"
        alt=""
        loading="lazy"
      />
      <div class="mk-wrc__best-info">
        <span class="mk-wrc__best-label">Best Team of the Week</span>
        <span class="mk-wrc__best-name">{{ detail.bestTeam.teamName }}</span>
        <span class="mk-wrc__best-pts">{{ detail.bestTeam.weekPoints }} pts</span>
      </div>
    </div>

    <!-- Two-column grid -->
    <div class="mk-wrc__grid">
      <div class="mk-wrc__col">
        <h4 class="mk-wrc__col-heading">Weekly Team Rankings</h4>
        <div
          v-for="t in detail.weeklyTeamTally"
          :key="t.teamSlug"
          class="mk-wrc__rank-row"
          @click="emit('teamClick', t.teamSlug)"
        >
          <span class="mk-wrc__rank-pos">{{ t.rank }}.</span>
          <img :src="getTeamLogo(t.teamSlug)" class="mk-wrc__rank-logo" alt="" loading="lazy" />
          <span class="mk-wrc__rank-name">{{ t.teamName }}</span>
          <span class="mk-wrc__rank-pts">{{ t.weekPoints }}</span>
        </div>
      </div>
      <div class="mk-wrc__col">
        <h4 class="mk-wrc__col-heading">Standings After Week {{ detail.weekNumber }}</h4>
        <div
          v-for="s in detail.leaderboardSnapshot"
          :key="s.teamSlug"
          class="mk-wrc__rank-row"
          @click="emit('teamClick', s.teamSlug)"
        >
          <span class="mk-wrc__rank-pos">{{ s.rank }}.</span>
          <img :src="getTeamLogo(s.teamSlug)" class="mk-wrc__rank-logo" alt="" loading="lazy" />
          <span class="mk-wrc__rank-name">{{ s.teamName }}</span>
          <span class="mk-wrc__rank-pts">{{ s.totalPoints }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mk-wrc {
  overflow: hidden;
}

.mk-wrc--accent {
  border: 1px solid rgba(212, 175, 55, 0.2);
  box-shadow: 0 2px 16px rgba(212, 175, 55, 0.06);
}

/* ─── Header ──────────────────────── */

.mk-wrc__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-wrc__header-left {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mk-wrc__title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-mk-navy, #1B2A4A);
  margin: 0;
}

.mk-wrc__dates {
  font-size: 0.68rem;
  color: var(--color-mk-text-muted, #64748B);
}

.mk-wrc__tag {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #D4AF37;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

/* ─── Best Team ───────────────────── */

.mk-wrc__best {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0.75rem 1.15rem;
  background: rgba(0, 180, 216, 0.04);
  border: 1px solid rgba(0, 180, 216, 0.1);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
}

.mk-wrc__best-logo {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-wrc__best-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mk-wrc__best-label {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  font-weight: 700;
}

.mk-wrc__best-name {
  font-weight: 800;
  font-size: 0.88rem;
  color: #1B2A4A;
}

.mk-wrc__best-pts {
  font-weight: 700;
  font-size: 0.78rem;
  color: #00B4D8;
}

/* ─── Grid ────────────────────────── */

.mk-wrc__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 0 1.15rem 0.85rem;
}

.mk-wrc__col {
  padding: 0 0.5rem;
}

.mk-wrc__col:first-child {
  padding-left: 0;
  border-right: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-wrc__col:last-child {
  padding-right: 0;
}

.mk-wrc__col-heading {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  margin: 0 0 0.35rem;
}

.mk-wrc__rank-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.12s ease;
}

.mk-wrc__rank-row:hover {
  background: rgba(0, 180, 216, 0.04);
}

.mk-wrc__rank-pos {
  width: 18px;
  font-weight: 700;
  color: #64748B;
  text-align: right;
  flex-shrink: 0;
  font-size: 0.68rem;
}

.mk-wrc__rank-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-wrc__rank-name {
  font-weight: 600;
  flex: 1;
  min-width: 0;
  color: #1B2A4A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-wrc__rank-pts {
  font-weight: 700;
  color: #00B4D8;
  white-space: nowrap;
  font-size: 0.72rem;
}

/* ─── Responsive ──────────────────── */

@media (max-width: 640px) {
  .mk-wrc__grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .mk-wrc__col:first-child {
    border-right: none;
    padding-right: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(100, 120, 160, 0.1);
  }
  .mk-wrc__col:last-child {
    padding-left: 0;
  }
  .mk-wrc__header { padding: 0.7rem 0.85rem; }
  .mk-wrc__best { margin: 0.6rem 0.85rem; }
  .mk-wrc__grid { padding: 0 0.85rem 0.7rem; }
}
</style>
