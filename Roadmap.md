# Roadmap — DnD Mietling

Priorisierte Aufgabenliste mit Umsetzungsschritten. Nach Abschluss jeder Aufgabe wird sie abgehakt und die Änderung committed.

1. Reaction-Toggle + Auto-Reset bei Rundenerhöhung (⚡)
   - Ziel: Pro Teilnehmer ein Reaction-Flag anzeigen/umschalten; bei Rundenwechsel alle Reactions zurücksetzen.
   - Status: DONE — Implementiert `reaction`-Flag, UI-Icon (⚡) und Reset beim Rundenwechsel.

2. Reaktionen nur innerhalb gleicher Initiative bei Drag&Drop (Tie-Resolution)
   - Ziel: Drag/Drop nur erlauben, wenn beide Teilnehmer den gleichen `initiative`-Wert haben.
   - Status: TODO

3. Reaktions-UI + Reaktionsspezifische Anzeige (ausgegraut wenn verbraucht)
   - Ziel: deutlich sichtbares Blitz-Icon mit Tooltip und visueller Deaktivierung.
   - Status: TODO

4. Automatischer Wechsel zu Death-Save bei HP === 0
   - Ziel: Wenn HP auf 0 fällt, automatisch `dying` aktivieren (optional mit Bestätigungs-Popup).
   - Status: TODO

5. Numpad-optimierte Vollbild-Eingabe für Tablet-Modus
   - Ziel: Großes Numpad-UI für schnelle HP/Schaden-Eingabe auf Tablets.
   - Status: TODO

6. UX: Nennung `inspiration`-Toggle separat von `blessed`
   - Ziel: `blessed` bleibt bestehen; `inspiration` als eigenes Feld/Kachel-Icon hinzufügen.
   - Status: TODO

7. UI-Finish: Optimierungen für Lesbarkeit (Fontgrößen, Kontrast, Landscape)
   - Ziel: Schriftgrößen und Abstände für 1,5m Lesbarkeit prüfen und anpassen.
   - Status: TODO

8. Tests & QA: End-to-end Kampf-Flow
   - Ziel: Automatisierte und manuelle Checks: Add Monster, Damage, Kill, Victory, Resume.
   - Status: TODO


9. Medien-Hosting: Externe CDN-Integration für Videos & Audio
   - Ziel: Alle großen Mediendateien (705 MB Videos, 34 MB Musik) aus dem Vite-Build herauslösen und extern hosten, damit Deployments schlank bleiben (<10 MB) und Videos sauber streamen.
   - Status: TODO

   **Hintergrund & Problem:**
   Aktuell werden alle Medien via Vite-`import` direkt ins Build gebündelt. Das führt zu einem 700+ MB großen `dist/`-Ordner, der Vercel und andere Deployment-Dienste sprengt (Free Tier: 100 MB Limit). Außerdem wird `lichtung.mov` (235 MB, falsches Format) und unkomprimiertes Material als unkomprimierte Rohdaten ausgeliefert.

   **Hosting-Entscheidung: Cloudflare R2**
   - Free Tier: 10 GB Storage + 0 Egress-Kosten (dauerhaft, nicht nur als Student)
   - Aktuell nach Optimierung: ~150–200 MB Videos + 35 MB Audio = passt gut ins Free Tier
   - Kommerziell erlaubt: Ja — auch wenn die App vermarktet wird
   - Fallback / Reserve: Azure for Students ($100 Credit, kein Kreditkartenzwang)

   **Phase 1 — Video-Optimierung (lokal, vor dem Upload)**
   - [x] `lichtung.mov` → `lichtung.mp4` konvertieren (FFmpeg: `.mov` → H.264/MP4)
   - [x] Alle Videos mit FFmpeg komprimieren (CRF 28, H.264, `slow`-Preset, `-an`) — Ergebnis: 705 MB → ~284 MB (−60 %)
   - [ ] Poster-Thumbnails (`.jpg`, 1 Bild je Video) für Ladezeiten-UX generieren
   - [ ] Audio-Tracks prüfen: sind alle MP3s bereits web-optimiert (128–192 kbps)? Ggf. re-encodieren.

   Optimierte Dateien liegen in `src/Videos/optimized/`. Hinweis: `wald.mp4` war bereits stark komprimiert (kaum Einsparung), `lichtung.mp4` nur 35 % Reduktion — beide Kandidaten für spätere Video-Ablösung (siehe Punkt 10).

   FFmpeg-Referenz-Kommando:
   ```
   ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -an -movflags +faststart output.mp4
   ```
   `+faststart` ist wichtig: Ermöglicht sofortigen Start beim Streamen (Metadaten am Dateianfang).

   **Phase 2 — Cloudflare R2 einrichten**
   - [x] Cloudflare-Account erstellen (kostenlos)
   - [x] R2-Bucket `dnd-mietling-media` anlegen
   - [x] CORS-Policy konfigurieren (localhost:5173 + *.vercel.app, Range-Header erlaubt)
   - [x] Optimierte Videos + Musik hochladen (Music/ und Videos/ im Bucket)
   - [x] Öffentlichen Endpunkt aktiviert: `https://pub-28096ab7cf5d497990bc972094f05721.r2.dev`

   **Phase 3 — Code-Refactoring (soundboardData.jsx + AmbienceScene)**
   - [x] `soundboardData.jsx`: Alle Video- und Musik-Imports durch CDN-URLs ersetzt (CDN-Konstante `const CDN = '...'`)
   - [x] `lichtung.mov` → `lichtung.mp4` in der URL korrigiert
   - [x] Effects-Imports (`cheer`, `disappointment`, `whip`) bleiben gebündelt — Overlay-Sounds auch
   - [x] `AmbienceScene.jsx`: `preload="auto"` → `preload="none"` (kein Vor-Laden beim Seitenstart)
   - [x] `.gitignore`: `src/Videos/` und die 5 CDN-Musiktracks ausgeschlossen; Effects + Overlay-Sounds bleiben im Repo

   **Phase 4 — Deployment & Vercel-Konfiguration**
   - [x] `src/Videos/` und CDN-Musiktracks aus git-Tracking entfernt (`git rm --cached`)
   - [x] Build verifiziert: `dist/` ist ~5 MB (zuvor 700+ MB) — keine Media-Imports mehr im Bundle
   - [ ] Vercel-Deploy nach Push prüfen: läuft der Build sauber durch?

   **Phase 5 — QA & Fallback-Verhalten**
   - [ ] Testen: Alle 9 Video-Szenen laden korrekt (Range Requests, keine CORS-Fehler)
   - [ ] Testen: Service Worker greift nicht auf Medien zu (bereits korrekt konfiguriert in `sw.js`)
   - [ ] Offline-Verhalten: Wenn R2 nicht erreichbar → Video-Szene zeigt Fehlerstate statt hängt
   - [ ] Mobile/Tablet: autoplay + playsInline + muted korrekt gesetzt (iOS-Safari-Kompatibilität)
   - [ ] Ladeindikator: Poster-Bild anzeigen, während Video buffert

   **Ergebnis nach Umsetzung:**
   - Vercel-Deployment: < 10 MB (nur JS/CSS/HTML)
   - Video-Streaming: Sauber via Cloudflare R2 CDN, mit Range-Request-Support
   - Kostenlos: dauerhaft im Free Tier (bis ~10 GB, derzeit ~200 MB geplant)
   - Kommerziell verwendbar: Ja, R2 ist nicht auf Privat beschränkt

10. WebSocket-Server: Migration zu Cloudflare Workers + Durable Objects
    - Ziel: Den bisherigen `server.js` (Express + ws, läuft nicht auf Vercel) durch einen Cloudflare Worker mit Durable Object ersetzen. Der Worker übernimmt die WebSocket-Verbindung zwischen Controller (Tablet) und Display (Tisch-TV), leitet State weiter und cached den letzten bekannten State für neu verbindende Displays.
    - Status: IN PROGRESS — Phasen 1–3 erledigt; Phase 4 (Deploy + QA) steht aus

    **Hintergrund & Problem:**
    `server.js` ist ein persistenter Node.js-Prozess — Vercel ist serverless und unterstützt das nicht. Deshalb hängt `?mode=display` dauerhaft bei "Verbindung wird hergestellt". Der WebSocket-Server läuft aktuell nirgendwo in der Cloud.

    **Warum Cloudflare Workers + Durable Objects (nicht Fly.io o.ä.):**
    - Cloudflare bereits im Einsatz (R2) → eine Plattform für alles
    - Kein VM-Management, kein Einschlafen, global verteilt
    - Free Tier: 100k Worker-Requests/Tag + großzügige DO-Compute-Zeit — für eine Spielgruppe weit mehr als genug
    - Kommerziell: $5/Monat Workers Paid Plan reicht für Vermarktung
    - Durable Objects: Hibernatable WebSockets — DO schläft zwischen Nachrichten, spart Compute, bleibt aber verbunden

    **Neue Dateistruktur:**
    ```
    worker/
    ├── src/
    │   └── index.js       ← Worker-Einstiegspunkt + Durable Object (GameSession)
    └── wrangler.toml      ← Cloudflare-Deployment-Konfiguration
    ```

    **Phase 1 — Worker + Durable Object schreiben (`worker/src/index.js`)**
    - [x] `GameSession` Durable Object implementieren:
      - Hält eine Liste aktiver WebSocket-Verbindungen
      - Cached `lastState` (letzter STATE-Message vom Controller)
      - Neue Verbindungen erhalten sofort `lastState` (Display verbindet sich nach Controller)
      - Nutzt Hibernatable WebSockets (`state.acceptWebSocket()`) statt `webSocket.accept()` für Effizienz
      - Leitet STATE-Messages an alle anderen verbundenen Clients weiter
    - [x] Worker-Einstiegspunkt: leitet alle WebSocket-Upgrade-Requests an die `GameSession`-DO weiter (alle Clients landen in einer einzigen `GameSession`-Instanz namens `"default"`)
    - [x] CORS-Header setzen, falls nötig (Vercel-Domain + localhost)

    Referenz-Implementierung (Durable Object mit Hibernatable WebSockets):
    ```js
    export class GameSession {
      constructor(state) { this.state = state; this.lastState = null }

      async fetch(request) {
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
        const id = env.GAME_SESSION.idFromName('default')
        return env.GAME_SESSION.get(id).fetch(request)
      }
    }
    ```

    **Phase 2 — `wrangler.toml` konfigurieren**
    - [ ] Wrangler CLI installieren: `npm install -g wrangler`
    - [ ] `wrangler login` (Cloudflare-Account verknüpfen)
    - [x] `worker/wrangler.toml` anlegen:
      ```toml
      name = "dnd-mietling-ws"
      main = "src/index.js"
      compatibility_date = "2024-09-23"
      compatibility_flags = ["nodejs_compat"]

      [durable_objects]
      bindings = [{ name = "GAME_SESSION", class_name = "GameSession" }]

      [[migrations]]
      tag = "v1"
      new_classes = ["GameSession"]
      ```
    - [ ] Deployment testen: `wrangler deploy` aus dem `worker/`-Verzeichnis
    - [ ] Worker-URL notieren: `wss://dnd-mietling-ws.<account>.workers.dev`

    **Phase 3 — App.jsx: WS-URL konfigurierbar machen**
    - [x] Aktuelle Hardcodierung ersetzen:
      ```js
      // Vorher (hardcodiert auf window.location.host — funktioniert nicht auf Vercel):
      const wsUrl = import.meta.env.PROD
        ? `${wsProto}//${window.location.host}`
        : `ws://${window.location.hostname}:3001`

      // Nachher (konfigurierbar via Env Var):
      const wsUrl = import.meta.env.VITE_WS_URL
        ?? (import.meta.env.PROD
          ? `${wsProto}//${window.location.host}`
          : `ws://${window.location.hostname}:3001`)
      ```
    - [x] `.env.development` anlegen: `VITE_WS_URL=ws://localhost:3001` (für lokale Dev-Sessions mit server.js)
    - [ ] `VITE_WS_URL=wss://dnd-mietling-ws.<account>.workers.dev` in Vercel-Dashboard als Env Var eintragen (nach Deploy)

    **Phase 4 — QA**
    - [ ] Lokaler Test: Controller auf Tab 1, Display (`?mode=display`) auf Tab 2 → State wird synchronisiert
    - [ ] Produktions-Test: Controller auf Tablet, Display auf TV → Musik/Videos spielen korrekt
    - [ ] Reconnect-Test: Display-Tab kurz schließen und neu öffnen → bekommt sofort letzten State
    - [ ] Stabilität: Worker läuft stabil über eine ganze Spielsession (2–4 Stunden)

    **Ergebnis nach Umsetzung:**
    - WebSocket-Server: Cloudflare Edge, global, kein Einschlafen, kein VM
    - Kosten: $0 im Free Tier für private Nutzung
    - Vermarktung: Workers Paid Plan ($5/Monat) reicht für beliebig viele Gruppen
    - `server.js` bleibt als lokale Dev-Fallback erhalten, wird aber nicht mehr deployed

12. Idee: Schwer komprimierbare Videos durch bessere Quellen ersetzen
    - Ziel: `wald.mp4` (kaum Komprimierung, war bereits H.264) und `lichtung.mp4` (nur 35 % Reduktion, hohes Quelldatenvolumen) durch web-optimierte Alternativen ersetzen, die bei CRF 28 deutlich kleiner werden.
    - Status: IDEE — kein akuter Handlungsbedarf, bis Videos ausgetauscht werden sollen.
    - Hinweis: Gute Quellen für lizenzfreie Ambient-Loops: Pexels, Pixabay, Mixkit (alle kostenlos, auch kommerziell).

11. Medien-Abdeckung: D&D-Szenen-Übersicht
    - Ziel: Vollständige Übersicht aller typischen D&D-Szenarien mit Status, ob ein passendes Video und eine passende Musik bereits vorhanden sind. Als Checkliste zum schrittweisen Ergänzen.
    - Status: IDEE — Tabelle ist vorbereitet, fehlende Inhalte werden bei Bedarf ergänzt.

    | Szene (DE) | Szene (EN) | Video | Musik | Notizen |
    |-----------|-----------|-------|-------|---------|
    | Lagerfeuer | Campfire | ✅ Lagerfeuer.mp4 | ✅ dawn, dreaming | Rast, langer Abend |
    | Taverne | Tavern | ✅ taverne.mp4 | ✅ adventure | Social Hub, Questannahme |
    | Dorf | Village | ✅ dorf.mp4 | ✅ adventure, walking | Kleine Siedlung |
    | Wald | Forest | ✅ wald.mp4 | ✅ walking | Erkundung, Reise |
    | Lichtung | Glade | ✅ lichtung.mp4 | ✅ dreaming | Ruhige Naturszene, Rast |
    | Dungeon | Dungeon | ✅ dungeon.mp4 | ✅ epic, dreaming | Kerker, Höhlensystem |
    | Ruinen | Ruins | ✅ dusty_dungeon.mp4 | ✅ epic | Alte Ruinen, verlassene Orte |
    | Waldhaus | Forest House | ✅ house_in_woods.mp4 | ✅ dreaming | Einsame Hütte, NPC-Heim |
    | Bach / Fluss | River / Stream | ✅ bach.mp4 | ✅ dreaming, dawn | Flusslandschaft, Überquerung |
    | Marktplatz | Marketplace | ❌ | ❌ | Belebte Stadt, Händler, Menschenmenge |
    | Stadt / Großstadt | City | ❌ | ❌ | Urbane Umgebung, Gassen, Nacht |
    | Hafen | Harbor | ❌ | ❌ | Küstenstadt, Schiffe, Meer |
    | Schloss (Innen) | Castle Interior | ❌ | ❌ | Thronsaal, Hallen, Wachen |
    | Schloss (Außen) | Castle Exterior | ❌ | ❌ | Burgmauern, Tor, Belagerung |
    | Thronsaal | Throne Room | ❌ | ❌ | Royal Court, feierlich |
    | Tempel | Temple | ❌ | ❌ | Heilig, mystisch, Götteranbetung |
    | Krypta | Crypt | ❌ | ❌ | Untote, Horror, düster |
    | Höhle | Cave | ❌ | ❌ | Unterirdisch, eng, Tropfstein |
    | Sumpf | Swamp | ❌ | ❌ | Dunkel, giftig, bedrohlich |
    | Schnee / Gebirge | Snow / Mountains | ❌ | ❌ | Arktisch, Hochland, Sturm |
    | Wüste | Desert | ❌ | ❌ | Heiß, trocken, Sandstürme |
    | Schlachtfeld | Battlefield | ❌ | ✅ epic | Krieg, Massenkampf, nach der Schlacht |
    | Arena | Arena | ❌ | ✅ epic | Gladiatorenkampf, Schaukampf |
    | Bibliothek / Archiv | Library / Archive | ❌ | ✅ dreaming | Akademisch, Forschung, ruhig |
    | Magierturm | Wizard Tower | ❌ | ✅ dreaming, epic | Mystisch, Labor, Experimente |
    | Schiff / Meer | Ship / Sea | ❌ | ❌ | Reise, Sturm, Piraten |
    | Unterwelt / Hölle | Underworld / Hell | ❌ | ❌ | Dramatisch, düster, Endkampf |

---

Hinweis: Ich beginne jetzt mit Punkt 1 (Reaction-Toggle + Auto-Reset). Nach Fertigstellung markiere ich den Punkt als erledigt, committe und pushe die Änderung.
