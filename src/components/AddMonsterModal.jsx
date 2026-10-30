import { useState, useId } from 'react'
import ColorPicker from './ColorPicker.jsx'
import Modal from './Modal.jsx'
import { findRememberedMonsterHp } from '../utils/monsterHpMemory.js'
import './AddMonsterModal.css'

export default function AddMonsterModal({ onAdd, onClose, title = 'Monster hinzufügen', isAlly = false }) {
  const [name, setName] = useState('')
  const [initiative, setInitiative] = useState('')
  // null follows the remembered value; even an explicitly cleared field is
  // a manual choice and must never be overwritten by an automatic suggestion.
  const [hp, setHp] = useState(null)
  const [color, setColor] = useState(null)
  const titleId = useId()
  const remembered = isAlly ? null : findRememberedMonsterHp(name)
  const effectiveHp = hp ?? (remembered ? String(remembered.hp) : '')

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), initiative, effectiveHp, color, hp === null ? remembered?.source : 'maxHp')
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy={titleId}
      className={`modal-box${isAlly ? ' modal-box--ally' : ''}`}
    >
        <h2 id={titleId} className={`modal-title${isAlly ? ' modal-title--ally' : ''}`}>{title}</h2>

        <div className="modal-field">
          <label>Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder={isAlly ? 'z.B. Stadtwache' : 'z.B. Goblin'}
            className="modal-input"
          />
        </div>

        <div className="modal-row">
          <div className="modal-field">
            <label>Initiative</label>
            <input
              type="number"
              inputMode="numeric"
              value={initiative}
              onChange={e => setInitiative(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="1"
              min="1"
              className="modal-input"
            />
          </div>
          {/* Allies count their own HP, like the players. */}
          {!isAlly && (
            <div className="modal-field">
              <label>Max HP (optional)</label>
              <input
                type="number"
                inputMode="numeric"
                value={effectiveHp}
                onChange={e => setHp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                placeholder="0"
                className="modal-input"
              />
              {hp === null && remembered && (
                <span className="modal-hp-memory">
                  {remembered.source === 'damage'
                    ? 'Geschätzt aus dem Schaden beim letzten besiegten Monster. Änderbar.'
                    : 'Max HP vom letzten besiegten Monster übernommen. Änderbar.'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="modal-field modal-field--color">
          <label>Farbring (optional)</label>
          <ColorPicker selectedColor={color} onChange={setColor} />
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Abbrechen</button>
          <button className={`modal-add${isAlly ? ' modal-add--ally' : ''}`} onClick={submit} disabled={!name.trim()}>Hinzufügen</button>
        </div>
    </Modal>
  )
}
