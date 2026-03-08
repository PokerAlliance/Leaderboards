<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'

interface Props {
  description: string
}

const props = defineProps<Props>()

const sanitizedDescription = computed(() => {
  if (!props.description) return ''
  return props.description
    .replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
})
</script>

<template>
  <BaseCard variant="glass" padding="lg" class="league-description">
    <template #header>
      <h2 class="league-description__title">About This League</h2>
    </template>

    <div class="league-description__content" v-html="sanitizedDescription" />
  </BaseCard>
</template>

<style scoped>
.league-description__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.league-description__content {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.league-description__content :deep(a) {
  color: var(--color-gold);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.league-description__content :deep(a:hover) {
  color: var(--color-gold-light);
  text-decoration: underline;
}

.league-description__content :deep(br) {
  margin-bottom: var(--space-2);
}
</style>
