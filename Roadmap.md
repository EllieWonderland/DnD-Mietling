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


---

Hinweis: Ich beginne jetzt mit Punkt 1 (Reaction-Toggle + Auto-Reset). Nach Fertigstellung markiere ich den Punkt als erledigt, committe und pushe die Änderung.
