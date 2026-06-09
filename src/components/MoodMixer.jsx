import { MUSIC_TRACKS } from './soundboardData.jsx'
import { findBestTrack } from '../utils/moodSelector.js'
import './MoodMixer.css'

const AXES = [
  { key: 'danger',    label: 'Bedrohung' },
  { key: 'energy',    label: 'Energie' },
  { key: 'mysticism', label: 'Mystik' },
  { key: 'tone',      label: 'Tonalität' },
]

// mood: { danger, energy, mysticism, tone } - controlled by parent (hybrid mode)
// onCommit(track): ONLY called on release (pointerup / preset click)
export default function MoodMixer({ mood, onMoodChange, onCommit, onStop, playingMusicKey }) {
  // Derive preview directly from (controlled) slider values -> always up-to-date,
  // even if a song click in the soundboard shifts sliders externally.
  const preview = findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS)

  function handleInput(axis, value) {
    onMoodChange({ ...mood, [axis]: value / 100 })
  }

  function commit() {
    const best = findBestTrack(mood.danger, mood.energy, mood.mysticism, mood.tone, MUSIC_TRACKS)
    if (best) onCommit(best) // Parent only switches if best.key !== playingMusicKey
  }

  return (
    <div className="mood-mixer">
      <div className="mm-preview">
        <span className="mm-preview-label">{preview?.label ?? '—'}</span>
        {playingMusicKey === preview?.key && <span className="mm-live">● live</span>}
        {playingMusicKey && onStop && (
          <button
            type="button"
            className="mm-stop"
            onClick={onStop}
            title="Musik stoppen"
            aria-label="Musik stoppen"
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          </button>
        )}
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
