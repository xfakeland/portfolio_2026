'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MAX_OFFSET = 12 // px, distance max de translation
const EASING = 0.08 // 0..1, plus petit = plus mou

export function Hero() {
  const router = useRouter()
  const imgRef = useRef<HTMLImageElement | null>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)

  // Parallaxe à la souris (lissé via rAF, sans re-render React)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1 // -1 → 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      target.current.x = nx * MAX_OFFSET
      target.current.y = ny * MAX_OFFSET
    }
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * EASING
      current.current.y += (target.current.y - current.current.y) * EASING
      if (imgRef.current) {
        imgRef.current.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`
      }
      rafId.current = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    rafId.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={imgRef}
      src="/home-hero.webp"
      alt="Thibault Grall"
      className="home__hero"
      draggable={false}
      style={{ cursor: 'pointer' }}
      onClick={() => router.push('/work')}
      onDoubleClick={() => router.push('/admin')}
    />
  )
}
