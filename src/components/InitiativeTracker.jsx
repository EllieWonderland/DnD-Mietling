import { useState, useRef, useEffect } from 'react'
import ParticipantCard from './ParticipantCard.jsx'
import AddMonsterModal from './AddMonsterModal.jsx'
import VictoryOverlay from './VictoryOverlay.jsx'
import DefeatOverlay from './DefeatOverlay.jsx'
import { EFFECT_TRACKS } from './soundboardData.jsx'
import MoodMixer from './MoodMixer.jsx'
import MusicLibrary from './MusicLibrary.jsx'
import './InitiativeTracker.css'

let monsterIdCounter = Date.now()

export default function InitiativeTracker({
  participants, setParticipants,
  round, activeIndex, setActiveIndex,
  onNextTurn, onPrevTurn, onEndCombat, victory, setVictory, defeat, setDefeat,
  displayOnly = false,
  playingMusicKey, volume, onVolumeChange, onPlayMusic, onPlayEffect,
  mood, onMoodChange, onSelectMusic,
}) {
  const [showAddMonster, setShowAddMonster] = useState(false)
  const [showAddAlly, setShowAddAlly] = useState(false)
  const [concentrationAlert, setConcentrationAlert] = useState(null)
  const [showSoundboard, setShowSoundboard] = useState(false)
  const [canDrag, setCanDrag] = useState(!displayOnly)
  const dragItem = useRef(null)
  const dragOver = useRef(null)
  const cardRefs = useRef([])
  const listRef = useRef(null)

  // Auto-scroll active card into view
  useEffect(() => {
    const el = cardRefs.current[activeIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex])

  // Victory: react to any participant change
  useEffect(() => {
    const monsters = participants.filter(p => p.type === 'monster')
    if (monsters.length > 0 && monsters.every(m => m.dead)) {
      setVictory(true)
    }
  }, [participants, setVictory])

  const visible = participants.filter(p => !(p.type === 'monster' && p.dead))

  function addMonster(name, initiative, hp) {
    const id = `monster-${monsterIdCounter++}`
    const newMonster = {
      id, name, type: 'monster',
      initiative: Math.max(1, parseInt(initiative) || 1),
      hp: parseInt(hp) || 0,
      maxHp: parseInt(hp) || 0,
      damage: 0,
      bloodied: false, dead: false,
      reaction: false,
      conditions: [],
    }
    const next = [...participants, newMonster].sort((a, b) => b.initiative - a.initiative)
    setParticipants(next)
  }

  function addAlly(name, initiative, hp) {
    const id = `ally-${monsterIdCounter++}`
    const maxHp = parseInt(hp) || 20
    const newAlly = {
      id, name, type: 'ally',
      initiative: Math.max(1, parseInt(initiative) || 1),
      hp: maxHp, maxHp,
      reaction: false,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
    }
    const next = [...participants, newAlly].sort((a, b) => b.initiative - a.initiative)
    setParticipants(next)
  }

  function removeAlly(id) {
    const removedIdx = visible.findIndex(p => p.id === id)
    const next = participants.filter(p => p.id !== id)
    setParticipants(next)
    if (removedIdx >= 0 && removedIdx < activeIndex) {
      setActiveIndex(prev => Math.max(0, prev - 1))
    } else if (removedIdx === activeIndex) {
      const newVisible = next.filter(p => !(p.type === 'monster' && p.dead))
      setActiveIndex(Math.min(activeIndex, Math.max(0, newVisible.length - 1)))
    }
  }

  function duplicateMonster(monster) {
    const id = `monster-${monsterIdCounter++}`
    const copy = { ...monster, id, damage: 0, bloodied: false, dead: false, conditions: [] }
    copy.reaction = false
    const next = [...participants, copy].sort((a, b) => b.initiative - a.initiative)
    setParticipants(next)
  }

  function updateParticipant(id, changes, alertData) {
    let next = participants.map(p => p.id === id ? { ...p, ...changes } : p)
    if ('initiative' in changes) {
      const activeId = visible[activeIndex]?.id
      next = [...next].sort((a, b) => b.initiative - a.initiative)
      if (activeId) {
        const newVisible = next.filter(p => !(p.type === 'monster' && p.dead))
        const newIdx = newVisible.findIndex(p => p.id === activeId)
        if (newIdx >= 0) setActiveIndex(newIdx)
      }
    }
    setParticipants(next)
    if (!displayOnly && alertData) setConcentrationAlert(alertData)
  }

  function killMonster(id) {
    const killedIdx = visible.findIndex(p => p.id === id)
    const next = participants.map(p => p.id === id ? { ...p, dead: true } : p)
    setParticipants(next)
    if (killedIdx >= 0 && killedIdx < activeIndex) {
      setActiveIndex(prev => Math.max(0, prev - 1))
    } else if (killedIdx === activeIndex) {
      const newVisible = next.filter(p => !(p.type === 'monster' && p.dead))
      setActiveIndex(Math.min(activeIndex, Math.max(0, newVisible.length - 1)))
    }
  }

  function removeMonster(id) {
    const removedIdx = visible.findIndex(p => p.id === id)
    const next = participants.filter(p => p.id !== id)
    setParticipants(next)
    if (removedIdx >= 0 && removedIdx < activeIndex) {
      setActiveIndex(prev => Math.max(0, prev - 1))
    } else if (removedIdx === activeIndex) {
      const newVisible = next.filter(p => !(p.type === 'monster' && p.dead))
      setActiveIndex(Math.min(activeIndex, Math.max(0, newVisible.length - 1)))
    }
    const hadMonsters = participants.some(p => p.type === 'monster')
    const hasAliveMonsters = next.some(p => p.type === 'monster' && !p.dead)
    if (hadMonsters && !hasAliveMonsters) setVictory(true)
  }

  function handleNextTurn() {
    setCanDrag(false)
    const alive = participants.filter(p => !(p.type === 'monster' && p.dead))
    const nextIdx = activeIndex + 1
    if (nextIdx >= alive.length) {
      setActiveIndex(0)
      onNextTurn()
    } else {
      setActiveIndex(nextIdx)
    }
  }

  function handlePrevTurn() {
    const alive = participants.filter(p => !(p.type === 'monster' && p.dead))
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
    } else if (round > 1) {
      setActiveIndex(Math.max(0, alive.length - 1))
      onPrevTurn()
    }
  }

  function onDragStart(e, idx) {
    if (!canDrag) { e.preventDefault(); return }
    dragItem.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragEnter(e, idx) {
    if (!canDrag) return
    dragOver.current = idx
    e.preventDefault()
  }
  function onDragEnd() {
    if (!canDrag) return
    const from = dragItem.current
    const to = dragOver.current
    dragItem.current = null
    dragOver.current = null
    if (from === null || to === null || from === to) return
    const fromP = visible[from]
    const toP = visible[to]
    const newList = [...participants]
    const fromGlobal = participants.findIndex(p => p.id === fromP.id)
    const toGlobal = participants.findIndex(p => p.id === toP.id)
    ;[newList[fromGlobal], newList[toGlobal]] = [newList[toGlobal], newList[fromGlobal]]
    setParticipants(newList)
  }

  return (
    <div className="tracker-layout">
      <header className="tracker-header">
        {displayOnly
          ? <div />
          : (
            <div className="tracker-header-left">
              <button className="end-btn" onClick={onEndCombat}>← Beenden</button>
              {onPlayMusic && (
                <button
                  className={`sb-toggle-btn${showSoundboard ? ' sb-toggle-active' : ''}`}
                  onClick={() => setShowSoundboard(s => !s)}
                  title="Soundboard"
                >🎵</button>
              )}
            </div>
          )
        }
        <div className="round-display">
          <span className="round-label">Runde</span>
          <span className="round-number">{round}</span>
        </div>
        {displayOnly
          ? <div />
          : (
            <div className="tracker-header-actions">
              <button className="add-ally-btn" onClick={() => setShowAddAlly(true)}>+ Verbündeter</button>
              <button className="add-monster-btn" onClick={() => setShowAddMonster(true)}>+ Monster</button>
            </div>
          )
        }
      </header>

      {!displayOnly && showSoundboard && onPlayMusic && (
        <div className="combat-sb-panel">
          <div className="combat-sb-volume-row">
            <span className="combat-sb-vol-icon">🔊</span>
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume ?? 0.72}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              className="combat-sb-slider"
            />
          </div>
          {mood && onMoodChange && onSelectMusic && (
            <div className="combat-sb-section">
              <span className="combat-sb-label">Stimmung</span>
              <MoodMixer
                mood={mood}
                onMoodChange={onMoodChange}
                onCommit={onSelectMusic}
                playingMusicKey={playingMusicKey}
              />
            </div>
          )}
          <div className="combat-sb-section">
            <span className="combat-sb-label">Musik</span>
            <MusicLibrary playingMusicKey={playingMusicKey} onPlayMusic={onPlayMusic} variant="compact" />
          </div>
          <div className="combat-sb-section">
            <span className="combat-sb-label">Effekte</span>
            <div className="combat-sb-grid">
              {EFFECT_TRACKS.map(track => (
                <button
                  key={track.key}
                  className="combat-sb-btn"
                  onClick={() => onPlayEffect(track)}
                  title={track.label}
                >
                  <span className="combat-sb-icon"><track.Icon /></span>
                  <span className="combat-sb-btn-label">{track.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="tracker-body">
        <div className="participant-list" ref={listRef}>
          {visible.map((p, idx) => (
            <div
              key={p.id}
              ref={el => { cardRefs.current[idx] = el }}
              draggable={canDrag}
              onDragStart={e => onDragStart(e, idx)}
              onDragEnter={e => onDragEnter(e, idx)}
              onDragEnd={onDragEnd}
              onDragOver={e => { if (canDrag) e.preventDefault() }}
              className={canDrag ? 'draggable-row' : ''}
            >
              <ParticipantCard
                participant={p}
                isActive={idx === activeIndex}
                onUpdate={(changes, alertData) => updateParticipant(p.id, changes, alertData)}
                onKill={p.type === 'monster' ? () => killMonster(p.id) : undefined}
                onRemove={p.type === 'monster' ? () => removeMonster(p.id) : () => removeAlly(p.id)}
                onDuplicate={p.type === 'monster' ? () => duplicateMonster(p) : undefined}
                displayOnly={displayOnly}
              />
            </div>
          ))}
        </div>

        <div className="compact-order-panel">
            {[...participants]
              .sort((a, b) => b.initiative - a.initiative)
              .map(p => {
                const isDead = p.type === 'monster' && p.dead
                const visibleIdx = visible.findIndex(v => v.id === p.id)
                const isActive = !isDead && visibleIdx === activeIndex
                return (
                  <div
                    key={p.id}
                    className={[
                      'compact-row',
                      p.type === 'player' ? 'compact-player' : p.type === 'ally' ? 'compact-ally' : 'compact-monster',
                      isActive ? 'compact-active' : '',
                      isDead ? 'compact-dead' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="compact-init">{p.initiative}</span>
                    <span className="compact-name">{p.name}</span>
                    {p.dying && <span className="compact-dying">♥</span>}
                    {isDead && <span className="compact-skull">☠</span>}
                  </div>
                )
              })}
          </div>
      </div>

      {!displayOnly && (
        <footer className="tracker-footer">
          <button
            className="prev-turn-btn"
            onClick={handlePrevTurn}
            disabled={activeIndex === 0 && round <= 1}
          >
            ◀ Zurück
          </button>
          <button className="next-turn-btn" onClick={handleNextTurn}>
            Nächster Zug ▶
          </button>
        </footer>
      )}

      {!displayOnly && showAddMonster && (
        <AddMonsterModal
          onAdd={(name, initiative, hp) => { addMonster(name, initiative, hp); setShowAddMonster(false) }}
          onClose={() => setShowAddMonster(false)}
        />
      )}

      {!displayOnly && showAddAlly && (
        <AddMonsterModal
          title="Verbündeten hinzufügen"
          isAlly
          onAdd={(name, initiative, hp) => { addAlly(name, initiative, hp); setShowAddAlly(false) }}
          onClose={() => setShowAddAlly(false)}
        />
      )}

      {!displayOnly && concentrationAlert && (
        <div className="concentration-overlay" onClick={() => setConcentrationAlert(null)}>
          <div className="concentration-box">
            <div className="concentration-title">Konzentrationswurf!</div>
            <div className="concentration-dc">DC {concentrationAlert.dc}</div>
            <div className="concentration-info">
              {concentrationAlert.name} hat {concentrationAlert.damage} Schaden erhalten
            </div>
            <button className="concentration-close" onClick={() => setConcentrationAlert(null)}>OK</button>
          </div>
        </div>
      )}

      {victory && (
        <VictoryOverlay onClose={() => { setVictory(false); onEndCombat() }} muted={!displayOnly} />
      )}

      {defeat && (
        <DefeatOverlay onClose={() => { setDefeat(false); onEndCombat() }} muted={!displayOnly} />
      )}
    </div>
  )
}
