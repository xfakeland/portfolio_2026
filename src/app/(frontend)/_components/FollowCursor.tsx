'use client'

import { useEffect } from 'react'

type Props = {
  color?: string
  radius?: number
  lag?: number
  zIndex?: number
}

export function FollowCursor({
  color = 'rgba(255, 255, 255, 0.65)',
  radius = 10,
  lag = 10,
  zIndex,
}: Props = {}) {
  useEffect(() => {
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let raf = 0
    let width = window.innerWidth
    let height = window.innerHeight
    const cursor = { x: width / 2, y: height / 2 }
    const dot = { x: width / 2, y: height / 2 }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const onMove = (e: MouseEvent) => {
      cursor.x = e.clientX
      cursor.y = e.clientY
    }

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      if (canvas) {
        canvas.width = width
        canvas.height = height
      }
    }

    const tick = () => {
      if (ctx) {
        ctx.clearRect(0, 0, width, height)
        dot.x += (cursor.x - dot.x) / lag
        dot.y += (cursor.y - dot.y) / lag
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
      }
      raf = requestAnimationFrame(tick)
    }

    const init = () => {
      if (reduced.matches) return
      canvas = document.createElement('canvas')
      ctx = canvas.getContext('2d')
      canvas.style.position = 'fixed'
      canvas.style.inset = '0'
      canvas.style.pointerEvents = 'none'
      canvas.width = width
      canvas.height = height
      if (zIndex !== undefined) canvas.style.zIndex = String(zIndex)
      document.body.appendChild(canvas)
      window.addEventListener('mousemove', onMove, { passive: true })
      window.addEventListener('resize', onResize)
      raf = requestAnimationFrame(tick)
    }

    const destroy = () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      if (canvas) canvas.remove()
      canvas = null
      ctx = null
    }

    const onReducedChange = () => {
      destroy()
      if (!reduced.matches) init()
    }

    reduced.addEventListener('change', onReducedChange)
    init()

    return () => {
      reduced.removeEventListener('change', onReducedChange)
      destroy()
    }
  }, [color, radius, lag, zIndex])

  return null
}
