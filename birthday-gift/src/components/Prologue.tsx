import { motion } from 'framer-motion'

// 序章：第一次交流的 4 条聊天记录
const messages = [
  { from: 'her', text: '思想很深刻', time: '15:37' },
  { from: 'her', text: '我对你表示欣赏', time: '15:37' },
  { from: 'me', text: '谢谢 你能理解到深刻，或许你也是一个求真的人', time: '15:54' },
  { from: 'me', text: '这也是一种交流了~', time: '15:54' },
]

export default function Prologue() {
  return (
    <section className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          序章
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          我们的第一次交流 · 2025.11.21
        </p>

        {/* 时间戳 */}
        <div className="text-center mb-6">
          <span className="text-[11px] text-text-faint tracking-wider">
            2025/11/21 15:37
          </span>
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
                className={`chat-row flex ${
                  isMe ? 'justify-end' : 'justify-start'
                } items-end gap-2`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[12px] text-amber-950 font-medium shrink-0 shadow-sm">
                    怡
                  </div>
                )}
                <div className="flex flex-col max-w-[72%]">
                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed ${
                      isMe ? 'bubble-me' : 'bubble-her'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {showTime && (
                    <span
                      className={`text-[10px] text-text-faint/70 mt-0.5 ${
                        isMe ? 'text-right pr-1' : 'text-left pl-1'
                      }`}
                    >
                      {msg.time}
                    </span>
                  )}
                </div>
                {isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-[12px] text-slate-100 font-medium shrink-0 shadow-sm">
                    我
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 text-center font-kai text-text-dim text-base md:text-xl max-w-2xl mx-auto italic"
        >
          这是我们的第一次交流。后来我才知道，那是我这一年的开头。
        </motion.p>
      </motion.div>
    </section>
  )
}
