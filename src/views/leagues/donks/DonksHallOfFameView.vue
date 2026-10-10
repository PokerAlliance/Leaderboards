<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { parseSearchQuery, matchesSearch } from '@/utils/search'
import { getLeagueConfig } from '@/config/leagues'
import { useDonksStore } from '@/composables/useDonksStore'
import DonksLoadingGate from './components/DonksLoadingGate.vue'
import DonksHallOfFameGrid from './components/DonksHallOfFameGrid.vue'
import DonksHallOfFameStatsBar from './components/DonksHallOfFameStatsBar.vue'
import DonksUserModal from './components/DonksUserModal.vue'

const store = useDonksStore()
const leagueConfig = getLeagueConfig('donks')
const backgroundStyle = computed(() => ({
  backgroundImage: `url(${leagueConfig.backgroundImage})`,
}))

const entries = computed(() => store.getHallOfFame())

// ─── Search ──────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')

const rankMap = computed(() => new Map(entries.value.map((e, i) => [e.username, i + 1])))
const rankOf = (username: string) => rankMap.value.get(username) ?? 0

const parsedQuery = computed(() => parseSearchQuery(query.value))

const exactMatches = computed(() =>
  entries.value.filter((e) => matchesSearch(e.username, parsedQuery.value, rankOf(e.username))),
)

/** Typo-tolerant fallback, only used when nothing matches exactly */
const fuzzyMatches = computed(() =>
  exactMatches.value.length > 0 || parsedQuery.value.isEmpty
    ? []
    : entries.value.filter((e) => matchesSearch(e.username, parsedQuery.value, rankOf(e.username), true)),
)

const isFuzzy = computed(() => exactMatches.value.length === 0 && fuzzyMatches.value.length > 0)
const visibleEntries = computed(() => (isFuzzy.value ? fuzzyMatches.value : exactMatches.value))

const emptyText = computed(() =>
  parsedQuery.value.isEmpty
    ? 'No Hall of Fame data available yet.'
    : `No inductee matches “${query.value.trim()}”.`,
)

// Keep ?q= in the URL so a search can be shared or survives a refresh
watch(query, (q) => {
  const trimmed = q.trim()
  router.replace({ query: { ...route.query, q: trimmed || undefined } })
})

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  if (e.key === '/' && !typing) {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

function onSearchKeydown(e: KeyboardEvent) {
  // Escape with the player modal open only closes the modal (handled by the modal)
  if (e.key === 'Escape' && !selectedUsername.value) {
    if (query.value) query.value = ''
    else searchInput.value?.blur()
  }
  // Enter opens the player when the search narrows to exactly one inductee
  if (e.key === 'Enter' && visibleEntries.value.length === 1) {
    selectedUsername.value = visibleEntries.value[0]!.username
    searchInput.value?.blur()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const selectedUsername = ref<string | null>(null)

function onRowClick(username: string) {
  selectedUsername.value = username
}
</script>

<template>
  <main class="donks-page theme-donks">
    <div class="donks-bg" :style="backgroundStyle" />
    <DonksLoadingGate>
      <div class="hof-page">
        <!-- Header -->
        <div class="hof-page__header donks-card">
          <RouterLink to="/league/donks" class="donks-btn donks-btn--outline hof-page__back">
            ← Back to Donks
          </RouterLink>
          <h1 class="hof-page__title">Donks Hall of Fame</h1>
          <p class="hof-page__subtitle">Every player who has ever won a Donks award</p>
        </div>

        <!-- Search -->
        <div class="hof-search" role="search">
          <label class="hof-search__field">
            <i class="i-lucide-search hof-search__icon" aria-hidden="true" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              role="searchbox"
              class="hof-search__input"
              placeholder="Search inductees…  e.g. fatn, shadow  or  #3"
              aria-label="Search Hall of Fame players"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              enterkeyhint="search"
              @keydown="onSearchKeydown"
            />
            <button
              v-if="query"
              type="button"
              class="hof-search__clear"
              aria-label="Clear search"
              @click="clearSearch"
            >
              <i class="i-lucide-x" />
            </button>
            <kbd v-else class="hof-search__kbd" aria-hidden="true">/</kbd>
          </label>
          <p class="hof-search__meta" aria-live="polite">
            <template v-if="parsedQuery.isEmpty">
              {{ entries.length }} inductees · separate names with commas to compare players
            </template>
            <template v-else-if="isFuzzy">
              No exact match — showing {{ visibleEntries.length }} close match{{ visibleEntries.length === 1 ? '' : 'es' }}
            </template>
            <template v-else-if="visibleEntries.length === 0">
              No matches — try fewer letters, or press Esc to clear
            </template>
            <template v-else>
              Showing {{ visibleEntries.length }} of {{ entries.length }} inductees<template v-if="visibleEntries.length === 1"> · press Enter to open</template>
            </template>
          </p>
        </div>

        <!-- Explainer -->
        <!-- <DonksHallOfFameExplainer /> -->

        <!-- Hall of Fame Grid -->
        <section class="hof-page__grid-section">
          <DonksHallOfFameGrid
            :entries="visibleEntries"
            :get-avatar="store.getAvatar"
            :rank-of="rankOf"
            :highlight="isFuzzy ? '' : parsedQuery.highlight"
            :empty-text="emptyText"
            @row-click="onRowClick"
          />
        </section>

        <!-- Stats bar -->
        <DonksHallOfFameStatsBar :entries="entries" />

        <!-- Footer -->
        <footer class="hof-page__footer donks-home__frosted">
          <div class="hof-page__footer-divider" />
          <div class="hof-page__footer-suits">♠ ♥ ♦ ♣</div>
        </footer>
      </div>
    </DonksLoadingGate>

    <DonksUserModal
      :username="selectedUsername"
      game-type="holdem"
      @close="selectedUsername = null"
    />
  </main>
</template>

<style scoped>
.hof-page {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6, 1.5rem);
  padding-top: var(--space-8, 2rem);
}

.hof-page__header {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  border-top: 3px solid var(--color-donks-gold);
  margin-bottom: 1rem;
  position: relative;
}

.hof-page__back {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.72rem;
}

.hof-page__title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  color: var(--color-donks-text);
  margin: 0 0 0.35rem;
  text-shadow: 0 2px 12px rgba(201, 162, 39, 0.15);
}

.hof-page__subtitle {
  font-size: 0.88rem;
  color: var(--color-donks-text-secondary);
  margin: 0;
}

.hof-search {
  position: sticky;
  top: 64px;
  z-index: 5;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 162, 39, 0.35);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
}

.hof-search__field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: #fff;
  border: 2px solid var(--color-donks-gold);
  transition: box-shadow 0.15s ease;
}

.hof-search__field:focus-within {
  box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.25);
}

.hof-search__icon {
  flex-shrink: 0;
  font-size: 1.15rem;
  color: var(--color-donks-gold-dark);
}

.hof-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 1rem;
  color: var(--color-donks-text);
}

.hof-search__clear {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.07);
  color: var(--color-donks-text-secondary);
  cursor: pointer;
}

.hof-search__clear:hover {
  background: rgba(0, 0, 0, 0.12);
}

.hof-search__kbd {
  flex-shrink: 0;
  padding: 0.05rem 0.45rem;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-donks-text-muted);
}

.hof-search__meta {
  margin: 0.45rem 0.25rem 0;
  font-size: 0.75rem;
  color: var(--color-donks-text-muted);
}

.hof-page__grid-section {
  margin-bottom: 1rem;
}

.hof-page__footer {
  text-align: center;
  padding: 1.25rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.hof-page__footer-divider {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-donks-gold), transparent);
  border-radius: 2px;
}

.hof-page__footer-suits {
  font-size: 1rem;
  letter-spacing: 0.5em;
  color: var(--color-donks-gold);
  opacity: 0.25;
  font-weight: 700;
}

@media (max-width: 600px) {
  .hof-page__header {
    padding: 1.5rem 1rem 1rem;
  }

  .hof-page__back {
    position: static;
    margin-bottom: 0.75rem;
  }

  .hof-search__kbd {
    display: none;
  }
}
</style>
