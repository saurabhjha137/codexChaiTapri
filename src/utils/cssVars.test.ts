import { describe, expect, it } from 'vitest'
import { withCssVars } from './cssVars'

describe('withCssVars', () => {
  it('passes the custom properties through unchanged', () => {
    const style = withCssVars({ '--hero': 'url(/a.webp)', '--accent': '#fff' })
    expect(style).toEqual({ '--hero': 'url(/a.webp)', '--accent': '#fff' })
  })
})
