import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tapri-listeners'
const MIN_LISTENERS = 80
const MAX_LISTENERS = 180
const MOCK_TICK_MS = 7_000
const LIVE_POLL_MS = 15_000

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function readInitialCount(storage: Storage): number {
  const saved = storage.getItem(STORAGE_KEY)
  const count = saved ? Number(saved) : NaN
  if (Number.isFinite(count)) return count
  const initial = randomInRange(MIN_LISTENERS, MAX_LISTENERS)
  storage.setItem(STORAGE_KEY, String(initial))
  return initial
}

interface UseListenerCountOptions {
  /** Endpoint returning `{ "listeners": number }`. When unset, a mock live count is simulated. */
  liveUrl?: string | null
  storage?: Storage
}

/**
 * Provides a "listeners online" count. If `liveUrl` is configured it polls that
 * endpoint; otherwise it simulates a gently drifting count, persisted per tab
 * session so it doesn't jump around on re-render.
 */
export function useListenerCount({ liveUrl = null, storage }: UseListenerCountOptions = {}): number {
  const [listeners, setListeners] = useState(() => readInitialCount(storage ?? window.sessionStorage))

  useEffect(() => {
    const store = storage ?? window.sessionStorage
    let stopped = false

    if (liveUrl) {
      const update = async () => {
        try {
          const response = await fetch(liveUrl, { cache: 'no-store' })
          const data = (await response.json()) as { listeners?: number }
          if (!stopped && Number.isFinite(data.listeners)) {
            setListeners(Math.max(0, Number(data.listeners)))
          }
        } catch {
          // Keep the last valid count during a network interruption.
        }
      }
      void update()
      const timer = window.setInterval(update, LIVE_POLL_MS)
      return () => {
        stopped = true
        window.clearInterval(timer)
      }
    }

    const timer = window.setInterval(() => {
      setListeners((current) => {
        const drift = Math.floor(Math.random() * 7) - 3
        const next = Math.max(MIN_LISTENERS, Math.min(MAX_LISTENERS, current + drift))
        store.setItem(STORAGE_KEY, String(next))
        return next
      })
    }, MOCK_TICK_MS)
    return () => window.clearInterval(timer)
  }, [liveUrl, storage])

  return listeners
}
