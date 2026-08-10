import { describe, expect, it } from 'vitest'
import { siteConfig } from './siteConfig'

describe('siteConfig', () => {
  it('defines the three scene backgrounds', () => {
    expect(Object.keys(siteConfig.backgrounds).sort()).toEqual(['default', 'rain', 'tapri'])
    Object.values(siteConfig.backgrounds).forEach((url) => {
      expect(url).toMatch(/^\/assets\/.+\.webp$/)
    })
  })

  it('gives every playlist track a title, artist, audio url, and artwork url', () => {
    expect(siteConfig.playlist.length).toBeGreaterThan(0)
    for (const track of siteConfig.playlist) {
      expect(track.title.length).toBeGreaterThan(0)
      expect(track.artist.length).toBeGreaterThan(0)
      expect(track.audioUrl).toMatch(/^https?:\/\//)
      expect(track.artworkUrl.length).toBeGreaterThan(0)
    }
  })

  it('exposes valid, absolute platform links', () => {
    expect(siteConfig.spotifyUrl).toMatch(/^https:\/\/open\.spotify\.com\//)
    expect(siteConfig.youtubeMusicUrl).toMatch(/^https:\/\/music\.youtube\.com\//)
  })

  it('keeps the YouTube playlist ids consistent with the youtubeMusicUrl', () => {
    expect(siteConfig.youtubeMusicUrl).toContain(siteConfig.youtubePlaylist.firstVideoId)
    expect(siteConfig.youtubeMusicUrl).toContain(siteConfig.youtubePlaylist.playlistId)
  })
})
