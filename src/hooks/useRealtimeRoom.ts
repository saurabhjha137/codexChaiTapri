import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export interface RealtimeRoom {
  listenerCount: number | null
  sendReaction: (emoji: string) => void
  onReaction: (handler: (emoji: string, id: string) => void) => () => void
  connected: boolean
}

type ReactionHandler = (emoji: string, id: string) => void

function reactionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useRealtimeRoom(roomName: string): RealtimeRoom {
  const [listenerCount, setListenerCount] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef(new Set<ReactionHandler>())
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)

  const emit = useCallback((emoji: string, id: string) => {
    handlersRef.current.forEach((handler) => handler(emoji, id))
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const client = supabase
    const channel = client.channel(roomName, {
      config: { broadcast: { self: true }, presence: { key: reactionId('visitor') } },
    })
    channelRef.current = channel

    const updatePresence = () => {
      const count = Object.values(channel.presenceState()).reduce(
        (total, presences) => total + presences.length,
        0,
      )
      setListenerCount(count)
    }

    channel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence)
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (typeof payload?.emoji === 'string' && typeof payload?.id === 'string') {
          emit(payload.emoji, payload.id)
        }
      })
      .subscribe((status) => {
        const isConnected = status === 'SUBSCRIBED'
        setConnected(isConnected)
        if (isConnected) {
          void channel.track({ online_at: new Date().toISOString() })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setListenerCount(null)
        }
      })

    return () => {
      channelRef.current = null
      setConnected(false)
      setListenerCount(null)
      void client.removeChannel(channel)
    }
  }, [emit, roomName])

  const sendReaction = useCallback(
    (emoji: string) => {
      const id = reactionId(isSupabaseConfigured ? 'reaction' : 'local')
      const channel = channelRef.current
      if (!isSupabaseConfigured || !channel) {
        emit(emoji, id)
        return
      }
      void channel.send({ type: 'broadcast', event: 'reaction', payload: { emoji, id } }).then(
        (result) => {
          if (result !== 'ok') emit(emoji, id)
        },
        () => emit(emoji, id),
      )
    },
    [emit],
  )

  const onReaction = useCallback((handler: ReactionHandler) => {
    handlersRef.current.add(handler)
    return () => handlersRef.current.delete(handler)
  }, [])

  return { listenerCount, sendReaction, onReaction, connected }
}
