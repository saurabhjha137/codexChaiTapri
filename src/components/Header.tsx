import { useEffect, useState } from 'react'
import { PlatformLinks } from './PlatformLinks'
import { siteConfig } from '../config/siteConfig'

export function Header() {
  const [time, setTime] = useState(() => new Date())
  const [listeners, setListeners] = useState(() => {
    const saved = sessionStorage.getItem('tapri-listeners')
    const count = saved ? Number(saved) : Math.floor(Math.random() * 101) + 80
    sessionStorage.setItem('tapri-listeners', String(count))
    return count
  })

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let stopped = false
    if (siteConfig.liveListenersUrl) {
      const update = async () => {
        try {
          const response = await fetch(siteConfig.liveListenersUrl!, { cache: 'no-store' })
          const data = await response.json() as { listeners?: number }
          if (!stopped && Number.isFinite(data.listeners)) setListeners(Math.max(0, Number(data.listeners)))
        } catch { /* Keep the last valid count during a network interruption. */ }
      }
      void update()
      const timer = window.setInterval(update, 15_000)
      return () => { stopped = true; window.clearInterval(timer) }
    }

    const timer = window.setInterval(() => {
      setListeners(current => {
        const next = Math.max(80, Math.min(180, current + Math.floor(Math.random() * 7) - 3))
        sessionStorage.setItem('tapri-listeners', String(next))
        return next
      })
    }, 7_000)
    return () => window.clearInterval(timer)
  }, [])

  return <header className="site-header">
    <div className="local-time"><span>Local time</span><time>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
    <div className="live-pill" aria-live="polite" aria-label={`${listeners} chai lovers online`}><i/><span className="listener-count">{listeners}</span><span>chai lovers</span><em>online</em></div>
    <PlatformLinks />
  </header>
}
