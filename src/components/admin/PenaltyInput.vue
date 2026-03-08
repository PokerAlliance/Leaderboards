<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  teamName: string
  teamSlug: string
  teamColor?: string
  totalPoints: number
  modelValue: number
}

const props = withDefaults(defineProps<Props>(), {
  teamColor: 'var(--color-gold)',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const finalScore = computed(() => props.totalPoints - props.modelValue)

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Math.max(0, parseInt(target.value, 10) || 0)
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="penalty-input">
    <div class="penalty-input__team">
      <span
        class="penalty-input__color"
        :style="{ backgroundColor: teamColor }"
      />
      <span class="penalty-input__name">{{ teamName }}</span>
    </div>

    <div class="penalty-input__scores">
      <div class="penalty-input__score-item">
        <span class="penalty-input__score-label">Base</span>
        <span class="penalty-input__score-value">{{ totalPoints }}</span>
      </div>

      <div class="penalty-input__penalty-field">
        <label :for="`penalty-${teamSlug}`" class="penalty-input__score-label">
          Penalty
        </label>
        <input
          :id="`penalty-${teamSlug}`"
          type="number"
          min="0"
          :value="modelValue"
          class="penalty-input__input"
          @change="handleChange"
        />
      </div>

      <div class="penalty-input__score-item penalty-input__score-item--final">
        <span class="penalty-input__score-label">Final</span>
        <span class="penalty-input__score-value">{{ finalScore }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.penalty-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
}

.penalty-input__team {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 120px;
}

.penalty-input__color {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.penalty-input__name {
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.penalty-input__scores {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.penalty-input__score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 50px;
}

.penalty-input__score-item--final {
  min-width: 60px;
}

.penalty-input__score-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.penalty-input__score-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.penalty-input__score-item--final .penalty-input__score-value {
  color: var(--color-gold);
}

.penalty-input__penalty-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.penalty-input__input {
  width: 60px;
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  text-align: center;
  color: var(--color-error);
  background: var(--color-bg-elevated);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.penalty-input__input:focus {
  outline: none;
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.penalty-input__input::-webkit-outer-spin-button,
.penalty-input__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.penalty-input__input[type='number'] {
  -moz-appearance: textfield;
}

@media (max-width: 640px) {
  .penalty-input {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .penalty-input__team {
    min-width: unset;
  }

  .penalty-input__scores {
    justify-content: space-between;
  }
}
</style>
