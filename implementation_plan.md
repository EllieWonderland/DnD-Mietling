# Implementierungsplan: D&D Musik-Board mit Stimmungsreglern

Dieser Plan beschreibt die technische Umsetzung des neuen Musik-Boards für die D&D-Mietling-App. Die Stimmung wird dynamisch über 4 Regler (Bedrohung, Energie, Mystik, Tonalität) eingestellt. Ein intelligenter Selektor wählt basierend auf dem mathematischen Abstand (euklidische Distanz) den am besten passenden Song aus der 39 Titel starken Musikdatenbank aus (+ 3 Event-Jingles ohne Stimmungsprofil).

## User Review Required

> [!IMPORTANT]
> **Rückwärtskompatibilität & WebSocket-Synchronisation:**
> Der Stimmungs-Selektor läuft rein clientseitig im Controller (Tablet). Wenn ein Song über die Regler ermittelt wird, sendet er wie bisher die `playingMusicKey` über die bestehende WebSocket-Verbindung an den TV (Display-Modus). Beide Seiten lösen den `key` lokal über `MUSIC_TRACKS.find(...)` zur `.url` auf ([App.jsx:188](src/App.jsx#L188) / [App.jsx:213](src/App.jsx#L213)). Dadurch sind **keine** Änderungen am Netzwerk-Protokoll oder am Display-Code notwendig — solange beide Seiten denselben `MUSIC_TRACKS`-Array bauen.
>
> **Hybrid-Modus (Regler <-> Manuell):**
> * Schiebt der Benutzer die Regler, wird der beste Song gewählt.
> * Klickt der Benutzer manuell auf einen Song, springen die Regler automatisch auf die vordefinierten Werte dieses Songs. Das bietet sofortiges visuelles Feedback.

> [!WARNING]
> **Zwei Architektur-Vorgaben aus Roadmap #9 müssen eingehalten werden — sonst bricht das Vercel-Deploy:**
> 1. **Kein `import … from '../Music/…mp3'`.** Alle Medien werden über die Cloudflare-R2-CDN geladen (`const CDN = '…r2.dev'`), nicht ins Vite-Build gebündelt. Sonst wird `dist/` wieder hunderte MB groß und überschreitet das Vercel-Limit (100 MB).
> 2. **Die 37 neuen MP3s liegen aktuell nur lokal** (`git status` → `??`) und sind weder auf R2 hochgeladen noch in `.gitignore`. Schritt 0 (unten) muss **vor** dem Code-Refactoring erledigt sein, sonst spielen die Tracks nicht und das Repo bläht sich auf.

---

## 0. Voraussetzung — R2-Upload & .gitignore (ZUERST erledigen)

Bevor irgendein Code geändert wird:

1. **Alle 37 neuen MP3s nach Cloudflare R2 hochladen** in den bestehenden Bucket `dnd-mietling-media`, Ordner `Music/` — exakt unter denselben Dateinamen, die jetzt in `src/Music/` liegen (Leerzeichen/Sonderzeichen unverändert lassen). Die 5 alten Tracks (`adventure_music.mp3`, `dawn_music.mp3`, `dreaming_music.mp3`, `epic-fantasy-background-music.mp3`, `walking_music.mp3`) liegen bereits dort.
   - Verifikation: Eine URL im Browser öffnen, z. B.
     `https://pub-28096ab7cf5d497990bc972094f05721.r2.dev/Music/amaksi-war-drums-173853.mp3` → muss abspielen.
2. **`.gitignore` erweitern:** Statt jede Datei einzeln zu listen, das ganze Verzeichnis ausschließen — aber die Effekt-/Overlay-Sounds bleiben im Repo (die liegen in `src/Effects/`, nicht in `src/Music/`):
   ```gitignore
   # Musik wird über Cloudflare R2 ausgeliefert, nicht gebündelt
   src/Music/*.mp3
   ```
   Achtung: Die 3 Event-Jingles (`defeat_outro.mp3`, `orchestral_win.mp3`, `amaksi-war-conflict-intro-272503.mp3`) kommen ebenfalls von R2 (siehe Abschnitt 1) — sie dürfen also auch ignoriert werden. Falls Victory/Defeat-Outros aktuell noch lokal gebündelt referenziert werden, das vor dem Ignorieren prüfen.
3. **Bereits getrackte Dateien aus dem Index lösen** (falls eine der 5 alten schon getrackt war, ist sie es weiterhin — die neuen sind untracked):
   ```
   git status --short src/Music
   ```
   Sicherstellen, dass nach dem `.gitignore`-Edit **keine** `src/Music/*.mp3` mehr unter „Changes to be committed" auftaucht.

---

## 1. Vollständiges Musik-Array für `soundboardData.jsx`

> [!NOTE]
> **CDN-Muster** — die Datei hat bereits `const CDN = 'https://pub-28096ab7cf5d497990bc972094f05721.r2.dev'` ganz oben. Unten wird diese Konstante wiederverwendet. **Keine** neuen `import`-Zeilen für MP3s hinzufügen. Die Icon-Funktionen (`IconMug`, `IconCrown`, `IconHouse`, …) sind in `soundboardData.jsx` bereits definiert und werden direkt referenziert.

Ersetze den bestehenden `MUSIC_TRACKS`-Array (aktuell 5 Einträge) durch den folgenden. Ein kleiner Helfer `m()` hält die URLs lesbar:

```javascript
// Helfer: baut die R2-URL für einen Musik-Dateinamen (CDN ist oben in der Datei definiert)
const m = (file) => `${CDN}/Music/${file}`

// JINGLES / EVENT SOUNDS (kein Stimmungsprofil — werden NICHT vom Regler-Selektor gewählt)
export const EVENT_SOUNDS = [
  { key: 'defeat',    label: 'Defeat Outro',       url: m('defeat_outro.mp3') },
  { key: 'victory',   label: 'Victory Fanfare',    url: m('orchestral_win.mp3') },
  { key: 'war-intro', label: 'War Conflict Intro', url: m('amaksi-war-conflict-intro-272503.mp3') },
]

export const MUSIC_TRACKS = [
  // Zivilisation & Schutzräume
  { key: 'peasant-folk',            label: 'Peasant Folk (Bauern)',    url: m('dueg-oth-musik-bauern-142722.mp3'),                                  Icon: IconMug,   mood: { danger: 0.00, energy: 0.65, mysticism: 0.10, tone: 0.85 } },
  { key: 'middle-ages-happiness',   label: 'Middle Ages Happiness',    url: m('land_of_books_youtube-middle-ages-happynes-432859.mp3'),             Icon: IconMug,   mood: { danger: 0.00, energy: 0.60, mysticism: 0.10, tone: 0.90 } },
  { key: 'medieval-festive-dance',  label: 'Festive Medieval Dance',   url: m('tunetank-medieval-festive-music-412772.mp3'),                        Icon: IconMug,   mood: { danger: 0.00, energy: 0.75, mysticism: 0.10, tone: 0.85 } },
  { key: 'medieval-nobility',       label: 'Medieval Nobility (Adel)', url: m('dueg-oth-musik-adel-142724.mp3'),                                    Icon: IconCrown, mood: { danger: 0.00, energy: 0.45, mysticism: 0.20, tone: 0.85 } },
  { key: 'the-tournament',          label: 'The Tournament',           url: m('emmraan-the-tournament-280277.mp3'),                                 Icon: IconCrown, mood: { danger: 0.25, energy: 0.70, mysticism: 0.15, tone: 0.80 } },
  { key: 'medieval-ambience',       label: 'Medieval Ambience',        url: m('dueg-oth-musik-hintergrund-142725.mp3'),                             Icon: IconHouse, mood: { danger: 0.10, energy: 0.30, mysticism: 0.20, tone: 0.60 } },
  { key: 'fantasy-kingdom',         label: 'Fantasy Kingdom',          url: m('emmraan-fantasy-kingdom-261257.mp3'),                                Icon: IconCrown, mood: { danger: 0.10, energy: 0.35, mysticism: 0.45, tone: 0.80 } },
  { key: 'sunset-castle',           label: 'Sunset at the Castle',     url: m('valentinik-sunset-at-the-castle-350754.mp3'),                        Icon: IconHouse, mood: { danger: 0.05, energy: 0.25, mysticism: 0.35, tone: 0.75 } },
  { key: 'mystical-city',           label: 'The Mystical City',        url: m('luis_humanoide-the-mystical-city-cinematic-music-496260.mp3'),       Icon: IconHouse, mood: { danger: 0.20, energy: 0.35, mysticism: 0.70, tone: 0.65 } },
  { key: 'the-tower',               label: 'The Tower',                url: m('welbornworks-thetower-328520.mp3'),                                  Icon: IconHouse, mood: { danger: 0.50, energy: 0.40, mysticism: 0.80, tone: 0.40 } },
  { key: 'castle-hollow-steps',     label: 'Castle of Hollow Steps',   url: m('menieldm-castle-of-hollow-steps-495836.mp3'),                        Icon: IconHouse, mood: { danger: 0.50, energy: 0.15, mysticism: 0.40, tone: 0.20 } },
  { key: 'cinematic-desolation',    label: 'Cinematic Desolation',     url: m('senormusica81-cinematic-desolation-2026-v2-2-463167.mp3'),           Icon: IconSad,   mood: { danger: 0.40, energy: 0.15, mysticism: 0.30, tone: 0.10 } },

  // Reise & Wildnis
  { key: 'walking-theme',           label: 'Walking Theme',            url: m('walking_music.mp3'),                                                 Icon: IconRoad,    mood: { danger: 0.10, energy: 0.35, mysticism: 0.15, tone: 0.70 } },
  { key: 'adventure-theme',         label: 'Adventure Theme',          url: m('adventure_music.mp3'),                                               Icon: IconCompass, mood: { danger: 0.20, energy: 0.55, mysticism: 0.30, tone: 0.80 } },
  { key: 'great-adventure',         label: 'Great Adventure',          url: m('mvnocopyrightmusic-great-adventure-532735.mp3'),                     Icon: IconCompass, mood: { danger: 0.15, energy: 0.50, mysticism: 0.25, tone: 0.80 } },
  { key: 'wild-wood',               label: 'The Wild Wood',            url: m('kaazoom-the-wild-wood-full-version-404937.mp3'),                     Icon: IconTrees,   mood: { danger: 0.30, energy: 0.40, mysticism: 0.40, tone: 0.60 } },
  { key: 'dawn-hope',               label: 'Dawn of Hope',             url: m('dawn_music.mp3'),                                                    Icon: IconSun,     mood: { danger: 0.05, energy: 0.20, mysticism: 0.25, tone: 0.90 } },
  { key: 'midnight-forest',         label: 'Midnight Pine Forest',     url: m('geoffharvey-midnight-in-the-pine-forest-228844.mp3'),                Icon: IconTrees,   mood: { danger: 0.40, energy: 0.20, mysticism: 0.50, tone: 0.35 } },
  { key: 'spirits-moor',            label: 'Spirits of the Moor',      url: m('geoffharvey-spirits-of-the-moor-180852.mp3'),                        Icon: IconRiver,   mood: { danger: 0.55, energy: 0.25, mysticism: 0.70, tone: 0.25 } },
  { key: 'woods-mystery',           label: 'Woods of Mystery',         url: m('ob-lix-the-woods-mystery-intrigue-background-music-110802.mp3'),      Icon: IconTrees,   mood: { danger: 0.45, energy: 0.35, mysticism: 0.50, tone: 0.45 } },

  // Dungeons, Höhlen & Gewölbe
  { key: 'dark-spooky',             label: 'Dark Spooky Cave',         url: m('leberch-dark-spooky-309318.mp3'),                                    Icon: IconDungeon, mood: { danger: 0.70, energy: 0.25, mysticism: 0.40, tone: 0.10 } },
  { key: 'echoes-beneath-stone',    label: 'Echoes Beneath the Stone', url: m('menieldm-echoes-beneath-the-stone-495845.mp3'),                      Icon: IconDungeon, mood: { danger: 0.65, energy: 0.20, mysticism: 0.50, tone: 0.15 } },
  { key: 'obsidian-halls',          label: 'Obsidian Halls',           url: m('menieldm-obsidian-halls-495840.mp3'),                                Icon: IconDungeon, mood: { danger: 0.75, energy: 0.30, mysticism: 0.60, tone: 0.15 } },
  { key: 'graveyard',               label: 'The Graveyard',            url: m('thisisbeatkitchen-beatkitchen-the-graveyard-yu-gi-oh-soundtrack-104-bpm-387052.mp3'), Icon: IconRuins, mood: { danger: 0.60, energy: 0.45, mysticism: 0.60, tone: 0.20 } },
  { key: 'forgotten-kingdom',       label: 'The Forgotten Kingdom',    url: m('onecinematicstudio-the-forgotten-kingdom-_-melancholic-amp-grand-ancient-ruins-music-529059.mp3'), Icon: IconRuins, mood: { danger: 0.30, energy: 0.25, mysticism: 0.60, tone: 0.35 } },
  { key: 'secrets-forgotten',       label: 'Secrets of the Forgotten', url: m('melodierealm-secrets-of-the-forgotten-453719.mp3'),                  Icon: IconRuins,   mood: { danger: 0.35, energy: 0.20, mysticism: 0.80, tone: 0.45 } },

  // Kampf & Flucht
  { key: 'war-drums',               label: 'War Drums',                url: m('amaksi-war-drums-173853.mp3'),                                       Icon: IconLightning, mood: { danger: 0.75, energy: 0.70, mysticism: 0.10, tone: 0.40 } },
  { key: 'epic-legend',             label: 'Epic Legend',              url: m('epic-fantasy-background-music.mp3'),                                 Icon: IconCrown,     mood: { danger: 0.60, energy: 0.75, mysticism: 0.50, tone: 0.75 } },
  { key: 'epic-battle',             label: 'Epic Battle',              url: m('francis_samuel-epic-battle-francisco-samuel-123469.mp3'),            Icon: IconLightning, mood: { danger: 0.90, energy: 0.90, mysticism: 0.50, tone: 0.40 } },
  { key: 'powerful-battle',         label: 'Powerful Cinematic Battle',url: m('tunetank-cinematic-powerful-battle-music-414692.mp3'),               Icon: IconLightning, mood: { danger: 0.95, energy: 0.95, mysticism: 0.40, tone: 0.35 } },
  { key: 'forbidden-fire',          label: 'Forbidden Fire',           url: m('iuvenis-genesis-del-fuego-prohibido-509238.mp3'),                    Icon: IconLightning, mood: { danger: 0.70, energy: 0.65, mysticism: 0.80, tone: 0.40 } },
  { key: 'action-chase',            label: 'Action Chase Adrenaline',  url: m('lilliben-action-chase-adrenaline-soundtrack-364888.mp3'),            Icon: IconLightning, mood: { danger: 0.80, energy: 1.00, mysticism: 0.20, tone: 0.40 } },

  // Jenseits & Kosmisch
  { key: 'forbidden-spell',         label: 'Forbidden Spell Awakening',url: m('40173586-forbidden-spell-awakening-dark-fantasy-488140.mp3'),        Icon: IconStar, mood: { danger: 0.70, energy: 0.30, mysticism: 0.90, tone: 0.15 } },
  { key: 'lost-dreams',             label: 'Lost in Dreams',           url: m('dreaming_music.mp3'),                                                Icon: IconMoon, mood: { danger: 0.05, energy: 0.15, mysticism: 0.60, tone: 0.50 } },
  { key: 'echoes-of-aura',          label: 'Echoes of the Aura',       url: m('gnosticbliss-432-hz-echoes-of-the-aura-331610.mp3'),                 Icon: IconStar, mood: { danger: 0.05, energy: 0.10, mysticism: 1.00, tone: 0.60 } },
  { key: 'magic-in-air',            label: 'Magic in the Air',         url: m('geoffharvey-magic-in-the-air-43177.mp3'),                            Icon: IconStar, mood: { danger: 0.05, energy: 0.30, mysticism: 0.85, tone: 0.85 } },
  { key: 'blessings-forest',        label: 'Blessings of the Forest',  url: m('whatssmooth-blessings-from-the-forest-fairies-of-the-magic-woods-426366.mp3'), Icon: IconTrees, mood: { danger: 0.05, energy: 0.30, mysticism: 0.95, tone: 0.90 } },
  { key: 'dark-fairytale',          label: 'Dark Fairytale',           url: m('denis-pavlov-music-mysterious-esoteric-magical-shadowy-dark-fairytale-music-369257.mp3'), Icon: IconStar, mood: { danger: 0.40, energy: 0.25, mysticism: 0.90, tone: 0.25 } },

  // Industrie & Handwerk
  { key: 'dwarven-forges',          label: 'Dwarven Forges',           url: m('bizinbars_tome-dwarven-forges-213935.mp3'),                          Icon: IconDungeon, mood: { danger: 0.20, energy: 0.50, mysticism: 0.40, tone: 0.50 } },
]
```

> [!NOTE]
> **Key-Umbenennung ist sicher.** Die alten Keys (`adventure`, `dawn`, `dreaming`, `epic`, `walking`) werden zu `adventure-theme`, `dawn-hope`, `lost-dreams`, `epic-legend`, `walking-theme`. Eine Grep-Prüfung bestätigt: Die Keys werden **nirgends** hartcodiert — nur relational verglichen (`playingMusicKey === track.key` in [App.jsx:250](src/App.jsx#L250), [Soundboard.jsx:40](src/components/Soundboard.jsx#L40), [InitiativeTracker.jsx:241](src/components/InitiativeTracker.jsx#L241)). `saveCombatState` speichert den Music-Key nicht. Es bricht also nichts.

---

## 2. Der Selektions-Algorithmus (Euklidische Distanz)

Erstelle ein File `src/utils/moodSelector.js`:

```javascript
/**
 * Berechnet die euklidische Distanz zwischen den Reglerwerten und dem Stimmungsprofil
 * jedes Songs und gibt den Track mit dem geringsten Abstand zurück.
 * danger, energy, mysticism, tone müssen Werte zwischen 0.0 und 1.0 sein.
 */
export function findBestTrack(danger, energy, mysticism, tone, tracks) {
  let bestTrack = null
  let minDistance = Infinity

  for (const track of tracks) {
    if (!track.mood) continue // Event-Sounds ohne mood werden übersprungen

    const d = Math.sqrt(
      (danger - track.mood.danger) ** 2 +
      (energy - track.mood.energy) ** 2 +
      (mysticism - track.mood.mysticism) ** 2 +
      (tone - track.mood.tone) ** 2
    )

    if (d < minDistance) {
      minDistance = d
      bestTrack = track
    }
  }

  return bestTrack
}
```

> [!IMPORTANT]
> **Zuverlässigkeit am Spieltisch.** `findBestTrack` liefert *immer* einen Treffer (es gibt keine „Stille"-Zone über die Regler). Damit die Musik beim Schieben nicht stottert und der TV nicht mit WS-Nachrichten überflutet wird, gelten zwei Regeln, die in der UI (Abschnitt 3) umgesetzt werden:
> 1. **Track erst auf `pointerup`/`change` wechseln**, nicht bei jedem `input`-Event während des Ziehens.
> 2. **Nicht neu starten, wenn der beste Track bereits läuft** — `playMusic()` in [App.jsx:248](src/App.jsx#L248) togglet bei gleichem Key bereits auf „aus". Für den Regler-Pfad daher eine eigene Funktion `selectMusic(key)` nutzen, die nur setzt, wenn `key !== playingMusicKey` (kein Toggle, sonst schaltet ein zufällig identischer Treffer die Musik aus).

---

## 3. UI: `MoodMixer`-Komponente + Integration

Der Plan lieferte bisher nur Daten + Algorithmus. Hier der fehlende UI- und Verdrahtungsteil.

### 3a. Neue Komponente `src/components/MoodMixer.jsx`

Vier vertikale Slider (0–100, intern /100 normiert) + Anzeige des aktuell gewählten Tracks. Steuerung ist **kontrolliert von außen** (Hybrid-Modus: ein Song-Klick im Soundboard setzt die Reglerwerte).

```jsx
import { useState } from 'react'
import { MUSIC_TRACKS } from './soundboardData.jsx'
import { findBestTrack } from '../utils/moodSelector.js'
import './MoodMixer.css'

const AXES = [
  { key: 'danger',    label: 'Bedrohung' },
  { key: 'energy',    label: 'Energie' },
  { key: 'mysticism', label: 'Mystik' },
  { key: 'tone',      label: 'Tonalität' },
]

const PRESETS = [
  { label: 'Heitere Taverne',  mood: { danger: 0.00, energy: 0.65, mysticism: 0.10, tone: 0.90 } },
  { label: 'Sonnige Wiese',    mood: { danger: 0.10, energy: 0.40, mysticism: 0.15, tone: 0.80 } },
  { label: 'Dunkelwald',       mood: { danger: 0.50, energy: 0.25, mysticism: 0.50, tone: 0.30 } },
  { label: 'Spinnenhöhle',     mood: { danger: 0.70, energy: 0.25, mysticism: 0.40, tone: 0.10 } },
  { label: 'Bosskampf',        mood: { danger: 0.95, energy: 0.95, mysticism: 0.50, tone: 0.35 } },
  { label: 'Astrale Welten',   mood: { danger: 0.05, energy: 0.10, mysticism: 1.00, tone: 0.60 } },
  { label: 'Zwergenschmiede',  mood: { danger: 0.20, energy: 0.50, mysticism: 0.40, tone: 0.50 } },
  { label: 'Trostloses Ödland',mood: { danger: 0.40, energy: 0.15, mysticism: 0.30, tone: 0.10 } },
]

// mood: { danger, energy, mysticism, tone } — kontrolliert vom Parent (Hybrid-Modus)
// onCommit(track): wird NUR beim Loslassen aufgerufen (pointerup / Preset-Klick)
export default function MoodMixer({ mood, onMoodChange, onCommit, playingMusicKey }) {
  const [preview, setPreview] = useState(() =>
    findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS))

  function handleInput(axis, value) {
    const next = { ...mood, [axis]: value / 100 }
    onMoodChange(next)
    setPreview(findBestTrack(next.danger, next.energy, next.mysticism, next.tone, MUSIC_TRACKS))
  }

  function commit() {
    const best = findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS)
    if (best) onCommit(best) // Parent wechselt nur, wenn best.key !== playingMusicKey
  }

  function applyPreset(p) {
    onMoodChange(p.mood)
    const best = findBestTrack(p.mood.danger, p.mood.energy, p.mood.mysticism, p.mood.tone, MUSIC_TRACKS)
    setPreview(best)
    if (best) onCommit(best)
  }

  return (
    <div className="mood-mixer">
      <div className="mm-preview">
        {preview ? <preview.Icon /> : null}
        <span>{preview?.label ?? '—'}</span>
        {playingMusicKey === preview?.key && <span className="mm-live">● live</span>}
      </div>

      <div className="mm-sliders">
        {AXES.map(axis => (
          <label key={axis.key} className="mm-slider">
            <input
              type="range" min="0" max="100" step="1"
              value={Math.round(mood[axis.key] * 100)}
              onChange={e => handleInput(axis.key, parseInt(e.target.value, 10))}
              onPointerUp={commit}
              onKeyUp={commit}
            />
            <span className="mm-axis-label">{axis.label}</span>
          </label>
        ))}
      </div>

      <div className="mm-presets">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}>{p.label}</button>
        ))}
      </div>
    </div>
  )
}
```

> **Warum `onPointerUp`/`onKeyUp` statt `onChange` committet:** `onChange` (= `input`-Event) feuert bei jedem Pixel während des Ziehens. Würde dort committet, startete der Audio-Stream dutzendfach neu und der TV bekäme dutzende WS-Updates → Stottern. Das Live-Preview-Label aktualisiert sich trotzdem flüssig bei jeder Bewegung; nur der **tatsächliche Track-Wechsel** passiert beim Loslassen.

### 3b. State im Parent ([App.jsx](src/App.jsx))

```jsx
// Reglerstand (für Hybrid-Modus persistent über Re-Renders)
const [mood, setMood] = useState({ danger: 0.2, energy: 0.4, mysticism: 0.3, tone: 0.6 })

// Regler-Pfad: setzt Musik nur, wenn sie sich ändert (KEIN Toggle, anders als playMusic)
function selectMusic(track) {
  if (!track || track.key === playingMusicKey) return
  setPlayingMusicKey(track.key)
}

// Hybrid: manueller Klick im Soundboard -> Regler auf die Mood-Werte des Songs ziehen
function playMusicAndSyncSliders(track) {
  playMusic(track)                 // bestehende Toggle-Logik (Klick auf laufenden Song = Stop)
  if (track?.mood) setMood(track.mood)
}
```

`<MoodMixer mood={mood} onMoodChange={setMood} onCommit={selectMusic} playingMusicKey={playingMusicKey} />`
in den Soundboard-Bereich einsetzen (Controller-Tab). Im Soundboard die Musik-Buttons auf `playMusicAndSyncSliders` umstellen, damit ein manueller Klick die Regler nachzieht.

### 3c. CSS `src/components/MoodMixer.css`

Vertikale Slider (`writing-mode: vertical-lr` bzw. `appearance: slider-vertical`), große Touch-Targets (≥ 44 px breit) für Tablet, goldene Akzente passend zum Pergament-Design. Preview-Label groß und kontrastreich (1,5 m-Lesbarkeit).

---

## 4. Presets (Referenz)

| Preset Name | Bedrohung (danger) | Energie (energy) | Mystik (mysticism) | Tonalität (tone) |
| :--- | :--- | :--- | :--- | :--- |
| **Heitere Taverne** | 0.00 | 0.65 | 0.10 | 0.90 |
| **Sonnige Wiese** | 0.10 | 0.40 | 0.15 | 0.80 |
| **Dunkelwald / Sumpf** | 0.50 | 0.25 | 0.50 | 0.30 |
| **Spinnenhöhle** | 0.70 | 0.25 | 0.40 | 0.10 |
| **Epischer Bosskampf**| 0.95 | 0.95 | 0.50 | 0.35 |
| **Astrale Welten** | 0.05 | 0.10 | 1.00 | 0.60 |
| **Zwergenschmiede** | 0.20 | 0.50 | 0.40 | 0.50 |
| **Trostloses Ödland** | 0.40 | 0.15 | 0.30 | 0.10 |

---

## 5. Umsetzungs-Reihenfolge & QA

1. **Schritt 0** — 37 MP3s nach R2 hochladen, `.gitignore` erweitern, verifizieren (URL im Browser).
2. **Abschnitt 1** — `MUSIC_TRACKS` + `EVENT_SOUNDS` in `soundboardData.jsx` ersetzen (CDN-Muster).
3. **Abschnitt 2** — `src/utils/moodSelector.js` anlegen.
4. **Abschnitt 3** — `MoodMixer.jsx` + CSS, State & `selectMusic`/`playMusicAndSyncSliders` in `App.jsx`, Soundboard-Buttons umstellen.
5. **QA:**
   - [ ] Build: `npm run build` → `dist/` bleibt klein (kein MP3 im Bundle; `du -sh dist` < 10 MB).
   - [ ] Controller: Regler schieben → Preview-Label folgt flüssig; Track wechselt erst beim Loslassen; keine Audio-Aussetzer.
   - [ ] Hybrid: Manueller Klick auf einen Song → Regler springen auf dessen Mood-Werte.
   - [ ] WS-Sync: Display-Tab (`?mode=display`) spielt denselben Track; beim Regler-Loslassen genau **eine** Umschaltung, kein Spam.
   - [ ] Reconnect: Display neu laden → bekommt den aktuell laufenden Track via `lastState`.
   - [ ] Jeder Track lädt von R2 ohne CORS-/404-Fehler (Stichprobe Konsole).
