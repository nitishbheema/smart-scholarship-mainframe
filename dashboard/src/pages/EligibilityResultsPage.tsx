import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, XCircle, AlertTriangle, Download, Info } from 'lucide-react';
import { EligibilityResult } from '../types';

interface EligibilityResultsPageProps {
  results: EligibilityResult[];
}

export const EligibilityResultsPage: React.FC<EligibilityResultsPageProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'E' | 'R' | 'D' | 'I'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = results.filter(r => {
    const matchSearch = r.app_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.stu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.reason_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCsv = () => {
    const headers = "Application ID,Student ID,Student Name,Scheme,CGPA,Attendance %,Family Income,Arrears,Status,Reason Code,Reason Desc,Award Amount INR\n";
    const rows = filtered.map(r => 
      `"${r.app_id}","${r.stu_id}","${r.stu_name}","${r.sch_code}","${r.cgpa}","${r.attendance}","${r.income}","${r.arrears}","${r.status}","${r.reason_code.trim()}","${r.reason_desc || ''}","${r.award}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ELIGIBILITY_EVALUATION_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              COBOL ENGINE: SCH2001
            </span>
            <span className="text-xs text-slate-500 font-mono">
              OUTPUT DATASET: USERID.SCHOLAR.DATA.ELIG.APPROVED
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Eligibility Evaluation Results
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Rigorous evaluation of academic criteria, financial means, and active arrears with amount slab calculation
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-ibm-blue" />
          <span>Export Results CSV</span>
        </button>
      </div>

      {/* Rules Criteria Reference Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-slate-200 p-3.5 rounded-lg text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600">Min CGPA:</span>
          <span className="text-slate-900 font-bold">&ge; 7.50</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600">Min Attendance:</span>
          <span className="text-slate-900 font-bold">&ge; 75.00%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600">Max Family Income:</span>
          <span className="text-slate-900 font-bold">&le; ₹2,50,000</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600">Active Arrears:</span>
          <span className="text-slate-900 font-bold">= 0</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, app ID, reason..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-ibm-blue font-mono shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-600">Status:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'E', label: 'Eligible' },
            { id: 'R', label: 'Rejected' },
            { id: 'D', label: 'Duplicates' },
            { id: 'I', label: 'Invalid' }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => { setStatusFilter(st.id as any); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                statusFilter === st.id
                  ? 'bg-ibm-blue text-white font-semibold shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">App ID</th>
                <th className="py-3 px-4">Student ID / Name</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Attn %</th>
                <th className="py-3 px-4">Income (INR)</th>
                <th className="py-3 px-4">Arrs</th>
                <th className="py-3 px-4">Outcome Status</th>
                <th className="py-3 px-4">Audit Reason Code</th>
                <th className="py-3 px-4 text-right">Award Slabs (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    No evaluated eligibility records match your query.
                  </td>
                </tr>
              ) : (
                displayed.map((r) => {
                  const isElig = r.status === 'E';
                  const isDup = r.status === 'D';
                  const isInv = r.status === 'I';

                  return (
                    <tr key={`${r.app_id}-${r.stu_id}`} className="greenbar-row hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        {r.app_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-ibm-blue font-bold">{r.stu_id}</div>
                        <div className="text-slate-900 text-[11px] truncate font-sans font-medium">{r.stu_name}</div>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${r.cgpa >= 7.5 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {r.cgpa.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${r.attendance >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {r.attendance.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-4 ${r.income <= 250000 ? 'text-slate-700' : 'text-rose-700 font-semibold'}`}>
                        ₹{r.income.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 ${r.arrears === 0 ? 'text-slate-700' : 'text-rose-700 font-bold'}`}>
                        {r.arrears}
                      </td>
                      <td className="py-3 px-4">
                        {isElig ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ELIGIBLE
                          </span>
                        ) : isDup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            DUPLICATE
                          </span>
                        ) : isInv ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            INVALID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-[11px]">
                          {r.reason_code}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {r.reason_desc || 'Evaluated via COBOL'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isElig ? (
                          <span className="text-emerald-700 font-bold text-sm">
                            ₹{r.award.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
          <div>
            Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} evaluated applications
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Prev
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-900 font-medium shadow-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
