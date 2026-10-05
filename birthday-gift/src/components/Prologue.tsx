import { motion } from 'framer-motion'

// 真实评论与私信内容
const myComment = '思想很深刻。'
const herMessage = '思想很深刻，我对你表示欣赏。'

export default function Prologue() {
  return (
    <section className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1 }}
        className="max-w-5xl mx-auto"
      >
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          序章
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          一条评论，一条私信
        </p>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* 我的评论 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs text-text-faint mb-2 tracking-wider">
              我的抖音评论
            </p>
            <div className="glass p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-night-500 flex items-center justify-center text-xs text-text-faint">
                  我
                </div>
                <span className="text-sm text-text-dim">我</span>
              </div>
              <p className="font-kai text-text text-base md:text-lg leading-relaxed">
                「{myComment}」
              </p>
            </div>
          </motion.div>

          {/* 她的私信 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-xs text-text-faint mb-2 tracking-wider">
              她的私信
            </p>
            <div className="glass p-5 md:p-6 border-amber-warm/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-warm/20 flex items-center justify-center text-xs text-amber-soft">
                  她
                </div>
                <span className="text-sm text-amber-soft/80">她</span>
              </div>
              <p className="font-kai text-amber-soft text-base md:text-lg leading-relaxed">
                「{herMessage}」
              </p>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 text-center font-kai text-text-dim text-base md:text-xl max-w-2xl mx-auto italic"
        >
          如果那天我没多打那几个字，我们可能不会认识。
        </motion.p>
      </motion.div>
    </section>
  )
}
