import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BgmState } from '../hooks/useBgm'

type MusicPickerProps = {
  bgm: BgmState
}

export default function MusicPicker({ bgm }: MusicPickerProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const fmt = (v: number) => Math.round(v * 100)

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 right-4 md:top-6 md:right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full glass text-amber-soft text-sm hover:border-amber-warm/50 transition-colors"
        aria-label="点歌台"
      >
        <span
          className={`inline-flex gap-[2px] items-end h-3.5 ${
            bgm.isPlaying ? '' : 'opacity-40'
          }`}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] bg-amber-warm rounded-full"
              animate={
                bgm.isPlaying
                  ? { height: ['30%', '100%', '40%', '80%', '30%'] }
                  : { height: '30%' }
              }
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.12,
              }}
            />
          ))}
        </span>
        <span className="hidden sm:inline">点歌台</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-4 md:top-20 md:right-6 z-40 w-72 glass p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-amber-soft">点歌台</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-text-faint hover:text-amber-soft text-sm"
              >
                ✕
              </button>
            </div>

            {/* 当前曲目 */}
            <div className="mb-3 p-2.5 rounded-lg bg-night-700/50 border border-amber-warm/10">
              <p className="text-[11px] text-text-faint">正在播放</p>
              <p className="text-amber-soft text-sm font-serif">
                {bgm.currentTrack
                  ? `${bgm.currentTrack.name} · ${bgm.currentTrack.mood}`
                  : '未选择'}
              </p>
            </div>

            {/* 曲目列表 */}
            <div className="space-y-1 mb-4">
              {bgm.tracks.map((t) => {
                const active = bgm.currentTrack?.id === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => bgm.selectTrack(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-amber-warm/15 text-amber-soft'
                        : 'text-text-dim hover:bg-night-600/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-warm" />
                      )}
                      {t.name}
                      <span className="text-[11px] text-text-faint">
                        {t.mood}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 播放控制 */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={bgm.toggle}
                className="w-9 h-9 rounded-full bg-amber-warm/15 border border-amber-warm/30 text-amber-warm flex items-center justify-center hover:bg-amber-warm/25 transition-colors"
                aria-label={bgm.isPlaying ? '暂停' : '播放'}
              >
                {bgm.isPlaying ? '❚❚' : '▶'}
              </button>
              <button
                onClick={bgm.toggleMute}
                className="w-9 h-9 rounded-full bg-night-600/60 text-text-dim flex items-center justify-center hover:text-amber-soft transition-colors"
                aria-label={bgm.isMuted ? '取消静音' : '静音'}
              >
                {bgm.isMuted ? '🔇' : '🔊'}
              </button>
              <span className="text-xs text-text-faint ml-auto">
                {fmt(bgm.volume)}%
              </span>
            </div>

            {/* 音量条 */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={bgm.isMuted ? 0 : bgm.volume}
              onChange={(e) => bgm.setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
