import { useEffect, useRef } from 'react'
import defeatOutro from '../defeat_outro.mp3'
import './DefeatOverlay.css'

export default function DefeatOverlay({ onClose, muted = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 150 }, () => createParticle(canvas))
    let animId

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.y += p.vy
        p.x += p.vx
        p.vy -= 0.04
        p.life -= p.decay
        p.size *= 0.998

        if (p.life <= 0 || p.size < 0.5) particles[i] = createParticle(canvas)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
      animId = requestAnimationFrame(animate)
    }

    animate()

    let audio = null
    if (!muted) {
      audio = new Audio(defeatOutro)
      audio.play().catch(() => {})
    }

    return () => {
      cancelAnimationFrame(animId)
      if (audio) audio.pause()
    }
  }, [])

  return (
    <div className="defeat-overlay" onClick={onClose}>
      <canvas ref={canvasRef} className="defeat-canvas" />
      <div className="defeat-content">
        <div className="defeat-text">NIEDERLAGE</div>
        <div className="defeat-sub">Die Gruppe ist gefallen...</div>
        <button className="defeat-btn" onClick={onClose}>Neu starten</button>
      </div>
    </div>
  )
}

function createParticle(canvas) {
  const colors = ['#8b0000', '#b22222', '#cc2200', '#3a0a0a', '#660000', '#ff2200']
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 10,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(Math.random() * 2.5 + 0.8),
    size: Math.random() * 6 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
    decay: Math.random() * 0.005 + 0.002,
  }
}
