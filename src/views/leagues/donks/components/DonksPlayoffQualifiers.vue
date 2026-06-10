<script setup lang="ts">
import { computed, ref } from 'vue'
import PlayerAvatar from '@/components/common/PlayerAvatar.vue'
import type {
  DonksPlayoffQualifier,
  DonksPlayoffConfig,
  DonksPlayoffPhase,
  DonksCupSlug,
} from '@/types/donks'
import { getDonksCup } from '@/config/donks'

const HOLDEM_CUP_ORDER: DonksCupSlug[] = ['badonkidonk', 'puggywug', 'blackwidow', 'ladycon']

const props = defineProps<{
  qualifiers: DonksPlayoffQualifier[]
  config: DonksPlayoffConfig
  phase: DonksPlayoffPhase
  getAvatar: (username: string) => string
}>()

const emit = defineEmits<{
  'row-click': [username: string]
}>()

const collapsedSections = ref<Set<string>>(new Set(
  [...HOLDEM_CUP_ORDER, 'omaha_wildcard']
))
function toggleSection(key: string) {
  if (collapsedSections.value.has(key)) {
    collapsedSections.value.delete(key)
  } else {
    collapsedSections.value.add(key)
  }
}

interface QualGroup {
  key: string
  cupSlug: DonksCupSlug | 'omaha_wildcard'
  label: string
  color: string
  icon: 'cup' | 'wildcard'
  newQualifiers: DonksPlayoffQualifier[]
  deduped: Array<{ qualifier: DonksPlayoffQualifier; originalCup: string }>
}

const qualGroups = computed<QualGroup[]>(() => {
  const seen = new Set<string>()
  const groups: QualGroup[] = []

  for (const cupSlug of HOLDEM_CUP_ORDER) {
    const cup = getDonksCup(cupSlug)
    if (!cup) continue
    const cupQualifiers = props.qualifiers.filter((q) => q.qualifiedVia === cupSlug)
    const newQ: DonksPlayoffQualifier[] = []
    const duped: Array<{ qualifier: DonksPlayoffQualifier; originalCup: string }> = []

    for (const q of cupQualifiers) {
      if (seen.has(q.username)) {
        continue
      }
      seen.add(q.username)
      newQ.push(q)
    }

    // Also find players who qualified via earlier cups but are top-N in this cup too
    const allCupPlayers = props.qualifiers.filter((q) => {
      if (q.qualifiedVia === cupSlug) return false
      if (q.qualifiedVia === 'omaha_wildcard') return false
      const ranks = q.allCupRanks ?? {}
      return ranks[cupSlug] !== undefined && ranks[cupSlug]! <= props.config.qualifiersPerCup
    })
    for (const q of allCupPlayers) {
      const origCup = getDonksCup(q.qualifiedVia as DonksCupSlug)
      duped.push({ qualifier: q, originalCup: origCup?.name ?? q.qualifiedVia })
    }

    groups.push({
      key: cupSlug,
      cupSlug,
      label: cup.name,
      color: cup.color,
      icon: 'cup',
      newQualifiers: newQ,
      deduped: duped,
    })
  }

  // Omaha wild cards
  const wildcards = props.qualifiers.filter((q) => q.qualifiedVia === 'omaha_wildcard')
  if (wildcards.length > 0) {
    const lastWcRank = Math.max(...wildcards.map((q) => q.omahaCompositeRank ?? q.qualifyingRank))
    const omahaSkipped = props.qualifiers
      .filter((q) =>
        q.qualifiedVia !== 'omaha_wildcard' &&
        q.omahaCompositeRank !== undefined &&
        q.omahaCompositeRank <= lastWcRank
      )
      .sort((a, b) => (a.omahaCompositeRank ?? 0) - (b.omahaCompositeRank ?? 0))
      .map((q) => {
        const origCup = getDonksCup(q.qualifiedVia as DonksCupSlug)
        return { qualifier: q, originalCup: origCup?.name ?? q.qualifiedVia }
      })

    groups.push({
      key: 'omaha_wildcard',
      cupSlug: 'omaha_wildcard',
      label: 'Omaha Wild Cards',
      color: '#2d6a4f',
      icon: 'wildcard',
      newQualifiers: wildcards,
      deduped: omahaSkipped,
    })
  }

  return groups
})

const summaryStats = computed(() => {
  const holdemCount = props.qualifiers.filter((q) => q.qualifiedVia !== 'omaha_wildcard').length
  const omahaCount = props.qualifiers.filter((q) => q.qualifiedVia === 'omaha_wildcard').length
  return { total: props.qualifiers.length, holdem: holdemCount, omaha: omahaCount }
})

function otherCupPills(q: DonksPlayoffQualifier): Array<{ slug: DonksCupSlug; shortName: string; color: string; rank: number }> {
  const ranks = q.allCupRanks ?? {}
  const pills: Array<{ slug: DonksCupSlug; shortName: string; color: string; rank: number }> = []
  for (const [slug, rank] of Object.entries(ranks)) {
    if (slug === q.qualifiedVia) continue
    const cup = getDonksCup(slug as DonksCupSlug)
    if (cup) {
      pills.push({ slug: slug as DonksCupSlug, shortName: cup.shortName, color: cup.color, rank })
    }
  }
  return pills
}
</script>

<template>
  <div class="pq">
    <!-- Projected warning -->
    <div v-if="phase === 'pre_playoffs'" class="pq__warning">
      <i class="i-heroicons-exclamation-triangle-20-solid pq__warning-icon" />
      <span>These qualifiers are based on current standings and may change before the playoff window begins.</span>
    </div>

    <!-- Cup groups -->
    <div v-for="(group, gi) in qualGroups" :key="group.key" class="pq__group" :style="{ '--gi': gi }">
      <button
        class="pq__group-header"
        :style="{ '--group-color': group.color }"
        @click="toggleSection(group.key)"
      >
        <span class="pq__group-dot" />
        <span v-if="group.icon === 'wildcard'" class="pq__group-wc-icon">
          <i class="i-lucide-clover" />
        </span>
        <span class="pq__group-name">{{ group.label }}</span>
        <span class="pq__group-count">{{ group.newQualifiers.length }} player{{ group.newQualifiers.length === 1 ? '' : 's' }}</span>
        <i
          class="i-heroicons-chevron-down-20-solid pq__group-chevron"
          :class="{ 'pq__group-chevron--collapsed': collapsedSections.has(group.key) }"
        />
      </button>

      <Transition name="pq-slide">
        <div v-if="!collapsedSections.has(group.key)" class="pq__group-body">
          <!-- New qualifiers -->
          <div
            v-for="(q, idx) in group.newQualifiers"
            :key="q.username"
            class="pq__row"
            :class="{ 'pq__row--alt': idx % 2 === 1 }"
            @click="emit('row-click', q.username)"
          >
            <span class="pq__rank">#{{ q.qualifyingRank }}</span>
            <PlayerAvatar :src="getAvatar(q.username)" :username="q.username" class="pq__avatar" />
            <span class="pq__name">{{ q.username }}</span>
            <span class="pq__pts">{{ q.qualifyingPoints.toLocaleString() }} pts</span>
            <span class="pq__pills">
              <span
                v-for="pill in otherCupPills(q)"
                :key="pill.slug"
                class="pq__pill"
                :title="`Also #${pill.rank} in ${pill.shortName}`"
              >
                <span class="pq__pill-dot" :style="{ background: pill.color }" />
                {{ pill.shortName }}
              </span>
            </span>
          </div>

          <!-- De-duplicated players -->
          <div
            v-for="dup in group.deduped"
            :key="dup.qualifier.username + '-dup'"
            class="pq__row pq__row--dedup"
          >
            <span class="pq__rank pq__rank--dedup">#{{ group.cupSlug === 'omaha_wildcard' ? (dup.qualifier.omahaCompositeRank ?? '—') : (dup.qualifier.allCupRanks?.[group.cupSlug as DonksCupSlug] ?? '—') }}</span>
            <PlayerAvatar :src="getAvatar(dup.qualifier.username)" :username="dup.qualifier.username" class="pq__avatar pq__avatar--dedup" />
            <span class="pq__name pq__name--dedup">{{ dup.qualifier.username }}</span>
            <span class="pq__dedup-note">already qualified via {{ dup.originalCup }}</span>
          </div>

          <div v-if="group.newQualifiers.length === 0 && group.deduped.length === 0" class="pq__empty">
            No qualifiers in this group
          </div>
        </div>
      </Transition>
    </div>

    <!-- Summary bar -->
    <div class="pq__summary">
      <i class="i-heroicons-user-group-20-solid pq__summary-icon" />
      <span>
        <strong>{{ summaryStats.total }}</strong> players qualified
        &mdash; {{ summaryStats.holdem }} via Hold'em Cups, {{ summaryStats.omaha }} via Omaha Wild Card
      </span>
    </div>
  </div>
</template>

<style scoped>
.pq {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ─── Warning Banner ────────────────────────────────────── */

.pq__warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: rgba(146, 64, 14, 0.06);
  border: 1px solid rgba(146, 64, 14, 0.2);
  font-size: 0.72rem;
  color: #92400e;
  font-style: italic;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.pq__warning-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 1px;
}

/* ─── Group ─────────────────────────────────────────────── */

.pq__group {
  border-radius: 8px;
  animation: pqFadeSlideUp 0.35s ease both;
  animation-delay: calc(var(--gi, 0) * 0.08s);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.pq__group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: color-mix(in srgb, var(--group-color) 8%, transparent);
  border: none;
  border-left: 3px solid var(--group-color);
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}

.pq__group-header:hover {
  background: color-mix(in srgb, var(--group-color) 14%, transparent);
}

.pq__group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--group-color);
  flex-shrink: 0;
}

.pq__group-wc-icon {
  width: 16px;
  height: 16px;
  color: var(--group-color);
  flex-shrink: 0;
}

.pq__group-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-donks-text);
  flex: 1;
}

.pq__group-count {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-donks-text-muted);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
}

.pq__group-chevron {
  width: 14px;
  height: 14px;
  color: var(--color-donks-text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.pq__group-chevron--collapsed {
  transform: rotate(-90deg);
}

/* ─── Group Body ────────────────────────────────────────── */

.pq__group-body {
  background: var(--color-donks-card-bg, rgba(255, 255, 255, 0.5));
}

/* ─── Row ───────────────────────────────────────────────── */

.pq__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  transition: background 0.12s ease;
}

.pq__row:hover {
  background: rgba(201, 162, 39, 0.04);
}

.pq__row--alt {
  background: rgba(0, 0, 0, 0.015);
}

.pq__row--alt:hover {
  background: rgba(201, 162, 39, 0.06);
}

.pq__row--dedup {
  cursor: default;
  opacity: 0.45;
}

.pq__row--dedup:hover {
  background: transparent;
}

.pq__rank {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-donks-text-secondary);
  min-width: 28px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.pq__rank--dedup {
  font-weight: 400;
}

.pq__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.pq__avatar--dedup {
  opacity: 0.5;
}

.pq__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-donks-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pq__name--dedup {
  font-weight: 400;
  color: var(--color-donks-text-muted);
}

.pq__pts {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-donks-text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.pq__dedup-note {
  font-size: 0.62rem;
  font-style: italic;
  color: var(--color-donks-text-muted);
  flex-shrink: 0;
}

/* ─── Pills (Also Top-15 In) ───────────────────────────── */

.pq__pills {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.pq__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.35rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 0.58rem;
  font-weight: 600;
  color: var(--color-donks-text-muted);
  white-space: nowrap;
}

.pq__pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ─── Empty ─────────────────────────────────────────────── */

.pq__empty {
  padding: 0.75rem 0.85rem;
  font-size: 0.72rem;
  color: var(--color-donks-text-muted);
  font-style: italic;
}

/* ─── Summary Bar ───────────────────────────────────────── */

.pq__summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  background: rgba(201, 162, 39, 0.05);
  border: 1px solid rgba(201, 162, 39, 0.15);
  font-size: 0.72rem;
  color: var(--color-donks-text-secondary);
  margin-top: 0.25rem;
}

.pq__summary strong {
  color: var(--color-donks-text);
}

.pq__summary-icon {
  width: 16px;
  height: 16px;
  color: var(--color-donks-gold);
  flex-shrink: 0;
}

/* ─── Transition ────────────────────────────────────────── */

.pq-slide-enter-active,
.pq-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.pq-slide-enter-from,
.pq-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.pq-slide-enter-to,
.pq-slide-leave-from {
  opacity: 1;
  max-height: 2000px;
}

/* ─── Entrance Animation ────────────────────────────────── */

@keyframes pqFadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .pq__group { animation: none; }
}

/* ─── Mobile ────────────────────────────────────────────── */

@media (max-width: 600px) {
  .pq__pills {
    display: none;
  }

  .pq__pts {
    font-size: 0.62rem;
  }

  .pq__row {
    padding: 0.4rem 0.6rem;
  }
}
</style>
