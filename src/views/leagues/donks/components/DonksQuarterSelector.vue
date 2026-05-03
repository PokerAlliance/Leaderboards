<script setup lang="ts">
import { computed } from 'vue'
import type { DonksQuarterKey } from '@/types/donks'
import { getSelectableQuarters, quarterLabel } from '@/config/donks'

const props = defineProps<{
  modelValue: DonksQuarterKey
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DonksQuarterKey]
}>()

const quarters = computed(() => getSelectableQuarters())

const selectedIndex = computed(() =>
  quarters.value.findIndex(
    (q) => q.quarter === props.modelValue.quarter && q.year === props.modelValue.year
  )
)

function onChange(event: Event) {
  const idx = parseInt((event.target as HTMLSelectElement).value)
  const q = quarters.value[idx]
  if (q) emit('update:modelValue', q)
}
</script>

<template>
  <div class="quarter-sel">
    <label class="quarter-sel__label">Season</label>
    <div class="quarter-sel__control">
      <select
        class="quarter-sel__select"
        :value="selectedIndex"
        @change="onChange"
      >
        <option
          v-for="(q, idx) in quarters"
          :key="`${q.quarter}-${q.year}`"
          :value="idx"
        >
          {{ quarterLabel(q) }}
        </option>
      </select>
      <span class="quarter-sel__arrow">&#9662;</span>
    </div>
    <span class="quarter-sel__note">Results available from Q2 2026 onwards</span>
  </div>
</template>

<style scoped>
.quarter-sel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.quarter-sel__label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-donks-text-secondary);
}

.quarter-sel__control {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.quarter-sel__select {
  appearance: none;
  background: var(--color-donks-card-bg);
  backdrop-filter: blur(12px);
  border: 1.5px solid var(--color-donks-card-border);
  border-radius: 8px;
  padding: 0.45em 2.2em 0.45em 0.9em;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-donks-text);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 120px;
}

.quarter-sel__select:hover {
  border-color: var(--color-donks-gold);
}

.quarter-sel__select:focus {
  outline: none;
  border-color: var(--color-donks-gold);
  box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.15);
}

.quarter-sel__arrow {
  position: absolute;
  right: 0.7em;
  pointer-events: none;
  color: var(--color-donks-gold);
  font-size: 0.75rem;
}

.quarter-sel__note {
  font-size: 0.6rem;
  color: var(--color-donks-text-muted);
}
</style>
