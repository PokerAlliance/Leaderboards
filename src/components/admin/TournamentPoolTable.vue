<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { sheetsClient } from '@/services/sheets'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { LockableLeague, TournamentPoolEntry } from '@/types'

const props = defineProps<{
  league: LockableLeague
  refreshTrigger?: number
}>()

const emit = defineEmits<{
  lockTournament: [tournamentId: number]
}>()

const entries = ref<TournamentPoolEntry[]>([])
const isLoading = ref(false)
const error = ref('')
const showAll = ref(false)

const INITIAL_DISPLAY_COUNT = 15

async function loadPool() {
  if (props.league !== 'donks' && props.league !== 'muckers') return

  isLoading.value = true
  error.value = ''

  try {
    const data = await sheetsClient.getTournamentPool(props.league)
    entries.value = data.sort((a, b) => {
      const dateA = a.start_date || a.added_at || ''
      const dateB = b.start_date || b.added_at || ''
      return dateB.localeCompare(dateA)
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load tournament pool'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPool)

watch(() => props.league, loadPool)
watch(() => props.refreshTrigger, loadPool)

function getStateBadgeClass(state: string): string {
  switch (state) {
    case 'finished': return 'pool-table__badge--finished'
    case 'running': return 'pool-table__badge--running'
    case 'registering': return 'pool-table__badge--registering'
    default: return 'pool-table__badge--unknown'
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'league_api': return 'Auto'
    case 'admin_import': return 'Import'
    case 'admin_single': return 'Manual'
    default: return source
  }
}
</script>

<template>
  <BaseCard class="pool-table">
    <div class="pool-table__header">
      <h3 class="pool-table__title">
        <span class="pool-table__title-icon">&#128202;</span>
        Pool Contents
        <span v-if="entries.length > 0" class="pool-table__count">({{ entries.length }})</span>
      </h3>
      <BaseButton variant="ghost" size="sm" :loading="isLoading" @click="loadPool">
        Refresh
      </BaseButton>
    </div>

    <div v-if="error" class="pool-table__error">{{ error }}</div>

    <div v-if="isLoading && entries.length === 0" class="pool-table__loading">
      Loading pool data...
    </div>

    <div v-else-if="entries.length === 0" class="pool-table__empty">
      No tournaments in pool for this league yet.
    </div>

    <template v-else>
      <div class="pool-table__scroll">
        <table class="pool-table__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>{{ league === 'donks' ? 'Cup' : 'Slot' }}</th>
              <th>State</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in (showAll ? entries : entries.slice(0, INITIAL_DISPLAY_COUNT))"
              :key="entry.tournament_id"
            >
              <td class="pool-table__td-id">{{ entry.tournament_id }}</td>
              <td class="pool-table__td-name">{{ entry.tournament_name || '—' }}</td>
              <td>{{ entry.start_date || '—' }}</td>
              <td>{{ entry.cup_slug || '—' }}</td>
              <td>
                <span class="pool-table__badge" :class="getStateBadgeClass(entry.state)">
                  {{ entry.state }}
                </span>
              </td>
              <td>
                <span class="pool-table__source">{{ getSourceLabel(entry.source) }}</span>
              </td>
              <td>
                <BaseButton
                  v-if="entry.state === 'finished'"
                  variant="primary"
                  size="sm"
                  @click="$emit('lockTournament', entry.tournament_id)"
                >
                  Lock
                </BaseButton>
                <span v-else class="pool-table__no-action">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        v-if="entries.length > INITIAL_DISPLAY_COUNT"
        class="pool-table__toggle"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show less' : `Show all ${entries.length} entries` }}
      </button>
    </template>
  </BaseCard>
</template>

<style scoped>
.pool-table__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.pool-table__title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pool-table__title-icon {
  font-size: 1.1em;
}

.pool-table__count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-normal);
}

.pool-table__error {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}

.pool-table__loading,
.pool-table__empty {
  padding: var(--space-6);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.pool-table__scroll {
  overflow-x: auto;
}

.pool-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.pool-table__table thead {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pool-table__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.pool-table__table td {
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pool-table__td-id {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.pool-table__td-name {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pool-table__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.pool-table__badge--finished {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.pool-table__badge--running {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.pool-table__badge--registering {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.pool-table__badge--unknown {
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.pool-table__source {
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
}

.pool-table__no-action {
  color: var(--color-text-muted);
}

.pool-table__toggle {
  display: block;
  width: 100%;
  padding: var(--space-2);
  margin-top: var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-gold);
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.pool-table__toggle:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.4);
}

@media (max-width: 640px) {
  .pool-table__table {
    font-size: var(--text-xs);
  }

  .pool-table__td-name {
    max-width: 120px;
  }
}
</style>
