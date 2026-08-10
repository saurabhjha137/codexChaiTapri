import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SpotifyPlayer } from './SpotifyPlayer'

class FakeSpotifyController {
  listeners: Record<string, ((event: unknown) => void) | undefined> = {}
  paused = true
  addListener(event: string, cb: (event: unknown) => void) {
    this.listeners[event] = cb
  }
  removeListener() {}
  loadUri() {}
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
  seek() {}
  destroy() {}
  emitUpdate() {
    this.listeners.playback_update?.({ data: { isPaused: this.paused, isBuffering: false, duration: 200, position: 12 } })
  }
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

async function waitUntilReady() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled())
}

describe('SpotifyPlayer', () => {
  it('becomes playable once the embed controller connects, and never autoplays', async () => {
    render(<SpotifyPlayer />)
    await waitUntilReady()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('toggles play/pause via the custom transport', async () => {
    const user = userEvent.setup()
    render(<SpotifyPlayer />)
    await waitUntilReady()

    await user.click(screen.getByRole('button', { name: 'Play' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Pause' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument())
  })

  it('disables next/previous when siteConfig.spotify.tracks has fewer than two entries', async () => {
    render(<SpotifyPlayer />)
    await waitUntilReady()
    expect(screen.getByRole('button', { name: 'Next track' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous track' })).toBeDisabled()
  })

  it('surfaces the Premium/preview caveat on the play button as a tooltip', () => {
    render(<SpotifyPlayer />)
    expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute(
      'title',
      expect.stringMatching(/full playback requires being signed into spotify/i),
    )
  })
})
