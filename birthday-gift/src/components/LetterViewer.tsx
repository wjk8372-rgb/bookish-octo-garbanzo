import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moments } from '../data/moments'
import { formatDate } from '../utils/date'

function useTypewriter(text: string, speed = 45, start = false) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!start) return
    setShown('')
    setDone(false)
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(timer)
        setDone(true)
      }
    }, speed)
    return () => window.clearInterval(timer)
  }, [text, speed, start])

  const skip = () => {
    setShown(text)
    setDone(true)
  }

  return { shown, done, skip }
}

function EnvelopeCard({
  title,
  content,
  from,
  date,
  index,
}: {
  title: string
  content: string
  from: 'me' | 'her'
  date: string
  index: number
}) {
  const [open, setOpen] = useState(false)
  const { shown, done, skip } = useTypewriter(content, 40, open)

  const isFromHer = from === 'her'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.1, 0.3) }}
      className="relative"
    >
      {/* 信封容器 */}
      <div className="relative mx-auto w-full max-w-xl" style={{ perspective: '1200px' }}>
        <div
          className={`envelope relative rounded-lg overflow-hidden cursor-pointer transition-shadow ${
            open ? 'shadow-2xl' : 'shadow-xl hover:shadow-2xl'
          }`}
          onClick={() => !open && setOpen(true)}
        >
          {/* 信封主体 */}
          <div className={`envelope-body bg-[#f5efe0] px-6 pt-16 pb-8 md:px-10 md:pt-20 md:pb-10`}>
            {/* 封面信息 */}
            <AnimatePresence>
              {!open && (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center select-none"
                >
                  {/* 邮票 */}
                  <div className="absolute top-4 right-4 w-14 h-16 border-2 border-dashed border-amber-800/30 rounded-sm bg-amber-50/60 flex flex-col items-center justify-center">
                    <div className="text-lg">✉</div>
                    <div className="text-[8px] text-amber-900/50 mt-0.5">POST</div>
                  </div>

                  {/* 蜡封 */}
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-serif mb-6 shadow-lg ${
                      isFromHer
                        ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                        : 'bg-gradient-to-br from-amber-500 to-amber-700'
                    }`}
                  >
                    {isFromHer ? '怡' : '我'}
                  </div>

                  <p className="text-[11px] text-amber-900/40 tracking-[0.3em] mb-2">
                    {isFromHer ? 'FROM HER' : 'FROM ME'}
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-amber-950 mb-2">
                    《{title}》
                  </h3>
                  <p className="text-sm text-amber-900/60 mb-1">
                    {formatDate(date)}
                  </p>
                  <p className="text-xs text-amber-900/40 mt-6 flex items-center justify-center gap-1.5">
                    <span className="inline-block w-8 h-px bg-amber-900/20" />
                    点击拆开
                    <span className="inline-block w-8 h-px bg-amber-900/20" />
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 信纸内容 */}
            <AnimatePresence>
              {open && (
                <motion.div
                  key="letter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-amber-900/15">
                    <h3 className="font-serif text-lg md:text-xl text-amber-950">
                      《{title}》
                    </h3>
                    <span className="text-[11px] text-amber-900/50">
                      {formatDate(date)} · {isFromHer ? '她' : '我'}
                    </span>
                  </div>

                  <p
                    className={`font-kai text-sm md:text-[15px] leading-8 whitespace-pre-line text-amber-950/90 max-h-[60vh] overflow-y-auto pr-1 ${
                      done ? '' : 'caret'
                    }`}
                  >
                    {shown}
                  </p>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-amber-900/10">
                    {!done && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          skip()
                        }}
                        className="text-xs text-amber-900/50 hover:text-amber-900 transition-colors"
                      >
                        跳过 →
                      </button>
                    )}
                    {done && <span />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpen(false)
                      }}
                      className="text-xs text-amber-900/50 hover:text-amber-900 transition-colors"
                    >
                      放回信封 ↑
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 信封封口（顶部三角） */}
          <div
            className="absolute top-0 left-0 right-0 h-20 origin-top transition-transform duration-500 z-10 pointer-events-none"
            style={{
              transform: open ? 'rotateX(180deg)' : 'rotateX(0deg)',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(180deg, #ede3cc 0%, #e8dfc8 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              borderBottom: '1px solid rgba(120, 100, 60, 0.15)',
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function LetterViewer() {
  const letterMoments = moments.filter((m) => m.type === 'letter' && m.letter)

  return (
    <section id="letter" className="relative py-24 md:py-36 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          信件展厅
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          写过的，和没寄出的 · 点击信封拆开
        </p>

        <div className="space-y-12">
          {letterMoments.map((m, i) => (
            <EnvelopeCard
              key={m.id}
              index={i}
              title={m.letter!.title}
              content={m.letter!.content}
              from={m.letter!.from}
              date={m.date}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
