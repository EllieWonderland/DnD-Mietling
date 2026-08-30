import { useState, useId } from 'react'
import Modal from './Modal.jsx'
import './ResumeCombatDialog.css'

// Discarding an interrupted combat cannot be undone, so "Verwerfen" only opens
// the question — the second press is the one that throws the autosave away.
export default function ResumeCombatDialog({ savedCombat, onResume, onDiscard }) {
  const [confirming, setConfirming] = useState(false)
  const titleId = useId()

  const round = savedCombat.round ?? 1
  const count = savedCombat.participants?.length ?? 0

  return (
    <Modal
      onClose={() => setConfirming(false)}
      labelledBy={titleId}
      overlayClassName="resume-overlay"
      className="resume-box"
      closeOnBackdrop={false}
    >
      <div id={titleId} className="resume-title">
        {confirming ? 'Wirklich verwerfen?' : 'Unterbrochener Kampf'}
      </div>
      <div className="resume-text">
        {confirming
          ? `Runde ${round} mit ${count} Teilnehmern geht verloren. Das lässt sich nicht rückgängig machen.`
          : `Runde ${round} — ${count} Teilnehmer`}
      </div>
      <div className="resume-actions">
        {confirming ? (
          <>
            <button className="resume-btn resume-btn-danger" onClick={onDiscard}>
              Endgültig verwerfen
            </button>
            <button className="resume-btn resume-btn-ghost" onClick={() => setConfirming(false)}>
              Abbrechen
            </button>
          </>
        ) : (
          <>
            <button className="resume-btn resume-btn-primary" onClick={onResume}>
              Fortsetzen
            </button>
            <button className="resume-btn resume-btn-ghost" onClick={() => setConfirming(true)}>
              Verwerfen
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
