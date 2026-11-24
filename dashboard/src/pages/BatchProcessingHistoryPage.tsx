import React, { useState } from 'react';
import { History, Play, Terminal, CheckCircle2, ChevronRight, FileText, Layers, Clock } from 'lucide-react';
import { JclJobExecution } from '../types';

interface BatchProcessingHistoryPageProps {
  jobExecutions: JclJobExecution[];
  onOpenBatchModal: () => void;
}

export const BatchProcessingHistoryPage: React.FC<BatchProcessingHistoryPageProps> = ({
  jobExecutions,
  onOpenBatchModal
}) => {
  const [selectedJob, setSelectedJob] = useState<JclJobExecution>(jobExecutions[0]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              JES2 SPOOL EMULATOR (LOCAL TESTBED)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              TARGET z/OS LPAR: USERID.SCHOLAR.* • CLASS=A MSGCLASS=X
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Batch Processing Execution History & JCL Ledger
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Audit history of batch jobs executed locally and prepared for IBM z/OS JES2 reader with step return codes
          </p>
        </div>

        <button
          onClick={onOpenBatchModal}
          className="flex items-center gap-2 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Submit JCL Batch</span>
        </button>
      </div>

      {/* Main Layout: Job List on Left, Spool Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Ledger */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider px-1">
            JES2 Job Queue
          </div>
          <div className="space-y-2">
            {jobExecutions.map((job) => {
              const isSelected = selectedJob.jobId === job.jobId;
              return (
                <div
                  key={job.jobId}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-ibm-blue shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200 font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-ibm-blue" />
                      //{job.jobName} ({job.jobId})
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {job.returnCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {job.submitTime}
                    </span>
                    <span className="text-slate-500">
                      {job.steps.length} Steps
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Spool & Step Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm font-mono flex items-center gap-2">
                  <span>Job Execution Card: //{selectedJob.jobName}</span>
                  <span className="text-slate-500 font-normal">({selectedJob.jobId})</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Started: {selectedJob.submitTime} • Ended: {selectedJob.completionTime}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800">
                HIGHEST {selectedJob.returnCode}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2">Step Name</th>
                    <th className="py-2 px-2">Program (PGM)</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 text-right">Return Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {selectedJob.steps.map((st) => (
                    <tr key={st.stepName} className="hover:bg-slate-800/30">
                      <td className="py-2 px-2 font-bold text-ibm-cyan">
                        {st.stepName}
                      </td>
                      <td className="py-2 px-2 text-slate-300">
                        {st.program}
                      </td>
                      <td className="py-2 px-2 text-slate-400">
                        {st.description}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-emerald-400">
                        RC {st.rc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYSOUT Terminal Spool */}
          <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-inner font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                JES2 SPOOL / SYSOUT DATASET INSPECTION
              </span>
              <span className="text-slate-500">DDNAME: SYSOUT</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 text-slate-300 text-[11px] leading-relaxed p-1">
              {selectedJob.sysoutLog.map((line, idx) => (
                <div
                  key={idx}
                  className={`${
                    line.includes('COND CODE 0000') || line.includes('SUCCESS')
                      ? 'text-emerald-400 font-semibold'
                      : line.includes('JOB')
                      ? 'text-ibm-cyan'
                      : line.includes('MAIN0001:')
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
