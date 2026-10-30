import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEffectPlayer } from './effectPlayer.js'

const tracks = [{ key: 'dragon', url: '/dragon.mp3' }, { key: 'cheer', url: '/cheer.mp3' }]

function setup({ fetchError = false, decodeError = false, supported = true, contextError = false, fallbackError = false } = {}) {
  const requests = []
  const decoded = []
  const sources = []
  const gains = []
  const fallback = []
  const errors = []
  const ready = []
  const context = {
    state: 'suspended', destination: {}, closed: false, resumes: 0,
    async resume() { this.resumes++; this.state = 'running' },
    async close() { this.closed = true },
    async decodeAudioData(data) {
      if (decodeError) throw new Error('Unsupported codec')
      const buffer = { data }
      decoded.push(buffer)
      return buffer
    },
    createBufferSource() {
      const source = {
        connect() {}, disconnect() { this.disconnected = true },
        start() { this.started = true }, stop() { this.stopped = true },
      }
      sources.push(source)
      return source
    },
    createGain() {
      const gain = { gain: {}, connect() {}, disconnect() { this.disconnected = true } }
      gains.push(gain)
      return gain
    },
  }
  class AudioContext {
    constructor() {
      if (contextError) throw new Error('Audio device unavailable')
      return context
    }
  }
  class Audio {
    constructor(url) { this.src = url; fallback.push(this) }
    async play() { if (fallbackError) throw new Error('Playback blocked'); this.played = true }
    pause() { this.paused = true }
    removeAttribute() { this.src = '' }
    load() { this.released = true }
  }
  const player = createEffectPlayer(tracks, {
    AudioContext: supported ? AudioContext : null,
    Audio,
    onError: () => errors.push(true),
    onReady: () => ready.push(true),
    async fetch(url, options) {
      requests.push({ url, ...options })
      return { ok: !fetchError, status: fetchError ? 503 : 200, async arrayBuffer() { return url } }
    },
  })
  return { player, requests, decoded, sources, gains, fallback, context, errors, ready }
}

test('unlock resumes immediately and preloads every effect silently only once', async () => {
  const { player, context, requests, decoded, sources, fallback } = setup()
  const ready = player.preload()
  assert.equal(context.resumes, 1)
  await ready
  await player.preload()
  assert.deepEqual(requests.map(request => request.url), tracks.map(track => track.url))
  assert.equal(decoded.length, 2)
  assert.equal(sources.length, 0)
  assert.equal(fallback.length, 0)
})

test('play during preload and overlapping repeats share one decode and keep their own volume', async () => {
  const { player, requests, decoded, sources, gains } = setup()
  const ready = player.preload()
  await Promise.all([player.play('dragon', 0.25), player.play('dragon', 0.8), ready])
  await player.play('cheer', 0)
  assert.equal(requests.length, 2)
  assert.equal(decoded.length, 2)
  assert.equal(sources.length, 3)
  assert.equal(sources[0].buffer, sources[1].buffer)
  assert.ok(sources.every(source => source.started && !source.stopped))
  assert.deepEqual(gains.map(gain => gain.gain.value), [0.25, 0.8, 0])
  sources[0].onended()
  assert.ok(sources[0].disconnected && gains[0].disconnected)
  assert.ok(!sources[1].disconnected)
})

test('a fetch or decode failure falls back and retries on the next trigger', async () => {
  for (const options of [{ fetchError: true }, { decodeError: true }]) {
    const { player, requests, fallback } = setup(options)
    const results = await player.preload()
    assert.ok(results.every(result => result.status === 'rejected'))
    await player.play('dragon', 0.4)
    assert.equal(requests.length, 3)
    assert.equal(fallback[0].src, '/dragon.mp3')
    assert.equal(fallback[0].volume, 0.4)
    assert.ok(fallback[0].played)
    fallback[0].onerror()
    assert.ok(fallback[0].released)
    await player.play('dragon', 0.6)
    assert.equal(requests.length, 4)
    fallback[1].onended()
    assert.ok(fallback[1].released)
  }
})

test('browsers without a usable AudioContext retain HTML audio playback', async () => {
  for (const options of [{ supported: false }, { contextError: true }]) {
    const { player, requests, fallback } = setup(options)
    await player.preload()
    await player.play('cheer', 0.7)
    await player.play('unknown', 1)
    assert.equal(requests.length, 0)
    assert.equal(fallback.length, 1)
    assert.ok(fallback[0].played)
    player.dispose()
    assert.ok(fallback[0].released)
  }
})

test('cleanup stops active effects, disconnects nodes, closes the context and aborts requests', async () => {
  const { player, requests, context, sources, gains } = setup()
  await player.preload()
  await player.play('dragon', 1)
  player.dispose()
  assert.ok(requests.every(request => request.signal.aborted))
  assert.ok(sources[0].stopped && sources[0].disconnected && gains[0].disconnected)
  assert.ok(context.closed)
  await player.play('dragon', 1)
  await player.preload()
  assert.equal(sources.length, 1)
  assert.equal(requests.length, 2)
})

test('cleanup during loading prevents delayed playback', async () => {
  const { player, sources, fallback } = setup()
  const ready = player.preload()
  const playing = player.play('dragon', 1)
  player.dispose()
  await Promise.all([ready, playing])
  assert.equal(sources.length, 0)
  assert.equal(fallback.length, 0)
})

test('failed HTML audio playback is reported instead of silently discarded', async () => {
  const { player, errors, fallback } = setup({ supported: false, fallbackError: true })
  await player.preload()
  await player.play('dragon', 0.6)
  assert.equal(errors.length, 1)
  assert.ok(fallback[0].released)
})

test('an interrupted context can resume without replaying an old effect', async () => {
  const { player, context, sources, errors, ready } = setup()
  await player.preload()
  context.state = 'interrupted'
  context.onstatechange()
  assert.equal(errors.length, 1)
  await player.resume()
  assert.equal(context.state, 'running')
  assert.equal(context.resumes, 2)
  assert.equal(sources.length, 0)
  assert.ok(ready.length >= 2)
  player.dispose()
  await player.resume()
  assert.equal(context.resumes, 2)
})

test('failed context recovery stays visible and a later gesture can retry', async () => {
  const { player, context, errors } = setup()
  await player.preload()
  context.state = 'suspended'
  const original = context.resume
  context.resume = async () => { throw new Error('Needs user activation') }
  await player.resume()
  assert.equal(errors.length, 1)
  context.resume = original
  await player.resume()
  assert.equal(context.state, 'running')
})
