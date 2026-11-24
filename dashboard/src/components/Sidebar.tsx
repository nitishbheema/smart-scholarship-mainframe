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
    { id: 'students' as PageType, label: 'Student Records', icon: Users, badge: badgeCounts.students, badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200' },
    { id: 'applications' as PageType, label: 'Applications', icon: FileSpreadsheet, badge: badgeCounts.applications, badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { id: 'eligibility' as PageType, label: 'Eligibility Results', icon: CheckSquare, badge: badgeCounts.eligible, badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    { id: 'disbursements' as PageType, label: 'Disbursement Mgmt', icon: CreditCard, badge: badgeCounts.disbursements, badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
    { id: 'batch-history' as PageType, label: 'Batch Processing (JCL)', icon: History },
    { id: 'reports' as PageType, label: 'Reports & Analytics', icon: FileText },
    { id: 'config' as PageType, label: 'System Configuration', icon: Settings },
    { id: 'login' as PageType, label: 'Demo Access / Roles', icon: KeyRound }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-53px)] select-none shadow-sm">
      <div className="p-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-3 py-2">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-ibm-blue text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mainframe System Architecture Summary */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 m-2 rounded-lg text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-ibm-blue" />
            z/OS Architecture
          </span>
          <span className="text-emerald-700 font-semibold text-[10px]">SYNCED</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500">COBOL PGM</div>
            <div className="text-slate-900 font-bold truncate">MAIN0001</div>
          </div>
          <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500">JCL BATCH</div>
            <div className="text-slate-900 font-bold truncate">BATELG01</div>
          </div>
          <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500">VSAM KSDS</div>
            <div className="text-slate-900 font-bold truncate">STUMAST</div>
          </div>
          <div className="bg-white p-1.5 rounded border border-slate-200 shadow-sm">
            <div className="text-slate-500">DATABASE</div>
            <div className="text-slate-900 font-bold truncate">POSTGRES</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
