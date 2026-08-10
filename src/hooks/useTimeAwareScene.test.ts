import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTimeAwareScene } from './useTimeAwareScene'

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

function atHour(hour: number) {
  const date = new Date('2026-01-01T00:00:00')
  date.setHours(hour, 0, 0, 0)
  return () => date
}

describe('useTimeAwareScene', () => {
  it('picks the morning tapri scene between 05:00 and 11:59', () => {
    const { result } = renderHook(() => useTimeAwareScene({ storage: new MemoryStorage(), now: atHour(8) }))
    expect(result.current.scene).toBe('tapri')
    expect(result.current.auto).toBe(true)
  })

  it('picks the afternoon default scene between 12:00 and 16:59', () => {
    const { result } = renderHook(() => useTimeAwareScene({ storage: new MemoryStorage(), now: atHour(14) }))
    expect(result.current.scene).toBe('default')
  })

  it('picks the warm evening tapri scene between 17:00 and 20:59', () => {
    const { result } = renderHook(() => useTimeAwareScene({ storage: new MemoryStorage(), now: atHour(19) }))
    expect(result.current.scene).toBe('tapri')
  })

  it('picks the late-night scene between 21:00 and 04:59, wrapping past midnight', () => {
    const late = renderHook(() => useTimeAwareScene({ storage: new MemoryStorage(), now: atHour(23) }))
    expect(late.result.current.scene).toBe('default')
    const early = renderHook(() => useTimeAwareScene({ storage: new MemoryStorage(), now: atHour(3) }))
    expect(early.result.current.scene).toBe('default')
  })

  it('a manual scene selection overrides auto mode and persists', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => useTimeAwareScene({ storage, now: atHour(8) }))

    act(() => result.current.selectScene('rain'))

    expect(result.current.scene).toBe('rain')
    expect(result.current.auto).toBe(false)
    expect(JSON.parse(storage.getItem('tapri-scene-pref')!)).toEqual({ auto: false, manualScene: 'rain' })
  })

  it('selecting Auto restores time-based selection', () => {
    const storage = new MemoryStorage()
    storage.setItem('tapri-scene-pref', JSON.stringify({ auto: false, manualScene: 'rain' }))
    const { result } = renderHook(() => useTimeAwareScene({ storage, now: atHour(14) }))
    expect(result.current.scene).toBe('rain')

    act(() => result.current.selectAuto())

    expect(result.current.auto).toBe(true)
    expect(result.current.scene).toBe('default')
  })

  it('restores a previously persisted manual preference on mount', () => {
    const storage = new MemoryStorage()
    storage.setItem('tapri-scene-pref', JSON.stringify({ auto: false, manualScene: 'tapri' }))
    const { result } = renderHook(() => useTimeAwareScene({ storage, now: atHour(14) }))
    expect(result.current.scene).toBe('tapri')
    expect(result.current.auto).toBe(false)
  })
})
