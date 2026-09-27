import { useId } from 'react'
import Modal from './Modal.jsx'
import './ResumeCombatDialog.css'

// Ending a combat clears its autosave, so the header button only asks. Cancel
// comes first so it gets the initial focus — a stray Enter keeps the fight.
export default function EndCombatDialog({ round, onConfirm, onCancel }) {
  const titleId = useId()

  return (
    <Modal
      onClose={onCancel}
      labelledBy={titleId}
      overlayClassName="resume-overlay"
      className="resume-box"
    >
      <div id={titleId} className="resume-title">Kampf beenden?</div>
      <div className="resume-text">
        Der Kampf in Runde {round} wird beendet und lässt sich danach nicht fortsetzen.
      </div>
      <div className="resume-actions">
        <button className="resume-btn resume-btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button className="resume-btn resume-btn-danger" onClick={onConfirm}>
          Kampf beenden
        </button>
      </div>
    </Modal>
  )
}
