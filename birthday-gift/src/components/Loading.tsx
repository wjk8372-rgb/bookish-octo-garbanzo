import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type LoadingProps = {
  name?: string
  onComplete: () => void
}

export default function Loading({ name = '', onComplete }: LoadingProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let p = 0
    const start = Date.now()
    const MIN_MS = 3200 // 至少展示 3.2 秒
    const timer = window.setInterval(() => {
      // 前半段慢，后半段稍快，营造"加载"的节奏感
      const step = p < 60 ? Math.random() * 3 + 2 : Math.random() * 6 + 4
      p += step
      if (p >= 100) {
        p = 100
        setProgress(100)
        window.clearInterval(timer)
        // 保证最短展示时间，避免一闪而过
        const elapsed = Date.now() - start
        const wait = Math.max(0, MIN_MS - elapsed)
        window.setTimeout(() => setDone(true), wait)
        return
      }
      setProgress(p)
    }, 220)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(onComplete, 700)
      return () => window.clearTimeout(t)
    }
  }, [done, onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night-900 px-6"
      animate={{ opacity: done ? 0 : 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      style={{ pointerEvents: done ? 'none' : 'auto' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="font-kai text-amber-soft/80 text-sm md:text-base tracking-widest">
          正在打开 2025.11.21 的私信…
        </p>

        {name && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-6 font-serif text-2xl md:text-3xl text-amber-warm text-glow"
          >
            致 {name}
          </motion.p>
        )}

        <div className="mt-10 w-64 max-w-[70vw] mx-auto">
          <div className="h-[2px] w-full bg-night-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-dim to-amber-warm"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <p className="mt-3 text-xs text-text-faint tracking-wider">
            {Math.floor(progress)}%
          </p>
        </div>

        <motion.div
          className="mt-8 flex justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-warm/70"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
