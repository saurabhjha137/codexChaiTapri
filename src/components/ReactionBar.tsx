import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../config/siteConfig'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export function ReactionBar({ sendReaction }: { sendReaction: (emoji: string) => void }) {
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({})
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const react = (emoji: string) => {
    sendReaction(emoji)
    setCooldowns((value) => ({ ...value, [emoji]: true }))
    timers.current.push(
      window.setTimeout(() => {
        setCooldowns((value) => ({ ...value, [emoji]: false }))
      }, siteConfig.reactions.rateLimitMs),
    )
  }

  return (
    <div className="reaction-wrap">
      <div className="reaction-bar" aria-label="Send a chai reaction">
        {siteConfig.reactions.options.map(({ emoji, label }) => (
          <button
            key={emoji}
            type="button"
            disabled={cooldowns[emoji]}
            onClick={() => react(emoji)}
            aria-label={`${emoji} ${label}`}
            title={label}
          >
            <span aria-hidden="true">{emoji}</span>
            <small>{label}</small>
          </button>
        ))}
      </div>
      {!isSupabaseConfigured && <span className="preview-badge">Preview mode · reactions stay here</span>}
    </div>
  )
}
