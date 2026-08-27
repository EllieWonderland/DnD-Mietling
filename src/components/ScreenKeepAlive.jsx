import { useEffect, useRef } from 'react'

// Tiny 1x1 black 1-second muted MP4 base64 data URI
const SILENT_VIDEO_URI = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAptZGF0AAAAAAABAAAA'

export default function ScreenKeepAlive({ enabled = true }) {
  const wakeLockRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    let isMounted = true

    // 1. Screen Wake Lock API (Chrome, Edge, modern WebKit)
    async function requestWakeLock() {
      if ('wakeLock' in navigator && navigator.wakeLock?.request) {
        try {
          if (wakeLockRef.current !== null) return
          const lock = await navigator.wakeLock.request('screen')
          if (!isMounted) {
            lock.release()
            return
          }
          wakeLockRef.current = lock
          lock.addEventListener('release', () => {
            wakeLockRef.current = null
          })
        } catch (err) {
          // Wake lock may fail due to low battery or browser permissions
          wakeLockRef.current = null
        }
      }
    }

    requestWakeLock()

    // Re-acquire wake lock when window becomes visible or receives focus
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {})
        }
      }
    }

    // Periodic check to ensure lock stays active (every 30s)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock()
      }
    }, 30000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    // 2. Video Keep-Alive for TV browsers (LG webOS, Samsung Tizen, Silk, etc.)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }

    return () => {
      isMounted = false
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      loop
      autoPlay
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '1px',
        height: '1px',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <source src={SILENT_VIDEO_URI} type="video/mp4" />
    </video>
  )
}
