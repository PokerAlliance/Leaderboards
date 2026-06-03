<script setup lang="ts">
import type { DonksPlayoffGameSummary } from '@/types/donks'
import { getDonksCup } from '@/config/donks'

defineProps<{
  games: DonksPlayoffGameSummary[]
  selectedGameId: string | null
}>()

const emit = defineEmits<{
  select: [gameId: string]
}>()

function cupColor(cupSlug: string): string {
  return getDonksCup(cupSlug as any)?.color ?? '#888'
}

function cupShortName(cupSlug: string): string {
  return getDonksCup(cupSlug as any)?.shortName ?? cupSlug
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="po-timeline">
    <div class="po-timeline__track">
      <template v-for="(game, idx) in games" :key="game.gameId">
        <!-- Connector before node (skip first) -->
        <div
          v-if="idx > 0"
          class="po-timeline__connector"
          :class="{
            'po-timeline__connector--active': games[idx - 1]?.isLocked,
            'po-timeline__connector--upcoming': !games[idx - 1]?.isLocked,
          }"
        />

        <!-- Game node -->
        <button
          class="po-timeline__node"
          :class="{
            'po-timeline__node--locked': game.isLocked,
            'po-timeline__node--upcoming': !game.isLocked,
            'po-timeline__node--selected': selectedGameId === game.gameId,
          }"
          :style="{ '--cup-color': cupColor(game.cupSlug), '--ni': idx }"
          @click="emit('select', game.gameId)"
        >
          <div class="po-timeline__node-header">
            <span class="po-timeline__cup-dot" />
            <span class="po-timeline__cup-name">{{ cupShortName(game.cupSlug) }}</span>
          </div>

          <span class="po-timeline__date">{{ formatDate(game.gameDate) }}</span>

          <span
            class="po-timeline__status"
            :class="{
              'po-timeline__status--locked': game.isLocked,
              'po-timeline__status--upcoming': !game.isLocked,
            }"
          >
            <template v-if="game.isLocked">
              <svg class="po-timeline__status-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>
              LOCKED
            </template>
            <template v-else>
              <svg class="po-timeline__status-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 7.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
              UPCOMING
            </template>
          </span>

          <span v-if="game.isLocked" class="po-timeline__players">
            {{ game.totalPlayers }} players
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.po-timeline {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem 0;
  mask-image: linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%);
}

.po-timeline__track {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: max-content;
  padding: 0 0.5rem;
}

/* ─── Connector ─────────────────────────────────────────── */

.po-timeline__connector {
  width: 36px;
  height: 2.5px;
  flex-shrink: 0;
  position: relative;
}

.po-timeline__connector--active {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-donks-gold, #c9a227) 30%,
    transparent 50%,
    var(--color-donks-gold, #c9a227) 70%,
    transparent 100%
  );
  background-size: 36px 2.5px;
  animation: flowRight 2.5s linear infinite;
  opacity: 0.7;
}

.po-timeline__connector--upcoming {
  border-top: 2px dashed var(--color-donks-text-muted, #aaa);
  opacity: 0.35;
}

@keyframes flowRight {
  from { background-position: -36px 0; }
  to { background-position: 36px 0; }
}

/* ─── Node ──────────────────────────────────────────────── */

.po-timeline__node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
  animation: tlNodePopIn 0.3s ease both;
  animation-delay: calc(var(--ni, 0) * 0.1s);
  min-width: 145px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(12px);
  border: 1.5px solid var(--color-donks-card-border, rgba(0, 0, 0, 0.08));
  border-left: 3px solid var(--cup-color);
  flex-shrink: 0;
  text-align: left;
}

.po-timeline__node:hover {
  border-color: var(--cup-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.po-timeline__node--upcoming {
  border-style: dashed;
  opacity: 0.55;
}

.po-timeline__node--upcoming:hover {
  opacity: 0.75;
}

.po-timeline__node--selected {
  border-color: var(--color-donks-gold, #c9a227);
  background: rgba(212, 160, 23, 0.06);
  box-shadow: 0 0 0 2px rgba(212, 160, 23, 0.15);
  opacity: 1;
}

/* ─── Node internals ────────────────────────────────────── */

.po-timeline__node-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.po-timeline__cup-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cup-color);
  flex-shrink: 0;
}

.po-timeline__cup-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-donks-text);
  letter-spacing: 0.02em;
}

.po-timeline__date {
  font-size: 0.68rem;
  color: var(--color-donks-text-secondary);
}

.po-timeline__status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
}

.po-timeline__status--locked {
  color: #166534;
  background: rgba(22, 101, 52, 0.08);
}

.po-timeline__status--upcoming {
  color: var(--color-donks-text-muted);
  background: rgba(0, 0, 0, 0.04);
}

.po-timeline__status-icon {
  width: 10px;
  height: 10px;
}

.po-timeline__players {
  font-size: 0.62rem;
  color: var(--color-donks-text-muted);
}

/* ─── Mobile scroll snap ────────────────────────────────── */

@keyframes tlNodePopIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .po-timeline__node { animation: none; }
}

@media (max-width: 700px) {
  .po-timeline {
    scroll-snap-type: x mandatory;
  }

  .po-timeline__node {
    scroll-snap-align: center;
    min-width: 135px;
  }

  .po-timeline__connector {
    width: 24px;
  }
}
</style>
