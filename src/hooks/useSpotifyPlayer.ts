import { useCallback, useEffect, useRef, useState } from 'react'
import { loadSpotifyIframeApi, type SpotifyEmbedController } from '../lib/spotifyIframeApi'

export type SpotifyStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'buffering'

export interface SpotifyPlayerState {
  status: SpotifyStatus
  currentTime: number
  duration: number
  trackIndex: number
}

export interface SpotifyPlayerControls {
  togglePlay: () => void
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  next: () => void
  previous: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

/**
 * Wraps the official Spotify embed iFrame API for a single mount point.
 * `uris` is a config-driven list (siteConfig.spotify.tracks) — next/previous
 * step through it via loadUri(). With 0 or 1 entries those controls disable
 * themselves rather than doing nothing silently.
 *
 * Never calls play() on its own — playback only starts from an explicit
 * user action via `play()`/`togglePlay()`, so this never autoplays audibly.
 */
export function useSpotifyPlayer(
  elementId: string,
  initialUri: string,
  uris: string[],
): [SpotifyPlayerState, SpotifyPlayerControls] {
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [state, setState] = useState<SpotifyPlayerState>({
    status: 'loading',
    currentTime: 0,
    duration: 0,
    trackIndex: 0,
  })

  useEffect(() => {
    let cancelled = false
    const element = document.getElementById(elementId)
    if (!element) return

    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled) return
      IFrameAPI.createController(element, { uri: initialUri, width: '100%', height: '152' }, (controller) => {
        if (cancelled) {
          controller.destroy()
          return
        }
        controllerRef.current = controller
        controller.addListener('ready', () => {
          setState((prev) => ({ ...prev, status: 'ready' }))
        })
        controller.addListener('playback_update', (event) => {
          setState((prev) => ({
            ...prev,
            status: event.data.isBuffering ? 'buffering' : event.data.isPaused ? 'paused' : 'playing',
            currentTime: event.data.position,
            duration: event.data.duration,
          }))
        })
      })
    })

    return () => {
      cancelled = true
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [elementId, initialUri])

  const play = useCallback(() => controllerRef.current?.play(), [])
  const pause = useCallback(() => controllerRef.current?.pause(), [])
  const togglePlay = useCallback(() => controllerRef.current?.togglePlay(), [])
  const seekTo = useCallback((seconds: number) => controllerRef.current?.seek(seconds), [])

  const loadIndex = useCallback(
    (index: number) => {
      const uri = uris[index]
      if (!uri || !controllerRef.current) return
      controllerRef.current.loadUri(uri)
      setTrackIndex(index)
      setState((prev) => ({ ...prev, trackIndex: index, currentTime: 0 }))
    },
    [uris],
  )

  const next = useCallback(() => {
    if (trackIndex + 1 < uris.length) loadIndex(trackIndex + 1)
  }, [trackIndex, uris.length, loadIndex])

  const previous = useCallback(() => {
    if (trackIndex > 0) loadIndex(trackIndex - 1)
  }, [trackIndex, loadIndex])

  return [
    state,
    {
      togglePlay,
      play,
      pause,
      seekTo,
      next,
      previous,
      canGoNext: trackIndex + 1 < uris.length,
      canGoPrevious: trackIndex > 0,
    },
  ]
}
