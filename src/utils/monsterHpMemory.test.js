import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  reconcileMonsterHpHistory,
  findRememberedMonsterHp,
  rememberDefeatedMonsters,
} from './monsterHpMemory.js'

const monster = (changes = {}) => ({
  id: 'monster-1', type: 'monster', name: 'Goblin', maxHp: 12, damage: 17, dead: true,
  ...changes,
})

test('confirmed deaths remember known max HP and lethal damage separately without mutating combat', () => {
  const participant = Object.freeze(monster())
  const history = Object.freeze([])
  const result = reconcileMonsterHpHistory(history, Object.freeze([participant]))
  assert.deepEqual(result, [{ id: 'monster-1', name: 'Goblin', hp: 12, source: 'maxHp', damage: 17 }])
  assert.equal(history.length, 0)
  assert.equal(participant.damage, 17)
})

test('unknown max HP uses lethal damage as an estimate, never zero or invalid HP', () => {
  const result = reconcileMonsterHpHistory([], [monster({ maxHp: 0 })])
  assert.equal(result[0].hp, 17)
  assert.equal(result[0].source, 'damage')
  for (const hp of [0, -1, NaN, Infinity, 1.5, '12', null]) {
    assert.deepEqual(reconcileMonsterHpHistory([], [monster({ maxHp: hp, damage: hp })]), [])
  }
})

test('living monsters, players and allies do not teach HP, even with lethal damage', () => {
  for (const changes of [{ dead: false }, { type: 'player' }, { type: 'ally' }, { name: '  ' }]) {
    assert.deepEqual(reconcileMonsterHpHistory([], [monster(changes)]), [])
  }
})

test('automatically suggested HP remain estimates and learn the new lethal damage', () => {
  const result = reconcileMonsterHpHistory([], [monster({ maxHpEstimated: true, maxHp: 17, damage: 21 })])
  assert.equal(result[0].source, 'damage')
  assert.equal(result[0].hp, 21)
})

test('names ignore case and repeated spaces but retain distinct variants and numbers', () => {
  const history = reconcileMonsterHpHistory([], [monster({ name: '  Goblin   Boss  ' })])
  assert.equal(findRememberedMonsterHp('gObLiN boss', history)?.hp, 12)
  for (const name of ['Goblin', 'Goblin Boss 2', '', null]) {
    assert.equal(findRememberedMonsterHp(name, history), null)
  }
})

test('newest confirmed death wins and repeated observations remain idempotent', () => {
  const first = monster()
  const second = monster({ id: 'monster-2', maxHp: 20, damage: 25 })
  const history = reconcileMonsterHpHistory([], [first, second])
  assert.equal(findRememberedMonsterHp('Goblin', history).hp, 20)
  assert.equal(reconcileMonsterHpHistory(history, [first, second]), history)
})

test('undoing a death restores the earlier value and removed monsters stay remembered', () => {
  const first = monster()
  const second = monster({ id: 'monster-2', maxHp: 20 })
  const history = reconcileMonsterHpHistory([], [first, second])
  const revived = reconcileMonsterHpHistory(history, [{ ...second, dead: false }])
  assert.equal(findRememberedMonsterHp('Goblin', revived).hp, 12)
  assert.equal(reconcileMonsterHpHistory(revived, []), revived)
  assert.equal(reconcileMonsterHpHistory(revived, [monster({ id: 'new-fight', dead: false })]), revived)
})

test('corrected death HP and names replace observations rather than accumulating duplicates', () => {
  const initial = reconcileMonsterHpHistory([], [monster()])
  const edited = reconcileMonsterHpHistory(initial, [monster({ name: 'Ork', maxHp: 30 })])
  assert.equal(edited.length, 1)
  assert.equal(findRememberedMonsterHp('Goblin', edited), null)
  assert.equal(findRememberedMonsterHp('Ork', edited).hp, 30)
})

test('persistence imports existing defeated combatants, skips malformed storage and survives unavailable storage', () => {
  const saved = new Map([['dnd-combat-state', '{"round":7,"participants":[]}']])
  let writes = 0
  globalThis.window = { localStorage: {
    getItem(key) { return saved.get(key) ?? null },
    setItem(key, value) { saved.set(key, value); writes++ },
    removeItem(key) { saved.delete(key) },
  } }
  for (const value of ['{invalid', '{"old":"format"}', '[null, {"id":"bad","name":"Goblin","hp":-3}]']) {
    saved.set('dnd-monster-hp-memory', value)
    assert.equal(findRememberedMonsterHp('Goblin'), null)
    rememberDefeatedMonsters([monster()])
    assert.equal(findRememberedMonsterHp('Goblin').hp, 12)
  }
  const priorWrites = writes
  rememberDefeatedMonsters([monster()])
  assert.equal(writes, priorWrites)
  assert.equal(saved.get('dnd-combat-state'), '{"round":7,"participants":[]}')

  // Storage failure must not interrupt the fight; the existing safe-storage
  // wrapper keeps this session's memory available even without persistence.
  window.localStorage.setItem = () => { throw new Error('Quota full') }
  assert.doesNotThrow(() => rememberDefeatedMonsters([monster({ id: 'monster-2', name: 'Ork' })]))
  window.localStorage.getItem = () => { throw new Error('Storage unavailable') }
  assert.equal(findRememberedMonsterHp('Ork').hp, 12)
  delete globalThis.window
})
