import { useState, useRef, useEffect, useId } from 'react'
import ConditionsMenu from './ConditionsMenu.jsx'
import Modal from './Modal.jsx'
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
  Laughing: { icon: '😂', label: 'Lachend' },
}

// Status toggles on the card. Concentration and blessing stay with the
// players — whether an NPC concentrates or is blessed only the DM knows.
const STATUS_TOGGLES = [
  { key: 'concentration', className: 'chip-conc', label: '🔮 Konzentration', playerOnly: true },
  { key: 'hidden', className: 'chip-hidden', label: '👻 Versteckt', title: 'Verstecken umschalten' },
  { key: 'blessed', className: 'chip-blessed', label: '⭐ Gesegnet', title: 'Gesegnet / Guidance umschalten', playerOnly: true },
  { key: 'flying', className: 'chip-flying', label: '🪽 Fliegend', title: 'Fliegend umschalten' },
]

// One chip row for every card type, so players, allies and monsters can no
// longer drift apart (the exhaustion level used to show on players only).
function ConditionChips({ p, displayOnly, onUpdate, onConcClick, onRemoveCondition, onAddCondition, children }) {
  const toggles = STATUS_TOGGLES.filter(t => p.type === 'player' || !t.playerOnly)
  return (
    <div className="card-chips-row">
      {toggles.map(t => displayOnly ? (
        p[t.key] && <span key={t.key} className={`status-chip ${t.className} chip-active`}>{t.label}</span>
      ) : (
        <button
          key={t.key}
          className={`status-chip ${t.className}${p[t.key] ? ' chip-active' : ''}`}
          onClick={t.key === 'concentration' ? onConcClick : () => onUpdate({ [t.key]: !p[t.key] })}
          title={t.key === 'concentration'
            ? (p.concentration ? 'Konzentration aktiv – Klicken für DC-Check' : 'Konzentration aktivieren')
            : t.title}
          aria-pressed={!!p[t.key]}
        >
          {t.label}
        </button>
      ))}

      {p.type === 'monster' && p.bloodied && (
        <span className="status-chip chip-bloodied" title="Verwundet">
          🩸 Verwundet
        </span>
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
                onClick={() => onRemoveCondition(c.name)}
                title={`${info.label} entfernen`}
                aria-label={`${info.label} bei ${p.name} entfernen`}
              >✕</button>
            )}
          </span>
        )
      })}

      {!displayOnly && (
        <button
          className="status-chip chip-add"
          onClick={onAddCondition}
          title="Zustand hinzufügen"
          aria-label={`Zustand für ${p.name} hinzufügen`}
        >
          + Zustand 🎭
        </button>
      )}
      {children}
    </div>
  )
}

// Three circles each for successes and failures, plus the way out by hand.
function DeathSaves({ p, displayOnly, onToggle, onStabilize }) {
  const groups = [
    { type: 'success', label: 'Rettung', count: p.deathSaves?.successes || 0, verb: 'gelungen' },
    { type: 'failure', label: 'Misserfolg', count: p.deathSaves?.failures || 0, verb: 'misslungen' },
  ]
  return (
    <div className="death-saves-row">
      {groups.map(g => (
        <div key={g.type} className="ds-group">
          <span className="ds-label">{g.label}</span>
          <div className="ds-circles">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                className={`ds-circle ds-circle-${g.type}${g.count > i ? ' ds-filled' : ''}`}
                onClick={!displayOnly ? () => onToggle(g.type, i) : undefined}
                style={displayOnly ? { cursor: 'default' } : undefined}
                aria-label={`Rettungswurf ${i + 1} von ${p.name} ${g.verb}`}
                aria-pressed={g.count > i}
              />
            ))}
          </div>
        </div>
      ))}
      {!displayOnly && (
        <button
          className="monster-btn"
          style={{ marginLeft: 'auto' }}
          title="Wieder stabil"
          onClick={onStabilize}
        >💚 Stabil</button>
      )}
    </div>
  )
}

// ✕ with its two-tap confirmation; `long` is the labelled variant on a
// fallen card.
function RemoveButton({ name, armed, onClick, long = false }) {
  return (
    <button
      className={`monster-btn remove-btn${armed ? ' remove-armed' : ''}`}
      onClick={onClick}
      title={armed ? 'Nochmal tippen zum Entfernen' : long ? 'Aus der Liste entfernen' : 'Entfernen'}
      aria-label={armed ? `${name} wirklich entfernen` : `${name} entfernen`}
    >{armed ? (long ? 'Wirklich entfernen?' : 'Wirklich?') : (long ? '✕ Entfernen' : '✕')}</button>
  )
}

export default function ParticipantCard({
  participant: p, isActive, onUpdate, onKill, onRemove, onDuplicate,
  onMove, canMoveUp = false, canMoveDown = false,
  displayOnly = false,
}) {
  const [showConditions, setShowConditions] = useState(false)
  const [damageInput, setDamageInput] = useState('')
  const [showConcModal, setShowConcModal] = useState(false)
  const [concDmgInput, setConcDmgInput] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editInit, setEditInit] = useState('')
  const [editMaxHp, setEditMaxHp] = useState('')
  const [editColor, setEditColor] = useState(null)
  const [editDamage, setEditDamage] = useState('')
  const [armed, setArmed] = useState(null) // 'remove' | 'kill' | null
  const confirmTimer = useRef(null)
  const concTitleId = useId()

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
    const changes = { name, initiative }
    // Players and allies count their own HP — only monsters keep track here.
    if (p.type === 'monster') {
      const maxHp = Math.max(1, parseInt(editMaxHp) || 1)
      changes.maxHp = maxHp
      // A mistyped damage total is fixed here instead of by deleting the monster.
      const damage = Math.max(0, parseInt(editDamage) || 0)
      changes.damage = damage
      changes.bloodied = maxHp > 0 && damage >= maxHp / 2
    }
    if (p.type !== 'player') changes.color = editColor
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

  function startDeathSaves() {
    onUpdate({ dying: true, deathSaves: { successes: 0, failures: 0 } })
  }

  function stabilize() {
    onUpdate({ dying: false, deathSaves: { successes: 0, failures: 0 } })
  }

  function toggleDeathSave(type, index) {
    const ds = p.deathSaves || { successes: 0, failures: 0 }
    if (type === 'success') {
      const newCount = ds.successes === index + 1 ? index : index + 1
      if (newCount >= 3) {
        stabilize()
      } else {
        onUpdate({ deathSaves: { ...ds, successes: newCount } })
      }
    } else {
      const newCount = ds.failures === index + 1 ? index : index + 1
      if (newCount >= 3) {
        // The third failure kills the character — it never deletes them. The
        // card stays on the board, greyed out and marked ☠, and `dead` is what
        // counts as down everywhere else.
        onUpdate({ dead: true, dying: false, deathSaves: { successes: 0, failures: 3 } })
      } else {
        onUpdate({ deathSaves: { ...ds, failures: newCount } })
      }
    }
  }

  // Allies fall like monsters do — one tap, no detour over three failed
  // saves. Unlike a monster the card stays (greyed out, ☠) and can be revived.
  function defeatAlly() {
    onUpdate({ dead: true, dying: false, deathSaves: { successes: 0, failures: 0 } })
  }

  function revive() {
    onUpdate({ dead: false, dying: false, deathSaves: { successes: 0, failures: 0 } })
  }

  // ✕ and the monster's ☠ take a card off the board, so both ask first: the
  // first tap arms the button, the second one acts. The prompt disarms itself
  // after a few seconds so no card is left in a pending state.
  function confirmTwice(action, run) {
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    if (armed === action) {
      setArmed(null)
      run()
      return
    }
    setArmed(action)
    confirmTimer.current = setTimeout(() => setArmed(null), 4000)
  }

  const requestRemove = () => confirmTwice('remove', onRemove)
  const confirmRemove = armed === 'remove'

  function toggleCondition(cond) {
    const has = p.conditions.some(c => c.name === cond)
    const next = has
      ? p.conditions.filter(c => c.name !== cond)
      : [...p.conditions, { name: cond, level: cond === 'Exhaustion' ? 1 : undefined }]
    onUpdate({ conditions: next })
  }

  // The level lives in the condition itself; a parallel `exhaustion` field was
  // written but never read (and never reset when the condition was removed).
  function setExhaustionLevel(level) {
    const next = p.conditions.map(c => c.name === 'Exhaustion' ? { ...c, level } : c)
    onUpdate({ conditions: next })
  }

  // Once the damage reaches max HP the monster is beaten on paper — the card
  // says so, the DM still decides with ☠. Only on the tablet: the TV must not
  // give it away before that decision.
  const monsterDown = !displayOnly && p.type === 'monster' && p.maxHp > 0 && (p.damage || 0) >= p.maxHp

  const cardClass = [
    'participant-card',
    p.type === 'player' ? 'card-player' : p.type === 'ally' ? 'card-ally' : 'card-monster',
    isActive && !p.dead ? 'card-active' : '',
    p.bloodied && !p.dead ? 'card-bloodied' : '',
    p.dying && !p.dead ? 'card-dying' : '',
    p.dead ? 'card-dead' : '',
    monsterDown && !p.dead ? 'card-monster-down' : '',
    displayOnly ? 'card-display-only' : '',
  ].filter(Boolean).join(' ')

  // Colour ring on the miniature's base — monsters and allies both have minis.
  const ringColor = p.type !== 'player' ? getMonsterColor(p.color) : null
  const colorToken = ringColor && (
    <span
      className="monster-color-token"
      style={{
        backgroundColor: ringColor.hex,
        borderColor: ringColor.border,
      }}
      title={`Farbring: ${ringColor.label}`}
    />
  )
  const chipProps = {
    p, displayOnly, onUpdate,
    onConcClick: handleConcClick,
    onRemoveCondition: toggleCondition,
    onAddCondition: () => setShowConditions(true),
  }

  const duplicateButton = !displayOnly && onDuplicate && (
    <button
      className="monster-btn"
      onClick={onDuplicate}
      title="Duplizieren"
      aria-label={`${p.name} duplizieren`}
    >⧉</button>
  )

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
            {p.type === 'monster' && (
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
            )}
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
          {p.type !== 'player' && (
            <div className="card-edit-color-field">
              <span className="card-edit-label">Farbring</span>
              <ColorPicker selectedColor={editColor} onChange={setEditColor} />
            </div>
          )}
          <div className="card-edit-actions">
            {onMove && (
              // Keyboard/touch alternative to dragging a card into place.
              <div className="card-move-group">
                <button
                  className="monster-btn card-move-btn"
                  onClick={() => onMove(-1)}
                  disabled={!canMoveUp}
                  title="Eine Position nach oben"
                  aria-label={`${p.name} eine Position nach oben`}
                >▲</button>
                <button
                  className="monster-btn card-move-btn"
                  onClick={() => onMove(1)}
                  disabled={!canMoveDown}
                  title="Eine Position nach unten"
                  aria-label={`${p.name} eine Position nach unten`}
                >▼</button>
              </div>
            )}
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
              <RemoveButton name={p.name} armed={confirmRemove} onClick={requestRemove} long />
            </div>
          )}
        </div>
      ) : p.type === 'player' || p.type === 'ally' ? (
        /* ── PLAYER / ALLY LAYOUT ── */
        <div className={`card-body${p.type === 'ally' ? ' ally-body' : ''}`}>
          <div className="card-name-row">
            {colorToken}
            <span className={`card-name${p.type === 'ally' ? ' ally-name' : ''}`}>{p.name}</span>
          </div>

          <ConditionChips {...chipProps}>
            {!displayOnly && !p.dying && (
              <button
                className="status-chip chip-skull"
                onClick={startDeathSaves}
                title="Auf 0 HP / Todeswürfe setzen"
              >
                ☠ Todeswürfe
              </button>
            )}
            {p.type === 'ally' && !displayOnly && (
              <div className="ally-controls-row">
                {duplicateButton}
                <button
                  className="monster-btn kill-btn"
                  onClick={defeatAlly}
                  title="Besiegt"
                  aria-label={`${p.name} als besiegt markieren`}
                >☠</button>
                <RemoveButton name={p.name} armed={confirmRemove} onClick={requestRemove} />
              </div>
            )}
          </ConditionChips>

          {p.dying && (
            <DeathSaves p={p} displayOnly={displayOnly} onToggle={toggleDeathSave} onStabilize={stabilize} />
          )}
        </div>
      ) : (
        /* ── MONSTER LAYOUT ── */
        <div className="card-body monster-body">
          <div className="card-name-row">
            {colorToken}
            <span className="card-name monster-name">{p.name}</span>
          </div>

          <ConditionChips {...chipProps} />

          <div className="monster-controls-row">
            <div className="damage-group">
              <span className="damage-label">Schaden</span>
              <span className="damage-value">{p.damage || 0}</span>
              {p.maxHp > 0 && <span className="damage-max">/ {p.maxHp}</span>}
            </div>
            {monsterDown && (
              <span className="monster-down-hint" title="Schaden erreicht die maximalen HP">
                besiegt?
              </span>
            )}
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
                <button className="dmg-btn" onClick={() => applyDamage(1)} aria-label={`Schaden bei ${p.name} hinzufügen`}>+Dmg</button>
                <button
                  className="dmg-btn dmg-btn-minus"
                  onClick={() => applyDamage(-1)}
                  title="Schaden zurücknehmen / heilen"
                  aria-label={`Schaden bei ${p.name} zurücknehmen`}
                >-Dmg</button>
                <button
                  className={`monster-btn ${p.bloodied ? 'bloodied-active' : ''}`}
                  onClick={() => onUpdate({ bloodied: !p.bloodied })}
                  title="Verwundet umschalten"
                  aria-label={`${p.name} verwundet`}
                  aria-pressed={!!p.bloodied}
                >🩸</button>
                <div className="monster-sep" />
                {duplicateButton}
                <button
                  className={`monster-btn kill-btn${armed === 'kill' ? ' remove-armed' : monsterDown ? ' kill-btn-suggested' : ''}`}
                  onClick={() => confirmTwice('kill', onKill)}
                  title={armed === 'kill' ? 'Nochmal tippen: besiegt' : 'Besiegt'}
                  aria-label={armed === 'kill' ? `${p.name} wirklich als besiegt markieren` : `${p.name} als besiegt markieren`}
                >{armed === 'kill' ? 'Besiegt?' : '☠'}</button>
                <RemoveButton name={p.name} armed={confirmRemove} onClick={requestRemove} />
              </>
            )}
          </div>
        </div>
      )}

      {!displayOnly && !editMode && (
        <button
          className="card-edit-btn"
          onClick={enterEdit}
          title="Bearbeiten"
          aria-label={`${p.name} bearbeiten`}
        >✏️</button>
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
        <Modal
          onClose={closeConcModal}
          labelledBy={concTitleId}
          overlayClassName="conc-modal-overlay"
          className="conc-modal-box"
        >
            <div id={concTitleId} className="conc-modal-title">🔮 Konzentration – {p.name}</div>
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
        </Modal>
      )}
    </div>
  )
}
