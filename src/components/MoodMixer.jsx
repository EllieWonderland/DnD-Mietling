import { MUSIC_TRACKS } from './soundboardData.jsx'
import { findBestTrack } from '../utils/moodSelector.js'
import './MoodMixer.css'

const AXES = [
  { key: 'danger',    label: 'Bedrohung' },
  { key: 'energy',    label: 'Energie' },
  { key: 'mysticism', label: 'Mystik' },
  { key: 'tone',      label: 'Tonalität' },
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
    </div>
  )
}
