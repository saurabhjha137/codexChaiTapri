import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HeroBrand } from './HeroBrand'
import { siteConfig } from '../config/siteConfig'

describe('HeroBrand', () => {
  it('renders the Hindi title, English name, and tagline from config', () => {
    render(<HeroBrand />)

    expect(screen.getByRole('heading', { level: 1, name: siteConfig.hindiTitle })).toBeInTheDocument()
    expect(screen.getByText(siteConfig.name)).toBeInTheDocument()
    expect(screen.getByText(siteConfig.tagline)).toBeInTheDocument()
  })
})
