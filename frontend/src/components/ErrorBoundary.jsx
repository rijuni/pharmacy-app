import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl mb-8 relative">
                <AlertTriangle size={40} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter italic">SYSTEM BYPASS DETECTED</h1>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed italic">
                Our digital pharmacist encountered an unexpected reaction. We're stabilizing the system.
            </p>

            <div className="space-y-4">
                <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                <RefreshCw size={20} /> REBOOT INTERFACE
                </button>
                
                <a 
                href="/" 
                className="w-full bg-white text-slate-900 border-2 border-slate-100 font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                >
                <Home size={20} /> EMERGENCY EXIT
                </a>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
                    ERROR LOG: {this.state.error?.message || "Unknown Clinical Failure"}
                </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
