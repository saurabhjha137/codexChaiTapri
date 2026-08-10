import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { useDialogFocus } from '../hooks/useDialogFocus'
import { getClientId } from '../lib/clientId'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type Entry = { id: string; nickname: string; message: string; reaction: string | null; created_at: string }
type Cursor = Pick<Entry, 'created_at' | 'id'>
const COOLDOWN_KEY = 'tapri-last-guestbook-entry'

export function Guestbook() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [coolingDown, setCoolingDown] = useState(() => Date.now() - Number(localStorage.getItem(COOLDOWN_KEY) ?? 0) < siteConfig.requests.cooldownMs)
  const close = useCallback(() => setOpen(false), [])
  const dialogRef = useDialogFocus(open, close)

  const load = useCallback(async (nextCursor: Cursor | null = null) => {
    if (!isSupabaseConfigured || !supabase) return
    setLoading(true); setError('')
    let query = supabase.from('guestbook_entries').select('id,nickname,message,reaction,created_at')
      .order('created_at', { ascending: false }).order('id', { ascending: false })
      .limit(siteConfig.guestbook.pageSize + 1)
    if (nextCursor) query = query.or(`created_at.lt.${nextCursor.created_at},and(created_at.eq.${nextCursor.created_at},id.lt.${nextCursor.id})`)
    const { data, error: queryError } = await query
    setLoading(false)
    if (queryError) { setError('The guestbook could not be loaded.'); return }
    const page = (data ?? []) as Entry[]
    const visible = page.slice(0, siteConfig.guestbook.pageSize)
    setEntries((current) => nextCursor ? [...current, ...visible] : visible)
    const last = visible.at(-1)
    setCursor(last ? { created_at: last.created_at, id: last.id } : null)
    setHasMore(page.length > siteConfig.guestbook.pageSize)
  }, [])

  useEffect(() => {
    const remaining = siteConfig.requests.cooldownMs - (Date.now() - Number(localStorage.getItem(COOLDOWN_KEY) ?? 0))
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setCoolingDown(false), remaining)
    return () => window.clearTimeout(timer)
  }, [success])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFormError(''); setSuccess('')
    const form = new FormData(event.currentTarget)
    const nickname = String(form.get('nickname') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const reaction = String(form.get('reaction') ?? '') || null
    if (!nickname) { setFormError('Please add a nickname.'); return }
    if (!message) { setFormError('Please write a message.'); return }
    if (nickname.length > siteConfig.guestbook.maxNicknameLength || message.length > siteConfig.guestbook.maxMessageLength) {
      setFormError('Your nickname or message is longer than the limit.'); return
    }
    if (!isSupabaseConfigured || !supabase) { setSuccess('Preview received — connect Supabase to send it for approval.'); return }
    // Follow-up: add server-side submission-rate enforcement keyed by client_id; RLS alone is not an abuse limiter.
    const { error: insertError } = await supabase.from('guestbook_entries').insert({
      nickname, message, reaction, status: 'pending', client_id: getClientId(),
    })
    if (insertError) { setFormError('Your note did not reach the guestbook. Please retry.'); return }
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
    setSuccess('Your note is awaiting approval. Shukriya!'); setCoolingDown(true)
    event.currentTarget.reset()
  }

  return <>
    <button className="feature-trigger guestbook-trigger" type="button" onClick={() => { setOpen(true); void load() }}>Guestbook</button>
    {open && <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="tapri-dialog" role="dialog" aria-modal="true" aria-labelledby="guestbook-title" ref={dialogRef}>
        <button className="dialog-close" type="button" onClick={close} aria-label="Close guestbook"><X /></button>
        <h2 id="guestbook-title">Tapri guestbook</h2>
        <p>Leave a little note. It appears here after approval.</p>
        {!isSupabaseConfigured && <p className="mode-note">Preview mode — notes are demonstrated locally and the public feed is not connected.</p>}
        <form className="community-form" onSubmit={(e) => void submit(e)} noValidate>
          <label htmlFor="guestbook-nickname">Nickname</label><input id="guestbook-nickname" name="nickname" required maxLength={siteConfig.guestbook.maxNicknameLength}/>
          <label htmlFor="guestbook-message">Message</label><textarea id="guestbook-message" name="message" required maxLength={siteConfig.guestbook.maxMessageLength}/>
          <label htmlFor="guestbook-reaction">Reaction <span>(optional)</span></label>
          <select id="guestbook-reaction" name="reaction"><option value="">No reaction</option>{siteConfig.reactions.options.map(option => <option key={option.emoji} value={option.emoji}>{option.emoji} {option.label}</option>)}</select>
          <button className="primary-action" type="submit" disabled={coolingDown}>{coolingDown ? 'Have another chai first' : 'Leave a note'}</button>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {success && <p className="form-success" role="status">{success}</p>}
        </form>
        <section className="public-feed" aria-labelledby="guestbook-feed"><h3 id="guestbook-feed">Notes from the tapri</h3>
          {error ? <p role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></p> : !isSupabaseConfigured ? <p>No live notes in preview mode.</p> : entries.length === 0 && !loading ? <p>No approved notes yet.</p> : <ul>{entries.map(entry => <li key={entry.id}><strong>{entry.reaction} {entry.nickname}</strong><span>{entry.message}</span><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString()}</time></li>)}</ul>}
          {loading && <p role="status">Loading notes…</p>}
          {hasMore && !loading && <button className="secondary-action" type="button" onClick={() => void load(cursor)}>Load more</button>}
        </section>
      </div>
    </div>}
  </>
}
