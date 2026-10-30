import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createScenePlayback } from './scenePlayback.js'

function setup() {
  const video = new EventTarget()
  const pending = []
  const statuses = []
  video.loads = 0
  video.pauses = 0
  video.currentTime = 10
  video.load = () => { video.loads++ }
  video.pause = () => { video.pauses++ }
  video.removeAttribute = name => { delete video[name] }
  video.play = () => new Promise((resolve, reject) => { pending.push({ resolve, reject }) })
  const playback = createScenePlayback(video, '/forest.mp4', status => statuses.push(status))
  return { video, pending, statuses, playback, emit: name => video.dispatchEvent(new Event(name)) }
}

const flush = () => Promise.resolve()

test('scene starts muted, stays loading until playing, and reports buffering', () => {
  const { video, pending, statuses, emit } = setup()
  assert.equal(video.src, '/forest.mp4')
  assert.ok(video.muted && video.defaultMuted && video.playsInline)
  assert.equal(video.loads, 1)
  assert.equal(pending.length, 1)
  assert.deepEqual(statuses, ['loading'])
  emit('playing')
  emit('waiting')
  emit('playing')
  assert.deepEqual(statuses, ['loading', 'ready', 'loading', 'ready'])
})

test('blocked autoplay is visible and retry plays immediately without reloading', async () => {
  const { video, pending, statuses, playback, emit } = setup()
  pending[0].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'blocked')
  emit('waiting')
  assert.equal(statuses.at(-1), 'blocked')
  playback.retry()
  assert.equal(pending.length, 2)
  assert.equal(video.loads, 1)
  assert.equal(statuses.at(-1), 'loading')
  pending[1].resolve()
  await flush()
  assert.equal(statuses.at(-1), 'loading')
  emit('playing')
  assert.equal(statuses.at(-1), 'ready')
})

test('load and playback errors allow reload and recovery', async () => {
  const { video, pending, statuses, playback, emit } = setup()
  emit('error')
  assert.equal(statuses.at(-1), 'error')
  // An older rejected play promise must not replace a media error with blocked.
  pending[0].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'error')
  playback.retry()
  assert.equal(video.loads, 2)
  assert.equal(statuses.at(-1), 'loading')
  pending[1].reject(new Error('Decoder failed'))
  await flush()
  assert.equal(statuses.at(-1), 'error')
  playback.retry()
  assert.equal(video.loads, 3)
  emit('playing')
  assert.equal(statuses.at(-1), 'ready')
})

test('synchronous playback failures are also recoverable', () => {
  const { video, playback, statuses } = setup()
  video.play = () => { throw new Error('Decoder unavailable') }
  playback.retry()
  assert.equal(statuses.at(-1), 'error')
  video.play = () => undefined // Older TV browsers do not return a promise.
  playback.retry()
  assert.equal(statuses.at(-1), 'loading')
})

test('loop fallback handles a rejected restart instead of hiding it', async () => {
  const { video, pending, statuses, emit } = setup()
  emit('playing')
  emit('ended')
  assert.equal(video.currentTime, 0)
  assert.equal(video.loads, 1)
  assert.equal(pending.length, 2)
  pending[1].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'blocked')
})

test('late failures from a replaced attempt cannot corrupt a retry', async () => {
  const { pending, statuses, playback, emit } = setup()
  playback.retry()
  pending[0].reject({ name: 'NotAllowedError' })
  await flush()
  assert.equal(statuses.at(-1), 'loading')
  emit('playing')
  pending[1].reject(new Error('Late failure'))
  await flush()
  assert.equal(statuses.at(-1), 'ready')
})

test('scene switch releases decoder and ignores old events and promises', async () => {
  const old = setup()
  old.emit('playing')
  old.playback.dispose()
  assert.equal(old.video.pauses, 1)
  assert.equal(old.video.src, undefined)
  assert.equal(old.video.loads, 2)
  const next = setup()
  assert.deepEqual(next.statuses, ['loading'])
  old.pending[0].reject(new Error('Playback aborted by scene switch'))
  old.emit('error')
  old.emit('playing')
  old.emit('ended')
  old.playback.retry()
  await flush()
  assert.deepEqual(old.statuses, ['loading', 'ready'])
  assert.equal(old.pending.length, 1)
  assert.deepEqual(next.statuses, ['loading'])
})

test('StrictMode effect replay restores the source on the same element', async () => {
  const { video, playback, pending, statuses } = setup()
  playback.dispose()
  const replayStatuses = []
  const replay = createScenePlayback(video, '/forest.mp4', status => replayStatuses.push(status))
  assert.equal(video.src, '/forest.mp4')
  assert.equal(video.loads, 3)
  pending[0].reject({ name: 'AbortError' })
  await flush()
  assert.deepEqual(statuses, ['loading'])
  assert.deepEqual(replayStatuses, ['loading'])
  video.dispatchEvent(new Event('playing'))
  assert.deepEqual(replayStatuses, ['loading', 'ready'])
  replay.dispose()
})
