import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useListenerCount } from './useListenerCount'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

describe('useListenerCount', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('seeds a random count within [80, 180] when storage is empty', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => useListenerCount({ storage }))

    expect(result.current).toBeGreaterThanOrEqual(80)
    expect(result.current).toBeLessThanOrEqual(180)
    expect(storage.getItem('tapri-listeners')).toBe(String(result.current))
  })

  it('reuses a previously persisted count instead of re-rolling', () => {
    const storage = new MemoryStorage()
    storage.setItem('tapri-listeners', '123')

    const { result } = renderHook(() => useListenerCount({ storage }))

    expect(result.current).toBe(123)
  })

  it('drifts the mock count within bounds on each tick', () => {
    vi.useFakeTimers()
    const storage = new MemoryStorage()
    storage.setItem('tapri-listeners', '80')
    const { result } = renderHook(() => useListenerCount({ storage }))

    act(() => {
      vi.advanceTimersByTime(7_000)
    })

    expect(result.current).toBeGreaterThanOrEqual(80)
    expect(result.current).toBeLessThanOrEqual(180)
  })

  it('polls the live endpoint and reflects its listener count', async () => {
    const storage = new MemoryStorage()
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ listeners: 42 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useListenerCount({ liveUrl: 'https://example.com/listeners', storage }),
    )

    await waitFor(() => expect(result.current).toBe(42))
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/listeners', { cache: 'no-store' })
  })

  it('keeps the last known count when the live endpoint errors', async () => {
    const storage = new MemoryStorage()
    storage.setItem('tapri-listeners', '99')
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useListenerCount({ liveUrl: 'https://example.com/listeners', storage }),
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current).toBe(99)
  })
})
