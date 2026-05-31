<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useMuckersStore } from '@/composables/useMuckersStore'
import { MUCKERS_GAME_SLOTS, MUCKERS_SCHEDULE } from '@/config/muckers'
import type { MuckersTeamSlug, MuckersWeekData, MuckersPrimarySlot } from '@/types/muckers'

const props = defineProps<{
  teamSlug: MuckersTeamSlug
  teamName: string
  weekNumber: number
  anchorRect: DOMRect
  visible: boolean
}>()

const store = useMuckersStore()
const popoverRef = ref<HTMLElement | null>(null)
const posStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

const weekData = computed<MuckersWeekData | null>(() => {
  const team = store.teamStandings.value.find((t) => t.teamSlug === props.teamSlug)
  return team?.weeklyScores.find((w) => w.weekNumber === props.weekNumber) ?? null
})

function getSlotLabel(slot: MuckersPrimarySlot): string {
  const cfg = MUCKERS_SCHEDULE.find((s) => s.slot === slot)
  return cfg ? `Muckers ${slot} (${cfg.dayLabel})` : `Muckers ${slot}`
}

function getSlotGame(slot: MuckersPrimarySlot) {
  return weekData.value?.games.find((g) => g.slot === slot) ?? null
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function updatePosition() {
  if (!popoverRef.value) return
  const rect = props.anchorRect
  const popH = popoverRef.value.offsetHeight
  const popW = popoverRef.value.offsetWidth

  let top: number
  const spaceBelow = window.innerHeight - rect.bottom
  if (spaceBelow > popH + 8) {
    top = rect.bottom + 6
  } else {
    top = rect.top - popH - 6
  }

  let left = rect.left + rect.width / 2 - popW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - popW - 8))

  posStyle.value = { top: `${top}px`, left: `${left}px` }
}

watch(() => [props.anchorRect, props.visible], () => {
  if (props.visible) requestAnimationFrame(updatePosition)
})

onMounted(() => {
  if (props.visible) requestAnimationFrame(updatePosition)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="mk-pop-fade">
      <div
        v-if="visible && weekData"
        ref="popoverRef"
        class="mk-popover"
        :style="posStyle"
      >
        <div class="mk-popover__header">
          <span class="mk-popover__title">{{ teamName }} — Week {{ weekNumber }}</span>
          <span class="mk-popover__total">{{ weekData.totalPoints }} pts</span>
        </div>

        <div
          v-for="slot in MUCKERS_GAME_SLOTS"
          :key="slot"
          class="mk-popover__slot"
        >
          <div class="mk-popover__slot-label">{{ getSlotLabel(slot) }}</div>
          <div v-if="getSlotGame(slot)" class="mk-popover__player">
            <img
              v-if="store.getAvatar(getSlotGame(slot)!.playerUsername)"
              :src="store.getAvatar(getSlotGame(slot)!.playerUsername)"
              class="mk-popover__avatar"
              alt=""
            />
            <span class="mk-popover__username">{{ getSlotGame(slot)!.playerUsername }}</span>
            <span class="mk-popover__pts">{{ getSlotGame(slot)!.pointsEarned }} pts</span>
            <span class="mk-popover__pos">
              {{ ordinal(getSlotGame(slot)!.finishPosition) }} / {{ getSlotGame(slot)!.totalPlayers }}
            </span>
          </div>
          <div v-else class="mk-popover__empty">No game recorded</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mk-popover {
  position: fixed;
  z-index: 10000;
  min-width: 240px;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(100, 120, 160, 0.18);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
  padding: 0.75rem 0.85rem;
  pointer-events: none;
}

.mk-popover__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.6rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(100, 120, 160, 0.12);
}

.mk-popover__title {
  font-weight: 700;
  font-size: 0.78rem;
  color: #1B2A4A;
}

.mk-popover__total {
  font-weight: 800;
  font-size: 0.78rem;
  color: #00B4D8;
}

.mk-popover__slot {
  margin-bottom: 0.45rem;
}

.mk-popover__slot:last-child {
  margin-bottom: 0;
}

.mk-popover__slot-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748B;
  margin-bottom: 0.2rem;
}

.mk-popover__player {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
}

.mk-popover__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.mk-popover__username {
  font-weight: 600;
  color: #1B2A4A;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mk-popover__pts {
  font-weight: 700;
  color: #00B4D8;
  white-space: nowrap;
}

.mk-popover__pos {
  font-size: 0.68rem;
  color: #64748B;
  white-space: nowrap;
}

.mk-popover__empty {
  font-size: 0.72rem;
  color: #CBD5E1;
  font-style: italic;
}

/* Transition */
.mk-pop-fade-enter-active,
.mk-pop-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.mk-pop-fade-enter-from,
.mk-pop-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
