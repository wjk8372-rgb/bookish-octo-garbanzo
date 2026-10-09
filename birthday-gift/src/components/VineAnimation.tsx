import { useEffect, useRef, useState, useMemo } from 'react'

// 固定叶子配置：位置(沿路径的百分比)、左右、大小、旋转角度
// 在组件外定义，保证每次渲染稳定不闪烁
const LEAVES = [
  { t: 0.08, side: 'left' as const, size: 10, rot: -30 },
  { t: 0.16, side: 'right' as const, size: 12, rot: 25 },
  { t: 0.24, side: 'left' as const, size: 14, rot: -20 },
  { t: 0.33, side: 'right' as const, size: 11, rot: 35 },
  { t: 0.42, side: 'left' as const, size: 15, rot: -15 },
  { t: 0.5, side: 'right' as const, size: 13, rot: 28 },
  { t: 0.58, side: 'left' as const, size: 12, rot: -25 },
  { t: 0.66, side: 'right' as const, size: 16, rot: 20 },
  { t: 0.74, side: 'left' as const, size: 14, rot: -30 },
  { t: 0.82, side: 'right' as const, size: 13, rot: 22 },
  { t: 0.9, side: 'left' as const, size: 15, rot: -18 },
]

// 顶部的花
const FLOWERS = [
  { t: 0.96, side: 'left' as const, size: 10 },
  { t: 0.98, side: 'right' as const, size: 8 },
]

export default function VineAnimation() {
  const pathRef = useRef<SVGPathElement>(null)
  const [progress, setProgress] = useState(0)
  const [pathLength, setPathLength] = useState(0)

  // 计算路径总长度（只在挂载后算一次）
  useEffect(() => {
    const el = pathRef.current
    if (el) {
      const len = el.getTotalLength()
      setPathLength(len)
    }
  }, [])

  // 滚动监听：用 requestAnimationFrame 节流
  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const p = docHeight > 0 ? Math.max(0, Math.min(1, scrollTop / docHeight)) : 0
        setProgress(p)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // 生成稳定的叶子/花朵坐标（基于路径上的点）
  const leafCoords = useMemo(() => {
    const el = pathRef.current
    if (!el || pathLength === 0) return []
    return LEAVES.map((leaf) => {
      const pt = el.getPointAtLength(pathLength * leaf.t)
      return { ...leaf, x: pt.x, y: pt.y }
    })
  }, [pathLength])

  const flowerCoords = useMemo(() => {
    const el = pathRef.current
    if (!el || pathLength === 0) return []
    return FLOWERS.map((f) => {
      const pt = el.getPointAtLength(pathLength * f.t)
      return { ...f, x: pt.x, y: pt.y }
    })
  }, [pathLength])

  return (
    <div
      className="fixed top-0 right-0 h-[100svh] w-24 md:w-32 pointer-events-none z-10"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 800"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* 藤蔓渐变 */}
          <linearGradient id="vineGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5a8a3a" />
            <stop offset="50%" stopColor="#6ba84a" />
            <stop offset="100%" stopColor="#7cc057" />
          </linearGradient>
          {/* 叶子渐变 */}
          <radialGradient id="leafGrad" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#9fd876" />
            <stop offset="100%" stopColor="#4a7a2e" />
          </radialGradient>
          {/* 花朵渐变 */}
          <radialGradient id="flowerGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffe2a8" />
            <stop offset="60%" stopColor="#f7c970" />
            <stop offset="100%" stopColor="#c89b4e" />
          </radialGradient>
        </defs>

        {/* 主藤蔓路径：从底部蜿蜒到顶部 */}
        <path
          ref={pathRef}
          d="
            M 60 790
            C 30 740, 90 700, 55 650
            C 20 600, 85 560, 50 510
            C 15 460, 80 420, 55 370
            C 25 320, 85 280, 50 230
            C 15 180, 80 140, 55 90
            C 30 45, 70 20, 60 5
          "
          fill="none"
          stroke="url(#vineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />

        {/* 嫩芽（底部起点，始终显示） */}
        <g transform="translate(60, 788)">
          {/* 茎 */}
          <line
            x1="0" y1="0" x2="0" y2={-8 - progress * 4}
            stroke="#7cc057" strokeWidth="2" strokeLinecap="round"
          />
          {/* 两片小叶子 */}
          <ellipse
            cx="-5" cy={-6 - progress * 2} rx="4" ry="2.5"
            fill="url(#leafGrad)"
            transform={`rotate(${-30 - progress * 10} -5 ${-6 - progress * 2})`}
            style={{ transition: 'all 0.3s ease' }}
          />
          <ellipse
            cx="5" cy={-6 - progress * 2} rx="4" ry="2.5"
            fill="url(#leafGrad)"
            transform={`rotate(${30 + progress * 10} 5 ${-6 - progress * 2})`}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* 叶子：藤蔓到达后出现 */}
        {leafCoords.map((leaf, i) => {
          const visible = progress > leaf.t - 0.03
          const scale = visible ? Math.min(1, (progress - leaf.t + 0.03) / 0.05) : 0
          return (
            <g
              key={i}
              transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rot}) scale(${scale})`}
              style={{ transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={visible ? 1 : 0}
            >
              <ellipse
                cx={leaf.side === 'left' ? -leaf.size * 0.6 : leaf.size * 0.6}
                cy="0"
                rx={leaf.size}
                ry={leaf.size * 0.5}
                fill="url(#leafGrad)"
              />
              {/* 叶脉 */}
              <line
                x1="0" y1="0"
                x2={leaf.side === 'left' ? -leaf.size * 1.2 : leaf.size * 1.2}
                y2="0"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="0.5"
              />
            </g>
          )
        })}

        {/* 顶部花朵：藤蔓长到顶部后绽放 */}
        {flowerCoords.map((f, i) => {
          const visible = progress > f.t - 0.05
          const scale = visible ? Math.min(1, (progress - f.t + 0.05) / 0.08) : 0
          return (
            <g
              key={`flower-${i}`}
              transform={`translate(${f.x}, ${f.y}) scale(${scale})`}
              style={{ transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={visible ? 1 : 0}
            >
              {/* 花瓣 */}
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx="0" cy={-f.size * 0.7}
                  rx={f.size * 0.4}
                  ry={f.size * 0.7}
                  fill="url(#flowerGrad)"
                  transform={`rotate(${angle})`}
                  opacity="0.9"
                />
              ))}
              {/* 花心 */}
              <circle cx="0" cy="0" r={f.size * 0.3} fill="#f7c970" />
            </g>
          )
        })}
      </svg>

      {/* 进度提示文字（仅在刚开始时显示） */}
      {progress < 0.05 && (
        <div
          className="absolute bottom-4 right-1 text-[10px] text-text-faint/50 tracking-wider"
          style={{ writingMode: 'vertical-rl' }}
        >
          向下滚动，藤蔓会生长
        </div>
      )}
    </div>
  )
}
