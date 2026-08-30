import { createServer } from 'node:http'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { WebSocketServer } from 'ws'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

// ── Relay limits ────────────────────────────────────────────────────────────
// The relay only ever carries these two messages. Anything else is dropped
// instead of being handed to every connected screen.
const ALLOWED_TYPES = new Set(['STATE', 'COMPACT_SCROLL'])
const MAX_PAYLOAD_BYTES = 128 * 1024
const MAX_MESSAGES_PER_SEC = 60
const ROOM_RE = /^[a-z0-9]{8,32}$/

// Origins that may open a socket. WebSockets are not covered by the
// same-origin policy, so without this any page in the same browser could
// connect and read along. Configure extra origins via ALLOWED_ORIGINS.
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

function isAllowedOrigin(origin) {
  // No Origin header: not a browser (curl, native client). The room id is the
  // access control there — this check exists for browser-driven connections.
  if (!origin) return true
  if (EXTRA_ORIGINS.includes(origin)) return true
  let url
  try { url = new URL(origin) } catch { return false }
  const host = url.hostname
  return host === 'localhost'
    || host === '127.0.0.1'
    || host === '::1'
    || host === '[::1]'
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    || host.endsWith('.local')
}

const app = express()
app.use(express.static(join(__dirname, 'dist')))
app.use((req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

const server = createServer(app)
const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES })

// One cached state per room, replayed to a screen that joins or reconnects.
const lastStateByRoom = new Map()

server.on('upgrade', (req, socket, head) => {
  if (req.headers['upgrade']?.toLowerCase() !== 'websocket') return

  if (!isAllowedOrigin(req.headers.origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
    socket.destroy()
    return
  }

  const room = new URL(req.url, 'http://localhost').searchParams.get('room')
  if (!room || !ROOM_RE.test(room)) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, ws => {
    ws.room = room
    wss.emit('connection', ws, req)
  })
})

wss.on('connection', ws => {
  const cached = lastStateByRoom.get(ws.room)
  if (cached) ws.send(cached)

  let windowStart = Date.now()
  let messagesInWindow = 0

  ws.on('message', data => {
    // Rate limit per client: a runaway sender must not be able to flood
    // every other screen in the room.
    const now = Date.now()
    if (now - windowStart >= 1000) {
      windowStart = now
      messagesInWindow = 0
    }
    if (++messagesInWindow > MAX_MESSAGES_PER_SEC) return

    const str = data.toString()
    if (str.length > MAX_PAYLOAD_BYTES) return

    let msg
    try { msg = JSON.parse(str) } catch { return }
    if (!msg || typeof msg !== 'object' || !ALLOWED_TYPES.has(msg.type)) return

    if (msg.type === 'STATE') lastStateByRoom.set(ws.room, str)

    for (const client of wss.clients) {
      if (client !== ws && client.room === ws.room && client.readyState === 1) {
        client.send(str)
      }
    }
  })

  ws.on('close', () => {
    // Drop the cache once the last screen of a room is gone, so a long-running
    // relay does not keep every session it has ever seen in memory.
    const stillUsed = [...wss.clients].some(c => c !== ws && c.room === ws.room)
    if (!stillUsed) lastStateByRoom.delete(ws.room)
  })

  ws.on('error', () => {})
})

server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`)
})
