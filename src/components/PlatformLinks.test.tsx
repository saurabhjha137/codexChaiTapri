import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlatformLinks } from './PlatformLinks'
import { siteConfig } from '../config/siteConfig'

describe('PlatformLinks', () => {
  it('links out to Spotify and YouTube Music in a new tab', () => {
    render(<PlatformLinks />)

    const spotify = screen.getByRole('link', { name: /spotify/i })
    expect(spotify).toHaveAttribute('href', siteConfig.spotifyUrl)
    expect(spotify).toHaveAttribute('target', '_blank')
    expect(spotify).toHaveAttribute('rel', expect.stringContaining('noreferrer'))

    const youtubeMusic = screen.getByRole('link', { name: /youtube music/i })
    expect(youtubeMusic).toHaveAttribute('href', siteConfig.youtubeMusicUrl)
    expect(youtubeMusic).toHaveAttribute('target', '_blank')
  })
})
