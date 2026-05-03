<script setup lang="ts">
import { computed } from 'vue'
import { DONKS_CUPS } from '@/config/donks'
import type { DonksCupConfig } from '@/types/donks'

interface ScheduleEvent {
  cup: DonksCupConfig
  date: Date
  localTime: string
  dayLabel: string
  dateLabel: string
  status: 'past' | 'today' | 'upcoming'
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  wednesday: 3,
}

/**
 * Parse a cup's ET time string ("1:00 PM") into hours/minutes in 24h format.
 */
function parseETTime(timeET: string): { hours: number; minutes: number } {
  const match = timeET.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return { hours: 13, minutes: 0 }
  let hours = parseInt(match[1]!)
  const minutes = parseInt(match[2]!)
  const period = match[3]!.toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return { hours, minutes }
}

/**
 * Create a Date in US/Eastern time for a specific date + ET time.
 * We build an ISO string targeting ET then parse it.
 */
function buildETDate(baseDate: Date, hoursET: number, minutesET: number): Date {
  const y = baseDate.getFullYear()
  const m = String(baseDate.getMonth() + 1).padStart(2, '0')
  const d = String(baseDate.getDate()).padStart(2, '0')
  const h = String(hoursET).padStart(2, '0')
  const min = String(minutesET).padStart(2, '0')

  const etString = `${y}-${m}-${d}T${h}:${min}:00`
  // Use Intl to find the ET offset for this date (handles DST)
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })
    // Create a rough UTC approximation, then adjust
    const rough = new Date(`${etString}Z`)
    // Get what ET thinks this UTC instant is
    const parts = formatter.formatToParts(rough)
    const etHour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0')
    // Difference = what we wanted (hoursET) vs what ET shows (etHour) for that UTC instant
    const diff = hoursET - etHour
    // Shift by the difference
    const adjusted = new Date(rough.getTime() + diff * 60 * 60 * 1000)
    return adjusted
  } catch {
    // Fallback: assume ET = UTC-5
    return new Date(`${etString}-05:00`)
  }
}

const schedule = computed<ScheduleEvent[]>(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const events: ScheduleEvent[] = []

  // Window: -3 days to +7 days
  for (let offset = -3; offset <= 7; offset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    const dayOfWeek = date.getDay()

    for (const cup of DONKS_CUPS) {
      const cupDayNum = DAY_MAP[cup.day]
      if (cupDayNum === undefined || dayOfWeek !== cupDayNum) continue

      const { hours, minutes } = parseETTime(cup.timeET)
      const eventDate = buildETDate(date, hours, minutes)

      // Format local time for display
      const localTime = eventDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })

      const dayLabel = date.toLocaleDateString(undefined, { weekday: 'short' })
      const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

      let status: ScheduleEvent['status'] = 'upcoming'
      if (offset < 0) status = 'past'
      else if (offset === 0) status = 'today'

      events.push({ cup, date: eventDate, localTime, dayLabel, dateLabel, status })
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
})

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}
</script>

<template>
  <div class="calendar">
    <h3 class="calendar__title">
      <span class="calendar__title-icon">📅</span>
      Weekly Schedule
    </h3>
    <p class="calendar__subtitle">All times shown in your local timezone</p>

    <div class="calendar__scroll-wrapper">
      <div class="calendar__track">
        <!-- Today marker -->
        <div class="calendar__today-line" :style="{ display: schedule.length ? 'block' : 'none' }" />

        <div
          v-for="(event, idx) in schedule"
          :key="`${event.cup.slug}-${idx}`"
          class="calendar__event"
          :class="[
            `calendar__event--${event.status}`,
            { 'calendar__event--highlighted': isToday(event.date) },
          ]"
          :style="{ '--cup-color': event.cup.color }"
        >
          <div class="calendar__event-header">
            <span class="calendar__event-abbr">{{ event.cup.shortName }}</span>
            <span class="calendar__event-badge" :class="`donks-badge donks-badge--${event.status}`">
              {{ event.status === 'today' ? 'TODAY' : event.status === 'past' ? 'PAST' : 'UPCOMING' }}
            </span>
          </div>

          <div class="calendar__event-body">
            <span class="calendar__event-cup-name">{{ event.cup.name }}</span>
            <span class="calendar__event-date">{{ event.dayLabel }}, {{ event.dateLabel }}</span>
            <span class="calendar__event-time">{{ event.localTime }}</span>
          </div>

          <div class="calendar__event-type">
            {{ event.cup.gameType === 'holdem' ? 'NL Hold\'em' : 'PLO8' }}
          </div>
        </div>

        <div v-if="schedule.length === 0" class="calendar__empty">
          No games scheduled in this window.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  padding: 1.5rem 2rem 2rem;
}

.calendar__title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-donks-gold-dark);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar__title-icon {
  font-size: 1.1rem;
}

.calendar__subtitle {
  font-size: 0.8rem;
  color: var(--color-donks-text-secondary);
  margin-bottom: 1.25rem;
}

/* Scrollable horizontal track */
.calendar__scroll-wrapper {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.75rem;
  margin: 0 -0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-donks-gold) transparent;
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 3%,
    black 97%,
    transparent 100%
  );
}

.calendar__scroll-wrapper::-webkit-scrollbar {
  height: 5px;
}

.calendar__scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.calendar__scroll-wrapper::-webkit-scrollbar-thumb {
  background: var(--color-donks-card-border);
  border-radius: 99px;
}

.calendar__track {
  display: flex;
  gap: 0.65rem;
  padding: 0.5rem;
  min-width: max-content;
  position: relative;
}

/* Event card */
.calendar__event {
  flex: 0 0 150px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: all 0.25s ease;
  border-top: 3px solid var(--cup-color, #ccc);
}

.calendar__event--past {
  opacity: 0.5;
}

.calendar__event--today {
  opacity: 1;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 16px rgba(201, 162, 39, 0.18),
              0 0 0 1.5px var(--color-donks-gold);
}

.calendar__event--upcoming {
  opacity: 0.85;
}

.calendar__event--highlighted {
  transform: translateY(-2px);
}

/* Header row with abbreviation + badge */
.calendar__event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.calendar__event-abbr {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--cup-color, var(--color-donks-text));
  letter-spacing: 0.04em;
}

.calendar__event-badge {
  font-size: 0.55rem;
  padding: 0.15em 0.5em;
}

/* Body */
.calendar__event-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.calendar__event-cup-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-donks-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar__event-date {
  font-size: 0.68rem;
  color: var(--color-donks-text-secondary);
}

.calendar__event-time {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-donks-text);
}

/* Game type tag */
.calendar__event-type {
  display: inline-block;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cup-color, var(--color-donks-text-secondary));
  font-weight: 700;
  background: color-mix(in srgb, var(--cup-color, #999) 10%, transparent);
  padding: 0.15em 0.5em;
  border-radius: 4px;
  width: fit-content;
}

.calendar__empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-donks-text-muted);
  font-size: 0.85rem;
}

@media (max-width: 700px) {
  .calendar {
    padding: 1rem;
  }

  .calendar__event {
    flex: 0 0 130px;
  }
}
</style>
