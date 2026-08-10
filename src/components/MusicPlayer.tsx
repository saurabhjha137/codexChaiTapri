import { ExternalLink } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { YouTubeMusicLogo } from './BrandIcons'

export function MusicPlayer() {
  const { firstVideoId, playlistId } = siteConfig.youtubePlaylist
  const embedUrl = `https://www.youtube-nocookie.com/embed/${firstVideoId}?list=${playlistId}&playsinline=1&rel=0`

  return <section className="player-shell youtube-shell" aria-label="Chai Ki Tapri YouTube playlist player">
    <div className="youtube-frame">
      <iframe
        src={embedUrl}
        title="Chai Ki Tapri YouTube playlist"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
    <div className="youtube-details">
      <span className="status"><i/><span>Curated playlist</span></span>
      <h2>Tapri ke gaane</h2>
      <p>Use the player controls to play, pause, seek, or move through the full playlist.</p>
      <div className="playlist-meta"><YouTubeMusicLogo/><span>YouTube Music · Full playlist</span></div>
      <a href={siteConfig.youtubeMusicUrl} target="_blank" rel="noreferrer">Open in YouTube Music <ExternalLink size={13}/></a>
    </div>
  </section>
}
