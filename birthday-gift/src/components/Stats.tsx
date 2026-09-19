import { motion } from 'framer-motion'
import { daysSinceStart, daysToAnniversary, formatDate } from '../utils/date'
import { BIRTHDAY, START_DATE } from '../data/moments'

// mock 统计数据（可替换为真实统计）
const firstGoodnight = '2025-12-12'
const longestChatEnd = '凌晨 02:17'
const highFreqWords = ['哈哈哈', '晚安', '到家了吗']

type Stat = {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

export default function Stats() {
  const days = daysSinceStart(BIRTHDAY)
  const toAnniv = daysToAnniversary(BIRTHDAY)

  const stats: Stat[] = [
    {
      label: '认识天数',
      value: `第 ${days} 天`,
      sub: `从 ${formatDate(START_DATE)} 算起`,
      highlight: true,
    },
    {
      label: '距离一周年',
      value: `${toAnniv} 天`,
      sub: `到 ${formatDate('2026-11-21')}`,
      highlight: true,
    },
    {
      label: '第一条私信',
      value: formatDate(START_DATE),
      sub: '23:41',
    },
    {
      label: '第一次说晚安',
      value: formatDate(firstGoodnight),
      sub: '01:22',
    },
    {
      label: '最长一次聊天',
      value: longestChatEnd,
      sub: '从夜里十点开始',
    },
    {
      label: '高频词',
      value: highFreqWords.join(' · '),
      sub: '出现了很多很多次',
    },
  ]

  return (
    <section className="relative py-24 md:py-36 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          关于我们的一些数字
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          时间被拆成了这些具体的瞬间
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.08, 0.4) }}
              className={`glass p-6 md:p-7 text-center ${
                s.highlight ? 'border-amber-warm/40' : ''
              }`}
            >
              <p className="text-xs text-text-faint tracking-widest mb-3">
                {s.label}
              </p>
              <p
                className={`font-serif text-2xl md:text-3xl mb-2 ${
                  s.highlight ? 'text-amber-warm text-glow' : 'text-amber-soft'
                }`}
              >
                {s.value}
              </p>
              {s.sub && <p className="text-xs text-text-faint">{s.sub}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
