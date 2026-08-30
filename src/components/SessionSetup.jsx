import { useState } from 'react'
import Soundboard from './Soundboard.jsx'
import TvConnectPanel from './TvConnectPanel.jsx'
import './SessionSetup.css'

export default function SessionSetup({
  players,
  room,
  onStart,
  onUpdateProfile,
  playingMusicKey,
  volume,
  onVolumeChange,
  onPlayMusic,
  onPlayEffect,
  onOpenScene,
  onStopScene,
  activeSceneKey,
  activeSceneFit,
  onToggleSceneFit,
  mood,
  onMoodChange,
  onSelectMusic,
  onStopMusic,
}) {
  const [selected, setSelected] = useState(players.map(p => p.id))
  const [initiatives, setInitiatives] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function setInit(id, val) {
    setInitiatives(prev => ({ ...prev, [id]: val }))
  }

  function startEditProfile(p) {
    setEditingId(p.id)
    setEditName(p.name)
  }

  function saveProfile() {
    const name = editName.trim() || players.find(p => p.id === editingId)?.name || editingId
    onUpdateProfile(editingId, name)
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function canStart() {
    return selected.length > 0
  }

  return (
    <div className="setup-screen">
      <div className="setup-content">
        <h1 className="setup-title">DnD Mietling</h1>
        <p className="setup-subtitle">Wähle die Teilnehmer für diese Session</p>

        <div className="player-list">
          {players.map(p => (
            <div
              key={p.id}
              className={`player-row ${selected.includes(p.id) ? 'selected' : ''}`}
            >
              {editingId === p.id ? (
                <div className="profile-edit-row">
                  <input
                    className="profile-edit-name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveProfile(); if (e.key === 'Escape') cancelEdit() }}
                    placeholder="Name"
                    autoFocus
                  />
                  <button className="profile-save-btn" onClick={saveProfile} title="Speichern">✓</button>
                  <button className="profile-cancel-btn" onClick={cancelEdit} title="Abbrechen">✕</button>
                </div>
              ) : (
                <>
                  <label className="player-check-label">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="player-checkbox"
                    />
                    <span className="player-name">{p.name}</span>
                  </label>
                  <div className="player-row-right">
                    {selected.includes(p.id) && (
                      <div className="init-input-wrap">
                        <span className="init-label">Initiative</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="init-input"
                          value={initiatives[p.id] ?? ''}
                          onChange={e => setInit(p.id, e.target.value)}
                          placeholder="1"
                          min="1"
                          max="30"
                        />
                      </div>
                    )}
                    <button
                      className="profile-edit-btn"
                      onClick={() => startEditProfile(p)}
                      title="Profil bearbeiten"
                    >✏️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <button
          className="start-btn"
          disabled={!canStart()}
          onClick={() => onStart(selected, initiatives)}
        >
          Kampf Beginnen
        </button>

        <TvConnectPanel room={room} />

        <div className="setup-soundboard">
          <Soundboard
            playingMusicKey={playingMusicKey}
            volume={volume}
            onVolumeChange={onVolumeChange}
            onPlayMusic={onPlayMusic}
            onPlayEffect={onPlayEffect}
            onOpenScene={onOpenScene}
            onStopScene={onStopScene}
            activeSceneKey={activeSceneKey}
            activeSceneFit={activeSceneFit}
            onToggleSceneFit={onToggleSceneFit}
            mood={mood}
            onMoodChange={onMoodChange}
            onSelectMusic={onSelectMusic}
            onStopMusic={onStopMusic}
          />
        </div>
      </div>
    </div>
  )
}
