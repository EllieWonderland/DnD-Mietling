import { storageGet, storageSet } from './safeStorage.js'

// The relay has no accounts. What keeps a session private is the room id in
// the connection URL: the relay only ever forwards inside one room, so a
// stranger who knows the (public) hostname sees nothing without the id.

const ROOM_KEY = 'dnd-room-id'
const ROOM_RE = /^[a-z0-9]{8,32}$/

export function makeRoomId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789' // no look-alikes
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return out
}

function roomFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('room')
  return raw && ROOM_RE.test(raw) ? raw : null
}

// Controller: URL wins, otherwise the stored room, otherwise a fresh one.
// Display: the room must come from the URL — a TV that connects on its own
// would be exactly the open relay this is meant to close.
export function getRoomId(mode) {
  const fromUrl = roomFromUrl()
  if (fromUrl) {
    if (mode === 'controller') storageSet(ROOM_KEY, fromUrl)
    return fromUrl
  }
  if (mode !== 'controller') return null

  const stored = storageGet(ROOM_KEY)
  if (stored && ROOM_RE.test(stored)) return stored

  const fresh = makeRoomId()
  storageSet(ROOM_KEY, fresh)
  return fresh
}

export function rotateRoomId() {
  const fresh = makeRoomId()
  storageSet(ROOM_KEY, fresh)
  return fresh
}

export function buildDisplayUrl(room) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}?mode=display&room=${room}`
}
