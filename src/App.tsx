import { useEffect, useState } from 'react'
import { AmbientControls } from './components/AmbientControls'
import type { SceneMode } from './components/AmbientControls'
import { Header } from './components/Header'
import { HeroBrand } from './components/HeroBrand'
import { MusicPlayer } from './components/MusicPlayer'
import { siteConfig } from './config/siteConfig'

export default function App() {
  const [scene, setScene] = useState<SceneMode>('default')

  useEffect(() => {
    Object.values(siteConfig.backgrounds).forEach(src => {
      const image = new Image()
      image.src = src
    })
  }, [])

  return <div className={`experience scene-${scene}`} style={{ '--hero': `url(${siteConfig.backgrounds[scene]})` } as React.CSSProperties}>
    <div className="steam" aria-hidden="true"><i/><i/><i/></div>
    <Header />
    <HeroBrand />
    <div className="bottom-area">
      <AmbientControls mode={scene} onChange={setScene} />
      <MusicPlayer />
      <p className="hint">PLAYING FROM YOUTUBE&nbsp;&nbsp;·&nbsp;&nbsp;FULL PLAYLIST</p>
    </div>
  </div>
}
