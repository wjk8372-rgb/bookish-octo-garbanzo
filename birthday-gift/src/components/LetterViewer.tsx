import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { moments } from '../data/moments'

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

function LetterCard({
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
  const [start, setStart] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { shown, done, skip } = useTypewriter(content, 50, start)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStart(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.1, 0.3) }}
      className="letter-paper p-6 md:p-10 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl md:text-2xl text-ink">
          《{title}》
        </h3>
        <span className="text-xs text-ink/50">
          {date} · {from === 'me' ? '我写的' : '她写的'}
        </span>
      </div>

      <p
        className={`font-kai text-base md:text-lg leading-8 whitespace-pre-line text-ink/90 ${
          done ? '' : 'caret'
        }`}
      >
        {shown}
      </p>

      {!done && (
        <button
          onClick={skip}
          className="absolute bottom-4 right-4 text-xs text-ink/50 hover:text-ink transition-colors"
        >
          跳过 →
        </button>
      )}
    </motion.div>
  )
}

export default function LetterViewer() {
  const letterMoments = moments.filter((m) => m.type === 'letter' && m.letter)

  return (
    <section className="relative py-24 md:py-36 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          信件展厅
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          写过的，和没寄出的
        </p>

        <div className="space-y-10">
          {letterMoments.map((m, i) => (
            <LetterCard
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
