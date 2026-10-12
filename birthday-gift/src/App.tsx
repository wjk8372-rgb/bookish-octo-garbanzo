import { useCallback, useRef, useState } from 'react'
import Background from './components/Background'
import Loading from './components/Loading'
import MusicGate from './components/MusicGate'
import MusicPicker from './components/MusicPicker'
import Hero from './components/Hero'
import PinLock from './components/PinLock'
import Prologue from './components/Prologue'
import Timeline from './components/Timeline'
// ChatReplay hidden — content duplicates Timeline
// import ChatReplay from './components/ChatReplay'
import LetterViewer from './components/LetterViewer'
import Stats from './components/Stats'
import OptionalLetter from './components/OptionalLetter'
import Footer from './components/Footer'
import Admin from './pages/Admin'
import { useBgm } from './hooks/useBgm'
import { ConfigProvider, useConfig } from './config/ConfigContext'

type Stage = 'loading' | 'gate' | 'main'

// 你的名字/昵称：留空则不显示，可替换为真实昵称
const HER_NAME = '若怡'

const PIN_UNLOCK_KEY = 'bg-pin-unlocked'

function AppContent() {
  const { visibleTracks } = useConfig()
  const [stage, setStage] = useState<Stage>('loading')
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PIN_UNLOCK_KEY) === '1'
    } catch {
      return false
    }
  })
  const bgm = useBgm(visibleTracks)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleUnlock = useCallback(() => {
    setUnlocked(true)
    try {
      localStorage.setItem(PIN_UNLOCK_KEY, '1')
    } catch {
      /* noop */
    }
  }, [])

  const handleLoadingComplete = useCallback(() => {
    setStage('gate')
  }, [])

  const handleEnter = useCallback(
    (trackId: string) => {
      bgm.selectTrack(trackId)
      setStage('main')
    },
    [bgm],
  )

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleRestart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleReplayMusic = useCallback(() => {
    if (bgm.currentTrack) {
      bgm.selectTrack(bgm.currentTrack.id)
    } else {
      bgm.play()
    }
  }, [bgm])

  return (
    <>
      <Background />

      {stage === 'loading' && (
        <Loading name={HER_NAME} onComplete={handleLoadingComplete} />
      )}

      {stage === 'gate' && <MusicGate onEnter={handleEnter} />}

      {stage === 'main' && (
        <>
          <MusicPicker bgm={bgm} />

          <main className="relative z-10">
            <Hero onScrollDown={scrollToContent} />

            {!unlocked ? (
              <div ref={contentRef}>
                <PinLock onUnlock={handleUnlock} />
              </div>
            ) : (
              <div ref={contentRef}>
                <Prologue />
                <Timeline />
                {/* <ChatReplay /> — hidden, content duplicates Timeline */}
                <LetterViewer />
                <Stats />
                <OptionalLetter onOpen={bgm.duck} />
                <Footer onRestart={handleRestart} onReplayMusic={handleReplayMusic} />
              </div>
            )}
          </main>
        </>
      )}
    </>
  )
}

export default function App() {
  // Hash-based routing: #admin shows admin page
  if (typeof window !== 'undefined' && window.location.hash === '#admin') {
    return (
      <ConfigProvider>
        <Admin />
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  )
}
