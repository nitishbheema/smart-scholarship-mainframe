import React, { useState } from 'react';
import { X, Play, Terminal, CheckCircle2, Layers } from 'lucide-react';

interface JclBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobSuccess: () => void;
}

export const JclBatchModal: React.FC<JclBatchModalProps> = ({
  isOpen,
  onClose,
  onJobSuccess
}) => {
  const [selectedJob, setSelectedJob] = useState<'BATELG01' | 'IDCDEF01' | 'COMPCOB'>('BATELG01');
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETED'>('IDLE');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const stepsMap = {
    BATELG01: [
      { step: 'CLEAN01', pgm: 'IEFBR14', desc: 'Dataset Purge & SCRATCH' },
      { step: 'SRTSTEP', pgm: 'SORT', desc: 'DFSORT Application Sequencing' },
      { step: 'RUNMAIN', pgm: 'MAIN0001', desc: 'COBOL Batch Orchestration' },
      { step: 'AUDITDB2', pgm: 'IKJEFT01', desc: 'Db2 Commit & Audit Persist' }
    ],
    IDCDEF01: [
      { step: 'STEP010', pgm: 'IDCAMS', desc: 'DELETE & DEFINE KSDS CLUSTER' },
      { step: 'STEP020', pgm: 'IDCAMS', desc: 'REPRO Sequential to VSAM KSDS' },
      { step: 'STEP030', pgm: 'IDCAMS', desc: 'VERIFY & PRINT 10 Records' }
    ],
    COMPCOB: [
      { step: 'CMPSTU', pgm: 'IGYCRCTL', desc: 'Compile STU1001 Enterprise COBOL' },
      { step: 'CMPSCH', pgm: 'IGYCRCTL', desc: 'Compile SCH2001 Eligibility' },
      { step: 'CMPDUP', pgm: 'IGYCRCTL', desc: 'Compile DUP3001 Deduplication' },
      { step: 'CMPDIS', pgm: 'IGYCRCTL', desc: 'Compile DIS4001 Disbursement' },
      { step: 'CMPRPT', pgm: 'IGYCRCTL', desc: 'Compile RPT5001 Report Gen' },
      { step: 'CMPMAIN', pgm: 'IGYCRCTL', desc: 'Compile MAIN0001 Controller' },
      { step: 'LNKMAIN', pgm: 'IEWBLINK', desc: 'Link-edit into USERID.LOADLIB' }
    ]
  };

  const runBatchSimulation = () => {
    setStatus('RUNNING');
    setLogs([
      `//${selectedJob} JOB (SCHOLAR,BAT),CLASS=A,MSGCLASS=X,NOTIFY=ZOSBATCH`,
      `$HASP373 ${selectedJob} STARTED - INIT 1 - CLASS A - SYS ZOS1`,
      `IEF403I ${selectedJob} - STARTED - TIME=${new Date().toLocaleTimeString()}`
    ]);
    setCurrentStepIdx(0);

    const steps = stepsMap[selectedJob];
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setCurrentStepIdx(step);
        const prevStep = steps[step - 1];
        setLogs(prev => [
          ...prev,
          `IEF142I ${selectedJob} ${prevStep.step} - STEP WAS EXECUTED - COND CODE 0000`,
          `>>> Executing Step: ${steps[step].step} (PGM=${steps[step].pgm}) - ${steps[step].desc}`
        ]);
      } else {
        clearInterval(interval);
        setCurrentStepIdx(steps.length);
        const lastStep = steps[steps.length - 1];
        setLogs(prev => [
          ...prev,
          `IEF142I ${selectedJob} ${lastStep.step} - STEP WAS EXECUTED - COND CODE 0000`,
          `MAIN0001: PROCESSED 15 CANDIDATE APPLICATIONS SUCCESSFULLY`,
          `MAIN0001: 5 ELIGIBLE APPROVED | 10 REJECTED | 2 DUPLICATES INTERCEPTED`,
          `MAIN0001: TOTAL DISBURSED AMOUNT: INR 75,000.00`,
          `IEF404I ${selectedJob} - ENDED - TIME=${new Date().toLocaleTimeString()}`,
          `$HASP395 ${selectedJob} ENDED - HIGHEST COND CODE = 0000 (NORMAL COMPLETION)`
        ]);
        setStatus('COMPLETED');
        onJobSuccess();
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded text-emerald-700 border border-emerald-200">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>JES2 JCL Batch Job Simulator & Spool Emulator</span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                  LOCAL SIMULATOR MODE
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Simulated execution mirror for testing COBOL & JCL pipeline rules locally prior to z/OS submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Job Selection Tabs */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <div className="flex gap-1">
              {(['BATELG01', 'IDCDEF01', 'COMPCOB'] as const).map(job => (
                <button
                  key={job}
                  onClick={() => {
                    if (status !== 'RUNNING') {
                      setSelectedJob(job);
                      setStatus('IDLE');
                      setLogs([]);
                    }
                  }}
                  disabled={status === 'RUNNING'}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                    selectedJob === job
                      ? 'bg-ibm-blue text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  //{job} JOB
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-slate-500 pr-2">
              CLASS=A • MSGCLASS=X
            </div>
          </div>

          {/* Job Steps Progress Diagram */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-ibm-blue" />
              <span>Job Execution Pipeline Steps:</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stepsMap[selectedJob].map((st, i) => {
                const isPast = status === 'COMPLETED' || currentStepIdx > i;
                const isCurrent = status === 'RUNNING' && currentStepIdx === i;
                return (
                  <div
                    key={st.step}
                    className={`p-2 rounded border text-xs font-mono transition-all ${
                      isPast
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                        : isCurrent
                        ? 'bg-blue-50 border-ibm-blue text-ibm-blue font-bold shadow-sm animate-pulse'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{st.step}</span>
                      <span>{isPast ? 'RC 0000' : isCurrent ? 'BUSY' : 'WAIT'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {st.pgm}: {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SYSOUT Terminal Window */}
          <div className="bg-slate-950 rounded-lg border border-slate-800 p-3.5 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                JES2 SPOOL / SYSOUT LOG
              </span>
              <span>JOBID: JOB04822</span>
            </div>
            <div className="min-h-52 max-h-64 overflow-y-auto space-y-1 text-slate-300 text-[11px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic py-10 text-center">
                  Job queued in JES2 reader. Click "Submit JCL Job" to trigger batch execution.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`${
                      log.includes('COND CODE 0000') || log.includes('SUCCESS')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('JOB')
                        ? 'text-ibm-cyan'
                        : log.includes('MAIN0001:')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors font-medium"
          >
            Close Terminal
          </button>
          <div className="flex items-center gap-3">
            {status === 'COMPLETED' && (
              <span className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                RETURN CODE: 0000
              </span>
            )}
            <button
              type="button"
              onClick={runBatchSimulation}
              disabled={status === 'RUNNING'}
              className={`text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-all shadow-sm ${
                status === 'RUNNING'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{status === 'RUNNING' ? 'Submitting & Executing...' : `Submit //${selectedJob}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
