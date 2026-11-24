import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Cpu, Database, CheckCircle2, Shield, Sliders } from 'lucide-react';
import { SystemConfig } from '../types';

interface SystemConfigurationPageProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

export const SystemConfigurationPage: React.FC<SystemConfigurationPageProps> = ({
  config,
  onUpdateConfig
}) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const updateSlab = (index: number, field: string, val: any) => {
    const updatedSlabs = [...formData.slabs];
    updatedSlabs[index] = {
      ...updatedSlabs[index],
      [field]: val
    };
    setFormData({ ...formData, slabs: updatedSlabs });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold">
              MAINFRAME PARMLIB: USERID.SCHOLAR.COPYLIB(WSCONST)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              DYNAMIC RULES ENGINE CONFIGURATION
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            System Configuration & Scholarship Business Rules
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Decoupled business criteria: update thresholds and amount slabs without modifying COBOL source code
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Parameters updated in Mainframe Working-Storage</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module 1: Eligibility Thresholds */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-ibm-blue" />
            <h3 className="font-bold text-slate-100 text-sm">
              Eligibility Threshold Parameters (Module 2 Engine)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Minimum CGPA (CFG-MIN-CGPA)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="10"
                value={formData.minCgpa}
                onChange={(e) => setFormData({ ...formData, minCgpa: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-ibm-blue font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Format: 9(02)V99 (e.g. 7.50)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Min Attendance % (CFG-MIN-ATTN)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.minAttendance}
                onChange={(e) => setFormData({ ...formData, minAttendance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-ibm-blue font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Format: 9(03)V99 (e.g. 75.00%)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Max Income INR (CFG-MAX-INCOME)
              </label>
              <input
                type="number"
                step="10000"
                min="0"
                value={formData.maxAnnualIncome}
                onChange={(e) => setFormData({ ...formData, maxAnnualIncome: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-ibm-blue font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Annual family ceiling</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Max Arrears (CFG-MAX-ARREARS)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.maxArrears}
                onChange={(e) => setFormData({ ...formData, maxArrears: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-ibm-blue font-bold"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono">Strict clearance limit</span>
            </div>
          </div>
        </div>

        {/* Module 2: Amount Slabs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Configurable Award Slabs Table (CFG-SLAB-TABLE OCCURS 3)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Indexed by SLAB-IDX</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {formData.slabs.map((slab, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px]">Tier Description:</span>
                  <input
                    type="text"
                    value={slab.tier}
                    onChange={(e) => updateSlab(idx, 'tier', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-ibm-blue"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px]">Min CGPA:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={slab.min_cgpa}
                    onChange={(e) => updateSlab(idx, 'min_cgpa', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-ibm-blue"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px]">Max CGPA:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={slab.max_cgpa}
                    onChange={(e) => updateSlab(idx, 'max_cgpa', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none focus:border-ibm-blue"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px]">Award Amount (INR):</span>
                  <input
                    type="number"
                    step="1000"
                    value={slab.amount}
                    onChange={(e) => updateSlab(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-indigo-400 font-bold focus:outline-none focus:border-ibm-blue"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 3: Mainframe Environment Subsystems */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-ibm-cyan" />
            <h3 className="font-bold text-slate-100 text-sm">
              IBM z/OS Environment Connectivity & Dataset PDS Catalog
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">Db2 Subsystem ID</label>
              <input
                type="text"
                value={formData.zosSubsystem}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">VSAM KSDS Dataset Name</label>
              <input
                type="text"
                value={formData.vsamDatasetName}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-bold truncate"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">Db2 Package / Plan Name</label>
              <input
                type="text"
                value={formData.db2PlanName}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration & Re-sync Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
};
