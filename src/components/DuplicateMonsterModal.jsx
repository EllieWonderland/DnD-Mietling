import { useId } from 'react'
import { MONSTER_COLORS } from '../utils/monsterColors.js'
import Modal from './Modal.jsx'
import './DuplicateMonsterModal.css'

export default function DuplicateMonsterModal({ monster, onSelectColor, onClose }) {
  const titleId = useId()
  if (!monster) return null

  return (
    <Modal onClose={onClose} labelledBy={titleId} className="dup-modal-box">
        <h2 id={titleId} className="dup-modal-title">Monster duplizieren</h2>
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
                onClick={() => onSelectColor(color.id)}
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
            onClick={() => onSelectColor(null)}
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
