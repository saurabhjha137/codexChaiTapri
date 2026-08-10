import { useState } from 'react'
import { X } from 'lucide-react'
import { AmbientMixer } from './components/AmbientMixer'
import { Header } from './components/Header'
import { HeroBrand } from './components/HeroBrand'
import { InstallPrompt } from './components/InstallPrompt'
import { MusicPlayer } from './components/MusicPlayer'
import { OfflineFallback } from './components/OfflineFallback'
import { FloatingReactions } from './components/FloatingReactions'
import { Guestbook } from './components/Guestbook'
import { PostcardCreator } from './components/PostcardCreator'
import { ReactionBar } from './components/ReactionBar'
import { SongRequestBoard } from './components/SongRequestBoard'
import { SceneSelector } from './components/SceneSelector'
import { UpdateToast } from './components/UpdateToast'
import { siteConfig } from './config/siteConfig'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { useDialogFocus } from './hooks/useDialogFocus'
import { useImagePreload } from './hooks/useImagePreload'
import { useRealtimeRoom } from './hooks/useRealtimeRoom'
import { useTimeAwareScene } from './hooks/useTimeAwareScene'
import { withCssVars } from './utils/cssVars'

const backgroundUrls = Object.values(siteConfig.backgrounds)

export default function App() {
  const { scene, auto, selectScene, selectAuto } = useTimeAwareScene()
  useImagePreload(backgroundUrls)
  const realtimeRoom = useRealtimeRoom(siteConfig.reactions.roomName)
  const ambient = useAmbientAudio(scene)
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useDialogFocus(menuOpen, () => {
    // Song request / guestbook / postcard dialogs nest inside this drawer
    // and register their own Escape handler when open. Both listeners fire
    // on the same keypress (attached in mount order, drawer first) — so
    // without this check, Escape would close the drawer out from under
    // whichever inner dialog is still handling its own close. Let the
    // innermost dialog close first; a second Escape then closes the drawer.
    if (document.querySelector('.dialog-backdrop')) return
    setMenuOpen(false)
  })

  const heroStyle = withCssVars({ '--hero': `url(${siteConfig.backgrounds[scene]})` })

  return (
    <div className={`experience scene-${scene}`} style={heroStyle}>
      <div className="steam" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <Header />
      <FloatingReactions onReaction={realtimeRoom.onReaction} />

      {/* One focal stage: the title and the song are the whole point.
          Player docks left, title + reactions stay centred. */}
      <div className="stage">
        <div className="player-dock">
          <MusicPlayer />
          <SceneSelector scene={scene} auto={auto} onSelectScene={selectScene} onSelectAuto={selectAuto} />
        </div>
        <div className="stage-center">
          <HeroBrand />
          <ReactionBar sendReaction={realtimeRoom.sendReaction} />
        </div>
      </div>

      {/* TODO: re-enable — commented out for now, revisiting the "More"
          drawer tomorrow. The drawer JSX below is left in place (just
          unreachable without this trigger) so it's ready to pick back up. */}
      {/* <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="more-drawer"
        onClick={() => setMenuOpen(true)}
      >
        <Menu size={15} />
        <span>More</span>
      </button> */}

      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <div
            id="more-drawer"
            ref={drawerRef}
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="More from Chai Ki Tapri"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="dialog-close drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>

            <div className="drawer-group">
              <span className="drawer-group-label">Ambience</span>
              <AmbientMixer layers={ambient.layers} onVolumeChange={ambient.setLayerVolume} onToggleMute={ambient.toggleLayerMute} />
            </div>

            <div className="drawer-group drawer-group-links">
              <span className="drawer-group-label">More from the tapri</span>
              <SongRequestBoard />
              <Guestbook />
              <PostcardCreator scene={scene} />
            </div>
          </div>
        </div>
      )}

      <InstallPrompt />
      <UpdateToast />
      <OfflineFallback />
    </div>
  )
}
