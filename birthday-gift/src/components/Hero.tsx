import { motion } from 'framer-motion'
import { daysSinceStart, daysToAnniversary, formatDate } from '../utils/date'

type HeroProps = {
  onScrollDown: () => void
}

export default function Hero({ onScrollDown }: HeroProps) {
  const days = daysSinceStart()
  const toAnniv = daysToAnniversary()

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="text-amber-soft/60 text-sm md:text-base tracking-[0.3em] mb-6"
      >
        {formatDate('2025-11-21')} — {formatDate('2026-10-13')}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="font-serif text-5xl md:text-8xl text-amber-soft text-glow leading-tight"
      >
        10.13
        <span className="block text-2xl md:text-4xl mt-4 text-amber-warm/80">
          生日快乐
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="mt-10 font-kai text-base md:text-xl text-text-dim max-w-xl"
      >
        从 2025.11.21 你私信我那天，到现在。
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="mt-3 font-serif text-lg md:text-2xl text-amber-soft"
      >
        第 {days} 天，距离我们认识一年，还差 {toAnniv} 天。
      </motion.p>

      <motion.button
        onClick={onScrollDown}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="mt-14 px-8 py-3 rounded-full border border-amber-warm/40 text-amber-soft hover:bg-amber-warm/10 hover:border-amber-warm transition-colors font-kai tracking-wider"
      >
        打开我们的第一年
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-faint text-xs"
      >
        <span>向下滚动</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ↓
        </motion.div>
      </motion.div>
    </section>
  )
}
