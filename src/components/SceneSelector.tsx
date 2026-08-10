import { CloudRain, Sparkles, Store } from 'lucide-react'
import type { SceneMode } from '../types/scene'

interface SceneSelectorProps {
  scene: SceneMode
  auto: boolean
  onSelectScene: (scene: SceneMode) => void
  onSelectAuto: () => void
}

const SCENE_ITEMS = [
  { label: 'Rain', icon: CloudRain, mode: 'rain' as const },
  { label: 'Tapri', icon: Store, mode: 'tapri' as const },
]

/**
 * Rain / Tapri / Auto. Picking Rain or Tapri is a manual override (persisted);
 * picking Auto restores time-of-day scene selection (see useTimeAwareScene).
 */
export function SceneSelector({ scene, auto, onSelectScene, onSelectAuto }: SceneSelectorProps) {
  return (
    <div className="ambient" aria-label="Scene controls">
      {SCENE_ITEMS.map(({ label, icon: Icon, mode }) => {
        const active = !auto && scene === mode
        return (
          <button
            key={label}
            className={active ? 'active' : ''}
            aria-pressed={active}
            title={`Switch to ${label} scene`}
            onClick={() => onSelectScene(active ? 'default' : mode)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        )
      })}
      <button
        className={auto ? 'active' : ''}
        aria-pressed={auto}
        title="Pick the scene automatically based on your local time"
        onClick={onSelectAuto}
      >
        <Sparkles size={16} />
        <span>Auto</span>
      </button>
    </div>
  )
}
