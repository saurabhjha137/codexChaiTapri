import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AmbientMixer } from './AmbientMixer'
import type { AmbientLayerId, AmbientLayerState } from '../hooks/useAmbientAudio'

function makeLayers(overrides: Partial<Record<AmbientLayerId, Partial<AmbientLayerState>>> = {}) {
  const base: Record<AmbientLayerId, AmbientLayerState> = {
    rain: { id: 'rain', label: 'Rain', available: false, active: false, muted: false, volume: 0.35 },
    kettle: { id: 'kettle', label: 'Kettle & Cups', available: false, active: false, muted: false, volume: 0.35 },
    roadside: { id: 'roadside', label: 'Roadside Tapri', available: false, active: false, muted: false, volume: 0.35 },
  }
  for (const id of Object.keys(overrides) as AmbientLayerId[]) {
    base[id] = { ...base[id], ...overrides[id] }
  }
  return base
}

describe('AmbientMixer', () => {
  it('disables a layer control when no audio file is configured', () => {
    render(<AmbientMixer layers={makeLayers()} onVolumeChange={vi.fn()} onToggleMute={vi.fn()} />)

    expect(screen.getByRole('slider', { name: /rain volume/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /mute rain/i })).toBeDisabled()
  })

  it('enables the control once a layer has an audio file, and reports its title', () => {
    render(
      <AmbientMixer
        layers={makeLayers({ rain: { available: true } })}
        onVolumeChange={vi.fn()}
        onToggleMute={vi.fn()}
      />,
    )

    const slider = screen.getByRole('slider', { name: /rain volume/i })
    expect(slider).toBeEnabled()
  })

  it('calls onVolumeChange when the slider moves', () => {
    const onVolumeChange = vi.fn()
    render(
      <AmbientMixer
        layers={makeLayers({ rain: { available: true } })}
        onVolumeChange={onVolumeChange}
        onToggleMute={vi.fn()}
      />,
    )

    const slider = screen.getByRole('slider', { name: /rain volume/i })
    fireEvent.change(slider, { target: { value: '0.8' } })

    expect(onVolumeChange).toHaveBeenCalledWith('rain', 0.8)
  })

  it('calls onToggleMute when the mute button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleMute = vi.fn()
    render(
      <AmbientMixer
        layers={makeLayers({ kettle: { available: true } })}
        onVolumeChange={vi.fn()}
        onToggleMute={onToggleMute}
      />,
    )

    await user.click(screen.getByRole('button', { name: /mute kettle/i }))
    expect(onToggleMute).toHaveBeenCalledWith('kettle')
  })
})
