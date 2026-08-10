import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { siteConfig } from '../config/siteConfig'
import type { SceneMode } from '../types/scene'

export type AmbientLayerId = 'rain' | 'kettle' | 'roadside'

const SCENE_LAYERS: Record<SceneMode, AmbientLayerId[]> = {
  default: [],
  rain: ['rain'],
  tapri: ['kettle', 'roadside'],
}

const FADE_MS = 900
const STORAGE_KEY = 'tapri-ambience-prefs'

interface LayerPrefs {
  volume: number
  muted: boolean
}

type StoredPrefs = Partial<Record<AmbientLayerId, LayerPrefs>>

function readPrefs(storage: Storage): StoredPrefs {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredPrefs) : {}
  } catch {
    return {}
  }
}

export interface AmbientLayerState {
  id: AmbientLayerId
  label: string
  available: boolean
  active: boolean // fading in / playing for the current scene
  muted: boolean
  volume: number
}

interface UseAmbientAudioOptions {
  storage?: Storage
}

/**
 * Drives independent rain / kettle / roadside ambient loops, cross-fading
 * the pair that matches the active scene. Never calls `.play()` on mount —
 * only in reaction to a scene change that happens after mount, which in
 * practice only occurs from a user clicking Rain/Tapri/Auto (a real gesture).
 */
export function useAmbientAudio(scene: SceneMode, { storage }: UseAmbientAudioOptions = {}) {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
  const [initialPrefs] = useState<StoredPrefs>(() => (store ? readPrefs(store) : {}))

  const layerConfig = siteConfig.ambient

  const [layers, setLayers] = useState<Record<AmbientLayerId, AmbientLayerState>>(() => ({
    rain: {
      id: 'rain',
      label: layerConfig.rain.label,
      available: Boolean(layerConfig.rain.audioUrl),
      active: false,
      muted: initialPrefs.rain?.muted ?? false,
      volume: initialPrefs.rain?.volume ?? layerConfig.defaultVolume,
    },
    kettle: {
      id: 'kettle',
      label: layerConfig.kettle.label,
      available: Boolean(layerConfig.kettle.audioUrl),
      active: false,
      muted: initialPrefs.kettle?.muted ?? false,
      volume: initialPrefs.kettle?.volume ?? layerConfig.defaultVolume,
    },
    roadside: {
      id: 'roadside',
      label: layerConfig.roadside.label,
      active: false,
      available: Boolean(layerConfig.roadside.audioUrl),
      muted: initialPrefs.roadside?.muted ?? false,
      volume: initialPrefs.roadside?.volume ?? layerConfig.defaultVolume,
    },
  }))

  const audioRefs = useRef<Partial<Record<AmbientLayerId, HTMLAudioElement>>>({})
  const fadeTimers = useRef<Partial<Record<AmbientLayerId, number>>>({})
  const wasPlayingBeforeHidden = useRef<Set<AmbientLayerId>>(new Set())

  const getOrCreateAudio = useCallback(
    (id: AmbientLayerId): HTMLAudioElement | null => {
      const url = siteConfig.ambient[id].audioUrl
      if (!url) return null
      let audio = audioRefs.current[id]
      if (!audio) {
        audio = new Audio(url)
        audio.loop = true
        audio.volume = 0
        audioRefs.current[id] = audio
      }
      return audio
    },
    [],
  )

  const fadeTo = useCallback((id: AmbientLayerId, audio: HTMLAudioElement, target: number) => {
    const existing = fadeTimers.current[id]
    if (existing) window.clearInterval(existing)

    const steps = 18
    const stepMs = FADE_MS / steps
    const start = audio.volume
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      audio.volume = Math.max(0, Math.min(1, start + ((target - start) * i) / steps))
      if (i >= steps) {
        window.clearInterval(timer)
        delete fadeTimers.current[id]
        audio.volume = target
        if (target === 0) audio.pause()
      }
    }, stepMs)
    fadeTimers.current[id] = timer
  }, [])

  const setLayerActiveInternal = useCallback(
    (id: AmbientLayerId, active: boolean) => {
      const audio = getOrCreateAudio(id)
      const layerState = layers[id]
      if (!audio || !layerState.available) return

      if (active) {
        if (audio.paused) audio.play().catch(() => {})
        fadeTo(id, audio, layerState.muted ? 0 : layerState.volume)
      } else {
        fadeTo(id, audio, 0)
      }
    },
    [getOrCreateAudio, fadeTo, layers],
  )

  // React to scene changes: fade the matching layers in, everything else out.
  const isFirstRender = useRef(true)
  useEffect(() => {
    const activeSet = new Set(SCENE_LAYERS[scene])
    // Scene changes synchronize the rendered layer state with the external audio elements.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayers((prev) => {
      const next = { ...prev }
      ;(Object.keys(next) as AmbientLayerId[]).forEach((id) => {
        next[id] = { ...next[id], active: activeSet.has(id) }
      })
      return next
    })

    if (isFirstRender.current) {
      // Never autoplay audible sound on initial mount, even if the starting
      // scene (e.g. time-aware auto mode) implies ambience should be on.
      isFirstRender.current = false
      return
    }
    ;(['rain', 'kettle', 'roadside'] as AmbientLayerId[]).forEach((id) => {
      setLayerActiveInternal(id, activeSet.has(id))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  const persist = useCallback(() => {
    if (!store) return
    const toStore: StoredPrefs = {}
    ;(Object.keys(layers) as AmbientLayerId[]).forEach((id) => {
      toStore[id] = { volume: layers[id].volume, muted: layers[id].muted }
    })
    store.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }, [layers, store])

  useEffect(() => {
    persist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.rain.volume, layers.rain.muted, layers.kettle.volume, layers.kettle.muted, layers.roadside.volume, layers.roadside.muted])

  const setLayerVolume = useCallback((id: AmbientLayerId, volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume))
    setLayers((prev) => ({ ...prev, [id]: { ...prev[id], volume: clamped, muted: false } }))
    const audio = audioRefs.current[id]
    if (audio && layers[id].active) fadeTo(id, audio, clamped)
  }, [fadeTo, layers])

  const toggleLayerMute = useCallback((id: AmbientLayerId) => {
    setLayers((prev) => {
      const nextMuted = !prev[id].muted
      const audio = audioRefs.current[id]
      if (audio && prev[id].active) fadeTo(id, audio, nextMuted ? 0 : prev[id].volume)
      return { ...prev, [id]: { ...prev[id], muted: nextMuted } }
    })
  }, [fadeTo])

  // Pause on tab hide, resume (if it was playing) on tab show — no new
  // gesture needed since these layers were already started by an earlier one.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        wasPlayingBeforeHidden.current.clear()
        ;(Object.keys(audioRefs.current) as AmbientLayerId[]).forEach((id) => {
          const audio = audioRefs.current[id]
          if (audio && !audio.paused) {
            wasPlayingBeforeHidden.current.add(id)
            audio.pause()
          }
        })
      } else {
        wasPlayingBeforeHidden.current.forEach((id) => {
          audioRefs.current[id]?.play().catch(() => {})
        })
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Full cleanup on unmount.
  useEffect(() => {
    const refs = audioRefs.current
    const timers = fadeTimers.current
    return () => {
      Object.values(refs).forEach((audio) => audio?.pause())
      Object.values(timers).forEach((timer) => timer && window.clearInterval(timer))
    }
  }, [])

  return useMemo(
    () => ({
      layers,
      setLayerVolume,
      toggleLayerMute,
    }),
    [layers, setLayerVolume, toggleLayerMute],
  )
}
