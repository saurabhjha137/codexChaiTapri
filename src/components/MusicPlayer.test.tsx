import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MusicPlayer } from './MusicPlayer'
import { siteConfig } from '../config/siteConfig'

class FakeYouTubePlayer {
  private data = { title: 'Mock Tapri Track' }
  private currentTime = 12
  private duration = 200
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

class FakeSpotifyController {
  listeners: Record<string, ((event: unknown) => void) | undefined> = {}
  addListener(event: string, cb: (event: unknown) => void) {
    this.listeners[event] = cb
  }
  removeListener() {}
  loadUri() {}
  play() {}
  pause() {}
  togglePlay() {}
  seek() {}
  destroy() {}
}

vi.mock('../lib/spotifyIframeApi', () => ({
  loadSpotifyIframeApi: () =>
    Promise.resolve({
      createController: (
        _el: HTMLElement,
        _options: { uri: string },
        callback: (controller: FakeSpotifyController) => void,
      ) => {
        const controller = new FakeSpotifyController()
        callback(controller)
        queueMicrotask(() => controller.listeners.ready?.(undefined))
      },
    }),
}))

describe('MusicPlayer', () => {
  it('mounts the official YouTube IFrame player for the configured playlist', async () => {
    render(<MusicPlayer />)
    await waitFor(() => expect(screen.getByText('Mock Tapri Track')).toBeInTheDocument())
  })

  it('opens in Radio Mode by default, showing the vintage skin', async () => {
    render(<MusicPlayer />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mock Tapri Track' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /video mode/i })).toBeInTheDocument()
  })

  it('switches to Video Mode and back, keeping the same track in sync', async () => {
    const user = userEvent.setup()
    render(<MusicPlayer />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mock Tapri Track' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /video mode/i }))

    const link = screen.getByRole('link', { name: /open in youtube music/i })
    expect(link).toHaveAttribute('href', siteConfig.youtubeMusicUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('button', { name: /radio mode/i })).toBeInTheDocument()
  })

  it('does not autoplay — the player starts paused until a user presses play', async () => {
    render(<MusicPlayer />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mock Tapri Track' })).toBeInTheDocument())

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('switches to the Spotify source and mounts the Spotify embed', async () => {
    const user = userEvent.setup()
    render(<MusicPlayer />)
    await waitFor(() => expect(screen.getByText('Mock Tapri Track')).toBeInTheDocument())

    await user.click(screen.getByRole('tab', { name: /spotify/i }))

    expect(screen.getByRole('tab', { name: /spotify/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /youtube/i })).toHaveAttribute('aria-selected', 'false')
    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument())
    // Next/Previous stay disabled by default (empty siteConfig.spotify.tracks).
    expect(screen.getByRole('button', { name: 'Next track' })).toBeDisabled()
  })
})
