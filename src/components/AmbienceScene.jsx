import { useState, useRef, useEffect } from 'react'
import './AmbienceScene.css'

function makePoster(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1410" />
          <stop offset="50%" stop-color="#3b2a1a" />
          <stop offset="100%" stop-color="#140f0d" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="62%" r="55%">
          <stop offset="0%" stop-color="#c9a227" stop-opacity="0.42" />
          <stop offset="55%" stop-color="#c9a227" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#c9a227" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)" />
      <rect width="1600" height="900" fill="url(#glow)" />
      <circle cx="1220" cy="210" r="210" fill="#7a1a1a" fill-opacity="0.18" />
      <circle cx="380" cy="720" r="260" fill="#c9a227" fill-opacity="0.08" />
      <text x="800" y="490" text-anchor="middle" fill="#e8dcc8" font-family="Montserrat, Arial, sans-serif" font-size="72" font-weight="700" letter-spacing="6">${label.toUpperCase()}</text>
      <text x="800" y="565" text-anchor="middle" fill="#c9a227" font-family="Montserrat, Arial, sans-serif" font-size="28" letter-spacing="3">AMBIENT SCENE</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// Only the TV renders a scene — the controller just shows in the soundboard
// that one is live. The component therefore has no controls of its own.
export default function AmbienceScene({ scene, fit = 'contain' }) {
  const [videoStatus, setVideoStatus] = useState('loading')
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    video.defaultMuted = true
    video.play().catch(() => {})

    return () => {
      // Release the video before React detaches it. TV browsers have very few
      // decoder slots and can keep a detached element playing, which is what
      // blocked the switch into the combat screen.
      try {
        video.pause()
        video.removeAttribute('src')
        video.load()
      } catch { /* ignore */ }
    }
  }, [scene?.key])

  if (!scene) return null

  const poster = makePoster(scene.label)

  return (
    <div className="ambience-scene" role="dialog" aria-label={`Szene ${scene.label}`}>
      <div className="ambience-stage">
        <video
          ref={videoRef}
          key={scene.key}
          className="ambience-video"
          style={{ objectFit: fit }}
          src={scene.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={poster}
          onPlaying={() => setVideoStatus('ready')}
          onError={() => setVideoStatus('error')}
          onEnded={e => { e.target.currentTime = 0; e.target.play().catch(() => {}) }}
        />

        {videoStatus !== 'ready' && (
          <div className={`ambience-fallback ${videoStatus === 'error' ? 'is-error' : ''}`}>
            <div className="ambience-fallback-panel">
              <strong>{scene.label}</strong>
              {videoStatus === 'error' ? (
                <span>Video konnte nicht geladen werden. Es wird ein statischer Hintergrund angezeigt.</span>
              ) : (
                <span>Video wird geladen.</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="ambience-overlay" />
    </div>
  )
}
