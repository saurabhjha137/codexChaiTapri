import { siteConfig } from '../config/siteConfig'

export function HeroBrand() {
  return <main className="hero-brand">
    <p className="eyebrow"><span/>LIVE FROM THE CORNER</p>
    <h1>{siteConfig.hindiTitle}</h1>
    <p className="english-name">{siteConfig.name}</p>
    <p className="tagline">{siteConfig.tagline}</p>
  </main>
}
