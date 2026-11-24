import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, Download, Eye, X, Plus, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Application } from '../types';
import { api } from '../services/api';

interface ScholarshipApplicationsPageProps {
  applications: Application[];
  onRefresh?: () => void;
  isAdminOrOperator?: boolean;
}

export const ScholarshipApplicationsPage: React.FC<ScholarshipApplicationsPageProps> = ({
  applications,
  onRefresh,
  isAdminOrOperator = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Submit Application Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitForm, setSubmitForm] = useState({
    student_id: '',
    scheme_code: 'MERIT1',
    bank_account_no: '9182374619283746',
    bank_ifsc: 'SBIN0001234',
  });

  // Bulk Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const filtered = applications.filter(a => {
    const matchSearch = a.app_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.stu_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.sch_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (a.status || 'PROCESSED') === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.createApplication(submitForm);
      setIsSubmitModalOpen(false);
      setSubmitForm({
        student_id: '',
        scheme_code: 'MERIT1',
        bank_account_no: '9182374619283746',
        bank_ifsc: 'SBIN0001234',
      });
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const res = await api.bulkUploadApplications(csvContent);
      setUploadMessage(`Upload completed: ${res.inserted} applications ingested.`);
      setCsvContent('');
      if (onRefresh) await onRefresh();
      setTimeout(() => setIsUploadModalOpen(false), 1500);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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
      pad((a.app_date || '').replace(/-/g, ''), 8) +
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
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
              BATCH DATASET: USERID.SCHOLAR.DATA.APPL.RAW
            </span>
            <span className="text-xs text-slate-500 font-mono">
              RECORDING MODE F • LRECL=120 • RECFM=FB
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Scholarship Application Batch Feed
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Sequential application stream ingested for duplicate checks (DUP3001) and rules processing (SCH2001)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdminOrOperator && (
            <>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex items-center gap-1.5 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Application</span>
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
            <span>Export Feed CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by App ID, Student ID, Scheme..."
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
            <span className="text-xs text-slate-600 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-ibm-blue font-mono shadow-sm"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="PENDING_BATCH">PENDING BATCH</option>
              <option value="ELIGIBLE">ELIGIBLE</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filtered.length} applications
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Income</th>
                <th className="py-3 px-4">Bank Acct (Masked)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((a) => (
                <tr key={a.app_id} className="greenbar-row hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-ibm-blue">
                    {a.app_id}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {a.stu_id}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {a.sch_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {a.app_date}
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">
                    {a.cgpa.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {a.attendance.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    ₹{a.income.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {'•••• •••• •••• ' + (a.bank_ac_num || '').slice(-4)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.status === 'ELIGIBLE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : a.status === 'REJECTED'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {a.status || 'SUBMITTED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedApp(a)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 text-ibm-blue px-2 py-1 rounded text-[10px] transition-colors shadow-sm"
                      title="Inspect 120-Byte Layout"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
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

      {/* Submit Application Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-ibm-blue" />
                <span>Submit Scholarship Application</span>
              </h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-mono block mb-1">Student ID (Registered)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU2024001"
                  value={submitForm.student_id}
                  onChange={(e) => setSubmitForm({ ...submitForm, student_id: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 uppercase focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="text-slate-700 font-mono block mb-1">Scholarship Scheme</label>
                <select
                  value={submitForm.scheme_code}
                  onChange={(e) => setSubmitForm({ ...submitForm, scheme_code: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                >
                  <option value="MERIT1">MERIT1 - State Post-Matric Merit Scholarship</option>
                  <option value="TECH02">TECH02 - Technical Excellence Endowment</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-mono block mb-1">Bank Account Number</label>
                <input
                  type="text"
                  required
                  value={submitForm.bank_account_no}
                  onChange={(e) => setSubmitForm({ ...submitForm, bank_account_no: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="text-slate-700 font-mono block mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={submitForm.bank_ifsc}
                  onChange={(e) => setSubmitForm({ ...submitForm, bank_ifsc: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 uppercase focus:border-ibm-blue focus:ring-1 focus:ring-ibm-blue outline-none shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-ibm-blue hover:bg-ibm-darkblue disabled:bg-slate-300 text-white rounded font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
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
                <span>Bulk Upload Applications Feed CSV</span>
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
                Paste CSV data below with columns: <code className="text-emerald-700 font-semibold">student_id,scheme_code,bank_account_no,bank_ifsc</code>
              </p>

              <textarea
                rows={8}
                required
                placeholder="student_id,scheme_code,bank_account_no,bank_ifsc&#10;STU2024001,MERIT1,9182374619283746,SBIN0001234"
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
                  <span>{isUploading ? 'Ingesting...' : 'Ingest Feed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 120-Byte Fixed Width Layout Inspector */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                COBOL 120-Byte Fixed-Width Record: {selectedApp.app_id}
              </h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] text-slate-600 font-mono">
                Exact dataset record formatted according to copybook SCHAPP.cpy (LRECL=120):
              </div>
              <pre className="bg-slate-900 p-3 rounded font-mono text-[11px] text-cyan-400 overflow-x-auto border border-slate-800 select-all">
                {format120ByteString(selectedApp)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
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
