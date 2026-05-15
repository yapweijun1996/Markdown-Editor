import { useEffect, useRef, useState } from 'react'
import { LASER_COLOR_HEX, LASER_SIZE_PX } from '../preferences/defaults.js'

// Red/green/blue/yellow laser pointer that follows the mouse while `active`.
// Crisp dot via DOM (transform: translate3d). Optional fading trail via canvas.
export function LaserPointer({ active, color = 'red', size = 'md', trail = true }) {
  const colorHex = LASER_COLOR_HEX[color] || LASER_COLOR_HEX.red
  const sizePx = LASER_SIZE_PX[size] || LASER_SIZE_PX.md

  const [pos, setPos] = useState({ x: -1000, y: -1000, visible: false })
  const posRef = useRef(pos)
  const canvasRef = useRef(null)

  // Mouse position tracking. React 18 auto-batches setState, and mousemove
  // already throttles to the screen refresh rate, so we update directly.
  useEffect(() => {
    if (!active) {
      const hidden = { ...posRef.current, visible: false }
      posRef.current = hidden
      setPos(hidden)
      return
    }

    function onMove(e) {
      const next = { x: e.clientX, y: e.clientY, visible: true }
      posRef.current = next
      setPos(next)
    }
    function onLeave() {
      const hidden = { ...posRef.current, visible: false }
      posRef.current = hidden
      setPos(hidden)
    }
    function onEnter() {
      const shown = { ...posRef.current, visible: true }
      posRef.current = shown
      setPos(shown)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [active])

  // Trail rendering loop on canvas — fade + draw current point each frame
  useEffect(() => {
    if (!active || !trail) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    function loop() {
      // Fade existing trail
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.restore()

      // Draw current dot as a soft glow
      const p = posRef.current
      if (p.visible) {
        const r = sizePx * 0.9
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        grad.addColorStop(0, colorHex + 'cc')
        grad.addColorStop(0.5, colorHex + '66')
        grad.addColorStop(1, colorHex + '00')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active, trail, colorHex, sizePx])

  if (!active) return null

  const dotStyle = {
    width: `${sizePx}px`,
    height: `${sizePx}px`,
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
    background: `radial-gradient(circle, #ffffff 0%, ${colorHex} 45%, ${colorHex}00 75%)`,
    boxShadow: `0 0 ${sizePx * 0.4}px ${sizePx * 0.15}px ${colorHex}d9, 0 0 ${sizePx * 1.2}px ${sizePx * 0.4}px ${colorHex}88`,
  }

  return (
    <>
      {trail && <canvas ref={canvasRef} className="laser-trail" aria-hidden="true" />}
      <div
        className={`laser-pointer${pos.visible ? '' : ' laser-pointer-hidden'}`}
        style={dotStyle}
        aria-hidden="true"
      />
    </>
  )
}
