import { CloudRain, Store } from 'lucide-react'

export type SceneMode = 'default' | 'rain' | 'tapri'

export function AmbientControls({ mode, onChange }: { mode: SceneMode, onChange: (mode: SceneMode) => void }) {
  const items = [
    { label: 'Rain', icon: CloudRain, mode: 'rain' as const },
    { label: 'Tapri', icon: Store, mode: 'tapri' as const },
  ]
  return <div className="ambient" aria-label="Scene controls">
    {items.map(({ label, icon: Icon, mode: itemMode }) => <button key={label} className={mode === itemMode ? 'active' : ''} aria-pressed={mode === itemMode} title={`Toggle ${label} scene`} onClick={() => onChange(mode === itemMode ? 'default' : itemMode)}><Icon size={16}/><span>{label}</span></button>)}
  </div>
}
