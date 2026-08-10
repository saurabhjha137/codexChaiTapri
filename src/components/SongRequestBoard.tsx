import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { getClientId } from '../lib/clientId'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type RequestRow = {
  id: string
  nickname: string | null
  dedication: string | null
  spotify_url: string | null
  youtube_url: string | null
  status: 'approved' | 'played'
  created_at: string
}

type Errors = Partial<Record<'spotify' | 'youtube' | 'urls' | 'nickname' | 'dedication', string>>
const COOLDOWN_KEY = 'tapri-last-song-request'

function validSpotify(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'open.spotify.com' && /^\/(track|playlist|album)\/[^/]+/.test(url.pathname)
  } catch { return false }
}

function validYouTube(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return url.pathname.length > 1
    if (!['youtube.com', 'www.youtube.com', 'music.youtube.com'].includes(url.hostname)) return false
    return (url.pathname === '/watch' && Boolean(url.searchParams.get('v'))) ||
      (url.pathname === '/playlist' && Boolean(url.searchParams.get('list')))
  } catch { return false }
}

export function SongRequestBoard() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [coolingDown, setCoolingDown] = useState(() => Date.now() - Number(localStorage.getItem(COOLDOWN_KEY) ?? 0) < siteConfig.requests.cooldownMs)
  const close = useCallback(() => setOpen(false), [])
  const dialogRef = useDialogFocus(open, close)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return
    setLoading(true)
    setFetchError('')
    const { data, error } = await supabase
      .from('song_requests')
      .select('id,nickname,dedication,spotify_url,youtube_url,status,created_at')
      .in('status', ['approved', 'played'])
      .order('created_at', { ascending: false })
      .limit(20)
    setLoading(false)
    if (error) setFetchError('The public request queue could not be loaded.')
    else setRows((data ?? []) as RequestRow[])
  }, [])

  useEffect(() => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    const remaining = siteConfig.requests.cooldownMs - (Date.now() - last)
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setCoolingDown(false), remaining)
    return () => window.clearTimeout(timer)
  }, [success])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(''); setSuccess('')
    const form = new FormData(event.currentTarget)
    const spotify = String(form.get('spotify') ?? '').trim()
    const youtube = String(form.get('youtube') ?? '').trim()
    const nickname = String(form.get('nickname') ?? '').trim()
    const dedication = String(form.get('dedication') ?? '').trim()
    const next: Errors = {}
    if (!spotify && !youtube) next.urls = 'Add at least one Spotify or YouTube link.'
    if (spotify && !validSpotify(spotify)) next.spotify = 'Use an open.spotify.com track, playlist, or album link.'
    if (youtube && !validYouTube(youtube)) next.youtube = 'Use a YouTube watch, YouTube Music watch, youtu.be, or playlist link.'
    if (nickname.length > siteConfig.requests.maxNicknameLength) next.nickname = `Keep your nickname to ${siteConfig.requests.maxNicknameLength} characters.`
    if (dedication.length > siteConfig.requests.maxDedicationLength) next.dedication = `Keep your dedication to ${siteConfig.requests.maxDedicationLength} characters.`
    setErrors(next)
    if (Object.keys(next).length) return

    if (!isSupabaseConfigured || !supabase) {
      setSuccess('Preview received — connect Supabase to send it for approval.')
      return
    }
    const { error } = await supabase.from('song_requests').insert({
      spotify_url: spotify || null, youtube_url: youtube || null,
      nickname: nickname || null, dedication: dedication || null,
      status: 'pending', client_id: getClientId(),
    })
    if (error) { setSubmitError('Your request did not reach the tapri. Please try again.'); return }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setSuccess('Request sent for approval. Shukriya!'); setCoolingDown(true)
    event.currentTarget.reset()
  }

  return <>
    <button className="feature-trigger request-trigger" type="button" onClick={() => { setOpen(true); void load() }}>Request a song</button>
    {open && <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="tapri-dialog sheet" role="dialog" aria-modal="true" aria-labelledby="request-title" ref={dialogRef}>
        <button className="dialog-close" type="button" onClick={close} aria-label="Close song requests"><X /></button>
        <h2 id="request-title">Song requests</h2>
        <p>Leave a track for the tapri. Requests join the public queue after review.</p>
        {!isSupabaseConfigured && <p className="mode-note">Preview mode — submissions stay on this device and the public queue is not connected.</p>}
        <form className="community-form" onSubmit={(e) => void submit(e)} noValidate>
          <label htmlFor="request-spotify">Spotify URL</label><input id="request-spotify" name="spotify" type="url" aria-describedby={errors.spotify ? 'spotify-error' : undefined}/>
          {errors.spotify && <span className="field-error" id="spotify-error">{errors.spotify}</span>}
          <label htmlFor="request-youtube">YouTube or YouTube Music URL</label><input id="request-youtube" name="youtube" type="url" aria-describedby={errors.youtube ? 'youtube-error' : undefined}/>
          {errors.youtube && <span className="field-error" id="youtube-error">{errors.youtube}</span>}
          {errors.urls && <span className="field-error">{errors.urls}</span>}
          <label htmlFor="request-nickname">Nickname <span>(optional)</span></label><input id="request-nickname" name="nickname" maxLength={siteConfig.requests.maxNicknameLength}/>
          {errors.nickname && <span className="field-error">{errors.nickname}</span>}
          <label htmlFor="request-dedication">Dedication <span>(optional)</span></label><textarea id="request-dedication" name="dedication" maxLength={siteConfig.requests.maxDedicationLength}/>
          {errors.dedication && <span className="field-error">{errors.dedication}</span>}
          <button className="primary-action" type="submit" disabled={coolingDown}>{coolingDown ? 'Come back in a minute' : 'Send request'}</button>
          {success && <p className="form-success" role="status">{success}</p>}
          {submitError && <p className="form-error" role="alert">{submitError} <button type="submit">Retry</button></p>}
        </form>
        <section className="public-feed" aria-labelledby="queue-title"><h3 id="queue-title">Public queue</h3>
          {loading ? <p role="status">Loading requests…</p> : fetchError ? <p role="alert">{fetchError} <button type="button" onClick={() => void load()}>Retry</button></p> : !isSupabaseConfigured ? <p>No live queue in preview mode.</p> : rows.length === 0 ? <p>No approved requests yet. Be the first to leave one.</p> : <ul>{rows.map(row => <li key={row.id}><strong>{row.nickname || 'A chai lover'}</strong>{row.dedication && <span>{row.dedication}</span>}<em>{row.status}</em></li>)}</ul>}
        </section>
      </div>
    </div>}
  </>
}
