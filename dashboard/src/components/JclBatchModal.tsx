import React, { useState, useEffect } from 'react';
import { X, Play, Terminal, CheckCircle2, AlertTriangle, Layers, Clock, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/60 rounded text-emerald-400 border border-emerald-800">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>IBM z/OS JES2 JCL Batch Job Runner</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                  SUBSYSTEM: DSN1
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time JCL job submission, step execution, and SYSOUT spool inspection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Job Selection Tabs */}
          <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
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
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  //{job} JOB
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-slate-400 pr-2">
              CLASS=A • MSGCLASS=X
            </div>
          </div>

          {/* Job Steps Progress Diagram */}
          <div className="bg-slate-950/60 p-3 rounded border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-ibm-cyan" />
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
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : isCurrent
                        ? 'bg-ibm-blue/20 border-ibm-blue text-white shadow animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{st.step}</span>
                      <span>{isPast ? 'RC 0000' : isCurrent ? 'BUSY' : 'WAIT'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {st.pgm}: {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SYSOUT Terminal Window */}
          <div className="bg-black rounded-lg border border-slate-800 p-3.5 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-900 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                JES2 SPOOL / SYSOUT LOG
              </span>
              <span>JOBID: JOB04822</span>
            </div>
            <div className="min-h-52 max-h-64 overflow-y-auto space-y-1 text-slate-300 text-[11px] leading-relaxed">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-10 text-center">
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
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            Close Terminal
          </button>
          <div className="flex items-center gap-3">
            {status === 'COMPLETED' && (
              <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                RETURN CODE: 0000
              </span>
            )}
            <button
              type="button"
              onClick={runBatchSimulation}
              disabled={status === 'RUNNING'}
              className={`text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-all ${
                status === 'RUNNING'
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow active:scale-95'
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
