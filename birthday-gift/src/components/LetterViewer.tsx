import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '../config/ConfigContext'
import { formatDate } from '../utils/date'
import type { Moment } from '../data/moments'

/* ── 信件收纳盒 · 羊皮纸卷边复古 ── */
// 鼠标悬停 → 信封拉出，显示封面信息
// 点击 → 展开全文阅读面板

const SLOT_W = 110   // 信封宽度
const SLOT_H = 150   // 信封高度
const HOVER_LIFT = 70 // 悬停时上移距离
const ROW_GAP = 80    // 行间距（确保拉出的信封不挡下一行）

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
      style={{ width: `${SLOT_W}px`, height: `${SLOT_H}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 信封 */}
      <div
        className="absolute left-0 cursor-pointer"
        style={{
          top: hovered ? `-${HOVER_LIFT}px` : '0',
          width: `${SLOT_W}px`,
          height: hovered ? `${SLOT_H + HOVER_LIFT}px` : `${SLOT_H}px`,
          transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transformOrigin: 'bottom center',
          zIndex: hovered ? 50 : 10,
        }}
        onClick={onOpen}
      >
        <div
          className="relative rounded-sm overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            /* 羊皮纸纹理 */
            background: `
              radial-gradient(ellipse at 20% 15%, rgba(160,120,50,0.1) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 85%, rgba(100,70,20,0.08) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(180,150,80,0.05) 0%, transparent 70%),
              linear-gradient(135deg, #e6d4a8 0%, #dcc8a0 50%, #e0d0a8 100%)
            `,
            boxShadow: hovered
              ? '0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(120,80,20,0.08), inset 0 -3px 6px rgba(100,60,10,0.06), inset 0 3px 6px rgba(255,240,200,0.1)'
              : '0 2px 8px rgba(0,0,0,0.3), inset 0 0 15px rgba(120,80,20,0.08), inset 0 -3px 6px rgba(100,60,10,0.06), inset 0 3px 6px rgba(255,240,200,0.1)',
            border: '1px solid #c4a874',
            transition: 'box-shadow 0.3s',
          }}
        >
          {/* 信封封口三角 */}
          <div
            className="absolute top-0 left-0 right-0 z-[2] pointer-events-none"
            style={{
              height: hovered ? '40px' : '60px',
              background: 'linear-gradient(180deg, #d4c098 0%, #ccb888 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              transition: 'height 0.3s ease',
            }}
          />

          {/* 圆形邮戳 */}
          <div
            className="absolute z-[4] flex items-center justify-center"
            style={{
              top: '6px',
              right: '5px',
              width: '30px',
              height: '30px',
              border: '1.8px solid rgba(100,60,20,0.25)',
              borderRadius: '50%',
              transform: 'rotate(-12deg)',
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '7px',
              color: 'rgba(100,60,20,0.3)',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            POST<br />{dateStr.slice(5)}
          </div>

          {/* 蜡封 */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-serif z-[3]"
            style={{
              bottom: '22px',
              width: '30px',
              height: '30px',
              fontSize: '12px',
              color: 'rgba(255,250,240,0.95)',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              background: isFromHer
                ? 'radial-gradient(circle at 30% 30%, #c94560 0%, #8a2848 60%, #5a1430 100%)'
                : 'radial-gradient(circle at 30% 30%, #b8860b 0%, #8a6210 60%, #4a3008 100%)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)',
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
                className="absolute left-0 right-0 text-center pointer-events-none px-1 z-[1]"
                style={{ top: '65px' }}
              >
                <div
                  className="font-serif leading-tight mb-1"
                  style={{ fontSize: '11px', color: '#3a2a10', fontWeight: 600 }}
                >
                  《{letter.title}》
                </div>
                <div
                  style={{
                    width: '18px',
                    height: '1px',
                    background: 'rgba(100,60,20,0.2)',
                    margin: '4px auto',
                  }}
                />
                <div
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '10px',
                    color: '#6a4a20',
                    fontStyle: 'italic',
                  }}
                >
                  {dateStr}
                </div>
                <div
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '9px',
                    color: '#8a6030',
                    letterSpacing: '0.2em',
                    marginTop: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {isFromHer ? 'FROM 怡' : 'FROM 凯'}
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
          bottom: '-24px',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '10px',
          color: hovered ? '#c4a874' : '#6a5e4a',
          opacity: hovered ? 1 : 0.4,
          fontStyle: 'italic',
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10"
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
          {formatDate(moment.date)} · {isFromHer ? '怡' : '凯'} · {moment.summary}
        </div>

        {/* 正文 */}
        <p className="font-kai text-sm md:text-[15px] leading-8 whitespace-pre-line text-amber-950/90">
          {letter.content}
        </p>

        {/* 笔记 */}
        <div className="mt-5 pt-3.5 border-t border-amber-900/10 text-xs text-amber-700/60 italic">
          📝 {moment.note}
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

        {/* 信封排列 — 一排最多5封 */}
        <div
          className="flex flex-wrap justify-center max-w-2xl mx-auto"
          style={{ gap: '18px', rowGap: `${ROW_GAP}px` }}
        >
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
          className="mx-auto"
          style={{
            width: 'min(660px, 95%)',
            height: '6px',
            marginTop: '4px',
            background: 'linear-gradient(180deg, rgba(196,168,116,0.12) 0%, transparent 100%)',
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
