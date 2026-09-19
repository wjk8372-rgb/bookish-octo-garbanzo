import { motion } from 'framer-motion'
import { moments } from '../data/moments'
import MomentCard from './MomentCard'

export default function Timeline() {
  return (
    <section className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          时间线
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          那些被记住的瞬间
        </p>

        <div className="relative">
          {/* 中心轴线（桌面端） */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-warm/30 to-transparent -translate-x-1/2" />

          <div className="space-y-10 md:space-y-14">
            {moments.map((moment, i) => {
              const isLeft = i % 2 === 0
              return (
                <div key={moment.id} className="relative">
                  <div className="md:grid md:grid-cols-2 md:gap-10">
                    {/* 桌面端：偶数在左，奇数在右 */}
                    <div
                      className={isLeft ? 'md:col-start-1 md:pr-8' : 'md:col-start-2 md:pl-8'}
                    >
                      <MomentCard moment={moment} index={i} />
                    </div>
                  </div>

                  {/* 轴上的点（桌面端） */}
                  <div className="hidden md:block absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-warm shadow-[0_0_10px_rgba(247,201,112,0.8)]" />
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
