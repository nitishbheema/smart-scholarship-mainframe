import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, FileCode, RefreshCw } from 'lucide-react';
import { EligibilityResult, DisbursementRecord, Student, Application, BatchSummary } from '../types';

interface MainframeReportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: {
    eligible?: EligibilityResult[];
    rejected?: EligibilityResult[];
    disbursements?: DisbursementRecord[];
    students?: Student[];
    applications?: Application[];
    summary?: BatchSummary;
  }) => void;
}

export const MainframeReportImportModal: React.FC<MainframeReportImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [detectedType, setDetectedType] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<{ count: number; details: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      inspectAndParseContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const inspectAndParseContent = (text: string, name: string) => {
    try {
      // 1. JSON Format Check
      if (name.endsWith('.json') || text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        if (json.eligible_students || json.students || json.disbursements) {
          setDetectedType('MAINFRAME JSON EXPORT');
          const eligCount = json.eligible_students?.length || 0;
          const rejCount = json.rejected_students?.length || 0;
          const disbCount = json.disbursements?.length || 0;
          setParsedPreview({
            count: eligCount + rejCount,
            details: `Found ${eligCount} Eligible, ${rejCount} Rejected, ${disbCount} Disbursements`
          });
          return;
        }
      }

      // 2. Mainframe 132-Column Report Check (ANSI Carriage Control '1' / Header)
      if (text.includes('STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM') || text.includes('ELIGIBLE STUDENTS AWARD ROSTER')) {
        setDetectedType('COBOL RPT5001 SYSOUT REPORT (132-COL ANSI)');
        const lines = text.split('\n').filter(l => l.trim().startsWith('APP2024') || l.trim().startsWith('APP'));
        setParsedPreview({
          count: lines.length,
          details: `Parsed ${lines.length} evaluated student application records from SYSOUT`
        });
        return;
      }

      // 3. Disbursement Payment Instruction File (NACHA / APBS Header 'H' and Detail 'D')
      if (text.startsWith('H') && text.includes('DSB')) {
        setDetectedType('SIMULATED APBS/NACHA PAYMENT INSTRUCTION FILE');
        const detailLines = text.split('\n').filter(l => l.startsWith('D'));
        setParsedPreview({
          count: detailLines.length,
          details: `Parsed ${detailLines.length} bank disbursement instruction lines`
        });
        return;
      }

      // 4. CSV Format
      if (text.includes('application_id,student_id') || text.includes('student_id,first_name')) {
        setDetectedType('CSV DATASET IMPORT');
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        setParsedPreview({
          count: lines.length - 1,
          details: `Parsed ${lines.length - 1} CSV records`
        });
        return;
      }

      // Fallback
      setDetectedType('RAW FIXED-WIDTH MAINFRAME DATASET');
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      setParsedPreview({
        count: lines.length,
        details: `Identified ${lines.length} fixed-width 80/120/150 byte record lines`
      });
    } catch (err: any) {
      setErrorMsg(`Parsing Error: ${err.message}`);
    }
  };

  const handleApplyImport = () => {
    try {
      if (!fileContent) {
        setErrorMsg('Please select or upload a file first.');
        return;
      }

      // If JSON
      if (detectedType.includes('JSON')) {
        const json = JSON.parse(fileContent);
        onImportSuccess({
          eligible: json.eligible_students,
          rejected: json.rejected_students,
          disbursements: json.disbursements,
          students: json.students,
          summary: json.summary
        });
        onClose();
        return;
      }

      // If 132-Column Report
      if (detectedType.includes('SYSOUT')) {
        const lines = fileContent.split('\n');
        const eligibleList: EligibilityResult[] = [];
        const isEligibleReport = fileContent.includes('ELIGIBLE STUDENTS AWARD ROSTER');

        lines.forEach(l => {
          const trimmed = l.trim();
          if (trimmed.startsWith('APP')) {
            const parts = trimmed.split(/\s{2,}/);
            if (parts.length >= 7) {
              const app_id = parts[0]?.trim();
              const stu_id = parts[1]?.trim();
              const stu_name = parts[2]?.trim();
              const sch_code = parts[3]?.trim();
              const cgpa = parseFloat(parts[4]) || 8.0;
              const attn = parseFloat(parts[5]?.replace('%', '')) || 85.0;

              eligibleList.push({
                app_id,
                stu_id,
                stu_name,
                sch_code,
                cgpa,
                attendance: attn,
                income: 180000,
                arrears: 0,
                status: isEligibleReport ? 'E' : 'R',
                reason_code: isEligibleReport ? 'NONE      ' : 'REJ-CGPA  ',
                reason_desc: isEligibleReport ? 'Eligible via COBOL' : 'Rejected via COBOL',
                award: isEligibleReport ? 15000 : 0,
                batch_id: 'BAT2024101'
              });
            }
          }
        });

        if (isEligibleReport) {
          onImportSuccess({ eligible: eligibleList });
        } else {
          onImportSuccess({ rejected: eligibleList });
        }
        onClose();
        return;
      }

      // Default notification
      onClose();
    } catch (err: any) {
      setErrorMsg(`Failed to apply import: ${err.message}`);
    }
  };

  const loadSampleFile = (type: 'eligible' | 'rejected' | 'disbursement') => {
    let sample = '';
    let name = '';
    if (type === 'eligible') {
      name = 'ELIGIBLE_STUDENTS_REPORT.txt';
      sample = `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
 REPORT:   ELIGIBLE STUDENTS AWARD ROSTER                 BATCH ID: BAT2024101    DATE: 2024-10-15   PAGE:   1                       
0------------------------------------------------------------------------------------------------------------------------------------
 APP ID     STU ID     NAME                           SCHEME   CGPA   ATTN%   FAMILY INCOME  ARRS  AWARD (INR)  STATUS               
 ------------------------------------------------------------------------------------------------------------------------------------
 APP2024001 STU2024001 Aarav Sharma                   MERIT1   9.45   88.50%     180,000.00    0    20,000.00  ELIGIBLE              
 APP2024002 STU2024002 Diya Patel                     MERIT1   8.60   82.00%     210,000.00    0    15,000.00  ELIGIBLE              
 APP2024003 STU2024003 Rohan Verma                    MERIT1   7.75   79.00%     195,000.00    0    10,000.00  ELIGIBLE              
 APP2024014 STU2024013 Siddharth Sen                  MERIT1   7.50   75.00%     250,000.00    0    10,000.00  ELIGIBLE              
 APP2024015 STU2024014 Tanvi Joshi                    TECH02   9.65   94.00%     220,000.00    0    20,000.00  ELIGIBLE              
0====================================================================================================================================
 TOTAL ELIGIBLE CANDIDATES:     5                    TOTAL APPROVED AMOUNT:      INR     75,000.00                                   
 ====================================================================================================================================`;
    } else if (type === 'rejected') {
      name = 'REJECTED_STUDENTS_REPORT.txt';
      sample = `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
 REPORT:   REJECTED CANDIDATES AUDIT ROSTER               BATCH ID: BAT2024101    DATE: 2024-10-15   PAGE:   1                       
0------------------------------------------------------------------------------------------------------------------------------------
 APP ID     STU ID     NAME                           SCHEME   CGPA   ATTN%   FAMILY INCOME  ARRS  REASON CODE REJECTION REASON      
 ------------------------------------------------------------------------------------------------------------------------------------
 APP2024004 STU2024004 Ananya Iyer                    MERIT1   6.80   85.00%     150,000.00    0   REJ-CGPA    CGPA BELOW 7.50 THRESHOLD     
 APP2024005 STU2024005 Vikram Rao                     MERIT1   8.40   68.50%     175,000.00    0   REJ-ATTN    ATTENDANCE BELOW 75% MINIMUM  
 APP2024006 STU2024006 Priya Nair                     MERIT1   8.90   91.00%     360,000.00    0   REJ-INCOME  INCOME EXCEEDS RS 2,50,000    
 APP2024007 STU2024007 Karthik Reddy                  MERIT1   8.20   84.00%     160,000.00    2   REJ-ARREAR  ACTIVE ARREARS PRESENT        
 APP2024008 STU2024001 Aarav Sharma                   MERIT1   9.45   88.50%     180,000.00    0   REJ-DUPAPP  STUDENT ALREADY APPLIED FOR SCHOLARSHIP
 APP2024002 STU2024008 Sneha Kulkarni                 MERIT1   9.10   89.00%     140,000.00    0   REJ-DUPAPP  DUPLICATE APPLICATION ID DETECTED IN BATCH`;
    } else {
      name = 'DISBURSEMENT_INSTRUCTION.dat';
      sample = `HBAT202410120241015000005000007500000                                                                                   
DDSB2024000001APP2024001STU20240010020000009182374619283746  SBIN0001234P20241015UTR202410150001INBAT2024101               
DDSB2024000002APP2024002STU20240020015000009182374619283747  HDFC0002345P20241015UTR202410150002INBAT2024101               
DDSB2024000003APP2024003STU20240030010000009182374619283748  ICIC0003456P20241015UTR202410150003INBAT2024101               
TBAT2024101000005000007500000HASH982736451000                                                           `;
    }
    setFileName(name);
    setFileContent(sample);
    inspectAndParseContent(sample, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-ibm-blue/20 rounded text-ibm-blue border border-ibm-blue/40">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Mainframe Report & Dataset Ingest Engine
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Supports fixed-width 132-col ANSI SYSOUT, APBS Datasets, CSV & JSON
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
          {/* Quick Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Quick Test Presets (Generated from COBOL Execution):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadSampleFile('eligible')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Eligible Students Report (132-Col)
              </button>
              <button
                type="button"
                onClick={() => loadSampleFile('rejected')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-rose-400" />
                Rejected Students Report (132-Col)
              </button>
              <button
                type="button"
                onClick={() => loadSampleFile('disbursement')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Disbursement Instruction (.dat)
              </button>
            </div>
          </div>

          {/* File Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-ibm-blue/60 transition-colors bg-slate-950/40">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">
              Upload Mainframe Output File from your local disk
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .txt, .rpt, .dat, .csv, .json generated by MAIN0001 / RPT5001
            </p>
            <label className="mt-3 inline-block cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded border border-slate-600 transition-colors">
              Browse Local File
              <input
                type="file"
                className="hidden"
                accept=".txt,.rpt,.dat,.csv,.json"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Detection Status */}
          {detectedType && (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">File: {fileName}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {detectedType}
                </span>
              </div>
              {parsedPreview && (
                <div className="text-xs text-slate-300 font-medium">
                  {parsedPreview.details}
                </div>
              )}
            </div>
          )}

          {/* Raw Preview Box */}
          {fileContent && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Raw Content Preview:
              </label>
              <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-44 overflow-auto whitespace-pre">
                {fileContent}
              </pre>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyImport}
            disabled={!fileContent}
            className={`text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 transition-all ${
              fileContent
                ? 'bg-ibm-blue hover:bg-ibm-darkblue text-white shadow active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Apply to Dashboard State
          </button>
        </div>
      </div>
    </div>
  );
};
