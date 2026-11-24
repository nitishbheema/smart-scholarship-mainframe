import React, { useState, useEffect, useCallback } from 'react';
import { PageType, UserSession, Student, Application, EligibilityResult, DisbursementRecord, ExceptionRecord, BatchSummary, SystemConfig, JclJobExecution } from './types';
import { 
  INITIAL_CONFIG, 
  INITIAL_EXCEPTIONS,
} from './data/initialData';

import { api, API_BASE_URL } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { JclBatchModal } from './components/JclBatchModal';
import { MainframeReportImportModal } from './components/MainframeReportImportModal';

import { LoginPage } from './pages/LoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { StudentRecordsPage } from './pages/StudentRecordsPage';
import { ScholarshipApplicationsPage } from './pages/ScholarshipApplicationsPage';
import { EligibilityResultsPage } from './pages/EligibilityResultsPage';
import { DisbursementManagementPage } from './pages/DisbursementManagementPage';
import { BatchProcessingHistoryPage } from './pages/BatchProcessingHistoryPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { SystemConfigurationPage } from './pages/SystemConfigurationPage';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

const EMPTY_SUMMARY: BatchSummary = {
  batch_id: 'BAT0000000',
  job_name: 'BATELG01',
  step_name: 'RUNCOB',
  run_date: new Date().toISOString().slice(0, 10),
  exec_date: new Date().toISOString().slice(0, 10),
  exec_time: '00:00:00',
  return_code: 'RC 0000',
  total_records: 0,
  eligible_count: 0,
  rejected_count: 0,
  duplicate_count: 0,
  invalid_count: 0,
  total_disbursement_inr: 0,
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  
  // Requirement 1: Initial frontend session is explicitly unauthenticated
  const [session, setSession] = useState<UserSession>({
    username: '',
    role: 'OPERATOR',
    isAuthenticated: false,
    zosUserId: '',
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>(INITIAL_EXCEPTIONS);
  const [summary, setSummary] = useState<BatchSummary>(EMPTY_SUMMARY);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [jobExecutions, setJobExecutions] = useState<JclJobExecution[]>([]);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isExecutingCobol, setIsExecutingCobol] = useState<boolean>(false);
  const [liveExecutionMessage, setLiveExecutionMessage] = useState<string | null>(null);

  // Synchronize state with persistent PostgreSQL database and GnuCOBOL Engine
  const loadBackendData = useCallback(async () => {
    setIsConnecting(true);
    setBackendError(null);

    try {
      // 1. Healthcheck
      const health = await api.getHealth();
      if (health.status !== 'ONLINE') {
        throw new Error('Backend healthcheck returned non-ONLINE status: ' + health.status);
      }
      setIsBackendLive(true);

      // 2. Verify Session if token exists
      const token = api.getToken();
      if (token) {
        try {
          const meRes = await api.getMe();
          if (meRes.user) {
            setSession({
              username: meRes.user.username,
              role: meRes.user.role,
              isAuthenticated: true,
              zosUserId: meRes.user.username.toUpperCase().slice(0, 8),
            });
          }
        } catch {
          // Token invalid/expired: log out
          api.setToken(null);
          setSession({
            username: '',
            role: 'OPERATOR',
            isAuthenticated: false,
            zosUserId: '',
          });
          setIsConnecting(false);
          return;
        }
      } else {
        // Unauthenticated session
        setIsConnecting(false);
        return;
      }

      // 3. Fetch all persistent application data
      const [sumRes, stuRes, appRes, jobRes, disbRes, eligRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getStudents(),
        api.getApplications(),
        api.getBatchJobs(),
        api.getDisbursements(),
        api.getEligibilityResults(),
      ]);

      if (stuRes && stuRes.students) {
        setStudents(stuRes.students.map((s: any) => ({
          stu_id: s.student_id,
          name: s.name,
          dob: '2004-05-15',
          gender: 'U',
          dept: s.department,
          year: s.academic_year,
          sem: s.academic_year * 2,
          email: s.email,
          phone: '9876543210',
          enroll_date: '2022-08-01',
          status: s.status,
          cgpa: parseFloat(s.cgpa) || 0,
          attendance: parseFloat(s.attendance) || 0,
          income: parseFloat(s.annual_family_income) || 0,
          arrears: s.active_arrears || 0,
        })));
      }

      if (appRes && appRes.applications) {
        setApplications(appRes.applications.map((a: any) => ({
          app_id: a.application_id,
          stu_id: a.student_id,
          sch_code: a.scheme_code,
          app_date: (a.submission_date || '').slice(0, 10),
          cgpa: parseFloat(a.cgpa) || 0,
          attendance: parseFloat(a.attendance) || 0,
          income: parseFloat(a.annual_family_income) || 0,
          arrears: a.active_arrears || 0,
          bank_ac_num: a.bank_account_no,
          bank_ifsc: a.bank_ifsc,
          status: a.status,
          award_amount: parseFloat(a.award_amount || 0),
        })));
      }

      if (eligRes && eligRes.results) {
        setEligibilityResults(eligRes.results.map((e: any) => ({
          app_id: e.application_id,
          stu_id: e.student_id,
          stu_name: e.student_name || 'STUDENT',
          dept: e.department || 'GEN',
          sch_code: e.scheme_code,
          cgpa: parseFloat(e.cgpa) || 0,
          attendance: parseFloat(e.attendance) || 0,
          income: parseFloat(e.annual_family_income) || 0,
          arrears: e.active_arrears || 0,
          status: e.status,
          reason_code: e.reason_code,
          reason_desc: e.reason_code === 'NONE      ' ? 'Meets eligibility requirements' : e.reason_code,
          award: parseFloat(e.award_amount || 0),
          batch_id: e.batch_id,
        })));
      }

      if (disbRes && disbRes.disbursements) {
        setDisbursements(disbRes.disbursements.map((d: any) => ({
          ref_id: d.disbursement_id.slice(-12),
          disb_id: d.disbursement_id,
          app_id: d.application_id,
          stu_id: d.student_id,
          stu_name: d.student_name || 'STUDENT',
          amount: parseFloat(d.award_amount) || 0,
          bank_ac_num: d.bank_account_no,
          bank_ifsc: d.bank_ifsc,
          status: d.payment_status === 'SETTLED' ? 'S' : 'P',
          batch_id: d.batch_id,
          utr_num: d.utr_number || 'PENDING',
          value_date: d.payment_date || new Date().toISOString().slice(0, 10),
        })));
      }

      if (sumRes && sumRes.summary) {
        const s = sumRes.summary;
        setSummary(prev => ({
          ...prev,
          total_records: s.totalApplications,
          eligible_count: s.eligibleApplications,
          rejected_count: s.rejectedApplications,
          total_disbursement_inr: s.totalDisbursed,
        }));
      }

      if (jobRes && jobRes.jobs) {
        const mappedJobs: JclJobExecution[] = jobRes.jobs.map((j: any) => ({
          jobId: j.batch_id,
          jobName: j.job_name || 'BATELG01',
          submitTime: (j.start_time || '').replace('T', ' ').slice(0, 19),
          completionTime: (j.end_time || '').replace('T', ' ').slice(0, 19),
          returnCode: j.return_code || 'RC 0000',
          status: j.status,
          steps: [
            { stepName: 'ALLOC01', program: 'IEFBR14', rc: '0000', description: 'Dynamic dataset allocation' },
            { stepName: 'RUNCOB', program: 'MAIN0001', rc: j.return_code?.replace('RC ', '') || '0000', description: j.execution_engine || 'GnuCOBOL Executable' },
            { stepName: 'AUDITPG', program: 'POSTGRES', rc: '0000', description: 'PostgreSQL Relational Persistence' }
          ],
          sysoutLog: j.sysout_report ? j.sysout_report.split('\n') : [`BATCH ${j.batch_id} EXECUTED - STATUS ${j.status}`]
        }));
        setJobExecutions(mappedJobs);
      }
    } catch (e: any) {
      setIsBackendLive(false);
      setBackendError(e.message || 'Failed to connect to backend REST API');
      console.warn('Backend connection error:', e.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Real Login Handler
  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    setActivePage('dashboard');
    loadBackendData();
  };

  // Real Logout Handler
  const handleLogout = () => {
    api.setToken(null);
    setSession({
      username: '',
      role: 'OPERATOR',
      isAuthenticated: false,
      zosUserId: '',
    });
    setActivePage('login');
  };

  // Execute Native COBOL Batch via REST API
  const handleExecuteLiveCobol = async () => {
    setIsExecutingCobol(true);
    setLiveExecutionMessage(null);
    try {
      const res = await api.executeCobolBatch();
      await loadBackendData();
      setLiveExecutionMessage(
        `COBOL Binary MAIN0001 executed successfully! ${res.result.recordsEligible} Eligible Approved, ` +
        `${res.result.recordsRejected} Rejected, INR ${res.result.totalDisbursement.toLocaleString()} Disbursed ` +
        `(${res.result.returnCode} in ${res.result.durationMs}ms)`
      );
      setTimeout(() => setLiveExecutionMessage(null), 8000);
    } catch (err: any) {
      alert(`COBOL Batch Execution Error: ${err.message}`);
    } finally {
      setIsExecutingCobol(false);
    }
  };

  // Update Scholarship Scheme Configuration via REST API
  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    setConfig(newConfig);
    try {
      await api.updateScheme('MERIT1', {
        min_cgpa: newConfig.minCgpa,
        min_attendance: newConfig.minAttendance,
        max_family_income: newConfig.maxAnnualIncome,
        max_arrears: newConfig.maxArrears,
        slab_1_min_cgpa: newConfig.slabs[0]?.min_cgpa ?? 9.0,
        slab_1_max_cgpa: newConfig.slabs[0]?.max_cgpa ?? 10.0,
        slab_1_amount: newConfig.slabs[0]?.amount ?? 20000.0,
        slab_2_min_cgpa: newConfig.slabs[1]?.min_cgpa ?? 8.0,
        slab_2_max_cgpa: newConfig.slabs[1]?.max_cgpa ?? 8.99,
        slab_2_amount: newConfig.slabs[1]?.amount ?? 15000.0,
        slab_3_min_cgpa: newConfig.slabs[2]?.min_cgpa ?? 7.5,
        slab_3_max_cgpa: newConfig.slabs[2]?.max_cgpa ?? 7.99,
        slab_3_amount: newConfig.slabs[2]?.amount ?? 10000.0,
      });
      await loadBackendData();
    } catch (err: any) {
      console.warn('Failed to update scheme in PostgreSQL:', err.message);
    }
  };

  const handleJobSuccess = () => {
    loadBackendData();
  };

  const handleImportSuccess = (data: any) => {
    if (data.eligible && data.rejected) {
      setEligibilityResults([...data.eligible, ...data.rejected]);
    }
    if (data.disbursements) {
      setDisbursements(data.disbursements);
    }
    if (data.summary) {
      setSummary(data.summary);
    }
  };

  const isAdminOrOperator = session.role === 'ADMIN' || session.role === 'OPERATOR';

  // If unauthenticated, always render Login view
  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar
          session={session}
          onOpenBatchModal={() => {}}
          onOpenImportModal={() => {}}
          onLogout={handleLogout}
          isBackendLive={isBackendLive}
          onRetryConnection={loadBackendData}
          isConnecting={isConnecting}
        />
        {backendError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs font-mono text-red-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Backend connection error: {backendError} (Target: {API_BASE_URL || 'Same Origin'})</span>
            </div>
            <button
              onClick={loadBackendData}
              disabled={isConnecting}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}
        <LoginPage
          onLogin={handleLogin}
          onNavigate={(p) => setActivePage(p)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        session={session}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onLogout={handleLogout}
        isBackendLive={isBackendLive}
        onExecuteLiveCobol={handleExecuteLiveCobol}
        isExecutingCobol={isExecutingCobol}
        onRetryConnection={loadBackendData}
        isConnecting={isConnecting}
      />

      {/* Backend Connection Status Banner when Disconnected */}
      {!isBackendLive && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs font-mono text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Backend disconnected: Unable to reach REST API at <strong className="text-slate-900">{API_BASE_URL || window.location.origin}</strong>.
              {backendError ? ` (${backendError})` : ''}
            </span>
          </div>
          <button
            onClick={loadBackendData}
            disabled={isConnecting}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>{isConnecting ? 'Connecting...' : 'Retry Connection'}</span>
          </button>
        </div>
      )}

      {/* Live Notification Banner */}
      {liveExecutionMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-mono text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{liveExecutionMessage}</span>
          </div>
          <button
            onClick={() => setLiveExecutionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(p) => setActivePage(p)}
          badgeCounts={{
            students: students.length,
            applications: applications.length,
            eligible: eligibilityResults.filter(r => r.status === 'E').length,
            disbursements: disbursements.length
          }}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activePage === 'dashboard' && (
            <DashboardOverviewPage
              summary={summary}
              eligibilityResults={eligibilityResults}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onNavigate={(p) => setActivePage(p)}
            />
          )}

          {activePage === 'students' && (
            <StudentRecordsPage
              students={students}
              onRefresh={loadBackendData}
              isAdminOrOperator={isAdminOrOperator}
            />
          )}

          {activePage === 'applications' && (
            <ScholarshipApplicationsPage
              applications={applications}
              onRefresh={loadBackendData}
              isAdminOrOperator={isAdminOrOperator}
            />
          )}

          {activePage === 'eligibility' && (
            <EligibilityResultsPage results={eligibilityResults} />
          )}

          {activePage === 'disbursements' && (
            <DisbursementManagementPage
              disbursements={disbursements}
              onUpdateDisbursements={(updated) => setDisbursements(updated)}
              onRefresh={loadBackendData}
            />
          )}

          {activePage === 'batch-history' && (
            <BatchProcessingHistoryPage
              jobExecutions={jobExecutions}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
            />
          )}

          {activePage === 'reports' && (
            <ReportsAnalyticsPage eligibilityResults={eligibilityResults} />
          )}

          {activePage === 'config' && (
            <SystemConfigurationPage
              config={config}
              onUpdateConfig={handleUpdateConfig}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <JclBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onJobSuccess={handleJobSuccess}
      />

      <MainframeReportImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default App;
