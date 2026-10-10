import { motion } from 'framer-motion'
import { getHerAvatar, getMeAvatar } from '../data/moments'
import { useConfig } from '../config/ConfigContext'

export default function Prologue() {
  const { siteText } = useConfig()
  const t = siteText.prologue
  const messages = t.messages

  return (
    <section id="prologue" className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          {t.title}
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          {t.subtitle}
        </p>

        {/* 聊天窗口 */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/10">
          {/* 顶栏 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2b2a35]">
            <div className="text-slate-400 text-lg">‹</div>
            <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
              <img
                src={getHerAvatar('2025-11-21')}
                alt="怡"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-100 font-medium truncate">{t.contactName}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                在线
              </div>
            </div>
            <div className="text-slate-400 text-lg">⋯</div>
          </div>

          {/* 聊天区 */}
          <div className="chat-window-bg p-4 md:p-5">
            {/* 日期分割线 */}
            <div className="flex items-center gap-3 my-2 mb-4">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                {messages[0]?.time ?? '15:37'}
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <div className="space-y-1.5">
              {(messages as { from: 'me' | 'her'; text: string; time: string; image?: string }[]).map((msg, i) => {
                const isMe = msg.from === 'me'
                const showTime =
                  i === 0 || messages[i - 1].time !== msg.time
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className={`grid gap-x-2 gap-y-0.5 ${
                      isMe
                        ? 'grid-cols-[1fr_auto] justify-items-end'
                        : 'grid-cols-[auto_1fr] justify-items-start'
                    }`}
                  >
                    {isMe ? (
                      <>
                        <div className={`max-w-[72%] justify-self-end self-end ${msg.image ? '' : 'px-3.5 py-2 bubble-me'}`}>
                          {msg.image ? <img src={msg.image} alt="" className="w-[120px] h-auto" /> : <span className="text-sm leading-relaxed">{msg.text}</span>}
                        </div>
                        <img
                          src={getMeAvatar('2025-11-21')}
                          alt="我"
                          className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm self-end"
                        />
                        {showTime && (
                          <span className="text-[10px] text-slate-500/80 justify-self-end pr-1">
                            {msg.time}
                          </span>
                        )}
                        <span />
                      </>
                    ) : (
                      <>
                        <img
                          src={getHerAvatar('2025-11-21')}
                          alt="怡"
                          className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm self-end"
                        />
                        <div className={`max-w-[72%] self-end ${msg.image ? '' : 'px-3.5 py-2 bubble-her'}`}>
                          {msg.image ? <img src={msg.image} alt="" className="w-[120px] h-auto" /> : <span className="text-sm leading-relaxed">{msg.text}</span>}
                        </div>
                        <span />
                        {showTime && (
                          <span className="text-[10px] text-slate-500/80 pl-1">
                            {msg.time}
                          </span>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 text-center font-kai text-text-dim text-base md:text-xl max-w-2xl mx-auto italic"
        >
          {t.quote}
        </motion.p>
      </motion.div>
    </section>
  )
}
