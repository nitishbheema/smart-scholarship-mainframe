import React, { useState } from 'react';
import { Terminal, Server, UserCheck, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { UserSession, PageType } from '../types';
import { api, API_BASE_URL } from '../services/api';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
  onNavigate: (page: PageType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'OPERATOR' | 'AUDITOR'>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminScholarship2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: 'ADMIN' | 'OPERATOR' | 'AUDITOR') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('AdminScholarship2026!');
    } else if (role === 'OPERATOR') {
      setUsername('operator');
      setPassword('ScholarOper2026!');
    } else {
      setUsername('auditor');
      setPassword('ScholarAudit2026!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.login(username.trim(), password);
      onLogin({
        username: data.user.username,
        role: data.user.role as any,
        isAuthenticated: true,
        zosUserId: data.user.username.toUpperCase().slice(0, 8),
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-53px)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 space-y-6">
        {/* Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-ibm-blue/20 rounded-xl text-ibm-blue border border-ibm-blue/30 mb-1">
            <Terminal className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            IBM z/OS Mainframe Operations Portal
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Smart Scholarship Eligibility & Disbursement Subsystem
          </p>
        </div>

        {/* Server & Security Notice */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-ibm-cyan">
              <Server className="w-3.5 h-3.5" />
              REST API Authentication & RACF RBAC
            </span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Target API: <span className="text-slate-200">{API_BASE_URL || '(Same Origin)'}</span>
          </p>
        </div>

        {/* Role Quick Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Select Role to Fill Credentials:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">Scholarship Admin</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Full Scheme & Batch Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('OPERATOR')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'OPERATOR'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">Mainframe Operator</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Batch Run & Ingestion</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('AUDITOR')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'AUDITOR'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">System Auditor</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Read-Only Audit & Reports</div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-ibm-blue font-mono"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-ibm-blue font-mono"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ibm-blue hover:bg-ibm-darkblue disabled:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Backend...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Authenticate & Access Mainframe Console</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          Smart Scholarship Production Backend • PostgreSQL Database • Compiled GnuCOBOL Orchestrator
        </div>
      </div>
    </div>
  );
};
