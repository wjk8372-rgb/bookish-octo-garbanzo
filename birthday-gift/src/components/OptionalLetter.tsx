import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const letterContent = `10.13 生日快乐。

从 2025.11.21 你私信我那天算起，到今天是第 327 天。
距离我们认识一年，还差 39 天。

我本来想等 11.21 再写这些，但生日更重要。

认识你之后，一年变成了很多具体的瞬间：
一条私信、一次长聊、一句晚安、一封没寄出的信。

我有时候会想，如果我们不只是朋友，会怎样。
但我更怕让你为难。

所以今天，你只需要开心。
生日快乐。

11.21 那天，如果我们还记得，就再庆祝一次。
不用回复，不用有压力。`

type OptionalLetterProps = {
  onOpen?: () => void
}

export default function OptionalLetter({ onOpen }: OptionalLetterProps) {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
    onOpen?.()
  }

  return (
    <section className="relative py-24 md:py-36 px-6">
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
                最后，有一封信
              </p>
              <button
                onClick={handleOpen}
                className="px-8 py-4 rounded-full border border-amber-warm/40 text-amber-soft hover:bg-amber-warm/10 hover:border-amber-warm transition-all font-kai text-base md:text-lg leading-relaxed max-w-md mx-auto"
              >
                如果你愿意，可以点开。
                <br />
                <span className="text-sm text-text-faint">不点也没关系。</span>
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
                {letterContent}
              </p>
              <p className="mt-8 text-right text-ink/50 text-sm">
                —— 写于 2026.10.13
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
