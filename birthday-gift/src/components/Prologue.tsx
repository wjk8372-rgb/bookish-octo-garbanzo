import { motion } from 'framer-motion'

type Msg = { from: 'me' | 'her'; text: string; time?: string; image?: string }

// 序章：第一次交流的 4 条聊天记录
const messages: Msg[] = [
  { from: 'her', text: '思想很深刻', time: '15:37' },
  { from: 'her', text: '我对你表示欣赏', time: '15:37' },
  { from: 'me', text: '谢谢 你能理解到深刻，或许你也是一个求真的人', time: '15:54' },
  { from: 'me', text: '这也是一种交流了~', time: '15:54' },
]

export default function Prologue() {
  return (
    <section id="prologue" className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          序章
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          我们的第一次交流 · 2025.11.21
        </p>

        {/* 聊天窗口 */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/10">
          {/* 顶栏 */}
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
          <div className="chat-window-bg p-4 md:p-5">
            {/* 日期分割线 */}
            <div className="flex items-center gap-3 my-2 mb-4">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">
                2025/11/21 15:37
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            <div className="space-y-1.5">
              {messages.map((msg, i) => {
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
                          {msg.image ? <img src={msg.image} alt="" className="w-[120px] h-auto rounded-lg" /> : <span className="text-sm leading-relaxed">{msg.text}</span>}
                        </div>
                        <img
                          src="./images/me-avatar.jpg"
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
                          src="./images/her-avatar.jpg"
                          alt="怡"
                          className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm self-end"
                        />
                        <div className={`max-w-[72%] self-end ${msg.image ? '' : 'px-3.5 py-2 bubble-her'}`}>
                          {msg.image ? <img src={msg.image} alt="" className="w-[120px] h-auto rounded-lg" /> : <span className="text-sm leading-relaxed">{msg.text}</span>}
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
          这是我们的第一次交流，也是我们关系的开始，当时有一种宿命感，这似乎预示着什么。
        </motion.p>
      </motion.div>
    </section>
  )
}
