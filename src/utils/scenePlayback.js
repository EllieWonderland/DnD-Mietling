// Own one scene's media lifecycle, including retries made directly in a user gesture.
export function createScenePlayback(video, url, onStatus) {
  let active = true
  let attempt = 0
  let status = 'loading'

  function update(next) {
    if (!active) return
    status = next
    onStatus(next)
  }

  function play({ reload = false, rewind = false } = {}) {
    if (!active) return
    const currentAttempt = ++attempt
    update('loading')
    const failed = error => {
      if (!active || currentAttempt !== attempt) return
      update(error?.name === 'NotAllowedError' ? 'blocked' : 'error')
    }
    try {
      if (reload) {
        // Restore src here too: StrictMode cleanup releases the same element.
        video.src = url
        video.load()
      }
      if (rewind) video.currentTime = 0
      // Keep play() synchronous with the retry click to preserve user activation.
      Promise.resolve(video.play()).catch(failed)
    } catch (error) {
      failed(error)
    }
  }

  const listeners = {
    playing: () => { ++attempt; update('ready') },
    waiting: () => { if (status === 'ready') update('loading') },
    error: () => { ++attempt; update('error') },
    ended: () => play({ rewind: true }),
  }
  for (const [event, listener] of Object.entries(listeners)) {
    video.addEventListener(event, listener)
  }
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  play({ reload: true })

  return {
    retry() { play({ reload: status !== 'blocked' }) },
    dispose() {
      active = false
      ++attempt
      for (const [event, listener] of Object.entries(listeners)) {
        video.removeEventListener(event, listener)
      }
      // Release scarce TV decoder slots when leaving the scene.
      try {
        video.pause()
        video.removeAttribute('src')
        video.load()
      } catch { /* Some TV browsers throw while releasing an unavailable decoder. */ }
    },
  }
}
