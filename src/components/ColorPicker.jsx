import { MONSTER_COLORS } from '../utils/monsterColors.js'
import './ColorPicker.css'

export default function ColorPicker({ selectedColor, onChange, allowNone = true }) {
  return (
    <div className="color-picker-container">
      <div className="color-picker-grid">
        {MONSTER_COLORS.map(color => {
          const isSelected = selectedColor === color.id
          return (
            <button
              key={color.id}
              type="button"
              className={`color-ball ${isSelected ? 'color-ball--selected' : ''}`}
              style={{
                backgroundColor: color.hex,
                borderColor: color.border,
              }}
              title={color.label}
              aria-label={color.label}
              onClick={() => {
                // If clicked again, deselect if allowNone
                if (isSelected && allowNone) {
                  onChange(null)
                } else {
                  onChange(color.id)
                }
              }}
            >
              {isSelected && (
                <span
                  className="color-ball-check"
                  style={{ color: color.textDark ? '#1a1a1a' : '#ffffff' }}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
      {allowNone && selectedColor && (
        <button
          type="button"
          className="color-picker-clear-btn"
          onClick={() => onChange(null)}
          title="Farbring entfernen"
        >
          Ohne Farbe
        </button>
      )}
    </div>
  )
}
