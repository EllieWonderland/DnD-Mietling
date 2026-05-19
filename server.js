import { createServer } from 'node:http'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { WebSocketServer } from 'ws'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()
app.use(express.static(join(__dirname, 'dist')))
app.use((req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

const server = createServer(app)
const wss = new WebSocketServer({ noServer: true })
let lastState = null

server.on('upgrade', (req, socket, head) => {
  if (req.headers['upgrade']?.toLowerCase() === 'websocket') {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req)
    })
  }
})

wss.on('connection', ws => {
  if (lastState) ws.send(lastState)

  ws.on('message', data => {
    try {
      const str = data.toString()
      const msg = JSON.parse(str)
      if (msg.type === 'STATE') {
        lastState = str
        for (const client of wss.clients) {
          if (client !== ws && client.readyState === 1) client.send(str)
        }
      }
    } catch {}
  })

  ws.on('error', () => {})
})

server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`)
})
