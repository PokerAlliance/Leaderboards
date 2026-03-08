<script setup lang="ts">
  import { useMotion } from '@vueuse/motion'
  import { ref, onMounted } from 'vue'

  const dotRef = ref<HTMLElement>()

  onMounted(() => {
    if (dotRef.value) {
      useMotion(dotRef.value, {
        initial: { scale: 1, opacity: 1 },
        enter: {
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1],
          transition: {
            duration: 1500,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      })
    }
  })
</script>

<template>
  <span class="live-badge">
    <span ref="dotRef" class="live-badge__dot" />
    <span class="live-badge__text">LIVE</span>
  </span>
</template>

<style scoped>
  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-full);
  }

  .live-badge__dot {
    width: 8px;
    height: 8px;
    background: var(--color-live);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--color-live);
  }

  .live-badge__text {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: var(--color-live);
    letter-spacing: 0.1em;
  }
</style>
