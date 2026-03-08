/**
 * usePolling Composable
 * Generic interval-based polling utility
 */

import { ref, onUnmounted, type Ref } from 'vue'

export interface UsePollingOptions {
  interval?: number
  immediate?: boolean
  onError?: (error: Error) => void
}

export interface UsePollingReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  isPolling: Ref<boolean>
  isLoading: Ref<boolean>
  lastUpdated: Ref<Date | null>
  start: () => void
  stop: () => void
  refresh: () => Promise<void>
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
): UsePollingReturn<T> {
  const { interval = 30000, immediate = true, onError } = options

  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const isPolling = ref(false)
  const isLoading = ref(false)
  const lastUpdated = ref<Date | null>(null)

  let intervalId: ReturnType<typeof setInterval> | null = null

  async function fetchData(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      data.value = await fetchFn()
      lastUpdated.value = new Date()
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      onError?.(err)
    } finally {
      isLoading.value = false
    }
  }

  function start(): void {
    if (isPolling.value) return

    isPolling.value = true
    
    if (immediate) {
      fetchData()
    }

    intervalId = setInterval(fetchData, interval)
  }

  function stop(): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPolling.value = false
  }

  async function refresh(): Promise<void> {
    await fetchData()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    data,
    error,
    isPolling,
    isLoading,
    lastUpdated,
    start,
    stop,
    refresh,
  }
}
