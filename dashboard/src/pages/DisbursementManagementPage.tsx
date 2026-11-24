import React, { useState } from 'react';
import { CreditCard, Download, ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { DisbursementRecord } from '../types';

interface DisbursementManagementPageProps {
  disbursements: DisbursementRecord[];
  onUpdateDisbursements: (updated: DisbursementRecord[]) => void;
}

export const DisbursementManagementPage: React.FC<DisbursementManagementPageProps> = ({
  disbursements,
  onUpdateDisbursements
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'S' | 'P' | 'F'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const filtered = disbursements.filter(d => {
    const matchSearch = d.ref_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.app_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.utr_num.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalDisbursed = disbursements.reduce((acc, d) => acc + d.amount, 0);
  const settledCount = disbursements.filter(d => d.status === 'S').length;
  const pendingCount = disbursements.filter(d => d.status === 'P').length;

  const handleSimulateSettlement = () => {
    setIsSettling(true);
    setTimeout(() => {
      const updated = disbursements.map(d => ({
        ...d,
        status: 'S' as const
      }));
      onUpdateDisbursements(updated);
      setIsSettling(false);
    }, 1200);
  };

  const exportCsv = () => {
    const headers = "Reference ID,Application ID,Student ID,Amount INR,Bank Account,Bank IFSC,Status,Value Date,UTR Number,Batch ID\n";
    const rows = filtered.map(d => 
      `"${d.ref_id}","${d.app_id}","${d.stu_id}","${d.amount}","${d.bank_ac_num}","${d.bank_ifsc}","${d.status}","${d.value_date}","${d.utr_num}","${d.batch_id}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DISBURSEMENT_PAYMENTS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportApbsDat = () => {
    const batchId = disbursements[0]?.batch_id || 'BAT2024101';
    const currDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const totalCents = Math.round(totalDisbursed * 100);

    const hdr = `H${batchId.padEnd(10)}${currDate}${String(disbursements.length).padStart(6, '0')}${String(totalCents).padStart(12, '0')}${''.padEnd(83)}`.slice(0, 120);

    const details = disbursements.map(d => {
      const amtStr = String(Math.round(d.amount * 100)).padStart(9, '0');
      return `D${d.ref_id.padEnd(12)}${d.app_id.padEnd(10)}${d.stu_id.padEnd(10)}${amtStr}${d.bank_ac_num.padEnd(18)}${d.bank_ifsc.padEnd(11)}${d.status}${d.value_date.padEnd(8)}${d.utr_num.padEnd(16)}${d.batch_id.padEnd(10)}${''.padEnd(15)}`.slice(0, 120);
    });

    const trailer = `T${batchId.padEnd(10)}${String(disbursements.length).padStart(6, '0')}${String(totalCents).padStart(12, '0')}HASH982736451000${''.padEnd(75)}`.slice(0, 120);

    const fileText = [hdr, ...details, trailer].join('\n') + '\n';
    const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DISBURSEMENT_INSTRUCTION_${batchId}.dat`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded font-bold">
              COBOL DISBURSEMENT ENGINE: DIS4001
            </span>
            <span className="text-xs text-slate-400 font-mono">
              OUTPUT: USERID.SCHOLAR.DATA.DISB.PAYMENTS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Scholarship Disbursement & Electronic Fund Advice
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Simulated electronic fund transfer instructions complying with standard NACHA / APBS banking layouts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateSettlement}
            disabled={isSettling || pendingCount === 0}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all ${
              pendingCount === 0
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSettling ? 'animate-spin' : ''}`} />
            <span>{isSettling ? 'Settling...' : 'Simulate Bank Settlement'}</span>
          </button>

          <button
            onClick={exportApbsDat}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Download .dat</span>
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-ibm-cyan" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400 font-mono">Total Allocation (INR)</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            ₹{totalDisbursed.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Approved by batch engine</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400 font-mono">Instructions Count</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {disbursements.length} Payments
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Eligible candidates</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-emerald-400 font-mono">Settled (Success)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {settledCount} Transferred
          </div>
          <div className="text-[10px] text-emerald-400/70 mt-1">Confirmed with UTR</div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-amber-400 font-mono">Pending Settlement</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {pendingCount} Instructions
          </div>
          <div className="text-[10px] text-amber-400/70 mt-1">Awaiting batch clearing</div>
        </div>
      </div>

      {/* Duplicate Prevention Guarantee Banner */}
      <div className="bg-slate-900/80 border border-indigo-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950 text-indigo-400 rounded-lg border border-indigo-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              DIS4001 Duplicate Disbursement Prevention Shield
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Enforces unique in-flight payment tracking per Student ID and Application Reference. Prevents multiple payouts across parallel batch streams.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded">
          ENFORCED
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Disb Ref ID</th>
                <th className="py-3 px-4">App ID</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Bank Account (Masked)</th>
                <th className="py-3 px-4">IFSC</th>
                <th className="py-3 px-4">UTR Number</th>
                <th className="py-3 px-4">Value Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((d) => (
                <tr key={d.ref_id} className="greenbar-row hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 text-ibm-cyan font-bold">
                    {d.ref_id}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-semibold">
                    {d.app_id}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {d.stu_id}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {'•••• •••• •••• ' + d.bank_ac_num.slice(-4)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {d.bank_ifsc}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    {d.utr_num}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {d.value_date}
                  </td>
                  <td className="py-3 px-4">
                    {d.status === 'S' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        SETTLED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                        <Clock className="w-3 h-3" />
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-100 text-sm">
                    ₹{d.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
