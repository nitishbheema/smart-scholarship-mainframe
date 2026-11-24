import React, { useState } from 'react';
import { Search, Filter, Download, Plus, Upload, Eye, X, Binary, AlertCircle, Loader2, UserCheck, Trash2 } from 'lucide-react';
import { Student } from '../types';
import { api } from '../services/api';

interface StudentRecordsPageProps {
  students: Student[];
  onRefresh?: () => void;
  isAdminOrOperator?: boolean;
}

export const StudentRecordsPage: React.FC<StudentRecordsPageProps> = ({
  students,
  onRefresh,
  isAdminOrOperator = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    student_id: '',
    name: '',
    email: '',
    department: 'CSE',
    course: 'B.Tech Computer Science',
    academic_year: '3',
    cgpa: '8.50',
    attendance: '85.00',
    annual_family_income: '200000',
    active_arrears: '0',
  });

  // Bulk Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const filtered = students.filter(s => {
    const matchSearch = s.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'ALL' || s.dept.trim() === selectedDept;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError(null);

    try {
      await api.createStudent(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        student_id: '',
        name: '',
        email: '',
        department: 'CSE',
        course: 'B.Tech Computer Science',
        academic_year: '3',
        cgpa: '8.50',
        attendance: '85.00',
        annual_family_income: '200000',
        active_arrears: '0',
      });
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create student record');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await api.bulkUploadStudents(csvContent);
      setUploadMessage(`Upload successful: ${res.inserted} inserted, ${res.updated} updated.`);
      setCsvContent('');
      if (onRefresh) await onRefresh();
      setTimeout(() => setIsUploadModalOpen(false), 1500);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeactivate = async (studentId: string) => {
    if (!confirm(`Are you sure you want to deactivate student ${studentId}?`)) return;
    try {
      await api.deleteStudent(studentId);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      alert(`Deactivation failed: ${err.message}`);
    }
  };

  const exportCsv = () => {
    const headers = "Student ID,Full Name,Department,Course,Year,CGPA,Attendance %,Family Income,Arrears,Status\n";
    const rows = filtered.map(s => 
      `"${s.stu_id}","${s.name}","${s.dept.trim()}","${s.course || 'B.Tech'}","${s.year}","${s.cgpa ?? ''}","${s.attendance ?? ''}","${s.income ?? ''}","${s.arrears ?? ''}","${s.status}"`
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
      (s.dob || '20040515').replace(/-/g, '').padEnd(8) +
      (s.gender || 'U') +
      s.dept.padEnd(4) +
      s.year +
      String(s.sem || 6).padStart(2, '0') +
      s.email.padEnd(35) +
      (s.phone || '9876543210').padEnd(10) +
      (s.enroll_date || '20220801').replace(/-/g, '').padEnd(8) +
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
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
              VSAM CLUSTER: USERID.SCHOLAR.VSAM.STUMAST.KSDS
            </span>
            <span className="text-xs text-slate-500 font-mono">
              RECORDSIZE(150 150) • KEYS(10 0)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            VSAM Indexed Student Master Records
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Fast keyed sequential access for batch lookup by 10-byte Student ID during eligibility runs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdminOrOperator && (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Bulk Upload</span>
              </button>
            </>
          )}

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-ibm-blue" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-ibm-blue font-mono shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-600 font-mono">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-ibm-blue font-mono shadow-sm"
            >
              <option value="ALL">ALL DEPARTMENTS</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="MECH">MECH</option>
              <option value="IT">IT</option>
              <option value="CIVIL">CIVIL</option>
              <option value="EEE">EEE</option>
              <option value="CHEM">CHEM</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filtered.length} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Student ID (Key)</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Income</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((s) => (
                <tr key={s.stu_id} className="greenbar-row hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-ibm-blue">
                    {s.stu_id}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-sans font-medium">
                    {s.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {s.dept.trim()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Yr {s.year}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.email}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">
                    {s.cgpa !== undefined ? s.cgpa.toFixed(2) : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {s.attendance !== undefined ? `${s.attendance.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {s.income !== undefined ? `₹${s.income.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.status === 'ACTIVE' || s.status === 'A'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-ibm-blue px-2 py-1 rounded text-[10px] transition-colors shadow-sm"
                        title="View Record Hex Dump"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdminOrOperator && (s.status === 'ACTIVE' || s.status === 'A') && (
                        <button
                          onClick={() => handleDeactivate(s.stu_id)}
                          className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 px-2 py-1 rounded text-[10px] transition-colors shadow-sm"
                          title="Deactivate Student Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
          <span>Page {currentPage} of {totalPages || 1}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded text-slate-700 shadow-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-40 rounded text-slate-700 shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-ibm-blue" />
                <span>Add Student to VSAM Master (PostgreSQL)</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Student ID (STU+7 digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="STU2024101"
                    value={addForm.student_id}
                    onChange={(e) => setAddForm({ ...addForm, student_id: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 uppercase focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Student Name"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@scholarship.edu"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Department</label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                    <option value="IT">IT</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="EEE">EEE</option>
                    <option value="CHEM">CHEM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-mono block mb-1">CGPA (0-10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={addForm.cgpa}
                    onChange={(e) => setAddForm({ ...addForm, cgpa: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-emerald-700 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Attendance %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={addForm.attendance}
                    onChange={(e) => setAddForm({ ...addForm, attendance: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-mono block mb-1">Arrears</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.active_arrears}
                    onChange={(e) => setAddForm({ ...addForm, active_arrears: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-mono block mb-1">Annual Family Income (INR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={addForm.annual_family_income}
                  onChange={(e) => setAddForm({ ...addForm, annual_family_income: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-1.5 bg-ibm-blue hover:bg-ibm-darkblue disabled:bg-slate-300 text-white rounded font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAdding ? 'Saving...' : 'Add Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Bulk Upload Student Master CSV</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadMessage && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800">
                {uploadMessage}
              </div>
            )}

            <form onSubmit={handleBulkUpload} className="space-y-3 text-xs">
              <p className="text-slate-600 text-[11px]">
                Paste CSV data below with columns: <code className="text-emerald-700 font-semibold">student_id,name,email,department,course,academic_year,cgpa,attendance,annual_family_income,active_arrears</code>
              </p>

              <textarea
                rows={8}
                required
                placeholder="student_id,name,email,department,course,academic_year,cgpa,attendance,annual_family_income,active_arrears&#10;STU2024101,John Doe,john@edu.com,CSE,B.Tech,2,8.80,89.0,180000,0"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue shadow-sm"
              ></textarea>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUploading ? 'Uploading...' : 'Process Upload'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hex Dump Inspector Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-ibm-blue" />
                <h3 className="text-sm font-bold text-slate-900">
                  VSAM Record Hex Dump: {selectedStudent.stu_id}
                </h3>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="bg-slate-900 p-3 rounded font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
              {generateHexDump(selectedStudent)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
