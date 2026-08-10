import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  it('renders the hero brand, header, and player by default', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText(/chai lovers online/i)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /chai ki tapri music player/i })).toBeInTheDocument()
  })

  it('switches the scene class when a scene is manually selected', async () => {
    // Seed a manual "default" scene preference so this doesn't depend on
    // the real wall-clock time (useTimeAwareScene otherwise auto-picks a
    // scene from the current hour — see useTimeAwareScene.test.ts for that
    // behaviour in isolation).
    window.localStorage.setItem('tapri-scene-pref', JSON.stringify({ auto: false, manualScene: 'default' }))

    const user = userEvent.setup()
    const { container } = render(<App />)
    const root = container.firstElementChild as HTMLElement

    expect(root.className).toContain('scene-default')

    await user.click(screen.getByRole('button', { name: 'Rain' }))
    expect(root.className).toContain('scene-rain')

    await user.click(screen.getByRole('button', { name: 'Rain' }))
    expect(root.className).toContain('scene-default')
  })
})
