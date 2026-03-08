<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    position: number
    size?: 'sm' | 'md' | 'lg'
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'md',
  })

  const badgeClass = computed(() => {
    if (props.position === 1) return 'position-badge--gold'
    if (props.position === 2) return 'position-badge--silver'
    if (props.position === 3) return 'position-badge--bronze'
    return 'position-badge--default'
  })

  const displayValue = computed(() => {
    if (props.position === 1) return '1st'
    if (props.position === 2) return '2nd'
    if (props.position === 3) return '3rd'
    return `#${props.position}`
  })
</script>

<template>
  <span class="position-badge" :class="[badgeClass, `position-badge--${size}`]">
    {{ displayValue }}
  </span>
</template>

<style scoped>
  .position-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: var(--font-bold);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }

  .position-badge--sm {
    min-width: 32px;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
  }

  .position-badge--md {
    min-width: 40px;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
  }

  .position-badge--lg {
    min-width: 48px;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
  }

  .position-badge--gold {
    background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
    color: var(--color-bg-base);
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
  }

  .position-badge--silver {
    background: linear-gradient(135deg, var(--color-silver) 0%, #d4d4d4 100%);
    color: var(--color-bg-base);
    box-shadow: 0 2px 8px rgba(168, 168, 168, 0.3);
  }

  .position-badge--bronze {
    background: linear-gradient(135deg, var(--color-bronze) 0%, #e6a05d 100%);
    color: var(--color-bg-base);
    box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
  }

  .position-badge--default {
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
  }
</style>
