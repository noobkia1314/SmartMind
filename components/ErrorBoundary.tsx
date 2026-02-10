
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md shadow-2xl">
            <h1 className="text-2xl font-black text-white mb-4">應用程式錯誤</h1>
            <p className="text-slate-400 mb-6">抱歉，應用程式發生了非預期的錯誤。請嘗試重新整理頁面。</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }

    // Fix: access children via this.props instead of this.children
    return this.props.children;
  }
}

export default ErrorBoundary;
