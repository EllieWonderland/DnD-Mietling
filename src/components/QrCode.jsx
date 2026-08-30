import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

// Renders the QR code as one SVG path instead of injecting the library's HTML.
// Light background with a quiet zone — that is what phone cameras expect, and
// it stays readable against the dark panel around it.
export default function QrCode({ value, size = 200, quietZone = 4 }) {
  const { moduleCount, path } = useMemo(() => {
    const qr = qrcode(0, 'M') // 0 = pick the smallest version that fits
    qr.addData(value)
    qr.make()
    const count = qr.getModuleCount()
    let d = ''
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`
      }
    }
    return { moduleCount: count, path: d }
  }, [value])

  const total = moduleCount + quietZone * 2

  return (
    <svg
      className="qr-code"
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label="QR-Code mit der Verbindungs-Adresse für den Fernseher"
      shapeRendering="crispEdges"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <g transform={`translate(${quietZone} ${quietZone})`} fill="#000000">
        <path d={path} />
      </g>
    </svg>
  )
}
