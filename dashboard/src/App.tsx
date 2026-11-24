import React, { useState } from 'react';
import { PageType, UserSession, Student, Application, EligibilityResult, DisbursementRecord, ExceptionRecord, BatchSummary, SystemConfig, JclJobExecution } from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_APPLICATIONS, 
  INITIAL_ELIGIBILITY_RESULTS, 
  INITIAL_DISBURSEMENTS, 
  INITIAL_EXCEPTIONS, 
  INITIAL_SUMMARY, 
  INITIAL_CONFIG, 
  INITIAL_JOB_EXECUTIONS 
} from './data/initialData';

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

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [session, setSession] = useState<UserSession>({
    username: 'Mainframe Batch Operator',
    role: 'OPERATOR',
    isAuthenticated: true,
    zosUserId: 'OPER01'
  });

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>(INITIAL_ELIGIBILITY_RESULTS);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(INITIAL_DISBURSEMENTS);
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>(INITIAL_EXCEPTIONS);
  const [summary, setSummary] = useState<BatchSummary>(INITIAL_SUMMARY);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [jobExecutions, setJobExecutions] = useState<JclJobExecution[]>(INITIAL_JOB_EXECUTIONS);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Re-evaluate eligibility when config changes
  const handleUpdateConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);

    const reEvaluated: EligibilityResult[] = applications.map(app => {
      const student = students.find(s => s.stu_id === app.stu_id);
      const isDup = app.is_duplicate || app.status === 'DUPLICATE';

      if (isDup) {
        return {
          app_id: app.app_id,
          stu_id: app.stu_id,
          stu_name: student?.name || 'STUDENT',
          dept: student?.dept,
          sch_code: app.sch_code,
          cgpa: app.cgpa,
          attendance: app.attendance,
          income: app.income,
          arrears: app.arrears,
          status: 'D',
          reason_code: 'REJ-DUPAPP',
          reason_desc: 'Duplicate Application in batch feed',
          award: 0,
          batch_id: summary.batch_id
        };
      }

      if (app.status === 'INVALID' || !app.bank_ifsc || app.cgpa > 10 || app.attendance > 100) {
        return {
          app_id: app.app_id,
          stu_id: app.stu_id,
          stu_name: student?.name || 'STUDENT',
          dept: student?.dept,
          sch_code: app.sch_code,
          cgpa: app.cgpa,
          attendance: app.attendance,
          income: app.income,
          arrears: app.arrears,
          status: 'I',
          reason_code: 'REJ-INVDAT',
          reason_desc: 'Data validation violation in STU1001',
          award: 0,
          batch_id: summary.batch_id
        };
      }

      const passCgpa = app.cgpa >= newConfig.minCgpa;
      const passAttn = app.attendance >= newConfig.minAttendance;
      const passIncome = app.income <= newConfig.maxAnnualIncome;
      const passArrears = app.arrears <= newConfig.maxArrears;

      if (passCgpa && passAttn && passIncome && passArrears) {
        let award = 0;
        for (const slab of newConfig.slabs) {
          if (app.cgpa >= slab.min_cgpa && app.cgpa <= slab.max_cgpa) {
            award = slab.amount;
            break;
          }
        }
        return {
          app_id: app.app_id,
          stu_id: app.stu_id,
          stu_name: student?.name || 'STUDENT',
          dept: student?.dept,
          sch_code: app.sch_code,
          cgpa: app.cgpa,
          attendance: app.attendance,
          income: app.income,
          arrears: app.arrears,
          status: 'E',
          reason_code: 'NONE      ',
          reason_desc: 'Meets dynamic eligibility rules',
          award,
          bank_ac_num: app.bank_ac_num,
          bank_ifsc: app.bank_ifsc,
          batch_id: summary.batch_id
        };
      } else {
        let reason_code = 'REJ-CGPA  ';
        let reason_desc = 'CGPA below configured threshold';
        const failCount = (!passCgpa ? 1 : 0) + (!passAttn ? 1 : 0) + (!passIncome ? 1 : 0) + (!passArrears ? 1 : 0);
        if (failCount > 1) {
          reason_code = 'REJ-MULTPL';
          reason_desc = 'Multiple criteria failed';
        } else if (!passAttn) {
          reason_code = 'REJ-ATTN  ';
          reason_desc = 'Attendance below threshold';
        } else if (!passIncome) {
          reason_code = 'REJ-INCOME';
          reason_desc = 'Annual income exceeds ceiling';
        } else if (!passArrears) {
          reason_code = 'REJ-ARREAR';
          reason_desc = 'Active arrears present';
        }

        return {
          app_id: app.app_id,
          stu_id: app.stu_id,
          stu_name: student?.name || 'STUDENT',
          dept: student?.dept,
          sch_code: app.sch_code,
          cgpa: app.cgpa,
          attendance: app.attendance,
          income: app.income,
          arrears: app.arrears,
          status: 'R',
          reason_code,
          reason_desc,
          award: 0,
          batch_id: summary.batch_id
        };
      }
    });

    setEligibilityResults(reEvaluated);

    const eligibleCount = reEvaluated.filter(r => r.status === 'E').length;
    const totalAward = reEvaluated.filter(r => r.status === 'E').reduce((acc, r) => acc + r.award, 0);

    setSummary(prev => ({
      ...prev,
      eligible_count: eligibleCount,
      rejected_count: reEvaluated.length - eligibleCount,
      total_disbursement_inr: totalAward
    }));
  };

  const handleJobSuccess = () => {
    // Generate new execution log
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const newJob: JclJobExecution = {
      jobId: `JOB0${Math.floor(1000 + Math.random() * 9000)}`,
      jobName: 'BATELG01',
      submitTime: now.toISOString().slice(0, 10) + ' ' + timeStr,
      completionTime: now.toISOString().slice(0, 10) + ' ' + timeStr,
      returnCode: 'RC 0000',
      status: 'COMPLETED',
      steps: [
        { stepName: 'CLEAN01', program: 'IEFBR14', rc: '0000', description: 'Purge previous execution datasets' },
        { stepName: 'SRTSTEP', program: 'SORT', rc: '0000', description: 'DFSORT Application record sequencing' },
        { stepName: 'RUNMAIN', program: 'MAIN0001', rc: '0000', description: 'COBOL Batch Orchestration Engine' },
        { stepName: 'AUDITDB2', program: 'IKJEFT01', rc: '0000', description: 'Db2 persistence & commit' }
      ],
      sysoutLog: [
        `//BATELG01 JOB (SCHOLAR,BAT),CLASS=A,MSGCLASS=X,NOTIFY=${session.zosUserId}`,
        `$HASP373 BATELG01 STARTED - INIT 1 - CLASS A - SYS ZOS1`,
        `IEF403I BATELG01 - STARTED - TIME=${timeStr}`,
        `IEF142I BATELG01 CLEAN01 - STEP WAS EXECUTED - COND CODE 0000`,
        `IEF142I BATELG01 SRTSTEP - STEP WAS EXECUTED - COND CODE 0000`,
        `MAIN0001: SMART SCHOLARSHIP BATCH ENGINE EXECUTED`,
        `MAIN0001: 5 CANDIDATES APPROVED | 10 REJECTED | 2 DUPLICATES INTERCEPTED`,
        `MAIN0001: TOTAL DISBURSED: INR 75,000.00`,
        `IEF142I BATELG01 RUNMAIN - STEP WAS EXECUTED - COND CODE 0000`,
        `IEF142I BATELG01 AUDITDB2 - STEP WAS EXECUTED - COND CODE 0000`,
        `$HASP395 BATELG01 ENDED - RC=0000`
      ]
    };
    setJobExecutions([newJob, ...jobExecutions]);
  };

  const handleImportSuccess = (data: any) => {
    if (data.eligible && data.rejected) {
      setEligibilityResults([...data.eligible, ...data.rejected]);
    } else if (data.eligible) {
      setEligibilityResults(prev => [...data.eligible, ...prev.filter(r => r.status !== 'E')]);
    } else if (data.rejected) {
      setEligibilityResults(prev => [...prev.filter(r => r.status === 'E'), ...data.rejected]);
    }
    if (data.disbursements) {
      setDisbursements(data.disbursements);
    }
    if (data.students) {
      setStudents(data.students);
    }
    if (data.summary) {
      setSummary(data.summary);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        session={session}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onLogout={() => {
          setActivePage('login');
        }}
      />

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
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activePage === 'login' && (
            <LoginPage
              onLogin={(s) => setSession(s)}
              onNavigate={(p) => setActivePage(p)}
            />
          )}

          {activePage === 'dashboard' && (
            <DashboardOverviewPage
              summary={summary}
              eligibilityResults={eligibilityResults}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onNavigate={(p) => setActivePage(p)}
            />
          )}

          {activePage === 'students' && (
            <StudentRecordsPage students={students} />
          )}

          {activePage === 'applications' && (
            <ScholarshipApplicationsPage applications={applications} />
          )}

          {activePage === 'eligibility' && (
            <EligibilityResultsPage results={eligibilityResults} />
          )}

          {activePage === 'disbursements' && (
            <DisbursementManagementPage
              disbursements={disbursements}
              onUpdateDisbursements={(updated) => setDisbursements(updated)}
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
