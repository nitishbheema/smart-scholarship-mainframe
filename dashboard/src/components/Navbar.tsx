import React from 'react';
import { Terminal, Upload, Play, Cpu, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  session: UserSession;
  onOpenBatchModal: () => void;
  onOpenImportModal: () => void;
  onLogout: () => void;
  isBackendLive?: boolean;
  onExecuteLiveCobol?: () => void;
  isExecutingCobol?: boolean;
  onRetryConnection?: () => void;
  isConnecting?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onOpenBatchModal,
  onOpenImportModal,
  onLogout,
  isBackendLive = false,
  onExecuteLiveCobol,
  isExecutingCobol = false,
  onRetryConnection,
  isConnecting = false,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <div className="bg-ibm-blue p-2 rounded flex items-center justify-center text-white shadow-sm">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-100">
              SMART SCHOLARSHIP
            </span>
            <span className="bg-ibm-blue/20 text-ibm-blue border border-ibm-blue/40 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase">
              IBM z/OS & GnuCOBOL 3.1
            </span>
            {isBackendLive ? (
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 font-bold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <Wifi className="w-3 h-3 text-emerald-400" />
                POSTGRESQL & COBOL ENGINE ONLINE
              </span>
            ) : (
              <button
                onClick={onRetryConnection}
                disabled={isConnecting}
                className="bg-red-950/80 text-red-300 border border-red-700/60 hover:bg-red-900/90 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 font-semibold transition-all"
                title="Backend server unreachable. Click to retry connection."
              >
                <WifiOff className="w-3 h-3 text-red-400" />
                <span>{isConnecting ? 'CONNECTING...' : 'BACKEND OFFLINE (RETRY)'}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>VSAM KSDS</span>
            <span className="text-slate-600">•</span>
            <span>Enterprise COBOL / GnuCOBOL</span>
            <span className="text-slate-600">•</span>
            <span>PostgreSQL Relational DB</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">RC 0000 / 0004</span>
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Execute Real COBOL Engine */}
        {session.isAuthenticated && onExecuteLiveCobol && (
          <button
            onClick={onExecuteLiveCobol}
            disabled={isExecutingCobol || !isBackendLive}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-md transition-all active:scale-95 border border-emerald-400/30 disabled:opacity-50"
            title="Execute compiled COBOL MAIN0001 executable directly via backend REST API"
          >
            {isExecutingCobol ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-emerald-200" />
            )}
            <span>{isExecutingCobol ? 'Executing COBOL Binary...' : '⚡ Run Native COBOL Batch'}</span>
          </button>
        )}

        {/* JES2 JCL Spool Modal */}
        {session.isAuthenticated && (
          <button
            onClick={onOpenBatchModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded border border-slate-700 transition-colors"
            title="Open JES2 JCL Batch Job Console"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" />
            <span>JES2 JCL Console</span>
          </button>
        )}

        {/* Import COBOL Report */}
        {session.isAuthenticated && (
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded border border-slate-700 transition-colors"
            title="Upload & Parse Mainframe SYSOUT / Reports"
          >
            <Upload className="w-3.5 h-3.5 text-ibm-cyan" />
            <span>Import SYSOUT</span>
          </button>
        )}

        {/* User Session & Role Indicator */}
        {session.isAuthenticated && (
          <>
            <div className="h-6 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">
                  {session.username}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  UID: {session.zosUserId} [{session.role}]
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] font-mono bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 px-2 py-1 rounded border border-slate-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
