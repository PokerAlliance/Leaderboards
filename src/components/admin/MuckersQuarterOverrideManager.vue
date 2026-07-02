<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sheetsClient } from '@/services/sheets'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { MuckersQuarterOverride } from '@/types'

const props = defineProps<{
  adminKey: string
}>()

const overrides = ref<MuckersQuarterOverride[]>([])
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')

const gameDate = ref('')
const slot = ref('*')
const targetQuarter = ref('Q2')
const targetYear = ref(new Date().getFullYear())
const reason = ref('')
const isAdding = ref(false)
const addError = ref('')

const SLOTS = [
  { value: '*', label: 'All slots on this date' },
  { value: 'A', label: 'Slot A' },
  { value: 'B', label: 'Slot B' },
  { value: 'C', label: 'Slot C' },
  { value: 'D', label: 'Slot D' },
]

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

async function loadOverrides() {
  isLoading.value = true
  error.value = ''

  try {
    const result = await sheetsClient.manageMuckersQuarterOverride('list', props.adminKey)
    if (result.success && result.overrides) {
      overrides.value = result.overrides
    } else {
      error.value = result.error || 'Failed to load overrides'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load overrides'
  } finally {
    isLoading.value = false
  }
}

async function handleAddOverride() {
  if (!gameDate.value) {
    addError.value = 'Game date is required'
    return
  }

  addError.value = ''
  successMessage.value = ''
  isAdding.value = true

  try {
    const result = await sheetsClient.manageMuckersQuarterOverride('add', props.adminKey, {
      game_date: gameDate.value,
      slot: slot.value,
      target_quarter: targetQuarter.value,
      target_year: targetYear.value,
      reason: reason.value,
    })

    if (result.success) {
      successMessage.value = result.message || 'Override added'
      gameDate.value = ''
      reason.value = ''
      await loadOverrides()
    } else {
      addError.value = result.error || 'Failed to add override'
    }
  } catch (err) {
    addError.value = err instanceof Error ? err.message : 'Failed to add override'
  } finally {
    isAdding.value = false
  }
}

async function handleRemoveOverride(override: MuckersQuarterOverride) {
  successMessage.value = ''

  try {
    const result = await sheetsClient.manageMuckersQuarterOverride('remove', props.adminKey, {
      game_date: override.game_date,
      slot: override.slot,
    })

    if (result.success) {
      successMessage.value = result.message || 'Override removed'
      await loadOverrides()
    } else {
      error.value = result.error || 'Failed to remove override'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to remove override'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

onMounted(loadOverrides)
</script>

<template>
  <BaseCard class="qo-manager">
    <h2 class="qo-manager__title">
      <span class="qo-manager__title-icon">&#128197;</span>
      Quarter Overrides
      <span class="qo-manager__title-badge">Muckers Only</span>
    </h2>
    <p class="qo-manager__desc">
      Assign makeup game dates to a different quarter than their calendar date implies.
      Overrides affect both the data endpoint and autolock gap detection.
    </p>

    <!-- Add override form -->
    <div class="qo-manager__form">
      <h3 class="qo-manager__form-title">Add Override</h3>

      <div class="qo-manager__form-grid">
        <div class="qo-manager__field">
          <label class="qo-manager__label">Game Date</label>
          <input
            v-model="gameDate"
            type="date"
            class="qo-manager__input"
          />
        </div>

        <div class="qo-manager__field">
          <label class="qo-manager__label">Slot</label>
          <select v-model="slot" class="qo-manager__select">
            <option v-for="s in SLOTS" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>

        <div class="qo-manager__field">
          <label class="qo-manager__label">Target Quarter</label>
          <select v-model="targetQuarter" class="qo-manager__select">
            <option v-for="q in QUARTERS" :key="q" :value="q">{{ q }}</option>
          </select>
        </div>

        <div class="qo-manager__field">
          <label class="qo-manager__label">Target Year</label>
          <input
            v-model.number="targetYear"
            type="number"
            class="qo-manager__input"
            min="2020"
            max="2040"
          />
        </div>

        <div class="qo-manager__field qo-manager__field--wide">
          <label class="qo-manager__label">Reason</label>
          <input
            v-model="reason"
            type="text"
            class="qo-manager__input"
            placeholder="e.g., Makeup for cancelled W12 game"
          />
        </div>
      </div>

      <div class="qo-manager__form-actions">
        <BaseButton
          variant="primary"
          :loading="isAdding"
          :disabled="!gameDate"
          @click="handleAddOverride"
        >
          Add Override
        </BaseButton>
      </div>

      <div v-if="addError" class="qo-manager__error">{{ addError }}</div>
      <div v-if="successMessage" class="qo-manager__success">{{ successMessage }}</div>
    </div>

    <!-- Active overrides table -->
    <div class="qo-manager__list">
      <div class="qo-manager__list-header">
        <h3 class="qo-manager__list-title">Active Overrides</h3>
        <BaseButton variant="ghost" size="sm" :loading="isLoading" @click="loadOverrides">
          Refresh
        </BaseButton>
      </div>

      <div v-if="error" class="qo-manager__error">{{ error }}</div>

      <div v-if="isLoading && overrides.length === 0" class="qo-manager__empty">
        Loading overrides...
      </div>

      <div v-else-if="overrides.length === 0" class="qo-manager__empty">
        No quarter overrides configured.
      </div>

      <table v-else class="qo-manager__table">
        <thead>
          <tr>
            <th>Game Date</th>
            <th>Slot</th>
            <th>Counts Toward</th>
            <th>Reason</th>
            <th>Created By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ov, idx) in overrides" :key="idx">
            <td>{{ formatDate(ov.game_date) }}</td>
            <td>
              <span class="qo-manager__slot-badge">
                {{ ov.slot === '*' ? 'All' : ov.slot }}
              </span>
            </td>
            <td>
              <span class="qo-manager__quarter-indicator">
                {{ ov.target_quarter }} {{ ov.target_year }}
              </span>
            </td>
            <td class="qo-manager__td-reason">{{ ov.reason || '—' }}</td>
            <td class="qo-manager__td-muted">{{ ov.created_by || '—' }}</td>
            <td>
              <BaseButton
                variant="ghost"
                size="sm"
                @click="handleRemoveOverride(ov)"
              >
                Remove
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseCard>
</template>

<style scoped>
.qo-manager__title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.qo-manager__title-icon {
  font-size: 1.2em;
}

.qo-manager__title-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: #4682B4;
  background: rgba(70, 130, 180, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-left: var(--space-2);
}

.qo-manager__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4);
  line-height: 1.5;
}

.qo-manager__form {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  background: rgba(255, 255, 255, 0.02);
}

.qo-manager__form-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.qo-manager__form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.qo-manager__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.qo-manager__field--wide {
  grid-column: 1 / -1;
}

.qo-manager__label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.qo-manager__input,
.qo-manager__select {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.qo-manager__input:focus,
.qo-manager__select:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}

.qo-manager__form-actions {
  display: flex;
  justify-content: flex-end;
}

.qo-manager__error {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  margin-top: var(--space-3);
}

.qo-manager__success {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
  margin-top: var(--space-3);
}

.qo-manager__list {
  margin-top: var(--space-3);
}

.qo-manager__list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.qo-manager__list-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.qo-manager__empty {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.qo-manager__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.qo-manager__table thead {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qo-manager__table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.qo-manager__table td {
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.qo-manager__slot-badge {
  display: inline-block;
  padding: 1px 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
  border-radius: var(--radius-sm);
}

.qo-manager__quarter-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-radius: var(--radius-full);
}

.qo-manager__td-reason {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qo-manager__td-muted {
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .qo-manager__form-grid {
    grid-template-columns: 1fr;
  }

  .qo-manager__table {
    font-size: var(--text-xs);
  }
}
</style>
