import { useState } from 'react'
import ColorPicker from './ColorPicker.jsx'
import './AddMonsterModal.css'

export default function AddMonsterModal({ onAdd, onClose, title = 'Monster hinzufügen', isAlly = false }) {
  const [name, setName] = useState('')
  const [initiative, setInitiative] = useState('')
  const [hp, setHp] = useState('')
  const [color, setColor] = useState(null)

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), initiative, hp, color)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box${isAlly ? ' modal-box--ally' : ''}`} onClick={e => e.stopPropagation()}>
        <h2 className={`modal-title${isAlly ? ' modal-title--ally' : ''}`}>{title}</h2>

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
          <div className="modal-field">
            <label>Max HP (optional)</label>
            <input
              type="number"
              inputMode="numeric"
              value={hp}
              onChange={e => setHp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="0"
              className="modal-input"
            />
          </div>
        </div>

        {!isAlly && (
          <div className="modal-field modal-field--color">
            <label>Farbring (optional)</label>
            <ColorPicker selectedColor={color} onChange={setColor} />
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Abbrechen</button>
          <button className={`modal-add${isAlly ? ' modal-add--ally' : ''}`} onClick={submit} disabled={!name.trim()}>Hinzufügen</button>
        </div>
      </div>
    </div>
  )
}
