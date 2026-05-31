<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useMuckersVanta } from '@/composables/useMuckersVanta'

const bgRef = ref<HTMLElement | null>(null)
const vanta = useMuckersVanta()

onMounted(() => {
  if (bgRef.value) {
    vanta.initVanta(bgRef.value)
  }
})

onBeforeUnmount(() => {
  vanta.destroyVanta()
})
</script>

<template>
  <div class="muckers-layout theme-muckers">
    <div ref="bgRef" id="muckers-bg" class="muckers-bg" />
    <div class="muckers-layout__content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.muckers-layout {
  position: relative;
  min-height: 100vh;
}

.muckers-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.muckers-layout__content {
  position: relative;
  z-index: 1;
}
</style>
