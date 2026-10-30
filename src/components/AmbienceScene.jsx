import { useState, useRef, useEffect } from 'react'
import { createScenePlayback } from '../utils/scenePlayback.js'
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

// A new scene owns fresh status and callbacks, even after a previous failure.
export default function AmbienceScene({ scene, fit = 'contain' }) {
  if (!scene) return null
  return <Scene key={JSON.stringify([scene.key, scene.url])} scene={scene} fit={fit} />
}

function Scene({ scene, fit }) {
  const [videoStatus, setVideoStatus] = useState('loading')
  const videoRef = useRef(null)
  const playbackRef = useRef(null)

  useEffect(() => {
    const playback = createScenePlayback(videoRef.current, scene.url, setVideoStatus)
    playbackRef.current = playback
    return () => {
      playbackRef.current = null
      playback.dispose()
    }
  }, [scene.url])

  const poster = makePoster(scene.label)

  return (
    <div className="ambience-scene" role="dialog" aria-label={`Szene ${scene.label}`}>
      <div className="ambience-stage">
        <video
          ref={videoRef}
          className="ambience-video"
          style={{ objectFit: fit }}
          loop
          muted
          playsInline
          preload="auto"
          poster={poster}
        />

        {videoStatus !== 'ready' && (
          <div className="ambience-fallback">
            <div className="ambience-fallback-panel">
              <div role="status" aria-live="polite">
                <strong>{scene.label}</strong>
                <span>
                  {videoStatus === 'blocked'
                    ? 'Der Browser hat die automatische Wiedergabe blockiert.'
                    : videoStatus === 'error'
                      ? 'Video konnte nicht geladen oder abgespielt werden. Der statische Hintergrund bleibt sichtbar.'
                      : 'Video wird geladen.'}
                </span>
              </div>
              {(videoStatus === 'blocked' || videoStatus === 'error') && (
                <button className="ambience-retry" type="button" onClick={() => playbackRef.current?.retry()}>
                  {videoStatus === 'blocked' ? 'Video starten' : 'Erneut laden'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="ambience-overlay" />
    </div>
  )
}
