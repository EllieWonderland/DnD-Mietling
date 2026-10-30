// Keep decoded one-shot effects for this TV session. Each playback gets its
// own source/gain, so repeated and overlapping effects share only the buffer.
export function createEffectPlayer(tracks, {
  AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext,
  Audio = globalThis.Audio,
  fetch = globalThis.fetch,
  onError = () => {},
  onReady = () => {},
} = {}) {
  const urls = new Map(tracks.map(track => [track.key, track.url]))
  const buffers = new Map()
  const active = new Set()
  const requests = new AbortController()
  let context = null
  let disposed = false

  function load(key) {
    if (!buffers.has(key)) {
      const pending = (async () => {
        const response = await fetch(urls.get(key), { signal: requests.signal })
        if (!response.ok) throw new Error(`Effect request failed: ${response.status}`)
        const data = await response.arrayBuffer()
        return context.decodeAudioData(data)
      })()
      buffers.set(key, pending)
      // A failed preload must not prevent a later playback from retrying.
      pending.catch(() => { if (buffers.get(key) === pending) buffers.delete(key) })
    }
    return buffers.get(key)
  }

  async function resume() {
    if (!context || disposed || context.state === 'running') return Promise.resolve()
    await context.resume()
    if (disposed) return
    if (context.state !== 'running') throw new Error('Audio context is not running')
    onReady()
  }

  function playFallback(key, volume) {
    if (disposed) return
    const audio = new Audio(urls.get(key))
    audio.volume = volume
    const release = () => {
      active.delete(stop)
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    const stop = release
    active.add(stop)
    audio.onended = release
    const failed = () => { release(); if (!disposed) onError() }
    audio.onerror = failed
    try {
      return Promise.resolve(audio.play()).then(() => { if (!disposed) onReady() }).catch(failed)
    } catch {
      failed()
    }
  }

  return {
    // Called directly by "Ton aktivieren", so resume retains the user gesture.
    // Loading stays in the background and never blocks music or the TV view.
    preload() {
      if (disposed) return Promise.resolve([])
      if (!context && AudioContext) {
        try {
          context = new AudioContext()
          context.onstatechange = () => {
            if (!disposed && ['suspended', 'interrupted', 'closed'].includes(context.state)) onError()
          }
        } catch { /* HTML audio fallback */ }
      }
      if (!context) return Promise.resolve([])
      resume().catch(() => { if (!disposed) onError() })
      return Promise.allSettled([...urls.keys()].map(load))
    },

    resume() {
      return resume().catch(() => { if (!disposed) onError() })
    },

    async play(key, volume) {
      if (disposed || !urls.has(key)) return
      if (!context) return playFallback(key, volume)
      try {
        // An effect triggered during preload shares the pending decode.
        const [buffer] = await Promise.all([load(key), resume()])
        if (disposed) return
        const source = context.createBufferSource()
        const gain = context.createGain()
        source.buffer = buffer
        gain.gain.value = volume
        source.connect(gain)
        gain.connect(context.destination)
        const release = () => {
          active.delete(stop)
          source.onended = null
          source.disconnect()
          gain.disconnect()
        }
        const stop = () => { source.stop(); release() }
        active.add(stop)
        source.onended = release
        source.start()
        onReady()
      } catch {
        return playFallback(key, volume)
      }
    },

    dispose() {
      disposed = true
      requests.abort()
      for (const stop of active) stop()
      active.clear()
      buffers.clear()
      if (context) {
        context.onstatechange = null
        context.close().catch(() => {})
      }
    },
  }
}
