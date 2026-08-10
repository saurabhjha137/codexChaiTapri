import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpotifyPlayer } from './useSpotifyPlayer'

type Listener = (event: unknown) => void

class FakeController {
  listeners: Record<string, Listener> = {}
  paused = true
  position = 0
  duration = 180
  loadedUri: string

  constructor(uri: string) {
    this.loadedUri = uri
  }
  loadUri(uri: string) {
    this.loadedUri = uri
    this.position = 0
  }
  play() {
    this.paused = false
    this.emitUpdate()
  }
  pause() {
    this.paused = true
    this.emitUpdate()
  }
  togglePlay() {
    this.paused = !this.paused
    this.emitUpdate()
  }
  seek(seconds: number) {
    this.position = seconds
    this.emitUpdate()
  }
  addListener(event: string, cb: Listener) {
    this.listeners[event] = cb
  }
  removeListener() {}
  destroy() {}
  emitReady() {
    this.listeners.ready?.(undefined)
  }
  emitUpdate() {
    this.listeners.playback_update?.({
      data: { isPaused: this.paused, isBuffering: false, duration: this.duration, position: this.position },
    })
  }
}

let lastController: FakeController | null = null

vi.mock('../lib/spotifyIframeApi', () => ({
  loadSpotifyIframeApi: () =>
    Promise.resolve({
      createController: (_el: HTMLElement, options: { uri: string }, callback: (c: FakeController) => void) => {
        const controller = new FakeController(options.uri)
        lastController = controller
        callback(controller)
        queueMicrotask(() => controller.emitReady())
      },
    }),
}))

describe('useSpotifyPlayer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="mount"></div>'
    lastController = null
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('starts loading and never autoplays', async () => {
    const { result } = renderHook(() => useSpotifyPlayer('mount', 'spotify:track:a', ['spotify:track:a']))
    expect(result.current[0].status).toBe('loading')
    await waitFor(() => expect(result.current[0].status).toBe('ready'))
    expect(lastController?.paused).toBe(true)
  })

  it('togglePlay starts and stops playback', async () => {
    const { result } = renderHook(() => useSpotifyPlayer('mount', 'spotify:track:a', ['spotify:track:a']))
    await waitFor(() => expect(result.current[0].status).toBe('ready'))

    act(() => result.current[1].togglePlay())
    await waitFor(() => expect(result.current[0].status).toBe('playing'))

    act(() => result.current[1].togglePlay())
    await waitFor(() => expect(result.current[0].status).toBe('paused'))
  })

  it('disables next/previous with fewer than two tracks', async () => {
    const { result } = renderHook(() => useSpotifyPlayer('mount', 'spotify:track:a', ['spotify:track:a']))
    await waitFor(() => expect(result.current[0].status).toBe('ready'))
    expect(result.current[1].canGoNext).toBe(false)
    expect(result.current[1].canGoPrevious).toBe(false)
  })

  it('next/previous step through the configured track list', async () => {
    const uris = ['spotify:track:a', 'spotify:track:b', 'spotify:track:c']
    const { result } = renderHook(() => useSpotifyPlayer('mount', uris[0], uris))
    await waitFor(() => expect(result.current[0].status).toBe('ready'))

    expect(result.current[1].canGoNext).toBe(true)
    act(() => result.current[1].next())
    await waitFor(() => expect(result.current[0].trackIndex).toBe(1))
    expect(lastController?.loadedUri).toBe('spotify:track:b')

    act(() => result.current[1].previous())
    await waitFor(() => expect(result.current[0].trackIndex).toBe(0))
    expect(lastController?.loadedUri).toBe('spotify:track:a')
  })
})
