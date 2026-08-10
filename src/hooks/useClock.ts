import { useEffect, useState } from 'react'

/**
 * Tracks the current time, refreshed once a minute so the header clock
 * stays accurate without re-rendering on every second.
 */
export function useClock(intervalMs = 60_000): Date {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return time
}
