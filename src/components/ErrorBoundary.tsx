import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center bg-black p-6">
          <div className="max-w-md text-center">
            <p className="text-sm font-medium text-red-400 mb-2">Something went wrong</p>
            <p className="text-xs text-zinc-500 font-mono mb-4 break-all">
              {this.state.error.message}
            </p>
            <a
              href="/login"
              className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Back to login
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
