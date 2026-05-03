<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { DonksCompositeSlug } from '@/types/donks'
import { getDonksMedal } from '@/config/donks'
import { useDonksStore } from '@/composables/useDonksStore'

const props = defineProps<{
  compositeSlug: DonksCompositeSlug
}>()

const store = useDonksStore()

const medal = computed(() => getDonksMedal(props.compositeSlug))

const topEntries = computed(() =>
  store.getCompositeLeaderboard(props.compositeSlug).slice(0, 10)
)

const levelBRoute = computed(() =>
  props.compositeSlug === 'chuckcox'
    ? '/league/donks/holdem'
    : '/league/donks/omaha'
)

function formatPoints(pts: number): string {
  return Math.round(pts).toLocaleString()
}

const rankIcons = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="context-card donks-card">
    <div class="context-card__header">
      <span class="context-card__medal-icon">🏅</span>
      <div>
        <h3 class="context-card__title">{{ medal?.name ?? 'Composite' }}</h3>
        <p class="context-card__sub">This cup contributes to this medal</p>
      </div>
    </div>

    <div v-if="topEntries.length > 0" class="context-card__podium">
      <div
        v-for="(entry, i) in topEntries"
        :key="entry.username"
        class="context-card__entry"
      >
        <span class="context-card__rank">{{ i < 3 ? rankIcons[i] : `${i + 1}` }}</span>
        <img
          :src="store.getAvatar(entry.username)"
          :alt="entry.username"
          class="context-card__avatar"
          loading="lazy"
        />
        <span class="context-card__username">{{ entry.username }}</span>
        <span class="context-card__points">{{ formatPoints(entry.totalPoints) }}</span>
      </div>
    </div>

    <div v-else class="context-card__empty">
      No standings yet.
    </div>

    <RouterLink :to="levelBRoute" class="context-card__link">
      View Full {{ medal?.name ?? 'Leaderboard' }} →
    </RouterLink>
  </div>
</template>

<style scoped>
.context-card {
  padding: 1rem;
  border-top: 3px solid var(--color-donks-gold);
}

.context-card__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
}

.context-card__medal-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.context-card__title {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-donks-gold-dark);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.context-card__sub {
  font-size: 0.65rem;
  color: var(--color-donks-text-muted);
  margin: 0.1rem 0 0;
}

.context-card__podium {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.context-card__entry {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.context-card__entry:hover {
  background: rgba(201, 162, 39, 0.05);
}

.context-card__rank {
  font-size: 0.9rem;
  flex-shrink: 0;
  width: 1.3rem;
  text-align: center;
}

.context-card__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(201, 162, 39, 0.2);
  flex-shrink: 0;
}

.context-card__username {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-donks-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-card__points {
  font-size: 0.68rem;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  color: var(--color-donks-text-secondary);
  flex-shrink: 0;
}

.context-card__empty {
  padding: 0.75rem 0;
  text-align: center;
  color: var(--color-donks-text-muted);
  font-size: 0.75rem;
}

.context-card__link {
  display: block;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-donks-gold-dark);
  text-decoration: none;
  padding: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  transition: color 0.2s;
}

.context-card__link:hover {
  color: var(--color-donks-gold);
}

@media (max-width: 600px) {
  .context-card {
    padding: 0.75rem;
  }
}
</style>
