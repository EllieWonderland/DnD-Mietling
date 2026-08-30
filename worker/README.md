# Relay-Worker

Der Cloudflare-Worker, der die TV-Synchronisation in Produktion trägt.
Der Controller (Tablet) schickt den kompletten Session-State, jedes Display
(TV) bekommt ihn. Gespeichert wird nur der jeweils letzte State pro Raum.

## Raum-Konzept

Die Verbindung erfolgt über `wss://<host>/?room=<id>`. Der Raum ist ein
zufälliger Code, den der Controller erzeugt (`src/utils/session.js`) und dem
TV über die Verbindungs-Adresse aus dem Setup mitgibt. Der Worker relayt
ausschließlich innerhalb eines Raums; ohne gültigen `room`-Parameter wird die
Verbindung mit `400` abgelehnt.

## Deployen

```sh
cd worker
npx wrangler deploy
```

Danach muss `public/config.json` auf den Worker-Host zeigen:

```json
{ "wsUrl": "wss://dnd-mietling-ws.<account>.workers.dev" }
```

## Konfiguration

- `ALLOWED_ORIGINS` in `wrangler.toml`: Kommaliste erlaubter Browser-Origins.
  Leer = jede Origin darf verbinden (der Raum-Code bleibt die Zugangshürde).

## Limits

- Nur die Nachrichtentypen `STATE` und `COMPACT_SCROLL` werden weitergereicht.
- Maximale Payload: 128 KB.
- Maximal 60 Nachrichten pro Sekunde und Client.
