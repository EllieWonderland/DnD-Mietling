# TODO — DnD Mietling

Befundliste aus dem Vollcheck (UX, UI, Sicherheit, Stabilität, Logik) vom **2026-08-29**.

## Arbeitsweise

- Punkte werden abgearbeitet und hier abgehakt (`- [x]`).
- **Nach jeder vollständig abgeschlossenen Kategorie erfolgt automatisch `commit` + `push`** auf `main`.
  Commit-Message-Schema: `fix(<scope>): <Kategorie> abgeschlossen — <Kurzfassung>`
- Teilweise erledigte Kategorien werden nicht committet, außer es wird ausdrücklich gewünscht.
- Erledigte Punkte bleiben stehen (abgehakt), damit der Verlauf nachvollziehbar bleibt.

## Kategorien-Status

| # | Kategorie | Punkte | Status |
|---|-----------|--------|--------|
| 1 | 🔴 Kritisch — Datenverlust im Kampf | 1–4 | ✅ erledigt |
| 2 | 🟠 Sicherheit | 5–9 | ✅ erledigt |
| 3 | 🟡 Logik & Stabilität | 10–16 | offen |
| 4 | 🔵 UX / UI | 17–25 | offen |
| 5 | 🧹 Aufräumen & Spielrunde | 26–31 | offen |
| 6 | ⚪ Build, Deploy & Performance | 32–37 | offen |

---

## 🔴 Kategorie 1 — Kritisch: Datenverlust im laufenden Kampf

- [x] **1. Versehentlicher Sieg beendet den Kampf unwiderruflich**
  `InitiativeTracker.jsx:248` setzt `victory`, sobald das letzte Monster **entfernt** wird — nicht nur wenn es stirbt. Monster versehentlich anlegen + ✕ → Siegesfanfare.
  Dazu `InitiativeTracker.jsx:644`: `onClose={() => { setVictory(false); onEndCombat() }}` — jeder Klick, auch auf den Hintergrund, beendet den Kampf und ruft `clearCombatState()`. Autosave weg, Reload rettet nichts. Gilt genauso für Defeat (`:648`).
  **Fix:** Sieg nur bei `dead`, nicht bei `remove`. Overlay bekommt zwei getrennte Aktionen: „Kampf beenden" und „Doch weiterkämpfen" (nur `setVictory(false)`). Backdrop-Klick darf nicht beenden.

- [x] **2. Toter Spielercharakter verschwindet spurlos**
  `ParticipantCard.jsx:126-127` — der 3. Misserfolgs-Kreis ruft direkt `onRemove()`, bei Spielern also Löschen aus der Liste. Ein Fehltipp auf einen 12×12-px-Kreis löscht den Charakter: keine Rückfrage, kein Undo, keine ☠-Markierung.
  **Fix:** Statt Löschen einen `dead`-Zustand für Spieler/Verbündete (Kachel bleibt sichtbar, ausgegraut, ☠). Entfernen nur explizit über ✕ mit Rückfrage.

- [x] **3. Monster-Schaden ist nicht korrigierbar**
  Es gibt nur `+Dmg` — kein `-Dmg`, keine Heilung, und `confirmEdit` (`ParticipantCard.jsx:47-60`) fasst `damage` nicht an. Vertippt bei „37" statt „7" → Monster löschen und neu anlegen. Verbündete haben `+Heil`, Monster nicht.
  **Fix:** `-Dmg`-Button analog zu `+Heil`, plus `damage` im Edit-Modus editierbar machen.

- [x] **4. Kein Error Boundary**
  Nirgends vorhanden. Jeder Render-Fehler weißt Tablet *oder* TV mitten in der Session ab. Besonders kritisch im Display-Modus, weil dort ungeprüfte Fremddaten gerendert werden: State ohne `participants` → `participants.filter` in `InitiativeTracker.jsx:63` crasht.
  **Fix:** `ErrorBoundary`-Komponente um `App` (und separat um den Display-Zweig) mit „Neu laden"-Button. Zusätzlich Shape-Validierung des empfangenen States vor `setDisplayState`.

---

## 🟠 Kategorie 2 — Sicherheit

- [x] **5. Das Relay ist komplett offen**
  `server.js` und der Cloudflare-Worker haben keine Authentifizierung und kein Raum-/Session-Konzept. Wer `wss://dnd-mietling-ws.janafisenko.workers.dev` kennt, bekommt beim Connect sofort den letzten State (Charaktername, HP, Zustände) und kann beliebige `STATE`-Nachrichten senden, die der TV ungefiltert übernimmt. `.workers.dev`-Hostnamen sind nicht geheim.
  **Fix:** Session-Token in der URL (`?room=<zufall>`), Worker relayt nur innerhalb eines Raums. Controller erzeugt den Raum, Display bekommt ihn per QR-Code (siehe Punkt 18).

- [x] **6. Kein Origin-Check beim Upgrade**
  `server.js:18-24` — WebSockets unterliegen nicht der Same-Origin-Policy. Jede Webseite im selben Browser kann `ws://localhost:3001` verbinden und mitlesen/injizieren.
  **Fix:** `req.headers.origin` gegen eine Allowlist prüfen, sonst `socket.destroy()`.

- [x] **7. Relay validiert nichts**
  `server.js:29-38` — jede geparste JSON wird 1:1 an alle Clients weitergereicht (nicht nur `STATE`/`COMPACT_SCROLL`), `lastState` wird unbegrenzt gespeichert, keine Größen- oder Ratenbegrenzung.
  **Fix:** Nachrichtentyp gegen eine Whitelist prüfen, Payload-Größe begrenzen, Rate-Limit pro Client. Zusätzlich clientseitig die State-Form prüfen (hängt mit Punkt 4 zusammen).

- [x] **8. Der Worker-Quellcode liegt nicht im Repo**
  `git ls-files` findet kein `worker/`. Die Komponente, die in Produktion die gesamte TV-Synchronisation trägt, ist nicht versioniert — nicht reviewbar, nicht reproduzierbar, bei Verlust nicht wiederherstellbar.
  **Fix:** `worker/` (inkl. `wrangler.toml`) ins Repo aufnehmen.
  **Erledigt:** `worker/src/index.js` + `worker/wrangler.toml` + `worker/README.md` neu geschrieben (Durable Object je Raum). ⚠️ Muss noch per `cd worker && npx wrangler deploy` ausgerollt werden — bis dahin läuft in Produktion der alte, raumlose Worker (funktioniert weiter, ignoriert aber `?room=`).

- [x] **9. Ungeschützte `localStorage`-Schreibzugriffe**
  `App.jsx:32`, `App.jsx:42`, `App.jsx:462` haben kein `try/catch` — anders als die übrigen. In Safari-Privatmodus oder bei vollem Speicher wirft `setItem`; da `savePlayerHP` bei *jeder* Teilnehmeränderung läuft, killt das die App bei jedem Klick.
  **Fix:** Einheitlicher `safeStorage`-Wrapper mit `try/catch` für alle Zugriffe.

---

## 🟡 Kategorie 3 — Logik & Stabilität

- [ ] **10. Reconnect spielt einen alten Soundeffekt ab**
  `App.jsx:388` — der Effekt hängt an `effectTrigger.nonce`. Verbindet sich der TV neu (oder wird „Ton aktivieren" gedrückt), liefert das Relay den gecachten State inkl. des zuletzt getriggerten Effekts; `undefined → nonce` ist eine Änderung, also knallt mitten in der Stille die letzte Explosion.
  **Fix:** Beim ersten empfangenen State den Nonce nur in einem Ref merken, nicht abspielen.

- [ ] **11. Manueller Platztausch wird von jedem `sort` zerstört**
  `addMonster`, `addAlly`, `duplicateMonsterWithColor` und `updateParticipant` (bei Initiative-Änderung) sortieren `participants` neu nach Initiative. Nach einem Kachel-Tausch (Tie-Resolution) reicht ein neues Monster, und der Tausch ist weg.
  **Fix:** Persistentes Sortierfeld (z. B. `order` oder `tieBreak`) statt reiner Array-Position; `sort` nach `initiative desc, order asc`.

- [ ] **12. Lautstärkeänderung während eines Fades geht verloren**
  `App.jsx:374` — `if (fadeRef.current) return` verwirft den Wert, statt ihn nach dem Fade nachzuziehen. Reglerbewegung in den 600 ms bleibt wirkungslos bis zur nächsten Änderung.
  **Fix:** Ziel-Lautstärke in einem Ref halten und am Fade-Ende anwenden.

- [ ] **13. Spieler-HP ist tote Mechanik**
  `makePlayer` legt `hp`/`maxHp` an, `savePlayerHP` persistiert sie, `loadPlayerHP` lädt sie — aber die Spieler-Kachel hat **keine HP-Anzeige und kein Schadensfeld**. Der Wert ändert sich nie. Folge: `p.hp <= 0` in `App.jsx:492` kann nie greifen (nur `p.dying`), der `🩸 Verwundet`-Chip erscheint bei Spielern nie, das `(30 HP)`-Label im Setup ist dekorativ.
  **Entscheidung nötig:** HP-Steuerung für Spieler ergänzen **oder** das Feld samt Persistenz entfernen. Aktueller Zustand ist irreführend.

- [ ] **14. Profil-Edit in der Kampfkachel persistiert nicht**
  Max HP über ✏️ in der Kachel ändern → nur im Kampf-State, nicht in `dnd-player-profiles`. Über das Setup dagegen schon. Zwei Wege, zwei Ergebnisse.
  **Fix:** Kachel-Edit bei Spielern zusätzlich `updatePlayerProfile` aufrufen (oder Max-HP dort sperren).

- [ ] **15. Alte Profile blockieren neue Spieler**
  `App.jsx:17-23` — sobald `dnd-player-profiles` existiert, wird `PLAYER_DEFAULTS` komplett ignoriert. Ein im Code ergänzter Charakter taucht bei niemandem auf, der die App schon benutzt hat. Kaputte Einträge ohne `maxHp` erzeugen `NaN`-HP.
  **Fix:** Merge nach `id` statt Ersetzen, plus Validierung/Defaults pro Feld. **Blockiert Punkt 26 (Sora).**

- [ ] **16. Kommentar widerspricht Code**
  `App.jsx:582-583`: „An active scene pauses during combat and resumes afterwards (if not stopped)." — `startCombat` und `resumeCombat` setzen aber `setAmbienceScene(null)`, die Szene kommt nie zurück.
  **Fix:** Entweder Kommentar korrigieren oder das Verhalten tatsächlich implementieren (Szene merken und nach Kampfende wiederherstellen).

---

## 🔵 Kategorie 4 — UX / UI

- [ ] **17. Kein Verbindungsstatus — auf keiner Seite**
  Der DM sieht am Tablet nicht, ob der TV überhaupt hört; der TV zeigt bei toter Verbindung stumm den alten Stand weiter. Bei einer Zwei-Geräte-App die wichtigste fehlende Anzeige.
  **Fix:** Punkt im Header aus `ws.readyState` + „letzter State vor Xs"; auf dem TV ein dezenter Hinweis, wenn > 15 s nichts kam.

- [ ] **18. Der Display-Modus ist nirgends auffindbar**
  `?mode=display` steht nur im Quelltext und in der Roadmap. Kein Button, kein QR-Code, kein Hinweis in der App.
  **Fix:** Im Setup ein „TV verbinden"-Panel mit vollständiger URL + QR-Code (kombinierbar mit dem Raum-Token aus Punkt 5).
  **Teilweise erledigt (mit Punkt 5):** `TvConnectPanel` im Setup zeigt die vollständige Adresse inkl. Raum-Code mit Kopieren-Button. Offen bleibt der QR-Code.

- [ ] **19. „Verwerfen" im Fortsetzen-Dialog löscht sofort**
  `App.jsx:657` — ein Tipp, keine Rückfrage, Kampf weg.
  **Fix:** Zweistufige Bestätigung oder „Rückgängig"-Toast für ein paar Sekunden.

- [ ] **20. Keine Safe-Area-Behandlung**
  `index.html` setzt `viewport-fit=cover`, aber in keiner CSS-Datei steht ein `env(safe-area-inset-*)`. Auf iPad/iPhone im Standalone-PWA-Modus liegt der Footer mit „Nächster Zug ▶" unter dem Home-Indicator.
  **Fix:** `padding-bottom: max(12px, env(safe-area-inset-bottom))` im Footer, analog oben/seitlich.

- [ ] **21. Zoom ist gesperrt**
  `maximum-scale=1.0, user-scalable=no` in `index.html`. Auf einem Tablet, das aus 1,5 m abgelesen wird, ein echtes Zugänglichkeitsproblem.
  **Fix:** `maximum-scale`/`user-scalable` entfernen; ungewolltes Scrollen ist bereits über `position: fixed` auf `html, body` abgefangen.

- [ ] **22. Setup-Screen kann oben abschneiden**
  `SessionSetup.css:20` — `margin: auto` auf einem Flex-Item in einem `overflow-y: auto`-Container: wird der Inhalt höher als der Viewport (Tablet quer, Soundboard offen), ist der obere Überhang nicht scrollbar.
  **Fix:** `margin: auto` ersetzen durch `margin-block: auto` + `justify-content: safe center` oder schlicht Padding.

- [ ] **23. Modals ohne Escape und ohne Fokus-Falle**
  `AddMonsterModal`, `ConditionsMenu`, `DuplicateMonsterModal`, Konzentrations-Modal — Enter bestätigt teilweise, Escape schließt nie (nur die Inline-Edit-Felder reagieren darauf). Kein Fokus-Trap, kein `role="dialog"`.
  **Fix:** Gemeinsame `Modal`-Hülle mit Escape-Handler, `role="dialog"`, `aria-modal`, Fokus-Trap und Fokus-Rückgabe.

- [ ] **24. Emoji-Buttons ohne `aria-label`**
  ✏️, ☠, ✕, ⧉, 🩸 haben nur `title`. Drag & Drop hat keine Tastatur-Alternative.
  **Fix:** `aria-label` überall ergänzen; für Reihenfolge zusätzlich „nach oben/unten"-Buttons im Edit-Modus.

- [ ] **25. Monster bei `damage >= maxHp` bekommt keinerlei Hinweis**
  Kein Auto-Vorschlag „besiegt?", nur der Zahlenvergleich in der Kachel.
  **Fix:** Kachel visuell markieren, sobald `damage >= maxHp` (z. B. pulsierender ☠-Button).

---

## 🧹 Kategorie 5 — Aufräumen & Spielrunde

- [ ] **26. Sora vollständig entfernen**
  Sora ist kein Mitglied der Spielrunde mehr.
  - [ ] Eintrag aus `PLAYER_DEFAULTS` in `App.jsx:13` löschen
  - [ ] **Migration:** Wegen Punkt 15 überschreiben gespeicherte `dnd-player-profiles` die Defaults — Sora bliebe auf allen bereits benutzten Geräten stehen. Beim Laden gespeicherte Profile gegen die Defaults abgleichen und nicht mehr existierende IDs verwerfen.
  - [ ] Verwaiste Einträge in `dnd-player-hp` und in einem evtl. gespeicherten `dnd-combat-state` mit aufräumen

- [ ] **27. `DeathSaveTracker` löschen**
  Wird nicht mehr gebraucht — das einfache Anhaken der gelungenen/misslungenen Rettungswürfe direkt in `ParticipantCard` reicht aus. Die Komponente ist ohnehin nirgends importiert.
  - [ ] `src/components/DeathSaveTracker.jsx` löschen
  - [ ] `src/components/DeathSaveTracker.css` löschen

- [ ] **28. `EVENT_SOUNDS` und doppelte Audio-Dateien**
  `soundboardData.jsx:365` wird nirgends importiert und verweist auf `defeat_outro.mp3`/`orchestral_win.mp3` auf R2, während `VictoryOverlay`/`DefeatOverlay` dieselben Dateien lokal aus `src/` importieren.
  **Fix:** `EVENT_SOUNDS` entfernen; eine Quelle für die beiden Dateien festlegen.

- [ ] **29. Toter `!displayOnly`-Block in `AmbienceScene`**
  Der Controller rendert die Szene nie, daher sind die Zurück-/Effekt-Steuerung und die Props `onBack`/`onPlayEffect` unerreichbar.
  **Fix:** Block und Props entfernen.

- [ ] **30. `p.exhaustion` wird geschrieben, aber nie gelesen**
  `setExhaustionLevel` pflegt das Feld parallel zu `conditions[].level`; gerendert wird nur letzteres, und `toggleCondition` setzt es beim Entfernen nicht zurück.
  **Fix:** Feld entfernen.

- [ ] **31. `VITE_WS_URL` in `.env.development` ist tot**
  Wird im Code nirgends gelesen — die URL kommt aus `/config.json`, mit `ws://hostname:3001` als Dev-Fallback.
  **Fix:** Entweder auslesen oder aus `.env.development` entfernen.

---

## ⚪ Kategorie 6 — Build, Deploy & Performance

- [ ] **32. Logo ist 2048×2048 px / 3,8 MB PNG**
  `src/assets/images/mietling.png` wird auf max. 400 px gerendert und ist größer als der gesamte restliche Build.
  **Fix:** Auf ~400–512 px skalieren und als WebP ausliefern (spart ~3,8 MB beim ersten TV-Start).

- [ ] **33. `vite` und `@vitejs/plugin-react` stehen in `dependencies`**
  Gehören in `devDependencies` — bläht die Produktions-Installation auf.

- [ ] **34. `server.js` Catch-all liefert `index.html` mit Status 200 für *jeden* Pfad**
  Auch für fehlende `.js`/`.mp3` — führt zu kryptischen MIME-Type-Fehlern statt einem klaren 404.
  **Fix:** Nur bei `Accept: text/html` bzw. für Nicht-Asset-Pfade ausliefern, sonst 404.

- [ ] **35. `vercel.json` setzt kein `Cache-Control` für `/config.json`**
  Die Datei kann am CDN veralten, obwohl der Service Worker sie korrekt network-first behandelt.
  **Fix:** Header-Regel analog zu `/sw.js` ergänzen.

- [ ] **36. `pub-*.r2.dev` ist Cloudflares Entwicklungs-Domain**
  Rate-limitiert, nicht für Produktion gedacht.
  **Fix:** Custom Domain am R2-Bucket, `CDN`-Konstante in `soundboardData.jsx:26` anpassen.

- [ ] **37. Roadmap-Drift**
  `docs/Roadmap.md` nennt Long-Press = 250 ms, im Code sind es 450 ms (`InitiativeTracker.jsx:274`). Die Szenen-Tabelle listet Höhle/Bibliothek/Schiff/Friedhof als ❌, obwohl alle vier in `VIDEO_SCENES` stehen.
  **Fix:** Roadmap mit dem Code abgleichen.
