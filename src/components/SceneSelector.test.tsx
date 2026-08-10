import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SceneSelector } from './SceneSelector'

describe('SceneSelector', () => {
  it('marks Auto as pressed when in auto mode, and Rain/Tapri as unpressed', () => {
    render(<SceneSelector scene="tapri" auto onSelectScene={vi.fn()} onSelectAuto={vi.fn()} />)

    expect(screen.getByRole('button', { name: /auto/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^rain$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /^tapri$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks the active manual scene as pressed and Auto as unpressed', () => {
    render(<SceneSelector scene="rain" auto={false} onSelectScene={vi.fn()} onSelectAuto={vi.fn()} />)

    expect(screen.getByRole('button', { name: /^rain$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /auto/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelectScene with the picked scene', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    render(<SceneSelector scene="default" auto={false} onSelectScene={onSelectScene} onSelectAuto={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^tapri$/i }))
    expect(onSelectScene).toHaveBeenCalledWith('tapri')
  })

  it('toggles a manually-active scene back to default when clicked again', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    render(<SceneSelector scene="rain" auto={false} onSelectScene={onSelectScene} onSelectAuto={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^rain$/i }))
    expect(onSelectScene).toHaveBeenCalledWith('default')
  })

  it('calls onSelectAuto when Auto is clicked', async () => {
    const user = userEvent.setup()
    const onSelectAuto = vi.fn()
    render(<SceneSelector scene="rain" auto={false} onSelectScene={vi.fn()} onSelectAuto={onSelectAuto} />)

    await user.click(screen.getByRole('button', { name: /auto/i }))
    expect(onSelectAuto).toHaveBeenCalled()
  })
})
