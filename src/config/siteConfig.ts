export type Track = {
  title: string
  artist: string
  audioUrl: string
  artworkUrl: string
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
  // Until configured, the UI uses a gently changing live preview count.
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
  ambient: {
    rain: null as string | null,
    tapri: null as string | null,
  },
} as const
