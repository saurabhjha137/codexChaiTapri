import { CloudRain, Coffee, Volume2, VolumeX, Wind } from 'lucide-react'
import type { AmbientLayerId, AmbientLayerState } from '../hooks/useAmbientAudio'

interface AmbientMixerProps {
  layers: Record<AmbientLayerId, AmbientLayerState>
  onVolumeChange: (id: AmbientLayerId, volume: number) => void
  onToggleMute: (id: AmbientLayerId) => void
}

const LAYER_ICONS: Record<AmbientLayerId, typeof CloudRain> = {
  rain: CloudRain,
  kettle: Coffee,
  roadside: Wind,
}

/**
 * Independent volume/mute controls for the rain, kettle, and roadside
 * ambience loops — separate from music volume. A layer with no audio file
 * configured renders disabled with a tooltip instead of a broken control.
 */
export function AmbientMixer({ layers, onVolumeChange, onToggleMute }: AmbientMixerProps) {
  const ids: AmbientLayerId[] = ['rain', 'kettle', 'roadside']

  return (
    <div className="ambient-mixer" aria-label="Ambient sound mixer">
      {ids.map((id) => {
        const layer = layers[id]
        const Icon = LAYER_ICONS[id]
        const disabled = !layer.available
        return (
          <div
            key={id}
            className={`ambient-layer${layer.active ? ' active' : ''}`}
            title={disabled ? `${layer.label} ambience audio isn't configured yet` : layer.label}
          >
            <span className="ambient-layer-label">{layer.label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={layer.volume}
              disabled={disabled}
              aria-label={`${layer.label} volume`}
              onChange={(event) => onVolumeChange(id, Number(event.target.value))}
              style={{ ['--progress' as string]: `${Math.round((disabled ? 0 : layer.volume) * 100)}%` }}
            />
            <button
              type="button"
              className="ambient-layer-mute"
              disabled={disabled}
              aria-pressed={layer.muted}
              aria-label={`${layer.muted ? 'Unmute' : 'Mute'} ${layer.label}`}
              onClick={() => onToggleMute(id)}
            >
              {layer.muted || disabled ? <VolumeX size={13} /> : <Icon size={13} />}
            </button>
          </div>
        )
      })}
      <Volume2 size={12} className="ambient-mixer-icon" aria-hidden="true" />
    </div>
  )
}
