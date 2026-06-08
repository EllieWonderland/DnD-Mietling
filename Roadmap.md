# Roadmap — DnD Mietling

Priorisierte Aufgabenliste mit Umsetzungsschritten. Nach Abschluss jeder Aufgabe wird sie abgehakt und die Änderung committed.

Stand: Code-Abgleich am 2026-06-08 — viele frühere TODOs waren bereits umgesetzt und wurden auf DONE gesetzt bzw. entfernt.

---

## Erledigt (Combat-Tracker-Kern)

Diese Features sind vollständig im Code und im Praxiseinsatz:

- ✅ **Reaction-Toggle + Auto-Reset** bei Rundenwechsel (⚡-Icon, ausgegraut wenn verbraucht)
- ✅ **Death-Save-Tracker** — erscheint automatisch bei HP ≤ 0 (Verbündete) bzw. per ☠-Button (Spieler); 3 Erfolge → 1 HP, 3 Misserfolge → entfernt
- ✅ **Konzentration** — Toggle + DC-Popup (DC = Schaden/2, min. 10)
- ✅ **Conditions-Menü** — alle 15 PHB-2024-Zustände inkl. Exhaustion-Level 1–5 mit Malus-Anzeige; Icons auf der Kachel
- ✅ **Segnung / Inspiration** (⭐), Versteckt (👻), Fliegend (🪽) als Kachel-Toggles
- ✅ **Monster-Handling** — Add, Duplizieren (Horden), Bloodied-Toggle, Kill/Remove
- ✅ **Verbündete (Ally)** als eigener Teilnehmer-Typ mit HP/Heilung
- ✅ **Edit-Modus** pro Kachel (Name, Initiative, Max HP)
- ✅ **Victory-Overlay** mit Goldstaub-Partikeln + Fanfare; **Defeat-Logik**
- ✅ **Rundenzähler** + Next/Prev-Turn
- ✅ **Drag&Drop** als echter Platztausch zweier Kacheln (Tie-Resolution)
- ✅ **Numerische Tablet-Eingabe** — alle Zahlenfelder öffnen nur den Ziffernblock (`inputMode="numeric"`)
- ✅ **Local Storage** für HP/Kampfzustand zwischen Sessions

---

## Offen — Priorität hoch

### 1. WebSocket-Server: Deploy auf Cloudflare Workers + Durable Objects
- Ziel: `server.js` (Express + ws, läuft nicht auf Vercel) durch einen Cloudflare Worker mit Durable Object ersetzen. Der Worker hält die WebSocket-Verbindung zwischen Controller (Tablet) und Display (Tisch-TV), leitet State weiter und cached den letzten State für neu verbindende Displays.
- Status: **IN PROGRESS** — Code (Worker, `wrangler.toml`, App.jsx-Env-Var) fertig; **Deploy + Vercel-Env-Var fehlen**. Bis dahin hängt `?mode=display` bei „Verbindung wird hergestellt".

  **Offene Schritte:**
  - [ ] `npm install -g wrangler` + `wrangler login`
  - [ ] `wrangler deploy` aus `worker/` → Worker-URL notieren (`wss://dnd-mietling-ws.<account>.workers.dev`)
  - [ ] `VITE_WS_URL=wss://…workers.dev` in Vercel als Env Var eintragen, neu deployen
  - [ ] QA: Controller (Tab/Tablet) + Display (`?mode=display`, TV) → State-Sync, Musik/Videos, Reconnect, Stabilität über eine ganze Session

  **Ergebnis:** WebSocket am Cloudflare Edge, kein VM/Einschlafen, $0 im Free Tier. `server.js` bleibt nur lokaler Dev-Fallback.

---

## Offen — Priorität mittel

### 2. Medien-Hosting (Cloudflare R2): Rest-QA
- Kern fertig (Videos/Musik via R2-CDN, Build < 10 MB statt 700+ MB). Es fehlt nur noch die Abnahme:
  - [ ] Vercel-Deploy nach Push prüfen: Build sauber durch?
  - [ ] Alle 9 Video-Szenen laden korrekt (Range Requests, keine CORS-Fehler)
  - [ ] Offline/Fehlerfall: R2 nicht erreichbar → Video-Szene zeigt Fehlerstate statt hängt
  - [ ] Mobile/Tablet: autoplay + playsInline + muted korrekt (iOS-Safari)
  - [ ] Poster-Thumbnails je Video für Ladezeiten-UX generieren + Ladeindikator anzeigen

### 3. Ambience-Video: Darstellungsoptionen
- `object-fit` steht jetzt auf `contain` (keine abgeschnittenen Ränder mehr, ggf. schwarze Balken).
- [ ] Optional: pro Szene zwischen `cover`/`contain` umschaltbar, falls einzelne Loops mit Balken stören.

---

## Offen — Priorität niedrig / Ideen

### 4. Soundboard & Musik (MoodMixer / MusicLibrary) — Feinschliff
- Großes, aktiv beackertes Feature. Sammelpunkt für künftige Verbesserungen:
  - [ ] „Medien-Wunschliste" pflegen (gewünschte Effekte/Tracks)
  - [ ] Lautstärke-/Fade-Verhalten beim Szenenwechsel prüfen

### 5. UI-Finish: Lesbarkeit aus 1,5 m (konkretisieren)
- [ ] Am echten Tablet/TV: Schriftgrößen, Kontrast, HP-/Schadenszahlen aus 1,5 m prüfen und nachziehen.

### 6. Schwer komprimierbare Videos ersetzen (Idee)
- `wald.mp4` (kaum komprimierbar) und `lichtung.mp4` (nur 35 % Reduktion) durch web-optimierte Loops ersetzen, die bei CRF 28 deutlich kleiner werden.
- Quellen für lizenzfreie Ambient-Loops: Pexels, Pixabay, Mixkit (kostenlos, auch kommerziell).

### 7. Medien-Abdeckung: D&D-Szenen-Übersicht (Referenz)
Checkliste, welche Szenarien bereits Video + Musik haben. Fehlende bei Bedarf ergänzen.

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
