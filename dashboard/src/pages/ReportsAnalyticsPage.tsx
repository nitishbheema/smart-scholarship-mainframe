import React, { useState } from 'react';
import { FileText, Download, Printer, Eye, BarChart3, ScatterChart as ScatterIcon, Layers } from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { EligibilityResult } from '../types';

interface ReportsAnalyticsPageProps {
  eligibilityResults: EligibilityResult[];
}

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({
  eligibilityResults
}) => {
  const [selectedReport, setSelectedReport] = useState<'ELIGIBLE' | 'REJECTED' | 'AUDIT' | 'EXCEPTIONS' | 'DISB_DAT'>('ELIGIBLE');
  const [themeMode, setThemeMode] = useState<'GREENBAR' | 'TERMINAL'>('GREENBAR');

  // Hardcoded real samples matching COBOL RPT5001 format
  const reportsContent = {
    ELIGIBLE: `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
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
 ====================================================================================================================================`,

    REJECTED: `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
 REPORT:   REJECTED CANDIDATES AUDIT ROSTER               BATCH ID: BAT2024101    DATE: 2024-10-15   PAGE:   1                       
0------------------------------------------------------------------------------------------------------------------------------------
 APP ID     STU ID     NAME                           SCHEME   CGPA   ATTN%   FAMILY INCOME  ARRS  REASON CODE REJECTION REASON      
 ------------------------------------------------------------------------------------------------------------------------------------
 APP2024004 STU2024004 Ananya Iyer                    MERIT1   6.80   85.00%     150,000.00    0   REJ-CGPA    CGPA BELOW 7.50 THRESHOLD     
 APP2024005 STU2024005 Vikram Rao                     MERIT1   8.40   68.50%     175,000.00    0   REJ-ATTN    ATTENDANCE BELOW 75% MINIMUM  
 APP2024006 STU2024006 Priya Nair                     MERIT1   8.90   91.00%     360,000.00    0   REJ-INCOME  INCOME EXCEEDS RS 2,50,000    
 APP2024007 STU2024007 Karthik Reddy                  MERIT1   8.20   84.00%     160,000.00    2   REJ-ARREAR  ACTIVE ARREARS PRESENT        
 APP2024008 STU2024001 Aarav Sharma                   MERIT1   9.45   88.50%     180,000.00    0   REJ-DUPAPP  STUDENT ALREADY APPLIED FOR SCHOLARSHIP
 APP2024002 STU2024008 Sneha Kulkarni                 MERIT1   9.10   89.00%     140,000.00    0   REJ-DUPAPP  DUPLICATE APPLICATION ID DETECTED IN BATCH
 APP2024010 STU2024009 Aditya Mishra                  MERIT1   8.15   81.00%     200,000.00    0   REJ-INVDAT  BANK IFSC CODE IS MANDATORY   
 APP2024011 STU2024010 Meera Menon                    MERIT1  11.50   88.00%     170,000.00    0   REJ-INVDAT  CGPA OUT OF VALID RANGE 0.00-10.00
 APP2024012 STU2024011 Arjun Gupta                    MERIT1   8.70  105.00%     190,000.00    0   REJ-INVDAT  ATTENDANCE OUT OF RANGE 0-100%
 APP2024013 STU2024012 Pooja Hegde                    MERIT1   6.50   62.00%     400,000.00    1   REJ-MULTPL  MULTIPLE CRITERIA FAILED      
0====================================================================================================================================
 TOTAL REJECTED APPLICATIONS:   10                                                                                                   
 ====================================================================================================================================`,

    AUDIT: `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
 REPORT:   BATCH RECONCILIATION AUDIT LEDGER              BATCH ID: BAT2024101    DATE: 2024-10-15   PAGE:   1                       
0====================================================================================================================================
 MAINFRAME BATCH EXECUTION SUMMARY & INTEGRITY CHECK:
 ------------------------------------------------------------------------------------------------------------------------------------
   TOTAL APPLICATION RECORDS READ (INP):                  15
   TOTAL RECORDS PASSING SYNTACTIC VALIDATION:            12
   TOTAL APPLICATIONS APPROVED AS ELIGIBLE:                5
   TOTAL APPLICATIONS REJECTED / DISQUALIFIED:            10
   TOTAL DUPLICATE SUBMISSIONS INTERCEPTED:                2
   TOTAL FINANCIAL COMMITMENT DISBURSED (INR):    Rs.     75,000.00
 ------------------------------------------------------------------------------------------------------------------------------------
 SUBSYSTEM STATUS:
   VSAM KSDS CLUSTER ACCESS (STUMAST):            STATUS CODE 00 (SUCCESS)
   IBM Db2 SUBSYSTEM COMMIT:                      SQLCODE +000 (NORMAL COMMIT)
   DISBURSEMENT PAYMENT ADVICE FILE:              STATUS CLOSED (CHECKSUM BALANCED)
   FINAL STEP HIGHEST RETURN CODE:                RC 0000
0====================================================================================================================================`,

    EXCEPTIONS: `1*********************************** STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM ********************************************
 REPORT:   BATCH EXCEPTION AND INTERCEPTION AUDIT         BATCH ID: BAT2024101    DATE: 2024-10-15   PAGE:   1                       
0------------------------------------------------------------------------------------------------------------------------------------
 REC NUM   APP ID     STU ID     ERROR CODE  SEV  EXCEPTION MESSAGE                                                
 ------------------------------------------------------------------------------------------------------------------------------------
 8         APP2024008 STU2024001 ERR-DUPL    W    Student already applied for scholarship in same batch            
 9         APP2024002 STU2024008 ERR-DUPL    W    Duplicate Application ID detected in batch stream                
 10        APP2024010 STU2024009 ERR-VALD    E    Bank IFSC code is mandatory and was missing                      
 11        APP2024011 STU2024010 ERR-VALD    E    CGPA out of valid range 0.00-10.00 (Found: 11.50)                
 12        APP2024012 STU2024011 ERR-VALD    E    Attendance out of range 0-100% (Found: 105.00%)                  
0====================================================================================================================================
 TOTAL EXCEPTION RECORDS LOGGED: 5                                                                                                   `,

    DISB_DAT: `HBAT202410120241015000005000007500000                                                                                   
DDSB2024000001APP2024001STU20240010020000009182374619283746  SBIN0001234S20241015UTR202410150001INBAT2024101               
DDSB2024000002APP2024002STU20240020015000009182374619283747  HDFC0002345S20241015UTR202410150002INBAT2024101               
DDSB2024000003APP2024003STU20240030010000009182374619283748  ICIC0003456S20241015UTR202410150003INBAT2024101               
DDSB2024000004APP2024014STU20240130010000009182374619283758  CORP0003456P20241015UTR202410150004INBAT2024101               
DDSB2024000005APP2024015STU20240140020000009182374619283759  AXIS0004567P20241015UTR202410150005INBAT2024101               
TBAT2024101000005000007500000HASH982736451000                                                           `
  };

  const handleDownload = () => {
    const text = reportsContent[selectedReport];
    const ext = selectedReport === 'DISB_DAT' ? 'dat' : 'txt';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedReport}_REPORT_BAT2024101.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scatter plot data: CGPA vs Income
  const scatterData = eligibilityResults.map(r => ({
    cgpa: r.cgpa,
    income: r.income / 1000,
    status: r.status,
    name: r.stu_name,
    award: r.award
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              MAINFRAME SYSOUT MODULE: RPT5001
            </span>
            <span className="text-xs text-slate-400 font-mono">
              132-COLUMN FIXED RECORD LENGTH (RECFM=FBA, LRECL=133)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Official Mainframe Reports & Business Analytics
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Renders actual Enterprise COBOL ANSI carriage-control SYSOUT print files and data distributions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setThemeMode(m => m === 'GREENBAR' ? 'TERMINAL' : 'GREENBAR')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Theme: {themeMode}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-ibm-blue hover:bg-ibm-darkblue text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'ELIGIBLE', label: 'Eligible Students (Roster)' },
          { id: 'REJECTED', label: 'Rejected Applications (Audit)' },
          { id: 'AUDIT', label: 'Batch Reconciliation Ledger' },
          { id: 'EXCEPTIONS', label: 'Exceptions & Interceptions' },
          { id: 'DISB_DAT', label: 'Electronic Payment File (.dat)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-colors ${
              selectedReport === tab.id
                ? 'bg-ibm-blue text-white shadow-sm font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Terminal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-ibm-cyan" />
            <span>SYSOUT ARCHIVE: USERID.SCHOLAR.REPORT.{selectedReport}</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">
            ANSI CARRIAGE CONTROL [CC: 1=PAGE, 0=DBL, ' '=SGL]
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <pre
            className={`font-mono text-xs p-6 rounded-lg leading-relaxed shadow-inner overflow-x-auto ${
              themeMode === 'GREENBAR'
                ? 'bg-[#0f241a] text-[#84fab0] border border-[#1b4332]'
                : 'bg-black text-emerald-400 border border-slate-800'
            }`}
            style={{
              fontFamily: '"IBM Plex Mono", Courier, monospace',
              whiteSpace: 'pre',
              minWidth: '1000px'
            }}
          >
            {reportsContent[selectedReport]}
          </pre>
        </div>
      </div>

      {/* Analytical Visualizations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-ibm-blue" />
            <span>Applicant Criteria Scatter Distribution (CGPA vs Annual Family Income)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Eligibility Cutoff: CGPA &ge; 7.50, Income &le; ₹2.5L
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="cgpa" 
                name="CGPA" 
                domain={[5.0, 10.0]} 
                stroke="#64748b" 
                fontSize={11}
                label={{ value: 'CGPA', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="income" 
                name="Income (k INR)" 
                stroke="#64748b" 
                fontSize={11}
                label={{ value: 'Family Income (₹ in Thousands)', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', borderRadius: '6px' }}
                formatter={(val: any, name: any) => [name === 'Income (k INR)' ? `₹${val}k` : val, name]}
              />
              <Scatter name="Eligible" data={scatterData.filter(d => d.status === 'E')} fill="#24a148" />
              <Scatter name="Rejected" data={scatterData.filter(d => d.status !== 'E')} fill="#da1e28" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
