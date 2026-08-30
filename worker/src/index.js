// Cloudflare Worker relay for DnD Mietling.
//
// The controller (tablet) pushes the full session state, every display (TV)
// receives it. There is no persistence beyond the last state of a room, and
// no accounts: what keeps a session private is the room id in the URL.
//
//   wss://<worker-host>/?room=<id>
//
// One Durable Object instance per room does the fan-out.

const ALLOWED_TYPES = new Set(['STATE', 'COMPACT_SCROLL'])
const MAX_PAYLOAD_BYTES = 128 * 1024
const MAX_MESSAGES_PER_SEC = 60
const ROOM_RE = /^[a-z0-9]{8,32}$/

function originAllowed(origin, env) {
  const configured = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
  if (configured.length === 0) return true // not configured — room id is the gate
  if (!origin) return true // non-browser client
  return configured.includes(origin)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('DnD Mietling relay — connect via WebSocket with ?room=<id>', {
        status: 426,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    if (!originAllowed(request.headers.get('Origin'), env)) {
      return new Response('Forbidden origin', { status: 403 })
    }

    const room = url.searchParams.get('room')
    if (!room || !ROOM_RE.test(room)) {
      return new Response('Missing or malformed ?room=', { status: 400 })
    }

    const id = env.RELAY_ROOM.idFromName(room)
    return env.RELAY_ROOM.get(id).fetch(request)
  },
}

export class RelayRoom {
  constructor(state) {
    this.state = state
    this.sockets = new Set()
    this.lastState = null
  }

  async fetch() {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.accept(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  accept(ws) {
    ws.accept()
    this.sockets.add(ws)

    // A screen that (re)joins mid-session gets the current picture at once
    // instead of waiting for the controller's next change or heartbeat.
    if (this.lastState) {
      try { ws.send(this.lastState) } catch { /* socket already gone */ }
    }

    let windowStart = Date.now()
    let messagesInWindow = 0

    ws.addEventListener('message', event => {
      const now = Date.now()
      if (now - windowStart >= 1000) {
        windowStart = now
        messagesInWindow = 0
      }
      if (++messagesInWindow > MAX_MESSAGES_PER_SEC) return

      const raw = event.data
      if (typeof raw !== 'string' || raw.length > MAX_PAYLOAD_BYTES) return

      let msg
      try { msg = JSON.parse(raw) } catch { return }
      if (!msg || typeof msg !== 'object' || !ALLOWED_TYPES.has(msg.type)) return

      if (msg.type === 'STATE') this.lastState = raw

      for (const peer of this.sockets) {
        if (peer === ws) continue
        try { peer.send(raw) } catch { this.sockets.delete(peer) }
      }
    })

    const drop = () => {
      this.sockets.delete(ws)
      if (this.sockets.size === 0) this.lastState = null
    }
    ws.addEventListener('close', drop)
    ws.addEventListener('error', drop)
  }
}
