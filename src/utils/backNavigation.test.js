import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBackNavigation } from './backNavigation.js'

// History traversal is asynchronous, unlike pushState. Keep the event queued
// separately so tests can mount a replacement while cleanup is still pending.
function setup() {
  const entries = [{ existing: 'preserved' }]
  const events = []
  let index = 0
  let listener
  const browser = {
    history: {
      get state() { return entries[index] },
      pushState(state) {
        entries.splice(index + 1, Infinity, state)
        index++
      },
      back() {
        events.push(() => {
          if (index === 0) throw new Error('Left the app')
          index--
          listener({ state: entries[index] })
        })
      },
    },
    addEventListener(type, callback) {
      assert.equal(type, 'popstate')
      listener = callback
    },
  }
  return {
    browser,
    navigation: createBackNavigation(browser),
    entries,
    get index() { return index },
    async settle() {
      await Promise.resolve()
      while (events.length) {
        events.shift()()
        await Promise.resolve()
      }
    },
    forward() {
      assert.ok(index < entries.length - 1)
      index++
      listener({ state: entries[index] })
    },
  }
}

test('Back closes the top dialog first, then asks before ending combat', async () => {
  const s = setup()
  const handled = []
  // Child effects can register before the combat parent.
  const dialog = s.navigation.register(() => { handled.push('dialog'); dialog.remove() })
  const combat = s.navigation.register(() => handled.push('confirm'), 0)
  await s.settle()
  assert.equal(dialog.isTop(), true)
  assert.equal(combat.isTop(), false)
  assert.equal(s.entries.length, 2)
  assert.equal(s.browser.history.state.existing, 'preserved')
  s.browser.history.back()
  await s.settle()
  assert.deepEqual(handled, ['dialog'])
  assert.equal(s.index, 1)
  s.browser.history.back()
  await s.settle()
  assert.deepEqual(handled, ['dialog', 'confirm'])
  assert.equal(s.index, 1)
  assert.equal(s.entries.length, 2)
})

test('stacked dialogs and repeated Back handle exactly one layer per press', async () => {
  const s = setup()
  const handled = []
  const lower = s.navigation.register(() => { handled.push('lower'); lower.remove() })
  const upper = s.navigation.register(() => { handled.push('upper'); upper.remove() })
  await s.settle()
  s.browser.history.back()
  await s.settle()
  assert.deepEqual(handled, ['upper'])
  assert.equal(lower.isTop(), true)
  s.browser.history.back()
  await s.settle()
  assert.deepEqual(handled, ['upper', 'lower'])
  assert.equal(s.index, 0)
})

test('button, backdrop and Escape cleanup do not invoke another close handler', async () => {
  const s = setup()
  let calls = 0
  for (let i = 0; i < 10; i++) {
    const dialog = s.navigation.register(() => calls++)
    await s.settle()
    dialog.remove()
    await s.settle()
    assert.equal(s.index, 0)
    assert.equal(s.entries.length, 2)
  }
  assert.equal(calls, 0)
})

test('StrictMode setup/cleanup/setup creates just one history entry', async () => {
  const s = setup()
  s.navigation.register(() => {}).remove()
  const live = s.navigation.register(() => {})
  await s.settle()
  assert.equal(s.index, 1)
  assert.equal(s.entries.length, 2)
  live.remove()
  await s.settle()
  assert.equal(s.index, 0)
})

test('a new dialog is safe while an earlier dialog history cleanup is pending', async () => {
  const s = setup()
  let calls = 0
  const old = s.navigation.register(() => calls++)
  await s.settle()
  old.remove()
  await Promise.resolve() // history.back has started but popstate has not fired
  const replacement = s.navigation.register(() => { calls++; replacement.remove() })
  await s.settle()
  assert.equal(calls, 0)
  assert.equal(s.index, 1)
  s.browser.history.back()
  await s.settle()
  assert.equal(calls, 1)
  assert.equal(s.index, 0)
})

test('a dialog whose close callback keeps it open remains protected', async () => {
  const s = setup()
  let calls = 0
  s.navigation.register(() => calls++) // resume/discard confirmation
  await s.settle()
  for (let i = 0; i < 4; i++) {
    s.browser.history.back()
    await s.settle()
  }
  assert.equal(calls, 4)
  assert.equal(s.index, 1)
  assert.equal(s.entries.length, 2)
})

test('ending combat with its confirmation open releases the guard', async () => {
  const s = setup()
  const combat = s.navigation.register(() => assert.fail('combat callback'), 0)
  const confirmation = s.navigation.register(() => assert.fail('dialog callback'))
  await s.settle()
  combat.remove()
  confirmation.remove()
  await s.settle()
  assert.equal(s.index, 0)
  s.forward() // old entries never reopen a dialog or restore a deleted combat
  await s.settle()
  assert.equal(s.index, 0)
})

test('reload adopts the existing guard instead of pushing a duplicate', async () => {
  const s = setup()
  s.navigation.register(() => {})
  await s.settle()
  const reloaded = createBackNavigation(s.browser)
  let calls = 0
  reloaded.register(() => calls++)
  await s.settle()
  assert.equal(s.entries.length, 2)
  s.browser.history.back()
  await s.settle()
  assert.equal(calls, 1)
  assert.equal(s.index, 1)
})

test('no registration leaves setup and TV navigation untouched', async () => {
  const s = setup()
  await s.settle()
  assert.equal(s.entries.length, 1)
  assert.equal(s.index, 0)
})
