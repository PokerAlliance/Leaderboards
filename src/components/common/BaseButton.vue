<script setup lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
  }

  withDefaults(defineProps<Props>(), {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  })

  defineEmits<{
    click: [event: MouseEvent]
  }>()
</script>

<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--loading': loading },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__spinner" />
    <span class="base-button__content" :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
  .base-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-body);
    font-weight: var(--font-semibold);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
  }

  .base-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .base-button:focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 2px;
  }

  /* Size variants */
  .base-button--sm {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    min-height: 32px;
  }

  .base-button--md {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-base);
    min-height: 40px;
  }

  .base-button--lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-lg);
    min-height: 48px;
  }

  /* Primary variant */
  .base-button--primary {
    background: var(--color-gold);
    color: var(--color-bg-base);
  }

  .base-button--primary:hover:not(:disabled) {
    background: var(--color-gold-light);
    box-shadow: var(--shadow-glow);
  }

  .base-button--primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* Secondary variant */
  .base-button--secondary {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .base-button--secondary:hover:not(:disabled) {
    background: var(--color-bg-card);
    border-color: var(--color-gold);
  }

  /* Ghost variant */
  .base-button--ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .base-button--ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }

  /* Loading spinner */
  .base-button__spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .base-button__content {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    transition: opacity var(--transition-fast);
  }
</style>
