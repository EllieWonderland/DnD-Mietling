import { useEffect, useRef } from 'react'
import orchestralWin from '../orchestral_win.mp3'
import './VictoryOverlay.css'

export default function VictoryOverlay({ onClose, muted = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 180 }, () => createParticle(canvas))
    let animId

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.y += p.vy
        p.x += p.vx
        p.vy += 0.12
        p.life -= p.decay
        p.rotation += p.rotSpeed

        if (p.life <= 0) particles[i] = createParticle(canvas)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5)
        ctx.restore()
      })
      animId = requestAnimationFrame(animate)
    }

    animate()

    let audio = null
    if (!muted) {
      audio = new Audio(orchestralWin)
      audio.play().catch(() => {})
    }

    return () => {
      cancelAnimationFrame(animId)
      if (audio) audio.pause()
    }
  }, [])

  return (
    <div className="victory-overlay" onClick={onClose}>
      <canvas ref={canvasRef} className="victory-canvas" />
      <div className="victory-content">
        <div className="victory-text">VICTORY</div>
        <div className="victory-sub">Der Kampf ist gewonnen!</div>
        <button className="victory-btn" onClick={onClose}>Weiter</button>
      </div>
    </div>
  )
}

function createParticle(canvas) {
  const colors = ['#c9a227', '#e8c547', '#ffdf80', '#fff0a0', '#f0c040', '#ffffff', '#ffd700']
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.5 - 50,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * -6 - 2,
    size: Math.random() * 10 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
    decay: Math.random() * 0.008 + 0.004,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
  }
}

