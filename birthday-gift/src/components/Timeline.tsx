import { motion } from 'framer-motion'
import { moments } from '../data/moments'
import MomentCard from './MomentCard'

export default function Timeline() {
  return (
    <section id="timeline" className="relative py-24 md:py-36 px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
          {/* 左侧时间轴线 */}
          <div className="absolute left-2 md:left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-warm/40 to-transparent" />

          <div className="space-y-8 md:space-y-10 pl-8 md:pl-12">
            {moments.map((moment, i) => (
              <div key={moment.id} className="relative">
                {/* 轴上的点 */}
                <div className="absolute -left-[26px] md:-left-[34px] top-6 w-3 h-3 rounded-full bg-amber-warm shadow-[0_0_10px_rgba(247,201,112,0.8)]" />
                <MomentCard moment={moment} index={i} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
