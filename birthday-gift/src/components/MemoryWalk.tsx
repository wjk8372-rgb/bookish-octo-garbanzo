import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '../utils/date'

// 选取路上的关键回忆（按时间排序）
const walkStops = [
  {
    date: '2025-11-21',
    title: '你好啊',
    text: '互相关注后，你发来的第一条消息，是一只挥手的小白人。',
    side: 'left' as const,
  },
  {
    date: '2025-12-02',
    title: '王者荣耀？',
    text: '你猜我叫王者荣耀，又猜成王刚——那是我爸。',
    side: 'right' as const,
  },
  {
    date: '2026-02-28',
    title: '认识你是幸运的事',
    text: '你发了三个哭脸，说"我真的好感动"。',
    side: 'left' as const,
  },
  {
    date: '2026-03-03',
    title: '小芒果',
    text: '凌晨一点，你说起你家那只黄黄的小猫。',
    side: 'right' as const,
  },
  {
    date: '2026-05-28',
    title: '想要靠近你',
    text: '那封信我写了很久，发出的时候手是抖的。',
    side: 'left' as const,
  },
  {
    date: '2026-08-04',
    title: '我爱你',
    text: '凌晨两点四十六，你的三个字。那一夜我没睡。',
    side: 'right' as const,
  },
  {
    date: '2026-09-18',
    title: '一加一大于二',
    text: '你说和我内心的声音达成共振，就是一加一大于二。',
    side: 'left' as const,
  },
]

export default function MemoryWalk() {
  const [progress, setProgress] = useState(0) // 0 ~ 1
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [doorOpen, setDoorOpen] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const walkRef = useRef<HTMLDivElement>(null)

  // 滚动驱动前进
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    // section 进入视口顶部时开始，离开底部时完成
    const start = vh * 0.8
    const total = el.offsetHeight - vh
    const scrolled = start - rect.top
    const p = Math.max(0, Math.min(1, scrolled / (total + vh * 0.4)))
    setProgress(p)

    // 根据进度激活对应的路碑
    const stopCount = walkStops.length
    const idx = Math.min(stopCount - 1, Math.floor(p * stopCount * 1.05))
    if (p > 0.02) {
      setActiveIndex(idx)
    } else {
      setActiveIndex(null)
    }

    // 到达终点
    if (p > 0.9) {
      setDoorOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 点击门打开后的最终画面
  const handleDoorClick = () => {
    setShowFinal(true)
  }

  // 道路透视变换参数
  const cameraZ = 1 - progress * 0.85 // 摄像机从远处推进到近处
  const roadScale = 1 + progress * 0.3

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${walkStops.length * 100 + 60}vh` }}
    >
      {/* 天空背景 */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* 渐变天空 */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: `
              radial-gradient(ellipse at 50% ${30 + progress * 40}%, rgba(247, 201, 112, ${0.06 + progress * 0.12}), transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(120, 90, 200, ${0.08 + progress * 0.05}), transparent 55%),
              linear-gradient(180deg, #050410 0%, #0a0816 50%, #0d0a1f 100%)
            `,
          }}
        />

        {/* 星星 */}
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 60}%`,
                background: i % 5 === 0 ? '#ffe2a8' : '#fff',
                opacity: 0.3 + ((i * 7) % 7) / 10,
                animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite alternate`,
                animationDelay: `${(i % 5) * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* 流星 */}
        {progress > 0.3 && progress < 0.95 && (
          <div
            className="shooting-star"
            style={{ top: '15%', right: '10%' }}
          />
        )}

        {/* 道路容器（3D 透视） */}
        <div
          ref={walkRef}
          className="absolute inset-0 flex items-end justify-center"
          style={{ perspective: '800px', perspectiveOrigin: '50% 30%' }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `translateZ(${cameraZ * -200}px) scale(${roadScale})`,
              transition: 'transform 0.1s linear',
            }}
          >
            {/* 道路表面 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0"
              style={{
                width: '200%',
                height: '100%',
                transform: 'rotateX(65deg)',
                transformOrigin: 'bottom center',
                background: `
                  linear-gradient(180deg, transparent 0%, rgba(247,201,112,0.03) 40%, rgba(247,201,112,0.08) 100%),
                  repeating-linear-gradient(
                    0deg,
                    rgba(247,201,112,0.15) 0px,
                    rgba(247,201,112,0.15) 2px,
                    transparent 2px,
                    transparent 60px
                  )
                `,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
              }}
            />

            {/* 道路边缘线 */}
            <div
              className="absolute bottom-0 left-1/2"
              style={{
                width: '2px',
                height: '70%',
                background: 'linear-gradient(to top, rgba(247,201,112,0.5), transparent)',
                transform: 'translateX(-120px) rotateX(65deg)',
                transformOrigin: 'bottom center',
              }}
            />
            <div
              className="absolute bottom-0 left-1/2"
              style={{
                width: '2px',
                height: '70%',
                background: 'linear-gradient(to top, rgba(247,201,112,0.5), transparent)',
                transform: 'translateX(120px) rotateX(65deg)',
                transformOrigin: 'bottom center',
              }}
            />

            {/* 回忆路碑 */}
            {walkStops.map((stop, i) => {
              const stopProgress = (i + 1) / (walkStops.length + 1)
              const distance = (stopProgress - progress) * 100
              const isActive = activeIndex === i
              const opacity = Math.max(0, 1 - Math.abs(distance) / 25)
              const scale = 0.6 + opacity * 0.6

              // 路碑位置：远的在上方，近的在下方
              const topPercent = 20 + stopProgress * 55
              // 左右交替
              const leftPercent = stop.side === 'left' ? '15%' : 'auto'
              const rightPercent = stop.side === 'right' ? '15%' : 'auto'

              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${topPercent}%`,
                    left: leftPercent,
                    right: rightPercent,
                    opacity,
                    transform: `scale(${scale})`,
                    transformOrigin: stop.side === 'left' ? 'left center' : 'right center',
                  }}
                  animate={{
                    x: isActive ? 0 : stop.side === 'left' ? -20 : 20,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className={`glass px-4 py-3 max-w-[220px] ${
                      isActive ? 'shadow-[0_0_24px_rgba(247,201,112,0.3)]' : ''
                    }`}
                    style={{
                      borderColor: isActive ? 'rgba(247,201,112,0.5)' : 'rgba(247,201,112,0.1)',
                    }}
                  >
                    <div className="text-[10px] text-amber-dim tracking-wider mb-1">
                      {formatDate(stop.date)}
                    </div>
                    <div className="font-serif text-amber-soft text-sm mb-1">{stop.title}</div>
                    <div className="text-text-dim text-xs leading-relaxed">{stop.text}</div>
                  </div>
                  {/* 路碑杆子 */}
                  <div
                    className="w-px mx-auto"
                    style={{
                      height: '20px',
                      background: 'linear-gradient(to bottom, rgba(247,201,112,0.3), transparent)',
                    }}
                  />
                </motion.div>
              )
            })}

            {/* 终点之门 */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: '12%' }}
              animate={{
                opacity: progress > 0.7 ? 1 : 0,
                scale: progress > 0.7 ? 1 : 0.5,
              }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col items-center">
                <div
                  onClick={handleDoorClick}
                  className="relative w-24 h-36 cursor-pointer"
                  style={{ perspective: '600px' }}
                >
                  {/* 门框 */}
                  <div
                    className="absolute inset-0 rounded-t-full border-2"
                    style={{
                      borderColor: 'rgba(247,201,112,0.6)',
                      background: 'linear-gradient(180deg, rgba(247,201,112,0.1), rgba(247,201,112,0.05))',
                      boxShadow: '0 0 30px rgba(247,201,112,0.2)',
                    }}
                  />
                  {/* 门板 */}
                  <motion.div
                    className="absolute inset-0 rounded-t-full"
                    style={{
                      background: 'linear-gradient(135deg, #1a1530, #0d0a1f)',
                      border: '1px solid rgba(247,201,112,0.4)',
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                    }}
                    animate={{
                      rotateY: doorOpen ? -110 : 0,
                    }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* 门把手 */}
                    <div
                      className="absolute right-2 top-1/2 w-2 h-2 rounded-full"
                      style={{ background: '#f7c970' }}
                    />
                  </motion.div>
                  {/* 门后的光 */}
                  {doorOpen && (
                    <motion.div
                      className="absolute inset-0 rounded-t-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(247,201,112,0.4), transparent 70%)',
                      }}
                    />
                  )}
                </div>
                <div className="mt-3 text-amber-soft/70 text-xs tracking-wider">
                  {doorOpen ? '点击门，走进去' : '继续走…'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 顶部标题 */}
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2 text-center"
          animate={{ opacity: progress > 0.05 ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-2xl md:text-3xl text-amber-soft text-glow">
            陪你走一段路
          </h2>
          <p className="text-text-faint text-sm mt-2">向下滚动，和我一起走</p>
        </motion.div>

        {/* 进度指示器 */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
          <div className="w-1 h-32 bg-night-600/50 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-amber-warm rounded-full"
              style={{ height: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-[10px] text-amber-dim">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* 底部提示 */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-text-faint text-xs flex flex-col items-center gap-1"
          animate={{ opacity: progress > 0.05 ? 0 : 1 }}
        >
          <span>继续向下</span>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            ↓
          </motion.div>
        </motion.div>
      </div>

      {/* 终点最终画面 - 覆盖整个视口 */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(247,201,112,0.15), #050410 70%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <motion.div
              className="text-center max-w-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="text-6xl mb-8"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎂
              </motion.div>
              <h2 className="font-serif text-3xl md:text-5xl text-amber-soft text-glow mb-6">
                生日快乐
              </h2>
              <p className="font-kai text-lg md:text-xl text-text-dim leading-relaxed mb-4">
                这条路，从 2025.11.21 走到今天。
              </p>
              <p className="font-kai text-lg md:text-xl text-text-dim leading-relaxed mb-4">
                每一步，都是和你一起走过的。
              </p>
              <p className="font-kai text-lg md:text-xl text-text-dim leading-relaxed mb-8">
                以后的路，我还想继续陪你走。
              </p>
              <div className="font-serif text-xl text-amber-warm">
                — 小凯子
              </div>
              <motion.button
                onClick={() => setShowFinal(false)}
                className="mt-12 px-6 py-2 rounded-full border border-amber-warm/40 text-amber-soft/70 hover:bg-amber-warm/10 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                继续探索 ↓
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
