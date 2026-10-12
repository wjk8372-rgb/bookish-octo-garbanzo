import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '../config/ConfigContext'
import { formatDate } from '../utils/date'
import type { Moment } from '../data/moments'

/* ── 信件收纳盒 ── */
// 鼠标悬停 → 信封拉出，显示封面信息
// 点击 → 展开全文阅读面板

function LetterSlot({
  moment,
  index,
  onOpen,
}: {
  moment: Moment
  index: number
  onOpen: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const letter = moment.letter!
  const isFromHer = letter.from === 'her'
  const dateStr = moment.date.replace(/-/g, '.').replace(/ .*/, '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      className="relative"
      style={{ width: '80px', height: '110px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 信封 */}
      <div
        className="envelope-slot absolute left-0 cursor-pointer"
        style={{
          top: hovered ? '-55px' : '0',
          width: '80px',
          height: hovered ? '165px' : '110px',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'bottom center',
        }}
        onClick={onOpen}
      >
        <div
          className="relative rounded overflow-hidden"
          style={{
            width: '80px',
            height: '100%',
            background: 'linear-gradient(135deg, #f5efe0 0%, #ede3cc 100%)',
            boxShadow: hovered
              ? '0 8px 25px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.3)',
            border: '1px solid rgba(120,100,60,0.15)',
            transition: 'box-shadow 0.3s',
          }}
        >
          {/* 信封封口三角 */}
          <div
            className="absolute top-0 left-0 right-0 z-[2] pointer-events-none"
            style={{
              height: hovered ? '30px' : '45px',
              background: 'linear-gradient(180deg, #ddd5c0 0%, #d4ccb8 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              transition: 'height 0.3s ease',
            }}
          />

          {/* 蜡封 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-serif text-white z-[3]"
            style={{
              bottom: '18px',
              width: '22px',
              height: '22px',
              fontSize: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              background: isFromHer
                ? 'linear-gradient(135deg, #e8758a, #c94560)'
                : 'linear-gradient(135deg, #d4a04c, #b8860b)',
            }}
          >
            {isFromHer ? '怡' : '凯'}
          </div>

          {/* 封面信息（hover 时显示） */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
                className="absolute left-0 right-0 text-center pointer-events-none px-1"
                style={{ top: '50px' }}
              >
                <div
                  className="font-serif leading-tight mb-0.5"
                  style={{ fontSize: '9px', color: '#5a4a30', fontWeight: 500 }}
                >
                  《{letter.title}》
                </div>
                <div style={{ fontSize: '8px', color: '#8a7a5a' }}>
                  {dateStr}
                </div>
                <div style={{ fontSize: '7px', color: '#a89060', letterSpacing: '0.15em', marginTop: '2px' }}>
                  {isFromHer ? 'FROM YOU' : 'FROM 凯'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部日期标签 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
        style={{
          bottom: '-22px',
          fontSize: '7px',
          color: hovered ? '#c4a874' : '#6a5e4a',
          opacity: hovered ? 1 : 0.5,
          transition: 'all 0.3s',
        }}
      >
        {dateStr}
      </div>
    </motion.div>
  )
}

/* ── 全文阅读面板 ── */
function LetterDetail({
  moment,
  onClose,
}: {
  moment: Moment
  onClose: () => void
}) {
  const letter = moment.letter!
  const isFromHer = letter.from === 'her'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-10"
      style={{ background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4 }}
        className="envelope-body relative rounded-lg overflow-y-auto"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '80vh',
          padding: '40px 50px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-xl text-amber-900/40 hover:text-amber-900 transition-colors bg-none border-none cursor-pointer"
        >
          ✕
        </button>

        {/* 标题 */}
        <h3 className="font-serif text-xl md:text-2xl text-amber-950 mb-1.5">
          《{letter.title}》
        </h3>

        {/* 元信息 */}
        <div className="text-[11px] text-amber-900/50 mb-5 pb-3.5 border-b border-amber-900/15">
          {formatDate(moment.date)} · {isFromHer ? '你' : '凯'} · {moment.summary}
        </div>

        {/* 正文 */}
        <p className="font-kai text-sm md:text-[15px] leading-8 whitespace-pre-line text-amber-950/90">
          {letter.content}
        </p>

        {/* 笔记 */}
        <div className="mt-5 pt-3.5 border-t border-amber-900/10 text-xs text-amber-700/60 italic">
          📝 {moment.note}
        </div>

        {/* 标签 */}
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {moment.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(196,168,116,0.15)', color: '#8a7a4a' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function LetterViewer() {
  const { visibleMoments: moments } = useConfig()
  const [selected, setSelected] = useState<Moment | null>(null)
  const letterMoments = moments.filter((m) => m.type === 'letter' && m.letter)

  return (
    <section id="letter" className="relative py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-serif text-xl md:text-3xl text-amber-soft mb-2">
          信件收纳盒
        </h2>
        <p className="text-center text-text-faint text-xs mb-12">
          写过的，和没寄出的 · 悬停查看 · 点击展开
        </p>

        {/* 信封排列 */}
        <div className="flex flex-wrap gap-3.5 justify-center max-w-2xl mx-auto">
          {letterMoments.map((m, i) => (
            <LetterSlot
              key={m.id}
              moment={m}
              index={i}
              onOpen={() => setSelected(m)}
            />
          ))}
        </div>

        {/* 底座阴影 */}
        <div
          className="mx-auto mt-[-8px]"
          style={{
            width: 'min(680px, 95%)',
            height: '6px',
            background: 'linear-gradient(180deg, rgba(196,168,116,0.15) 0%, transparent 100%)',
            borderRadius: '0 0 50% 50% / 100% 100% 0 0',
          }}
        />
      </div>

      {/* 全文弹窗 */}
      <AnimatePresence>
        {selected && (
          <LetterDetail moment={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}
