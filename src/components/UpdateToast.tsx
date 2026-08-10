import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * `registerType: 'prompt'` means the new service worker installs but waits
 * — this toast is what actually lets the user apply it, so nobody gets
 * silently stuck on a stale build with no way to update.
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  if (needRefresh) {
    return (
      <div className="update-toast" role="status">
        <span>A new version of Chai Ki Tapri is ready.</span>
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
        <button type="button" onClick={() => setNeedRefresh(false)} className="secondary-action">
          Later
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="update-toast" role="status">
        <span>Chai Ki Tapri is ready to work offline.</span>
        <button type="button" onClick={() => setOfflineReady(false)}>
          Dismiss
        </button>
      </div>
    )
  }

  return null
}
