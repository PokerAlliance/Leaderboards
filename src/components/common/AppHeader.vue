<script setup lang="ts">
  import { ref } from 'vue'
  import { RouterLink } from 'vue-router'

  const isMobileMenuOpen = ref(false)

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
  }
</script>

<template>
  <header class="app-header">
    <div class="app-header__container">
      <RouterLink to="/" class="app-header__brand" @click="closeMobileMenu">
        <div class="alliance-logo" aria-label="Poker Alliance" />
        <span class="app-header__title">Poker Alliance</span>
      </RouterLink>

      <nav class="app-header__nav" :class="{ 'app-header__nav--open': isMobileMenuOpen }">
        <RouterLink to="/" class="app-header__link" @click="closeMobileMenu">Home</RouterLink>
        <RouterLink to="/league/anarchy" class="app-header__link app-header__link--anarchy" @click="closeMobileMenu">
          Anarchy
        </RouterLink>
        <RouterLink to="/league/donks" class="app-header__link app-header__link--donks" @click="closeMobileMenu">
          The Donks
        </RouterLink>
        <RouterLink to="/league/dreamweaver" class="app-header__link" @click="closeMobileMenu">
          Dreamweaver
        </RouterLink>
        <RouterLink to="/league/tpp" class="app-header__link" @click="closeMobileMenu">
          Team Play Poker
        </RouterLink>
        <RouterLink to="/league/fpl" class="app-header__link" @click="closeMobileMenu">
          FPL
        </RouterLink>
        <RouterLink to="/admin" class="app-header__link app-header__link--admin" @click="closeMobileMenu">
          Admin
        </RouterLink>
      </nav>

      <button
        class="app-header__menu-btn"
        :class="{ 'app-header__menu-btn--open': isMobileMenuOpen }"
        aria-label="Toggle menu"
        @click="toggleMobileMenu"
      >
        <span class="app-header__menu-icon" />
      </button>
    </div>
  </header>
</template>

<style scoped>
  .app-header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    background: rgba(10, 15, 20, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .app-header__container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-3) var(--space-4);
  }

  .app-header__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    color: var(--color-text-primary);
  }

  .app-header__title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-gold);
    display: none;
  }

  @media (min-width: 640px) {
    .app-header__title {
      display: block;
    }
  }

  .app-header__nav {
    display: none;
    gap: var(--space-1);
  }

  @media (min-width: 768px) {
    .app-header__nav {
      display: flex;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .app-header__nav--open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(10, 15, 20, 0.98);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    padding: var(--space-4);
    gap: var(--space-2);
    animation: slideDown 0.3s ease-out;
  }

  .app-header__nav--open .app-header__link {
    animation: slideDown 0.3s ease-out backwards;
  }

  .app-header__nav--open .app-header__link:nth-child(1) {
    animation-delay: 0.05s;
  }
  .app-header__nav--open .app-header__link:nth-child(2) {
    animation-delay: 0.1s;
  }
  .app-header__nav--open .app-header__link:nth-child(3) {
    animation-delay: 0.15s;
  }
  .app-header__nav--open .app-header__link:nth-child(4) {
    animation-delay: 0.2s;
  }
  .app-header__nav--open .app-header__link:nth-child(5) {
    animation-delay: 0.25s;
  }
  .app-header__nav--open .app-header__link:nth-child(6) {
    animation-delay: 0.3s;
  }
  .app-header__nav--open .app-header__link:nth-child(7) {
    animation-delay: 0.35s;
  }

  .app-header__link {
    position: relative;
    padding: var(--space-2) var(--space-4);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;
  }

  .app-header__link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--color-gold);
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  .app-header__link:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .app-header__link:hover::after {
    width: 60%;
  }

  .app-header__link.router-link-active {
    color: var(--color-gold);
    background: rgba(212, 175, 55, 0.1);
  }

  .app-header__link.router-link-active::after {
    width: 80%;
  }

  .app-header__link--anarchy {
    color: #ef4444;
  }

  .app-header__link--anarchy:hover {
    color: #f87171;
  }

  .app-header__link--anarchy::after {
    background: #ef4444;
  }

  .app-header__link--anarchy.router-link-active {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .app-header__link--donks {
    color: #c9a227;
  }

  .app-header__link--donks:hover {
    color: #e4c95a;
  }

  .app-header__link--donks::after {
    background: #c9a227;
  }

  .app-header__link--donks.router-link-active {
    color: #c9a227;
    background: rgba(201, 162, 39, 0.1);
  }

  .app-header__link--admin {
    color: var(--color-text-muted);
  }

  .app-header__menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  @media (min-width: 768px) {
    .app-header__menu-btn {
      display: none;
    }
  }

  .app-header__menu-icon {
    position: relative;
    width: 24px;
    height: 2px;
    background: var(--color-text-primary);
    transition: all var(--transition-fast);
  }

  .app-header__menu-icon::before,
  .app-header__menu-icon::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: var(--color-text-primary);
    transition: all var(--transition-fast);
  }

  .app-header__menu-icon::before {
    top: -7px;
  }

  .app-header__menu-icon::after {
    top: 7px;
  }

  .app-header__menu-btn--open .app-header__menu-icon {
    background: transparent;
  }

  .app-header__menu-btn--open .app-header__menu-icon::before {
    top: 0;
    transform: rotate(45deg);
  }

  .app-header__menu-btn--open .app-header__menu-icon::after {
    top: 0;
    transform: rotate(-45deg);
  }
</style>
