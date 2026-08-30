// localStorage throws in Safari's private mode and once the quota is full.
// savePlayerHP runs on every participant change, so a single unguarded
// setItem would take the app down on every click. Everything goes through
// this wrapper; if the real storage is unavailable, an in-memory map keeps
// the session consistent until the tab is closed.

const memory = new Map()
let backingWorks = null

function storage() {
  if (backingWorks === false) return null
  try {
    const ls = window.localStorage
    if (backingWorks === null) {
      const probe = '__dnd_probe__'
      ls.setItem(probe, '1')
      ls.removeItem(probe)
      backingWorks = true
    }
    return ls
  } catch {
    backingWorks = false
    return null
  }
}

export function storageGet(key) {
  const ls = storage()
  if (ls) {
    try { return ls.getItem(key) } catch { /* fall through to memory */ }
  }
  return memory.has(key) ? memory.get(key) : null
}

export function storageSet(key, value) {
  memory.set(key, value)
  const ls = storage()
  if (!ls) return false
  try {
    ls.setItem(key, value)
    return true
  } catch {
    // Quota exceeded or private mode — the memory copy is all we get.
    return false
  }
}

export function storageRemove(key) {
  memory.delete(key)
  const ls = storage()
  if (!ls) return
  try { ls.removeItem(key) } catch { /* nothing to do */ }
}

export function readJSON(key, fallback = null) {
  const raw = storageGet(key)
  if (raw === null || raw === undefined) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed === null ? fallback : parsed
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    return storageSet(key, JSON.stringify(value))
  } catch {
    // Circular structure or similar — never let a save break the caller.
    return false
  }
}
