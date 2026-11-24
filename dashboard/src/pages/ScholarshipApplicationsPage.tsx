import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, Download, Eye, X, FileCode } from 'lucide-react';
import { Application } from '../types';

interface ScholarshipApplicationsPageProps {
  applications: Application[];
}

export const ScholarshipApplicationsPage: React.FC<ScholarshipApplicationsPageProps> = ({
  applications
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = applications.filter(a => {
    const matchSearch = a.app_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.sch_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (a.status || 'PROCESSED') === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCsv = () => {
    const headers = "Application ID,Student ID,Scheme,Date,CGPA,Attendance %,Family Income,Arrears,Bank Account,IFSC,Status\n";
    const rows = filtered.map(a => 
      `"${a.app_id}","${a.stu_id}","${a.sch_code}","${a.app_date}","${a.cgpa}","${a.attendance}","${a.income}","${a.arrears}","${a.bank_ac_num}","${a.bank_ifsc}","${a.status || 'SUBMITTED'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SCHOLARSHIP_APPLICATIONS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format 120-byte sequential fixed-width string
  const format120ByteString = (a: Application) => {
    const pad = (s: any, len: number) => String(s).padEnd(len).slice(0, len);
    const padNum = (s: any, len: number) => String(s).padStart(len, '0').slice(0, len);

    const cgpaInt = Math.round(a.cgpa * 100);
    const attnInt = Math.round(a.attendance * 100);
    const incInt = Math.round(a.income * 100);

    return (
      pad(a.app_id, 10) +
      pad(a.stu_id, 10) +
      pad(a.sch_code, 6) +
      pad(a.app_date.replace(/-/g, ''), 8) +
      padNum(cgpaInt, 4) +
      padNum(attnInt, 5) +
      padNum(incInt, 10) +
      padNum(a.arrears, 2) +
      pad(a.bank_ac_num, 18) +
      pad(a.bank_ifsc, 11) +
      ''.padEnd(36)
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">
              BATCH DATASET: USERID.SCHOLAR.DATA.APPL.RAW
            </span>
            <span className="text-xs text-slate-400 font-mono">
              RECORDING MODE F • LRECL=120 • RECFM=FB
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Scholarship Application Batch Feed
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Sequential application stream ingested for duplicate checks (DUP3001) and rules processing (SCH2001)
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-ibm-cyan" />
          <span>Export Feed CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by App ID, Student ID, Scheme..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-ibm-blue font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          {['ALL', 'PROCESSED', 'REJECTED', 'DUPLICATE', 'INVALID'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-ibm-blue text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Attn %</th>
                <th className="py-3 px-4">Family Income (INR)</th>
                <th className="py-3 px-4">Arrears</th>
                <th className="py-3 px-4">Bank IFSC</th>
                <th className="py-3 px-4">Batch Status</th>
                <th className="py-3 px-4 text-right">COBOL 120B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    No application records match your filter criteria.
                  </td>
                </tr>
              ) : (
                displayed.map((a) => {
                  const isDup = a.is_duplicate || a.status === 'DUPLICATE';
                  const isInv = a.status === 'INVALID';
                  const isRej = a.status === 'REJECTED';
                  return (
                    <tr key={`${a.app_id}-${a.stu_id}`} className="greenbar-row hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {a.app_id}
                      </td>
                      <td className="py-3 px-4 text-ibm-cyan font-bold">
                        {a.stu_id}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-700">
                          {a.sch_code}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${a.cgpa >= 7.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {a.cgpa.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${a.attendance >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {a.attendance.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-4 ${a.income <= 250000 ? 'text-slate-200' : 'text-rose-400 font-semibold'}`}>
                        ₹{a.income.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 ${a.arrears === 0 ? 'text-slate-300' : 'text-rose-400 font-bold'}`}>
                        {a.arrears}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {a.bank_ifsc || <span className="text-rose-400 italic">[BLANK]</span>}
                      </td>
                      <td className="py-3 px-4">
                        {isDup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            DUPLICATE
                          </span>
                        ) : isInv ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                            INVALID
                          </span>
                        ) : isRej ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-900">
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            PROCESSED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedApp(a)}
                          className="text-ibm-blue hover:text-blue-400 p-1 rounded hover:bg-blue-950/40 inline-flex items-center gap-1 transition-colors text-[11px]"
                          title="Inspect 120-Byte COBOL Fixed-Width Record Layout"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} application records
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 120-Byte COBOL Layout Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-ibm-blue" />
                <h3 className="font-bold text-slate-100 text-sm font-mono">
                  COBOL Record Layout (SCHAPP.cpy) - {selectedApp.app_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  120-Byte Fixed-Width Sequential Line:
                </label>
                <div className="bg-black p-3 rounded border border-slate-800 text-emerald-400 overflow-x-auto whitespace-pre font-mono text-xs">
                  {format120ByteString(selectedApp)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 text-xs">
                <div className="text-slate-400 font-semibold mb-2">Field Offsets (IBM z/OS DCB Format):</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">01-10:</span> APP-ID = <span className="text-slate-200">{selectedApp.app_id}</span></div>
                  <div><span className="text-slate-500">11-20:</span> APP-STU-ID = <span className="text-slate-200">{selectedApp.stu_id}</span></div>
                  <div><span className="text-slate-500">21-26:</span> APP-SCH-CODE = <span className="text-slate-200">{selectedApp.sch_code}</span></div>
                  <div><span className="text-slate-500">27-34:</span> APP-DATE = <span className="text-slate-200">{selectedApp.app_date}</span></div>
                  <div><span className="text-slate-500">35-38:</span> APP-CGPA = <span className="text-slate-200">{selectedApp.cgpa.toFixed(2)}</span></div>
                  <div><span className="text-slate-500">39-43:</span> APP-ATTENDANCE = <span className="text-slate-200">{selectedApp.attendance.toFixed(2)}%</span></div>
                  <div><span className="text-slate-500">44-53:</span> APP-FAMILY-INCOME = <span className="text-slate-200">₹{selectedApp.income.toLocaleString()}</span></div>
                  <div><span className="text-slate-500">54-55:</span> APP-ARREARS = <span className="text-slate-200">{selectedApp.arrears}</span></div>
                  <div><span className="text-slate-500">56-73:</span> APP-BANK-AC = <span className="text-slate-200">{selectedApp.bank_ac_num}</span></div>
                  <div><span className="text-slate-500">74-84:</span> APP-BANK-IFSC = <span className="text-slate-200">{selectedApp.bank_ifsc || 'BLANK'}</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
