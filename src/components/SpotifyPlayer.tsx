import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { spotifyUrlToUri } from '../utils/spotifyUrl'
import { SpotifyLogo } from './BrandIcons'

const SPOTIFY_ELEMENT_ID = 'chai-tapri-spotify-player'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const STATUS_LABEL: Record<string, string> = {
  loading: 'Loading…',
  ready: 'Ready',
  playing: 'Playing',
  paused: 'Paused',
  buffering: 'Buffering…',
}

/**
 * Custom transport for the official Spotify embed — the embed itself stays
 * mounted and visible (required by Spotify's terms), these buttons just
 * drive it via the documented iFrame API instead of relying on the embed's
 * own on-screen controls.
 *
 * Owns its own `useSpotifyPlayer` call (rather than receiving state/controls
 * as props) specifically so its mount div and the hook that binds to it
 * live in the same component: MusicPlayer only ever mounts this component
 * when the Spotify source tab is active, so by the time this component's
 * effect runs, its own div is guaranteed to already be in the DOM.
 */
export function SpotifyPlayer() {
  const spotifyTracks = siteConfig.spotify.tracks
  const spotifyUris = spotifyTracks.map((t) => t.uri)
  const initialUri =
    spotifyUris[0] ??
    spotifyUrlToUri(siteConfig.spotifyUrl) ??
    `spotify:playlist:${siteConfig.spotifyUrl.split('/').pop()}`
  const [state, controls] = useSpotifyPlayer(SPOTIFY_ELEMENT_ID, initialUri, spotifyUris)
  const trackLabel = spotifyTracks[state.trackIndex]?.title

  return (
    <div className="spotify-player">
      <div id={SPOTIFY_ELEMENT_ID} className="spotify-embed" />

      <div className="spotify-status">
        <SpotifyLogo />
        <span>{STATUS_LABEL[state.status]}</span>
      </div>

      {trackLabel && <p className="spotify-track-label">{trackLabel}</p>}

      <div className="radio-transport">
        <button
          type="button"
          onClick={controls.previous}
          disabled={!controls.canGoPrevious}
          aria-label="Previous track"
          title={controls.canGoPrevious ? 'Previous track' : 'Add more tracks in siteConfig.spotify.tracks to enable'}
        >
          <SkipBack size={15} />
        </button>
        <button
          type="button"
          className="play"
          onClick={controls.togglePlay}
          aria-label={state.status === 'playing' ? 'Pause' : 'Play'}
          disabled={state.status === 'loading'}
        >
          {state.status === 'playing' ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          type="button"
          onClick={controls.next}
          disabled={!controls.canGoNext}
          aria-label="Next track"
          title={controls.canGoNext ? 'Next track' : 'Add more tracks in siteConfig.spotify.tracks to enable'}
        >
          <SkipForward size={15} />
        </button>
      </div>

      <div className="radio-seek">
        <time>{formatTime(state.currentTime)}</time>
        <input
          type="range"
          min={0}
          max={state.duration || 0}
          step={1}
          value={state.currentTime}
          onChange={(event) => controls.seekTo(Number(event.target.value))}
          aria-label="Seek"
          disabled={!state.duration}
        />
        <time>{formatTime(state.duration)}</time>
      </div>

      <p className="spotify-note">
        Full playback requires being signed into Spotify (Premium) in this browser — otherwise Spotify plays a
        30-second preview.
      </p>
    </div>
  )
}
