import './Soundboard.css'
import { MUSIC_TRACKS, EFFECT_TRACKS, VIDEO_SCENES } from './soundboardData.jsx'

function IconStop() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2"/>
    </svg>
  )
}

export default function Soundboard({
  playingMusicKey,
  volume,
  onVolumeChange,
  onPlayMusic,
  onPlayEffect,
  onOpenScene,
}) {
  return (
    <div className="soundboard">
      <div className="soundboard-header">Soundboard</div>
      <div className="sb-volume-wrap" aria-label="Lautstaerke">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="sb-volume-slider"
          aria-label="Lautstaerke"
        />
      </div>

      <div className="sb-section">
        <div className="sb-section-label">Musik</div>
        <div className="sb-music-grid">
          {MUSIC_TRACKS.map(track => {
            const playing = playingMusicKey === track.key
            return (
              <button
                key={track.key}
                className={`sb-icon-btn${playing ? ' sb-playing' : ''}`}
                onClick={() => onPlayMusic(track)}
                aria-label={track.label}
                title={track.label}
                aria-pressed={playing}
              >
                <span className="sb-icon-only">{playing ? <IconStop /> : <track.Icon />}</span>
                <span className="sb-btn-label">{track.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-label">Szenen</div>
        <div className="sb-scenes-grid">
          {VIDEO_SCENES.map(scene => (
            <button
              key={scene.key}
              className="sb-icon-btn sb-scene-btn"
              onClick={() => onOpenScene(scene)}
              aria-label={scene.label}
              title={scene.label}
            >
              <span className="sb-icon-only"><scene.Icon /></span>
              <span className="sb-btn-label">{scene.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sb-section">
        <div className="sb-section-label">Effekte</div>
        <div className="sb-effects-grid">
          {EFFECT_TRACKS.map(track => (
            <button
              key={track.key}
              className="sb-icon-btn sb-effect-btn"
              onClick={() => onPlayEffect(track)}
              aria-label={track.label}
              title={track.label}
            >
              <span className="sb-icon-only"><track.Icon /></span>
              <span className="sb-btn-label">{track.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
