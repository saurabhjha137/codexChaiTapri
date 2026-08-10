import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Header } from './Header'

describe('Header', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T09:05:00Z'))
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the local time and a listener count', () => {
    render(<Header />)

    expect(screen.getByText('Local time')).toBeInTheDocument()
    const live = screen.getByLabelText(/chai lovers online/i)
    expect(live).toBeInTheDocument();
    const count = Number(live.querySelector('.listener-count')?.textContent)
    expect(count).toBeGreaterThanOrEqual(80)
    expect(count).toBeLessThanOrEqual(180)
  })

  it('renders Spotify and YouTube Music platform links', () => {
    render(<Header />)

    expect(screen.getByRole('link', { name: /spotify/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /youtube music/i })).toBeInTheDocument()
  })
})
