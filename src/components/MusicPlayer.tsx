import { useState } from 'react'
import { ExternalLink, Radio, Tv } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { SpotifyLogo, YouTubeMusicLogo } from './BrandIcons'
import { RadioPlayer } from './RadioPlayer'
import { SpotifyPlayer } from './SpotifyPlayer'
import { useYouTubePlayer } from '../hooks/useYouTubePlayer'

const YT_ELEMENT_ID = 'chai-tapri-yt-player'

type ViewMode = 'video' | 'radio'
type Source = 'youtube' | 'spotify'

export function MusicPlayer() {
  const { firstVideoId, playlistId } = siteConfig.youtubePlaylist
  const [source, setSource] = useState<Source>('youtube')
  const [mode, setMode] = useState<ViewMode>('radio')

  const [ytState, ytControls] = useYouTubePlayer(YT_ELEMENT_ID, firstVideoId, playlistId)

  return (
    <section className={`player-shell youtube-shell mode-${mode} source-${source}`} aria-label="Chai Ki Tapri music player">
      <div className="source-toggle" role="tablist" aria-label="Choose music source">
        <button
          type="button"
          role="tab"
          aria-selected={source === 'youtube'}
          className={source === 'youtube' ? 'active' : ''}
          onClick={() => setSource('youtube')}
        >
          <YouTubeMusicLogo />
          <span>YouTube</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === 'spotify'}
          className={source === 'spotify' ? 'active' : ''}
          onClick={() => setSource('spotify')}
        >
          <SpotifyLogo />
          <span>Spotify</span>
        </button>
      </div>

      {source === 'youtube' ? (
        <>
          <div className="youtube-frame">
            <div id={YT_ELEMENT_ID} />
          </div>

          {mode === 'video' ? (
            <div className="youtube-details">
              <h2>{ytState.title ?? 'Tapri ke gaane'}</h2>
              <a href={siteConfig.youtubeMusicUrl} target="_blank" rel="noreferrer">
                Open in YouTube Music <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            <RadioPlayer state={ytState} controls={ytControls} />
          )}

          {siteConfig.radio.enabled && (
            <button
              type="button"
              className="mode-toggle"
              aria-pressed={mode === 'radio'}
              title={mode === 'video' ? 'Switch to vintage radio mode' : 'Switch to normal video mode'}
              onClick={() => setMode((m) => (m === 'video' ? 'radio' : 'video'))}
            >
              {mode === 'video' ? <Radio size={14} /> : <Tv size={14} />}
              <span>{mode === 'video' ? 'Radio Mode' : 'Video Mode'}</span>
            </button>
          )}
        </>
      ) : (
        <SpotifyPlayer />
      )}
    </section>
  )
}
