# Chai Ki Tapri — Enhancement Plan (Reactions, Requests, Ambience, Radio, PWA, etc.)

Status: **planning complete, Workstream A in progress**. This file is the shared
source of truth for both people/agents working on this. Update it as scope
shifts — don't let it drift from reality.

## Ground rules (apply to both workstreams)

1. **Preserve the existing identity.** Don't touch the cinematic visual
   language, the `scene-{default,rain,tapri}` CSS approach, or the config-driven
   pattern already in `src/config/siteConfig.ts`. New features are additive.
2. **Supabase is optional at runtime, always.** Every Supabase-backed feature
   must detect an unconfigured backend (`isSupabaseConfigured === false`) and
   fall back to a clearly-labeled local-only mode — never a broken UI, never a
   thrown error. This is a hard requirement from the spec, not a nice-to-have.
3. **No service-role key in the frontend, ever.** Only `VITE_SUPABASE_ANON_KEY`
   ships to the browser. All write access is mediated by Row Level Security
   policies, not application logic.
4. **No new console errors, no unhandled rejections.** Both workstreams must
   pass `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
   before merging.
5. **Accessibility and reduced-motion are not optional.** Every new floating/
   animated element respects `prefers-reduced-motion`; every new modal/sheet is
   keyboard-navigable with a labeled accessible name and focus trap.
6. **File ownership below is a coordination tool, not a hard wall.** If a
   boundary turns out to be wrong once you're in the code, fix it — just update
   this doc so the other side isn't surprised.

## Shared foundations (owned by Claude, built first, both sides depend on these)

These exist specifically so Workstream A and B can proceed **in parallel**
without both editing the same files at the same time.

| File | Purpose |
|---|---|
| `src/config/siteConfig.ts` | Extended config shape (below) — the single source of truth for all new editable content/URLs. |
| `src/lib/supabaseClient.ts` | Exports `supabase: SupabaseClient \| null` and `isSupabaseConfigured: boolean`. Reads `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Never throws if unset. |
| `.env.example` | Documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with no real values. |
| `src/hooks/useRealtimeRoom.ts` | **Contract stub** — real implementation is Codex's job (Workstream B), but the exported function signatures exist from day one so Workstream A's `Header` can compile and run against a local-fallback implementation immediately. |
| `App.tsx` | Gets clearly-commented mount points (`{/* MOUNT: ReactionBar */}` etc.) for every new top-level component, so both sides append rather than edit the same lines. |

### `siteConfig.ts` — extended shape

```ts
export interface SiteConfig {
  // ...existing fields (name, hindiTitle, tagline, spotifyUrl, youtubeMusicUrl,
  // youtubePlaylist, liveListenersUrl, backgrounds, playlist)...

  // --- Workstream A additions ---
  ambience: {
    rain: { label: string; audioUrl: string | null }
    kettle: { label: string; audioUrl: string | null }
    roadside: { label: string; audioUrl: string | null }
    defaultVolume: number // 0..1, independent of music volume
  }
  scenes: {
    auto: boolean // default true; false once user manually picks a scene
    schedule: Array<{ start: number; end: number; scene: SceneMode; label: string }>
    // 5–11:59 tapri(morning), 12–16:59 default(afternoon), 17–20:59 tapri(evening warm),
    // 21–4:59 rain(late-night radio) — exact scene mapping decided in Workstream A, see below
  }
  radio: {
    enabled: boolean // feature flag so "normal player" stays the default per spec
  }
  pwa: {
    themeColor: string
    backgroundColor: string
  }

  // --- Workstream B additions ---
  reactions: {
    options: Array<{ emoji: string; label: string }> // ☕ 🌧️ ❤️ 🔥
    rateLimitMs: number // min gap between a client's own reactions
    roomName: string // Supabase Realtime channel name
  }
  requests: {
    cooldownMs: number
    maxMessageLength: number
  }
  guestbook: {
    maxMessageLength: number
    pageSize: number
  }
  postcard: {
    brandLine: string // "chaikitapri.wtf"
  }
  supabase: {
    // no secrets here — just non-secret behavioral config
    presenceRoom: string
  }
}
```

Claude adds this shape and fills in **Workstream A's** real values (ambience
URLs, scene schedule) plus safe placeholder/empty values for **Workstream B's**
section (so the file compiles immediately) — Codex fills those in for real.

### `useRealtimeRoom` contract (the one seam between the two workstreams)

Codex owns the real implementation. Claude's `Header` depends only on this
signature, so it can be built and tested today against a stub:

```ts
// src/hooks/useRealtimeRoom.ts
export interface RealtimeRoom {
  /** Live presence count, or null if Supabase isn't configured / not yet connected. */
  listenerCount: number | null
  /** Broadcast a reaction to everyone in the room. No-ops locally if unconfigured. */
  sendReaction: (emoji: string) => void
  /** Subscribe to incoming reactions from other clients. */
  onReaction: (handler: (emoji: string, id: string) => void) => () => void
  connected: boolean
}

export function useRealtimeRoom(roomName: string): RealtimeRoom
```

Claude's `Header` tries `useRealtimeRoom(...).listenerCount`; if `null`, it
falls back to the existing `useListenerCount` mock/poll hook that's already
shipped. Codex fills in the real Presence + Broadcast logic inside this hook
— **no changes to `Header.tsx` should be required** once the contract is
satisfied.

## Workstream A — Claude (this session): "Scene & Playback Systems"

Extends systems Claude already built (`AmbientControls`, scene switching,
`MusicPlayer`, the whole build/test/CI pipeline). No Supabase dependency.

### A1. Real ambient sound → `AmbientMixer`, `useAmbientAudio`
- Independent Web Audio/`<audio>` layers for rain, kettle+cups, roadside tapri.
- Rain layer only starts on user gesture (per spec — never audible-autoplay).
- Fade-in/out (Web Audio `GainNode` ramps, not abrupt pause), no duplicate
  layers when switching scenes rapidly.
- Per-layer mute + volume, independent of music volume; persisted to
  `localStorage` (`tapri-ambience-prefs`).
- Pause via `document.visibilitychange` when tab hidden.
- Missing file → that control disables with a `title` tooltip explaining why;
  rest of the mixer stays usable.

### A2. Time-aware scenes → `SceneSelector`, `useTimeAwareScene`
- On load, compute scene from local hour per the spec's four bands, but map
  onto the app's existing 3-scene model (`default | rain | tapri`) plus a
  radio-mode flag for late-night, since that's what the codebase actually
  supports today:
  - 05:00–11:59 → `tapri` (morning)
  - 12:00–16:59 → `default` (afternoon)
  - 17:00–20:59 → `tapri` (warm evening — same visual scene, evening ambience mix)
  - 21:00–04:59 → `default` + Radio mode suggested (see A3)
- `SceneSelector` UI adds an explicit **Auto** pill alongside Rain/Tapri;
  clicking Rain/Tapri manually sets `scenes.auto = false` and persists the
  manual choice to `localStorage`; clicking Auto restores time-based behavior.
- Preload only the *next most likely* background (current scene + the one
  the clock will switch to next), not all three eagerly.

### A3. Chai radio mode → `RadioPlayer`, `useYouTubePlayer`
- Loads the official YouTube IFrame Player API (`https://www.youtube.com/iframe_api`),
  replacing the current privacy-embed `<iframe>` swap with a real
  `YT.Player` instance so JS can drive it.
- `useYouTubePlayer` wraps player-ready/state-change events, exposes
  `play/pause/next/previous/seek/setVolume/mute/unmute`, current title,
  duration, current time, and player state (`loading | playing | paused | error`).
- `RadioPlayer` is a visual skin (vintage radio dial/knobs) toggled on top of
  the same underlying player — "normal video mode" stays the default and
  remains fully available (spec requirement).
- No autoplay with sound; first play always requires a click.
- Iframe stays visible and at YouTube's documented minimum size — never
  hidden via `display:none`/zero-size (ToS compliance).

### A4. Installable PWA
- `vite-plugin-pwa` (actively maintained, Workbox-based, first-class Vite
  support) — generates the service worker, precaches the app shell + local
  webp/svg assets + self-hosted fonts if any; explicit `globIgnores`/runtime
  rules so YouTube/Spotify/Supabase requests are never intercepted.
- `manifest.webmanifest` with `display: standalone`, theme/background colors
  from `siteConfig.pwa`, and a real icon set (192/512 + maskable).
- `InstallPrompt` listens for `beforeinstallprompt`, shows a small button only
  when the event actually fires (iOS Safari gets no button — expected).
- `OfflineFallback` — a small offline screen shown when a navigation fails
  with no cache hit.
- Update flow: `registerType: 'prompt'` (not silent `autoUpdate`) so a toast
  offers "Reload to update" instead of trapping users on a stale build.
- `env(safe-area-inset-*)` padding already exists in `styles.css` from the
  original build; verified it still applies in standalone display mode.

## Workstream B — Codex (delegated): "Community, Requests & Sharing"

**Implementation status (2026-08-10): complete.** Final implementation keeps the
planned table columns and adds `id` as the second descending key on both feed
indexes so keyset pagination is deterministic when timestamps tie. Song request
URLs permit Spotify albums as well as tracks/playlists, matching the product
brief. The UI only reads approved/played requests and approved, non-deleted
guestbook entries; RLS enforces those same boundaries.

Client cooldowns are persisted in `localStorage`. Server-side submission-rate
enforcement keyed by `client_id` remains a documented follow-up (see
`supabase/README.md`); the migrations intentionally do not claim that RLS is a
rate limiter. Moderation remains an owner/dashboard operation, and no hard
delete path exists in the visitor app.

New Supabase-backed surfaces, all additive modals/panels/bars. This is the
half with real backend design work (schema + RLS), which is why it's bundled
together with the one Canvas-only feature (postcards) to balance scope against
Workstream A.

### B1. Live chai reactions → `ReactionBar`, `FloatingReactions`, `useRealtimeRoom`
- `useRealtimeRoom` (contract above) implements Supabase Realtime **Broadcast**
  (not a table — reactions are explicitly ephemeral, never persisted) plus
  **Presence** for the listener count.
- `ReactionBar`: 4 buttons (☕ 🌧️ ❤️ 🔥) with `siteConfig.reactions.options`
  driving labels so they're editable without touching component code.
- `FloatingReactions`: renders incoming broadcasts as short-lived upward-
  floating emoji over the scene; hard cap on concurrent particles (e.g. 12)
  with FIFO eviction so a reaction storm can't flood the DOM; disabled/replaced
  with a plain counter bump under `prefers-reduced-motion`.
- Rate limit: client-side debounce via `siteConfig.reactions.rateLimitMs`
  (disable the just-clicked button until the window elapses) — this is a UX
  guard, not a security boundary (Broadcast has no RLS to enforce server-side
  limits; note this tradeoff in the README).
- Local fallback (no Supabase): clicking a reaction still animates locally for
  the clicking user only, clearly documented as "preview mode."

### B2. Song request board → `SongRequestBoard`
- Bottom sheet / modal (accessible dialog, focus-trapped, `Esc` to close).
- Fields: Spotify URL, YouTube/YT Music URL, optional nickname, optional
  dedication. Validate against `open.spotify.com/track|playlist` and
  `(music.)youtube.com/watch|playlist` URL shapes client-side before submit.
- Writes a row to Supabase `song_requests` (`status: 'pending'`); shows the
  submitter's own recent requests plus a compact public queue of
  pending/approved ones (never auto-injected into the real playlist, per spec).
- Cooldown enforced client-side (disable submit button) **and** should be
  covered by a DB constraint/trigger if Codex has time (e.g. reject inserts
  from the same `client_id` within N seconds) — document whichever is
  actually implemented.
- All five states required: empty, loading, success, validation-error,
  network-error — each with its own copy, not a generic spinner-or-nothing.

### B3. Tapri guestbook → `Guestbook`
- Nickname + short message (+ optional reaction emoji) + timestamp.
- Writes to `guestbook_entries` as `status: 'pending'`; **only `approved` rows
  are publicly readable** (RLS, not app-level filtering).
- Cursor-based pagination (`created_at` + `id` keyset, not `OFFSET`) for the
  public feed.
- All user content escaped/rendered as text (React does this by default —
  the risk is only if `dangerouslySetInnerHTML` is used; don't use it).
- Soft delete: a `deleted_at` column, never a hard `DELETE`, so moderation
  history survives. No auth required for visitors to post; structure the
  `status` enum and RLS so an admin role can be layered on later without a
  schema change (e.g. a separate `is_admin` check function, not baked into
  every policy ad hoc).

### B4. Shareable postcards → `PostcardCreator`
- Pure client-side Canvas composition: current local background asset
  (already in `public/assets/*.webp` — decode via `createImageBitmap` or an
  `<img>` + `drawImage`, not a DOM screenshot library) + "चाय की टपरी" +
  current track title (from the player state, when available) + local time +
  optional short custom message + `chaikitapri.wtf` wordmark.
- **Never** attempts to capture the YouTube iframe (cross-origin canvas taint
  makes this impossible anyway, and it'd violate YouTube's terms) — track
  title text only.
- Two canvas presets: portrait (story, 1080×1920) and landscape (1200×630,
  share-card friendly). Export via `canvas.toBlob('image/png')`.
- `navigator.share` with a `File` when available; otherwise a download link.
  Accessible preview (`<img>` with alt text describing the card) + labeled
  form controls for the optional message.

### Supabase schema (Codex writes the migrations)

`supabase/migrations/0001_song_requests.sql`:
```sql
create type request_status as enum ('pending', 'approved', 'played', 'rejected');

create table song_requests (
  id uuid primary key default gen_random_uuid(),
  spotify_url text,
  youtube_url text,
  nickname text,
  dedication text,
  status request_status not null default 'pending',
  client_id text not null, -- anonymous per-browser id for cooldown enforcement
  created_at timestamptz not null default now(),
  constraint at_least_one_url check (spotify_url is not null or youtube_url is not null),
  constraint nickname_len check (char_length(nickname) <= 40),
  constraint dedication_len check (char_length(dedication) <= 200)
);
create index song_requests_status_created_idx on song_requests (status, created_at desc);

alter table song_requests enable row level security;
create policy "anyone can submit a request" on song_requests
  for insert to anon with check (status = 'pending');
create policy "public can read approved/played requests" on song_requests
  for select to anon using (status in ('approved', 'played'));
```

`supabase/migrations/0002_guestbook_entries.sql`:
```sql
create type moderation_status as enum ('pending', 'approved', 'rejected');

create table guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  message text not null,
  reaction text,
  status moderation_status not null default 'pending',
  client_id text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint nickname_len check (char_length(nickname) between 1 and 30),
  constraint message_len check (char_length(message) between 1 and 200)
);
create index guestbook_entries_public_feed_idx
  on guestbook_entries (created_at desc) where status = 'approved' and deleted_at is null;

alter table guestbook_entries enable row level security;
create policy "anyone can submit a guestbook entry" on guestbook_entries
  for insert to anon with check (status = 'pending');
create policy "public can read approved, non-deleted entries" on guestbook_entries
  for select to anon using (status = 'approved' and deleted_at is null);
```

Exact column list/constraints are Codex's call to refine, but the shape above
(status enums, `client_id` for cooldown, approved-only public read, soft
delete on guestbook) must survive into the final migrations — it's what the
RLS requirements in the spec are actually asking for.

## Environment & Supabase setup (manual, on you)

Neither of us can provision this — it needs your Supabase account:
1. Create a project at supabase.com (free tier is enough for this).
2. Project Settings → API → copy the **Project URL** and **anon/public key**
   (not the service_role key) into a local `.env` (never commit it):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Once Codex's migrations exist, run them via the Supabase SQL editor or
   `supabase db push` (Supabase CLI) against your project.
4. Everything works without steps 1–3 too — Supabase-backed features degrade
   to their documented local fallback.

## Sequencing

1. **Now (Claude):** land the shared foundations table above — this unblocks
   both workstreams immediately and is what makes true parallel work possible.
2. **Parallel:**
   - Claude implements A1–A4 in this session.
   - You paste the delegation brief (below) into Codex for B1–B4 + migrations.
3. **Integration pass (Claude):** once Codex's output exists, wire the one
   real seam (`useRealtimeRoom` real implementation replacing the stub),
   resolve any drift from this doc, run `typecheck`/`lint`/`test`/`build`,
   visual QA at 360/768/1440/1920px, update `README.md` (setup, migrations,
   moderation, PWA, audio licensing, deployment, "what needs Supabase vs.
   works locally").

## Delegation brief for Codex

See `CODEX_BRIEF.md` — a self-contained prompt with no dependency on this
conversation's history, ready to paste into a Codex CLI session pointed at
this same repo.
