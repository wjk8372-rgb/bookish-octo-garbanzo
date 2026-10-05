import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Moment } from '../data/moments'
import { formatDate } from '../utils/date'

type MomentCardProps = {
  moment: Moment
  index: number
}

export default function MomentCard({ moment, index }: MomentCardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.05, 0.3) }}
      className="w-full"
    >
      <div
        className={`flip-card h-[320px] md:h-[360px] cursor-pointer glow-hover ${
          flipped ? 'is-flipped' : ''
        }`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flip-inner">
          {/* 正面 */}
          <div className="flip-face glass p-5 md:p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-amber-warm/80 font-serif tracking-wider">
                {formatDate(moment.date)}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-warm/30 text-amber-soft/70">
                {moment.type === 'chat' ? '聊天' : '信件'}
              </span>
            </div>

            <h3 className="font-serif text-xl md:text-2xl text-amber-soft mb-2">
              {moment.title}
            </h3>
            <p className="text-text-faint text-sm mb-4">{moment.summary}</p>

            <div className="flex-1 overflow-hidden fade-mask-b">
              {moment.type === 'chat' && moment.chat ? (
                <div className="space-y-1.5">
                  {moment.chat.slice(0, 4).map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-row flex ${
                        msg.from === 'me' ? 'justify-end' : 'justify-start'
                      } items-end gap-1.5`}
                    >
                      {msg.from === 'her' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[10px] text-amber-950 shrink-0">
                          怡
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] px-2.5 py-1.5 text-[13px] leading-relaxed ${
                          msg.from === 'me' ? 'bubble-me' : 'bubble-her'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.from === 'me' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-[10px] text-slate-100 shrink-0">
                          我
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : moment.letter ? (
                <div className="letter-paper p-4 text-[13px] leading-7 whitespace-pre-line line-clamp-6">
                  {moment.letter.content}
                </div>
              ) : null}
            </div>

            <p className="mt-3 text-[11px] text-text-faint text-center">
              点击翻转 · 她可能不知道的是…
            </p>
          </div>

          {/* 背面 */}
          <div className="flip-face flip-back glass p-5 md:p-6 flex flex-col justify-center border-amber-warm/30">
            <p className="text-xs text-amber-warm/70 tracking-widest mb-4">
              她可能不知道的是…
            </p>
            <p className="font-kai text-text text-base md:text-lg leading-relaxed mb-5">
              {moment.note}
            </p>
            <div className="flex flex-wrap gap-2">
              {moment.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-amber-warm/10 text-amber-soft/70 border border-amber-warm/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <p className="mt-auto pt-4 text-[11px] text-text-faint text-center">
              点击翻回正面
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
