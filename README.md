# Chai Ki Tapri

An immersive, single-screen chai-stall music experience built with React, TypeScript, and Vite — a curated YouTube playlist, live reactions, song requests, a guestbook, shareable postcards, ambient sound, time-aware scenes, a vintage radio mode, and an installable PWA shell.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`, or preview that build with `npm run preview`.

No environment variables are required to run the app. Everything that depends on Supabase (live reactions, song requests, the guestbook, real cross-device listener presence) works out of the box in a clearly-labeled **local/preview mode** without any setup — see [Supabase setup](#supabase-setup) below for what changes once it's configured, and [What needs Supabase vs. what's local-only](#what-needs-supabase-vs-whats-local-only) for the exact list.

## Quality checks

```bash
npm run typecheck   # tsc -b --noEmit
npm run lint        # eslint .
npm run test        # vitest run
npm run test:watch  # vitest, watch mode
npm run test:coverage
```

All four (`typecheck`, `lint`, `test`, `build`) run in CI on every push/PR — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Project structure

```
src/
  components/   UI: Header, HeroBrand, MusicPlayer, RadioPlayer, SceneSelector, AmbientMixer,
                ReactionBar, FloatingReactions, SongRequestBoard, Guestbook, PostcardCreator,
                InstallPrompt, UpdateToast, OfflineFallback, PlatformLinks, ErrorBoundary
  hooks/        useClock, useListenerCount, useImagePreload, useAmbientAudio, useTimeAwareScene,
                useYouTubePlayer, useRealtimeRoom, useOnlineStatus
  lib/          supabaseClient (env-gated), youtubeIframeApi (loader), clientId (anon cooldown id)
  utils/        Small pure helpers (cssVars)
  config/       siteConfig.ts — all editable content and feature URLs
  test/         Vitest setup (jest-dom matchers, RTL cleanup)
supabase/
  migrations/   SQL migrations for song_requests and guestbook_entries (RLS included)
  README.md     How to apply the migrations to your own Supabase project
```

Each hook and component ships with a co-located `*.test.ts(x)` file. Business logic (timers, storage, fetch/Realtime, the YouTube IFrame API) lives in hooks so it's unit-testable without rendering the full component tree; components stay focused on rendered output and interaction.

## Edit the experience

Everything editable lives in [`src/config/siteConfig.ts`](src/config/siteConfig.ts):

| What | Field |
|---|---|
| Website name / Hindi title / tagline | `name`, `hindiTitle`, `tagline` |
| Backgrounds | `backgrounds` — replace the WebP files in `public/assets/` |
| Songs (main playlist) | `playlist` — see [Audio licensing](#audio-licensing) |
| Spotify link | `spotifyUrl` |
| Spotify player track list (enables Next/Previous) | `spotify.tracks` — see [Spotify playback](#spotify-playback) |
| YouTube playlist | `youtubeMusicUrl`, `youtubePlaylist.firstVideoId`, `youtubePlaylist.playlistId` |
| Ambient sound (rain / kettle / roadside) | `ambient.{rain,kettle,roadside}.audioUrl`, `ambient.defaultVolume` |
| Time-aware scene schedule | `scenes.schedule` |
| Radio mode on/off | `radio.enabled` |
| PWA theme/background color | `pwa.themeColor`, `pwa.backgroundColor` |
| Reaction emoji/labels, rate limit | `reactions.options`, `reactions.rateLimitMs`, `reactions.roomName` |
| Song request limits | `requests.cooldownMs`, `requests.maxNicknameLength`, `requests.maxDedicationLength` |
| Guestbook limits | `guestbook.maxNicknameLength`, `guestbook.maxMessageLength`, `guestbook.pageSize` |
| Postcard branding | `postcard.brandLine` |
| Realtime room names | `reactions.roomName`, `supabase.presenceRoom` |

## Feature notes

- **Live reactions** — Supabase Realtime *Broadcast* (never persisted to a table, by design). Client-side rate-limited per `reactions.rateLimitMs`. Floating reactions are capped concurrently and respect `prefers-reduced-motion`. Without Supabase configured, reactions still animate locally for the clicking user only, labeled "Preview mode."
- **Song requests** — a bottom sheet with Spotify/YouTube URL validation, optional nickname/dedication, and a client-side submission cooldown. Requests never auto-join the real playlist; they go through `pending → approved/rejected → played` moderation in Supabase.
- **Guestbook** — short nickname + message (+ optional reaction), cursor-paginated public feed. Only `approved` (and non-deleted) entries are publicly readable — enforced by Row Level Security, not app code.
- **Ambient sound** — independent rain/kettle/roadside loops, cross-faded in/out based on the active scene, with per-layer mute/volume persisted to `localStorage`. Never plays audibly without a prior user gesture (a scene click). If `ambient.*.audioUrl` is unset, that control disables itself with a tooltip instead of failing.
- **Time-aware scenes** — picks Morning/Afternoon/Evening/Late-night per `scenes.schedule` and the visitor's local hour. Manually picking Rain or Tapri overrides auto mode and persists; picking **Auto** restores time-based selection. Preference lives in `localStorage` (`tapri-scene-pref`).
- **Chai radio mode** — a vintage-dial skin toggled on top of the *same* YouTube IFrame Player instance used by the normal video view, so play/pause/seek/volume state always stays in sync between the two. Normal video mode remains the default and stays fully available. **Radio Mode is the default view on load**; the Video Mode toggle switches to the standard embed.
- **Source toggle (YouTube / Spotify)** — see [Spotify playback](#spotify-playback) below.
- **Postcards** — generated entirely client-side with the Canvas API from the app's own local background assets; the YouTube iframe is never captured (it's cross-origin, and wouldn't be permitted regardless). Exports PNG via `navigator.share` where available, falling back to a download link.
- **PWA** — installable, works offline for the app shell and local assets only. YouTube/Spotify/Supabase traffic is never cached or intercepted by the service worker.

## Spotify playback

The player has a YouTube/Spotify source toggle. Spotify playback uses the official [embed iFrame API](https://developer.spotify.com/documentation/embeds/reference/iframe-api) — the embed stays visible (required by Spotify's terms), driven by custom Play/Pause/Next/Previous/seek controls styled to match the rest of the player.

Two constraints worth knowing before you rely on this:

- **Full playback needs the visitor signed into Spotify (Premium) in that browser.** Without it, Spotify plays a 30-second preview instead — this is a Spotify platform behavior, not something this app can override. The player shows a note about this.
- **Next/Previous are config-driven, not automatic.** Spotify's public embed API doesn't expose a documented way to skip within an arbitrary playlist context, so `siteConfig.spotify.tracks` is an explicit ordered list of `{ title, artist, uri }` you provide (real `spotify:track:...` URIs — copy them from Spotify: right-click a track → Share → Copy Spotify URI). With fewer than two entries, Next/Previous disable themselves with a tooltip rather than doing nothing silently. By default this list is empty, so the player loads `spotifyUrl` as a playlist — Spotify's own embed shows and lets you click through its full track list, but the app's own Next/Previous buttons stay disabled until you populate `spotify.tracks`.

## Audio licensing

The three main playlist tracks ship with SoundHelix demo URLs (SoundHelix publishes free-use terms for these) purely as placeholders — swap in your own licensed, self-hosted audio via `siteConfig.playlist` before any real launch. Ambient rain/kettle/roadside loops ship **unset** (`audioUrl: null`) rather than with placeholder audio of uncertain provenance; each control gracefully disables itself with a tooltip until you add licensed loops and point `siteConfig.ambient.*.audioUrl` at them.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in your project's **Project URL** and **anon/public key** (Project Settings → API). Never put the `service_role` key here — it must never reach frontend code.
3. Apply the migrations in [`supabase/migrations/`](supabase/migrations) in order, either by pasting each file into the Supabase SQL editor or, if the Supabase CLI is linked, `supabase db push`. Details in [`supabase/README.md`](supabase/README.md).
4. Restart the dev server so Vite picks up the new env vars.

Both tables (`song_requests`, `guestbook_entries`) enable Row Level Security:
- Anonymous visitors may **insert** only rows with `status = 'pending'`.
- Anonymous visitors may **read** only moderated rows (`approved`/`played` for requests; `approved` and non-deleted for guestbook entries).
- Guestbook deletion is soft (`deleted_at`), never a hard `DELETE`.

### Moderation

There's no admin UI in this MVP by design — moderation (flipping `status` to `approved`/`rejected`/`played`, or setting `deleted_at`) happens from the Supabase dashboard's table editor, or a trusted server-side tool you build later, using your `service_role` key outside the browser. The schema and RLS policies are deliberately structured (a single `status` enum, `client_id` on every row) so an admin dashboard can be layered on without a schema change.

The per-client submission cooldown is enforced client-side (`localStorage`-backed) as a usability nicety, not a security boundary — it does not stop a determined abuser. A server-side rate limit (a Postgres function or an edge function checking submission frequency by `client_id`) is a documented follow-up, not yet implemented. Realtime Broadcast reactions have no RLS at all, since they're never persisted.

### What needs Supabase vs. what's local-only

| Feature | Without Supabase configured | With Supabase configured |
|---|---|---|
| Live reactions | Animate locally for the clicking user only ("Preview mode") | Broadcast to everyone in the room |
| Listener count | Gently-drifting local mock count | Real cross-device count via Realtime Presence |
| Song requests | Form disabled with an explanatory empty state | Submits to `song_requests`, shows the public queue |
| Guestbook | Form disabled with an explanatory empty state | Submits to `guestbook_entries`, shows the approved feed |
| Postcards | Fully functional (no backend involved) | Fully functional (no backend involved) |
| Ambient sound, time-aware scenes, radio mode, PWA | Fully functional (no backend involved) | Fully functional (no backend involved) |

## PWA

Installable via `vite-plugin-pwa` (Workbox-based). The service worker precaches the app shell and local `public/assets` images only — YouTube, Spotify, and Supabase requests are explicitly excluded from any caching. An **Install App** button appears only when the browser actually fires `beforeinstallprompt` (so not on iOS Safari, which doesn't support it). Updates use `registerType: 'prompt'`: a new build installs in the background and a small toast lets you reload into it — nobody gets silently stuck on a stale version. `public/offline.html` is the fallback for a fresh navigation with no cached page; an in-app banner (`OfflineFallback`) covers going offline mid-session.

## Deployment

Any static host that serves `dist/` works. This project ships a [`wrangler.jsonc`](wrangler.jsonc) for Cloudflare Workers static-assets hosting:

```bash
npm run build
npx wrangler deploy
```

Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as build-time environment variables on whichever host you deploy to (Cloudflare, Netlify, Vercel, etc.) if you want the Supabase-backed features live in production — the app runs fine without them too, per the table above.

## Artwork

The hero image was generated specifically for this project with OpenAI image generation, then optimized for the web. It does not reuse artwork from the inspiration sites.
