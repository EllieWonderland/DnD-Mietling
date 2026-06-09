# Medien-Wunschliste

Sammlung der Videoszenen und Effektsounds, die wir brauchen, um (möglichst)
alle D&D-Szenen abzudecken. Aufgeteilt nach Bereichen, passend zu den
Musik-Kategorien der App. Bereits vorhandene Assets sind mit ✅ markiert.

---

## 1. Videoszenen (Loop-Hintergründe)

Idealerweise nahtlos loopende, ruhige Clips (10–30 s), die flach auf dem Tisch
laufen können, ohne abzulenken. Vorhandene Szenen siehe `VIDEO_SCENES` in
`src/components/soundboardData.jsx`.

### Siedlung & Hof
- ✅ Taverne (Innenraum, Kaminfeuer, Kerzen)
- ✅ Dorf (Marktplatz / Fachwerk)
- Burg / Burghof (Innenhof, Banner, Wachen)
- Thronsaal / Adelshalle (Säulen, Kerzen, Wandteppiche)
- Stadtgasse bei Nacht (Laternen, Pflaster, Regen)
- Hafen / Docks (Schiffe, Wasser, Möwen)
- Marktstand / Händler (Innen, Waren, Kerzenlicht)
- Schmiede / Werkstatt (Esse, Funken) → passt zu „Handwerk"

### Reise & Wildnis
- ✅ Lagerfeuer (Nachtlager)
- ✅ Wald (Tageslicht)
- ✅ Lichtung
- ✅ Waldhaus (Hütte im Wald)
- ✅ Bach / Fluss
- Bergpass / Gebirge (Schnee, Felswände)
- Wüste / Ödland (Düne, Hitzeflimmern)
- Sumpf / Moor (Nebel, totes Geäst)
- Straße / Wegmarsch (Feldweg, Hügel)
- Küste / Klippe (Meer, Wind)
- Schneelandschaft / Tundra (Schneefall)
- Sternenhimmel / Nachtlager unter freiem Himmel

### Verlies & Ruinen
- ✅ Dungeon (Steingewölbe, Fackeln)
- ✅ Ruinen (verfallenes Gemäuer)
- Höhle / Kristallhöhle (feucht, Tropfen, Leuchtkristalle)
- Krypta / Gruft (Sarkophage, Spinnweben)
- Friedhof (Nebel, Grabsteine, Mond)
- Kerker / Verlies (Gitter, Ketten, Dunkelheit)
- Verlassene Mine / Stollen (Holzstützen, Loren)

### Kampf & Verfolgung
- Schlachtfeld (Rauch, Banner, Glut)
- Brennendes Gebäude / Dorf (Flammen, Funkenflug)
- Arena / Kampfgrube (Zuschauerränge, Sand)
- Verfolgung (verwischter Wald/Gasse – optional, evtl. zu unruhig)

### Mystik & Kosmos
- Magisches Portal / Zauberkreis (Runen, Glühen)
- Astralebene / Sternennebel (Galaxien, Schweben)
- Feywild / Feenwald (leuchtende Pflanzen, Glühwürmchen)
- Schattenwelt / Düstermark (entsättigt, Nebel)
- Tempel / Heiligtum (Lichtstrahl, Altar)
- Unterwasser / versunkene Stadt (Lichtstrahlen, Blasen)
- Vulkan / Hölle (Lava, Glut, Asche)

### Universell / Übergänge
- Schwarzbild / Reine Stille (Pause, Szenenwechsel)
- Karte / Pergament (Reiseplanung, Zwischenszene)
- Würfel-Nahaufnahme / Tischatmosphäre (optional Intro)

---

## 2. Effektsounds (Einmal-Sounds)

Kurze One-Shots (0,5–4 s), die der DM situativ auslöst. Vorhandene Effekte
siehe `EFFECT_TRACKS` in `src/components/soundboardData.jsx`.

### Reaktionen / Stimmung am Tisch
- ✅ Jubel (cheer)
- ✅ Enttäuschung (disappointment)
- ✅ Peitsche / Witz-Sting (whip)
- Applaus
- Gelächter (Menge)
- Trommelwirbel + Becken (Tusch)
- Spannungs-Sting (Dun-Dun-Duuun)
- „Fail"-Trombone (komischer Fehlschlag)

### Würfel & Proben
- Kritischer Treffer (Nat 20) – heroischer Sting
- Patzer (Nat 1) – Misston / Glasbruch
- Levelaufstieg / Erfolg-Fanfare
- Münzklimpern (Gold erhalten)

### Kampf
- Schwerthieb / Klingenschlag
- Treffer auf Rüstung (metallisch)
- Bogenschuss (Sirren + Einschlag)
- Schildblock / Parade
- Faustschlag / Körpertreffer
- Knochenbruch / kritischer Treffer
- Körper fällt zu Boden (Gegner besiegt)
- Initiative-Gong / Kampfbeginn

### Magie
- Allgemeiner Zauberwirk-„Whoosh"
- Feuerball / Explosion
- Blitz / Donnerschlag
- Heilung / heiliger Klang (Glöckchen)
- Eis / Frost
- Verzauberung / schimmernder Effekt
- Beschwörung / Portal öffnet sich
- Fehlgeschlagener Zauber / Fizzle

### Umgebung & Interaktion
- Tür öffnet sich (knarrend)
- Tür / Tor fällt zu (schwer)
- Truhe öffnet sich
- Schloss knackt / Falle schnappt zu
- Fackel / Feuer entzündet sich
- Schritte (Stein, Holz)
- Wasserplatschen
- Glasbruch / Zerbrechen
- Kette / Mechanismus / Zahnräder

### Kreaturen
- Drachenbrüllen
- Monster-Knurren / Growl
- Wolfsgeheul
- Zombie-Stöhnen / Untote
- Insekten- / Spinnen-Geräusche
- Geisterhaftes Flüstern / Wispern

### Atmosphäre / Übergänge (optional als kurze Stinger)
- Glockenschlag (Kirche / Alarm)
- Hornstoß / Alarmsignal
- Donnergrollen (Wetterwechsel)
- Eulenruf / Nachtgeräusch
- Wirtshaus-Gemurmel (kurzer Einwurf)

---

> Hinweis: Audio wird über Cloudflare R2 ausgeliefert (`CDN`-URL in
> `soundboardData.jsx`); Videos liegen unter `Videos/` im selben Bucket.
> Neue Assets dort ablegen und im jeweiligen Array (`VIDEO_SCENES` /
> `EFFECT_TRACKS`) ergänzen.
