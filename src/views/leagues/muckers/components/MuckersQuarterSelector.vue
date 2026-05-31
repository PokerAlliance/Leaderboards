<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import {
  getSelectableMuckersQuarters,
  getMuckersQuarterLabel,
} from '@/config/muckers'
import type { MuckersQuarterKey } from '@/types/muckers'

const store = useMuckersStore()

const quarters = computed(() => getSelectableMuckersQuarters())

const selectedIdx = ref(0)

watch(
  () => store.loadedQuarter.value,
  (loaded) => {
    if (!loaded) return
    const idx = quarters.value.findIndex(
      (q) => q.quarter === loaded.quarter && q.year === loaded.year,
    )
    if (idx >= 0) selectedIdx.value = idx
  },
  { immediate: true },
)

function onSelect(event: Event) {
  const target = event.target as HTMLSelectElement
  const idx = Number(target.value)
  selectedIdx.value = idx
  const key: MuckersQuarterKey = quarters.value[idx]!
  store.loadQuarter(key).catch((err) => {
    console.error('[MuckersQuarterSelector] load failed:', err)
  })
}
</script>

<template>
  <div class="mk-quarter-selector">
    <select
      class="mk-quarter-selector__select"
      :value="selectedIdx"
      @change="onSelect"
    >
      <option
        v-for="(q, idx) in quarters"
        :key="`${q.quarter}-${q.year}`"
        :value="idx"
      >
        {{ getMuckersQuarterLabel(q) }}
      </option>
    </select>
    <span class="mk-quarter-selector__caret">&#9662;</span>
  </div>
</template>

<style scoped>
.mk-quarter-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.mk-quarter-selector__select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(100, 120, 160, 0.2);
  border-radius: 8px;
  padding: 0.45rem 2rem 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-mk-navy, #1B2A4A);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.mk-quarter-selector__select:hover {
  border-color: var(--color-mk-cyan, #00B4D8);
  background: rgba(255, 255, 255, 0.7);
}

.mk-quarter-selector__select:focus {
  outline: none;
  border-color: var(--color-mk-cyan, #00B4D8);
  box-shadow: 0 0 0 2px rgba(0, 180, 216, 0.15);
}

.mk-quarter-selector__caret {
  position: absolute;
  right: 0.65rem;
  font-size: 0.6rem;
  color: var(--color-mk-text-muted, #94A3B8);
  pointer-events: none;
}
</style>
