import { useState } from 'react'
import { buildDisplayUrl, rotateRoomId } from '../utils/session.js'
import './TvConnectPanel.css'

// The display URL is the only thing that lets a TV join this session, so it
// has to be visible somewhere. Point 18 of the todo replaces the plain link
// with a QR code; the room handling below stays the same either way.
export default function TvConnectPanel({ room }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  if (!room) return null
  const url = buildDisplayUrl(room)

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (no HTTPS, no permission) — the URL is on screen anyway.
      setCopied(false)
    }
  }

  function rotate() {
    if (!confirmRotate) {
      setConfirmRotate(true)
      setTimeout(() => setConfirmRotate(false), 4000)
      return
    }
    rotateRoomId()
    // A room lives in the connection URL, so the new one only takes effect
    // after a reconnect — and the old one must not linger in the address bar.
    const { origin, pathname } = window.location
    window.location.replace(`${origin}${pathname}`)
  }

  return (
    <div className={`tv-connect${open ? ' tv-connect-open' : ''}`}>
      <button className="tv-connect-toggle" onClick={() => setOpen(o => !o)}>
        📺 TV verbinden
        <span className="tv-connect-room">Raum {room.slice(0, 6)}…</span>
      </button>

      {open && (
        <div className="tv-connect-body">
          <p className="tv-connect-hint">
            Diese Adresse am Fernseher öffnen. Sie enthält den Raum-Code —
            nur wer sie hat, sieht die Session.
          </p>
          <div className="tv-connect-url">{url}</div>
          <div className="tv-connect-actions">
            <button className="tv-connect-btn" onClick={copyUrl}>
              {copied ? '✓ Kopiert' : 'Adresse kopieren'}
            </button>
            <button
              className={`tv-connect-btn tv-connect-btn-ghost${confirmRotate ? ' tv-connect-armed' : ''}`}
              onClick={rotate}
              title="Erzeugt einen neuen Raum-Code; verbundene Geräte fliegen raus"
            >
              {confirmRotate ? 'Wirklich neuer Code?' : 'Neuer Raum-Code'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
