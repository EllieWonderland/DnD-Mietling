import { getMusicGroups } from './soundboardData.jsx'
import './MusicLibrary.css'

// Geordnete Songliste: Kategorie -> Unterkategorie -> Titel (deutsch, ohne Icons).
// variant 'compact' = kleinere Schrift/Abstände für das Kampf-Panel.
export default function MusicLibrary({ playingMusicKey, onPlayMusic, variant = 'default' }) {
  const groups = getMusicGroups()
  return (
    <div className={`music-lib${variant === 'compact' ? ' music-lib-compact' : ''}`}>
      {groups.map(cat => (
        <div className="ml-cat" key={cat.name}>
          <div className="ml-cat-label">{cat.name}</div>
          {cat.subs.map(sub => (
            <div className="ml-sub" key={cat.name + '/' + sub.name}>
              {sub.name && <div className="ml-sub-label">{sub.name}</div>}
              <div className="ml-grid">
                {sub.tracks.map(track => {
                  const playing = playingMusicKey === track.key
                  return (
                    <button
                      key={track.key}
                      className={`ml-btn${playing ? ' ml-playing' : ''}`}
                      onClick={() => onPlayMusic(track)}
                      title={track.label}
                      aria-pressed={playing}
                    >
                      {playing && <span className="ml-playing-dot" aria-hidden>■</span>}
                      <span className="ml-btn-label">{track.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
