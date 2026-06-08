import { useState } from 'react'
import './Soundboard.css'
import { getEffectGroups, VIDEO_SCENES } from './soundboardData.jsx'
import MoodMixer from './MoodMixer.jsx'
import MusicLibrary from './MusicLibrary.jsx'

// Stop-Symbol (für Szene-stoppen)
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
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
  onStopScene,
  activeSceneKey,
  activeSceneFit = 'contain',
  onToggleSceneFit,
  mood,
  onMoodChange,
  onSelectMusic,
  onStopMusic,
}) {
  // Akkordeon: nur eine Kategorie ist gleichzeitig geöffnet (oder keine).
  const [openTab, setOpenTab] = useState(null) // 'music' | 'effects' | 'scenes' | null
  const toggle = tab => setOpenTab(t => (t === tab ? null : tab))

  const activeScene = activeSceneKey ? VIDEO_SCENES.find(s => s.key === activeSceneKey) : null

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

      <div className="sb-tabs" role="tablist">
        <button
          className={`sb-tab${openTab === 'music' ? ' sb-tab-active' : ''}`}
          onClick={() => toggle('music')}
          aria-expanded={openTab === 'music'}
        >
          <span className="sb-tab-label">Musik</span>
          {playingMusicKey && <span className="sb-tab-live" title="läuft">●</span>}
        </button>
        <button
          className={`sb-tab${openTab === 'effects' ? ' sb-tab-active' : ''}`}
          onClick={() => toggle('effects')}
          aria-expanded={openTab === 'effects'}
        >
          <span className="sb-tab-label">Soundeffekte</span>
        </button>
        <button
          className={`sb-tab${openTab === 'scenes' ? ' sb-tab-active' : ''}`}
          onClick={() => toggle('scenes')}
          aria-expanded={openTab === 'scenes'}
        >
          <span className="sb-tab-label">Videoszenen</span>
          {activeScene && <span className="sb-tab-live" title="läuft">●</span>}
        </button>
      </div>

      {openTab === 'music' && (
        <div className="sb-panel">
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
            <div className="sb-section-label">Bibliothek</div>
            <MusicLibrary playingMusicKey={playingMusicKey} onPlayMusic={onPlayMusic} />
          </div>
        </div>
      )}

      {openTab === 'effects' && (
        <div className="sb-panel">
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
      )}

      {openTab === 'scenes' && (
        <div className="sb-panel">
          {activeScene && (
            <div className="sb-live-bar">
              <span className="sb-live-dot">●</span>
              <span className="sb-live-text">{activeScene.label} läuft auf dem TV</span>
              {onToggleSceneFit && (
                <button
                  className="sb-live-fit"
                  onClick={() => onToggleSceneFit(activeSceneKey)}
                  title={activeSceneFit === 'cover' ? 'Formatfüllend (Ränder ggf. beschnitten) — tippen für Anpassen' : 'Angepasst (ggf. schwarze Balken) — tippen für Formatfüllend'}
                  aria-label="Darstellung der Szene umschalten"
                >
                  {activeSceneFit === 'cover' ? 'Vollbild' : 'Anpassen'}
                </button>
              )}
              {onStopScene && (
                <button
                  className="sb-live-stop"
                  onClick={onStopScene}
                  title="Szene stoppen"
                  aria-label="Szene stoppen"
                >
                  <StopIcon />
                </button>
              )}
            </div>
          )}
          <div className="sb-scenes-grid">
            {VIDEO_SCENES.map(scene => (
              <button
                key={scene.key}
                className={`sb-icon-btn sb-scene-btn${activeSceneKey === scene.key ? ' sb-playing' : ''}`}
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
      )}
    </div>
  )
}
