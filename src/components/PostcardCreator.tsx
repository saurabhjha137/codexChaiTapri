import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import { siteConfig } from '../config/siteConfig'
import { useDialogFocus } from '../hooks/useDialogFocus'
import type { SceneMode } from '../types/scene'

type Preset = 'portrait' | 'landscape'
const sizes: Record<Preset, [number, number]> = { portrait: [1080, 1920], landscape: [1200, 630] }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src
  })
}

function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/); let line = ''; let offset = 0
  for (const word of words) {
    const test = `${line}${line ? ' ' : ''}${word}`
    if (line && ctx.measureText(test).width > maxWidth) { ctx.fillText(line, x, y + offset); line = word; offset += lineHeight }
    else line = test
  }
  if (line) ctx.fillText(line, x, y + offset)
}

export function PostcardCreator({ scene, currentTrackTitle }: { scene: SceneMode; currentTrackTitle?: string }) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<Preset>('portrait')
  const [message, setMessage] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const dialogRef = useDialogFocus(open, close)
  const title = currentTrackTitle || siteConfig.playlist[0].title

  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const [width, height] = sizes[preset]; canvas.width = width; canvas.height = height
    try {
      const background = await loadImage(siteConfig.backgrounds[scene])
      cover(ctx, background, width, height)
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(7,12,18,.28)'); gradient.addColorStop(.55, 'rgba(7,12,18,.15)'); gradient.addColorStop(1, 'rgba(7,10,14,.88)')
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height)
      const pad = preset === 'portrait' ? 84 : 70
      ctx.fillStyle = '#f7e4c4'; ctx.textAlign = 'left'
      ctx.font = `${preset === 'portrait' ? 108 : 72}px serif`; ctx.fillText(siteConfig.hindiTitle, pad, preset === 'portrait' ? 240 : 145)
      ctx.fillStyle = '#efbb78'; ctx.font = `600 ${preset === 'portrait' ? 30 : 24}px sans-serif`; ctx.fillText('NOW PLAYING', pad, height - (preset === 'portrait' ? 470 : 250))
      ctx.fillStyle = '#fff8eb'; ctx.font = `${preset === 'portrait' ? 54 : 38}px serif`; wrap(ctx, title, pad, height - (preset === 'portrait' ? 390 : 195), width - pad * 2, preset === 'portrait' ? 65 : 46)
      if (message.trim()) { ctx.fillStyle = '#f5dcb7'; ctx.font = `${preset === 'portrait' ? 38 : 27}px sans-serif`; wrap(ctx, message.trim(), pad, height - (preset === 'portrait' ? 270 : 115), width - pad * 2, preset === 'portrait' ? 48 : 34) }
      ctx.fillStyle = 'rgba(255,248,235,.7)'; ctx.font = `${preset === 'portrait' ? 26 : 20}px sans-serif`
      ctx.fillText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), pad, height - 70)
      ctx.textAlign = 'right'; ctx.fillText(siteConfig.postcard.brandLine, width - pad, height - 70)
      setError('')
    } catch { setError('The postcard background could not be loaded. Please try again.') }
  }, [message, preset, scene, title])

  useEffect(() => {
    if (!open) return
    // Canvas is an external drawing surface; redraw when its declarative inputs change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void draw()
  }, [draw, open])
  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl) }, [downloadUrl])

  const exportCard = async (event: FormEvent) => {
    event.preventDefault(); await draw()
    const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png'))
    if (!blob) { setError('The postcard could not be exported.'); return }
    const file = new File([blob], `chai-ki-tapri-${preset}.png`, { type: 'image/png' })
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try { await navigator.share({ title: 'Chai Ki Tapri postcard', files: [file] }); return }
      catch (shareError) { if (shareError instanceof DOMException && shareError.name === 'AbortError') return }
    }
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(URL.createObjectURL(blob))
  }

  return <>
    <button className="feature-trigger postcard-trigger" type="button" onClick={() => setOpen(true)}>Make a postcard</button>
    {open && <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="tapri-dialog postcard-dialog" role="dialog" aria-modal="true" aria-labelledby="postcard-title" ref={dialogRef}>
        <button className="dialog-close" type="button" onClick={close} aria-label="Close postcard creator"><X /></button>
        <h2 id="postcard-title">Make a tapri postcard</h2><p>Your current scene, track and local time — composed entirely on this device.</p>
        <form className="postcard-grid" onSubmit={(e) => void exportCard(e)}>
          <div className="postcard-fields">
            <label htmlFor="postcard-message">Short message <span>(optional)</span></label>
            <input id="postcard-message" value={message} maxLength={80} onChange={(e) => setMessage(e.target.value)}/>
            <label htmlFor="postcard-preset">Format</label>
            <select id="postcard-preset" value={preset} onChange={(e) => setPreset(e.target.value as Preset)}><option value="portrait">Story · 1080 × 1920</option><option value="landscape">Share card · 1200 × 630</option></select>
            <button className="primary-action" type="submit"><Share2/> Share or export</button>
            {downloadUrl && <a className="secondary-action" href={downloadUrl} download={`chai-ki-tapri-${preset}.png`}><Download/> Download PNG</a>}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
          <canvas ref={canvasRef} className={`postcard-preview ${preset}`} role="img" aria-label={`Postcard preview with ${siteConfig.hindiTitle}, ${title}, and ${message || 'no custom message'}`}/>
        </form>
      </div>
    </div>}
  </>
}
