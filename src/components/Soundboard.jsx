import './Soundboard.css'
import { getEffectGroups, VIDEO_SCENES } from './soundboardData.jsx'
import MoodMixer from './MoodMixer.jsx'
import MusicLibrary from './MusicLibrary.jsx'

export default function Soundboard({
  playingMusicKey,
  volume,
  onVolumeChange,
  onPlayMusic,
  onPlayEffect,
  onOpenScene,
  mood,
  onMoodChange,
  onSelectMusic,
  onStopMusic,
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

      {mood && onMoodChange && onSelectMusic && (
        <div className="sb-section">
          <div className="sb-section-label">Stimmung</div>
          <MoodMixer
            mood={mood}
            onMoodChange={onMoodChange}
            onCommit={onSelectMusic}
            onStop={onStopMusic}
            playingMusicKey={playingMusicKey}
          />
        </div>
      )}

      <div className="sb-section">
        <div className="sb-section-label">Musik</div>
        <MusicLibrary playingMusicKey={playingMusicKey} onPlayMusic={onPlayMusic} />
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
        {getEffectGroups().map(group => (
          <div key={group.name} className="sb-effect-group">
            <div className="sb-effect-group-label">{group.name}</div>
            <div className="sb-effects-grid">
              {group.tracks.map(track => (
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
        ))}
      </div>
    </div>
  )
}
