<script setup lang="ts">
/**
 * ComingSoon Component
 * Reusable placeholder for leagues under development
 */

interface Props {
  leagueName: string
  description?: string
  themeColor?: string
}

withDefaults(defineProps<Props>(), {
  description: 'This league is currently under development.',
  themeColor: '#d4af37',
})
</script>

<template>
  <div class="coming-soon">
    <div class="coming-soon__bg"></div>

    <div class="coming-soon__container">
      <div class="coming-soon__content">
        <div class="coming-soon__badge">COMING SOON</div>

        <h1 class="coming-soon__title" :style="{ color: themeColor }">
          {{ leagueName }}
        </h1>

        <p class="coming-soon__description">
          {{ description }}
        </p>

        <div class="coming-soon__divider" :style="{ backgroundColor: themeColor }"></div>

        <p class="coming-soon__message">
          We're working hard to bring you an amazing league experience.
          <br />
          Stay tuned for updates!
        </p>

        <router-link to="/" class="coming-soon__back">
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coming-soon {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon__bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--color-bg-base) 0%,
    #1a242f 50%,
    var(--color-bg-base) 100%
  );
  z-index: 0;
}

.coming-soon__bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(212, 175, 55, 0.05) 0%,
    transparent 50%
  );
}

.coming-soon__container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-6);
}

.coming-soon__content {
  text-align: center;
  background: rgba(19, 27, 35, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-12) var(--space-8);
  backdrop-filter: blur(8px);
}

.coming-soon__badge {
  display: inline-block;
  padding: var(--space-1) var(--space-4);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-gold);
  letter-spacing: 0.2em;
  margin-bottom: var(--space-6);
}

.coming-soon__title {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-4);
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.coming-soon__description {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
  line-height: 1.6;
}

.coming-soon__divider {
  width: 80px;
  height: 3px;
  margin: 0 auto var(--space-6);
  border-radius: var(--radius-full);
  opacity: 0.6;
}

.coming-soon__message {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.8;
  margin: 0 0 var(--space-8);
}

.coming-soon__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-gold);
  text-decoration: none;
  transition: all var(--transition-base);
}

.coming-soon__back:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--color-gold);
}

@media (max-width: 640px) {
  .coming-soon__content {
    padding: var(--space-8) var(--space-4);
  }

  .coming-soon__title {
    font-size: var(--text-3xl);
  }

  .coming-soon__description {
    font-size: var(--text-base);
  }
}
</style>
