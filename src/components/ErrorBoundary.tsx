import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Last-resort UI guard: if a render error slips through (a bad config value,
 * a browser API that's unexpectedly missing, etc.) this shows a small
 * message instead of a blank white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Chai Ki Tapri crashed:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="error-fallback">
            <p>Something went wrong loading Chai Ki Tapri. Please refresh the page.</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}
