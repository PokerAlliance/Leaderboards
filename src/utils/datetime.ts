/**
 * Date/Time Utilities
 * Handles timezone conversion and formatting for the scoreboard
 */

import { format, formatDistanceToNow, differenceInMinutes, isPast } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

const EST_TIMEZONE = 'America/New_York'

export function formatGameDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const estTime = formatInTimeZone(d, EST_TIMEZONE, 'h:mm a')
  const estDate = formatInTimeZone(d, EST_TIMEZONE, 'EEEE, MMMM d, yyyy')
  
  const localTime = format(d, 'h:mm a')
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const tzAbbrev = getTimezoneAbbreviation(userTimezone)
  
  const isESTUser = userTimezone === EST_TIMEZONE || userTimezone === 'America/Toronto'
  
  if (isESTUser) {
    return `${estDate} • ${estTime} EST`
  }
  
  return `${estDate} • ${estTime} EST (${localTime} ${tzAbbrev})`
}

export function formatGameTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const estTime = formatInTimeZone(d, EST_TIMEZONE, 'h:mm a')
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isESTUser = userTimezone === EST_TIMEZONE || userTimezone === 'America/Toronto'
  
  if (isESTUser) {
    return `${estTime} EST`
  }
  
  const localTime = format(d, 'h:mm a')
  const tzAbbrev = getTimezoneAbbreviation(userTimezone)
  
  return `${estTime} EST (${localTime} ${tzAbbrev})`
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isPast(d)) {
    return formatDistanceToNow(d, { addSuffix: true })
  }
  
  const minutesUntil = differenceInMinutes(d, new Date())
  
  if (minutesUntil <= 60) {
    return `in ${minutesUntil} minutes`
  }
  
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDuration(startDate: Date | string, endDate?: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date()
  
  const totalMinutes = differenceInMinutes(end, start)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours === 0) {
    return `${minutes}m`
  }
  
  return `${hours}h ${minutes}m`
}

export function getESTTime(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return toZonedTime(d, EST_TIMEZONE)
}

export function formatESTOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, EST_TIMEZONE, 'h:mm a zzz')
}

function getTimezoneAbbreviation(timezone: string): string {
  const abbrevMap: Record<string, string> = {
    'America/Los_Angeles': 'PST',
    'America/Denver': 'MST',
    'America/Chicago': 'CST',
    'America/New_York': 'EST',
    'America/Toronto': 'EST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Australia/Sydney': 'AEDT',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
  }
  
  if (abbrevMap[timezone]) {
    return abbrevMap[timezone]
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
    const parts = formatter.formatToParts(new Date())
    const tzPart = parts.find((p) => p.type === 'timeZoneName')
    return tzPart?.value || timezone.split('/').pop() || 'Local'
  } catch {
    return 'Local'
  }
}

export function isGameLive(_startDate: Date | string, state: string): boolean {
  return state === 'running'
}

export function isGameFinished(state: string): boolean {
  return state === 'finished'
}
