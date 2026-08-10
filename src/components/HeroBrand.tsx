import { siteConfig } from '../config/siteConfig'

export function HeroBrand() {
  return <main className="hero-brand">
    <h1>{siteConfig.hindiTitle}</h1>
    <p className="english-name">{siteConfig.name}</p>
    <p className="tagline">{siteConfig.tagline}</p>
  </main>
}
