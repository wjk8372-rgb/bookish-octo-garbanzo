import { useState } from 'react'
import { motion } from 'framer-motion'
import { tracks } from '../data/tracks'

type MusicGateProps = {
  onEnter: (trackId: string) => void
}

const icons = ['♪', '♫', '♩', '♬']

export default function MusicGate({ onEnter }: MusicGateProps) {
  const [selected, setSelected] = useState<string>(tracks[0]?.id ?? '')

  const handleEnter = () => {
    if (selected) onEnter(selected)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-center mb-10"
      >
        <h1 className="font-serif text-3xl md:text-5xl text-amber-soft text-glow">
          先选一首背景音乐
        </h1>
        <p className="mt-4 text-text-dim text-sm md:text-base">
          进入后也可以随时切换
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mb-12 max-h-[55vh] overflow-y-auto pr-1">
        {tracks.map((track, i) => {
          const active = selected === track.id
          return (
            <motion.button
              key={track.id}
              onClick={() => setSelected(track.id)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-2xl p-5 md:p-6 text-left transition-all duration-300 border ${
                active
                  ? 'border-amber-warm bg-amber-warm/10 shadow-[0_0_30px_rgba(247,201,112,0.25)]'
                  : 'border-night-500 bg-night-700/50 hover:border-amber-dim/50'
              }`}
            >
              <div
                className={`text-3xl md:text-4xl mb-3 transition-colors ${
                  active ? 'text-amber-warm' : 'text-text-faint'
                }`}
              >
                {icons[i % icons.length]}
              </div>
              <div
                className={`font-serif text-lg md:text-xl ${
                  active ? 'text-amber-soft' : 'text-text'
                }`}
              >
                {track.name}
              </div>
              <div className="text-xs text-text-faint mt-1">{track.mood}</div>

              {active && (
                <motion.div
                  layoutId="track-active"
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-warm shadow-[0_0_8px_rgba(247,201,112,0.9)]"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      <motion.button
        onClick={handleEnter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="px-8 md:px-10 py-3.5 rounded-full bg-gradient-to-r from-amber-dim to-amber-warm text-night-900 font-serif text-base md:text-lg tracking-wider shadow-[0_0_24px_rgba(247,201,112,0.4)] transition-shadow hover:shadow-[0_0_36px_rgba(247,201,112,0.6)]"
      >
        打开我们的第一年
      </motion.button>

      <p className="mt-6 text-xs text-text-faint">
        建议佩戴耳机，效果更好
      </p>
    </motion.div>
  )
}
