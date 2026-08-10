import { useCallback, useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi, PlayerState, type YouTubePlayer } from '../lib/youtubeIframeApi'

export type PlaybackStatus = 'loading' | 'cued' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error'

export interface YouTubePlayerState {
  status: PlaybackStatus
  title: string | null
  currentTime: number
  duration: number
  volume: number
  muted: boolean
}

export interface YouTubePlayerControls {
  play: () => void
  pause: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seekTo: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
}

const TIME_POLL_MS = 500

/**
 * Wraps the official YouTube IFrame Player API (loaded once, globally) for a
 * single `<div id={elementId}>` mount point. Never calls playVideo() on its
 * own — playback only starts from an explicit call to `play()`/`togglePlay()`
 * triggered by a real user action, so this never produces audible autoplay.
 */
export function useYouTubePlayer(
  elementId: string,
  videoId: string,
  playlistId: string,
): [YouTubePlayerState, YouTubePlayerControls] {
  const playerRef = useRef<YouTubePlayer | null>(null)
  const [state, setState] = useState<YouTubePlayerState>({
    status: 'loading',
    title: null,
    currentTime: 0,
    duration: 0,
    volume: 100,
    muted: false,
  })

  useEffect(() => {
    let cancelled = false
    let pollTimer: number | undefined

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return
      new YT.Player(elementId, {
        videoId,
        playerVars: {
          list: playlistId,
          listType: 'playlist',
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target
            const data = event.target.getVideoData()
            setState((prev) => ({
              ...prev,
              status: 'cued',
              title: data.title ?? null,
              duration: event.target.getDuration(),
              volume: event.target.getVolume(),
              muted: event.target.isMuted(),
            }))
          },
          onStateChange: (event) => {
            const player = event.target
            const statusByState: Partial<Record<number, PlaybackStatus>> = {
              [PlayerState.PLAYING]: 'playing',
              [PlayerState.PAUSED]: 'paused',
              [PlayerState.BUFFERING]: 'buffering',
              [PlayerState.ENDED]: 'ended',
              [PlayerState.CUED]: 'cued',
            }
            setState((prev) => ({
              ...prev,
              status: statusByState[event.data] ?? prev.status,
              title: player.getVideoData().title ?? prev.title,
              duration: player.getDuration(),
            }))
          },
          onError: () => {
            setState((prev) => ({ ...prev, status: 'error' }))
          },
        },
      })

      pollTimer = window.setInterval(() => {
        const current = playerRef.current
        if (!current) return
        setState((prev) => ({ ...prev, currentTime: current.getCurrentTime() }))
      }, TIME_POLL_MS)
    })

    return () => {
      cancelled = true
      if (pollTimer) window.clearInterval(pollTimer)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [elementId, videoId, playlistId])

  const play = useCallback(() => playerRef.current?.playVideo(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo(), [])
  const togglePlay = useCallback(() => {
    if (state.status === 'playing') pause()
    else play()
  }, [state.status, play, pause])
  const next = useCallback(() => playerRef.current?.nextVideo(), [])
  const previous = useCallback(() => playerRef.current?.previousVideo(), [])
  const seekTo = useCallback((seconds: number) => playerRef.current?.seekTo(seconds, true), [])
  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume))
    playerRef.current?.setVolume(clamped)
    setState((prev) => ({ ...prev, volume: clamped, muted: clamped === 0 }))
  }, [])
  const toggleMute = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (player.isMuted()) {
      player.unMute()
      setState((prev) => ({ ...prev, muted: false }))
    } else {
      player.mute()
      setState((prev) => ({ ...prev, muted: true }))
    }
  }, [])

  return [state, { play, pause, togglePlay, next, previous, seekTo, setVolume, toggleMute }]
}
