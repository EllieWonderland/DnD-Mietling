import { useState, useRef, useEffect } from 'react'
import { EFFECT_TRACKS } from './soundboardData.jsx'
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

export default function AmbienceScene({ scene, onPlayEffect, onBack, displayOnly = false }) {
  const [videoStatus, setVideoStatus] = useState('loading')
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
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
          src={scene.url}
          autoPlay
          loop
          muted={!scene.hasAudio}
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

      {!displayOnly && (
        <div className="ambience-controls">
          <button className="ambience-back" onClick={onBack}>
            Zurück zur Startseite
          </button>

          <div className="ambience-effects" aria-label="Effekte">
            {EFFECT_TRACKS.map(track => (
              <button
                key={track.key}
                className="ambience-effect-btn"
                onClick={() => onPlayEffect(track)}
                title={track.label}
                aria-label={track.label}
              >
                <track.Icon />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
