import { useCallback, useRef, useState } from 'react'
import Background from './components/Background'
import Loading from './components/Loading'
import MusicGate from './components/MusicGate'
import MusicPicker from './components/MusicPicker'
import Hero from './components/Hero'
import Prologue from './components/Prologue'
import Timeline from './components/Timeline'
import VineAnimation from './components/VineAnimation'
import ChatReplay from './components/ChatReplay'
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

function AppContent() {
  const { visibleTracks } = useConfig()
  const [stage, setStage] = useState<Stage>('loading')
  const bgm = useBgm(visibleTracks)
  const contentRef = useRef<HTMLDivElement>(null)

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
          <VineAnimation />
          <MusicPicker bgm={bgm} />

          <main className="relative z-10">
            <Hero onScrollDown={scrollToContent} />

            <div ref={contentRef}>
              <Prologue />
              <Timeline />
              <ChatReplay />
              <LetterViewer />
              <Stats />
              <OptionalLetter onOpen={bgm.duck} />
              <Footer onRestart={handleRestart} onReplayMusic={handleReplayMusic} />
            </div>
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
