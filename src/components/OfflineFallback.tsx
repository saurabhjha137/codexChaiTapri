import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

/**
 * A soft in-app banner for going offline mid-session (the static
 * `public/offline.html` handles a fresh navigation with no cache — this
 * covers the SPA-already-loaded case).
 */
export function OfflineFallback() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div className="offline-banner" role="status">
      <WifiOff size={14} aria-hidden="true" />
      <span>You&rsquo;re offline — showing the last loaded tapri.</span>
    </div>
  )
}
