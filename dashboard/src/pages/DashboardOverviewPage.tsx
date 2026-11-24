import React from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Cpu, 
  Play, 
  ArrowUpRight, 
  Layers, 
  Database, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { BatchSummary, EligibilityResult, PageType } from '../types';

interface DashboardOverviewProps {
  summary: BatchSummary;
  eligibilityResults: EligibilityResult[];
  onOpenBatchModal: () => void;
  onNavigate: (page: PageType) => void;
}

export const DashboardOverviewPage: React.FC<DashboardOverviewProps> = ({
  summary,
  eligibilityResults,
  onOpenBatchModal,
  onNavigate
}) => {
  // Chart 1: Status Distribution
  const statusData = [
    { name: 'Eligible (Approved)', value: summary.eligible_count, color: '#24a148' },
    { name: 'Rejected (Rules)', value: summary.rejected_count - summary.duplicate_count - 3, color: '#da1e28' },
    { name: 'Duplicate Interceptions', value: summary.duplicate_count, color: '#f1c21b' },
    { name: 'Format Violations', value: 3, color: '#8d8d8d' }
  ];

  // Chart 2: Department breakdown for eligible awards
  const deptMap: Record<string, { count: number; amount: number }> = {};
  eligibilityResults.forEach(r => {
    const dept = r.dept?.trim() || 'CS';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, amount: 0 };
    }
    if (r.status === 'E') {
      deptMap[dept].count += 1;
      deptMap[dept].amount += r.award;
    }
  });

  const deptChartData = Object.keys(deptMap).map(d => ({
    department: d,
    eligibleCount: deptMap[d].count,
    disbursedInr: deptMap[d].amount
  }));

  // Rejection Reason Breakdown
  const rejMap: Record<string, number> = {};
  eligibilityResults.filter(r => r.status !== 'E').forEach(r => {
    const code = r.reason_code.trim();
    rejMap[code] = (rejMap[code] || 0) + 1;
  });

  const rejChartData = Object.keys(rejMap).map(k => ({
    reason: k,
    count: rejMap[k]
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner with Quick Batch CTA */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50/60 border border-blue-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-ibm-blue text-white px-2 py-0.5 rounded shadow-sm">
              MAINFRAME LIVE
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              BATCH ID: {summary.batch_id} • RC {summary.return_code} (CLEAN)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Scholarship Eligibility & Disbursement Processing System
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Enterprise IBM z/OS Batch Pipeline Orchestrating Enterprise COBOL, VSAM KSDS, and IBM Db2
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBatchModal}
            className="flex items-center gap-2 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Submit //BATELG01 Batch</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-300 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-ibm-blue" />
            <span>132-Col SYSOUT</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">VSAM Master</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {summary.total_students}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
            <span>Indexed KSDS</span>
            <span className="text-ibm-blue font-semibold flex items-center">View <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>

        {/* Card 2: Applications */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {summary.total_applications}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
            <span>Batch Input Feed</span>
            <span className="text-ibm-blue font-semibold flex items-center">View <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>

        {/* Card 3: Eligible Approved */}
        <div 
          onClick={() => onNavigate('eligibility')}
          className="bg-white border border-emerald-200 hover:border-emerald-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Eligible</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {summary.eligible_count}
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-1 flex items-center justify-between">
            <span>Passed SCH2001</span>
            <span className="text-emerald-700 font-semibold flex items-center">Roster <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div 
          onClick={() => onNavigate('eligibility')}
          className="bg-white border border-rose-200 hover:border-rose-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">
            {summary.rejected_count}
          </div>
          <div className="text-[10px] text-rose-600 font-mono mt-1 flex items-center justify-between">
            <span>Rules Violation</span>
            <span className="text-rose-700 font-semibold flex items-center">Audit <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>

        {/* Card 5: Duplicates */}
        <div 
          onClick={() => onNavigate('applications')}
          className="bg-white border border-amber-200 hover:border-amber-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicates</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {summary.duplicate_count}
          </div>
          <div className="text-[10px] text-amber-600 font-mono mt-1 flex items-center justify-between">
            <span>DUP3001 Intercept</span>
            <span className="text-amber-700 font-semibold flex items-center">Logs <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>

        {/* Card 6: Total Disbursed */}
        <div 
          onClick={() => onNavigate('disbursements')}
          className="bg-white border border-indigo-200 hover:border-indigo-300 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:translate-y-[-2px]"
        >
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disbursement</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-900">
            ₹{summary.total_disbursement_inr.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-600 font-mono mt-1 flex items-center justify-between">
            <span>APBS Instructions</span>
            <span className="text-indigo-700 font-semibold flex items-center">Pay <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Application Outcomes Donut */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Application Evaluation Outcomes
            </h3>
            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              COBOL SCH2001
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '6px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-100">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="text-slate-900 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Disbursement Breakdown by Department */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Scholarship Allocation by Department
            </h3>
            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              DIS4001 AMOUNTS (₹)
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '6px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Approved Amount']}
                />
                <Bar dataKey="disbursedInr" fill="#0f62fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono text-center">
            STEM & Computer Science branches qualify for Tier 1 (₹20,000) slabs
          </p>
        </div>

        {/* Chart 3: Rejection Reasons Pareto */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Rejection & Anomaly Distribution
            </h3>
            <span className="text-[10px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              AUDIT TRAIL
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rejChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="reason" type="category" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '6px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#da1e28" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono text-center">
            Duplicate applications and CGPA fall short are the primary disqualifiers
          </p>
        </div>
      </div>

      {/* 6-Layer Architecture Visualizer */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-ibm-blue" />
              <span>Full-Stack IBM Mainframe System Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Strict separation between Mainframe Batch Layers, Data Tier, and Web Visualization
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ENTERPRISE CERTIFIED
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Layer 1 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-blue-700 font-bold uppercase">Layer 1</div>
            <div className="font-semibold text-xs text-slate-900">Raw Input Datasets</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              Sequential FB 120-byte records feed (APPL.RAW)
            </p>
          </div>

          {/* Layer 2 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-ibm-blue font-bold uppercase">Layer 2</div>
            <div className="font-semibold text-xs text-slate-900">JCL Batch Exec</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              BATELG01, DFSORT, IDCAMS, IEFBR14 cleanup
            </p>
          </div>

          {/* Layer 3 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-emerald-700 font-bold uppercase">Layer 3</div>
            <div className="font-semibold text-xs text-slate-900">COBOL Engine</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              MAIN0001, STU1001, SCH2001, DUP3001, DIS4001
            </p>
          </div>

          {/* Layer 4 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-indigo-700 font-bold uppercase">Layer 4</div>
            <div className="font-semibold text-xs text-slate-900">VSAM & Db2 Store</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              VSAM KSDS 150B KEYS(10 0) + 6 Relational Db2 Tables
            </p>
          </div>

          {/* Layer 5 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-amber-700 font-bold uppercase">Layer 5</div>
            <div className="font-semibold text-xs text-slate-900">Generated Reports</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              132-Col ANSI Carriage Control SYSOUT + APBS File
            </p>
          </div>

          {/* Layer 6 */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono text-purple-700 font-bold uppercase">Layer 6</div>
            <div className="font-semibold text-xs text-slate-900">React Dashboard</div>
            <p className="text-[11px] text-slate-600 font-mono leading-tight">
              Visualizes batch results without replacing business logic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
