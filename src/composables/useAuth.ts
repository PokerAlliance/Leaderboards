/**
 * useAuth Composable
 * Handles admin authentication state and session management
 */

import { reactive, toRefs, computed } from 'vue'
import { authClient } from '@/services/auth'
import type { LeagueSlug, AuthState, AdminLeagueSlug } from '@/types'

const STORAGE_KEY = 'poker_alliance_admin_key'

const state = reactive<AuthState>({
  isLoggedIn: false,
  adminKey: null,
  username: null,
  leagueSlug: null,
})

let initialized = false

export function useAuth() {
  /**
   * Initialize auth state from localStorage
   * Called once on app startup
   */
  async function initialize(): Promise<void> {
    if (initialized) return
    initialized = true

    const storedKey = localStorage.getItem(STORAGE_KEY)
    if (storedKey) {
      const result = await authClient.validateKey(storedKey)
      if (result.success) {
        state.isLoggedIn = true
        state.adminKey = storedKey
        state.username = result.username || null
        state.leagueSlug = (result.leagueSlug as AdminLeagueSlug) || null
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  /**
   * Login with username and password
   */
  async function login(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await authClient.login(username, password)

    if (result.success && result.key) {
      state.isLoggedIn = true
      state.adminKey = result.key
      state.username = result.username || username
      state.leagueSlug = (result.leagueSlug as AdminLeagueSlug) || null

      localStorage.setItem(STORAGE_KEY, result.key)

      return { success: true }
    }

    return { success: false, error: result.error || 'Login failed' }
  }

  /**
   * Logout and clear session
   */
  function logout(): void {
    state.isLoggedIn = false
    state.adminKey = null
    state.username = null
    state.leagueSlug = null

    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Check if admin can manage a specific league
   */
  function canManageLeague(leagueSlug: LeagueSlug): boolean {
    if (!state.isLoggedIn) return false
    if (state.leagueSlug === 'all') return true
    return state.leagueSlug === leagueSlug
  }

  /**
   * Get the current admin key for API calls
   */
  function getAdminKey(): string | null {
    return state.adminKey
  }

  const isLoggedIn = computed(() => state.isLoggedIn)
  const username = computed(() => state.username)
  const leagueSlug = computed(() => state.leagueSlug)

  return {
    ...toRefs(state),
    isLoggedIn,
    username,
    leagueSlug,
    initialize,
    login,
    logout,
    canManageLeague,
    getAdminKey,
  }
}
