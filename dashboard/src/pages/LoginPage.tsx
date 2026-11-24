import React, { useState } from 'react';
import { Terminal, Shield, KeyRound, Server, UserCheck, ArrowRight } from 'lucide-react';
import { UserSession, PageType } from '../types';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
  onNavigate: (page: PageType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState<'OPERATOR' | 'ADMIN' | 'AUDITOR'>('OPERATOR');
  const [username, setUsername] = useState('SYSADM');
  const [zosUid, setZosUid] = useState('IBMUSER');

  const handleRoleChange = (role: 'OPERATOR' | 'ADMIN' | 'AUDITOR') => {
    setSelectedRole(role);
    if (role === 'OPERATOR') {
      setUsername('Mainframe Batch Operator');
      setZosUid('OPER01');
    } else if (role === 'ADMIN') {
      setUsername('Scholarship Dean & Admin');
      setZosUid('DEAN01');
    } else {
      setUsername('State Audit Inspector');
      setZosUid('AUDT01');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      username,
      role: selectedRole,
      isAuthenticated: true,
      zosUserId: zosUid
    });
    onNavigate('dashboard');
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
            Smart Scholarship Eligibility & Disbursement Batch Subsystem
          </p>
        </div>

        {/* System Architecture Notice */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-ibm-cyan">
              <Server className="w-3.5 h-3.5" />
              TSO / ISPF RACF Security Authentication
            </span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Select an operational role below to enter the mainframe management console. The batch rules, VSAM KSDS files, and Db2 audit records are partitioned based on enterprise security policies.
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Choose Demonstration Role:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleRoleChange('OPERATOR')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'OPERATOR'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">Mainframe Operator</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">JCL submission & JES2 logs</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">Scholarship Admin</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Config & Disbursements</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('AUDITOR')}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole === 'AUDITOR'
                  ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs text-slate-200">System Auditor</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Reports & Db2 Compliance</div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">User Identification Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-ibm-blue font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">z/OS RACF User ID (8-Chars)</label>
            <input
              type="text"
              value={zosUid}
              onChange={(e) => setZosUid(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:border-ibm-blue font-mono uppercase font-bold"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-ibm-blue hover:bg-ibm-darkblue text-white font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Authenticate & Access Mainframe Console</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          Synthetic demonstration environment configured for IBM Z Xplore & Enterprise COBOL
        </div>
      </div>
    </div>
  );
};
