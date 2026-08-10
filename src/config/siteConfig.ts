import type { SceneMode } from '../types/scene'

export type Track = {
  title: string
  artist: string
  audioUrl: string
  artworkUrl: string
}

export type ReactionOption = {
  emoji: string
  label: string
}

export const siteConfig = {
  name: 'Chai Ki Tapri',
  hindiTitle: 'चाय की टपरी',
  tagline: 'एक कप चाय, कुछ पुराने गाने।',
  spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWY1kDGbdPb81',
  youtubeMusicUrl: 'https://music.youtube.com/watch?v=SLT4HF7nHKc&list=OLAK5uy_nkHY6d0_mX01SIifTVliGsIjdVWGcX6Pw',
  youtubePlaylist: {
    firstVideoId: 'SLT4HF7nHKc',
    playlistId: 'OLAK5uy_nkHY6d0_mX01SIifTVliGsIjdVWGcX6Pw',
  },
  // Set an endpoint returning `{ "listeners": 127 }` for a true cross-device count.
  // Until configured (or until Supabase Presence is live), the UI uses a
  // gently changing local preview count.
  liveListenersUrl: null as string | null,
  backgrounds: {
    default: '/assets/chai-tapri-hero.webp',
    rain: '/assets/chai-tapri-rain.webp',
    tapri: '/assets/chai-tapri-warm.webp',
  },
  playlist: [
    { title: 'Baarish Ki Khushboo', artist: 'Tapri Radio', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', artworkUrl: '/assets/cover-rain.svg' },
    { title: 'Shaam Ka Safar', artist: 'Tapri Radio', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', artworkUrl: '/assets/cover-evening.svg' },
    { title: 'Ek Aur Cutting', artist: 'Tapri Radio', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', artworkUrl: '/assets/cover-cutting.svg' },
  ] satisfies Track[],

  // --- Ambient sound layers (Workstream A). Independent of music volume. ---
  // Each `audioUrl: null` means "not shipped yet" — the control for that
  // layer disables itself with an explanatory tooltip rather than erroring.
  ambient: {
    rain: { label: 'Rain', audioUrl: null as string | null },
    kettle: { label: 'Kettle & Cups', audioUrl: null as string | null },
    roadside: { label: 'Roadside Tapri', audioUrl: null as string | null },
    defaultVolume: 0.35,
  },

  // --- Time-aware scene scheduling (Workstream A) ---
  scenes: {
    // Local-hour bands, in the order they're checked. `end` is inclusive.
    schedule: [
      { start: 5, end: 11, scene: 'tapri' as SceneMode, label: 'Morning Tapri' },
      { start: 12, end: 16, scene: 'default' as SceneMode, label: 'Afternoon' },
      { start: 17, end: 20, scene: 'tapri' as SceneMode, label: 'Warm Evening' },
      { start: 21, end: 23, scene: 'default' as SceneMode, label: 'Late-Night Radio' },
      { start: 0, end: 4, scene: 'default' as SceneMode, label: 'Late-Night Radio' },
    ],
  },

  // --- Chai radio mode (Workstream A) ---
  radio: {
    enabled: true,
  },

  // --- Spotify playback (source toggle alongside YouTube) ---
  // `spotifyUrl` above is what actually loads by default (a playlist, so
  // Spotify's own embed shows its full track list to click through).
  // `tracks` is optional: add real `spotify:track:...` URIs here (from
  // open.spotify.com track links — right-click a track > Share > Copy
  // Spotify URI, or convert the share link the same way spotifyUrl is
  // converted) to enable the custom Next/Previous buttons. With fewer than
  // two entries, Next/Previous disable themselves rather than doing nothing.
  spotify: {
    tracks: [] as { title: string; artist: string; uri: string }[],
  },

  // --- PWA (Workstream A) ---
  pwa: {
    themeColor: '#111b26',
    backgroundColor: '#101c28',
  },

  // --- Live reactions (Workstream B / Supabase Realtime Broadcast) ---
  reactions: {
    options: [
      { emoji: '☕', label: 'Cutting' },
      { emoji: '🌧️', label: 'Baarish' },
      { emoji: '❤️', label: 'Wah!' },
      { emoji: '🔥', label: 'Kya gaana hai' },
    ] satisfies ReactionOption[],
    rateLimitMs: 4_000,
    roomName: 'chai-ki-tapri-room',
  },

  // --- Song request board (Workstream B / Supabase table) ---
  requests: {
    cooldownMs: 60_000,
    maxNicknameLength: 40,
    maxDedicationLength: 200,
  },

  // --- Guestbook (Workstream B / Supabase table) ---
  guestbook: {
    maxNicknameLength: 30,
    maxMessageLength: 200,
    pageSize: 20,
  },

  // --- Shareable postcards (Workstream B, no backend) ---
  postcard: {
    brandLine: 'chaikitapri.wtf',
  },

  // --- Supabase-backed features, non-secret behavioural config only.
  // Real credentials come from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  // (see .env.example) and are read in src/lib/supabaseClient.ts, never here. ---
  supabase: {
    presenceRoom: 'chai-ki-tapri-presence',
  },
} as const
