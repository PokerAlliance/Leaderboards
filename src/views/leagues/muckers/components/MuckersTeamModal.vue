<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { getMuckersTeam } from '@/config/teams'
import type { MuckersTeamSlug } from '@/types/muckers'

const props = defineProps<{ teamSlug: MuckersTeamSlug }>()
const emit = defineEmits<{ close: [] }>()

const store = useMuckersStore()

const detail = computed(() => store.getTeamDetail(props.teamSlug))

const teamMeta = computed(() => getMuckersTeam(props.teamSlug))

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('mk-modal-overlay')) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mk-modal-fade">
      <div v-if="detail" class="mk-modal-overlay" @click="onOverlayClick">
        <div class="mk-modal-panel mk-glass mk-team-modal">
          <button class="mk-modal-close" @click="emit('close')" aria-label="Close">&times;</button>

          <!-- Header Card -->
          <div class="mk-tm-header" :style="{ '--team-accent': teamMeta?.color ?? '#888' }">
            <img
              v-if="teamMeta?.logoUrl"
              :src="teamMeta.logoUrl"
              class="mk-tm-logo"
              :alt="detail.teamName"
            />
            <div class="mk-tm-header-info">
              <h2 class="mk-tm-name">{{ detail.teamName }}</h2>
              <div class="mk-tm-meta">
                <span v-if="detail.captain" class="mk-tm-captain">Captain: {{ detail.captain }}</span>
                <span class="mk-tm-count">{{ detail.memberCount }} members</span>
              </div>
              <div class="mk-tm-total">
                <span class="mk-tm-total-label">Quarterly Total</span>
                <span class="mk-tm-total-value">{{ detail.quarterlyTotal }} pts</span>
              </div>
            </div>
          </div>

          <!-- Members List -->
          <h3 class="mk-tm-section-title">Members</h3>
          <div class="mk-tm-members">
            <div
              v-for="member in detail.members"
              :key="member.username"
              class="mk-tm-member"
            >
              <img
                v-if="store.getAvatar(member.username)"
                :src="store.getAvatar(member.username)"
                class="mk-tm-member-avatar"
                alt=""
              />
              <div v-else class="mk-tm-member-avatar mk-tm-member-avatar--placeholder" />
              <div class="mk-tm-member-info">
                <span class="mk-tm-member-name">{{ member.username }}</span>
                <span class="mk-tm-member-avg">{{ member.averagePerGame.toFixed(1) }} avg</span>
              </div>
              <div class="mk-tm-member-stats">
                <span class="mk-tm-member-pts">{{ member.totalPoints }} pts</span>
                <span class="mk-tm-member-games">{{ member.gamesPlayed }} games</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mk-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4rem 1rem;
  overflow-y: auto;
}

.mk-team-modal {
  max-width: 500px;
  background: rgba(255, 255, 255, 0.92) !important;
}

.mk-modal-panel {
  position: relative;
  width: 100%;
  padding: 2rem 2rem 2.5rem;
}

.mk-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #64748B;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
  transition: color 0.15s;
}

.mk-modal-close:hover {
  color: #1B2A4A;
}

/* ─── Header Card ─────── */

.mk-tm-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 180, 216, 0.04);
  border: 1px solid rgba(100, 120, 160, 0.1);
  border-left: 4px solid var(--team-accent);
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.mk-tm-logo {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(100, 120, 160, 0.12);
}

.mk-tm-header-info {
  flex: 1;
  min-width: 0;
}

.mk-tm-name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: #1B2A4A;
  margin: 0 0 0.3rem;
}

.mk-tm-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #64748B;
  margin-bottom: 0.45rem;
}

.mk-tm-captain {
  font-weight: 600;
}

.mk-tm-total {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.mk-tm-total-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  font-weight: 700;
}

.mk-tm-total-value {
  font-weight: 800;
  font-size: 1rem;
  color: #00B4D8;
}

/* ─── Section Title ─────── */

.mk-tm-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748B;
  margin: 0 0 0.65rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.12);
}

/* ─── Members ─────── */

.mk-tm-members {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.mk-tm-member {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.25rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.06);
}

.mk-tm-member:last-child {
  border-bottom: none;
}

.mk-tm-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-tm-member-avatar--placeholder {
  background: linear-gradient(135deg, #E2E8F0, #CBD5E1);
}

.mk-tm-member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.mk-tm-member-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: #1B2A4A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-tm-member-avg {
  font-size: 0.68rem;
  color: #64748B;
}

.mk-tm-member-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.05rem;
  flex-shrink: 0;
}

.mk-tm-member-pts {
  font-weight: 700;
  font-size: 0.85rem;
  color: #00B4D8;
}

.mk-tm-member-games {
  font-size: 0.68rem;
  color: #64748B;
}

/* ─── Modal Transition ─────── */

.mk-modal-fade-enter-active,
.mk-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mk-modal-fade-enter-active .mk-modal-panel,
.mk-modal-fade-leave-active .mk-modal-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.mk-modal-fade-enter-from,
.mk-modal-fade-leave-to {
  opacity: 0;
}

.mk-modal-fade-enter-from .mk-modal-panel {
  transform: translateY(16px);
  opacity: 0;
}

.mk-modal-fade-leave-to .mk-modal-panel {
  transform: translateY(8px);
  opacity: 0;
}

/* ─── Responsive ─────── */

@media (max-width: 640px) {
  .mk-modal-overlay { padding: 2rem 0.5rem; }
  .mk-modal-panel { padding: 1.25rem 1rem 1.5rem; }
  .mk-tm-logo { width: 44px; height: 44px; }
  .mk-tm-name { font-size: 1rem; }
}
</style>
