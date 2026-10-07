import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { moments, type ChatMessage } from '../data/moments'
import { formatDate } from '../utils/date'

type ChatItem = {
  momentId: number
  date: string
  title: string
  msg: ChatMessage
  narration?: string
}

export default function ChatReplay() {
  const chatMoments = useMemo(
    () => moments.filter((m) => m.type === 'chat' && m.chat),
    [],
  )

  const items: ChatItem[] = useMemo(() => {
    const list: ChatItem[] = []
    chatMoments.forEach((m) => {
      m.chat?.forEach((msg, i) => {
        list.push({
          momentId: m.id,
          date: m.date,
          title: m.title,
          msg,
          // 每条记录的旁白（仅给每组最后一条加，避免太密）
          narration: i === (m.chat?.length ?? 0) - 1 ? m.note : undefined,
        })
      })
    })
    return list
  }, [chatMoments])

  const [visibleCount, setVisibleCount] = useState(0)
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      setVisibleCount(count)
      if (count >= items.length) window.clearInterval(timer)
    }, 700)
    return () => window.clearInterval(timer)
  }, [items.length, replayKey])

  const visible = items.slice(0, visibleCount)

  return (
    <section id="chat" className="relative py-24 md:py-36 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          聊天记录展厅
        </h2>
        <p className="text-center text-text-faint text-sm mb-3">
          模拟气泡，逐条出现
        </p>

        <div className="text-center mb-10">
          <button
            onClick={() => setReplayKey((k) => k + 1)}
            className="text-xs text-amber-soft/70 hover:text-amber-soft border border-amber-warm/30 rounded-full px-4 py-1.5 transition-colors"
          >
            ↻ 重新播放
          </button>
        </div>

        {/* 聊天窗口容器 */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/10">
          {/* 顶栏：模拟聊天 App */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2b2a35]">
            <div className="text-slate-400 text-lg">‹</div>
            <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
              <img
                src="./images/her-avatar.jpg"
                alt="怡"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-100 font-medium truncate">陈若怡</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                在线
              </div>
            </div>
            <div className="text-slate-400 text-lg">⋯</div>
          </div>

          {/* 聊天区 */}
          <div className="chat-window-bg p-4 md:p-5 min-h-[400px] max-h-[70vh] overflow-y-auto">
            <AnimatePresence initial={false}>
              {visible.map((item, i) => {
                const showDivider =
                  i === 0 || visible[i - 1]?.momentId !== item.momentId
                return (
                  <motion.div
                    key={`${replayKey}-${i}`}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-2"
                  >
                    {showDivider && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-black/10" />
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDate(item.date)} · {item.title}
                        </span>
                        <div className="flex-1 h-px bg-black/10" />
                      </div>
                    )}

                  {(() => {
                    const isMe = item.msg.from === 'me'
                    return (
                      <div
                        className={`grid gap-x-2 gap-y-0.5 mb-1.5 ${
                          isMe
                            ? 'grid-cols-[1fr_auto] justify-items-end'
                            : 'grid-cols-[auto_1fr] justify-items-start'
                        }`}
                      >
                        {isMe ? (
                          <>
                            <div className={`max-w-[72%] justify-self-end self-end ${item.msg.image ? '' : 'px-3.5 py-2 bubble-me'}`}>
                              {item.msg.image ? <img src={item.msg.image} alt="" className="w-[120px] h-auto rounded-lg" /> : <span className="text-sm leading-relaxed">{item.msg.text}</span>}
                            </div>
                            <img
                              src="./images/me-avatar.jpg"
                              alt="我"
                              className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm self-end"
                            />
                            {item.msg.time && (
                              <span className="text-[10px] text-slate-500/80 justify-self-end pr-1">
                                {item.msg.time}
                              </span>
                            )}
                            <span />
                          </>
                        ) : (
                          <>
                            <img
                              src="./images/her-avatar.jpg"
                              alt="怡"
                              className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm self-end"
                            />
                            <div className={`max-w-[72%] self-end ${item.msg.image ? '' : 'px-3.5 py-2 bubble-her'}`}>
                              {item.msg.image ? <img src={item.msg.image} alt="" className="w-[120px] h-auto rounded-lg" /> : <span className="text-sm leading-relaxed">{item.msg.text}</span>}
                            </div>
                            <span />
                            {item.msg.time && (
                              <span className="text-[10px] text-slate-500/80 pl-1">
                                {item.msg.time}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })()}

                  {item.narration && (
                    <p className="mt-2 mb-4 text-center text-[12px] text-slate-600 italic font-kai">
                      「{item.narration}」
                    </p>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {visibleCount < items.length && (
            <div className="flex justify-start items-end gap-2 mt-2">
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden shadow-sm">
                <img
                  src="./images/her-avatar.jpg"
                  alt="怡"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bubble-her px-3.5 py-2.5 flex gap-1">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-slate-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  )
}
