type IconProps = { className?: string }

export function SpotifyLogo({ className }: IconProps) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#1ed760"/>
    <path d="M17.8 17.2a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.6-1.16a.75.75 0 1 1-.34-1.46c4.6-1.05 8.54-.6 11.72 1.34.35.22.46.68.25 1.03Zm1.47-3.28a.94.94 0 0 1-1.3.31c-3.24-1.99-8.18-2.56-12.02-1.4a.94.94 0 1 1-.54-1.8c4.39-1.33 9.84-.69 13.55 1.58.44.27.58.85.31 1.3Zm.13-3.42C15.51 8.2 9.1 7.98 5.38 9.1a1.13 1.13 0 1 1-.65-2.16c4.27-1.29 11.36-1.03 15.82 1.62a1.13 1.13 0 0 1-1.15 1.94Z" fill="#08110b"/>
  </svg>
}

export function YouTubeMusicLogo({ className }: IconProps) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#ff0033"/>
    <circle cx="12" cy="12" r="7.2" fill="none" stroke="#fff" strokeWidth="1.2"/>
    <path d="m10.2 8.7 5.1 3.3-5.1 3.3V8.7Z" fill="#fff"/>
  </svg>
}
