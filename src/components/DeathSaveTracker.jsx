import './DeathSaveTracker.css'

export default function DeathSaveTracker({ deathSaves, onUpdate, onStabilize }) {
  const { successes = 0, failures = 0 } = deathSaves

  function toggle(type, idx) {
    const key = type === 'success' ? 'successes' : 'failures'
    const current = deathSaves[key] || 0
    const next = current > idx ? idx : idx + 1
    const updated = { ...deathSaves, [key]: next }
    if (updated.successes >= 3) { onStabilize(); return }
    if (updated.failures >= 3) { onUpdate({ ...updated }); return }
    onUpdate(updated)
  }

  return (
    <div className="death-tracker">
      <div className="death-label">Todesrettungswürfe</div>
      <div className="death-row">
        <span className="death-type success-label">Erfolge</span>
        <div className="death-boxes">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`death-box success-box ${i < successes ? 'filled' : ''}`}
              onClick={() => toggle('success', i)}
            />
          ))}
        </div>
      </div>
      <div className="death-row">
        <span className="death-type fail-label">Fehlschläge</span>
        <div className="death-boxes">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`death-box fail-box ${i < failures ? 'filled' : ''}`}
              onClick={() => toggle('failure', i)}
            />
          ))}
        </div>
      </div>
      {failures >= 3 && <div className="death-dead">☠ TOT</div>}
    </div>
  )
}
