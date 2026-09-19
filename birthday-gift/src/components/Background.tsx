import { useEffect, useRef } from 'react'

/**
 * 暗色星空背景 + 轻微鼠标视差。
 * 滚动到不同章节时，背景色调轻微变化（由父级通过 CSS 变量或类名控制，此处提供基础层）。
 */
export default function Background() {
  const starsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      tx = x * 12
      ty = y * 12
    }

    const loop = () => {
      cx += (tx - cx) * 0.05
      cy += (ty - cy) * 0.05
      if (starsRef.current) {
        starsRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="starry-bg" />
      <div ref={starsRef} className="stars will-change-transform" />
      {/* 流星 */}
      <div className="shooting-star" style={{ top: '15%', left: '80%', animationDelay: '0s' }} />
      <div
        className="shooting-star"
        style={{ top: '40%', left: '60%', animationDelay: '2.5s' }}
      />
    </>
  )
}
