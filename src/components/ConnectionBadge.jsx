import { useEffect, useState } from 'react'
import './ConnectionBadge.css'

const LABELS = {
  open: 'Verbunden',
  connecting: 'Verbindet',
  closed: 'Getrennt',
  off: 'Kein Relay',
}

function ago(since) {
  const s = Math.max(0, Math.round((Date.now() - since) / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  return `${m} min`
}

// With two devices in play, "is the TV still listening?" is the one thing the
// DM cannot see from the tablet. The dot answers it without taking up room.
export default function ConnectionBadge({ status, since }) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (status === 'open' || status === 'off') return
    const id = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  const label = LABELS[status] ?? status
  const detail = status === 'closed' || status === 'connecting' ? ` · ${ago(since)}` : ''

  return (
    <span
      className={`conn-badge conn-${status}`}
      role="status"
      title={`TV-Verbindung: ${label}${detail}`}
    >
      <span className="conn-dot" aria-hidden="true" />
      <span className="conn-label">{label}{detail}</span>
    </span>
  )
}
