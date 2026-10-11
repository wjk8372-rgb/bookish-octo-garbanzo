import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CORRECT_PIN = '051013'
const PIN_LENGTH = 6

const LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']

type PinLockProps = {
  onUnlock: () => void
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const submit = useCallback(
    (current: string) => {
      if (current === CORRECT_PIN) {
        setTimeout(onUnlock, 250)
      } else {
        setError(true)
        setTimeout(() => {
          setPin('')
          setError(false)
        }, 700)
      }
    },
    [onUnlock],
  )

  const handleKey = useCallback(
    (key: string) => {
      if (error) return
      if (key === 'C') {
        setPin('')
      } else if (key === '⌫') {
        setPin((p) => p.slice(0, -1))
      } else if (/^\d$/.test(key)) {
        setPin((p) => {
          if (p.length >= PIN_LENGTH) return p
          const next = p + key
          if (next.length === PIN_LENGTH) {
            submit(next)
          }
          return next
        })
      }
    },
    [error, submit],
  )

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      else if (e.key === 'Backspace') handleKey('⌫')
      else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') handleKey('C')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass p-8 md:p-10">
          <h2 className="text-center font-serif text-2xl md:text-3xl text-amber-soft text-glow mb-6">
            请输入密码
          </h2>

          {/* PIN dots */}
          <div className="flex justify-center gap-3 mb-8">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <motion.span
                key={i}
                animate={
                  error
                    ? { x: [0, -4, 4, -2, 2, 0], transition: { duration: 0.4 } }
                    : {}
                }
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  error
                    ? 'bg-red-400/80'
                    : i < pin.length
                      ? 'bg-amber-warm shadow-[0_0_8px_rgba(247,201,112,0.7)]'
                      : 'bg-night-500 border border-amber-warm/30'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {LAYOUT.map((key) => {
              const isAction = key === 'C' || key === '⌫'
              return (
                <motion.button
                  key={key}
                  onClick={() => handleKey(key)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-14 rounded-2xl border transition-colors font-serif text-xl ${
                    isAction
                      ? 'border-amber-dim/40 text-amber-dim hover:bg-amber-warm/10 hover:border-amber-dim/70'
                      : 'border-amber-warm/25 text-amber-soft hover:bg-amber-warm/10 hover:border-amber-warm/50'
                  } bg-night-700/40`}
                >
                  {key}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 text-center text-sm text-red-300/90"
              >
                密码不正确，再想想看
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-xs text-text-faint">
          提示：是你的生日
        </p>
      </motion.div>
    </section>
  )
}
