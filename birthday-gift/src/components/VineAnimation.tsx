import { useEffect, useRef, useState, useMemo } from 'react'

// 左侧叶子配置
const LEFT_LEAVES = [
  { t: 0.08, side: 'outer' as const, size: 10, rot: 35, delay: 0 },
  { t: 0.14, side: 'inner' as const, size: 13, rot: -25, delay: 0.01 },
  { t: 0.2, side: 'outer' as const, size: 11, rot: 28, delay: 0.02 },
  { t: 0.27, side: 'inner' as const, size: 15, rot: -18, delay: 0 },
  { t: 0.34, side: 'outer' as const, size: 12, rot: 32, delay: 0.01 },
  { t: 0.41, side: 'inner' as const, size: 14, rot: -22, delay: 0.03 },
  { t: 0.48, side: 'outer' as const, size: 10, rot: 20, delay: 0 },
  { t: 0.55, side: 'inner' as const, size: 13, rot: -15, delay: 0.02 },
  { t: 0.62, side: 'outer' as const, size: 11, rot: 25, delay: 0.01 },
  { t: 0.7, side: 'inner' as const, size: 9, rot: -30, delay: 0 },
  { t: 0.78, side: 'inner' as const, size: 8, rot: -20, delay: 0.02 },
]

// 右侧叶子配置
const RIGHT_LEAVES = [
  { t: 0.08, side: 'outer' as const, size: 10, rot: -35, delay: 0 },
  { t: 0.14, side: 'inner' as const, size: 13, rot: 25, delay: 0.01 },
  { t: 0.2, side: 'outer' as const, size: 11, rot: -28, delay: 0.02 },
  { t: 0.27, side: 'inner' as const, size: 15, rot: 18, delay: 0 },
  { t: 0.34, side: 'outer' as const, size: 12, rot: -32, delay: 0.01 },
  { t: 0.41, side: 'inner' as const, size: 14, rot: 22, delay: 0.03 },
  { t: 0.48, side: 'outer' as const, size: 10, rot: -20, delay: 0 },
  { t: 0.55, side: 'inner' as const, size: 13, rot: 15, delay: 0.02 },
  { t: 0.62, side: 'outer' as const, size: 11, rot: -25, delay: 0.01 },
  { t: 0.7, side: 'inner' as const, size: 9, rot: 30, delay: 0 },
  { t: 0.78, side: 'inner' as const, size: 8, rot: 20, delay: 0.02 },
]

// 卷须
const TENDRILS = [
  { side: 'left' as const, t: 0.12, len: 16 },
  { side: 'left' as const, t: 0.3, len: 20 },
  { side: 'left' as const, t: 0.5, len: 14 },
  { side: 'right' as const, t: 0.12, len: 16 },
  { side: 'right' as const, t: 0.3, len: 20 },
  { side: 'right' as const, t: 0.5, len: 14 },
]

// 底部交汇处的花朵
const TOP_FLOWERS = [
  { x: 600, y: 710, size: 11, delay: 0 },
  { x: 540, y: 690, size: 8, delay: 0.05 },
  { x: 660, y: 690, size: 8, delay: 0.1 },
  { x: 600, y: 660, size: 7, delay: 0.15 },
]

export default function VineAnimation() {
  const leftPathRef = useRef<SVGPathElement>(null)
  const rightPathRef = useRef<SVGPathElement>(null)
  const [progress, setProgress] = useState(0)
  // 初始化为大数，避免首帧 strokeDasharray=0 导致路径全显（闪一下交汇态）
  const [leftLen, setLeftLen] = useState(99999)
  const [rightLen, setRightLen] = useState(99999)
  const [timelineActive, setTimelineActive] = useState(false)
  const [burstCount, setBurstCount] = useState(0)
  const burstCountRef = useRef(0)

  useEffect(() => {
    if (leftPathRef.current) setLeftLen(leftPathRef.current.getTotalLength())
    if (rightPathRef.current) setRightLen(rightPathRef.current.getTotalLength())
  }, [])

  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const p = docHeight > 0 ? Math.max(0, Math.min(1, scrollTop / docHeight)) : 0
        setProgress(p)

        const timelineEl = document.getElementById('timeline')
        if (timelineEl) {
          const rect = timelineEl.getBoundingClientRect()
          const vh = window.innerHeight
          setTimelineActive(rect.top < vh * 0.85 && rect.bottom > vh * 0.15)
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

  useEffect(() => {
    const onCardFlip = () => {
      burstCountRef.current += 1
      setBurstCount(burstCountRef.current)
    }
    window.addEventListener('vine:burst', onCardFlip)
    return () => window.removeEventListener('vine:burst', onCardFlip)
  }, [])

  const burstBonus = Math.min(0.12, burstCount * 0.015)
  const effectiveProgress = Math.min(1, progress + burstBonus)

  // 叶子坐标
  const makeLeafCoords = (pathRef: React.RefObject<SVGPathElement | null>, len: number, leaves: typeof LEFT_LEAVES) => {
    const el = pathRef.current
    if (!el || len === 0) return []
    return leaves.map((leaf) => {
      const pt = el.getPointAtLength(len * leaf.t)
      const tan = el.getPointAtLength(Math.min(len, len * leaf.t + 1))
      const angle = Math.atan2(tan.y - pt.y, tan.x - pt.x) * (180 / Math.PI)
      return { ...leaf, x: pt.x, y: pt.y, pathAngle: angle }
    })
  }

  const leftLeaves = useMemo(
    () => makeLeafCoords(leftPathRef, leftLen, LEFT_LEAVES),
    [leftLen],
  )
  const rightLeaves = useMemo(
    () => makeLeafCoords(rightPathRef, rightLen, RIGHT_LEAVES),
    [rightLen],
  )

  const tendrilCoords = useMemo(() => {
    const result: { side: 'left' | 'right'; t: number; x: number; y: number; len: number }[] = []
    TENDRILS.forEach((t) => {
      const ref = t.side === 'left' ? leftPathRef.current : rightPathRef.current
      const len = t.side === 'left' ? leftLen : rightLen
      if (ref && len > 0) {
        const pt = ref.getPointAtLength(len * t.t)
        result.push({ ...t, x: pt.x, y: pt.y })
      }
    })
    return result
  }, [leftLen, rightLen])

  const renderLeaves = (leaves: typeof leftLeaves, vineSide: 'left' | 'right') =>
    leaves.map((leaf, i) => {
      const visible = effectiveProgress > leaf.t - 0.02 + leaf.delay
      const scale = visible ? Math.min(1, (effectiveProgress - leaf.t + 0.02 - leaf.delay) / 0.05) : 0
      const dir = leaf.side === 'outer' ? (vineSide === 'left' ? -1 : 1) : (vineSide === 'left' ? 1 : -1)
      const baseAngle = leaf.side === 'outer' ? leaf.pathAngle + 180 : leaf.pathAngle
      return (
        <g
          key={`${vineSide}-leaf-${i}`}
          transform={`translate(${leaf.x}, ${leaf.y}) rotate(${baseAngle + leaf.rot}) scale(${scale})`}
          style={{ transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
          opacity={visible ? 1 : 0}
        >
          <path
            d={`M 0 0 
                Q ${dir * leaf.size} ${-leaf.size * 0.35} ${dir * leaf.size * 1.5} 0
                Q ${dir * leaf.size} ${leaf.size * 0.35} 0 0 Z`}
            fill={i % 3 === 0 ? 'url(#leafGradDark)' : 'url(#leafGrad)'}
          />
          <line
            x1="0" y1="0"
            x2={dir * leaf.size * 1.4}
            y2="0"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.5"
          />
        </g>
      )
    })

  const renderTendrils = () =>
    tendrilCoords.map((t, i) => {
      const visible = effectiveProgress > t.t - 0.02
      const scale = visible ? Math.min(1, (effectiveProgress - t.t + 0.02) / 0.04) : 0
      const dir = t.side === 'left' ? -1 : 1
      return (
        <g
          key={`tendril-${i}`}
          transform={`translate(${t.x}, ${t.y}) scale(${scale})`}
          style={{ transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
          opacity={visible ? 0.6 : 0}
        >
          <path
            d={`M 0 0 Q ${dir * 6} -8 ${dir * t.len * 0.7} -${t.len * 0.5} Q ${dir * t.len * 1.1} -${t.len} ${dir * t.len * 0.9} -${t.len * 1.3}`}
            fill="none"
            stroke="#5a8a3a"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle
            cx={dir * t.len * 0.9}
            cy={-t.len * 1.3}
            r="1.5"
            fill="none"
            stroke="#5a8a3a"
            strokeWidth="0.8"
          />
        </g>
      )
    })

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* 藤蔓渐变：底部深绿，顶部嫩绿 */}
          <linearGradient id="vineGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3d6b24" />
            <stop offset="30%" stopColor="#4f8a30" />
            <stop offset="60%" stopColor="#6ba84a" />
            <stop offset="100%" stopColor="#8fd060" />
          </linearGradient>
          <linearGradient id="vineGradRight" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3d6b24" />
            <stop offset="30%" stopColor="#4f8a30" />
            <stop offset="60%" stopColor="#6ba84a" />
            <stop offset="100%" stopColor="#8fd060" />
          </linearGradient>
          <radialGradient id="leafGrad" cx="35%" cy="25%">
            <stop offset="0%" stopColor="#a8e07a" />
            <stop offset="55%" stopColor="#5a9a38" />
            <stop offset="100%" stopColor="#356620" />
          </radialGradient>
          <radialGradient id="leafGradDark" cx="35%" cy="25%">
            <stop offset="0%" stopColor="#8fc868" />
            <stop offset="100%" stopColor="#2d5518" />
          </radialGradient>
          <radialGradient id="flowerGrad" cx="50%" cy="45%">
            <stop offset="0%" stopColor="#fff0c8" />
            <stop offset="45%" stopColor="#f7c970" />
            <stop offset="100%" stopColor="#c89b4e" />
          </radialGradient>
          <radialGradient id="flowerCenter" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#b8860b" />
          </radialGradient>
          <filter id="vineGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 时间线激活时的柔和光晕 */}
        {timelineActive && (
          <ellipse
            cx="600" cy="450" rx="400" ry="350"
            fill="rgba(124, 192, 87, 0.04)"
          />
        )}

        {/* 左侧藤蔓：从左上角生长，蜿蜒向右下，终点在中心偏左下 */}
        <path
          ref={leftPathRef}
          d="
            M 30 25
            C 110 90, 70 230, 150 330
            C 230 430, 190 570, 290 630
            C 390 690, 480 695, 575 712
          "
          fill="none"
          stroke="url(#vineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={leftLen}
          strokeDashoffset={leftLen * (1 - effectiveProgress)}
          style={{
            transition: 'stroke-dashoffset 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: timelineActive ? 'url(#vineGlow)' : 'none',
          }}
        />

        {/* 右侧藤蔓：从右下角生长，蜿蜒向左上，终点在中心偏右下，与左侧微微交汇 */}
        <path
          ref={rightPathRef}
          d="
            M 1170 875
            C 1080 810, 1120 660, 1040 560
            C 960 460, 1000 310, 900 270
            C 800 230, 820 380, 830 500
            C 840 620, 740 680, 625 708
          "
          fill="none"
          stroke="url(#vineGradRight)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={rightLen}
          strokeDashoffset={rightLen * (1 - effectiveProgress)}
          style={{
            transition: 'stroke-dashoffset 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: timelineActive ? 'url(#vineGlow)' : 'none',
          }}
        />

        {/* 左侧嫩芽（左上角起点，向下生长） */}
        <g transform="translate(30, 25)">
          <line x1="0" y1="0" x2={8 + effectiveProgress * 4} y2={10 + effectiveProgress * 5} stroke="#8fd060" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx={8 + effectiveProgress * 2} cy={4 + effectiveProgress * 1.5} rx="5" ry="3" fill="url(#leafGrad)" transform={`rotate(${45 + effectiveProgress * 8} ${8 + effectiveProgress * 2} ${4 + effectiveProgress * 1.5})`} style={{ transition: 'all 0.3s ease' }} />
          <ellipse cx={4 + effectiveProgress * 1.5} cy={10 + effectiveProgress * 2.5} rx="5" ry="3" fill="url(#leafGrad)" transform={`rotate(${-20 - effectiveProgress * 8} ${4 + effectiveProgress * 1.5} ${10 + effectiveProgress * 2.5})`} style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* 右侧嫩芽（右下角起点，向上生长） */}
        <g transform="translate(1170, 875)">
          <line x1="0" y1="0" x2={-8 - effectiveProgress * 4} y2={-10 - effectiveProgress * 5} stroke="#8fd060" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx={-8 - effectiveProgress * 2} cy={-4 - effectiveProgress * 1.5} rx="5" ry="3" fill="url(#leafGrad)" transform={`rotate(${-135 - effectiveProgress * 8} ${-8 - effectiveProgress * 2} ${-4 - effectiveProgress * 1.5})`} style={{ transition: 'all 0.3s ease' }} />
          <ellipse cx={-4 - effectiveProgress * 1.5} cy={-10 - effectiveProgress * 2.5} rx="5" ry="3" fill="url(#leafGrad)" transform={`rotate(${160 + effectiveProgress * 8} ${-4 - effectiveProgress * 1.5} ${-10 - effectiveProgress * 2.5})`} style={{ transition: 'all 0.3s ease' }} />
        </g>

        {/* 卷须 */}
        {renderTendrils()}

        {/* 左侧叶子 */}
        {renderLeaves(leftLeaves, 'left')}
        {/* 右侧叶子 */}
        {renderLeaves(rightLeaves, 'right')}

        {/* 顶部交汇处的花朵 */}
        {TOP_FLOWERS.map((f, i) => {
          const flowerProgress = Math.max(0, (effectiveProgress - 0.7 - f.delay) / 0.2)
          const scale = Math.min(1, flowerProgress * 1.5)
          const opacity = Math.min(1, flowerProgress * 2)
          return (
            <g
              key={`flower-${i}`}
              transform={`translate(${f.x}, ${f.y}) scale(${scale})`}
              style={{ transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
              opacity={opacity}
              filter="url(#softGlow)"
            >
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx="0" cy={-f.size * 0.75}
                  rx={f.size * 0.45}
                  ry={f.size * 0.78}
                  fill="url(#flowerGrad)"
                  transform={`rotate(${angle})`}
                  opacity="0.9"
                />
              ))}
              <circle cx="0" cy="0" r={f.size * 0.35} fill="url(#flowerCenter)" />
              <circle cx="0" cy="0" r={f.size * 0.15} fill="#8B6914" />
            </g>
          )
        })}

        {/* 时间线激活时的萤火虫 */}
        {timelineActive &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <circle
              key={`firefly-${i}`}
              cx={200 + (i * 160) % 800}
              cy={250 + (i * 90) % 400}
              r="1.8"
              fill="#ffe2a8"
              opacity="0.7"
              filter="url(#softGlow)"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.85;0.15"
                dur={`${1.8 + (i % 3) * 0.4}s`}
                repeatCount="indefinite"
                begin={`${i * 0.25}s`}
              />
              <animate
                attributeName="cy"
                values={`${250 + (i * 90) % 400};${235 + (i * 90) % 400};${250 + (i * 90) % 400}`}
                dur={`${2.5 + (i % 4) * 0.5}s`}
                repeatCount="indefinite"
                begin={`${i * 0.3}s`}
              />
            </circle>
          ))}
      </svg>
    </div>
  )
}
