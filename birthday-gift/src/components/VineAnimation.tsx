import { useEffect, useRef, useState, useMemo } from 'react'

// 叶子配置：位置(沿路径百分比)、左右、大小、旋转、延迟
const LEAVES = [
  { t: 0.06, side: 'right' as const, size: 9, rot: 30, delay: 0 },
  { t: 0.11, side: 'left' as const, size: 11, rot: -22, delay: 0.02 },
  { t: 0.17, side: 'right' as const, size: 13, rot: 38, delay: 0.01 },
  { t: 0.22, side: 'left' as const, size: 10, rot: -15, delay: 0.03 },
  { t: 0.28, side: 'left' as const, size: 14, rot: -28, delay: 0 },
  { t: 0.34, side: 'right' as const, size: 12, rot: 20, delay: 0.02 },
  { t: 0.4, side: 'left' as const, size: 15, rot: -35, delay: 0.01 },
  { t: 0.46, side: 'right' as const, size: 11, rot: 25, delay: 0 },
  { t: 0.52, side: 'left' as const, size: 13, rot: -18, delay: 0.03 },
  { t: 0.58, side: 'right' as const, size: 16, rot: 32, delay: 0.01 },
  { t: 0.64, side: 'left' as const, size: 12, rot: -24, delay: 0 },
  { t: 0.7, side: 'right' as const, size: 14, rot: 18, delay: 0.02 },
  { t: 0.76, side: 'left' as const, size: 10, rot: -30, delay: 0.01 },
  { t: 0.82, side: 'right' as const, size: 15, rot: 28, delay: 0 },
  { t: 0.88, side: 'left' as const, size: 13, rot: -20, delay: 0.02 },
  { t: 0.93, side: 'right' as const, size: 11, rot: 22, delay: 0 },
]

// 小分支（卷须）
const TENDRILS = [
  { t: 0.15, side: 'left' as const, len: 18 },
  { t: 0.3, side: 'right' as const, len: 22 },
  { t: 0.48, side: 'left' as const, len: 16 },
  { t: 0.62, side: 'right' as const, len: 20 },
  { t: 0.78, side: 'left' as const, len: 24 },
  { t: 0.9, side: 'right' as const, len: 14 },
]

// 顶部花朵
const FLOWERS = [
  { t: 0.97, side: 'left' as const, size: 9 },
  { t: 0.99, side: 'right' as const, size: 7 },
]

export default function VineAnimation() {
  const pathRef = useRef<SVGPathElement>(null)
  const [progress, setProgress] = useState(0)
  const [pathLength, setPathLength] = useState(0)
  const [timelineActive, setTimelineActive] = useState(false)
  const [burstCount, setBurstCount] = useState(0) // 卡片翻转触发的生长爆发
  const burstCountRef = useRef(0)

  // 计算路径总长度
  useEffect(() => {
    const el = pathRef.current
    if (el) {
      setPathLength(el.getTotalLength())
    }
  }, [])

  // 滚动监听
  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const p = docHeight > 0 ? Math.max(0, Math.min(1, scrollTop / docHeight)) : 0
        setProgress(p)

        // 检测时间线是否在视口中
        const timelineEl = document.getElementById('timeline')
        if (timelineEl) {
          const rect = timelineEl.getBoundingClientRect()
          const vh = window.innerHeight
          // 时间线进入视口 20%~80% 时激活
          setTimelineActive(rect.top < vh * 0.8 && rect.bottom > vh * 0.2)
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // 监听卡片翻转事件
  useEffect(() => {
    const onCardFlip = () => {
      burstCountRef.current += 1
      setBurstCount(burstCountRef.current)
    }
    window.addEventListener('vine:burst', onCardFlip)
    return () => window.removeEventListener('vine:burst', onCardFlip)
  }, [])

  // 实际生长进度 = 滚动进度 + 卡片翻转带来的额外生长（最多加15%）
  const burstBonus = Math.min(0.15, burstCount * 0.02)
  const effectiveProgress = Math.min(1, progress + burstBonus)

  // 叶子坐标
  const leafCoords = useMemo(() => {
    const el = pathRef.current
    if (!el || pathLength === 0) return []
    return LEAVES.map((leaf) => {
      const pt = el.getPointAtLength(pathLength * leaf.t)
      const tangent = el.getPointAtLength(Math.min(pathLength, pathLength * leaf.t + 1))
      const angle = Math.atan2(tangent.y - pt.y, tangent.x - pt.x) * (180 / Math.PI)
      return { ...leaf, x: pt.x, y: pt.y, pathAngle: angle }
    })
  }, [pathLength])

  // 卷须坐标
  const tendrilCoords = useMemo(() => {
    const el = pathRef.current
    if (!el || pathLength === 0) return []
    return TENDRILS.map((t) => {
      const pt = el.getPointAtLength(pathLength * t.t)
      return { ...t, x: pt.x, y: pt.y }
    })
  }, [pathLength])

  // 花朵坐标
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
      className="fixed top-0 right-0 h-[100svh] w-20 md:w-28 pointer-events-none z-10"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 110 820"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="vineGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4a7a2e" />
            <stop offset="40%" stopColor="#5a8a3a" />
            <stop offset="70%" stopColor="#6ba84a" />
            <stop offset="100%" stopColor="#7cc057" />
          </linearGradient>
          <radialGradient id="leafGrad" cx="35%" cy="25%">
            <stop offset="0%" stopColor="#a8e07a" />
            <stop offset="60%" stopColor="#5a9a38" />
            <stop offset="100%" stopColor="#3a6a22" />
          </radialGradient>
          <radialGradient id="leafGradDark" cx="35%" cy="25%">
            <stop offset="0%" stopColor="#8fc868" />
            <stop offset="100%" stopColor="#3a6a22" />
          </radialGradient>
          <radialGradient id="flowerGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffe2a8" />
            <stop offset="50%" stopColor="#f7c970" />
            <stop offset="100%" stopColor="#c89b4e" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 时间线激活时的背景光晕 */}
        {timelineActive && (
          <ellipse
            cx="55" cy="410" rx="50" ry="300"
            fill="rgba(124, 192, 87, 0.06)"
            style={{ transition: 'opacity 0.5s' }}
          />
        )}

        {/* 主藤蔓 - 不规则蜿蜒路径 */}
        <path
          ref={pathRef}
          d="
            M 55 810
            C 35 775, 75 750, 48 715
            C 22 680, 70 660, 52 620
            C 32 580, 78 555, 50 515
            C 25 475, 72 450, 55 410
            C 38 370, 80 345, 52 305
            C 28 265, 75 240, 50 200
            C 28 160, 72 135, 55 95
            C 38 58, 68 30, 55 5
          "
          fill="none"
          stroke="url(#vineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - effectiveProgress)}
          style={{
            transition: 'stroke-dashoffset 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: timelineActive ? 'url(#glow)' : 'none',
          }}
        />

        {/* 卷须（小分支） */}
        {tendrilCoords.map((t, i) => {
          const visible = effectiveProgress > t.t - 0.02
          const scale = visible ? Math.min(1, (effectiveProgress - t.t + 0.02) / 0.04) : 0
          const dir = t.side === 'left' ? -1 : 1
          return (
            <g
              key={`tendril-${i}`}
              transform={`translate(${t.x}, ${t.y}) scale(${scale})`}
              style={{ transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={visible ? 0.7 : 0}
            >
              <path
                d={`M 0 0 Q ${dir * 8} -6 ${dir * t.len * 0.6} -${t.len * 0.4} Q ${dir * t.len} -${t.len * 0.8} ${dir * t.len * 0.8} -${t.len}`}
                fill="none"
                stroke="#5a8a3a"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* 卷须末端的小圈 */}
              <circle
                cx={dir * t.len * 0.8}
                cy={-t.len}
                r="2"
                fill="none"
                stroke="#5a8a3a"
                strokeWidth="1"
              />
            </g>
          )
        })}

        {/* 嫩芽（底部） */}
        <g transform="translate(55, 808)">
          <line
            x1="0" y1="0" x2="0" y2={-8 - effectiveProgress * 4}
            stroke="#7cc057" strokeWidth="2" strokeLinecap="round"
          />
          <ellipse
            cx="-5" cy={-6 - effectiveProgress * 2} rx="4.5" ry="2.8"
            fill="url(#leafGrad)"
            transform={`rotate(${-30 - effectiveProgress * 10} -5 ${-6 - effectiveProgress * 2})`}
            style={{ transition: 'all 0.3s ease' }}
          />
          <ellipse
            cx="5" cy={-6 - effectiveProgress * 2} rx="4.5" ry="2.8"
            fill="url(#leafGrad)"
            transform={`rotate(${30 + effectiveProgress * 10} 5 ${-6 - effectiveProgress * 2})`}
            style={{ transition: 'all 0.3s ease' }}
          />
        </g>

        {/* 叶子 */}
        {leafCoords.map((leaf, i) => {
          const visible = effectiveProgress > leaf.t - 0.02 + leaf.delay
          const scale = visible ? Math.min(1, (effectiveProgress - leaf.t + 0.02 - leaf.delay) / 0.05) : 0
          // 叶子朝向：根据路径切线方向调整
          const baseAngle = leaf.side === 'left' ? leaf.pathAngle + 180 : leaf.pathAngle
          return (
            <g
              key={i}
              transform={`translate(${leaf.x}, ${leaf.y}) rotate(${baseAngle + leaf.rot}) scale(${scale})`}
              style={{ transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={visible ? 1 : 0}
            >
              {/* 叶子形状：不对称的椭圆，更自然 */}
              <path
                d={`M 0 0 
                    Q ${leaf.side === 'left' ? -leaf.size : leaf.size} ${-leaf.size * 0.3} ${leaf.side === 'left' ? -leaf.size * 1.4 : leaf.size * 1.4} 0
                    Q ${leaf.side === 'left' ? -leaf.size : leaf.size} ${leaf.size * 0.3} 0 0 Z`}
                fill={i % 3 === 0 ? 'url(#leafGradDark)' : 'url(#leafGrad)'}
              />
              {/* 叶脉 */}
              <line
                x1="0" y1="0"
                x2={leaf.side === 'left' ? -leaf.size * 1.3 : leaf.size * 1.3}
                y2="0"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            </g>
          )
        })}

        {/* 花朵 */}
        {flowerCoords.map((f, i) => {
          const visible = effectiveProgress > f.t - 0.04
          const scale = visible ? Math.min(1, (effectiveProgress - f.t + 0.04) / 0.08) : 0
          return (
            <g
              key={`flower-${i}`}
              transform={`translate(${f.x}, ${f.y}) scale(${scale})`}
              style={{ transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={visible ? 1 : 0}
            >
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx="0" cy={-f.size * 0.7}
                  rx={f.size * 0.42}
                  ry={f.size * 0.72}
                  fill="url(#flowerGrad)"
                  transform={`rotate(${angle})`}
                  opacity="0.92"
                />
              ))}
              <circle cx="0" cy="0" r={f.size * 0.32} fill="#f7c970" />
              {/* 花心小点 */}
              <circle cx="0" cy="0" r={f.size * 0.12} fill="#a06830" />
            </g>
          )
        })}

        {/* 时间线激活时的萤火虫光点 */}
        {timelineActive &&
          [0, 1, 2, 3, 4].map((i) => (
            <circle
              key={`firefly-${i}`}
              cx={30 + (i * 17) % 60}
              cy={200 + i * 120}
              r="1.5"
              fill="#ffe2a8"
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.2;0.8;0.2"
                dur={`${1.5 + i * 0.3}s`}
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
              <animate
                attributeName="cy"
                values={`${200 + i * 120};${190 + i * 120};${200 + i * 120}`}
                dur={`${2 + i * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.3}s`}
              />
            </circle>
          ))}
      </svg>

      {/* 提示文字 */}
      {progress < 0.05 && (
        <div
          className="absolute bottom-4 right-1 text-[9px] text-text-faint/50 tracking-wider"
          style={{ writingMode: 'vertical-rl' }}
        >
          向下滚动，藤蔓会生长
        </div>
      )}

      {/* 时间线激活提示 */}
      {timelineActive && progress > 0.1 && progress < 0.6 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 text-[9px] text-green-300/50 tracking-wider"
          style={{ writingMode: 'vertical-rl' }}
        >
          回忆在生长…
        </div>
      )}
    </div>
  )
}
