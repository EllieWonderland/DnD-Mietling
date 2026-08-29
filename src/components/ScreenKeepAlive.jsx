import { useEffect, useRef } from 'react'

// Keeps the TV out of standby.
//
// This used to also render a tiny looping <video> as a fallback for TV browsers
// without the Wake Lock API. That clip was a truncated 57-byte MP4 with no moov
// atom, so it could never decode - it only ever fired an error. Worse, an
// always-mounted video element occupies one of the very few decoder slots a TV
// browser has, competing with the ambience scene. Wake Lock only from here on.
export default function ScreenKeepAlive({ enabled = true }) {
  const wakeLockRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    let isMounted = true

    async function requestWakeLock() {
      if (!('wakeLock' in navigator) || !navigator.wakeLock?.request) return
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
      } catch {
        // Wake lock may fail due to low battery or browser permissions
        wakeLockRef.current = null
      }
    }

    requestWakeLock()

    // Re-acquire the lock when the window becomes visible or regains focus
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') requestWakeLock()
    }

    // Periodic check so the lock stays active (every 30s)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock()
      }
    }, 30000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

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

  return null
}
