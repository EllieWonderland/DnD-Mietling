import { Component } from 'react'
import './ErrorBoundary.css'

// A render error must never take the tablet or the TV down mid-session.
// The boundary keeps the app on screen with a way back instead of a white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label || 'App', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="eb-screen">
        <div className="eb-box">
          <div className="eb-title">Etwas ist schiefgelaufen</div>
          <div className="eb-text">
            {this.props.label
              ? `Fehler im Bereich „${this.props.label}".`
              : 'Die Anzeige konnte nicht dargestellt werden.'}
            {' '}Der gespeicherte Kampf bleibt erhalten.
          </div>
          <pre className="eb-detail">{String(this.state.error?.message || this.state.error)}</pre>
          <div className="eb-actions">
            <button className="eb-btn" onClick={() => window.location.reload()}>Neu laden</button>
            <button className="eb-btn eb-btn-ghost" onClick={() => this.setState({ error: null })}>
              Nochmal versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }
}
