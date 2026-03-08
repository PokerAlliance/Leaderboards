<script setup lang="ts">
  import { ref } from 'vue'
  import BaseButton from '@/components/common/BaseButton.vue'
  import ScoreboardPOC from '@/components/scoreboard/ScoreboardPOC.vue'
  import { mockDreamweaverGame, mockLiveDreamweaverGame } from '@/mocks/dreamweaver-game'

  const showLive = ref(false)
  const currentTournament = ref(mockDreamweaverGame)

  const toggleGameState = () => {
    showLive.value = !showLive.value
    currentTournament.value = showLive.value ? mockLiveDreamweaverGame : mockDreamweaverGame
  }
</script>

<template>
  <div class="poc-view">
    <section class="poc-view__scoreboard-section">
      <div class="poc-view__scoreboard-controls">
        <BaseButton @click="toggleGameState" variant="secondary">
          {{ showLive ? 'Show Finished Game' : 'Show Live Game' }}
        </BaseButton>
      </div>
      <ScoreboardPOC :tournament="currentTournament" />
    </section>
  </div>
</template>

<style scoped>
  .poc-view {
    background: var(--color-bg-base);
  }

  .poc-view__scoreboard-section {
    position: relative;
  }

  .poc-view__scoreboard-controls {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 100;
  }

  .poc-view__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  .poc-view__section {
    margin-bottom: var(--space-12);
  }

  .poc-view__section-title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--color-gold);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
  }

  .poc-view__controls {
    margin-bottom: var(--space-4);
  }

  .poc-view__leagues {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-4);
  }

  .poc-view__component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-6);
  }

  .poc-view__component {
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .poc-view__component h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-4);
  }

  .poc-view__button-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .poc-view__card-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .poc-view__logo-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .poc-view__color-row {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .poc-view__color {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 640px) {
    .poc-view__content {
      padding: var(--space-4);
    }
  }
</style>
