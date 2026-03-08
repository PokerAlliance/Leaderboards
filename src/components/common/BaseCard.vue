<script setup lang="ts">
  interface Props {
    variant?: 'default' | 'elevated' | 'glass'
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }

  withDefaults(defineProps<Props>(), {
    variant: 'default',
    padding: 'md',
  })
</script>

<template>
  <div
    class="base-card"
    :class="[`base-card--${variant}`, `base-card--padding-${padding}`]"
  >
    <div v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </div>
    <div class="base-card__content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
  .base-card {
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all var(--transition-base);
  }

  .base-card--default {
    box-shadow: var(--shadow-sm);
  }

  .base-card--elevated {
    background: var(--color-bg-elevated);
    box-shadow: var(--shadow-md);
  }

  .base-card--elevated:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .base-card--glass {
    background: rgba(19, 27, 35, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .base-card--padding-none .base-card__content {
    padding: 0;
  }

  .base-card--padding-sm .base-card__content {
    padding: var(--space-3);
  }

  .base-card--padding-md .base-card__content {
    padding: var(--space-4);
  }

  .base-card--padding-lg .base-card__content {
    padding: var(--space-6);
  }

  .base-card__header {
    padding: var(--space-4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .base-card__footer {
    padding: var(--space-4);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>
