import { PlatformLinks } from './PlatformLinks'
import { siteConfig } from '../config/siteConfig'
import { useClock } from '../hooks/useClock'
import { useListenerCount } from '../hooks/useListenerCount'

export function Header() {
  const time = useClock()
  const listeners = useListenerCount({ liveUrl: siteConfig.liveListenersUrl })

  return (
    <header className="site-header">
      <div className="local-time">
        <span>Local time</span>
        <time>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
      </div>
      <div className="live-pill" aria-live="polite" aria-label={`${listeners} chai lovers online`}>
        <i />
        <span className="listener-count">{listeners}</span>
        <span>chai lovers</span>
        <em>online</em>
      </div>
      <PlatformLinks />
    </header>
  )
}
