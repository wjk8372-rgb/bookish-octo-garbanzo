import { motion } from 'framer-motion'
import { useConfig } from '../config/ConfigContext'

type FooterProps = {
  onRestart: () => void
  onReplayMusic: () => void
}

export default function Footer({ onRestart, onReplayMusic }: FooterProps) {
  const { siteText } = useConfig()
  const t = siteText.footer

  return (
    <footer id="footer" className="relative py-24 md:py-32 px-6 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="font-serif text-3xl md:text-5xl text-amber-soft text-glow mb-6">
          {t.title}
        </h2>

        <p className="font-kai text-text-dim text-base md:text-lg leading-relaxed mb-3">
          {t.line1}
        </p>
        <p className="font-kai text-text-faint text-sm md:text-base">
          {t.line2}
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-7 py-3 rounded-full border border-amber-warm/40 text-amber-soft hover:bg-amber-warm/10 transition-colors font-kai"
          >
            {t.restartButton}
          </button>
          <button
            onClick={onReplayMusic}
            className="px-7 py-3 rounded-full bg-amber-warm/15 border border-amber-warm/30 text-amber-soft hover:bg-amber-warm/25 transition-colors font-kai"
          >
            {t.replayButton}
          </button>
        </div>

        <p className="mt-16 text-[11px] text-text-faint/60 tracking-wider">
          {t.copyright}
        </p>
      </motion.div>
    </footer>
  )
}
