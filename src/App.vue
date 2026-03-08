<script setup lang="ts">
  import { RouterView, useRoute } from 'vue-router'
  import { computed } from 'vue'
  import AppHeader from '@/components/common/AppHeader.vue'

  const route = useRoute()
  const showHeader = computed(() => route.name !== 'poc')
</script>

<template>
  <div class="min-h-screen bg-bg-base text-text-primary">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </div>
</template>
