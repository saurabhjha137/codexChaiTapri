import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClock } from './useClock'

describe('useClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the current time on mount', () => {
    const { result } = renderHook(() => useClock())
    expect(result.current.toISOString()).toBe('2026-01-01T10:00:00.000Z')
  })

  it('updates after the interval elapses', () => {
    const { result } = renderHook(() => useClock(60_000))

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.toISOString()).toBe('2026-01-01T10:01:00.000Z')
  })

  it('stops updating after unmount', () => {
    const { result, unmount } = renderHook(() => useClock(60_000))
    unmount()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.toISOString()).toBe('2026-01-01T10:00:00.000Z')
  })
})
