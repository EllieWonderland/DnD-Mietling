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
| 3 | 🟡 Logik & Stabilität | 10–16 | ✅ erledigt |
| 4 | 🔵 UX / UI | 17–25 | ✅ erledigt |
| 5 | 🧹 Aufräumen & Spielrunde | 26–31 | ✅ erledigt |
| 6 | ⚪ Build, Deploy & Performance | 32–37 | ⚠️ bis auf 36 erledigt |
| 7 | 🎲 Spielrunde 2026-09-27 | 38–42 | ✅ erledigt |
| 8 | 🎯 Kampflogik & Karten (Review 2026-10-26) | 43–49 | ✅ erledigt |
| 9 | 🛠 Code, Betrieb & Performance (Review 2026-10-26) | 50–61 | ⏳ 50, 51, 55, 58 erledigt |
| 10 | 📱 Play Store | 62–72 | offen |

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

- [x] **10. Reconnect spielt einen alten Soundeffekt ab**
  `App.jsx:388` — der Effekt hängt an `effectTrigger.nonce`. Verbindet sich der TV neu (oder wird „Ton aktivieren" gedrückt), liefert das Relay den gecachten State inkl. des zuletzt getriggerten Effekts; `undefined → nonce` ist eine Änderung, also knallt mitten in der Stille die letzte Explosion.
  **Fix:** Beim ersten empfangenen State den Nonce nur in einem Ref merken, nicht abspielen.

- [x] **11. Manueller Platztausch wird von jedem `sort` zerstört**
  `addMonster`, `addAlly`, `duplicateMonsterWithColor` und `updateParticipant` (bei Initiative-Änderung) sortieren `participants` neu nach Initiative. Nach einem Kachel-Tausch (Tie-Resolution) reicht ein neues Monster, und der Tausch ist weg.
  **Fix:** Persistentes Sortierfeld (z. B. `order` oder `tieBreak`) statt reiner Array-Position; `sort` nach `initiative desc, order asc`.

- [x] **12. Lautstärkeänderung während eines Fades geht verloren**
  `App.jsx:374` — `if (fadeRef.current) return` verwirft den Wert, statt ihn nach dem Fade nachzuziehen. Reglerbewegung in den 600 ms bleibt wirkungslos bis zur nächsten Änderung.
  **Fix:** Ziel-Lautstärke in einem Ref halten und am Fade-Ende anwenden.

- [x] **13. Spieler-HP ist tote Mechanik**
  `makePlayer` legt `hp`/`maxHp` an, `savePlayerHP` persistiert sie, `loadPlayerHP` lädt sie — aber die Spieler-Kachel hat **keine HP-Anzeige und kein Schadensfeld**. Der Wert ändert sich nie. Folge: `p.hp <= 0` in `App.jsx:492` kann nie greifen (nur `p.dying`), der `🩸 Verwundet`-Chip erscheint bei Spielern nie, das `(30 HP)`-Label im Setup ist dekorativ.
  **Entscheidung nötig:** HP-Steuerung für Spieler ergänzen **oder** das Feld samt Persistenz entfernen. Aktueller Zustand ist irreführend.
  **Entschieden am 2026-08-30: entfernen.** `hp`/`maxHp` aus `makePlayer` und `PLAYER_DEFAULTS`, `savePlayerHP`/`loadPlayerHP` samt `dnd-player-hp` (wird beim Start einmalig gelöscht), Max-HP-Feld im Setup und in der Spieler-Kachel, `(x HP)`-Label und der nie erreichbare 🩸-Chip bei Spielern. Spielerzustand läuft nur noch über Todeswürfe/Gefallen; Monster und Verbündete behalten ihre HP.

- [x] **14. Profil-Edit in der Kampfkachel persistiert nicht**
  Max HP über ✏️ in der Kachel ändern → nur im Kampf-State, nicht in `dnd-player-profiles`. Über das Setup dagegen schon. Zwei Wege, zwei Ergebnisse.
  **Fix:** Kachel-Edit bei Spielern zusätzlich `updatePlayerProfile` aufrufen (oder Max-HP dort sperren).

- [x] **15. Alte Profile blockieren neue Spieler**
  `App.jsx:17-23` — sobald `dnd-player-profiles` existiert, wird `PLAYER_DEFAULTS` komplett ignoriert. Ein im Code ergänzter Charakter taucht bei niemandem auf, der die App schon benutzt hat. Kaputte Einträge ohne `maxHp` erzeugen `NaN`-HP.
  **Fix:** Merge nach `id` statt Ersetzen, plus Validierung/Defaults pro Feld. **Blockiert Punkt 26 (Sora).**

- [x] **16. Kommentar widerspricht Code**
  `App.jsx:582-583`: „An active scene pauses during combat and resumes afterwards (if not stopped)." — `startCombat` und `resumeCombat` setzen aber `setAmbienceScene(null)`, die Szene kommt nie zurück.
  **Fix:** Entweder Kommentar korrigieren oder das Verhalten tatsächlich implementieren (Szene merken und nach Kampfende wiederherstellen).

---

## 🔵 Kategorie 4 — UX / UI

- [x] **17. Kein Verbindungsstatus — auf keiner Seite**
  Der DM sieht am Tablet nicht, ob der TV überhaupt hört; der TV zeigt bei toter Verbindung stumm den alten Stand weiter. Bei einer Zwei-Geräte-App die wichtigste fehlende Anzeige.
  **Fix:** Punkt im Header aus `ws.readyState` + „letzter State vor Xs"; auf dem TV ein dezenter Hinweis, wenn > 15 s nichts kam.

- [x] **18. Der Display-Modus ist nirgends auffindbar**
  `?mode=display` steht nur im Quelltext und in der Roadmap. Kein Button, kein QR-Code, kein Hinweis in der App.
  **Fix:** Im Setup ein „TV verbinden"-Panel mit vollständiger URL + QR-Code (kombinierbar mit dem Raum-Token aus Punkt 5).
  **Erledigt:** `TvConnectPanel` im Setup zeigt QR-Code, vollständige Adresse inkl. Raum-Code, Kopieren-Button und „Neuer Raum-Code". QR über `qrcode-generator` (neue Abhängigkeit, ohne eigene Abhängigkeiten).

- [x] **19. „Verwerfen" im Fortsetzen-Dialog löscht sofort**
  `App.jsx:657` — ein Tipp, keine Rückfrage, Kampf weg.
  **Fix:** Zweistufige Bestätigung oder „Rückgängig"-Toast für ein paar Sekunden.

- [x] **20. Keine Safe-Area-Behandlung**
  `index.html` setzt `viewport-fit=cover`, aber in keiner CSS-Datei steht ein `env(safe-area-inset-*)`. Auf iPad/iPhone im Standalone-PWA-Modus liegt der Footer mit „Nächster Zug ▶" unter dem Home-Indicator.
  **Fix:** `padding-bottom: max(12px, env(safe-area-inset-bottom))` im Footer, analog oben/seitlich.

- [x] **21. Zoom ist gesperrt**
  `maximum-scale=1.0, user-scalable=no` in `index.html`. Auf einem Tablet, das aus 1,5 m abgelesen wird, ein echtes Zugänglichkeitsproblem.
  **Fix:** `maximum-scale`/`user-scalable` entfernen; ungewolltes Scrollen ist bereits über `position: fixed` auf `html, body` abgefangen.

- [x] **22. Setup-Screen kann oben abschneiden**
  `SessionSetup.css:20` — `margin: auto` auf einem Flex-Item in einem `overflow-y: auto`-Container: wird der Inhalt höher als der Viewport (Tablet quer, Soundboard offen), ist der obere Überhang nicht scrollbar.
  **Fix:** `margin: auto` ersetzen durch `margin-block: auto` + `justify-content: safe center` oder schlicht Padding.

- [x] **23. Modals ohne Escape und ohne Fokus-Falle**
  `AddMonsterModal`, `ConditionsMenu`, `DuplicateMonsterModal`, Konzentrations-Modal — Enter bestätigt teilweise, Escape schließt nie (nur die Inline-Edit-Felder reagieren darauf). Kein Fokus-Trap, kein `role="dialog"`.
  **Fix:** Gemeinsame `Modal`-Hülle mit Escape-Handler, `role="dialog"`, `aria-modal`, Fokus-Trap und Fokus-Rückgabe.

- [x] **24. Emoji-Buttons ohne `aria-label`**
  ✏️, ☠, ✕, ⧉, 🩸 haben nur `title`. Drag & Drop hat keine Tastatur-Alternative.
  **Fix:** `aria-label` überall ergänzen; für Reihenfolge zusätzlich „nach oben/unten"-Buttons im Edit-Modus.

- [x] **25. Monster bei `damage >= maxHp` bekommt keinerlei Hinweis**
  Kein Auto-Vorschlag „besiegt?", nur der Zahlenvergleich in der Kachel.
  **Fix:** Kachel visuell markieren, sobald `damage >= maxHp` (z. B. pulsierender ☠-Button).

---

## 🧹 Kategorie 5 — Aufräumen & Spielrunde

- [x] **26. Sora vollständig entfernen**
  Sora ist kein Mitglied der Spielrunde mehr.
  - [x] Eintrag aus `PLAYER_DEFAULTS` in `App.jsx:13` löschen
  - [x] **Migration:** Wegen Punkt 15 überschreiben gespeicherte `dnd-player-profiles` die Defaults — Sora bliebe auf allen bereits benutzten Geräten stehen. Beim Laden gespeicherte Profile gegen die Defaults abgleichen und nicht mehr existierende IDs verwerfen.
  - [x] Verwaiste Einträge in `dnd-player-hp` und in einem evtl. gespeicherten `dnd-combat-state` mit aufräumen

- [x] **27. `DeathSaveTracker` löschen**
  Wird nicht mehr gebraucht — das einfache Anhaken der gelungenen/misslungenen Rettungswürfe direkt in `ParticipantCard` reicht aus. Die Komponente ist ohnehin nirgends importiert.
  - [x] `src/components/DeathSaveTracker.jsx` löschen
  - [x] `src/components/DeathSaveTracker.css` löschen

- [x] **28. `EVENT_SOUNDS` und doppelte Audio-Dateien**
  `soundboardData.jsx:365` wird nirgends importiert und verweist auf `defeat_outro.mp3`/`orchestral_win.mp3` auf R2, während `VictoryOverlay`/`DefeatOverlay` dieselben Dateien lokal aus `src/` importieren.
  **Fix:** `EVENT_SOUNDS` entfernen; eine Quelle für die beiden Dateien festlegen.
  **Erledigt:** `EVENT_SOUNDS` entfernt. Einzige Quelle bleibt das Bundle (`src/orchestral_win.mp3`, `src/defeat_outro.mp3`), direkt importiert von den Overlays.

- [x] **29. Toter `!displayOnly`-Block in `AmbienceScene`**
  Der Controller rendert die Szene nie, daher sind die Zurück-/Effekt-Steuerung und die Props `onBack`/`onPlayEffect` unerreichbar.
  **Fix:** Block und Props entfernen.

- [x] **30. `p.exhaustion` wird geschrieben, aber nie gelesen**
  `setExhaustionLevel` pflegt das Feld parallel zu `conditions[].level`; gerendert wird nur letzteres, und `toggleCondition` setzt es beim Entfernen nicht zurück.
  **Fix:** Feld entfernen.

- [x] **31. `VITE_WS_URL` in `.env.development` ist tot**
  Wird im Code nirgends gelesen — die URL kommt aus `/config.json`, mit `ws://hostname:3001` als Dev-Fallback.
  **Fix:** Entweder auslesen oder aus `.env.development` entfernen.
  **Erledigt:** `.env.development` gelöscht. Der Dev-Fallback `ws://<hostname>:3001` bleibt — er baut die Adresse absichtlich aus dem aktuellen Hostnamen, damit ein Tablet im WLAN den Dev-Rechner erreicht und nicht sich selbst.

---

## ⚪ Kategorie 6 — Build, Deploy & Performance

- [x] **32. Logo ist 2048×2048 px / 3,8 MB PNG**
  `src/assets/images/mietling.png` wird auf max. 400 px gerendert und ist größer als der gesamte restliche Build.
  **Fix:** Auf ~400–512 px skalieren und als WebP ausliefern (spart ~3,8 MB beim ersten TV-Start).
  **Erledigt:** `mietling.webp`, 512×512, 83 kB. Die PNG-Datei ist gelöscht, Service-Worker-Cache auf `v6` angehoben.

- [x] **33. `vite` und `@vitejs/plugin-react` stehen in `dependencies`**
  Gehören in `devDependencies` — bläht die Produktions-Installation auf.

- [x] **34. `server.js` Catch-all liefert `index.html` mit Status 200 für *jeden* Pfad**
  Auch für fehlende `.js`/`.mp3` — führt zu kryptischen MIME-Type-Fehlern statt einem klaren 404.
  **Fix:** Nur bei `Accept: text/html` bzw. für Nicht-Asset-Pfade ausliefern, sonst 404.

- [x] **35. `vercel.json` setzt kein `Cache-Control` für `/config.json`**
  Die Datei kann am CDN veralten, obwohl der Service Worker sie korrekt network-first behandelt.
  **Fix:** Header-Regel analog zu `/sw.js` ergänzen.

- [ ] **36. `pub-*.r2.dev` ist Cloudflares Entwicklungs-Domain**
  Rate-limitiert, nicht für Produktion gedacht.
  **Fix:** Custom Domain am R2-Bucket, `CDN`-Konstante in `soundboardData.jsx:26` anpassen.
  **Vorbereitet, aber offen:** Die Konstante liest jetzt `VITE_CDN_URL` und fällt auf die bisherige `pub-*.r2.dev`-Adresse zurück. **Noch zu tun (nur im Cloudflare-Konto möglich):** Custom Domain am R2-Bucket einrichten und `VITE_CDN_URL=https://<domain>` als Build-Variable in Vercel setzen. Danach kann dieser Punkt abgehakt werden.

- [x] **37. Roadmap-Drift**
  `docs/Roadmap.md` nennt Long-Press = 250 ms, im Code sind es 450 ms (`InitiativeTracker.jsx:274`). Die Szenen-Tabelle listet Höhle/Bibliothek/Schiff/Friedhof als ❌, obwohl alle vier in `VIDEO_SCENES` stehen.
  **Fix:** Roadmap mit dem Code abgleichen.
  **Erledigt:** Long-Press auf 450 ms korrigiert; Höhle, Bibliothek, Schiff und Burg auf ✅ gesetzt; Friedhof, Kerker, Waldrand, Mondnacht, Mondmeer und Nachtregen als fehlende Zeilen ergänzt.

---

## 🎲 Kategorie 7 — Befunde aus der Spielrunde (2026-09-27)

- [x] **38. Vahlok wird falsch geschrieben**
  Default-Name war „Vhahlhohkh".
  **Erledigt:** Name auf „Vahlok" (id bleibt `vhahlhohkh`, damit gespeicherte Kämpfe passen). Ein gespeichertes Profil mit dem alten Default-Namen wird ignoriert; „Kampf fortsetzen" übernimmt Spielernamen aus den Profilen.

- [x] **39. Verbündete brauchen einen direkten Besiegt-Button**
  Bisher nur über 0 HP und drei misslungene Todeswürfe.
  **Erledigt:** ☠ neben -Dmg/+Heil und bei 0 HP neben den Todeswürfen. Die Karte bleibt ausgegraut stehen, „Wiederbeleben" setzt auf 1 HP.

- [x] **40. Aktiver Zug zu schwach markiert; Konzentration/Versteckt/Fliegend ebenso**
  Der Rahmen hatte die Farbe des Kartentyps (gold auf gold beim Spieler).
  **Erledigt:** Eigene „Am Zug"-Farbe (`--turn-ring`, warmes Weiß) für Karte und Leiste, dazu ein „▶ Am Zug"-Reiter. Aktive Status-Chips sind jetzt vollflächig gefüllt, auf dem TV größer; Konzentration/Versteckt/Fliegend stehen zusätzlich als Symbol in der Reihenfolge-Leiste.

- [x] **41. Verbündete brauchen Farbringe**
  **Erledigt:** Farbring beim Hinzufügen und im Bearbeiten-Modus, Anzeige auf Karte und in der Leiste.

- [x] **42. TV-Ansicht nicht scrollbar, untere Zeilen verschwinden**
  **Erledigt:** Der TV scrollt nicht mehr, sondern passt alles ein: Karten werden per `zoom` verkleinert (bis 50 %), die Liste wechselt auf zwei Spalten, sobald eine Spalte unter 80 % schrumpfen müsste. Die Leiste rechts schrumpft genauso. Erst wenn selbst das nicht reicht, greift das bisherige Mitscrollen zum aktiven Teilnehmer.

---

## Entschieden — bleibt so (Review 2026-10-26)

Damit diese Punkte nicht bei jedem Review neu aufkommen:

- **Initiative mindestens 1.** Werte ≤ 0 werden weiterhin auf 1 gesetzt.
- **Monster zählen Schaden hoch, statt HP herunter.** Die App wird von jemandem aus der Spielrunde bedient, nicht vom DM — die HP der Monster sind am Tisch unbekannt. Max HP bleibt optional.
- **Keine Konzentration für Monster und Verbündete.** Ob ein NPC konzentriert ist, weiß nur der DM.

---

## 🎯 Kategorie 8 — Kampflogik & Karten (Review 2026-10-26)

- [x] **43. Neues Monster / neuer Verbündeter verschiebt den aktiven Zug**
  `InitiativeTracker.jsx:246-307` — `addMonster`, `addAlly` und `duplicateParticipant` sortieren per `insertByInitiative` ein, lassen `activeIndex` aber stehen. Beispiel: A(20), B(15), C(10), C am Zug → Monster mit Init 18 dazu → B ist wieder am Zug.
  **Fix:** Wie in `updateParticipant`: aktive ID vorher merken, danach neu suchen. Langfristig `activeId` statt `activeIndex` speichern (Autosave-Migration beachten).
  **Erledigt:** Hinzufügen, Duplizieren und Initiative-Ändern laufen über `setParticipantsKeepingTurn` — wer am Zug ist, bleibt am Zug. Ausnahme vor dem ersten Zug (solange Plätze noch tauschbar sind): Dann beginnt weiter der Oberste der Liste, damit ein nach Kampfstart angelegtes Monster mit hoher Initiative in Runde 1 nicht übersprungen wird. Die Umstellung auf `activeId` bleibt offen. Der Filter „wer hat Züge" steht jetzt an einer Stelle (`turnOrder`) — dort setzt Punkt 44 an.

- [x] **44. Gefallene Spieler/Verbündete bekommen „Geisterzüge"**
  `visible` (`InitiativeTracker.jsx:170`) blendet nur tote Monster aus. Tote Spieler/Verbündete bleiben in der Zugfolge, werden aber nirgends hervorgehoben (`isActive && !p.dead`) — ein Druck auf „Nächster Zug" geht ins Leere.
  **Fix:** `handleNextTurn`/`handlePrevTurn` überspringen Teilnehmer mit `dead`. Rundenwechsel dabei korrekt zählen.
  **Erledigt:** Neue reine Funktion `stepTurn` (vor/zurück, überspringt Gefallene, zählt den Rundenwechsel beim Überlaufen; Kandidat für die Tests aus Punkt 53). „◀ Zurück" ist gesperrt, wenn in Runde 1 vor dem aktiven Zug nur Gefallene stehen. Verlässt der aktive Teilnehmer die Zugfolge (✕, ☠ beim Monster), übernimmt der nächste noch Stehende dieser Runde — `removeAlly`, `removeMonster` und `killMonster` teilen sich dafür `setParticipantsLeaving` statt dreifach kopierter Indexlogik. Stirbt jemand während des eigenen Zugs, bleibt der Zug bis „Nächster Zug" bei ihm (ohne Hervorhebung).

- [x] **45. ☠ beim Monster ist sofort endgültig**
  `ParticipantCard.jsx:699-704` — keine Rückfrage (✕ daneben hat eine), danach verschwindet die Karte ohne Weg zurück. Beim letzten Monster folgt die Siegesfanfare; „Doch weiterkämpfen" hilft nicht, das Monster bleibt tot.
  **Fix:** Zwei-Tipp-Bestätigung wie bei ✕ **und** tote Monster in der rechten Leiste antippbar → „Wiederbeleben".
  **Erledigt:** ☠ beim Monster zeigt erst „Besiegt?", der zweite Tipp besiegt (✕ und ☠ teilen sich `confirmTwice`). Besiegte Monster sind in der rechten Leiste ein Button: erster Tipp „↺ Wiederbeleben?", zweiter holt das Monster mit seinem bisherigen Schaden an den alten Platz zurück; wer am Zug ist, bleibt am Zug. Nach „Doch weiterkämpfen" kann so auch das letzte Monster zurückgeholt werden.

- [x] **46. Alter Soundeffekt nach „Ton aktivieren"**
  `App.jsx:519-534` — ein Effekt, der ausgelöst wird, bevor am TV „Ton aktivieren" gedrückt wurde, wird beim Entsperren nachgespielt (Nonce wird nur bei `audioUnlocked` gemerkt). Variante von Punkt 10.
  **Fix:** Nonce auch ohne `audioUnlocked` in `lastEffectNonceRef` mitführen, nur das Abspielen hängt am Unlock.
  **Erledigt:** Der Effekt-Hook merkt sich jeden neuen Nonce sofort und bricht erst danach ab, solange der Ton gesperrt ist. Beim Entsperren ist der Nonce schon bekannt, nichts wird nachgespielt.

- [x] **47. HP bei Verbündeten entfernen**
  Hat sich in der Spielrunde als unnötig erwiesen — jeder zählt seine HP selbst. Verbündete werden damit wie Spieler behandelt (analog Punkt 13):
  - `hp`/`maxHp` aus `addAlly`, `duplicateParticipant`, Edit-Modus und `AddMonsterModal` (bei `isAlly`) entfernen; -Dmg/+Heil-Leiste weg.
  - Todeswürfe über einen „☠ Todeswürfe"-Button wie beim Spieler statt über 0 HP; „Stabil" bzw. 3 Erfolge beenden sie.
  - ☠ Besiegt, ausgegraute Karte und Wiederbeleben bleiben; „Wiederbeleben" setzt keine HP mehr.
  - Der nie gesetzte 🩸-Chip bei Verbündeten entfällt.
  - Gespeicherte Kämpfe mit `hp` bei Verbündeten müssen weiter laden (Felder einfach ignorieren).
  **Erledigt:** Spieler und Verbündete teilen sich jetzt ein Kartenlayout. Verbündete haben kein HP-Feld mehr (weder beim Hinzufügen noch im Bearbeiten-Modus), bekommen „☠ Todeswürfe“ und „💚 Stabil“ wie die Spieler; ⧉, ☠ und ✕ stehen am Ende der Chip-Zeile. `loadCombatState` macht aus einem alten Verbündeten mit 0 HP einen mit laufenden Todeswürfen, übrige `hp`/`maxHp` bleiben unbeachtet liegen.

- [x] **48. Versteckt und Fliegend auch für Monster und Verbündete**
  Bisher nur bei Spielern. Konzentration und Gesegnet bleiben spielerexklusiv (siehe „Entschieden").
  **Fix:** Die beiden Chips auf allen Karten; die Symbole in der rechten Leiste gibt es bereits für alle Typen.
  **Erledigt:** Über `STATUS_TOGGLES` in `ParticipantCard.jsx`; Konzentration und Gesegnet sind dort als `playerOnly` markiert.

- [x] **49. „besiegt?" erscheint auch am TV**
  `ParticipantCard.jsx:666` ist nicht auf `!displayOnly` beschränkt. Die Spieler sehen den Hinweis, bevor am Tablet entschieden wurde. Nur relevant, wenn Max HP eingetragen ist.
  **Optionen:** Hinweis nur am Tablet zeigen **oder** so lassen.
  **Entschieden am 2026-10-26: nur am Tablet.** Hinweis, roter Kartenrahmen und pulsierender ☠ hängen alle an `monsterDown`, das am TV jetzt immer falsch ist.

---

## 🛠 Kategorie 9 — Code, Betrieb & Performance (Review 2026-10-26)

- [x] **50. Erschöpfungsstufe nur bei Spielern sichtbar**
  Bei Verbündeten und Monstern zeigt der Chip nur „Erschöpfung" ohne Stufe. Folge von Punkt 51.
  **Erledigt:** Mit 51 behoben, alle Karten zeigen die Stufe.

- [x] **51. Copy-Paste in `ParticipantCard.jsx`**
  Zustands-Chips 3×, Todeswürfe 2×, Entfernen-Button 3× — die Abweichungen zwischen den Kartentypen (Punkte 50, 47) entstehen genau dort.
  **Fix:** `ConditionChips`, `DeathSaves`, `RemoveButton` als eigene Komponenten. Am besten zusammen mit 47/48 umsetzen.
  **Erledigt:** Die drei Bausteine stehen oben in `ParticipantCard.jsx` und werden von allen Kartentypen benutzt.

- [ ] **52. `App.jsx` macht zu viel**
  837 Zeilen: Relay, TV-Audio, Persistenz und drei Display-Screens mit Inline-Styles.
  **Fix:** `useRelay()` und `useTvAudio()` als Hooks auslagern, Display-Wartebildschirme als Komponente mit CSS-Datei.

- [ ] **53. Keine Tests, kein Linter**
  **Fix:** Vitest für die reinen Funktionen (`insertByInitiative`, `swapPlaces`, `orderedList`, Zugwechsel inkl. 43/44, `loadPlayerProfiles`, `isValidDisplayState`, `findBestTrack`). ESLint mit `react-hooks`-Regeln.

- [ ] **54. Relay-Logik doppelt (`server.js` und Worker)**
  Typen-Whitelist, Limits und Raum-Regex müssen von Hand synchron gehalten werden.
  **Fix:** Gemeinsames Modul (z. B. `relay/rules.js`), das beide importieren — Wrangler bündelt Importe außerhalb von `worker/` mit.

- [x] **55. `render.yaml` ist tot**
  Render wird nicht mehr genutzt. **Erledigt:** Datei gelöscht.

- [ ] **56. `npm audit`: 4 Lücken (1 kritisch, 2 hoch)**
  `ws`, `body-parser`, `proxy-addr`, `qs` — betrifft nur `server.js` (lokaler Dev-Relay).
  **Fix:** `npm audit fix` (ohne Breaking Changes), danach `npm run dev:all` testen.

- [ ] **57. `ALLOWED_ORIGINS` im Worker ist leer**
  `worker/wrangler.toml` — der Origin-Check ist in Produktion damit aus.
  **Fix:** Vercel-Domain (und ggf. spätere eigene Domain) eintragen, `npx wrangler deploy`. Hinweis: Wer den TV-Link hat, kann auch `STATE` senden — für den Einsatz am Tisch vertretbar.

- [x] **58. TV rendert alle 4 s komplett neu**
  Der Heartbeat schickt identischen State, `setDisplayState` bekommt trotzdem ein neues Objekt, `fitTvList` misst das Layout jedes Mal mehrfach neu. Auf schwachen TV-Browsern spürbar.
  **Fix:** Empfangenes JSON mit dem zuletzt angewendeten vergleichen und Duplikate verwerfen.
  **Erledigt am 2026-10-30:** Beide Empfangswege vergleichen den vollständigen State vor Normalisierung und React-Update mit dem zuletzt angewendeten JSON. Identische Heartbeats und doppelte Zustellungen über WebSocket/BroadcastChannel lösen kein Karten-Rendering und keine Layout-Messung mehr aus; die Empfangszeit für Verbindungsanzeige und Watchdog wird weiterhin aktualisiert. Änderungen inklusive neuer Soundeffekt-Nonce werden weiter übernommen.

- [ ] **59. Lautstärkeregler kann das Rate-Limit reißen**
  Jede Reglerbewegung schickt den vollen State, das Relay verwirft alles über 60 Nachrichten/s. Der letzte Wert kommt erst mit dem nächsten Heartbeat an.
  **Fix:** Senden drosseln (z. B. max. alle 100 ms, letzter Wert gewinnt).

- [ ] **60. Soundeffekte mit Verzögerung beim ersten Abspielen**
  `App.jsx:529` erzeugt pro Auslösung `new Audio(url)`, der Service Worker cached Medien nicht.
  **Fix:** Beim „Ton aktivieren" alle Effekte vorladen (oder als Web-Audio-Buffer dekodieren).

- [ ] **61. Kleinkram Build & Dateien**
  - Umlaute/Leerzeichen in Mediendateinamen (`höhle.mp4`, `tür öffnen.mp3`, `Holy Spell.mp3` …) → ASCII-Namen, manche TV-Browser sind da empfindlich. R2-Dateien mit umbenennen.
  - Service-Worker-Cache wird von Hand versioniert (`v6`); alte gehashte Assets sammeln sich bis zum nächsten Hochzählen. Bei Punkt 68 ggf. auf `vite-plugin-pwa` umstellen.
  - `.env.development` ist wieder da (untracked), `VITE_WS_URL` wird weiter nirgends gelesen (siehe Punkt 31) → löschen.

---

## 📱 Kategorie 10 — Play Store

Ziel: Die App für beliebige Spielrunden anbieten. Der Weg ist eine **Trusted Web Activity (TWA)** — die bestehende PWA wird in eine Android-Hülle verpackt, die Website bleibt die eigentliche App (der TV braucht sie ohnehin als URL).

- [ ] **62. Gruppe frei eintragen statt fester Spielerliste**
  `PLAYER_DEFAULTS`, `RETIRED_DEFAULT_NAMES` und der Platzhalter „Neuer Spieler" sind auf die eigene Runde zugeschnitten.
  - Erster Start ohne gespeicherte Gruppe → „Eure Gruppe"-Bildschirm: Namen eintragen, hinzufügen, entfernen, umbenennen. Gespeichert in `dnd-player-profiles` (bleibt auf dem Gerät).
  - Neue Spieler bekommen eine zufällige ID (nicht der Name — Umbenennen darf gespeicherte Kämpfe nicht brechen).
  - Im Setup jederzeit bearbeitbar; Entfernen mit Rückfrage.
  - `loadCombatState` prüft gegen die gespeicherte Gruppe statt gegen `PLAYER_DEFAULTS`.
  - Leere Gruppe: „Kampf beginnen" erst möglich, wenn mindestens ein Spieler ausgewählt ist (gibt es schon) und ein Hinweis, wenn keiner existiert.
  - **Migration der eigenen Geräte:** Die alten IDs (`athania`, `delat`, …) einmalig als Gruppe übernehmen, wenn das Gerät die App schon benutzt hat (z. B. erkennbar an `dnd-room-id` oder `dnd-combat-state`) — sonst einfach neu eintragen.

- [ ] **63. Gruppe sichern (optional)**
  In der TWA liegt `localStorage` im Chrome-Speicher des Geräts. „Chrome-Daten löschen" löscht auch die Gruppe.
  **Fix:** Export/Import als JSON-Datei oder als Code zum Abtippen.

- [ ] **64. Name „DnD" — Markenrecht** — *Entscheidung nötig*
  „D&D"/„Dungeons & Dragons" ist eine Marke von Wizards of the Coast. Google lehnt Apps, die fremde Marken im Namen tragen, häufig ab.
  **Fix:** Neutraler Name, z. B. „Mietling — Initiative-Tracker", in der Beschreibung höchstens „für Pen & Paper / 5e-kompatibel". Betrifft Manifest, `index.html`, Store-Eintrag, Logo-Alt-Texte.

- [ ] **65. Lizenzen aller Medien prüfen und dokumentieren**
  Musik, Videos und Soundeffekte stammen aus verschiedenen Quellen (Pixabay-Dateinamen u. a.). Für eine öffentliche App muss jede Datei eine Lizenz haben, die die Nutzung in einer verteilten App erlaubt.
  **Fix:** Tabelle Datei → Quelle → Lizenz (z. B. in `docs/`), unklare Dateien ersetzen, Credits-Seite in der App.

- [ ] **66. Google Fonts selbst hosten**
  `index.html` lädt Cinzel/Montserrat von Google — überträgt die IP an Google (DSGVO-Thema) und funktioniert offline nicht.
  **Fix:** Fonts als WOFF2 ins Bundle.

- [ ] **67. Datenschutzerklärung, Impressum, Data-Safety-Formular**
  Play verlangt eine öffentlich erreichbare Datenschutzerklärung, auch ohne Konten. Inhalt: lokale Speicherung, Relay über Cloudflare (Namen, Zustände, Schaden werden während der Session übertragen und nur flüchtig im Speicher gehalten), Medien von R2, Vercel-Hosting.
  Impressumspflicht (§ 5 DDG) für eine kostenlose App prüfen. Im Play-Console-Formular „Datensicherheit" ehrlich angeben, dass Daten übertragen, aber nicht gespeichert/geteilt werden.

- [ ] **68. TWA-Paket bauen**
  - Manifest: PNG-Icons 192 und 512 px (Play akzeptiert kein SVG), eigenes `maskable`-Icon statt `"any maskable"` auf derselben Datei, `id`, Screenshots-Feld.
  - `/.well-known/assetlinks.json` (Digital Asset Links) unter der App-Domain, sonst zeigt die App eine Browser-Adressleiste.
  - Paket mit Bubblewrap oder PWABuilder erzeugen, Signaturschlüssel sicher aufbewahren (bei Verlust kein Update mehr möglich — Play App Signing nutzen).
  - Eigene Domain statt `*.vercel.app` empfohlen (unabhängig von Vercel, schönere TV-Adresse).

- [ ] **69. Android-Zurück-Taste**
  Die SPA hat keine History-Einträge — „Zurück" schließt die App mitten im Kampf (Autosave rettet den Stand, aber unschön). Offene Dialoge sollten per Zurück schließen.
  **Fix:** Für Kampf und Modals History-Einträge setzen und `popstate` behandeln.

- [ ] **70. Relay und CDN für öffentliche Nutzung**
  - Punkt 36 (eigene Domain für R2) wird Pflicht — `r2.dev` ist rate-limitiert.
  - Worker auf die WebSocket-Hibernation-API umstellen (`state.acceptWebSocket`), damit Durable Objects bei vielen Runden nicht durchgehend laufen; Free-Tier-Limits und Kosten im Blick behalten.
  - Ohne konfiguriertes Relay muss die App weiter sauber ohne TV funktionieren (tut sie, bitte nach 62 erneut testen).

- [ ] **71. Play Console**
  - Entwicklerkonto (einmalig 25 US-$), Identitätsprüfung.
  - Neue private Konten: geschlossener Test mit mindestens 12 Testern über 14 Tage, bevor die Produktion freigegeben wird — die eigene Spielrunde kann das sein.
  - Store-Eintrag: Beschreibung, Screenshots Handy + Tablet (7"/10"), Feature-Grafik 1024×500, Altersfreigabe-Fragebogen (IARC), Zielgruppe (nicht für Kinder → keine Familien-Richtlinien), Kategorie.

- [ ] **72. Texte und Annahmen der eigenen Runde verallgemeinern**
  Hinweistexte, die das Setup der eigenen Gruppe voraussetzen, beim Durchgehen für Fremde verständlich machen (z. B. ein kurzer Erklär-Bildschirm „Tablet + TV" beim ersten Start).
