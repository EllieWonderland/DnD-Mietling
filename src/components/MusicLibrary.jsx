import { useState } from 'react'
import { getMusicGroups } from './soundboardData.jsx'
import './MusicLibrary.css'

// Cascading selection: Main category -> Subcategory -> Title.
// Each dropdown only appears when the previous one is selected.
// variant 'compact' = smaller font/spacing for the combat panel.
export default function MusicLibrary({ playingMusicKey, onPlayMusic, variant = 'default' }) {
  const groups = getMusicGroups()
  const [catName, setCatName] = useState('')
  const [subName, setSubName] = useState('')

  const cat = groups.find(c => c.name === catName)
  // Some categories (e.g. Handwerk) do not have named subcategories.
  const hasNamedSubs = cat ? cat.subs.some(s => s.name) : false
  const sub = cat ? (hasNamedSubs ? cat.subs.find(s => s.name === subName) : cat.subs[0]) : null
  const tracks = sub ? sub.tracks : []
  const selectedTitle = tracks.some(t => t.key === playingMusicKey) ? playingMusicKey : ''

  function handleCat(e) {
    setCatName(e.target.value)
    setSubName('')
  }

  function handleTitle(e) {
    const track = tracks.find(t => t.key === e.target.value)
    if (track) onPlayMusic(track)
  }

  return (
    <div className={`music-lib${variant === 'compact' ? ' music-lib-compact' : ''}`}>
      <label className="ml-select">
        <span className="ml-select-label">Kategorie</span>
        <select value={catName} onChange={handleCat}>
          <option value="">– wählen –</option>
          {groups.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </label>

      {cat && hasNamedSubs && (
        <label className="ml-select">
          <span className="ml-select-label">Unterkategorie</span>
          <select value={subName} onChange={e => setSubName(e.target.value)}>
            <option value="">– wählen –</option>
            {cat.subs.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
      )}

      {sub && (
        <label className="ml-select">
          <span className="ml-select-label">Titel</span>
          <select value={selectedTitle} onChange={handleTitle}>
            <option value="">– wählen –</option>
            {tracks.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
