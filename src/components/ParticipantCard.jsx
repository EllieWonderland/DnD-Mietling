import { useState } from 'react'
import ConditionsMenu from './ConditionsMenu.jsx'
import ColorPicker from './ColorPicker.jsx'
import { getMonsterColor } from '../utils/monsterColors.js'
import './ParticipantCard.css'

const CONDITION_ICONS = {
  Blinded: '👁️', Charmed: '💜', Deafened: '🔇',
  Exhaustion: '💀', Frightened: '😱', Grappled: '🤝',
  Incapacitated: '🚫', Invisible: '👻', Paralyzed: '⚡',
  Petrified: '🗿', Poisoned: '☠️', Prone: '⬇️',
  Restrained: '⛓️', Stunned: '💫', Unconscious: '💤',
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

  function enterEdit() {
    setEditName(p.name)
    setEditInit(String(p.initiative))
    setEditMaxHp(String(p.maxHp || 0))
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
      changes.bloodied = maxHp > 0 && (p.damage || 0) >= maxHp / 2
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

  function applyDamage() {
    const val = parseInt(damageInput)
    if (isNaN(val) || val <= 0) return
    const newDamage = Math.max(0, (p.damage || 0) + val)
    const isNowBloodied = p.maxHp > 0 && newDamage >= p.maxHp / 2
    onUpdate({ damage: newDamage, bloodied: isNowBloodied || p.bloodied })
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
        onRemove()
      } else {
        onUpdate({ deathSaves: { ...ds, failures: newCount } })
      }
    }
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
    isActive ? 'card-active' : '',
    p.bloodied ? 'card-bloodied' : '',
    p.dying ? 'card-dying' : '',
    p.color ? `card-monster-has-color` : '',
  ].filter(Boolean).join(' ')

  const exhaustionCond = p.conditions?.find(c => c.name === 'Exhaustion')
  const exhaustionLevel = exhaustionCond?.level || p.exhaustion || 0
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
      ) : p.type === 'player' ? (
        /* ── PLAYER LAYOUT ── */
        <div className="card-body">
          <div className="card-name-row">
            <span className="card-name">{p.name}</span>
            {p.conditions && p.conditions.length > 0 && (
              <span className="conditions-inline">
                {p.conditions.map(c => (
                  <span key={c.name} className="condition-icon" title={c.name}>
                    {CONDITION_ICONS[c.name] || '●'}
                    {c.name === 'Exhaustion' && c.level && <sup>{c.level}</sup>}
                  </span>
                ))}
              </span>
            )}
            {exhaustionLevel > 0 && (
              <span className="exhaustion-badge">EX{exhaustionLevel}&nbsp;(-{exhaustionLevel * 2})</span>
            )}
          </div>
          {p.dying ? (
            <div className="death-saves-row">
              <div className="ds-group">
                <span className="ds-label">Rettung</span>
                <div className="ds-circles">
                  {[0, 1, 2].map(i => (
                    <button
                      key={i}
                      className={`ds-circle ds-circle-success${(p.deathSaves?.successes || 0) > i ? ' ds-filled' : ''}`}
                      onClick={() => toggleDeathSave('success', i)}
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
                      onClick={() => toggleDeathSave('failure', i)}
                    />
                  ))}
                </div>
              </div>
              <button
                className="monster-btn"
                style={{ marginLeft: 'auto' }}
                title="Wieder stabil"
                onClick={() => onUpdate({ dying: false, deathSaves: { successes: 0, failures: 0 } })}
              >💚</button>
            </div>
          ) : (
            <div className="player-status-row">
              <button
                className={`status-icon ${p.concentration ? 'active-conc' : ''}`}
                title={p.concentration ? 'Konzentration aktiv – Klicken für DC-Check' : 'Konzentration aktivieren'}
                onClick={handleConcClick}
              >🔮</button>
              <button
                className={`status-icon ${p.reaction ? 'active-reaction' : ''}`}
                title={p.reaction ? 'Reaktion verbraucht' : 'Reaktion verfügbar'}
                onClick={() => onUpdate({ reaction: !p.reaction })}
              >⚡</button>
              <button
                className={`status-icon ${p.hidden ? 'active-hidden' : ''}`}
                title={p.hidden ? 'Versteckt' : 'Verstecken'}
                onClick={() => onUpdate({ hidden: !p.hidden })}
              >👻</button>
              <button
                className={`status-icon ${p.blessed ? 'active-blessed' : ''}`}
                title={p.blessed ? 'Gesegnet (aktiv)' : 'Gesegnet / Blessed / Guidance'}
                onClick={() => onUpdate({ blessed: !p.blessed })}
              >⭐</button>
              <button
                className={`status-icon ${p.flying ? 'active-flying' : ''}`}
                title={p.flying ? 'Fliegend (aktiv)' : 'Fliegend'}
                onClick={() => onUpdate({ flying: !p.flying })}
              >🪽</button>
              <button
                className="status-icon"
                title="Zustände"
                onClick={() => setShowConditions(!showConditions)}
              >🎭</button>
              <button
                className="status-icon skull-btn"
                title="Todeswürfe"
                onClick={() => onUpdate({ dying: true, deathSaves: { successes: 0, failures: 0 } })}
              >☠</button>
            </div>
          )}
        </div>
      ) : p.type === 'ally' ? (
        /* ── ALLY LAYOUT ── */
        <div className="card-body ally-body">
          <div className="card-name-row">
            <span className="card-name ally-name">{p.name}</span>
            {p.conditions && p.conditions.length > 0 && (
              <span className="conditions-inline">
                {p.conditions.map(c => (
                  <span key={c.name} className="condition-icon" title={c.name}>
                    {CONDITION_ICONS[c.name] || '●'}
                  </span>
                ))}
              </span>
            )}
          </div>
          {p.hp > 0 ? (
            <div className="ally-controls-row">
              <div className="ally-hp-group">
                <span className="ally-hp-label">HP</span>
                <span className="ally-hp-value">{p.hp}</span>
                {p.maxHp > 0 && <span className="ally-hp-max">/ {p.maxHp}</span>}
              </div>
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
              <button className="monster-btn" title="Zustände" onClick={() => setShowConditions(!showConditions)}>🎭</button>
              <button className="monster-btn remove-btn" onClick={onRemove} title="Entfernen">✕</button>
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
                      onClick={() => toggleDeathSave('success', i)}
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
                      onClick={() => toggleDeathSave('failure', i)}
                    />
                  ))}
                </div>
              </div>
              <button className="monster-btn remove-btn" style={{ marginLeft: 'auto' }} onClick={onRemove} title="Entfernen">✕</button>
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
            {p.conditions && p.conditions.length > 0 && (
              <span className="conditions-inline">
                {p.conditions.map(c => (
                  <span key={c.name} className="condition-icon" title={c.name}>
                    {CONDITION_ICONS[c.name] || '●'}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="monster-controls-row">
            <div className="damage-group">
              <span className="damage-label">Schaden</span>
              <span className="damage-value">{p.damage || 0}</span>
              {p.maxHp > 0 && <span className="damage-max">/ {p.maxHp}</span>}
            </div>
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
            <button className="dmg-btn" onClick={applyDamage}>+Dmg</button>
          </div>
          <div className="monster-toggles-row">
            <button
              className={`monster-btn ${p.bloodied ? 'bloodied-active' : ''}`}
              onClick={() => onUpdate({ bloodied: !p.bloodied })}
              title="Verwundet"
            >🩸</button>
            <button
              className="monster-btn"
              title="Zustände"
              onClick={() => setShowConditions(!showConditions)}
            >🎭</button>
            <div className="monster-sep" />
            <button className="monster-btn" onClick={onDuplicate} title="Duplizieren">⧉</button>
            <button className="monster-btn kill-btn" onClick={onKill} title="Besiegt">☠</button>
            <button className="monster-btn remove-btn" onClick={onRemove} title="Entfernen">✕</button>
          </div>
        </div>
      )}

      {!displayOnly && !editMode && (
        <button className="card-edit-btn" onClick={enterEdit} title="Bearbeiten">✏️</button>
      )}

      {showConditions && (
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
