import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createMusicPlayer } from './musicPlayer.js'

const first = { key: 'forest', url: '/forest.mp3' }
const second = { key: 'tavern', url: '/tavern.mp3' }
const flush = async () => { await Promise.resolve(); await Promise.resolve() }

function setup() {
  const audio = new EventTarget()
  const pending = []
  const statuses = []
  const timers = new Set()
  Object.assign(audio, {
    paused: true, volume: 1, loads: 0,
    load() { this.loads++ },
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')) },
    play() {
      this.paused = false
      return new Promise((resolve, reject) => pending.push({ resolve, reject, src: this.src }))
    },
    removeAttribute(name) { delete this[name] },
  })
  const player = createMusicPlayer(audio, status => statuses.push(status), {
    setInterval(callback) { timers.add(callback); return callback },
    clearInterval(callback) { timers.delete(callback) },
  })
  const tick = () => { for (let i = 0; i < 15; i++) for (const callback of [...timers]) callback() }
  return { audio, pending, statuses, timers, player, tick, emit: name => audio.dispatchEvent(new Event(name)) }
}

test('activation plays the actual music element synchronously and duplicate state does not restart it', async () => {
  const { player, audio, pending, statuses, tick } = setup()
  player.activate(first, 0.6)
  assert.equal(pending[0].src, first.url)
  assert.equal(audio.loop, true)
  assert.equal(audio.muted, false)
  player.setTrack(first, 0.6)
  assert.equal(pending.length, 1)
  pending[0].resolve()
  await flush()
  tick()
  assert.equal(statuses.at(-1), 'playing')
  assert.equal(audio.volume, 0.6)
})

test('activation before music selection primes the same element with valid silent audio', async () => {
  const { player, audio, pending } = setup()
  player.activate(undefined, 0.7)
  assert.match(pending[0].src, /^data:audio\/wav;base64,/)
  assert.equal(audio.volume, 0)
  pending[0].resolve()
  await flush()
  player.setTrack(first)
  // The silent sample may still be playing; finish its fade first.
  player.recover()
  assert.equal(pending.at(-1).src, first.url)
})

test('autoplay failure is visible and retry runs immediately on the same source', async () => {
  const { player, audio, pending, statuses } = setup()
  player.activate(first, 0.4)
  pending[0].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'blocked')
  player.resume()
  assert.equal(pending.length, 1)
  const loads = audio.loads
  player.recover()
  assert.equal(audio.loads, loads)
  assert.equal(pending.length, 2)
  pending[1].resolve()
  await flush()
  assert.equal(statuses.at(-1), 'playing')
  assert.equal(audio.volume, 0.4)
})

test('media errors invalidate old promises and retry reloads the failed source', async () => {
  const { player, audio, pending, statuses, emit } = setup()
  player.activate(first, 0.5)
  emit('error')
  pending[0].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'error')
  player.recover()
  assert.equal(audio.loads, 2)
  assert.equal(pending[1].src, first.url)
})

test('standby pause is reported and resumed without reloading or restarting healthy music', async () => {
  const { player, audio, pending, statuses, tick } = setup()
  player.activate(first, 0.5)
  pending[0].resolve()
  await flush()
  tick()
  player.resume()
  assert.equal(pending.length, 1)
  audio.pause()
  assert.equal(statuses.at(-1), 'interrupted')
  player.resume()
  assert.equal(pending.length, 2)
  assert.equal(audio.loads, 1)
})

test('latest track wins during rapid changes, and stop releases a failed paused stream', async () => {
  const { player, audio, pending, statuses, tick } = setup()
  player.activate(first, 0.5)
  pending[0].resolve()
  await flush()
  tick()
  player.setTrack(second)
  player.setTrack(first)
  tick()
  assert.equal(pending.at(-1).src, first.url)
  pending.at(-1).reject(new Error('Network lost'))
  await flush()
  audio.pause()
  player.setTrack(null)
  assert.equal(audio.src, undefined)
  assert.equal(statuses.at(-1), 'idle')
})

test('volume changes during fades survive the transition, including mute', async () => {
  const { player, audio, pending, tick } = setup()
  player.activate(first, 0.6)
  pending[0].resolve()
  await flush()
  player.setVolume(0.2)
  tick()
  assert.equal(audio.volume, 0.2)
  player.setTrack(second)
  player.setVolume(0)
  tick()
  pending.at(-1).resolve()
  await flush()
  tick()
  assert.equal(audio.volume, 0)
})

test('loop fallback and buffering report playback state', async () => {
  const { player, audio, pending, statuses, emit, tick } = setup()
  player.activate(first, 0.5)
  pending[0].resolve()
  await flush()
  tick()
  emit('waiting')
  assert.equal(statuses.at(-1), 'loading')
  emit('playing')
  emit('ended')
  assert.equal(audio.currentTime, 0)
  assert.equal(pending.length, 2)
  pending[1].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'blocked')
})

test('cleanup cancels fades, releases the element, and ignores stale playback', async () => {
  const { player, audio, pending, statuses, timers, emit } = setup()
  player.activate(first, 0.5)
  player.setTrack(second)
  player.dispose()
  const previous = [...statuses]
  pending[0].reject(new Error('Old request'))
  emit('error')
  player.resume()
  player.recover()
  await flush()
  assert.equal(timers.size, 0)
  assert.equal(audio.src, undefined)
  assert.equal(audio.paused, true)
  assert.deepEqual(statuses, previous)
})

test('synchronous failures and older TVs without play promises remain supported', async () => {
  const { player, audio, statuses, tick } = setup()
  audio.play = () => { throw new Error('Audio unavailable') }
  player.activate(first, 0.7)
  assert.equal(statuses.at(-1), 'error')
  audio.play = () => undefined
  player.recover()
  await flush()
  tick()
  assert.equal(statuses.at(-1), 'playing')
  assert.equal(audio.volume, 0.7)
})
