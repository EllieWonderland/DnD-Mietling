import { useState, useRef, useEffect } from 'react'
import ParticipantCard from './ParticipantCard.jsx'
import AddMonsterModal from './AddMonsterModal.jsx'
import DuplicateMonsterModal from './DuplicateMonsterModal.jsx'
import VictoryOverlay from './VictoryOverlay.jsx'
import DefeatOverlay from './DefeatOverlay.jsx'
import { getEffectGroups } from './soundboardData.jsx'
import MoodMixer from './MoodMixer.jsx'
import MusicLibrary from './MusicLibrary.jsx'
import { getMonsterColor } from '../utils/monsterColors.js'
import './InitiativeTracker.css'

let monsterIdCounter = Date.now()

export default function InitiativeTracker({
  participants, setParticipants,
  round, activeIndex, setActiveIndex,
  onNextTurn, onPrevTurn, onEndCombat, victory, setVictory, defeat, setDefeat,
  displayOnly = false,
  playingMusicKey, volume, onVolumeChange, onPlayMusic, onPlayEffect,
  mood, onMoodChange, onSelectMusic, onStopMusic,
  onCompactScroll, compactScroll,
}) {
  const [showAddMonster, setShowAddMonster] = useState(false)
  const [showAddAlly, setShowAddAlly] = useState(false)
  const [duplicateTarget, setDuplicateTarget] = useState(null)
  const [concentrationAlert, setConcentrationAlert] = useState(null)
  const [showSoundboard, setShowSoundboard] = useState(false)
  const [cTab, setCTab] = useState(null) // 'music' | 'effects' | 'scenes' | null
  // Swapping places is only allowed before the first action of a combat. A
  // combat resumed mid-fight is therefore already locked.
  const [canDrag, setCanDrag] = useState(!displayOnly && round === 1 && activeIndex === 0)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const dragItem = useRef(null)
  const longPressTimer = useRef(null)
  const preventTouchScroll = useRef(e => e.preventDefault()).current
  // Reordering the list for the swap preview makes React move the dragged DOM
  // node, which can drop its pointer capture. Window-level listeners guarantee
  // the drag always ends, capture or not.
  const endDragRef = useRef(null)
  const windowPointerUp = useRef(() => endDragRef.current?.(true)).current
  const windowPointerCancel = useRef(() => endDragRef.current?.(false)).current
  const cardRefs = useRef([])
  const listRef = useRef(null)
  const compactPanelRef = useRef(null)
  const compactRowRefs = useRef([])
  const isProgrammaticScroll = useRef(false)

  useEffect(() => {
    endDragRef.current = endDrag
  })

  // Drag cleanup on unmount (clear timer + scroll lock)
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      document.removeEventListener('touchmove', preventTouchScroll, { passive: false })
      window.removeEventListener('pointerup', windowPointerUp)
      window.removeEventListener('pointercancel', windowPointerCancel)
    }
  }, [preventTouchScroll, windowPointerUp, windowPointerCancel])

  const visible = participants.filter(p => !(p.type === 'monster' && p.dead))

  // In display mode: sync manual scroll from controller
  useEffect(() => {
    if (!displayOnly || !compactScroll || !compactPanelRef.current) return
    const el = compactPanelRef.current
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0 && typeof compactScroll.scrollRatio === 'number') {
      el.scrollTop = compactScroll.scrollRatio * maxScroll
    } else if (typeof compactScroll.scrollTop === 'number') {
      el.scrollTop = compactScroll.scrollTop
    }
  }, [compactScroll, displayOnly])

  // Auto-scroll active card and sidebar into view at 2nd position
  useEffect(() => {
    const timer = setTimeout(() => {
      isProgrammaticScroll.current = true

      // 1. Participant List: active element at 2nd position (previous element at top)
      if (listRef.current) {
        if (activeIndex <= 0) {
          listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const prevEl = cardRefs.current[activeIndex - 1]
          if (prevEl) {
            const top = prevEl.offsetTop - listRef.current.offsetTop
            listRef.current.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
          }
        }
      }

      // 2. Compact Order Panel: active element at 2nd position (only when not manually scrolled on display)
      if (compactPanelRef.current && (!displayOnly || !compactScroll)) {
        // Mirrors the turn order of the main list so manual swaps land here too.
        const activeParticipant = visible[activeIndex]
        const compactActiveIdx = participants.findIndex(p => p.id === activeParticipant?.id)

        if (compactActiveIdx <= 0) {
          compactPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          const prevRow = compactRowRefs.current[compactActiveIdx - 1]
          if (prevRow) {
            const top = prevRow.offsetTop - compactPanelRef.current.offsetTop
            compactPanelRef.current.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
          }
        }
      }

      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 350)
    }, 40)

    return () => clearTimeout(timer)
  }, [activeIndex, round])

  function handleCompactPanelScroll(e) {
    if (displayOnly || isProgrammaticScroll.current) return
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    const ratio = maxScroll > 0 ? el.scrollTop / maxScroll : 0
    onCompactScroll?.({
      scrollRatio: ratio,
      scrollTop: el.scrollTop,
      timestamp: Date.now(),
    })
  }

  // Victory/Defeat: react to any participant change. The first result
  // is locked (guard) so both overlays/sounds don't play.
  useEffect(() => {
    if (victory || defeat) return
    const monsters = participants.filter(p => p.type === 'monster')
    const players = participants.filter(p => p.type === 'player')
    const allMonstersDead = monsters.length > 0 && monsters.every(m => m.dead)
    // Player is down if HP is 0 OR death save is active (dying).
    const allPlayersDown = players.length > 0 && players.every(p => p.hp <= 0 || p.dying)
    if (allMonstersDead) {
      setVictory(true)
    } else if (allPlayersDown && monsters.some(m => !m.dead)) {
      setDefeat(true)
    }
  }, [participants, victory, defeat, setVictory, setDefeat])

  function addMonster(name, initiative, hp, color = null) {
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
      color: color || null,
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

  function duplicateMonsterWithColor(monster, color) {
    const id = `monster-${monsterIdCounter++}`
    const copy = {
      ...monster,
      id,
      color: color ?? null,
      damage: 0,
      bloodied: false,
      dead: false,
      conditions: [],
      reaction: false,
    }
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
    if (hadMonsters && !hasAliveMonsters && !defeat) setVictory(true)
  }

  function handleNextTurn() {
    // First turn taken -> the order is fixed for the rest of the combat.
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

  // ── Pointer-based Drag&Drop (Mouse + Touch) ──
  // Long-press threshold to prevent accidental dragging while scrolling on tablets.
  const LONG_PRESS_MS = 450
  const MOVE_CANCEL_PX = 12
  const MOUSE_START_PX = 6

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Prevent native scrolling during active drag (non-passive -> preventDefault works).
  function activateDrag() {
    const st = dragItem.current
    if (!st || st.active) return
    st.active = true
    setDraggingIdx(st.fromIdx)
    try { st.el.setPointerCapture(st.pointerId) } catch { /* ignore */ }
    if (navigator.vibrate) navigator.vibrate(15)
    document.addEventListener('touchmove', preventTouchScroll, { passive: false })
    window.addEventListener('pointerup', windowPointerUp)
    window.addEventListener('pointercancel', windowPointerCancel)
  }

  function endDrag(doSwap) {
    clearLongPress()
    const st = dragItem.current
    if (st && st.active) {
      try { st.el.releasePointerCapture(st.pointerId) } catch { /* ignore */ }
      document.removeEventListener('touchmove', preventTouchScroll, { passive: false })
      window.removeEventListener('pointerup', windowPointerUp)
      window.removeEventListener('pointercancel', windowPointerCancel)
      if (doSwap) {
        const from = st.fromIdx
        const to = dragOverIdx
        if (to !== null && from !== to) {
          // Swap places: dragged character and target character swap positions
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
    // Do not drag if an interactive element on the card is tapped
    if (e.target.closest('button, input, select, textarea, label, a, [role="button"]')) return
    dragItem.current = {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      fromIdx: idx,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      el: e.currentTarget,
    }
    if (e.pointerType !== 'mouse') {
      // Touch/Pen: wait for long-press so swiping still scrolls
      longPressTimer.current = setTimeout(activateDrag, LONG_PRESS_MS)
    }
    // Mouse drags start in onPointerMove after a few pixels, so a plain click
    // on a card can never turn into a swap.
  }

  function onPointerMove(e) {
    const st = dragItem.current
    if (!st) return
    if (!st.active) {
      const dx = Math.abs(e.clientX - st.startX)
      const dy = Math.abs(e.clientY - st.startY)
      if (st.pointerType === 'mouse') {
        if (dx > MOUSE_START_PX || dy > MOUSE_START_PX) activateDrag()
        return
      }
      // Touch/Pen before activation: too much movement = scroll gesture -> cancel
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearLongPress()
        dragItem.current = null
      }
      return
    }
    // Active drag: determine target row under pointer. Leaving the list clears
    // the target again, so releasing outside cancels instead of swapping with
    // whatever happened to be hovered last.
    const target = document.elementFromPoint(e.clientX, e.clientY)
    const rowEl = target && target.closest('[data-row-idx]')
    const overIdx = rowEl ? Number(rowEl.dataset.rowIdx) : null
    if (overIdx !== dragOverIdx) setDragOverIdx(overIdx)
  }

  function onPointerUp() {
    endDrag(true)
  }

  function onPointerCancel() {
    endDrag(false)
  }

  // While a swap is being aimed, render the list exactly as it will look once
  // released, and keep both partners clearly marked. Indices stay tied to
  // positions (not to cards), so hovering does not oscillate.
  const swapActive =
    draggingIdx !== null && dragOverIdx !== null && dragOverIdx !== draggingIdx
  const swapSourceId = draggingIdx !== null ? visible[draggingIdx]?.id ?? null : null
  const swapTargetId = swapActive ? visible[dragOverIdx]?.id ?? null : null

  const previewRows = swapActive
    ? (() => {
        const rows = [...visible]
        ;[rows[draggingIdx], rows[dragOverIdx]] = [rows[dragOverIdx], rows[draggingIdx]]
        return rows
      })()
    : visible

  // Whoever ends up acting at the active position - during a preview that is
  // already the swap partner, so both columns agree.
  const activeRowId = previewRows[activeIndex]?.id ?? null

  // Right-hand strip shows the same turn order, dead monsters included.
  const compactRows = (() => {
    const rows = [...participants]
    if (swapActive && swapSourceId && swapTargetId) {
      const a = rows.findIndex(p => p.id === swapSourceId)
      const b = rows.findIndex(p => p.id === swapTargetId)
      if (a >= 0 && b >= 0) [rows[a], rows[b]] = [rows[b], rows[a]]
    }
    return rows
  })()

  return (
    <div className={`tracker-layout ${displayOnly ? 'tracker-display-mode' : ''}`}>
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
          {previewRows.map((p, idx) => (
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
                p.id === swapSourceId ? 'swap-source' : '',
                p.id === swapTargetId ? 'swap-target' : '',
              ].filter(Boolean).join(' ')}
            >
              <ParticipantCard
                participant={p}
                isActive={idx === activeIndex}
                onUpdate={(changes, alertData) => updateParticipant(p.id, changes, alertData)}
                onKill={p.type === 'monster' ? () => killMonster(p.id) : undefined}
                onRemove={p.type === 'monster' ? () => removeMonster(p.id) : () => removeAlly(p.id)}
                onDuplicate={p.type === 'monster' ? () => setDuplicateTarget(p) : undefined}
                displayOnly={displayOnly}
              />
            </div>
          ))}
        </div>

        <div className="compact-order-panel" ref={compactPanelRef} onScroll={handleCompactPanelScroll}>
          {compactRows.map((p, cIdx) => {
              const isDead = p.type === 'monster' && p.dead
              const isActive = !isDead && p.id === activeRowId
              const monsterCol = p.color ? getMonsterColor(p.color) : null
              return (
                <div
                  key={p.id}
                  ref={el => { compactRowRefs.current[cIdx] = el }}
                  className={[
                    'compact-row',
                    p.type === 'player' ? 'compact-player' : p.type === 'ally' ? 'compact-ally' : 'compact-monster',
                    isActive ? 'compact-active' : '',
                    isDead ? 'compact-dead' : '',
                    p.id === swapSourceId ? 'compact-swap-source' : '',
                    p.id === swapTargetId ? 'compact-swap-target' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {monsterCol && (
                    <span
                      className="compact-color-dot"
                      style={{
                        backgroundColor: monsterCol.hex,
                        borderColor: monsterCol.border,
                      }}
                      title={`Farbring: ${monsterCol.label}`}
                    />
                  )}
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
          onAdd={(name, initiative, hp, color) => { addMonster(name, initiative, hp, color); setShowAddMonster(false) }}
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

      {!displayOnly && duplicateTarget && (
        <DuplicateMonsterModal
          monster={duplicateTarget}
          onSelectColor={newColor => {
            duplicateMonsterWithColor(duplicateTarget, newColor)
            setDuplicateTarget(null)
          }}
          onClose={() => setDuplicateTarget(null)}
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

      {victory && !defeat && (
        <VictoryOverlay onClose={() => { setVictory(false); onEndCombat() }} muted={!displayOnly} />
      )}

      {defeat && (
        <DefeatOverlay onClose={() => { setDefeat(false); onEndCombat() }} muted={!displayOnly} />
      )}
    </div>
  )
}
