import { useEffect, useState } from 'react'
import type { RealtimeRoom } from '../hooks/useRealtimeRoom'

type Floater = { emoji: string; id: string; left: number }
const MAX_FLOATERS = 12

export function FloatingReactions({ onReaction }: Pick<RealtimeRoom, 'onReaction'>) {
  const [floaters, setFloaters] = useState<Floater[]>([])

  useEffect(
    () =>
      onReaction((emoji, id) => {
        const floater = { emoji, id, left: 12 + Math.random() * 76 }
        setFloaters((current) => [...current, floater].slice(-MAX_FLOATERS))
        window.setTimeout(() => {
          setFloaters((current) => current.filter((item) => item.id !== id))
        }, 2_200)
      }),
    [onReaction],
  )

  return (
    <div className="floating-reactions" aria-live="polite" aria-label="Live reactions">
      {floaters.map((item) => (
        <span key={item.id} style={{ left: `${item.left}%` }} aria-label={`${item.emoji} reaction`}>
          {item.emoji}
        </span>
      ))}
    </div>
  )
}
