export class GameSession {
  constructor(state) {
    this.state = state
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    this.state.acceptWebSocket(server)

    // Letzten bekannten State sofort an neu verbundene Clients senden
    // (z. B. Display, das sich nach dem Controller verbindet).
    // Aus DO-Storage gelesen, damit er eine Hibernation des Durable Object
    // uebersteht — In-Memory-State ginge dabei verloren.
    const lastState = await this.state.storage.get('lastState')
    if (lastState) server.send(lastState)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws, data) {
    try {
      const msg = JSON.parse(data)
      if (msg.type === 'STATE') {
        await this.state.storage.put('lastState', data)
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
