import { useState, useRef, useEffect } from 'react'
import ParticipantCard from './ParticipantCard.jsx'
import AddMonsterModal from './AddMonsterModal.jsx'
import VictoryOverlay from './VictoryOverlay.jsx'
import DefeatOverlay from './DefeatOverlay.jsx'
import { getEffectGroups } from './soundboardData.jsx'
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
  mood, onMoodChange, onSelectMusic, onStopMusic,
}) {
  const [showAddMonster, setShowAddMonster] = useState(false)
  const [showAddAlly, setShowAddAlly] = useState(false)
  const [concentrationAlert, setConcentrationAlert] = useState(null)
  const [showSoundboard, setShowSoundboard] = useState(false)
  const [cTab, setCTab] = useState(null) // 'music' | 'effects' | 'scenes' | null
  const [canDrag, setCanDrag] = useState(!displayOnly)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const dragItem = useRef(null)
  const longPressTimer = useRef(null)
  const preventTouchScroll = useRef(e => e.preventDefault()).current
  const cardRefs = useRef([])
  const listRef = useRef(null)

  // Drag-Aufräumen beim Unmount (Timer + Scroll-Sperre lösen)
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      document.removeEventListener('touchmove', preventTouchScroll, { passive: false })
    }
  }, [preventTouchScroll])

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

  // ── Pointer-basiertes Drag&Drop (Maus + Touch) ──
  // Long-Press-Schwelle, damit Scrollen am Tablet nicht versehentlich zieht.
  const LONG_PRESS_MS = 250
  const MOVE_CANCEL_PX = 12

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Beim aktiven Ziehen das native Scrollen unterbinden (non-passiv → preventDefault wirkt).
  function activateDrag() {
    const st = dragItem.current
    if (!st || st.active) return
    st.active = true
    setDraggingIdx(st.fromIdx)
    try { st.el.setPointerCapture(st.pointerId) } catch { /* ignore */ }
    if (navigator.vibrate) navigator.vibrate(15)
    document.addEventListener('touchmove', preventTouchScroll, { passive: false })
  }

  function endDrag(doSwap) {
    clearLongPress()
    const st = dragItem.current
    if (st && st.active) {
      try { st.el.releasePointerCapture(st.pointerId) } catch { /* ignore */ }
      document.removeEventListener('touchmove', preventTouchScroll, { passive: false })
      if (doSwap) {
        const from = st.fromIdx
        const to = dragOverIdx
        if (to !== null && from !== to) {
          // Echter Platztausch: gezogener Charakter und Ziel-Charakter tauschen die Plätze
          const fromP = visible[from]
          const toP = visible[to]
          if (fromP && toP) {
            const newList = [...participants]
            const fromGlobal = newList.findIndex(p => p.id === fromP.id)
            const toGlobal = newList.findIndex(p => p.id === toP.id)
            ;[newList[fromGlobal], newList[toGlobal]] = [newList[toGlobal], newList[fromGlobal]]
            setParticipants(newList)
          }
        }
      }
    }
    dragItem.current = null
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  function onPointerDown(e, idx) {
    if (!canDrag) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Nicht ziehen, wenn auf ein Bedienelement der Karte getippt wird
    if (e.target.closest('button, input, select, textarea, label, a, [role="button"]')) return
    dragItem.current = {
      pointerId: e.pointerId,
      fromIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      el: e.currentTarget,
    }
    if (e.pointerType === 'mouse') {
      // Maus: sofort ziehen (kein Scroll-Konflikt)
      activateDrag()
    } else {
      // Touch/Pen: erst nach Long-Press, damit Wischen weiterhin scrollt
      longPressTimer.current = setTimeout(activateDrag, LONG_PRESS_MS)
    }
  }

  function onPointerMove(e) {
    const st = dragItem.current
    if (!st) return
    if (!st.active) {
      // Vor Aktivierung: zu große Bewegung = Scroll-Geste → abbrechen
      const dx = Math.abs(e.clientX - st.startX)
      const dy = Math.abs(e.clientY - st.startY)
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearLongPress()
        dragItem.current = null
      }
      return
    }
    // Aktives Ziehen: Zielzeile unter dem Zeiger bestimmen
    const target = document.elementFromPoint(e.clientX, e.clientY)
    const rowEl = target && target.closest('[data-row-idx]')
    if (rowEl) {
      const overIdx = Number(rowEl.dataset.rowIdx)
      if (overIdx !== dragOverIdx) setDragOverIdx(overIdx)
    }
  }

  function onPointerUp() {
    endDrag(true)
  }

  function onPointerCancel() {
    endDrag(false)
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

      {!displayOnly && showSoundboard && onPlayMusic && (() => {
        const toggleTab = tab => setCTab(t => (t === tab ? null : tab))
        return (
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

          <div className="combat-sb-tabs">
            <button
              className={`combat-sb-tab${cTab === 'music' ? ' active' : ''}`}
              onClick={() => toggleTab('music')}
            >
              Musik{playingMusicKey && <span className="combat-sb-tab-live">●</span>}
            </button>
            <button
              className={`combat-sb-tab${cTab === 'effects' ? ' active' : ''}`}
              onClick={() => toggleTab('effects')}
            >
              Soundeffekte
            </button>
          </div>

          {cTab === 'music' && (
            <div className="combat-sb-tabpanel">
              {mood && onMoodChange && onSelectMusic && (
                <MoodMixer
                  mood={mood}
                  onMoodChange={onMoodChange}
                  onCommit={onSelectMusic}
                  onStop={onStopMusic}
                  playingMusicKey={playingMusicKey}
                />
              )}
              <MusicLibrary playingMusicKey={playingMusicKey} onPlayMusic={onPlayMusic} variant="compact" />
            </div>
          )}

          {cTab === 'effects' && (
            <div className="combat-sb-tabpanel">
              {getEffectGroups().map(group => (
                <div key={group.name} className="combat-sb-effect-group">
                  <span className="combat-sb-group-label">{group.name}</span>
                  <div className="combat-sb-grid">
                    {group.tracks.map(track => (
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
              ))}
            </div>
          )}

        </div>
        )
      })()}

      <div className="tracker-body">
        <div className="participant-list" ref={listRef}>
          {visible.map((p, idx) => (
            <div
              key={p.id}
              ref={el => { cardRefs.current[idx] = el }}
              data-row-idx={idx}
              onPointerDown={e => onPointerDown(e, idx)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              className={[
                canDrag ? 'draggable-row' : '',
                dragOverIdx === idx ? 'drag-over-target' : '',
                draggingIdx === idx ? 'dragging' : '',
              ].filter(Boolean).join(' ')}
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
