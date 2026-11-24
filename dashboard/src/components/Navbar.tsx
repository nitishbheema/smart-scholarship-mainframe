import React from 'react';
import { Terminal, Upload, Play, Shield, Server, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  session: UserSession;
  onOpenBatchModal: () => void;
  onOpenImportModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onOpenBatchModal,
  onOpenImportModal,
  onLogout
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
              IBM z/OS Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>VSAM KSDS</span>
            <span className="text-slate-600">•</span>
            <span>COBOL 6.3</span>
            <span className="text-slate-600">•</span>
            <span>Db2 DSN1</span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              BATCH ENGINE: SIMULATED (READY)
            </span>
          </p>
        </div>
      </div>

      {/* Mainframe Action Controls */}
      <div className="flex items-center gap-3">
        {/* Run Batch Job */}
        <button
          onClick={onOpenBatchModal}
          className="flex items-center gap-2 bg-gradient-to-r from-ibm-blue to-ibm-darkblue hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition-all active:scale-95 border border-blue-400/30"
          title="Submit BATELG01 Batch Job"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute JCL Batch (Simulated)</span>
        </button>

        {/* Import COBOL Report */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded border border-slate-700 transition-colors"
          title="Upload & Parse Mainframe SYSOUT / Reports"
        >
          <Upload className="w-3.5 h-3.5 text-ibm-cyan" />
          <span>Import Mainframe SYSOUT</span>
        </button>

        {/* User Session & Role Indicator */}
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
            className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
