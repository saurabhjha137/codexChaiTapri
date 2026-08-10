// Minimal shape of the official Spotify embed iFrame API we use.
// https://developer.spotify.com/documentation/embeds/reference/iframe-api
export interface SpotifyPlaybackUpdate {
  data: {
    isPaused: boolean
    isBuffering: boolean
    duration: number
    position: number
  }
}

export interface SpotifyEmbedController {
  loadUri(uri: string): void
  play(): void
  pause(): void
  resume(): void
  togglePlay(): void
  seek(seconds: number): void
  addListener(event: 'ready', callback: () => void): void
  addListener(event: 'playback_update', callback: (event: SpotifyPlaybackUpdate) => void): void
  removeListener(event: string): void
  destroy(): void
}

interface SpotifyIFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyEmbedController) => void,
  ): void
}

declare global {
  interface Window {
    Spotify?: unknown
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIFrameAPI) => void
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null

/** Loads https://open.spotify.com/embed/iframe-api/v1 exactly once, however many callers ask for it. */
export function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const previousCallback = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (IFrameAPI: SpotifyIFrameAPI) => {
      previousCallback?.(IFrameAPI)
      resolve(IFrameAPI)
    }

    if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
      const script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      document.head.appendChild(script)
    }
  })

  return apiPromise
}
