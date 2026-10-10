<script setup lang="ts">
import { format, differenceInCalendarDays } from 'date-fns'
import type { DonksMilestoneEvent } from '@/types/donks'
import { getDonksCup, getMilestoneTier } from '@/config/donks'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'
import DonksMilestoneTrophy from './DonksMilestoneTrophy.vue'

defineProps<{
  events: DonksMilestoneEvent[]
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  select: [event: DonksMilestoneEvent]
}>()

const SUITS = ['♠', '♥', '♦', '♣']
const NEW_WINDOW_DAYS = 7

function isNew(ev: DonksMilestoneEvent): boolean {
  return differenceInCalendarDays(new Date(), ev.date) < NEW_WINDOW_DAYS
}

function tierStyle(ev: DonksMilestoneEvent) {
  const t = getMilestoneTier(ev.milestone)
  return {
    '--tier-light': t.colors.light,
    '--tier-base': t.colors.base,
    '--tier-dark': t.colors.dark,
  }
}
</script>

<template>
  <div class="ms-tl">
    <!-- Empty state -->
    <div v-if="events.length === 0" class="ms-tl__empty">
      <div class="ms-tl__empty-cards">
        <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
      </div>
      <p class="ms-tl__empty-title">The first milestone is being dealt…</p>
      <p class="ms-tl__empty-text">
        Every 500 games a player earns a trophy here. See who's on the brink below.
      </p>
    </div>

    <ol v-else class="ms-tl__list">
      <li
        v-for="(ev, idx) in events"
        :key="ev.username"
        class="ms-tl__item"
        :class="idx % 2 === 0 ? 'ms-tl__item--left' : 'ms-tl__item--right'"
        :style="{ ...tierStyle(ev), '--i': Math.min(idx, 12) }"
      >
        <span class="ms-tl__node" :class="{ 'ms-tl__node--red': idx % 4 === 1 || idx % 4 === 2 }">
          {{ SUITS[idx % 4] }}
        </span>

        <button type="button" class="ms-tl__card" @click="emit('select', ev)">
          <span v-if="isNew(ev)" class="ms-tl__new">New</span>

          <div class="ms-tl__trophy">
            <DonksMilestoneTrophy :milestone="ev.milestone" :size="60" />
          </div>

          <div class="ms-tl__body">
            <span class="ms-tl__tier">{{ getMilestoneTier(ev.milestone).name }}</span>
            <span class="ms-tl__count">
              {{ ev.milestone.toLocaleString('en-US') }} <small>games</small>
            </span>
            <span class="ms-tl__player">
              <PlayerAvatar :src="getAvatar(ev.username)" :username="ev.username" :size="24" class="ms-tl__avatar" />
              <span class="ms-tl__name">{{ ev.username }}</span>
            </span>
            <span class="ms-tl__meta">
              <time :datetime="format(ev.date, 'yyyy-MM-dd')">{{ format(ev.date, 'MMM d, yyyy') }}</time>
              <span
                v-if="ev.cupSlug && getDonksCup(ev.cupSlug)"
                class="ms-tl__cup"
                :style="{ '--cup-c': getDonksCup(ev.cupSlug)!.color }"
              >{{ getDonksCup(ev.cupSlug)!.shortName }}</span>
            </span>
          </div>

          <i class="i-lucide-maximize-2 ms-tl__open" aria-hidden="true" />
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ms-tl__list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
}

/* Gold spine */
.ms-tl__list::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, var(--color-donks-gold) 6%, var(--color-donks-gold) 94%, transparent);
  border-radius: 3px;
}

.ms-tl__item {
  position: relative;
  width: 50%;
  padding: 0.6rem 2.25rem;
  animation: ms-tl-in 0.5s ease both;
  animation-delay: calc(var(--i) * 70ms);
}

.ms-tl__item--left { margin-right: auto; }
.ms-tl__item--right { margin-left: auto; }

@keyframes ms-tl-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.ms-tl__node {
  position: absolute;
  top: 50%;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 0.95rem;
  line-height: 1;
  color: #1a1a2e;
  background: var(--color-donks-ivory);
  border: 2px solid var(--tier-base);
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.18), 0 2px 8px rgba(0, 0, 0, 0.25);
  transform: translateY(-50%);
  z-index: 1;
}
.ms-tl__node--red { color: #c9184a; }
.ms-tl__item--left .ms-tl__node { right: -15px; }
.ms-tl__item--right .ms-tl__node { left: -15px; }

/* Card */
.ms-tl__card {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.1rem;
  text-align: left;
  font: inherit;
  color: #f5f0e8;
  cursor: pointer;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--tier-base) 70%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--tier-base) 18%, transparent), transparent 55%),
    radial-gradient(ellipse at top left, #1f6b3b, #0d3520 70%);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ms-tl__card:hover,
.ms-tl__card:focus-visible {
  transform: translateY(-3px);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.3),
    0 0 22px color-mix(in srgb, var(--tier-base) 45%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  outline: none;
}

.ms-tl__item--left .ms-tl__card { flex-direction: row-reverse; text-align: right; }
.ms-tl__item--left .ms-tl__body { align-items: flex-end; }
.ms-tl__item--left .ms-tl__open { left: 0.6rem; right: auto; }

.ms-tl__trophy { flex-shrink: 0; }

.ms-tl__body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.ms-tl__tier {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--tier-light);
}

.ms-tl__count {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(180deg, var(--tier-light), var(--tier-base));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ms-tl__count small {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.ms-tl__player {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.ms-tl__item--left .ms-tl__player { flex-direction: row-reverse; }

.ms-tl__avatar {
  border-radius: 50%;
  border: 2px solid var(--tier-base);
  flex-shrink: 0;
}

.ms-tl__name {
  font-weight: 700;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-tl__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: rgba(245, 240, 232, 0.65);
}

.ms-tl__cup {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
  background: color-mix(in srgb, var(--cup-c) 75%, #000);
}

.ms-tl__open {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  font-size: 0.75rem;
  opacity: 0.35;
}

.ms-tl__new {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #1a1a2e;
  background: linear-gradient(90deg, #f3dc85, #c9a227);
  box-shadow: 0 2px 8px rgba(201, 162, 39, 0.5);
  animation: ms-tl-pulse 2s ease-in-out infinite;
}

@keyframes ms-tl-pulse {
  50% { box-shadow: 0 2px 16px rgba(201, 162, 39, 0.9); }
}

/* Empty state */
.ms-tl__empty {
  text-align: center;
  padding: 2.25rem 1.5rem;
  border-radius: 14px;
  color: #f5f0e8;
  background: radial-gradient(ellipse at center, #1a5c32, #0d3520 75%);
  border: 1px dashed rgba(228, 201, 90, 0.5);
}

.ms-tl__empty-cards {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}

.ms-tl__empty-cards span {
  width: 34px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: var(--color-donks-ivory);
  color: #1a1a2e;
  font-size: 1.1rem;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  animation: ms-tl-deal 2.4s ease-in-out infinite;
}
.ms-tl__empty-cards span:nth-child(2),
.ms-tl__empty-cards span:nth-child(3) { color: #c9184a; }
.ms-tl__empty-cards span:nth-child(2) { animation-delay: 0.15s; }
.ms-tl__empty-cards span:nth-child(3) { animation-delay: 0.3s; }
.ms-tl__empty-cards span:nth-child(4) { animation-delay: 0.45s; }

@keyframes ms-tl-deal {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.ms-tl__empty-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: #f3dc85;
}

.ms-tl__empty-text {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(245, 240, 232, 0.75);
}

/* Mobile: single column, spine on the left */
@media (max-width: 720px) {
  .ms-tl__list::before { left: 15px; }
  .ms-tl__item,
  .ms-tl__item--left,
  .ms-tl__item--right {
    width: 100%;
    margin: 0;
    padding: 0.5rem 0 0.5rem 2.6rem;
  }
  .ms-tl__item .ms-tl__node,
  .ms-tl__item--left .ms-tl__node { left: 0; right: auto; }
  .ms-tl__item--left .ms-tl__card { flex-direction: row; text-align: left; }
  .ms-tl__item--left .ms-tl__body { align-items: flex-start; }
  .ms-tl__item--left .ms-tl__player { flex-direction: row; }
  .ms-tl__item--left .ms-tl__open { right: 0.6rem; left: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .ms-tl__item,
  .ms-tl__new,
  .ms-tl__empty-cards span { animation: none; }
}
</style>
