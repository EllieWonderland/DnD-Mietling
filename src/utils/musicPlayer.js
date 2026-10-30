// One element owns music for the entire display session, including activation.
const SILENCE = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='

export function createMusicPlayer(audio, onStatus, {
  setInterval = globalThis.setInterval,
  clearInterval = globalThis.clearInterval,
} = {}) {
  let track = null
  let volume = 0.72
  let fade = null
  let generation = 0
  let disposed = false
  let status = 'idle'
  let loadedUrl = null

  function update(next) {
    if (disposed) return
    status = next
    onStatus(next)
  }

  function cancelFade() {
    if (fade !== null) clearInterval(fade)
    fade = null
  }

  function fadeTo(target, done) {
    cancelFade()
    const start = audio.volume
    let step = 0
    fade = setInterval(() => {
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * (++step / 15)))
      if (step >= 15) {
        cancelFade()
        done?.()
      }
    }, 40)
  }

  function play({ reload = false, prime = false } = {}) {
    const attempt = ++generation
    if (!prime) update('loading')
    try {
      if (reload) {
        audio.pause()
        audio.src = prime ? SILENCE : track.url
        loadedUrl = prime ? null : track.url
        audio.load()
      }
      audio.loop = !prime
      audio.muted = false
      audio.volume = prime || reload ? 0 : volume
      // Must run before returning to React, directly inside the activation click.
      Promise.resolve(audio.play()).then(() => {
        if (disposed || attempt !== generation) return
        if (!prime) {
          update('playing')
          if (reload) fadeTo(volume, () => { audio.volume = volume })
        }
      }).catch(error => {
        if (disposed || attempt !== generation) return
        cancelFade()
        update(error?.name === 'NotAllowedError' ? 'blocked' : 'error')
      })
    } catch (error) {
      if (!disposed && attempt === generation) update(error?.name === 'NotAllowedError' ? 'blocked' : 'error')
    }
  }

  const listeners = {
    playing: () => { if (track) update('playing') },
    pause: () => { if (track && fade === null && status === 'playing') update('interrupted') },
    waiting: () => { if (track && status === 'playing') update('loading') },
    stalled: () => { if (track && status === 'playing') update('loading') },
    error: () => {
      ++generation
      cancelFade()
      update('error')
    },
    // Some TV browsers stop at the loop boundary despite loop=true.
    ended: () => { if (track) { audio.currentTime = 0; play() } },
  }
  for (const [event, listener] of Object.entries(listeners)) audio.addEventListener(event, listener)

  return {
    setTrack(next, nextVolume = volume, { immediate = false } = {}) {
      if (disposed) return
      volume = nextVolume
      if (track?.key === next?.key && !immediate) return
      ++generation
      cancelFade()
      track = next ?? null
      const start = () => {
        if (track) play({ reload: true })
        else {
          audio.pause()
          audio.removeAttribute('src')
          loadedUrl = null
          audio.load()
          update('idle')
        }
      }
      if (!immediate && audio.src && !audio.paused) fadeTo(0, start)
      else start()
    },
    setVolume(next) {
      volume = next
      if (fade === null) audio.volume = volume
    },
    activate(next, nextVolume) {
      if (disposed) return
      this.setTrack(next, nextVolume, { immediate: true })
      // Unlock this same element even if the controller has not selected music.
      if (!track) play({ reload: true, prime: true })
    },
    recover() {
      if (disposed || !track) return
      cancelFade()
      play({ reload: loadedUrl !== track.url || !!audio.error || status === 'error' })
    },
    resume() {
      if (disposed || !track || status === 'blocked' || status === 'error' || fade !== null) return
      if (audio.paused || audio.ended) this.recover()
    },
    dispose() {
      disposed = true
      ++generation
      cancelFade()
      for (const [event, listener] of Object.entries(listeners)) audio.removeEventListener(event, listener)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    },
  }
}
