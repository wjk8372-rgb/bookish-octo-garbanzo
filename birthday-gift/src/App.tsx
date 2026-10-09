import { useCallback, useRef, useState } from 'react'
import Background from './components/Background'
import Loading from './components/Loading'
import MusicGate from './components/MusicGate'
import MusicPicker from './components/MusicPicker'
import Hero from './components/Hero'
import Prologue from './components/Prologue'
import MemoryWalk from './components/MemoryWalk'
import Timeline from './components/Timeline'
import ChatReplay from './components/ChatReplay'
import LetterViewer from './components/LetterViewer'
import Stats from './components/Stats'
import OptionalLetter from './components/OptionalLetter'
import Footer from './components/Footer'
import { useBgm } from './hooks/useBgm'

type Stage = 'loading' | 'gate' | 'main'

// 你的名字/昵称：留空则不显示，可替换为真实昵称
const HER_NAME = '若怡'

export default function App() {
  const [stage, setStage] = useState<Stage>('loading')
  const bgm = useBgm()
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
          <MusicPicker bgm={bgm} />

          <main>
            <Hero onScrollDown={scrollToContent} />

            <div ref={contentRef}>
              <Prologue />
              <MemoryWalk />
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
