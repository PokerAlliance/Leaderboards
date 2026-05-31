<script setup lang="ts">
import { computed } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'

const store = useMuckersStore()

const standings = computed(() => store.playerStandings.value)
const weeks = computed(() => store.weekNumbers.value)

function getWeekPoints(player: typeof standings.value[number], wk: number): number | null {
  const ws = player.weeklyScores[wk]
  return ws ? ws.pointsEarned : null
}

function podiumClass(rank: number): string {
  if (rank === 1) return 'mk-row--1st'
  if (rank === 2) return 'mk-row--2nd'
  if (rank === 3) return 'mk-row--3rd'
  return ''
}
</script>

<template>
  <div class="mk-ptable-wrapper mk-glass">
    <div class="mk-ptable-scroll">
      <table class="mk-ptable">
        <thead>
          <tr>
            <th class="mk-pth--rank">#</th>
            <th class="mk-pth--player">Player</th>
            <th
              v-for="wk in weeks"
              :key="wk"
              class="mk-pth--week"
            >
              Wk{{ wk }}
            </th>
            <th class="mk-pth--total">Total</th>
            <th class="mk-pth--games">GP</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="player in standings"
            :key="player.username"
            class="mk-player-row"
            :class="podiumClass(player.rank)"
          >
            <td class="mk-ptd--rank">{{ player.rank }}</td>
            <td class="mk-ptd--player">
              <div class="mk-player-cell">
                <img
                  v-if="store.getAvatar(player.username)"
                  :src="store.getAvatar(player.username)"
                  class="mk-player-cell__avatar"
                  alt=""
                  loading="lazy"
                />
                <div class="mk-player-cell__info">
                  <span class="mk-player-cell__name">{{ player.username }}</span>
                  <span class="mk-player-cell__team">{{ player.teamName }}</span>
                </div>
              </div>
            </td>
            <td
              v-for="wk in weeks"
              :key="wk"
              class="mk-ptd--week"
            >
              <span v-if="getWeekPoints(player, wk) !== null" class="mk-score">
                {{ getWeekPoints(player, wk) }}
              </span>
              <span v-else class="mk-score mk-score--empty">&ndash;</span>
            </td>
            <td class="mk-ptd--total">
              <div class="mk-total-cell">
                <span class="mk-total-cell__value">{{ player.totalPoints }}</span>
                <span class="mk-total-cell__avg">{{ player.averagePerGame.toFixed(1) }} avg</span>
              </div>
            </td>
            <td class="mk-ptd--games">{{ player.gamesPlayed }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.mk-ptable-wrapper {
  overflow: hidden;
}

.mk-ptable-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mk-ptable {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.82rem;
}

/* ─── Headers ────────────────────── */

.mk-ptable th {
  color: var(--color-mk-text-muted, #64748B);
  text-transform: uppercase;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.6rem 0.4rem;
  border-bottom: 2px solid rgba(100, 120, 160, 0.15);
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mk-pth--rank {
  width: 36px;
  text-align: center;
  position: sticky;
  left: 0;
  z-index: 3;
}

.mk-pth--player {
  min-width: 160px;
  position: sticky;
  left: 36px;
  z-index: 3;
}

.mk-pth--week {
  min-width: 48px;
  text-align: center;
}

.mk-pth--total {
  min-width: 70px;
  text-align: center;
}

.mk-pth--games {
  min-width: 40px;
  text-align: center;
}

/* ─── Rows ───────────────────────── */

.mk-player-row {
  transition: background 0.15s ease;
}

.mk-player-row:hover td {
  background: rgba(0, 180, 216, 0.03);
}

.mk-ptable td {
  padding: 0.4rem 0.4rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.08);
  vertical-align: middle;
}

/* Sticky rank + player columns */
.mk-ptd--rank {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-align: center;
  font-weight: 700;
  color: #64748B;
  width: 36px;
}

.mk-ptd--player {
  position: sticky;
  left: 36px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.mk-player-row:hover .mk-ptd--rank,
.mk-player-row:hover .mk-ptd--player {
  background: rgba(255, 255, 255, 0.75);
}

/* Podium accents */
.mk-row--1st .mk-ptd--rank { color: #D4AF37; }
.mk-row--2nd .mk-ptd--rank { color: #64748B; }
.mk-row--3rd .mk-ptd--rank { color: #B45309; }

/* ─── Player Cell ────────────────── */

.mk-player-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.mk-player-cell__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-player-cell__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mk-player-cell__name {
  font-weight: 600;
  color: var(--color-mk-navy, #1B2A4A);
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-player-cell__team {
  font-size: 0.65rem;
  color: var(--color-mk-text-muted, #64748B);
  line-height: 1.2;
}

/* ─── Week Score Cells ───────────── */

.mk-ptd--week {
  text-align: center;
}

.mk-score {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-mk-text, #0F172A);
}

.mk-score--empty {
  color: var(--color-mk-text-muted, #64748B);
  font-weight: 400;
}

/* ─── Total Cell ─────────────────── */

.mk-ptd--total {
  text-align: center;
}

.mk-total-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.02rem;
}

.mk-total-cell__value {
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--color-mk-navy, #1B2A4A);
}

.mk-total-cell__avg {
  font-size: 0.6rem;
  color: var(--color-mk-text-muted, #64748B);
}

/* ─── Games Played ───────────────── */

.mk-ptd--games {
  text-align: center;
  font-weight: 600;
  color: #64748B;
  font-size: 0.78rem;
}

/* ─── Responsive ─────────────────── */

@media (max-width: 640px) {
  .mk-ptable { font-size: 0.75rem; }
  .mk-pth--player { min-width: 130px; }
  .mk-player-cell__avatar { width: 18px; height: 18px; }
  .mk-player-cell__name { font-size: 0.72rem; }
}
</style>
