import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import type { YouTubePlayerControls, YouTubePlayerState } from '../hooks/useYouTubePlayer'

interface RadioPlayerProps {
  state: YouTubePlayerState
  controls: YouTubePlayerControls
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const STATUS_LABEL: Record<YouTubePlayerState['status'], string> = {
  loading: 'Tuning in…',
  cued: 'Ready',
  playing: 'On air',
  paused: 'Paused',
  buffering: 'Buffering…',
  ended: 'Track ended',
  error: 'Playback error',
}

/**
 * A vintage-radio skin for the same underlying YouTube IFrame Player driven
 * by `useYouTubePlayer` — playback state stays in sync with "video mode"
 * because they share one player instance.
 */
export function RadioPlayer({ state, controls }: RadioPlayerProps) {
  const needleRotation = state.status === 'playing' ? -20 : 20

  return (
    <div className="radio-player">
      <div className="radio-dial" aria-hidden="true">
        <div className="radio-dial-needle" style={{ transform: `rotate(${needleRotation}deg)` }} />
      </div>
      <div className="radio-controls">
        <span className="radio-status">{STATUS_LABEL[state.status]}</span>
        <h3 className="radio-title">{state.title ?? 'Tapri ke gaane'}</h3>

        <div className="radio-transport">
          <button type="button" onClick={controls.previous} aria-label="Previous track">
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
          <button type="button" onClick={controls.next} aria-label="Next track">
            <SkipForward size={15} />
          </button>
          <button
            type="button"
            onClick={controls.toggleMute}
            aria-pressed={state.muted}
            aria-label={state.muted ? 'Unmute' : 'Mute'}
          >
            {state.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
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

        <div className="radio-volume">
          <Volume2 size={13} aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={state.muted ? 0 : state.volume}
            onChange={(event) => controls.setVolume(Number(event.target.value))}
            aria-label="Volume"
          />
        </div>

        {state.status === 'error' && (
          <p className="field-error" role="alert">
            Couldn&rsquo;t reach YouTube right now — try again in a moment.
          </p>
        )}
      </div>
    </div>
  )
}
