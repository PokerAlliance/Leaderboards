<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'donks-hof-explainer-dismissed'
const collapsed = ref(false)

onMounted(() => {
  collapsed.value = localStorage.getItem(STORAGE_KEY) === '1'
})

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
}

const categories = [
  {
    name: 'Crowns',
    icon: '\u{1F451}',
    color: '#c9a227',
    items: [
      { label: 'Golden', legacy: false },
      { label: 'Silver', legacy: false },
      { label: 'Bronze', legacy: false },
    ],
    note: 'Quarterly Hold\'em awards',
  },
  {
    name: 'Rings',
    icon: '\u{1F48D}',
    color: '#7b2d8b',
    items: [
      { label: 'Annual Championship', legacy: true },
    ],
    note: 'No longer awarded',
  },
  {
    name: 'Bracelets',
    icon: '\u{1F3C5}',
    color: '#1a759f',
    items: [
      { label: 'Tournament of Champions', legacy: true },
      { label: 'All Donks In & Playoffs', legacy: false },
    ],
    note: 'ToC no longer awarded',
  },
  {
    name: 'Omaha',
    icon: '\u2660',
    color: '#2d6a4f',
    items: [
      { label: 'Omaha Awards', legacy: false },
    ],
    note: 'Quarterly Omaha awards',
  },
]
</script>

<template>
  <div class="hof-explainer">
    <button class="hof-explainer__toggle" @click="toggle">
      <span class="hof-explainer__toggle-label">Award Categories</span>
      <span class="hof-explainer__toggle-icon">{{ collapsed ? '\u25BE' : '\u25B4' }}</span>
    </button>

    <Transition name="explainer-slide">
      <div v-if="!collapsed" class="hof-explainer__content">
        <div class="hof-explainer__grid">
          <div
            v-for="cat in categories"
            :key="cat.name"
            class="hof-cat"
            :style="{ '--cat-color': cat.color }"
          >
            <div class="hof-cat__header">
              <span class="hof-cat__icon">{{ cat.icon }}</span>
              <span class="hof-cat__name">{{ cat.name }}</span>
            </div>
            <ul class="hof-cat__list">
              <li
                v-for="item in cat.items"
                :key="item.label"
                class="hof-cat__item"
                :class="{ 'hof-cat__item--legacy': item.legacy }"
              >
                {{ item.label }}
                <span v-if="item.legacy" class="hof-cat__legacy-tag">(legacy)</span>
              </li>
            </ul>
            <p class="hof-cat__note">{{ cat.note }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hof-explainer {
  margin-bottom: 1rem;
}

.hof-explainer__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.65rem 1rem;
  background: rgba(201, 162, 39, 0.06);
  border: 1px solid var(--color-donks-card-border, rgba(201, 162, 39, 0.2));
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.hof-explainer__toggle:hover {
  background: rgba(201, 162, 39, 0.1);
}

.hof-explainer__toggle-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-secondary);
}

.hof-explainer__toggle-icon {
  font-size: 0.85rem;
  color: var(--color-donks-text-muted);
}

.hof-explainer__content {
  margin-top: 0.75rem;
}

.hof-explainer__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.hof-cat {
  padding: 1rem;
  border-radius: 10px;
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(16px);
  border-top: 3px solid var(--cat-color);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-top: 3px solid var(--cat-color);
}

.hof-cat__header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.hof-cat__icon {
  font-size: 1.1rem;
}

.hof-cat__name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-donks-text);
}

.hof-cat__list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.4rem;
}

.hof-cat__item {
  font-size: 0.73rem;
  color: var(--color-donks-text-secondary);
  padding: 0.15rem 0;
}

.hof-cat__item--legacy {
  font-style: italic;
  opacity: 0.65;
}

.hof-cat__legacy-tag {
  font-size: 0.6rem;
  color: var(--color-donks-text-muted);
  font-weight: 600;
}

.hof-cat__note {
  font-size: 0.62rem;
  color: var(--color-donks-text-muted);
  margin: 0;
  font-style: italic;
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
</style>
