import React from "react";
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

// Helper to send errors directly to backend terminal
export const logErrorToTerminal = async (error, extra = {}) => {
  try {
    const payload = {
      message: error?.message || String(error),
      stack: error?.stack || null,
      componentStack: extra.componentStack || null,
      url: window.location.href,
      time: new Date().toISOString(),
      ...extra,
    };

    // Try sending to backend logging endpoint
    await fetch("http://localhost:5000/api/logs/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    // Silent fail if network unreachable
  }
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("🚨 Caught by ErrorBoundary:", error, errorInfo);

    // Forward error immediately to backend terminal
    logErrorToTerminal(error, {
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem("active_wedding_id");
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "An unexpected error occurred.";
      const errorStack = this.state.error?.stack || "";
      const componentStack = this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen bg-[#14213D] flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-xl w-full border border-[#E5DAC8] shadow-2xl p-6 sm:p-8 space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#14213D] tracking-tight">
                  Something Went Wrong
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  An error occurred while displaying this page. Full details were sent to your terminal.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-xs font-mono text-rose-900 break-words">
              <strong className="block font-bold text-rose-950 mb-1">Error Message:</strong>
              {errorMessage}
            </div>

            {/* Collapsible Technical Details */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Technical Stack Trace</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48 space-y-2 select-all">
                  {componentStack && (
                    <div>
                      <span className="text-amber-400 font-bold block mb-1">Component Stack:</span>
                      <pre className="whitespace-pre-wrap">{componentStack}</pre>
                    </div>
                  )}
                  {errorStack && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <span className="text-rose-400 font-bold block mb-1">Stack Trace:</span>
                      <pre className="whitespace-pre-wrap">{errorStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl border border-[#E5DAC8] text-slate-700 hover:bg-[#F4EDE0] font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors btn-interactive"
              >
                <Home className="w-3.5 h-3.5 text-[#14213D]" />
                <span>Go to Home / Weddings</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-[#FF6B5B] hover:bg-[#E85545] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FF6B5B]/20 transition-colors btn-interactive"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#F4EDE0]" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

