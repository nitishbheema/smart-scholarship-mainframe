import React, { useState } from 'react';
import { Search, Filter, Download, Database, Eye, X, Binary } from 'lucide-react';
import { Student } from '../types';

interface StudentRecordsPageProps {
  students: Student[];
}

export const StudentRecordsPage: React.FC<StudentRecordsPageProps> = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = students.filter(s => {
    const matchSearch = s.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'ALL' || s.dept.trim() === selectedDept;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCsv = () => {
    const headers = "Student ID,Full Name,DOB,Gender,Department,Year,Semester,Email,Phone,Enroll Date,Status\n";
    const rows = filtered.map(s => 
      `"${s.stu_id}","${s.name}","${s.dob}","${s.gender}","${s.dept.trim()}","${s.year}","${s.sem}","${s.email}","${s.phone}","${s.enroll_date}","${s.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VSAM_STUMAST_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate simulated 150-byte hex dump for a student record
  const generateHexDump = (s: Student) => {
    const recStr = (
      s.stu_id.padEnd(10) +
      s.name.padEnd(30) +
      s.dob.replace(/-/g, '').padEnd(8) +
      s.gender +
      s.dept.padEnd(4) +
      s.year +
      s.sem.padStart(2, '0') +
      s.email.padEnd(35) +
      s.phone.padEnd(10) +
      s.enroll_date.replace(/-/g, '').padEnd(8) +
      s.status +
      ''.padEnd(40)
    ).slice(0, 150);

    const lines: string[] = [];
    for (let i = 0; i < recStr.length; i += 16) {
      const slice = recStr.slice(i, i + 16);
      const hex = Array.from(slice).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      const ascii = Array.from(slice).map(c => (c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126) ? c : '.').join('');
      lines.push(`${i.toString(16).padStart(4, '0').toUpperCase()}  ${hex.padEnd(48)}  |${ascii.padEnd(16)}|`);
    }
    return lines.join('\n');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">
              VSAM CLUSTER: USERID.SCHOLAR.VSAM.STUMAST.KSDS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              RECORDSIZE(150 150) • KEYS(10 0)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            VSAM Indexed Student Master Records
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Fast keyed sequential access for batch lookup by 10-byte Student ID during eligibility runs
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-ibm-cyan" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Student ID, name, email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-ibm-blue font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Dept:</span>
          {['ALL', 'CS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVL'].map(dept => (
            <button
              key={dept}
              onClick={() => { setSelectedDept(dept); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                selectedDept === dept
                  ? 'bg-ibm-blue text-white font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Student ID (Key)</th>
                <th className="py-3 px-4">Full Student Name</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Year/Sem</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">VSAM Hex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No indexed student master records matched your query.
                  </td>
                </tr>
              ) : (
                displayed.map((s) => (
                  <tr key={s.stu_id} className="greenbar-row hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-ibm-cyan font-bold">
                      {s.stu_id}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                        {s.dept.trim()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      Yr {s.year} / Sem {s.sem}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.email}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ACTIVE (A)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="text-ibm-blue hover:text-blue-400 p-1 rounded hover:bg-blue-950/40 inline-flex items-center gap-1 transition-colors text-[11px]"
                        title="Inspect 150-Byte VSAM KSDS Record & Hex Dump"
                      >
                        <Binary className="w-3.5 h-3.5" />
                        <span>Dump</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
            {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} indexed records
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

      {/* Hex Dump Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-ibm-blue" />
                <h3 className="font-bold text-slate-100 text-sm font-mono">
                  VSAM KSDS Record Layout & Hex Dump: {selectedStudent.stu_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
              <div><span className="text-slate-500">Record Length:</span> <span className="text-slate-200">150 Bytes</span></div>
              <div><span className="text-slate-500">Key Offset:</span> <span className="text-slate-200">0 (Pos 1)</span></div>
              <div><span className="text-slate-500">Key Length:</span> <span className="text-slate-200">10 Bytes</span></div>
              <div><span className="text-slate-500">Cluster Status:</span> <span className="text-emerald-400">OPEN (00)</span></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 font-mono block mb-1.5">
                IBM z/OS IDCAMS Hexadecimal & Character Inspection:
              </label>
              <pre className="bg-black text-emerald-400 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                {generateHexDump(selectedStudent)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Close Dump Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
