/**
 * Auth Client - AppScript Authentication API
 * Handles admin login and session validation
 */

import { ofetch } from 'ofetch'
import type { AuthResponse } from '@/types'

function getAppScriptUrl(): string | null {
  const url = import.meta.env.VITE_APPSCRIPT_URL as string | undefined
  if (!url || url === 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec') {
    return null
  }
  return url
}

async function postToAppScript<T>(data: Record<string, unknown>): Promise<T> {
  const baseUrl = getAppScriptUrl()
  if (!baseUrl) {
    throw new Error('AppScript URL not configured. Set VITE_APPSCRIPT_URL in .env')
  }

  // Use text/plain to avoid CORS preflight (OPTIONS request)
  // AppScript will still parse the JSON from e.postData.contents
  const response = await ofetch<T | { error: string }>(baseUrl, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'text/plain',
    },
    retry: 1,
    retryDelay: 1000,
    timeout: 30000,
  })

  if (response && typeof response === 'object' && 'error' in response && !('success' in response)) {
    throw new Error((response as { error: string }).error)
  }

  return response as T
}

export const authClient = {
  /**
   * Login with username and password
   * Returns session key on success
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await postToAppScript<AuthResponse>({
        action: 'login',
        username,
        password,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }
    }
  },

  /**
   * Validate an existing session key
   * Returns user info if valid
   */
  async validateKey(key: string): Promise<AuthResponse> {
    try {
      const response = await postToAppScript<AuthResponse>({
        action: 'validate_key',
        key,
      })
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }
    }
  },
}

export default authClient
