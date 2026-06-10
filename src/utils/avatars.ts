/**
 * Generate a self-contained SVG data-URI letter avatar from a username.
 * Deterministic color based on the first character code so the same user
 * always gets the same background. Zero network requests.
 */
export function getLetterAvatarUrl(username: string): string {
  const initial = (username || '?').charAt(0).toUpperCase()
  const PALETTE = [
    '#e85d04', '#7b2d8b', '#c9184a', '#1a759f',
    '#2d6a4f', '#d4a017', '#6d28d9', '#0891b2',
  ]
  const bg = PALETTE[username.charCodeAt(0) % PALETTE.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="36" font-family="system-ui,sans-serif" font-weight="600">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
