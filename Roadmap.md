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
   - [ ] Cloudflare-Account erstellen (kostenlos)
   - [ ] R2-Bucket anlegen (z. B. `dnd-mietling-media`)
   - [ ] CORS-Policy konfigurieren: erlaubt Requests von `localhost:5173` und der Vercel-Domain
   - [ ] Optimierte Medien hochladen (Videos nach Phase 1, Audio-Tracks)
   - [ ] Öffentlichen Bucket-Endpunkt aktivieren ODER Custom Domain (z. B. `media.dndmietling.app`) via Cloudflare DNS verbinden
   - [ ] CDN-Basis-URL als Umgebungsvariable anlegen: `VITE_MEDIA_BASE_URL=https://...`

   **Phase 3 — Code-Refactoring (soundboardData.jsx + Overlays)**
   - [ ] `soundboardData.jsx`: Alle `import videoFile from '../Videos/...'` durch URL-Strings ersetzen
     ```js
     // Vorher:
     import campfireVideo from '../Videos/Lagerfeuer.mp4'
     // Nachher:
     const BASE = import.meta.env.VITE_MEDIA_BASE_URL
     const campfireVideo = `${BASE}/Videos/Lagerfeuer.mp4`
     ```
   - [ ] `VictoryOverlay.jsx` + `DefeatOverlay.jsx`: Gleiche Umstellung für `orchestral_win.mp3` / `defeat_outro.mp3`
   - [ ] Lokaler Fallback für Entwicklung: `.env.development` mit `VITE_MEDIA_BASE_URL=http://localhost:5173/media` + Symlink auf `src/Videos`/`src/Music` in `public/media/`
   - [ ] `AmbienceScene.jsx`: `preload="none"` statt `preload="auto"` setzen — Video nur laden, wenn Szene ausgewählt wird
   - [ ] Lazy-Loading: Video-`src` erst setzen, wenn Szene aktiv wird (kein Vor-Laden aller 9 Szenen)

   **Phase 4 — Deployment & Vercel-Konfiguration**
   - [ ] `vercel.json`: Cache-Header für Medien-Assets von R2 prüfen (R2 liefert eigene Cache-Header)
   - [ ] `.gitignore` / `.vercelignore`: `src/Videos/`, `src/Music/`, `src/Effects/` ausschließen, damit große Dateien nie ins Repo/Deployment geraten
   - [ ] `vite.config.ts`: Sicherstellen, dass keine Media-Imports mehr existieren (Build schlägt fehl, wenn doch)
   - [ ] Environment Variable `VITE_MEDIA_BASE_URL` in Vercel-Dashboard eintragen

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

10. Idee: Schwer komprimierbare Videos durch bessere Quellen ersetzen
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
