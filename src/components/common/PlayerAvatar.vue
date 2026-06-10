<script setup lang="ts">
import { ref, watch } from 'vue'
import { getLetterAvatarUrl } from '@/utils/avatars'

const props = withDefaults(defineProps<{
  src: string
  username: string
  size?: number
}>(), {
  size: 32,
})

const currentSrc = ref(props.src)
const hasFailed = ref(false)

watch(() => props.src, (newSrc) => {
  currentSrc.value = newSrc
  hasFailed.value = false
})

function onImgError() {
  if (!hasFailed.value) {
    hasFailed.value = true
    currentSrc.value = getLetterAvatarUrl(props.username)
  }
}
</script>

<template>
  <img
    :src="currentSrc"
    :alt="username"
    :width="size"
    :height="size"
    class="player-avatar"
    loading="lazy"
    @error="onImgError"
  />
</template>

<style scoped>
.player-avatar {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
</style>
