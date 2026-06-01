<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { MUCKERS_SCHEDULE } from '@/config/muckers'
import { getMuckersTeam } from '@/config/teams'
import type { MuckersPrimarySlot } from '@/types/muckers'

const props = defineProps<{ weekNumber: number }>()
const emit = defineEmits<{ close: [] }>()

const store = useMuckersStore()

const detail = computed(() => store.getWeekDetail(props.weekNumber))

const activeTab = ref<MuckersPrimarySlot>('A')

const tabs = computed(() =>
  MUCKERS_SCHEDULE.map((s) => ({
    slot: s.slot,
    label: s.dayLabel.slice(0, 3),
    fullLabel: s.dayLabel,
    count: detail.value?.tables.find((t) => t.slot === s.slot)?.results.length ?? 0,
  })),
)

const activeTable = computed(() =>
  detail.value?.tables.find((t) => t.slot === activeTab.value) ?? null,
)

function getSlotLabel(slot: MuckersPrimarySlot): string {
  const cfg = MUCKERS_SCHEDULE.find((s) => s.slot === slot)
  return cfg ? `Muckers ${slot} (${cfg.dayLabel})` : `Muckers ${slot}`
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th')
}

function podiumClass(rank: number): string {
  if (rank === 1) return 'mk-medal--gold'
  if (rank === 2) return 'mk-medal--silver'
  if (rank === 3) return 'mk-medal--bronze'
  return ''
}

function getTeamLogo(slug: string): string {
  return getMuckersTeam(slug as never)?.logoUrl ?? ''
}

function formatDateRange(date: Date): string {
  const start = new Date(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 2)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const fmt = new Intl.DateTimeFormat('en-US', opts)
  return `${fmt.format(start)}–${fmt.format(end)}, ${start.getFullYear()}`
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('mk-modal-overlay')) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(() => props.weekNumber, () => {
  document.body.style.overflow = 'hidden'
}, { immediate: true })

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mk-modal-fade">
      <div v-if="detail" class="mk-modal-overlay" @click="onOverlayClick">
        <div class="mk-modal-panel mk-glass">
          <button class="mk-modal-close" @click="emit('close')" aria-label="Close">&times;</button>

          <div class="mk-modal-header">
            <h2 class="mk-modal-title">
              Week {{ detail.weekNumber }}
              <span class="mk-modal-subtitle">{{ formatDateRange(detail.weekStartDate) }}</span>
            </h2>
          </div>

          <div class="mk-wk-grid">
            <!-- LEFT: Tabbed Game Tables -->
            <div class="mk-wk-left">
              <div class="mk-wk-tabs">
                <button
                  v-for="tab in tabs"
                  :key="tab.slot"
                  class="mk-wk-tab"
                  :class="{ 'mk-wk-tab--active': activeTab === tab.slot }"
                  @click="activeTab = tab.slot"
                >
                  {{ tab.label }}
                  <span class="mk-wk-tab__badge">{{ tab.count }}</span>
                </button>
              </div>

              <div class="mk-wk-table-panel">
                <h3 class="mk-wk-table-heading">{{ activeTable ? getSlotLabel(activeTable.slot as MuckersPrimarySlot) : '' }}</h3>

                <div v-if="!activeTable || activeTable.results.length === 0" class="mk-wk-empty">
                  No results recorded
                </div>
                <table v-else class="mk-wk-table">
                  <thead>
                    <tr>
                      <th class="mk-wk-th--rank">#</th>
                      <th class="mk-wk-th--player">Player</th>
                      <th class="mk-wk-th--pts">Pts</th>
                      <th class="mk-wk-th--pos">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(r, idx) in activeTable.results"
                      :key="r.username"
                      :class="podiumClass(idx + 1)"
                    >
                      <td class="mk-wk-td--rank">{{ idx + 1 }}</td>
                      <td class="mk-wk-td--player">
                        <div class="mk-wk-player">
                          <img
                            v-if="store.getAvatar(r.username)"
                            :src="store.getAvatar(r.username)"
                            class="mk-wk-avatar"
                            alt=""
                          />
                          <div class="mk-wk-player-info">
                            <span class="mk-wk-player-name">{{ r.username }}</span>
                            <span class="mk-wk-player-team">{{ r.teamName }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="mk-wk-td--pts">{{ r.pointsEarned }}</td>
                      <td class="mk-wk-td--pos">{{ ordinal(r.finishPosition) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- RIGHT: Weekly Summary -->
            <div class="mk-wk-right">
              <h3 class="mk-wk-summary-heading">Weekly Summary</h3>

              <!-- Best Team -->
              <div class="mk-wk-best">
                <img :src="getTeamLogo(detail.bestTeam.teamSlug)" class="mk-wk-best-logo" alt="" />
                <div class="mk-wk-best-info">
                  <span class="mk-wk-best-label">Best Team of the Week</span>
                  <span class="mk-wk-best-name">{{ detail.bestTeam.teamName }}</span>
                  <span class="mk-wk-best-pts">{{ detail.bestTeam.weekPoints }} pts</span>
                </div>
              </div>

              <!-- Weekly Team Rankings -->
              <div class="mk-wk-rankings">
                <h4 class="mk-wk-sub-heading">Weekly Team Rankings</h4>
                <div
                  v-for="t in detail.weeklyTeamTally"
                  :key="t.teamSlug"
                  class="mk-wk-rank-row"
                >
                  <span class="mk-wk-rank-pos">{{ t.rank }}.</span>
                  <img :src="getTeamLogo(t.teamSlug)" class="mk-wk-rank-logo" alt="" />
                  <span class="mk-wk-rank-name">{{ t.teamName }}</span>
                  <span class="mk-wk-rank-pts">{{ t.weekPoints }} pts</span>
                </div>
              </div>

              <!-- Standings After Week N -->
              <div class="mk-wk-snapshot">
                <h4 class="mk-wk-sub-heading">Standings After Week {{ detail.weekNumber }}</h4>
                <div
                  v-for="s in detail.leaderboardSnapshot"
                  :key="s.teamSlug"
                  class="mk-wk-rank-row"
                >
                  <span class="mk-wk-rank-pos">{{ s.rank }}.</span>
                  <img :src="getTeamLogo(s.teamSlug)" class="mk-wk-rank-logo" alt="" />
                  <span class="mk-wk-rank-name">{{ s.teamName }}</span>
                  <span class="mk-wk-rank-pts">{{ s.totalPoints }} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mk-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.mk-modal-panel {
  position: relative;
  width: 100%;
  max-width: 1100px;
  padding: 1.5rem 2rem 2rem;
  background: rgba(255, 255, 255, 0.92) !important;
}

.mk-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #64748B;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
  transition: color 0.15s;
  z-index: 1;
}

.mk-modal-close:hover {
  color: #1B2A4A;
}

.mk-modal-header {
  margin-bottom: 1rem;
}

.mk-modal-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  color: #1B2A4A;
  margin: 0;
}

.mk-modal-subtitle {
  font-size: 0.78rem;
  font-weight: 400;
  color: #64748B;
  margin-left: 0.5rem;
}

/* ─── Two-Column Grid ─────── */

.mk-wk-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
  align-items: start;
}

/* ─── LEFT: Tabs + Table ─────── */

.mk-wk-left {
  min-width: 0;
}

.mk-wk-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  background: rgba(100, 120, 160, 0.06);
  border-radius: 8px;
  padding: 3px;
}

.mk-wk-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mk-wk-tab:hover {
  color: #64748B;
  background: rgba(255, 255, 255, 0.5);
}

.mk-wk-tab--active {
  background: #fff;
  color: #1B2A4A;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.mk-wk-tab__badge {
  font-size: 0.6rem;
  font-weight: 700;
  background: rgba(0, 180, 216, 0.1);
  color: #00B4D8;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  line-height: 1.2;
}

.mk-wk-tab--active .mk-wk-tab__badge {
  background: rgba(0, 180, 216, 0.15);
}

.mk-wk-table-panel {
  min-height: 200px;
}

.mk-wk-table-heading {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748B;
  margin: 0 0 0.4rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.12);
}

.mk-wk-empty {
  font-size: 0.78rem;
  color: #CBD5E1;
  font-style: italic;
  padding: 1.5rem 0;
  text-align: center;
}

.mk-wk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.mk-wk-table th {
  text-align: left;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748B;
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.1);
}

.mk-wk-table td {
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.06);
  vertical-align: middle;
}

.mk-wk-th--rank,
.mk-wk-td--rank {
  width: 28px;
  text-align: center;
  font-weight: 700;
  color: #64748B;
}

.mk-wk-th--pts,
.mk-wk-td--pts {
  width: 48px;
  text-align: right;
  font-weight: 700;
  color: #00B4D8;
}

.mk-wk-th--pos,
.mk-wk-td--pos {
  width: 50px;
  text-align: right;
  color: #64748B;
  font-size: 0.72rem;
}

.mk-wk-player {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.mk-wk-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-wk-player-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mk-wk-player-name {
  font-weight: 600;
  color: #1B2A4A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
  line-height: 1.2;
}

.mk-wk-player-team {
  font-size: 0.65rem;
  color: #64748B;
  line-height: 1.2;
}

/* Podium accents */
.mk-medal--gold .mk-wk-td--rank { color: #D4AF37; }
.mk-medal--silver .mk-wk-td--rank { color: #64748B; }
.mk-medal--bronze .mk-wk-td--rank { color: #B45309; }

/* ─── RIGHT: Weekly Summary ─────── */

.mk-wk-right {
  border-left: 1px solid rgba(100, 120, 160, 0.1);
  padding-left: 1.5rem;
}

.mk-wk-summary-heading {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1B2A4A;
  margin: 0 0 0.75rem;
}

.mk-wk-best {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(0, 180, 216, 0.05);
  border: 1px solid rgba(0, 180, 216, 0.12);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 1rem;
}

.mk-wk-best-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-wk-best-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mk-wk-best-label {
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  font-weight: 700;
}

.mk-wk-best-name {
  font-weight: 800;
  font-size: 0.88rem;
  color: #1B2A4A;
}

.mk-wk-best-pts {
  font-weight: 700;
  font-size: 0.78rem;
  color: #00B4D8;
}

.mk-wk-sub-heading {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  margin: 0 0 0.35rem;
}

.mk-wk-rankings,
.mk-wk-snapshot {
  margin-bottom: 0.85rem;
}

.mk-wk-rank-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0;
  font-size: 0.78rem;
}

.mk-wk-rank-pos {
  width: 20px;
  font-weight: 700;
  color: #64748B;
  text-align: right;
  flex-shrink: 0;
  font-size: 0.72rem;
}

.mk-wk-rank-logo {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-wk-rank-name {
  font-weight: 600;
  flex: 1;
  min-width: 0;
  color: #1B2A4A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-wk-rank-pts {
  font-weight: 700;
  color: #00B4D8;
  white-space: nowrap;
  font-size: 0.75rem;
}

/* ─── Modal Transition ─────── */

.mk-modal-fade-enter-active,
.mk-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mk-modal-fade-enter-active .mk-modal-panel,
.mk-modal-fade-leave-active .mk-modal-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.mk-modal-fade-enter-from,
.mk-modal-fade-leave-to {
  opacity: 0;
}

.mk-modal-fade-enter-from .mk-modal-panel {
  transform: translateY(16px);
  opacity: 0;
}

.mk-modal-fade-leave-to .mk-modal-panel {
  transform: translateY(8px);
  opacity: 0;
}

/* ─── Responsive ─────── */

@media (max-width: 768px) {
  .mk-wk-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .mk-wk-right {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid rgba(100, 120, 160, 0.1);
    padding-top: 1rem;
  }

  .mk-modal-panel { padding: 1.25rem 1rem 1.5rem; }
  .mk-modal-title { font-size: 1.05rem; }
  .mk-modal-subtitle { display: block; margin-left: 0; margin-top: 0.15rem; }
}
</style>
