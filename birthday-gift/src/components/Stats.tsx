import { motion } from 'framer-motion'
import { daysSinceStart, daysToAnniversary, formatDate } from '../utils/date'
import { START_DATE, BIRTHDAY, ANNIVERSARY } from '../data/moments'
import { useConfig } from '../config/ConfigContext'

type Stat = {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function tpl(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export default function Stats() {
  const { siteText } = useConfig()
  const t = siteText.stats
  const days = daysSinceStart(BIRTHDAY)
  const toAnniv = daysToAnniversary(BIRTHDAY)

  const vars = {
    days,
    toAnniv,
    startDate: formatDate(START_DATE),
    annivDate: formatDate(ANNIVERSARY),
  }

  const stats: Stat[] = t.items.map((item, i) => ({
    label: item.label,
    value: tpl(item.value, vars),
    sub: tpl(item.sub, vars),
    highlight: i < 2,
  }))

  return (
    <section id="stats" className="relative py-24 md:py-36 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-center font-serif text-2xl md:text-4xl text-amber-soft mb-4">
          {t.title}
        </h2>
        <p className="text-center text-text-faint text-sm mb-16">
          {t.subtitle}
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
