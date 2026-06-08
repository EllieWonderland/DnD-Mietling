export class GameSession {
  constructor(state) {
    this.state = state
    this.lastState = null
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    this.state.acceptWebSocket(server)

    if (this.lastState) server.send(this.lastState)

    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(ws, data) {
    try {
      const msg = JSON.parse(data)
      if (msg.type === 'STATE') {
        this.lastState = data
        for (const client of this.state.getWebSockets()) {
          if (client !== ws) client.send(data)
        }
      }
    } catch {}
  }

  webSocketClose(ws) {}
  webSocketError(ws) {}
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Upgrade, Connection',
        },
      })
    }

    const id = env.GAME_SESSION.idFromName('default')
    const stub = env.GAME_SESSION.get(id)
    return stub.fetch(request)
  },
}
