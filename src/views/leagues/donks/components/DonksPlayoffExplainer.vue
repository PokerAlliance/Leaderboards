<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DonksPlayoffConfig } from '@/types/donks'

defineProps<{
  config: DonksPlayoffConfig
}>()

const STORAGE_KEY = 'donks-playoff-explainer-dismissed'
const collapsed = ref(false)

onMounted(() => {
  collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
})

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
}
</script>

<template>
  <div class="po-explainer">
    <button class="po-explainer__toggle" @click="toggle">
      <span class="po-explainer__toggle-label">What Are The Playoffs?</span>
      <span class="po-explainer__toggle-icon">{{ collapsed ? '\u25BE' : '\u25B4' }}</span>
    </button>

    <Transition name="explainer-slide">
      <div v-if="!collapsed" class="po-explainer__content">
        <div class="po-explainer__grid">
          <!-- Who Qualifies -->
          <div class="po-info" style="--info-color: #1a759f">
            <div class="po-info__icon-wrap">
              <svg class="po-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h4 class="po-info__title">Who Qualifies?</h4>
            <p class="po-info__text">
              Top <strong>{{ config.qualifiersPerCup }}</strong> from each Hold'em Cup, plus
              <strong>{{ config.omahaWildCards }}</strong> Wild Card invites from Omaha.
              Duplicates removed.
            </p>
          </div>

          <!-- How Scoring Works -->
          <div class="po-info" style="--info-color: #c9a227">
            <div class="po-info__icon-wrap">
              <svg class="po-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
            </div>
            <h4 class="po-info__title">How Scoring Works</h4>
            <p class="po-info__text">
              Best <strong>{{ config.topNScores }}</strong> scores from the last
              <strong>{{ config.playoffGames }}</strong> Hold'em games.
              Same formula as regular season.
            </p>
          </div>

          <!-- The Prize -->
          <div class="po-info" style="--info-color: #d4a017">
            <div class="po-info__icon-wrap">
              <svg class="po-info__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v14"/><path d="M8 2h8l-1 4H9L8 2z"/></svg>
            </div>
            <h4 class="po-info__title">The Prize</h4>
            <p class="po-info__text">
              <strong>{{ config.medalName }}</strong> awarded to the winner.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.po-explainer {
  margin-bottom: 1rem;
}

.po-explainer__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.65rem 1rem;
  background: rgba(212, 160, 23, 0.8);
  border: 1px solid var(--color-donks-card-border, rgba(201, 162, 39, 0.2));
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.po-explainer__toggle:hover {
  background: rgba(212, 160, 23, 0.1);
}

.po-explainer__toggle-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-secondary);
}

.po-explainer__toggle-icon {
  font-size: 0.85rem;
  color: var(--color-donks-text-muted);
}

.po-explainer__content {
  margin-top: 0.75rem;
}

.po-explainer__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.po-info {
  padding: 1.15rem 1rem;
  border-radius: 10px;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-top: 3px solid var(--info-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.po-info__icon-wrap {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in srgb, var(--info-color) 10%, transparent);
  color: var(--info-color);
  margin-bottom: 0.15rem;
}

.po-info__icon {
  width: 16px;
  height: 16px;
}

.po-info__title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-donks-text);
  margin: 0;
}

.po-info__text {
  font-size: 0.72rem;
  color: var(--color-donks-text-secondary);
  margin: 0;
  line-height: 1.45;
}

.po-info__text strong {
  color: var(--color-donks-text);
  font-weight: 600;
}

.explainer-slide-enter-active,
.explainer-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.explainer-slide-enter-from,
.explainer-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.explainer-slide-enter-to,
.explainer-slide-leave-from {
  opacity: 1;
  max-height: 300px;
}

@media (max-width: 700px) {
  .po-explainer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
