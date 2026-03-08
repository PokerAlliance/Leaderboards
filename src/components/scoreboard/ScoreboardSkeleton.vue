<script setup lang="ts">
interface Props {
  showTeams?: boolean
}

withDefaults(defineProps<Props>(), {
  showTeams: true,
})
</script>

<template>
  <div class="scoreboard-skeleton">
    <header class="scoreboard-skeleton__header">
      <div class="scoreboard-skeleton__logo skeleton-pulse" />
      <div class="scoreboard-skeleton__title">
        <div class="scoreboard-skeleton__name skeleton-pulse" />
        <div class="scoreboard-skeleton__date skeleton-pulse" />
      </div>
      <div class="scoreboard-skeleton__status skeleton-pulse" />
    </header>

    <div class="scoreboard-skeleton__content">
      <section v-if="showTeams" class="scoreboard-skeleton__section">
        <div class="scoreboard-skeleton__section-header skeleton-pulse" />
        <div class="scoreboard-skeleton__team-row skeleton-pulse" />
        <div class="scoreboard-skeleton__team-row skeleton-pulse" />
        <div class="scoreboard-skeleton__team-row skeleton-pulse" />
        <div class="scoreboard-skeleton__team-row skeleton-pulse" />
      </section>

      <section class="scoreboard-skeleton__section">
        <div class="scoreboard-skeleton__section-header skeleton-pulse" />
        <div
          v-for="i in 10"
          :key="i"
          class="scoreboard-skeleton__player-row skeleton-pulse"
        />
      </section>
    </div>

    <footer class="scoreboard-skeleton__footer">
      <div class="scoreboard-skeleton__footer-item skeleton-pulse" />
      <div class="scoreboard-skeleton__footer-item skeleton-pulse" />
    </footer>
  </div>
</template>

<style scoped>
.scoreboard-skeleton {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.skeleton-pulse {
  background: linear-gradient(
    90deg,
    rgba(30, 40, 50, 0.6) 0%,
    rgba(50, 60, 70, 0.6) 50%,
    rgba(30, 40, 50, 0.6) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.scoreboard-skeleton__header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: rgba(10, 15, 20, 0.9);
  border-bottom: 2px solid rgba(212, 175, 55, 0.3);
  backdrop-filter: blur(8px);
}

.scoreboard-skeleton__logo {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.scoreboard-skeleton__title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.scoreboard-skeleton__name {
  width: 60%;
  height: 32px;
}

.scoreboard-skeleton__date {
  width: 40%;
  height: 16px;
}

.scoreboard-skeleton__status {
  width: 80px;
  height: 28px;
  flex-shrink: 0;
}

.scoreboard-skeleton__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.scoreboard-skeleton__section {
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid rgba(212, 175, 55, 0.15);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.scoreboard-skeleton__section-header {
  height: 24px;
  width: 150px;
  margin-bottom: var(--space-2);
}

.scoreboard-skeleton__team-row {
  height: 60px;
}

.scoreboard-skeleton__player-row {
  height: 48px;
}

.scoreboard-skeleton__footer {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  background: rgba(10, 15, 20, 0.85);
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  backdrop-filter: blur(8px);
}

.scoreboard-skeleton__footer-item {
  width: 120px;
  height: 16px;
}

@media (max-width: 640px) {
  .scoreboard-skeleton__header {
    flex-direction: column;
    text-align: center;
  }

  .scoreboard-skeleton__name {
    width: 80%;
    margin: 0 auto;
  }

  .scoreboard-skeleton__date {
    width: 60%;
    margin: 0 auto;
  }

  .scoreboard-skeleton__content {
    padding: var(--space-4);
  }
}
</style>
