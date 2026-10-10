import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConfig } from '../config/ConfigContext'

type OptionalLetterProps = {
  onOpen?: () => void
}

export default function OptionalLetter({ onOpen }: OptionalLetterProps) {
  const { siteText } = useConfig()
  const t = siteText.optionalLetter
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
    onOpen?.()
  }

  return (
    <section id="optional-letter" className="relative py-24 md:py-36 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.div
              key="btn"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-text-faint text-sm mb-6">
                {t.intro}
              </p>
              <button
                onClick={handleOpen}
                className="px-8 py-4 rounded-full border border-amber-warm/40 text-amber-soft hover:bg-amber-warm/10 hover:border-amber-warm transition-all font-kai text-base md:text-lg leading-relaxed max-w-md mx-auto"
              >
                {t.buttonText}
                <br />
                <span className="text-sm text-text-faint">{t.buttonSubtext}</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="letter"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="letter-paper p-8 md:p-12 text-left"
            >
              <p className="whitespace-pre-line font-kai text-base md:text-lg leading-9 text-ink/90">
                {t.letterContent}
              </p>
              <p className="mt-8 text-right text-ink/50 text-sm">
                {t.signature}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
