import { motion } from 'framer-motion'

type FooterProps = {
  onRestart: () => void
  onReplayMusic: () => void
}

export default function Footer({ onRestart, onReplayMusic }: FooterProps) {
  return (
    <footer className="relative py-24 md:py-32 px-6 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="font-serif text-3xl md:text-5xl text-amber-soft text-glow mb-6">
          10.13 快乐。
        </h2>

        <p className="font-kai text-text-dim text-base md:text-lg leading-relaxed mb-3">
          认识你，是我这一年很幸运的事。
        </p>
        <p className="font-kai text-text-faint text-sm md:text-base">
          11.21 那天，如果我们还记得，就再庆祝一次。
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-7 py-3 rounded-full border border-amber-warm/40 text-amber-soft hover:bg-amber-warm/10 transition-colors font-kai"
          >
            回到开头
          </button>
          <button
            onClick={onReplayMusic}
            className="px-7 py-3 rounded-full bg-amber-warm/15 border border-amber-warm/30 text-amber-soft hover:bg-amber-warm/25 transition-colors font-kai"
          >
            再听一遍
          </button>
        </div>

        <p className="mt-16 text-[11px] text-text-faint/60 tracking-wider">
          从一条抖音私信开始 · 写给 10.13 的你
        </p>
      </motion.div>
    </footer>
  )
}
