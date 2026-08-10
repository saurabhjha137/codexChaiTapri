import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRealtimeRoom } from './useRealtimeRoom'

describe('useRealtimeRoom (local-fallback stub)', () => {
  it('reports no live listener count until a real backend is wired in', () => {
    const { result } = renderHook(() => useRealtimeRoom('test-room'))
    expect(result.current.listenerCount).toBeNull()
  })

  it('echoes a sent reaction back to local subscribers', () => {
    const { result } = renderHook(() => useRealtimeRoom('test-room'))
    const handler = vi.fn()

    act(() => {
      result.current.onReaction(handler)
      result.current.sendReaction('☕')
    })

    expect(handler).toHaveBeenCalledWith('☕', expect.stringContaining('local-'))
  })

  it('stops notifying a handler once unsubscribed', () => {
    const { result } = renderHook(() => useRealtimeRoom('test-room'))
    const handler = vi.fn()

    let unsubscribe = () => {}
    act(() => {
      unsubscribe = result.current.onReaction(handler)
    })
    act(() => {
      unsubscribe()
      result.current.sendReaction('🔥')
    })

    expect(handler).not.toHaveBeenCalled()
  })
})
