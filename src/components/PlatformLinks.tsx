import { siteConfig } from '../config/siteConfig'
import { SpotifyLogo, YouTubeMusicLogo } from './BrandIcons'

export function PlatformLinks() {
  return <nav className="platform-links" aria-label="Listen on music platforms">
    <a href={siteConfig.spotifyUrl} target="_blank" rel="noreferrer" aria-label="Listen to Chai and Classics on Spotify"><SpotifyLogo/><span>Spotify</span></a>
    <a href={siteConfig.youtubeMusicUrl} target="_blank" rel="noreferrer" aria-label="Listen to the playlist on YouTube Music"><YouTubeMusicLogo/><span>YouTube Music</span></a>
  </nav>
}
