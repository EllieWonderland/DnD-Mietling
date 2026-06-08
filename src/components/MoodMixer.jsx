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
  { label: 'Heitere Taverne',   mood: { danger: 0.00, energy: 0.65, mysticism: 0.10, tone: 0.90 } },
  { label: 'Sonnige Wiese',     mood: { danger: 0.10, energy: 0.40, mysticism: 0.15, tone: 0.80 } },
  { label: 'Dunkelwald',        mood: { danger: 0.50, energy: 0.25, mysticism: 0.50, tone: 0.30 } },
  { label: 'Spinnenhöhle',      mood: { danger: 0.70, energy: 0.25, mysticism: 0.40, tone: 0.10 } },
  { label: 'Bosskampf',         mood: { danger: 0.95, energy: 0.95, mysticism: 0.50, tone: 0.35 } },
  { label: 'Astrale Welten',    mood: { danger: 0.05, energy: 0.10, mysticism: 1.00, tone: 0.60 } },
  { label: 'Zwergenschmiede',   mood: { danger: 0.20, energy: 0.50, mysticism: 0.40, tone: 0.50 } },
  { label: 'Trostloses Ödland', mood: { danger: 0.40, energy: 0.15, mysticism: 0.30, tone: 0.10 } },
]

// mood: { danger, energy, mysticism, tone } — kontrolliert vom Parent (Hybrid-Modus)
// onCommit(track): wird NUR beim Loslassen aufgerufen (pointerup / Preset-Klick)
export default function MoodMixer({ mood, onMoodChange, onCommit, playingMusicKey }) {
  // Preview direkt aus den (kontrollierten) Reglerwerten ableiten -> bleibt immer aktuell,
  // auch wenn ein Song-Klick im Soundboard die Regler von außen verschiebt.
  const preview = findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS)

  function handleInput(axis, value) {
    onMoodChange({ ...mood, [axis]: value / 100 })
  }

  function commit() {
    const best = findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS)
    if (best) onCommit(best) // Parent wechselt nur, wenn best.key !== playingMusicKey
  }

  function applyPreset(p) {
    onMoodChange(p.mood)
    const best = findBestTrack(p.mood.danger, p.mood.energy, p.mood.mysticism, p.mood.tone, MUSIC_TRACKS)
    if (best) onCommit(best)
  }

  return (
    <div className="mood-mixer">
      <div className="mm-preview">
        <span className="mm-preview-label">{preview?.label ?? '—'}</span>
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
        <div className="mm-presets-label">Voreinstellungen</div>
        <div className="mm-presets-grid">
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)}>{p.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
