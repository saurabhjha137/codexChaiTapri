import { useCallback, useEffect, useState } from 'react'
import { siteConfig } from '../config/siteConfig'
import type { SceneMode } from '../types/scene'

const STORAGE_KEY = 'tapri-scene-pref'
const RECHECK_INTERVAL_MS = 5 * 60_000

interface ScenePref {
  auto: boolean
  manualScene: SceneMode
}

function sceneForHour(hour: number): SceneMode {
  const match = siteConfig.scenes.schedule.find((band) =>
    band.start <= band.end ? hour >= band.start && hour <= band.end : hour >= band.start || hour <= band.end,
  )
  return match?.scene ?? 'default'
}

function readPref(storage: Storage): ScenePref {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { auto: true, manualScene: 'default' }
    const parsed = JSON.parse(raw) as Partial<ScenePref>
    const manualScene: SceneMode =
      parsed.manualScene === 'rain' || parsed.manualScene === 'tapri' || parsed.manualScene === 'default'
        ? parsed.manualScene
        : 'default'
    return { auto: parsed.auto !== false, manualScene }
  } catch {
    return { auto: true, manualScene: 'default' }
  }
}

interface UseTimeAwareSceneOptions {
  storage?: Storage
  now?: () => Date
}

/**
 * Picks a starting scene from the visitor's local time (see
 * `siteConfig.scenes.schedule`), unless they've manually chosen Rain/Tapri —
 * a manual choice persists and overrides auto-selection until they pick
 * "Auto" again.
 */
export function useTimeAwareScene({ storage, now = () => new Date() }: UseTimeAwareSceneOptions = {}) {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)

  const [pref, setPref] = useState<ScenePref>(() => (store ? readPref(store) : { auto: true, manualScene: 'default' }))
  const [scene, setSceneState] = useState<SceneMode>(() => (pref.auto ? sceneForHour(now().getHours()) : pref.manualScene))

  const persist = useCallback(
    (next: ScenePref) => {
      setPref(next)
      store?.setItem(STORAGE_KEY, JSON.stringify(next))
    },
    [store],
  )

  // Re-evaluate periodically while in auto mode, so a long-open tab still
  // crosses schedule boundaries (e.g. afternoon -> evening) without a reload.
  useEffect(() => {
    if (!pref.auto) return
    const recompute = () => setSceneState(sceneForHour(now().getHours()))
    recompute()
    const timer = window.setInterval(recompute, RECHECK_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [pref.auto, now])

  const selectScene = useCallback(
    (next: SceneMode) => {
      setSceneState(next)
      persist({ auto: false, manualScene: next })
    },
    [persist],
  )

  const selectAuto = useCallback(() => {
    persist({ auto: true, manualScene: pref.manualScene })
    setSceneState(sceneForHour(now().getHours()))
  }, [persist, pref.manualScene, now])

  return { scene, auto: pref.auto, selectScene, selectAuto }
}
