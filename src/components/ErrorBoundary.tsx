import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCcw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component to catch and display runtime errors gracefully.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
          <div className="mb-6 rounded-full bg-destructive/10 p-4 text-destructive">
            <AlertCircle size={48} />
          </div>
          <h1 className="mb-2 text-2xl font-black tracking-tight">Something went wrong</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={this.handleReset}
              className="rounded-xl font-bold"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reload App
            </Button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-8 max-w-full overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
