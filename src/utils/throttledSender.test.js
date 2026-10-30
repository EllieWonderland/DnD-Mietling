import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createThrottledSender } from './throttledSender.js'

function setup(t) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 })
  let volume = 0.72
  const sent = []
  const sender = createThrottledSender(() => sent.push({ at: Date.now(), volume }))
  return { sender, sent, setVolume: value => { volume = value } }
}

test('a rapid drag stays below the relay limit and sends the final value within 100 ms', t => {
  const { sender, sent, setVolume } = setup(t)
  sender.flush()
  // 500 input events per second, well above the relay's 60 messages/s limit.
  for (let i = 1; i <= 500; i++) {
    t.mock.timers.tick(2)
    setVolume(i / 500)
    sender.schedule()
  }
  t.mock.timers.tick(100)
  assert.equal(sent.length, 12)
  assert.equal(sent.at(-1).volume, 1)
  assert.equal(sent.at(-1).at, 2100)
  for (let i = 1; i < sent.length; i++) {
    assert.ok(sent[i].at - sent[i - 1].at >= 100)
  }
})

test('the trailing send uses the latest value without further input or a heartbeat', t => {
  const { sender, sent, setVolume } = setup(t)
  sender.schedule()
  t.mock.timers.tick(20)
  setVolume(0.3)
  sender.schedule()
  t.mock.timers.tick(20)
  setVolume(0)
  sender.schedule()
  t.mock.timers.tick(59)
  assert.equal(sent.length, 1)
  t.mock.timers.tick(1)
  assert.deepEqual(sent.at(-1), { at: 1100, volume: 0 })
  t.mock.timers.tick(4000)
  assert.equal(sent.length, 2)
})

test('an immediate action includes the latest volume and replaces the queued send', t => {
  const { sender, sent, setVolume } = setup(t)
  sender.flush()
  t.mock.timers.tick(20)
  setVolume(0.4)
  sender.schedule()
  t.mock.timers.tick(20)
  sender.flush()
  assert.deepEqual(sent.at(-1), { at: 1040, volume: 0.4 })
  t.mock.timers.tick(60)
  assert.equal(sent.length, 2)
  setVolume(0.9)
  sender.schedule()
  t.mock.timers.tick(40)
  assert.deepEqual(sent.at(-1), { at: 1140, volume: 0.9 })
})

test('cleanup cancels pending work and permits reuse after effect setup', t => {
  const { sender, sent } = setup(t)
  sender.flush()
  sender.schedule()
  sender.cancel()
  t.mock.timers.tick(100)
  assert.equal(sent.length, 1)
  sender.schedule()
  assert.equal(sent.length, 2)
})
