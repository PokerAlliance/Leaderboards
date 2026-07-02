<script setup lang="ts">
import { ref, computed } from 'vue'
import { sheetsClient } from '@/services/sheets'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { LockableLeague, ImportTournamentResult, ImportTournamentsResponse } from '@/types'

const props = defineProps<{
  league: LockableLeague
  adminKey: string
}>()

const emit = defineEmits<{
  imported: [response: ImportTournamentsResponse]
  lockTournament: [tournamentId: number]
}>()

type ImportTab = 'single' | 'bulk' | 'csv'

const activeTab = ref<ImportTab>('single')
const singleIdInput = ref('')
const bulkInput = ref('')
const csvInput = ref('')

const isImporting = ref(false)
const importProgress = ref(0)
const importTotal = ref(0)
const importError = ref('')
const importResult = ref<ImportTournamentsResponse | null>(null)

const leagueLabel = computed(() => props.league === 'donks' ? 'Donks' : 'Muckers')

function parseTournamentIds(input: string): number[] {
  return input
    .replace(/,/g, ' ')
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(id => !isNaN(id) && id > 0)
}

function parseCsvIds(input: string): number[] {
  const lines = input.trim().split('\n')
  const ids: number[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^tournament_id$/i.test(trimmed) || /^id$/i.test(trimmed)) continue

    const parts = trimmed.split(',')
    for (const part of parts) {
      const id = parseInt(part.trim(), 10)
      if (!isNaN(id) && id > 0) ids.push(id)
    }
  }

  return ids
}

async function handleImport() {
  let ids: number[] = []

  if (activeTab.value === 'single') {
    const id = parseInt(singleIdInput.value, 10)
    if (isNaN(id) || id <= 0) {
      importError.value = 'Please enter a valid tournament ID'
      return
    }
    ids = [id]
  } else if (activeTab.value === 'bulk') {
    ids = parseTournamentIds(bulkInput.value)
    if (ids.length === 0) {
      importError.value = 'No valid tournament IDs found in input'
      return
    }
  } else {
    ids = parseCsvIds(csvInput.value)
    if (ids.length === 0) {
      importError.value = 'No valid tournament IDs found in CSV'
      return
    }
  }

  const uniqueIds = [...new Set(ids)]

  importError.value = ''
  importResult.value = null
  isImporting.value = true
  importTotal.value = uniqueIds.length
  importProgress.value = 0

  try {
    const result = await sheetsClient.importTournaments(
      props.league,
      uniqueIds,
      props.adminKey
    )

    importResult.value = result
    importProgress.value = uniqueIds.length

    if (result.success) {
      singleIdInput.value = ''
      bulkInput.value = ''
      csvInput.value = ''
      emit('imported', result)
    } else {
      importError.value = result.error || 'Import failed'
    }
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Import failed'
  } finally {
    isImporting.value = false
  }
}

function getStateBadgeClass(state: string): string {
  switch (state) {
    case 'finished': return 'pool-import__badge--finished'
    case 'running': return 'pool-import__badge--running'
    case 'registering': return 'pool-import__badge--registering'
    default: return 'pool-import__badge--unknown'
  }
}
</script>

<template>
  <BaseCard class="pool-import">
    <h2 class="pool-import__title">
      <span class="pool-import__title-icon">&#128230;</span>
      Tournament Pool — {{ leagueLabel }}
    </h2>
    <p class="pool-import__desc">
      Import tournament IDs into the pool. The backend will fetch metadata from the Replay API
      and cache them for autolock to use as a fallback.
    </p>

    <!-- Tab bar -->
    <div class="pool-import__tabs">
      <button
        v-for="tab in (['single', 'bulk', 'csv'] as ImportTab[])"
        :key="tab"
        class="pool-import__tab"
        :class="{ 'pool-import__tab--active': activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab === 'single' ? 'Single ID' : tab === 'bulk' ? 'Bulk IDs' : 'CSV' }}
      </button>
    </div>

    <!-- Single ID -->
    <div v-if="activeTab === 'single'" class="pool-import__form">
      <div class="pool-import__input-row">
        <input
          v-model="singleIdInput"
          type="text"
          class="pool-import__input"
          placeholder="e.g., 8323877"
          @keyup.enter="handleImport"
        />
        <BaseButton
          variant="primary"
          :loading="isImporting"
          :disabled="!singleIdInput"
          @click="handleImport"
        >
          Import
        </BaseButton>
      </div>
    </div>

    <!-- Bulk IDs -->
    <div v-if="activeTab === 'bulk'" class="pool-import__form">
      <textarea
        v-model="bulkInput"
        class="pool-import__textarea"
        placeholder="Paste tournament IDs separated by commas, spaces, or newlines:&#10;8323877&#10;8323878, 8323879&#10;8323880"
        rows="5"
      />
      <div class="pool-import__form-actions">
        <span class="pool-import__count">
          {{ parseTournamentIds(bulkInput).length }} ID(s) detected
        </span>
        <BaseButton
          variant="primary"
          :loading="isImporting"
          :disabled="parseTournamentIds(bulkInput).length === 0"
          @click="handleImport"
        >
          Import All
        </BaseButton>
      </div>
    </div>

    <!-- CSV -->
    <div v-if="activeTab === 'csv'" class="pool-import__form">
      <textarea
        v-model="csvInput"
        class="pool-import__textarea"
        placeholder="Paste CSV with tournament IDs (header row optional):&#10;tournament_id&#10;8323877&#10;8323878&#10;8323879"
        rows="5"
      />
      <div class="pool-import__form-actions">
        <span class="pool-import__count">
          {{ parseCsvIds(csvInput).length }} ID(s) detected
        </span>
        <BaseButton
          variant="primary"
          :loading="isImporting"
          :disabled="parseCsvIds(csvInput).length === 0"
          @click="handleImport"
        >
          Import CSV
        </BaseButton>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="isImporting" class="pool-import__progress">
      <div class="pool-import__progress-bar">
        <div
          class="pool-import__progress-fill"
          :style="{ width: importTotal > 0 ? `${(importProgress / importTotal) * 100}%` : '0%' }"
        />
      </div>
      <span class="pool-import__progress-text">
        Importing {{ importTotal }} tournament(s)...
      </span>
    </div>

    <!-- Error -->
    <div v-if="importError" class="pool-import__error">
      {{ importError }}
    </div>

    <!-- Results -->
    <div v-if="importResult && importResult.success" class="pool-import__results">
      <div class="pool-import__results-summary">
        <span class="pool-import__results-stat pool-import__results-stat--imported">
          {{ importResult.importedCount }} imported
        </span>
        <span v-if="importResult.skippedCount" class="pool-import__results-stat pool-import__results-stat--skipped">
          {{ importResult.skippedCount }} already in pool
        </span>
        <span v-if="importResult.errors && importResult.errors.length > 0" class="pool-import__results-stat pool-import__results-stat--errors">
          {{ importResult.errors.length }} error(s)
        </span>
      </div>

      <!-- Imported tournaments table -->
      <table v-if="importResult.imported && importResult.imported.length > 0" class="pool-import__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Date</th>
            <th>{{ league === 'donks' ? 'Cup' : 'Slot' }}</th>
            <th>State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in importResult.imported" :key="t.tournament_id">
            <td class="pool-import__td-id">{{ t.tournament_id }}</td>
            <td>{{ t.name }}</td>
            <td>{{ t.start_date }}</td>
            <td>{{ t.cup_slug || '—' }}</td>
            <td>
              <span class="pool-import__badge" :class="getStateBadgeClass(t.state)">
                {{ t.state }}
              </span>
            </td>
            <td>
              <BaseButton
                v-if="t.state === 'finished'"
                variant="primary"
                size="sm"
                @click="$emit('lockTournament', t.tournament_id)"
              >
                Lock
              </BaseButton>
              <span v-else class="pool-import__pending-lock">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Errors detail -->
      <div v-if="importResult.errors && importResult.errors.length > 0" class="pool-import__errors-detail">
        <h4>Import Errors:</h4>
        <ul>
          <li v-for="(err, i) in importResult.errors" :key="i">
            ID {{ err.id }}: {{ err.error }}
          </li>
        </ul>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.pool-import {
  overflow: visible;
}

.pool-import__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.pool-import__title-icon {
  font-size: 1.2em;
}

.pool-import__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4);
  line-height: 1.5;
}

.pool-import__tabs {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: var(--space-1);
}

.pool-import__tab {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
}

.pool-import__tab:hover {
  color: var(--color-text-primary);
}

.pool-import__tab--active {
  color: var(--color-gold);
  border-bottom-color: var(--color-gold);
}

.pool-import__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.pool-import__input-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.pool-import__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.pool-import__input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.pool-import__textarea {
  width: 100%;
  padding: var(--space-3);
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: all var(--transition-base);
  box-sizing: border-box;
}

.pool-import__textarea:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.pool-import__form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-import__count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.pool-import__progress {
  margin-top: var(--space-3);
}

.pool-import__progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: var(--space-2);
}

.pool-import__progress-fill {
  height: 100%;
  background: var(--color-gold);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pool-import__progress-text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.pool-import__error {
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  margin-top: var(--space-3);
}

.pool-import__results {
  margin-top: var(--space-4);
}

.pool-import__results-summary {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.pool-import__results-stat {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.pool-import__results-stat--imported {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.pool-import__results-stat--skipped {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.pool-import__results-stat--errors {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.pool-import__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.pool-import__table thead {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.pool-import__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pool-import__table td {
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pool-import__td-id {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.pool-import__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: capitalize;
}

.pool-import__badge--finished {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.pool-import__badge--running {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.pool-import__badge--registering {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.pool-import__badge--unknown {
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.pool-import__pending-lock {
  color: var(--color-text-muted);
}

.pool-import__errors-detail {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
}

.pool-import__errors-detail h4 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-error);
}

.pool-import__errors-detail ul {
  margin: 0;
  padding-left: var(--space-4);
}

.pool-import__errors-detail li {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

@media (max-width: 640px) {
  .pool-import__input-row {
    flex-direction: column;
    align-items: stretch;
  }

  .pool-import__form-actions {
    flex-direction: column;
    gap: var(--space-2);
  }

  .pool-import__results-summary {
    flex-direction: column;
    gap: var(--space-2);
  }

  .pool-import__table {
    font-size: var(--text-xs);
  }
}
</style>
