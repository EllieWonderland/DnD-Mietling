import { useId, useState } from 'react'
import { MONSTER_COLORS } from '../utils/monsterColors.js'
import Modal from './Modal.jsx'
import './DuplicateMonsterModal.css'

// Copies a monster or an ally. Picking a color creates the copy right away, so
// the optional initiative sits above the colors and has to be filled in first.
export default function DuplicateMonsterModal({ monster, onSelectColor, onClose }) {
  const titleId = useId()
  const initiativeId = useId()
  const [initiative, setInitiative] = useState('')
  if (!monster) return null

  const isAlly = monster.type === 'ally'
  const select = color => onSelectColor(color, initiative)

  return (
    <Modal
      onClose={onClose}
      labelledBy={titleId}
      className={`dup-modal-box${isAlly ? ' dup-modal-box--ally' : ''}`}
    >
        <h2 id={titleId} className="dup-modal-title">
          {isAlly ? 'Verbündeten duplizieren' : 'Monster duplizieren'}
        </h2>

        <div className="dup-initiative-field">
          <label htmlFor={initiativeId}>Initiative (optional)</label>
          <input
            id={initiativeId}
            type="number"
            inputMode="numeric"
            min="1"
            value={initiative}
            onChange={e => setInitiative(e.target.value)}
            placeholder={String(monster.initiative ?? '')}
            className="dup-initiative-input"
          />
          <span className="dup-initiative-hint">Leer lassen = wie das Original</span>
        </div>

        <p className="dup-modal-subtitle">
          Wähle die neue Farbe für den Farbring von <strong>{monster.name}</strong>:
        </p>

        <div className="dup-color-grid">
          {MONSTER_COLORS.map(color => {
            const isSameAsOriginal = monster.color === color.id
            return (
              <button
                key={color.id}
                type="button"
                className={`dup-color-ball ${isSameAsOriginal ? 'dup-color-ball--current' : ''}`}
                style={{
                  backgroundColor: color.hex,
                  borderColor: color.border,
                }}
                title={`${color.label}${isSameAsOriginal ? ' (Farbe des Originals)' : ''}`}
                onClick={() => select(color.id)}
              >
                <span
                  className="dup-color-label"
                  style={{ color: color.textDark ? '#1a1a1a' : '#ffffff' }}
                >
                  {color.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="dup-modal-actions">
          <button
            type="button"
            className="dup-modal-none-btn"
            onClick={() => select(null)}
          >
            Ohne Farbring
          </button>
          <button
            type="button"
            className="dup-modal-cancel-btn"
            onClick={onClose}
          >
            Abbrechen
          </button>
        </div>
    </Modal>
  )
}
