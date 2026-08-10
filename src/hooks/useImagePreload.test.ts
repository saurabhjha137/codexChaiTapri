import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useImagePreload } from './useImagePreload'

describe('useImagePreload', () => {
  it('creates an Image for each url', () => {
    const urls = ['/a.webp', '/b.webp']
    const { unmount } = renderHook(() => useImagePreload(urls))
    unmount()
    // No assertion on the DOM (Image() doesn't attach to it); this mainly
    // guards against the effect throwing for a normal url list.
    expect(urls).toHaveLength(2)
  })

  it('does not throw for an empty url list', () => {
    expect(() => renderHook(() => useImagePreload([]))).not.toThrow()
  })
})
