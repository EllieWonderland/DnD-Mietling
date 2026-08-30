import { useState, useRef, useEffect } from 'react'
import ConditionsMenu from './ConditionsMenu.jsx'
import ColorPicker from './ColorPicker.jsx'
import { getMonsterColor } from '../utils/monsterColors.js'
import './ParticipantCard.css'

const CONDITION_DATA = {
  Blinded: { icon: '👁️', label: 'Blind' },
  Charmed: { icon: '💜', label: 'Bezaubert' },
  Deafened: { icon: '🔇', label: 'Taub' },
  Exhaustion: { icon: '💀', label: 'Erschöpfung' },
  Frightened: { icon: '😱', label: 'Verängstigt' },
  Grappled: { icon: '🤝', label: 'Gepackt' },
  Incapacitated: { icon: '🚫', label: 'Handlungsunfähig' },
  Invisible: { icon: '👻', label: 'Unsichtbar' },
  Paralyzed: { icon: '⚡', label: 'Paralysiert' },
  Petrified: { icon: '🗿', label: 'Versteinert' },
  Poisoned: { icon: '☠️', label: 'Vergiftet' },
  Prone: { icon: '⬇️', label: 'Liegend' },
  Restrained: { icon: '⛓️', label: 'Festgesetzt' },
  Stunned: { icon: '💫', label: 'Betäubt' },
  Unconscious: { icon: '💤', label: 'Bewusstlos' },
}

export default function ParticipantCard({ participant: p, isActive, onUpdate, onKill, onRemove, onDuplicate, displayOnly = false }) {
  const [showConditions, setShowConditions] = useState(false)
  const [damageInput, setDamageInput] = useState('')
  const [allyHpInput, setAllyHpInput] = useState('')
  const [showConcModal, setShowConcModal] = useState(false)
  const [concDmgInput, setConcDmgInput] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editInit, setEditInit] = useState('')
  const [editMaxHp, setEditMaxHp] = useState('')
  const [editColor, setEditColor] = useState(null)
  const [editDamage, setEditDamage] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const confirmTimer = useRef(null)

  useEffect(() => () => { if (confirmTimer.current) clearTimeout(confirmTimer.current) }, [])

  function enterEdit() {
    setEditName(p.name)
    setEditInit(String(p.initiative))
    setEditMaxHp(String(p.maxHp || 0))
    setEditDamage(String(p.damage || 0))
    setEditColor(p.color || null)
    setEditMode(true)
    setShowConditions(false)
  }

  function confirmEdit() {
    const name = editName.trim() || p.name
    const initiative = Math.max(1, parseInt(editInit) || 1)
    const maxHp = Math.max(1, parseInt(editMaxHp) || 1)
    const changes = { name, initiative, maxHp }
    if (p.type === 'player' || p.type === 'ally') {
      changes.hp = Math.min(p.hp, maxHp)
    }
    if (p.type === 'monster') {
      // A mistyped damage total is fixed here instead of by deleting the monster.
      const damage = Math.max(0, parseInt(editDamage) || 0)
      changes.damage = damage
      changes.bloodied = maxHp > 0 && damage >= maxHp / 2
      changes.color = editColor
    }
    onUpdate(changes)
    setEditMode(false)
  }

  function handleConcClick() {
    if (p.concentration) {
      setShowConcModal(true)
    } else {
      onUpdate({ concentration: true })
    }
  }

  function computeConcDC() {
    const val = parseInt(concDmgInput)
    if (isNaN(val) || val <= 0) return
    const dc = Math.max(10, Math.floor(val / 2))
    onUpdate({}, { name: p.name, damage: val, dc })
    setConcDmgInput('')
    setShowConcModal(false)
  }

  function loseConcentration() {
    onUpdate({ concentration: false })
    setShowConcModal(false)
    setConcDmgInput('')
  }

  function closeConcModal() {
    setShowConcModal(false)
    setConcDmgInput('')
  }

  // sign +1 adds damage, -1 takes it back (mistyped total or healing).
  // Bloodied follows the damage in both directions; with no max HP the manual
  // 🩸 toggle stays untouched.
  function applyDamage(sign = 1) {
    const val = parseInt(damageInput)
    if (isNaN(val) || val <= 0) return
    const newDamage = Math.max(0, (p.damage || 0) + sign * val)
    const bloodied = p.maxHp > 0 ? newDamage >= p.maxHp / 2 : p.bloodied
    onUpdate({ damage: newDamage, bloodied })
    setDamageInput('')
  }

  function applyAllyDamage() {
    const val = parseInt(allyHpInput)
    if (isNaN(val) || val <= 0) return
    const newHp = Math.max(0, p.hp - val)
    onUpdate({ hp: newHp })
    setAllyHpInput('')
  }

  function applyAllyHeal() {
    const val = parseInt(allyHpInput)
    if (isNaN(val) || val <= 0) return
    const newHp = Math.min(p.maxHp, p.hp + val)
    onUpdate({ hp: newHp })
    setAllyHpInput('')
  }

  function toggleDeathSave(type, index) {
    const ds = p.deathSaves || { successes: 0, failures: 0 }
    if (type === 'success') {
      const newCount = ds.successes === index + 1 ? index : index + 1
      if (newCount >= 3) {
        onUpdate({ hp: 1, dying: false, deathSaves: { successes: 0, failures: 0 } })
      } else {
        onUpdate({ deathSaves: { ...ds, successes: newCount } })
      }
    } else {
      const newCount = ds.failures === index + 1 ? index : index + 1
      if (newCount >= 3) {
        // The third failure kills the character — it never deletes them.
        // The card stays on the board, greyed out and marked ☠. HP stays as it
        // is: it is persisted per player and must not carry a 0 into the next
        // combat, and `dead` alone already counts as down everywhere.
        onUpdate({ dead: true, dying: false, deathSaves: { successes: 0, failures: 3 } })
      } else {
        onUpdate({ deathSaves: { ...ds, failures: newCount } })
      }
    }
  }

  function revive() {
    onUpdate({
      dead: false,
      dying: false,
      hp: Math.max(1, p.hp || 0),
      deathSaves: { successes: 0, failures: 0 },
    })
  }

  // Removing a participant is not undoable, so ✕ always asks first. The prompt
  // disarms itself after a few seconds so no card is left in a pending state.
  function requestRemove() {
    if (confirmRemove) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      setConfirmRemove(false)
      onRemove()
      return
    }
    setConfirmRemove(true)
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    confirmTimer.current = setTimeout(() => setConfirmRemove(false), 4000)
  }

  function toggleCondition(cond) {
    const has = p.conditions.some(c => c.name === cond)
    const next = has
      ? p.conditions.filter(c => c.name !== cond)
      : [...p.conditions, { name: cond, level: cond === 'Exhaustion' ? 1 : undefined }]
    onUpdate({ conditions: next })
  }

  function setExhaustionLevel(level) {
    const next = p.conditions.map(c => c.name === 'Exhaustion' ? { ...c, level } : c)
    onUpdate({ conditions: next, exhaustion: level })
  }

  const cardClass = [
    'participant-card',
    p.type === 'player' ? 'card-player' : p.type === 'ally' ? 'card-ally' : 'card-monster',
    isActive && !p.dead ? 'card-active' : '',
    p.bloodied && !p.dead ? 'card-bloodied' : '',
    p.dying && !p.dead ? 'card-dying' : '',
    p.dead ? 'card-dead' : '',
    p.color ? `card-monster-has-color` : '',
    displayOnly ? 'card-display-only' : '',
  ].filter(Boolean).join(' ')

  const monsterColor = p.type === 'monster' ? getMonsterColor(p.color) : null

  return (
    <div className={cardClass}>
      {/* Initiative badge */}
      <div className="card-initiative">{p.initiative}</div>

      {editMode ? (
        <div className="card-body card-edit-body">
          <div className="card-edit-row">
            <input
              className="card-edit-name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditMode(false) }}
              placeholder="Name"
              autoFocus
            />
            <div className="card-edit-num-group">
              <span className="card-edit-label">Init</span>
              <input
                type="number"
                inputMode="numeric"
                className="card-edit-num"
                value={editInit}
                onChange={e => setEditInit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditMode(false) }}
                min="1" max="30"
              />
            </div>
            <div className="card-edit-num-group">
              <span className="card-edit-label">Max HP</span>
              <input
                type="number"
                inputMode="numeric"
                className="card-edit-num"
                value={editMaxHp}
                onChange={e => setEditMaxHp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditMode(false) }}
                min="1"
              />
            </div>
            {p.type === 'monster' && (
              <div className="card-edit-num-group">
                <span className="card-edit-label">Schaden</span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="card-edit-num"
                  value={editDamage}
                  onChange={e => setEditDamage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditMode(false) }}
                  min="0"
                />
              </div>
            )}
          </div>
          {p.type === 'monster' && (
            <div className="card-edit-color-field">
              <span className="card-edit-label">Farbring</span>
              <ColorPicker selectedColor={editColor} onChange={setEditColor} />
            </div>
          )}
          <div className="card-edit-actions">
            <button className="card-edit-confirm" onClick={confirmEdit}>✓ Speichern</button>
            <button className="card-edit-cancel" onClick={() => setEditMode(false)}>Abbrechen</button>
          </div>
        </div>
      ) : p.dead ? (
        /* ── GEFALLEN (Spieler / Verbündeter) ── */
        <div className="card-body card-dead-body">
          <div className="card-name-row">
            <span className="card-dead-skull" aria-hidden="true">☠</span>
            <span className={`card-name${p.type === 'ally' ? ' ally-name' : ''}`}>{p.name}</span>
            <span className="card-dead-label">Gefallen</span>
          </div>
          {!displayOnly && (
            <div className="card-dead-actions">
              <button
                className="monster-btn revive-btn"
                onClick={revive}
                title="Wiederbeleben"
                aria-label={`${p.name} wiederbeleben`}
              >💚 Wiederbeleben</button>
              <button
                className={`monster-btn remove-btn${confirmRemove ? ' remove-armed' : ''}`}
                onClick={requestRemove}
                title={confirmRemove ? 'Nochmal tippen zum Entfernen' : 'Aus der Liste entfernen'}
                aria-label={confirmRemove ? `${p.name} wirklich entfernen` : `${p.name} entfernen`}
              >{confirmRemove ? 'Wirklich entfernen?' : '✕ Entfernen'}</button>
            </div>
          )}
        </div>
      ) : p.type === 'player' ? (
        /* ── PLAYER LAYOUT ── */
        <div className="card-body">
          <div className="card-name-row">
            <span className="card-name">{p.name}</span>
          </div>

          {/* Condition & Status Chips */}
          <div className="card-chips-row">
            {p.bloodied && (
              <span className="status-chip chip-bloodied" title="Verwundet">
                🩸 Verwundet
              </span>
            )}

            {!displayOnly ? (
              <>
                <button
                  className={`status-chip chip-conc ${p.concentration ? 'chip-active' : ''}`}
                  onClick={handleConcClick}
                  title={p.concentration ? 'Konzentration aktiv – Klicken für DC-Check' : 'Konzentration aktivieren'}
                >
                  🔮 Konzentration
                </button>
                <button
                  className={`status-chip ${p.reaction ? 'chip-reaction-spent' : 'chip-reaction-ready'}`}
                  onClick={() => onUpdate({ reaction: !p.reaction })}
                  title={p.reaction ? 'Reaktion verbraucht (klicken zum Zurücksetzen)' : 'Reaktion bereit (klicken zum Verbrauchen)'}
                >
                  ⚡ {p.reaction ? 'Reaktion verbraucht' : 'Reaktion bereit'}
                </button>
                <button
                  className={`status-chip chip-hidden ${p.hidden ? 'chip-active' : ''}`}
                  onClick={() => onUpdate({ hidden: !p.hidden })}
                  title="Verstecken umschalten"
                >
                  👻 Versteckt
                </button>
                <button
                  className={`status-chip chip-blessed ${p.blessed ? 'chip-active' : ''}`}
                  onClick={() => onUpdate({ blessed: !p.blessed })}
                  title="Gesegnet / Guidance umschalten"
                >
                  ⭐ Gesegnet
                </button>
                <button
                  className={`status-chip chip-flying ${p.flying ? 'chip-active' : ''}`}
                  onClick={() => onUpdate({ flying: !p.flying })}
                  title="Fliegend umschalten"
                >
                  🪽 Fliegend
                </button>
              </>
            ) : (
              <>
                {p.concentration && <span className="status-chip chip-conc chip-active">🔮 Konzentration</span>}
                {p.hidden && <span className="status-chip chip-hidden chip-active">👻 Versteckt</span>}
                {p.blessed && <span className="status-chip chip-blessed chip-active">⭐ Gesegnet</span>}
                {p.flying && <span className="status-chip chip-flying chip-active">🪽 Fliegend</span>}
              </>
            )}

            {p.conditions && p.conditions.map(c => {
              const info = CONDITION_DATA[c.name] || { icon: '●', label: c.name }
              return (
                <span key={c.name} className="status-chip chip-condition" title={info.label}>
                  <span>{info.icon}</span>
                  <span>{info.label}{c.name === 'Exhaustion' && c.level ? ` ${c.level} (-${c.level * 2})` : ''}</span>
                  {!displayOnly && (
                    <button
                      className="chip-remove-btn"
                      onClick={() => toggleCondition(c.name)}
                      title={`${info.label} entfernen`}
                    >✕</button>
                  )}
                </span>
              )
            })}

            {!displayOnly && (
              <>
                <button
                  className="status-chip chip-add"
                  onClick={() => setShowConditions(true)}
                  title="Zustand hinzufügen"
                >
                  + Zustand 🎭
                </button>
                {!p.dying && (
                  <button
                    className="status-chip chip-skull"
                    onClick={() => onUpdate({ dying: true, deathSaves: { successes: 0, failures: 0 } })}
                    title="Auf 0 HP / Todeswürfe setzen"
                  >
                    ☠ Todeswürfe
                  </button>
                )}
              </>
            )}
          </div>

          {p.dying && (
            <div className="death-saves-row">
              <div className="ds-group">
                <span className="ds-label">Rettung</span>
                <div className="ds-circles">
                  {[0, 1, 2].map(i => (
                    <button
                      key={i}
                      className={`ds-circle ds-circle-success${(p.deathSaves?.successes || 0) > i ? ' ds-filled' : ''}`}
                      onClick={!displayOnly ? () => toggleDeathSave('success', i) : undefined}
                      style={displayOnly ? { cursor: 'default' } : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className="ds-group">
                <span className="ds-label">Misserfolg</span>
                <div className="ds-circles">
                  {[0, 1, 2].map(i => (
                    <button
                      key={i}
                      className={`ds-circle ds-circle-failure${(p.deathSaves?.failures || 0) > i ? ' ds-filled' : ''}`}
                      onClick={!displayOnly ? () => toggleDeathSave('failure', i) : undefined}
                      style={displayOnly ? { cursor: 'default' } : undefined}
                    />
                  ))}
                </div>
              </div>
              {!displayOnly && (
                <button
                  className="monster-btn"
                  style={{ marginLeft: 'auto' }}
                  title="Wieder stabil"
                  onClick={() => onUpdate({ dying: false, deathSaves: { successes: 0, failures: 0 } })}
                >💚 Stabil</button>
              )}
            </div>
          )}
        </div>
      ) : p.type === 'ally' ? (
        /* ── ALLY LAYOUT ── */
        <div className="card-body ally-body">
          <div className="card-name-row">
            <span className="card-name ally-name">{p.name}</span>
          </div>

          {/* Condition Chips */}
          <div className="card-chips-row">
            {p.bloodied && (
              <span className="status-chip chip-bloodied" title="Verwundet">
                🩸 Verwundet
              </span>
            )}
            {p.conditions && p.conditions.map(c => {
              const info = CONDITION_DATA[c.name] || { icon: '●', label: c.name }
              return (
                <span key={c.name} className="status-chip chip-condition" title={info.label}>
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  {!displayOnly && (
                    <button
                      className="chip-remove-btn"
                      onClick={() => toggleCondition(c.name)}
                      title={`${info.label} entfernen`}
                    >✕</button>
                  )}
                </span>
              )
            })}
            {!displayOnly && (
              <button
                className="status-chip chip-add"
                onClick={() => setShowConditions(true)}
                title="Zustand hinzufügen"
              >
                + Zustand 🎭
              </button>
            )}
          </div>

          {p.hp > 0 ? (
            <div className="ally-controls-row">
              <div className="ally-hp-group">
                <span className="ally-hp-label">HP</span>
                <span className="ally-hp-value">{p.hp}</span>
                {p.maxHp > 0 && <span className="ally-hp-max">/ {p.maxHp}</span>}
              </div>
              {!displayOnly && (
                <>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="ally-hp-input"
                    value={allyHpInput}
                    onChange={e => setAllyHpInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') applyAllyDamage() }}
                    placeholder="HP"
                    min="1"
                  />
                  <button className="ally-btn ally-dmg-btn" onClick={applyAllyDamage}>-Dmg</button>
                  <button className="ally-btn ally-heal-btn" onClick={applyAllyHeal}>+Heil</button>
                  <div className="monster-sep" />
                  <button
                    className={`monster-btn remove-btn${confirmRemove ? ' remove-armed' : ''}`}
                    onClick={requestRemove}
                    title={confirmRemove ? 'Nochmal tippen zum Entfernen' : 'Entfernen'}
                  >{confirmRemove ? 'Wirklich?' : '✕'}</button>
                </>
              )}
            </div>
          ) : (
            <div className="death-saves-row">
              <div className="ds-group">
                <span className="ds-label">Rettung</span>
                <div className="ds-circles">
                  {[0, 1, 2].map(i => (
                    <button
                      key={i}
                      className={`ds-circle ds-circle-success${(p.deathSaves?.successes || 0) > i ? ' ds-filled' : ''}`}
                      onClick={!displayOnly ? () => toggleDeathSave('success', i) : undefined}
                      style={displayOnly ? { cursor: 'default' } : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className="ds-group">
                <span className="ds-label">Misserfolg</span>
                <div className="ds-circles">
                  {[0, 1, 2].map(i => (
                    <button
                      key={i}
                      className={`ds-circle ds-circle-failure${(p.deathSaves?.failures || 0) > i ? ' ds-filled' : ''}`}
                      onClick={!displayOnly ? () => toggleDeathSave('failure', i) : undefined}
                      style={displayOnly ? { cursor: 'default' } : undefined}
                    />
                  ))}
                </div>
              </div>
              {!displayOnly && (
                <button
                  className={`monster-btn remove-btn${confirmRemove ? ' remove-armed' : ''}`}
                  style={{ marginLeft: 'auto' }}
                  onClick={requestRemove}
                  title={confirmRemove ? 'Nochmal tippen zum Entfernen' : 'Entfernen'}
                >{confirmRemove ? 'Wirklich?' : '✕'}</button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── MONSTER LAYOUT ── */
        <div className="card-body monster-body">
          <div className="card-name-row">
            {monsterColor && (
              <span
                className="monster-color-token"
                style={{
                  backgroundColor: monsterColor.hex,
                  borderColor: monsterColor.border,
                }}
                title={`Farbring: ${monsterColor.label}`}
              />
            )}
            <span className="card-name monster-name">{p.name}</span>
          </div>

          {/* Condition Chips */}
          <div className="card-chips-row">
            {p.bloodied && (
              <span className="status-chip chip-bloodied" title="Verwundet">
                🩸 Verwundet
              </span>
            )}
            {p.conditions && p.conditions.map(c => {
              const info = CONDITION_DATA[c.name] || { icon: '●', label: c.name }
              return (
                <span key={c.name} className="status-chip chip-condition" title={info.label}>
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                  {!displayOnly && (
                    <button
                      className="chip-remove-btn"
                      onClick={() => toggleCondition(c.name)}
                      title={`${info.label} entfernen`}
                    >✕</button>
                  )}
                </span>
              )
            })}
            {!displayOnly && (
              <button
                className="status-chip chip-add"
                onClick={() => setShowConditions(true)}
                title="Zustand hinzufügen"
              >
                + Zustand 🎭
              </button>
            )}
          </div>

          <div className="monster-controls-row">
            <div className="damage-group">
              <span className="damage-label">Schaden</span>
              <span className="damage-value">{p.damage || 0}</span>
              {p.maxHp > 0 && <span className="damage-max">/ {p.maxHp}</span>}
            </div>
            {!displayOnly && (
              <>
                <input
                  type="number"
                  inputMode="numeric"
                  className="damage-input"
                  value={damageInput}
                  onChange={e => setDamageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyDamage() }}
                  placeholder="Dmg"
                  min="1"
                />
                <button className="dmg-btn" onClick={() => applyDamage(1)}>+Dmg</button>
                <button className="dmg-btn dmg-btn-minus" onClick={() => applyDamage(-1)} title="Schaden zurücknehmen / heilen">-Dmg</button>
                <button
                  className={`monster-btn ${p.bloodied ? 'bloodied-active' : ''}`}
                  onClick={() => onUpdate({ bloodied: !p.bloodied })}
                  title="Verwundet umschalten"
                >🩸</button>
                <div className="monster-sep" />
                <button className="monster-btn" onClick={onDuplicate} title="Duplizieren">⧉</button>
                <button className="monster-btn kill-btn" onClick={onKill} title="Besiegt">☠</button>
                <button
                  className={`monster-btn remove-btn${confirmRemove ? ' remove-armed' : ''}`}
                  onClick={requestRemove}
                  title={confirmRemove ? 'Nochmal tippen zum Entfernen' : 'Entfernen'}
                >{confirmRemove ? 'Wirklich?' : '✕'}</button>
              </>
            )}
          </div>
        </div>
      )}

      {!displayOnly && !editMode && (
        <button className="card-edit-btn" onClick={enterEdit} title="Bearbeiten">✏️</button>
      )}

      {!displayOnly && showConditions && (
        <ConditionsMenu
          conditions={p.conditions || []}
          onToggle={toggleCondition}
          onSetExhaustionLevel={setExhaustionLevel}
          onClose={() => setShowConditions(false)}
        />
      )}

      {showConcModal && (
        <div className="conc-modal-overlay" onClick={closeConcModal}>
          <div className="conc-modal-box" onClick={e => e.stopPropagation()}>
            <div className="conc-modal-title">🔮 Konzentration – {p.name}</div>
            <div className="conc-modal-text">Schaden erhalten? DC berechnen:</div>
            <div className="conc-modal-input-row">
              <input
                type="number"
                inputMode="numeric"
                className="conc-dmg-input"
                value={concDmgInput}
                onChange={e => setConcDmgInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') computeConcDC() }}
                placeholder="Schaden"
                min="1"
                autoFocus
              />
              <button className="conc-check-btn" onClick={computeConcDC}>DC berechnen</button>
            </div>
            <div className="conc-modal-actions">
              <button className="conc-lose-btn" onClick={loseConcentration}>Konzentration verloren</button>
              <button className="conc-cancel-btn" onClick={closeConcModal}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
