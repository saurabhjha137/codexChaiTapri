# Brief for Codex: Chai Ki Tapri — Community, Requests & Sharing features

Paste this whole file as your prompt. It's self-contained — you don't need
any other context from outside this repo.

## What this project is

`chai-ki-tapri` — a single-screen, cinematic React + TypeScript + Vite web
app (a roadside Indian tea-stall music experience: warm lighting, rain/tapri
background scenes, a YouTube-embedded playlist, Spotify link). It's already
built and production-quality: strict TypeScript, ESLint, Vitest + React
Testing Library (29 passing tests), CI in `.github/workflows/ci.yml`.

Read `IMPLEMENTATION_PLAN.md` in this repo first — it's the full architecture
doc for the enhancement this brief is part of. This brief covers **your**
half only ("Workstream B"); a parallel session is doing "Workstream A"
(ambient audio, time-aware scenes, radio mode, PWA) — you don't need to touch
any of that, and you don't need to wait for it.

## Ground rules — read before writing any code

1. **Preserve the existing visual identity.** Don't touch
   `src/styles.css`'s existing rules, the `scene-{default,rain,tapri}` class
   approach, or `HeroBrand`/`Header`/`MusicPlayer`/`AmbientControls`. Your
   features are new, additive UI (modals/bars/panels) layered on top.
2. **Supabase must be fully optional at runtime.** Check
   `isSupabaseConfigured` (from `src/lib/supabaseClient.ts`, already scaffolded
   for you — see below) before any Supabase call. When it's `false`, every
   feature must still render and explain itself in a clearly-labeled local/
   demo mode — never crash, never show a broken form.
3. **Never put the Supabase service_role key in frontend code.** Only the
   anon key (`VITE_SUPABASE_ANON_KEY`) is used client-side. All write
   protection is via Row Level Security policies in your migrations, not
   app-level checks.
4. **Must pass, before you're done:** `npm run typecheck`, `npm run lint`,
   `npm run test`, `npm run build`. Zero console errors, zero unhandled
   promise rejections when clicking through every feature.
5. **Accessibility is mandatory, not polish:** every modal/sheet is a proper
   dialog (`role="dialog"`, `aria-modal`, labeled, focus-trapped, closable via
   `Esc`, returns focus on close). Every form control has a real `<label>`.
   Reduced-motion users get the non-animated variant of `FloatingReactions`.
6. Don't run `git push`. Commit locally if you want checkpoints, but pushing
   is being handled by the project owner directly.

## Shared foundations already in the repo (don't recreate these)

- `src/lib/supabaseClient.ts` exports:
  ```ts
  export const supabase: SupabaseClient | null
  export const isSupabaseConfigured: boolean
  ```
- `.env.example` documents `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
  A real `.env` may or may not exist locally with real values — code
  defensively either way.
- `src/config/siteConfig.ts` has a `reactions` / `requests` / `guestbook` /
  `postcard` / `supabase` section already typed (see `IMPLEMENTATION_PLAN.md`
  for the full interface) — **use these values instead of hardcoding text**,
  so a non-developer can reconfigure copy/limits without touching component
  code.
- `App.tsx` has HTML comments marking where to mount each new top-level
  component (`{/* MOUNT: ReactionBar */}` etc.) — add your `<ReactionBar />`
  etc. at those marks rather than restructuring the render tree.

## Your deliverables

### 1. `src/hooks/useRealtimeRoom.ts` — replace the stub with the real thing

The file currently exports a stub matching this contract — implement it for
real using Supabase Realtime **Presence** (for `listenerCount`) and
**Broadcast** (for reactions, which are explicitly never persisted to a
table):

```ts
export interface RealtimeRoom {
  listenerCount: number | null // null = not configured / not yet connected
  sendReaction: (emoji: string) => void
  onReaction: (handler: (emoji: string, id: string) => void) => () => void
  connected: boolean
}
export function useRealtimeRoom(roomName: string): RealtimeRoom
```

When `isSupabaseConfigured` is false, return `listenerCount: null` and make
`sendReaction`/`onReaction` work **locally only** (loop reactions back to the
same client so the UI still demos something) — don't throw, don't silently
no-op without explanation (surface a "preview mode" state the calling
component can show).

`Header.tsx` (already built, owned by the other workstream) will consume
`listenerCount` and fall back to its own mock hook when it's `null` — you
should not need to edit `Header.tsx` at all if this contract is honored.

### 2. `src/components/ReactionBar.tsx` + `src/components/FloatingReactions.tsx`

- Buttons driven by `siteConfig.reactions.options` (☕ Cutting, 🌧️ Baarish,
  ❤️ Wah!, 🔥 Kya gaana hai — but read from config, don't hardcode).
- On click: call `sendReaction(emoji)`, and client-side disable that button
  for `siteConfig.reactions.rateLimitMs` (visual cooldown, e.g. a shrinking
  ring or opacity dim — subtle).
- `FloatingReactions` subscribes via `onReaction` and renders each incoming
  reaction as an emoji that floats upward and fades over ~2s, then unmounts.
  Cap concurrent floaters (~12) — drop the oldest if over the cap rather than
  letting the DOM grow unbounded. Wrap the animation in a
  `prefers-reduced-motion` check; the reduced-motion fallback can be as
  simple as a brief static emoji fade (no upward translation).

### 3. `src/components/SongRequestBoard.tsx`

Bottom sheet or modal, trigger button placed at the app's mount point.
- Fields: Spotify URL, YouTube/YT Music URL (at least one required),
  nickname (optional, ≤40 chars), dedication (optional, ≤200 chars — pull
  limits from `siteConfig.requests`).
- Client-side URL validation:
  - Spotify: matches `open.spotify.com/(track|playlist|album)/...`
  - YouTube: matches `(www.)?(music.)?youtube.com/watch?v=...` or
    `youtu.be/...` or `.../playlist?list=...`
  - Reject anything else with a specific inline error, not a generic "invalid".
- On submit: insert into `song_requests` (see migration below) with
  `status: 'pending'`. Disable the submit button for
  `siteConfig.requests.cooldownMs` after a successful submit (persist last-
  submit time in `localStorage` so refresh doesn't bypass it).
- Show a compact list of `approved`/`played` requests (public queue) below
  the form, loaded from Supabase; when unconfigured, show a labeled empty
  state explaining requests aren't wired up yet.
- Implement and visually distinguish all five states: empty (no requests
  yet), loading (initial fetch), success (post-submit confirmation),
  validation-error (per-field), network-error (submit or fetch failed, with
  a retry affordance).

### 4. `src/components/Guestbook.tsx`

- Nickname (required, ≤30 chars) + message (required, ≤200 chars) + optional
  reaction emoji picked from `siteConfig.reactions.options`.
- Insert into `guestbook_entries` with `status: 'pending'`. Explain in the UI
  that entries appear after approval (since only `approved` rows are
  publicly readable per RLS — see migration).
- Public feed: cursor-based pagination using `(created_at, id)` keyset (not
  `OFFSET`), page size from `siteConfig.guestbook.pageSize`, a "Load more"
  control (not infinite scroll, keep it simple and keyboard-operable).
- All content is rendered as plain React text (never
  `dangerouslySetInnerHTML`) — this is what makes it safe by default.
- Client cooldown similar to the request board. Note in a code comment that
  server-side abuse protection beyond RLS (e.g. a Postgres function checking
  submission rate by `client_id`) is a follow-up if you have time — call out
  in your summary whether you implemented it or left it as a documented gap.

### 5. `src/components/PostcardCreator.tsx`

- Pure client-side, Canvas 2D API (no server, no Supabase).
- Compose: the currently active background image (`siteConfig.backgrounds[scene]`,
  a local `/assets/*.webp` file — load via `new Image()` /
  `createImageBitmap`, draw with `ctx.drawImage`), "चाय की टपरी" text, current
  track title if the player exposes one (accept it as a prop — coordinate the
  exact prop name with whatever `App.tsx` looks like when you start; if the
  other workstream's radio-mode title isn't available yet, fall back to the
  config's default playlist title), current local time
  (`toLocaleTimeString`), an optional short custom message the user types in
  the form, and a `chaikitapri.wtf` wordmark from `siteConfig.postcard.brandLine`.
- **Do not** attempt to draw the YouTube `<iframe>` into the canvas — it's
  cross-origin and will taint the canvas (and isn't allowed by YouTube's
  terms regardless). Track title is plain text you already have, not a
  screenshot.
- Two export presets: portrait 1080×1920 (story), landscape 1200×630 (share
  card). `canvas.toBlob('image/png')` → `navigator.share({ files: [...] })`
  when available, otherwise an `<a download>` link to an object URL.
- Live preview (`<canvas>` or a rendered `<img>` from the blob) with an
  accessible text alternative, and real `<label>`s on the message input and
  preset selector.

### 6. Supabase migrations — `supabase/migrations/`

Two files, `0001_song_requests.sql` and `0002_guestbook_entries.sql`. Full
required shape (status enums, constraints, indexes, RLS policies) is spelled
out in `IMPLEMENTATION_PLAN.md` under "Supabase schema" — use that as your
starting point, refine column details as needed, but keep:
- UUID primary keys, `created_at timestamptz default now()`
- A moderation/request status enum, defaulting to `'pending'`
- A `client_id text` column on both tables (anonymous per-browser id, e.g. a
  UUID you generate once and store in `localStorage`) — this is what any
  cooldown/rate-limit logic keys off of
- Indexes that support the actual query patterns (status+created_at on
  requests; the approved-only feed on guestbook)
- RLS **enabled** on both tables, with:
  - an `insert` policy for `anon` that only allows `status = 'pending'` rows
  - a `select` policy for `anon` that only exposes `approved`/`played` rows
    (requests) or `approved AND deleted_at IS NULL` rows (guestbook)
- `deleted_at timestamptz` on `guestbook_entries` for soft delete (no hard
  `DELETE` statements anywhere in the app)

Also write a short `supabase/README.md` explaining how to apply these (SQL
editor paste, or `supabase db push` if the CLI is set up) — the project owner
will run this themselves against their own Supabase project.

## When you're done

1. Run `npm run typecheck && npm run lint && npm run test && npm run build`
   and fix anything red.
2. Click through every feature you built with Supabase **unconfigured**
   (no `.env`) and confirm nothing crashes or shows a broken UI — this is the
   most commonly-skipped requirement, don't skip it.
3. If you have a real Supabase project to test against, click through with
   it configured too, and confirm RLS actually blocks what it should
   (try reading a `pending` guestbook entry as `anon` and confirm it's
   invisible).
4. Update `IMPLEMENTATION_PLAN.md`'s Workstream B section with anything that
   changed from the plan (exact final column names, any RLS policy you
   simplified, anything you deliberately left as a documented gap).
5. Summarize what you built and what's left, in plain terms, for the project
   owner — don't assume they'll read the diff.
