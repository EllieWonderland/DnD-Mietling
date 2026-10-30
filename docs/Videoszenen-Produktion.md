# Einheitliche Fantasy-Videoszenen

Stand: 30.10.2026. Gewünschte Richtung: möglichst einheitliche, KI-generierte
Fantasy-Szenen für die ruhigen Loop-Hintergründe der App.

## Bestand und erste Auswahl

`VIDEO_SCENES` in `src/components/soundboardData.jsx` enthält 19 Einträge.
Burg, Höhle, Friedhof und Kerker sind bereits eingetragen, obwohl sie in der
Wunschliste bisher offen waren. Bibliothek, Piratenschiff, Waldrand, Mondnacht,
Mondmeer und Nachtregen sind dort ebenfalls vorhanden. Das ist ein Codeabgleich,
keine Prüfung der Dateien im R2-Bucket und keine visuelle Stilprüfung.

Zuerst **Sumpf, Bergpass, Thronsaal, Schmiede, Portal und Feenwald** erstellen.
Diese sechs Motive ergänzen Reise, Hof, Handwerk und Magie, ohne die bereits
eingetragenen Szenen unmittelbar zu duplizieren. Das ist eine redaktionelle
Priorisierung; die übrigen Motive bleiben unten vollständig aufgeführt.

## Stil und Bildvorlagen

Ein neues Bild pro Szene erzeugen und die Sumpf-Vorlage dabei als Stilreferenz
verwenden. Materialwirkung, Kontrast, Perspektive und Farbkorrektur beibehalten;
die Tageszeit darf sich ändern. Ein gemeinsamer Prompt allein garantiert keine
Stilkonsistenz. Vor einer Serie von Videos die Bilder nebeneinander vergleichen.

**Bildprompt = dieser Stilblock + ein Motiv aus den Tabellen:**

```text
Create one landscape 16:9 environment keyframe for a calm medieval fantasy
ambience video. Detailed cinematic environment art, realistic wood, stone,
water and fabric, subtle painterly finish. Grounded high fantasy, restrained
earth colours, slate-blue shadows, subtle warm amber light where appropriate.
Soft atmospheric depth, readable shadow detail, moderate contrast.
Locked eye-level wide shot, deep focus, stable coherent geometry, quiet open
central area, detail around the perimeter. A calm environment rather than
a narrative event. No people, creatures, modern objects, text, logos, borders
or watermark. Not a top-down battlemap. Match the supplied style reference
without copying its trees, ruins or swamp into unrelated environments.
```

**Ziel:** ruhige Kameraperspektive mit kleinen Bewegungen in Nebel, Wasser,
Flammen oder Stoff. Keine Kamerafahrt, hektische Partikel, Blitze, Kämpfer oder
plötzlichen Ereignisse. Weniger tiefe Schwarzflächen einplanen, weil die App
unten zusätzlich einen dunklen Verlauf über das Video legt.

## Videoerstellung: konkrete Optionen

**Kostenrahmen: keine zusätzlichen Ausgaben neben den vorhandenen Abos.**
Vorhanden sind laut Nutzer Google AI Pro, Meshy Premium und Claude Pro.
Bevorzugt wird Google Flow mit dem in Google AI Pro enthaltenen Kontingent;
Meshy Premium ist eine zweite Option für einen Bild-zu-Video-Vergleich.
Google dokumentiert für AI Pro 1.000 zusätzliche Flow-Credits pro Monat;
Meshy nennt für Premium 3.000 monatliche Credits. Der tatsächliche Reststand
der Konten ist noch nicht geprüft. Quellen:
[Flow-Kontingente](https://support.google.com/flow/answer/16526234?hl=en),
[Meshy-Tarife](https://help.meshy.ai/en/articles/12062933-which-meshy-plan-is-right-for-you-free-vs-pro-vs-premium-vs-ultra).

Zusätzlich gibt es bei Flow ein Tageskontingent. Laut
[Google-Hilfe zu Flow-Credits](https://support.google.com/flow/answer/16526234?hl=en)
gibt es auch ohne Abo 50 Credits pro Tag; ungenutzte Tagescredits verfallen.
Videogenerierung kann für kostenlose Konten zu Stoßzeiten eingeschränkt sein.
Kontingent, Modell und Credit-Verbrauch vor dem Start im eigenen Konto prüfen.
Das ist keine Zusage für unbegrenzte kostenlose Produktion.

Flow ist von Google AI Studio/Gemini API und der Gemini-App zu unterscheiden:
Die [API-Preisliste](https://ai.google.dev/gemini-api/docs/pricing) weist für
Gemini Omni Flash Video keinen Free Tier aus; die
[Gemini-App-Hilfe](https://support.google.com/gemini/answer/16126339?hl=de)
verlangt für private Konten ein Google-AI-Abo, das hier bereits vorhanden ist.
Für die Produktion daher die enthaltenen Flow-/Gemini-Oberflächen verwenden;
keine zusätzliche API-Abrechnung oder Credit-Zukäufe einrichten.

1. **Runway Gen-4.5, Image to Video:** geeigneter erster Versuch für die
   einheitliche Serie. Das Bild bestimmt Look und Komposition; im Video-Prompt
   nur Bewegung und ruhige Kamera beschreiben. Der Anbieter dokumentiert
   2–10 Sekunden und 720p als native Ausgabe; ein 1080p-Upscale ergänzt keine
   echte Quelldetailauflösung.
   [Modell und Einstellungen](https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5),
   [Bild-zu-Video-Prompting](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide).
2. **Google Flow / Veo:** Alternative für Versuche mit Start- und Endbild.
   Wenn die gewählte Oberfläche dies anbietet, dasselbe Bild für beide Enden
   verwenden. Das verbessert die Randbedingungen, garantiert aber weder eine
   statische Kamera noch einen unsichtbaren Loop-Übergang.
   [Veo und Flow](https://deepmind.google/models/veo/).
3. **Lokale Vorschau aus KI-Bild und prozeduralem Nebel:** sofort verfügbar,
   ohne zusätzlichen Video-Generierungsdienst. Kamera, Geometrie und Wasser
   bleiben statisch; nur eine schwache Nebel-/Lichtschicht bewegt sich.
   Der Sumpf-Pilot unten nutzt diesen Weg. Dies ist ausdrücklich kein vollständig
   KI-generierter Bewegungsclip.

Die direkte Verbindung zu Weave wurde am 30.10.2026 erfolgreich geprüft.
Der Modellkatalog nennt für Veo 3.1 ungefähr 90 Weave-Credits pro Generierung;
das ist eine Schätzung, kein verbindlicher Preis für unsere Einstellungen.
Laut [Weave-Tarifübersicht](https://help.weavy.ai/en/articles/12267070-plans)
sind Videomodelle nicht im Free-Plan enthalten. Weave wird deshalb vorerst
nicht für die Generierung verwendet. Es wurde kein Video darüber erzeugt.

Meshy bietet ebenfalls Image to Video, mit laut
[Credit-Übersicht](https://help.meshy.ai/en/articles/10000507-how-many-credits-does-each-generation-task-cost)
20–330 Credits pro Generierung. Das vorhandene Premium-Abo wird dafür
berücksichtigt; Videofreigabe, angebotene Modelle, Export und tatsächlicher
Reststand im Konto sind noch zu prüfen. Claude Design ist im vorhandenen
Claude-Pro-Abo verfügbar und eignet sich ergänzend für Designs und
interaktive/prozedurale Animationen; ein eigener Landschafts-Videogenerator
ist in der [Claude-Design-Dokumentation](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
nicht beschrieben.

Hinweis für eine spätere API-Anbindung: Die alte Veo-3.1-Preview der Gemini API
wurde laut Google am 22.10.2026 abgeschaltet. Keine neue Integration auf diese
Preview-IDs aufbauen; aktuelle Optionen stehen in der
[Google-Videodokumentation](https://ai.google.dev/gemini-api/docs/video).

**Gemeinsamer Bewegungsprompt:** den folgenden Block mit dem Bewegungszusatz
der gewählten Szene kombinieren. Wenn der Dienst eigene Regler für Kamera und
Bewegungsstärke anbietet: statische Kamera, geringe Bewegung wählen.

```text
The locked-off camera remains perfectly still throughout one continuous shot.
The composition, scene geometry and exposure remain stable. Only minimal,
slow environmental motion occurs. The environment remains empty and calm.
The scene returns smoothly to its initial visual state for a repeating loop.
```

Mit 8–10 Sekunden testen, soweit vom gewählten Dienst unterstützt. Erst wenn
Bewegung und Naht stimmen, einen 10–30-Sekunden-Loop exportieren, gegebenenfalls
durch Wiederholung. Ein längerer Export allein macht die Naht nicht besser.

## Motive und Bewegungszusätze

Die englischen Texte sind direkt mit den beiden gemeinsamen Blöcken nutzbar.
Die Dateinamen sind Vorschläge für spätere R2-Uploads, keine existierenden URLs.

### Erste Serie

| Szene / Zieldatei | Motiv für die Bildvorlage | Zusatz für den Video-Prompt |
| --- | --- | --- |
| Sumpf · `sumpf.mp4` | Ancient misty swamp at blue hour, gnarled cypress roots, still shallow water, moss, reeds and a worn stone path. | Thin low mist drifts slowly between the roots; tiny ripples move gently across the water. |
| Bergpass · `bergpass.mp4` | Empty narrow mountain pass between weathered slate cliffs, sparse snow, distant peaks under an overcast sky. | A faint veil of cloud moves slowly between distant peaks; a little loose snow drifts near the ground. |
| Thronsaal · `thronsaal.mp4` | Empty medieval throne hall, stone columns, worn tapestries, modest gilded throne, candle braziers, warm evening light. | Candle flames flicker gently and the edges of distant banners sway almost imperceptibly. |
| Schmiede · `schmiede.mp4` | Empty dwarven stone forge, glowing coals, anvil and carefully arranged iron tools, warm ember light against cool stone. | Coals glow softly and a thin thread of smoke rises; the tools and bellows remain still. |
| Portal · `portal.mp4` | Ancient circular stone portal in a quiet ruined sanctuary, dim turquoise light inside the ring, carved abstract markings, mossy floor. | The portal light pulses very softly in a slow cycle; a few faint motes drift close to the ring. |
| Feenwald · `feenwald.mp4` | Quiet enchanted woodland glade at dusk, ancient roots, softly luminous fungi and delicate glowing plants, muted jade and blue tones. | A few fireflies drift slowly and the plants glow gently; leaves barely move in a light breeze. |

### Weitere Orte und Reise

| Szene / Zieldatei | Motiv für die Bildvorlage | Zusatz für den Video-Prompt |
| --- | --- | --- |
| Nachtgasse · `stadtgasse_nacht.mp4` | Empty narrow medieval cobbled alley after rain, timber houses, dim hanging lanterns, puddles, cool night sky. | Fine rain falls steadily; lantern flames flicker gently and small puddle ripples repeat. |
| Hafen · `hafen.mp4` | Empty medieval timber docks, moored wooden sailing ships, ropes, barrels and calm harbour water at dusk. | Moored boats rock almost imperceptibly; water ripples and furled sail edges move gently. |
| Händler · `marktstand.mp4` | Unattended covered medieval market stall, woven cloth, baskets, pottery and closed wooden chests, warm lantern light. | The canopy edge sways slightly and a lantern flame flickers softly; all goods stay still. |
| Wüste · `wueste.mp4` | Quiet broad ochre dunes and weathered stone outcrops, pale dry sky, late afternoon, no travellers or settlements. | Very fine sand drifts close to the ground with a faint steady heat shimmer in the distance. |
| Straße · `landstrasse.mp4` | Empty winding dirt road through low grassy hills, old wooden signpost with no writing, distant woodland, soft afternoon light. | Grasses move gently in a light breeze and distant clouds drift very slowly. |
| Küste · `kueste.mp4` | Empty rocky coastal cliff above a calm open sea, sparse coastal grasses, subdued overcast daylight, no modern buildings. | Small slow waves roll against the rocks; nearby grasses sway gently. |
| Tundra · `tundra.mp4` | Empty rolling tundra with sparse dark shrubs, soft fresh snow, distant low mountains and a pale blue-grey sky. | Fine snow falls slowly and evenly; the wind remains gentle and visibility stable. |
| Sternenlager · `sternenlager.mp4` | Empty quiet campsite on a grassy ridge, rolled blankets and a small unlit fire ring beneath a clear star-filled night sky. | Grasses sway almost imperceptibly and stars twinkle faintly while their positions stay fixed. |

### Verlies und Kampf

| Szene / Zieldatei | Motiv für die Bildvorlage | Zusatz für den Video-Prompt |
| --- | --- | --- |
| Krypta · `krypta.mp4` | Empty ancient stone crypt with closed sarcophagi, cobwebs and a few low candles, damp stone and readable deep shadows. | Candle flames flicker very gently and a few dust motes drift through a narrow light shaft. |
| Mine · `mine.mp4` | Abandoned medieval mine tunnel, heavy timber supports, rusty mine cart, rough rock and one dim oil lantern. | The lantern flame flickers faintly and sparse dust drifts in its light; cart and supports remain still. |
| Schlachtfeld · `schlachtfeld.mp4` | Empty old battlefield after combat, abandoned shields, torn banners and distant cold embers, no bodies, subdued dusk. | Low smoke drifts slowly and the torn banner edges move gently; a few distant embers glow softly. |
| Brennendes Dorf · `brennendes_dorf.mp4` | Distant empty medieval village with a small number of burning timber buildings at night, stone foreground, no people or injuries. | Distant flames move slowly and smoke rises steadily; building silhouettes stay completely intact. |
| Arena · `arena.mp4` | Empty weathered circular stone fighting arena, sandy floor, vacant spectator tiers and a few torch braziers at dusk. | Torch flames flicker gently and a faint veil of dust moves close to the sand. |
| Verfolgung, optional · `verfolgung.mp4` | Empty narrow forest trail at dusk with dense trees framing a stable central path, tense but quiet atmosphere. | Branch tips sway slightly and low mist drifts across the path; the camera remains completely still. |

Für Verfolgung bewusst eine ruhige, bedrohliche Umgebung verwenden. Eine
simulierte Laufkamera passt schlecht zur ablenkungsarmen Tischdarstellung.

### Mystik und Übergänge

| Szene / Zieldatei | Motiv für die Bildvorlage | Zusatz für den Video-Prompt |
| --- | --- | --- |
| Astralebene · `astralebene.mp4` | Quiet astral expanse with a restrained indigo nebula, sparse stars and a few distant floating stone fragments, no central vortex. | Nebula wisps shift very slowly and a few faint motes drift; stars and stones stay nearly fixed. |
| Schattenwelt · `schattenwelt.mp4` | Desaturated ancient woodland with bare trees, ruined standing stones and silver-grey ground fog under a dim overcast sky. | Low fog drifts slowly between the trunks and a few fine branches sway slightly. |
| Tempel · `tempel.mp4` | Empty ancient stone sanctuary with an unmarked altar, worn columns, candles and a soft daylight shaft from a high opening. | Fine dust moves through the steady light shaft; candle flames flicker softly. |
| Unterwasser · `unterwasser.mp4` | Quiet submerged ancient stone courtyard, broken columns, sea grass and soft blue-green light from the surface. | Soft caustic light shifts slowly over the stones and sea grass sways gently; a few tiny bubbles rise. |
| Vulkan · `vulkan.mp4` | Quiet volcanic cavern with a slow lava channel, dark basalt ledges and faint ember light, no eruption or creatures. | Lava moves extremely slowly, its surface glow varies subtly and a thin veil of heat haze remains steady. |
| Schwarzbild · `schwarzbild.mp4` | Keine KI nötig: reines Schwarz ohne Text. Alternativ später als App-Funktion lösen. | Keine Bewegung, kein Ton; als Pause nur auf ausdrücklichen Nutzerwunsch zeigen. |
| Pergament · `pergament.mp4` | Blank worn parchment spread on a dark wooden table, gently curled edges, subtle candlelight from outside the frame, no labels or map text. | Only the soft off-frame candlelight varies slightly; the parchment remains flat and still. |
| Würfeltisch, optional · `wuerfeltisch.mp4` | Close view of resting unmarked polyhedral dice on a worn wooden fantasy gaming table, leather pouch and subdued candlelight, no hands. | Candlelight flickers very softly; every die and all other objects remain motionless. |

### Varianten vorhandener Szenen

Erst den vorhandenen Clip ansehen, bevor dafür eine neue Generierung erfolgt:

| Variante | Bildmotiv | Bewegung |
| --- | --- | --- |
| Burghof | Empty medieval castle courtyard, hanging banners, weathered stone, overcast daylight. | Banner edges sway gently; the camera stays locked. |
| Kristallhöhle | Damp stone cave with restrained blue luminous crystal clusters and still pools. | Tiny drops disturb the pools; crystal light varies very softly. |

## Sumpf-Pilot und reproduzierbare lokale Vorschau

- [KI-Bildvorlage](media/sumpf-keyframe-v1.png): mit dem eingebauten
  Imagegen-Werkzeug erstellt; noch kein Nachweis für den Stil der alten Clips.
- [Tatsächlich verwendeter Bildprompt](media/sumpf-keyframe-v1.prompt.txt).
- Lokaler Videoentwurf: `output/media/sumpf-pilot-v1.mp4`.
  Dieser Pfad ist absichtlich nicht im Git-Repository enthalten.
- Die Vorschau ist ein KI-Standbild mit lokal animierter Nebel-/Lichtschicht.
  Wasser, Bäume und Ruine bewegen sich nicht. Die Nebelbewegung ist auf zwölf
  Sekunden periodisch angelegt; der sichtbare Übergang muss auch nach dem
  Encodieren kontrolliert werden.

Vom Repository-Hauptverzeichnis mit installiertem FFmpeg reproduzieren:

```powershell
node scripts/render-ambient-fog.mjs docs/media/sumpf-keyframe-v1.png output/media/sumpf-pilot-v1.mp4
```

Das Skript überschreibt keine vorhandene Datei. Für weitere Versuche einen
neuen Ausgabedateinamen wählen. Export: MP4/H.264, 1920×1080, 24 fps, zwölf
Sekunden, `yuv420p`, ohne Tonspur, Web-Faststart. Dies ist ein Exportziel für
die Vorschau; die Bildauflösung der KI-Vorlage kann davon abweichen.

## Abnahme und Einbindung

1. Bild mit der Stilreferenz vergleichen: Material, Kontrast, Farbwirkung,
   ruhiger Bildaufbau; keine fehlerhaften Strukturen, Schrift oder Wasserzeichen.
2. Video mindestens drei Runden wiederholen: kein Kameradrift, Schnitt,
   Helligkeitssprung, auffälliges Zurücksetzen oder sich verformende Architektur.
3. Für generative Videos Wasser und Feuer besonders auf die Naht prüfen.
   Überblendungen helfen bei Nebel; bei deutlicher Bewegung können sie
   Doppelkonturen erzeugen. Rückwärtslaufen für Feuer, Regen oder Rauch vermeiden.
4. MP4 vollständig decodieren und Abmessungen, Laufzeit und fehlende Tonspur
   kontrollieren. Quelldatei, verwendeten Dienst, Modell, Prompt, Datum und
   dessen zum Erstellzeitpunkt geltende Nutzungsbedingungen dokumentieren.
5. Erst die abgenommene Datei nach R2 unter `Videos/<dateiname>.mp4` hochladen,
   Erreichbarkeit prüfen und anschließend `VIDEO_SCENES` ergänzen. Aufnahme
   in den Katalog erst nach dem Upload; keine Platzhalter-URLs eintragen.

## Verarbeiteter Google-Flow-Pilot

Der Nutzer hat am 30.10.2026 den generierten Clip als
`output/media/sumpf-flow-v1.mp4` bereitgestellt. Die Browserautomatisierung
konnte Flow nicht bedienen; die Generierung wurde deshalb vom Nutzer gestartet.
Das konkret gewählte Modell und der tatsächliche Credit-Verbrauch sind nicht
bestätigt und werden nicht aus Dateiname oder Auflösung abgeleitet.

**Fertiger lokaler Export:** `output/media/sumpf-loop-v2.mp4`.

| Eigenschaft | Quelle | Vorbereiteter Loop |
| --- | --- | --- |
| Auflösung | 1280×720 | 1280×720, ohne Hochskalierung |
| Bildrate | 24 fps | 24 fps |
| Videodauer | 10 Sekunden / 240 Frames | 18 Sekunden / 432 Frames |
| Container / Codec | MP4 / H.264, `yuv420p` | MP4 / H.264, `yuv420p`, Faststart |
| Ton | AAC-Tonspur vorhanden | Keine Tonspur |
| Dateigröße | 9.348.251 Bytes | 12.592.438 Bytes |

Das Audio verlängert die Containerlaufzeit der Quelle auf etwa 10,027 Sekunden;
für den Videoschnitt werden die zehn Sekunden der Videospur verwendet.

Die Verarbeitung erhält die Originaldatei. Der Zyklus beginnt bei Quellsekunde
eins, läuft bis zum Ende und blendet während der letzten ungefähr einen Sekunde
zum Anfang der Quelle über. Damit schließt er wieder an Quellsekunde eins an.
Ein Zyklus dauert neun Sekunden und wird für den 18-Sekunden-Export zweimal
verlustfrei aneinandergereiht. Der vorherige Export `sumpf-loop-v1.mp4` bleibt
ein Zwischenstand; zu verwenden ist **v2**.

Reproduktion mit FFmpeg, vom Repository-Hauptverzeichnis aus; für einen erneuten
Lauf neue Dateinamen wählen, da `-n` vorhandene Dateien schützt:

```powershell
ffmpeg -hide_banner -loglevel warning -n -i 'output/media/sumpf-flow-v1.mp4' -filter_complex '[0:v]fps=24,format=yuv420p,settb=AVTB,split=2[b][h];[b]trim=start=1:end=10,setpts=PTS-STARTPTS[body];[h]trim=start=0:end=1,setpts=PTS-STARTPTS[head];[body][head]xfade=transition=fade:duration=0.958333:offset=8,format=yuv420p[v]' -map '[v]' -an -frames:v 216 -c:v libx264 -preset slow -crf 19 -profile:v high -level:v 3.1 -pix_fmt yuv420p -movflags +faststart 'output/media/sumpf-flow-cycle-v2.mp4'
ffmpeg -hide_banner -loglevel warning -n -stream_loop 1 -i 'output/media/sumpf-flow-cycle-v2.mp4' -map 0:v:0 -an -c copy -movflags +faststart 'output/media/sumpf-loop-v2.mp4'
```

**Geprüft:** Quelle und Export vollständig ohne Decoderfehler gelesen;
Auflösung, Codec, Framezahl, Laufzeit und fehlende Export-Tonspur geprüft.
Faststart ist durch die Reihenfolge der MP4-Boxen (`moov` vor `mdat`) geprüft.
Einzelbilder über den Verlauf und im Überblendbereich zeigen keine auffälligen
Änderungen an Bäumen oder Ruine. Das Wasser bewegt sich ruhig; die Überblendung
mischt kurz verschiedene Wellenzustände.

Zusätzliche technische Nahtprüfung: mittlere absolute Helligkeitsdifferenz
zwischen letztem und erstem Bild, auf 320×180 Graustufen verkleinert, sank von
5,467 auf 1,460 von 255 Stufen. Der maximale Sprung zwischen benachbarten
Exportframes beträgt 1,741. Damit liegt die Naht innerhalb der im Clip gemessenen
Bildänderungen. Das ist keine Garantie für einen subjektiv unsichtbaren Übergang;
die abschließende Sichtprüfung mehrerer Runden auf dem Tischdisplay bleibt offen.

Metadaten und SHA-256-Prüfsummen stehen in
[sumpf-flow-v1.json](media/sumpf-flow-v1.json). Alle MP4-Dateien bleiben lokal
unter dem ignorierten Verzeichnis `output/media/`.

Es wurde kein R2-Upload vorgenommen und der Live-Szenenkatalog wurde nicht
erweitert. Die endgültige Sichtabnahme und die Veröffentlichung sind noch offen.
