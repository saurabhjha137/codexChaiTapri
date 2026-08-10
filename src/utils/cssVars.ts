import type { CSSProperties } from 'react'

/**
 * Casts a map of CSS custom properties (e.g. `{ '--hero': 'url(...)' }`) to
 * `CSSProperties` in one typed, tested place instead of an inline `as`
 * scattered through component code.
 */
export function withCssVars(vars: Record<`--${string}`, string>): CSSProperties {
  return vars as CSSProperties
}
