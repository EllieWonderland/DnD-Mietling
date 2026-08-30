import { useEffect, useRef } from 'react'
import './Modal.css'

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// Shared shell for every dialog. Before this, Escape closed nothing, Tab
// wandered off into the board behind the dialog and screen readers were told
// nothing about the dialog at all.
//
// The backdrop closes on a press that both starts and ends on the backdrop —
// a text selection dragged out of the box no longer counts.
export default function Modal({
  onClose,
  label,
  labelledBy,
  className = '',
  overlayClassName = 'modal-overlay',
  closeOnBackdrop = true,
  children,
}) {
  const boxRef = useRef(null)
  const backdropDownRef = useRef(false)
  // Parents pass inline arrows, so onClose changes identity every render.
  // Keeping it in a ref lets the effect run exactly once — otherwise focus
  // would jump back to the first field on every keystroke.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const restoreTo = document.activeElement
    const box = boxRef.current

    const focusables = () => box
      ? Array.from(box.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null)
      : []

    const first = focusables()[0]
    if (first) first.focus()
    else box?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const idx = items.indexOf(document.activeElement)
      if (event.shiftKey && idx <= 0) {
        event.preventDefault()
        items[items.length - 1].focus()
      } else if (!event.shiftKey && idx === items.length - 1) {
        event.preventDefault()
        items[0].focus()
      } else if (idx === -1) {
        event.preventDefault()
        items[0].focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (restoreTo instanceof HTMLElement && document.contains(restoreTo)) {
        restoreTo.focus()
      }
    }
  }, [])

  return (
    <div
      className={overlayClassName}
      onMouseDown={event => { backdropDownRef.current = event.target === event.currentTarget }}
      onMouseUp={event => {
        if (!closeOnBackdrop) return
        if (backdropDownRef.current && event.target === event.currentTarget) onClose?.()
        backdropDownRef.current = false
      }}
    >
      <div
        ref={boxRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}
