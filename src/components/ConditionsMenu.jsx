import './ConditionsMenu.css'

const ALL_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
  'Prone', 'Restrained', 'Stunned', 'Unconscious',
]

const DE_NAMES = {
  Blinded: 'Blind', Charmed: 'Bezaubert', Deafened: 'Taub',
  Exhaustion: 'Erschöpfung', Frightened: 'Verängstigt', Grappled: 'Gepackt',
  Incapacitated: 'Handlungsunfähig', Invisible: 'Unsichtbar', Paralyzed: 'Paralysiert',
  Petrified: 'Versteinert', Poisoned: 'Vergiftet', Prone: 'Liegend',
  Restrained: 'Festgesetzt', Stunned: 'Betäubt', Unconscious: 'Bewusstlos',
}

export default function ConditionsMenu({ conditions, onToggle, onSetExhaustionLevel, onClose }) {
  const active = name => conditions.some(c => c.name === name)
  const exhaustionCond = conditions.find(c => c.name === 'Exhaustion')
  const exLevel = exhaustionCond?.level || 0

  return (
    <div className="conditions-overlay" onClick={onClose}>
      <div className="conditions-menu" onClick={e => e.stopPropagation()}>
        <div className="conditions-title">Zustände</div>
        <div className="conditions-grid">
          {ALL_CONDITIONS.map(cond => (
            <div key={cond}>
              <button
                className={`condition-btn ${active(cond) ? 'condition-active' : ''}`}
                onClick={() => onToggle(cond)}
              >
                {DE_NAMES[cond]}
              </button>
              {cond === 'Exhaustion' && active(cond) && (
                <div className="exhaustion-level-row">
                  {[1, 2, 3, 4, 5].map(lv => (
                    <button
                      key={lv}
                      className={`ex-level-btn ${exLevel === lv ? 'ex-active' : ''}`}
                      onClick={() => onSetExhaustionLevel(lv)}
                      title={`Level ${lv}: -${lv * 2} auf d20`}
                    >
                      {lv}
                    </button>
                  ))}
                  <span className="ex-malus">(-{exLevel * 2} d20)</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="conditions-close" onClick={onClose}>Schließen</button>
      </div>
    </div>
  )
}
