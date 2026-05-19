D&D Initiative Tracker "DnD Mietling"
Ziel: Erstelle eine Tablet-optimierte Web-App (Responsive Design, Fokus auf Landscape), die als zentrales Dashboard für eine D&D (PHB 2024) Gruppe dient. Die App wird flach auf den Tisch gelegt und ist für alle Spieler lesbar.

1. Grund-Setup & Teilnehmer:

Spieler-Management: Hinterlege 5 feste Spieler-Profile: Athania, Delat, Tharion, Sora und Vhahlhohkh.

Session-Start: Ein Startbildschirm zeigt Checkboxen für diese 5 Profile. Nur markierte Spieler erscheinen im Tracker.

Monster-Management: Ein permanenter "Add Monster"-Button (Floating Action Button oder fixe Zeile), um jederzeit neue Gegner (Name + Initiative) hinzuzufügen. Button zum Duplizieren von Monstern für Horden-Kämpfe.

2. Layout & Design (D&D-Aesthetic):

Farbschema: Dunkles Pergament-Design. Goldene Akzente für Spieler, tiefes Dunkelrot für Monster. Inaktive Spieler in dezentem Grau.

Lesbarkeit: Große, serifenlose, kontrastreiche Schriftarten (z.B. Roboto oder Montserrat). HP- und Schadenszahlen müssen aus 1,5m Entfernung lesbar sein.

Timeline: Eine vertikale Liste, die den gesamten Bildschirm nutzt. Der aktive Teilnehmer wird durch einen leuchtenden Rahmen und eine leichte Vergrößerung hervorgehoben.

3. Funktionalitäten & PHB 2024 Regeln:

Rundenzähler: Oben zentriert. Ein "Next Round"-Button am Ende der Liste setzt Runde +1 und alle "Reaktions-Toggles" der Spieler zurück.

Initiative-Logik: Drag-and-Drop der Kacheln innerhalb desselben Initiative-Werts (für Tie-Resolution).

Schadens-Tracking:

Spieler: Aktuelle HP / Max HP. Numpad-Eingabe für + und -. Bei 0 HP automatischer Wechsel zu Death Save Tracker (3 Erfolge/Fehlschläge).

Monster: Startet bei 0. Numpad-Eingabe addiert erlittenen Schaden auf. Ein manueller "Bloodied"-Toggle färbt die Kachel rot. Ein "Delete/Kill"-Button entfernt das Monster.

Reminder-System:

Konzentration: Toggle-Icon. Wenn aktiv und Schaden eingetragen wird -> Popup: "Konzentrationswurf! DC [Hälfte des Schadens, min. 10]".

Reaktion: Blitz-Icon pro Spieler (ausgraubar, Auto-Reset bei Rundenwechsel).

Inspiration: Stern-Icon (Toggle).

Exhaustion (PHB 2024): Zähler von 0-5. Zeige den Malus (Level * 2) als Info an.

Conditions: Menü pro Kachel mit: Blinded (Blind),
Charmed (Bezaubert),
Deafened (Taub),
Exhaustion (Erschöpfung): Wichtig: Hier muss ein Zähler von 1 bis 5 dabei sein, da jedes Level einen -2 Malus auf d20-Tests und den Spell Save DC gibt,
Frightened (Verängstigt),
Grappled (Gepackt),
Incapacitated (Handlungsunfähig),
Invisible (Unsichtbar),
Paralyzed (Paralysiert),
Petrified (Versteinert),
Poisoned (Vergiftet),
Prone (Liegend),
Restrained (Festgesetzt),
Stunned (Betäubt),
Unconscious (Bewusstlos).
Icons erscheinen auf der Kachel.

4. Victory-Logik:

Trigger: Wenn das letzte aktive Monster in der Liste gelöscht oder als "Dead" markiert wird.

Effekt: Ein bildschirmfüllendes Overlay "VICTORY" mit einer Goldstaub-Animation (Partikeleffekt) und einem epischen Fanfaren-Soundeffekt.

5. Technischer Stack (Vorschlag):

Nutze React oder Vue.js für das State-Management.

Local Storage nutzen, um die HP der Spieler zwischen Kämpfen zu speichern.

Keine Datenbank nötig, rein lokales Tool.