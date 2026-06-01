<script setup lang="ts">
import { computed } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { MUCKERS_SCHEDULE } from '@/config/muckers'
import type { MuckersPrimarySlot, MuckersTeamSlug } from '@/types/muckers'

const props = defineProps<{
  weekNumber: number
  slotId: MuckersPrimarySlot
}>()

const emit = defineEmits<{ teamClick: [slug: MuckersTeamSlug] }>()

const store = useMuckersStore()

const detail = computed(() => store.getWeekDetail(props.weekNumber))

const table = computed(() =>
  detail.value?.tables.find((t) => t.slot === props.slotId) ?? null,
)

const slotConfig = computed(() =>
  MUCKERS_SCHEDULE.find((s) => s.slot === props.slotId),
)

const gameDate = computed(() => {
  if (!detail.value) return null
  const ws = detail.value.weekStartDate
  const dayOffset = (slotConfig.value?.dayOfWeek ?? 4) - 4
  const d = new Date(ws)
  d.setDate(d.getDate() + dayOffset)
  return d
})

const formattedDate = computed(() => {
  if (!gameDate.value) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(gameDate.value)
})

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th')
}

function podiumClass(rank: number): string {
  if (rank === 1) return 'mk-gc-medal--gold'
  if (rank === 2) return 'mk-gc-medal--silver'
  if (rank === 3) return 'mk-gc-medal--bronze'
  return ''
}
</script>

<template>
  <div class="mk-gc mk-glass">
    <div class="mk-gc__header">
      <span class="mk-gc__badge">{{ slotId }}</span>
      <div class="mk-gc__header-info">
        <span class="mk-gc__label">{{ `Barnyard Muckers ${slotId}` }}</span>
        <span class="mk-gc__meta">
          {{ formattedDate }}
          <template v-if="slotConfig"> &middot; {{ slotConfig.timeEST }} EST</template>
          <template v-if="table"> &middot; {{ table.results.length }} players</template>
        </span>
      </div>
      <span class="mk-gc__week-tag">Wk{{ weekNumber }}</span>
    </div>

    <div v-if="!table || table.results.length === 0" class="mk-gc__empty">
      No results recorded
    </div>
    <table v-else class="mk-gc__table">
      <thead>
        <tr>
          <th class="mk-gc-th--rank">#</th>
          <th class="mk-gc-th--player">Player</th>
          <th class="mk-gc-th--pts">Pts</th>
          <th class="mk-gc-th--pos">Pos</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(r, idx) in table.results"
          :key="r.username"
          :class="podiumClass(idx + 1)"
          class="mk-gc__row"
          @click="emit('teamClick', r.teamSlug as MuckersTeamSlug)"
        >
          <td class="mk-gc-td--rank">{{ idx + 1 }}</td>
          <td class="mk-gc-td--player">
            <div class="mk-gc__player">
              <img
                v-if="store.getAvatar(r.username)"
                :src="store.getAvatar(r.username)"
                class="mk-gc__avatar"
                alt=""
                loading="lazy"
              />
              <div class="mk-gc__player-info">
                <span class="mk-gc__player-name">{{ r.username }}</span>
                <span class="mk-gc__player-team">{{ r.teamName }}</span>
              </div>
            </div>
          </td>
          <td class="mk-gc-td--pts">{{ r.pointsEarned }}</td>
          <td class="mk-gc-td--pos">{{ ordinal(r.finishPosition) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.mk-gc {
  overflow: hidden;
}

/* ─── Header ──────────────────────── */

.mk-gc__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-gc__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 180, 216, 0.1);
  color: var(--color-mk-cyan, #00B4D8);
  font-weight: 900;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.mk-gc__header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mk-gc__label {
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--color-mk-navy, #1B2A4A);
}

.mk-gc__meta {
  font-size: 0.65rem;
  color: var(--color-mk-text-muted, #64748B);
}

.mk-gc__week-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-mk-text-muted, #64748B);
  background: rgba(100, 120, 160, 0.06);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
}

/* ─── Empty ───────────────────────── */

.mk-gc__empty {
  padding: 1.25rem;
  text-align: center;
  font-size: 0.78rem;
  color: #CBD5E1;
  font-style: italic;
}

/* ─── Table ───────────────────────── */

.mk-gc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.mk-gc__table th {
  text-align: left;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748B;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-gc__table td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.05);
  vertical-align: middle;
}

.mk-gc__row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.mk-gc__row:hover td {
  background: rgba(0, 180, 216, 0.03);
}

.mk-gc-th--rank,
.mk-gc-td--rank {
  width: 28px;
  text-align: center;
  font-weight: 700;
  color: #64748B;
}

.mk-gc-th--pts,
.mk-gc-td--pts {
  width: 48px;
  text-align: right;
  font-weight: 700;
  color: #00B4D8;
}

.mk-gc-th--pos,
.mk-gc-td--pos {
  width: 50px;
  text-align: right;
  color: #64748B;
  font-size: 0.72rem;
}

/* ─── Player ──────────────────────── */

.mk-gc__player {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.mk-gc__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-gc__player-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mk-gc__player-name {
  font-weight: 600;
  color: #1B2A4A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
  line-height: 1.2;
}

.mk-gc__player-team {
  font-size: 0.62rem;
  color: #64748B;
  line-height: 1.2;
}

/* Podium accents */
.mk-gc-medal--gold .mk-gc-td--rank { color: #D4AF37; }
.mk-gc-medal--silver .mk-gc-td--rank { color: #64748B; }
.mk-gc-medal--bronze .mk-gc-td--rank { color: #B45309; }

/* ─── Responsive ──────────────────── */

@media (max-width: 640px) {
  .mk-gc__header { padding: 0.6rem 0.75rem; }
  .mk-gc__badge { width: 26px; height: 26px; font-size: 0.75rem; }
  .mk-gc__label { font-size: 0.75rem; }
  .mk-gc__table { font-size: 0.75rem; }
  .mk-gc__avatar { width: 18px; height: 18px; }
}
</style>
