# Chai Ki Tapri

An immersive, single-screen chai-stall music experience built with React, TypeScript, Vite and plain CSS.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`, or preview that build with `npm run preview`.

## Edit the experience

All frequently changed content lives in [`src/config/siteConfig.ts`](src/config/siteConfig.ts):

- **Website name:** edit `name`, `hindiTitle`, and `tagline`.
- **Backgrounds:** replace the three WebP files in `public/assets/` and/or edit the `backgrounds` object. Rain and Tapri each use a completely separate full-screen scene.
- **Songs:** edit the `playlist` array. Each track has a title, artist, audio URL, and artwork URL. The starter audio URLs are SoundHelix demo tracks (free-use terms are published by SoundHelix); for production, self-host licensed, optimized audio.
- **Spotify link:** edit `spotifyUrl`.
- **YouTube playlist:** edit `youtubeMusicUrl`, `youtubePlaylist.firstVideoId`, and `youtubePlaylist.playlistId`. The on-page player uses YouTube's privacy-enhanced official embed.
- **Scene controls:** Rain and Tapri switch between cool monsoon and warm stall treatments. Licensed ambience audio can later be added through `ambient.rain` and `ambient.tapri`.
- **Realtime listeners:** set `liveListenersUrl` to an endpoint returning `{ "listeners": 127 }`. Without an endpoint, the interface displays a gently changing live preview count.

No environment variables are needed. YouTube playback begins only after a user gesture, in line with browser autoplay rules.

## Artwork

The hero image was generated specifically for this project with OpenAI image generation, then optimized for the web. It does not reuse artwork from the inspiration sites.
