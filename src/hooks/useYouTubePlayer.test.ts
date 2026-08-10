import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useYouTubePlayer } from './useYouTubePlayer'

class FakeYouTubePlayer {
  private data = { title: 'Hook Test Track' }
  private currentTime = 0
  private duration = 180
  private volume = 100
  private muted = false
  private state = -1
  private events: Record<string, ((event: unknown) => void) | undefined>

  constructor(
    _elementId: string,
    options: { events?: Record<string, ((event: unknown) => void) | undefined> },
  ) {
    this.events = options.events ?? {}
    queueMicrotask(() => this.events.onReady?.({ target: this }))
  }
  playVideo() {
    this.state = 1
    this.events.onStateChange?.({ data: 1, target: this })
  }
  pauseVideo() {
    this.state = 2
    this.events.onStateChange?.({ data: 2, target: this })
  }
  nextVideo() {}
  previousVideo() {}
  seekTo(seconds: number) {
    this.currentTime = seconds
  }
  setVolume(v: number) {
    this.volume = v
  }
  getVolume() {
    return this.volume
  }
  mute() {
    this.muted = true
  }
  unMute() {
    this.muted = false
  }
  isMuted() {
    return this.muted
  }
  getCurrentTime() {
    return this.currentTime
  }
  getDuration() {
    return this.duration
  }
  getPlayerState() {
    return this.state
  }
  getVideoData() {
    return this.data
  }
  destroy() {}
}

vi.mock('../lib/youtubeIframeApi', () => ({
  loadYouTubeIframeApi: () => Promise.resolve({ Player: FakeYouTubePlayer }),
  PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
}))

describe('useYouTubePlayer', () => {
  it('starts in a loading state and never autoplays', async () => {
    const { result } = renderHook(() => useYouTubePlayer('mount', 'vid1', 'list1'))
    expect(result.current[0].status).toBe('loading')

    await waitFor(() => expect(result.current[0].status).toBe('cued'))
    expect(result.current[0].title).toBe('Hook Test Track')
  })

  it('togglePlay starts playback only after an explicit call', async () => {
    const { result } = renderHook(() => useYouTubePlayer('mount', 'vid1', 'list1'))
    await waitFor(() => expect(result.current[0].status).toBe('cued'))

    act(() => result.current[1].togglePlay())
    await waitFor(() => expect(result.current[0].status).toBe('playing'))

    act(() => result.current[1].togglePlay())
    await waitFor(() => expect(result.current[0].status).toBe('paused'))
  })

  it('setVolume updates state and mutes at zero', async () => {
    const { result } = renderHook(() => useYouTubePlayer('mount', 'vid1', 'list1'))
    await waitFor(() => expect(result.current[0].status).toBe('cued'))

    act(() => result.current[1].setVolume(0))
    expect(result.current[0].volume).toBe(0)
    expect(result.current[0].muted).toBe(true)
  })

  it('toggleMute flips the muted flag', async () => {
    const { result } = renderHook(() => useYouTubePlayer('mount', 'vid1', 'list1'))
    await waitFor(() => expect(result.current[0].status).toBe('cued'))

    act(() => result.current[1].toggleMute())
    expect(result.current[0].muted).toBe(true)
    act(() => result.current[1].toggleMute())
    expect(result.current[0].muted).toBe(false)
  })
})
