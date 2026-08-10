import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Añada crashed while rendering:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app-crash">
        <strong>Añada no pudo continuar.</strong>
        <p>Se ha producido un error inesperado. Recarga la página para volver a intentarlo.</p>
        <pre>{this.state.error.message}</pre>
        <button type="button" className="primary-button" onClick={() => window.location.reload()}>Recargar</button>
      </div>
    )
  }
}
