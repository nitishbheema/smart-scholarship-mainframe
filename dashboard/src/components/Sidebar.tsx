import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  CheckSquare, 
  CreditCard, 
  History, 
  FileText, 
  Settings, 
  KeyRound,
  Database,
  Cpu
} from 'lucide-react';
import { PageType } from '../types';

interface SidebarProps {
  activePage: PageType;
  onSelectPage: (page: PageType) => void;
  badgeCounts: {
    students: number;
    applications: number;
    eligible: number;
    disbursements: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  badgeCounts
}) => {
  const navItems = [
    { id: 'dashboard' as PageType, label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'students' as PageType, label: 'Student Records', icon: Users, badge: badgeCounts.students, badgeColor: 'bg-slate-700 text-slate-300' },
    { id: 'applications' as PageType, label: 'Applications', icon: FileSpreadsheet, badge: badgeCounts.applications, badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50' },
    { id: 'eligibility' as PageType, label: 'Eligibility Results', icon: CheckSquare, badge: badgeCounts.eligible, badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' },
    { id: 'disbursements' as PageType, label: 'Disbursement Mgmt', icon: CreditCard, badge: badgeCounts.disbursements, badgeColor: 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50' },
    { id: 'batch-history' as PageType, label: 'Batch Processing (JCL)', icon: History },
    { id: 'reports' as PageType, label: 'Reports & Analytics', icon: FileText },
    { id: 'config' as PageType, label: 'System Configuration', icon: Settings },
    { id: 'login' as PageType, label: 'Demo Access / Roles', icon: KeyRound }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-53px)] select-none">
      <div className="p-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-3 py-2">
          Navigation Modules
        </div>

        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-ibm-blue text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mainframe System Architecture Summary */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 m-2 rounded text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Cpu className="w-3.5 h-3.5 text-ibm-blue" />
            z/OS Architecture
          </span>
          <span className="text-emerald-400 text-[10px]">SYNCED</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400">COBOL PGM</div>
            <div className="text-slate-200 font-semibold truncate">MAIN0001</div>
          </div>
          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400">JCL BATCH</div>
            <div className="text-slate-200 font-semibold truncate">BATELG01</div>
          </div>
          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400">VSAM KSDS</div>
            <div className="text-slate-200 font-semibold truncate">150B KEYS(10)</div>
          </div>
          <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
            <div className="text-slate-400">IBM Db2</div>
            <div className="text-slate-200 font-semibold truncate">6 TABLES</div>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight pt-1">
          Real Enterprise COBOL business rules execution via batch layers.
        </p>
      </div>
    </aside>
  );
};
