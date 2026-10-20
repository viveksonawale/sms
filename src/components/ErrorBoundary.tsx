import React, { Component, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <AlertTriangle size={64} style={{ color: '#ff5630', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1c252e', marginBottom: '12px' }}>
            Oops! Something went wrong.
          </h1>
          <p style={{ fontSize: '15px', color: '#637381', maxWidth: '400px', marginBottom: '16px' }}>
            We've encountered an unexpected error.
          </p>
          {this.state.error && (
            <div style={{ textAlign: 'left', padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '12px', maxWidth: '800px', overflow: 'auto', marginBottom: '24px', fontFamily: 'monospace' }}>
              <strong>Error: {this.state.error.message}</strong>
              <pre style={{ marginTop: '8px', fontSize: '11px', whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1c252e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
