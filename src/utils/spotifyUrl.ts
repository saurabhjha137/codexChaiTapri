/**
 * Converts an `open.spotify.com/{type}/{id}` URL into the `spotify:{type}:{id}`
 * URI the embed iFrame API expects. Returns null for anything else so
 * callers can fail gracefully instead of loading a broken embed.
 */
export function spotifyUrlToUri(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'open.spotify.com') return null
    const [, type, id] = parsed.pathname.split('/')
    if (!type || !id) return null
    return `spotify:${type}:${id}`
  } catch {
    return null
  }
}
