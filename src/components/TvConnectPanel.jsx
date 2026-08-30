import { useState } from 'react'
import ConnectionBadge from './ConnectionBadge.jsx'
import QrCode from './QrCode.jsx'
import { buildDisplayUrl, rotateRoomId } from '../utils/session.js'
import './TvConnectPanel.css'

// The display URL is the only thing that lets a TV join this session, so it
// has to be reachable from the app itself — as a QR code for anything with a
// camera, and as plain text for a TV browser typed in by hand.
export default function TvConnectPanel({ room, connectionStatus, connectionSince }) {
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
        <span>📺 TV verbinden</span>
        <span className="tv-connect-meta">
          {connectionStatus && (
            <ConnectionBadge status={connectionStatus} since={connectionSince} />
          )}
          <span className="tv-connect-room">Raum {room.slice(0, 6)}…</span>
        </span>
      </button>

      {open && (
        <div className="tv-connect-body">
          <p className="tv-connect-hint">
            QR-Code scannen oder die Adresse am Fernseher öffnen. Sie enthält
            den Raum-Code — nur wer sie hat, sieht die Session.
          </p>
          <div className="tv-connect-qr">
            <QrCode value={url} size={196} />
          </div>
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
