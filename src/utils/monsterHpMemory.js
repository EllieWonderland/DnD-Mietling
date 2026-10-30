import { readJSON, writeJSON } from './safeStorage.js'

const STORAGE_KEY = 'dnd-monster-hp-memory'

function nameKey(name) {
  return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE') : ''
}

function positiveHp(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : 0
}

function validRecord(record) {
  return record && typeof record.id === 'string' && nameKey(record.name)
    && positiveHp(record.hp) && record.source === 'confirmed'
}

function readHistory() {
  const saved = readJSON(STORAGE_KEY, [])
  return Array.isArray(saved) ? saved.filter(validRecord) : []
}

// Only the HP explicitly approved in the defeat confirmation count. Older
// automatic observations are ignored. Undoing a death withdraws its record.
export function reconcileMonsterHpHistory(history, participants) {
  let next = history
  for (const monster of participants) {
    if (monster.type !== 'monster' || typeof monster.id !== 'string') continue
    const previous = next.find(record => record.id === monster.id)
    const hp = positiveHp(monster.rememberedHp)
    const damage = positiveHp(monster.damage)
    const record = monster.dead && hp && nameKey(monster.name) ? {
      id: monster.id,
      name: monster.name.trim(),
      hp,
      source: 'confirmed',
      damage,
    } : null
    if (!previous && !record) continue
    if (previous && record && previous.name === record.name && previous.hp === record.hp
      && previous.source === record.source && previous.damage === record.damage) continue
    next = next.filter(entry => entry.id !== monster.id)
    if (record) next.push(record)
  }
  return next
}

export function rememberDefeatedMonsters(participants) {
  const history = readHistory()
  const next = reconcileMonsterHpHistory(history, participants)
  if (next !== history) writeJSON(STORAGE_KEY, next)
}

// Exact names, ignoring case and redundant spaces. Keep numbers and variants
// distinct: a Goblin boss must not accidentally inherit an ordinary Goblin's HP.
export function findRememberedMonsterHp(name, history = readHistory()) {
  const key = nameKey(name)
  if (!key) return null
  for (let i = history.length - 1; i >= 0; i--) {
    if (validRecord(history[i]) && nameKey(history[i].name) === key) return history[i]
  }
  return null
}
