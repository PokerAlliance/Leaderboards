<script setup lang="ts">
  defineProps<{
    leagueSlug: string
    tournamentId: string
  }>()
</script>

<template>
  <main class="p-8">
    <h1 class="text-3xl font-bold text-gold">Game Scoreboard</h1>
    <p class="text-text-secondary mt-4">
      League: {{ leagueSlug }} | Tournament: {{ tournamentId }}
    </p>
    <p class="text-text-muted mt-2">Game View - Sprint 4 will add content</p>
    <nav class="mt-8 flex gap-4">
      <router-link :to="`/league/${leagueSlug}`" class="btn-primary">Back to League</router-link>
    </nav>
  </main>
</template>
