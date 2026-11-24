import { Student, Application, EligibilityResult, DisbursementRecord, ExceptionRecord, BatchSummary, SystemConfig, JclJobExecution } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  { stu_id: 'STU2024001', name: 'Aarav Sharma', dob: '2004-03-15', gender: 'M', dept: 'CS  ', year: '3', sem: '05', email: 'aarav.sharma@univ.edu', phone: '9876543210', enroll_date: '2022-08-01', status: 'A' },
  { stu_id: 'STU2024002', name: 'Diya Patel', dob: '2003-11-20', gender: 'F', dept: 'IT  ', year: '4', sem: '07', email: 'diya.patel@univ.edu', phone: '9876543211', enroll_date: '2021-08-01', status: 'A' },
  { stu_id: 'STU2024003', name: 'Rohan Verma', dob: '2004-07-09', gender: 'M', dept: 'ECE ', year: '2', sem: '03', email: 'rohan.verma@univ.edu', phone: '9876543212', enroll_date: '2023-08-01', status: 'A' },
  { stu_id: 'STU2024004', name: 'Ananya Iyer', dob: '2004-01-25', gender: 'F', dept: 'CS  ', year: '3', sem: '05', email: 'ananya.iyer@univ.edu', phone: '9876543213', enroll_date: '2022-08-01', status: 'A' },
  { stu_id: 'STU2024005', name: 'Vikram Rao', dob: '2003-05-18', gender: 'M', dept: 'MECH', year: '4', sem: '07', email: 'vikram.rao@univ.edu', phone: '9876543214', enroll_date: '2021-08-01', status: 'A' },
  { stu_id: 'STU2024006', name: 'Priya Nair', dob: '2005-09-12', gender: 'F', dept: 'IT  ', year: '1', sem: '01', email: 'priya.nair@univ.edu', phone: '9876543215', enroll_date: '2024-08-01', status: 'A' },
  { stu_id: 'STU2024007', name: 'Karthik Reddy', dob: '2004-12-05', gender: 'M', dept: 'EEE ', year: '2', sem: '03', email: 'karthik.reddy@univ.edu', phone: '9876543216', enroll_date: '2023-08-01', status: 'A' },
  { stu_id: 'STU2024008', name: 'Sneha Kulkarni', dob: '2003-08-30', gender: 'F', dept: 'CS  ', year: '4', sem: '07', email: 'sneha.kulkarni@univ.edu', phone: '9876543217', enroll_date: '2021-08-01', status: 'A' },
  { stu_id: 'STU2024009', name: 'Aditya Mishra', dob: '2004-04-14', gender: 'M', dept: 'CIVL', year: '3', sem: '05', email: 'aditya.mishra@univ.edu', phone: '9876543218', enroll_date: '2022-08-01', status: 'A' },
  { stu_id: 'STU2024010', name: 'Meera Menon', dob: '2004-10-22', gender: 'F', dept: 'ECE ', year: '3', sem: '05', email: 'meera.menon@univ.edu', phone: '9876543219', enroll_date: '2022-08-01', status: 'A' },
  { stu_id: 'STU2024011', name: 'Arjun Gupta', dob: '2004-06-11', gender: 'M', dept: 'CS  ', year: '2', sem: '03', email: 'arjun.gupta@univ.edu', phone: '9876543220', enroll_date: '2023-08-01', status: 'A' },
  { stu_id: 'STU2024012', name: 'Pooja Hegde', dob: '2003-12-01', gender: 'F', dept: 'IT  ', year: '4', sem: '07', email: 'pooja.hegde@univ.edu', phone: '9876543221', enroll_date: '2021-08-01', status: 'A' },
  { stu_id: 'STU2024013', name: 'Siddharth Sen', dob: '2004-02-19', gender: 'M', dept: 'MECH', year: '3', sem: '05', email: 'siddharth.sen@univ.edu', phone: '9876543222', enroll_date: '2022-08-01', status: 'A' },
  { stu_id: 'STU2024014', name: 'Tanvi Joshi', dob: '2005-01-14', gender: 'F', dept: 'ECE ', year: '1', sem: '02', email: 'tanvi.joshi@univ.edu', phone: '9876543223', enroll_date: '2024-08-01', status: 'A' },
  { stu_id: 'STU2024015', name: 'Naveen Kumar', dob: '2003-04-04', gender: 'M', dept: 'EEE ', year: '4', sem: '08', email: 'naveen.kumar@univ.edu', phone: '9876543224', enroll_date: '2021-08-01', status: 'A' }
];

export const INITIAL_APPLICATIONS: Application[] = [
  { app_id: 'APP2024001', stu_id: 'STU2024001', sch_code: 'MERIT1', app_date: '2024-10-10', cgpa: 9.45, attendance: 88.50, income: 180000.00, arrears: 0, bank_ac_num: '9182374619283746', bank_ifsc: 'SBIN0001234', status: 'PROCESSED' },
  { app_id: 'APP2024002', stu_id: 'STU2024002', sch_code: 'MERIT1', app_date: '2024-10-10', cgpa: 8.60, attendance: 82.00, income: 210000.00, arrears: 0, bank_ac_num: '9182374619283747', bank_ifsc: 'HDFC0002345', status: 'PROCESSED' },
  { app_id: 'APP2024003', stu_id: 'STU2024003', sch_code: 'MERIT1', app_date: '2024-10-10', cgpa: 7.75, attendance: 79.00, income: 195000.00, arrears: 0, bank_ac_num: '9182374619283748', bank_ifsc: 'ICIC0003456', status: 'PROCESSED' },
  { app_id: 'APP2024004', stu_id: 'STU2024004', sch_code: 'MERIT1', app_date: '2024-10-11', cgpa: 6.80, attendance: 85.00, income: 150000.00, arrears: 0, bank_ac_num: '9182374619283749', bank_ifsc: 'BARB0COLLEG', status: 'REJECTED' },
  { app_id: 'APP2024005', stu_id: 'STU2024005', sch_code: 'MERIT1', app_date: '2024-10-11', cgpa: 8.40, attendance: 68.50, income: 175000.00, arrears: 0, bank_ac_num: '9182374619283750', bank_ifsc: 'PUNB0005678', status: 'REJECTED' },
  { app_id: 'APP2024006', stu_id: 'STU2024006', sch_code: 'MERIT1', app_date: '2024-10-11', cgpa: 8.90, attendance: 91.00, income: 360000.00, arrears: 0, bank_ac_num: '9182374619283751', bank_ifsc: 'CNRB0006789', status: 'REJECTED' },
  { app_id: 'APP2024007', stu_id: 'STU2024007', sch_code: 'MERIT1', app_date: '2024-10-12', cgpa: 8.20, attendance: 84.00, income: 160000.00, arrears: 2, bank_ac_num: '9182374619283752', bank_ifsc: 'UBIN0007890', status: 'REJECTED' },
  { app_id: 'APP2024008', stu_id: 'STU2024001', sch_code: 'MERIT1', app_date: '2024-10-12', cgpa: 9.45, attendance: 88.50, income: 180000.00, arrears: 0, bank_ac_num: '9182374619283746', bank_ifsc: 'SBIN0001234', status: 'DUPLICATE', is_duplicate: true },
  { app_id: 'APP2024002', stu_id: 'STU2024008', sch_code: 'MERIT1', app_date: '2024-10-12', cgpa: 9.10, attendance: 89.00, income: 140000.00, arrears: 0, bank_ac_num: '9182374619283753', bank_ifsc: 'IOBA0008901', status: 'DUPLICATE', is_duplicate: true },
  { app_id: 'APP2024010', stu_id: 'STU2024009', sch_code: 'MERIT1', app_date: '2024-10-13', cgpa: 8.15, attendance: 81.00, income: 200000.00, arrears: 0, bank_ac_num: '9182374619283754', bank_ifsc: '', status: 'INVALID' },
  { app_id: 'APP2024011', stu_id: 'STU2024010', sch_code: 'MERIT1', app_date: '2024-10-13', cgpa: 11.50, attendance: 88.00, income: 170000.00, arrears: 0, bank_ac_num: '9182374619283755', bank_ifsc: 'KKBK0009012', status: 'INVALID' },
  { app_id: 'APP2024012', stu_id: 'STU2024011', sch_code: 'MERIT1', app_date: '2024-10-13', cgpa: 8.70, attendance: 105.00, income: 190000.00, arrears: 0, bank_ac_num: '9182374619283756', bank_ifsc: 'YESB0001234', status: 'INVALID' },
  { app_id: 'APP2024013', stu_id: 'STU2024012', sch_code: 'MERIT1', app_date: '2024-10-14', cgpa: 6.50, attendance: 62.00, income: 400000.00, arrears: 1, bank_ac_num: '9182374619283757', bank_ifsc: 'IDIB0002345', status: 'REJECTED' },
  { app_id: 'APP2024014', stu_id: 'STU2024013', sch_code: 'MERIT1', app_date: '2024-10-14', cgpa: 7.50, attendance: 75.00, income: 250000.00, arrears: 0, bank_ac_num: '9182374619283758', bank_ifsc: 'CORP0003456', status: 'PROCESSED' },
  { app_id: 'APP2024015', stu_id: 'STU2024014', sch_code: 'TECH02', app_date: '2024-10-14', cgpa: 9.65, attendance: 94.00, income: 220000.00, arrears: 0, bank_ac_num: '9182374619283759', bank_ifsc: 'AXIS0004567', status: 'PROCESSED' }
];

export const INITIAL_ELIGIBILITY_RESULTS: EligibilityResult[] = [
  { app_id: 'APP2024001', stu_id: 'STU2024001', stu_name: 'Aarav Sharma', dept: 'CS  ', sch_code: 'MERIT1', cgpa: 9.45, attendance: 88.50, income: 180000.00, arrears: 0, status: 'E', reason_code: 'NONE      ', reason_desc: 'Meets all criteria (Tier 1)', award: 20000.00, bank_ac_num: '9182374619283746', bank_ifsc: 'SBIN0001234', batch_id: 'BAT2024101' },
  { app_id: 'APP2024002', stu_id: 'STU2024002', stu_name: 'Diya Patel', dept: 'IT  ', sch_code: 'MERIT1', cgpa: 8.60, attendance: 82.00, income: 210000.00, arrears: 0, status: 'E', reason_code: 'NONE      ', reason_desc: 'Meets all criteria (Tier 2)', award: 15000.00, bank_ac_num: '9182374619283747', bank_ifsc: 'HDFC0002345', batch_id: 'BAT2024101' },
  { app_id: 'APP2024003', stu_id: 'STU2024003', stu_name: 'Rohan Verma', dept: 'ECE ', sch_code: 'MERIT1', cgpa: 7.75, attendance: 79.00, income: 195000.00, arrears: 0, status: 'E', reason_code: 'NONE      ', reason_desc: 'Meets all criteria (Tier 3)', award: 10000.00, bank_ac_num: '9182374619283748', bank_ifsc: 'ICIC0003456', batch_id: 'BAT2024101' },
  { app_id: 'APP2024004', stu_id: 'STU2024004', stu_name: 'Ananya Iyer', dept: 'CS  ', sch_code: 'MERIT1', cgpa: 6.80, attendance: 85.00, income: 150000.00, arrears: 0, status: 'R', reason_code: 'REJ-CGPA  ', reason_desc: 'CGPA below 7.50 threshold', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024005', stu_id: 'STU2024005', stu_name: 'Vikram Rao', dept: 'MECH', sch_code: 'MERIT1', cgpa: 8.40, attendance: 68.50, income: 175000.00, arrears: 0, status: 'R', reason_code: 'REJ-ATTN  ', reason_desc: 'Attendance below 75% minimum', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024006', stu_id: 'STU2024006', stu_name: 'Priya Nair', dept: 'IT  ', sch_code: 'MERIT1', cgpa: 8.90, attendance: 91.00, income: 360000.00, arrears: 0, status: 'R', reason_code: 'REJ-INCOME', reason_desc: 'Family income exceeds Rs. 2,50,000', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024007', stu_id: 'STU2024007', stu_name: 'Karthik Reddy', dept: 'EEE ', sch_code: 'MERIT1', cgpa: 8.20, attendance: 84.00, income: 160000.00, arrears: 2, status: 'R', reason_code: 'REJ-ARREAR', reason_desc: 'Active arrears present (2 active)', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024008', stu_id: 'STU2024001', stu_name: 'Aarav Sharma', dept: 'CS  ', sch_code: 'MERIT1', cgpa: 9.45, attendance: 88.50, income: 180000.00, arrears: 0, status: 'D', reason_code: 'REJ-DUPAPP', reason_desc: 'Student already applied in this cycle', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024002', stu_id: 'STU2024008', stu_name: 'Sneha Kulkarni', dept: 'CS  ', sch_code: 'MERIT1', cgpa: 9.10, attendance: 89.00, income: 140000.00, arrears: 0, status: 'D', reason_code: 'REJ-DUPAPP', reason_desc: 'Duplicate Application ID in batch stream', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024010', stu_id: 'STU2024009', stu_name: 'Aditya Mishra', dept: 'CIVL', sch_code: 'MERIT1', cgpa: 8.15, attendance: 81.00, income: 200000.00, arrears: 0, status: 'I', reason_code: 'REJ-INVDAT', reason_desc: 'Missing mandatory bank IFSC code', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024011', stu_id: 'STU2024010', stu_name: 'Meera Menon', dept: 'ECE ', sch_code: 'MERIT1', cgpa: 11.50, attendance: 88.00, income: 170000.00, arrears: 0, status: 'I', reason_code: 'REJ-INVDAT', reason_desc: 'CGPA out of valid range (0.00 - 10.00)', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024012', stu_id: 'STU2024011', stu_name: 'Arjun Gupta', dept: 'CS  ', sch_code: 'MERIT1', cgpa: 8.70, attendance: 105.00, income: 190000.00, arrears: 0, status: 'I', reason_code: 'REJ-INVDAT', reason_desc: 'Attendance out of range (0% - 100%)', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024013', stu_id: 'STU2024012', stu_name: 'Pooja Hegde', dept: 'IT  ', sch_code: 'MERIT1', cgpa: 6.50, attendance: 62.00, income: 400000.00, arrears: 1, status: 'R', reason_code: 'REJ-MULTPL', reason_desc: 'Multiple criteria failed (CGPA, Attn, Income, Arrears)', award: 0.00, batch_id: 'BAT2024101' },
  { app_id: 'APP2024014', stu_id: 'STU2024013', stu_name: 'Siddharth Sen', dept: 'MECH', sch_code: 'MERIT1', cgpa: 7.50, attendance: 75.00, income: 250000.00, arrears: 0, status: 'E', reason_code: 'NONE      ', reason_desc: 'Borderline eligibility met (Tier 3)', award: 10000.00, bank_ac_num: '9182374619283758', bank_ifsc: 'CORP0003456', batch_id: 'BAT2024101' },
  { app_id: 'APP2024015', stu_id: 'STU2024014', stu_name: 'Tanvi Joshi', dept: 'ECE ', sch_code: 'TECH02', cgpa: 9.65, attendance: 94.00, income: 220000.00, arrears: 0, status: 'E', reason_code: 'NONE      ', reason_desc: 'STEM Grant Tier 1 Achiever', award: 20000.00, bank_ac_num: '9182374619283759', bank_ifsc: 'AXIS0004567', batch_id: 'BAT2024101' }
];

export const INITIAL_DISBURSEMENTS: DisbursementRecord[] = [
  { rec_type: 'D', ref_id: 'DSB2024000001', app_id: 'APP2024001', stu_id: 'STU2024001', amount: 20000.00, bank_ac_num: '9182374619283746', bank_ifsc: 'SBIN0001234', status: 'S', value_date: '20241015', utr_num: 'UTR202410150001IN', batch_id: 'BAT2024101' },
  { rec_type: 'D', ref_id: 'DSB2024000002', app_id: 'APP2024002', stu_id: 'STU2024002', amount: 15000.00, bank_ac_num: '9182374619283747', bank_ifsc: 'HDFC0002345', status: 'S', value_date: '20241015', utr_num: 'UTR202410150002IN', batch_id: 'BAT2024101' },
  { rec_type: 'D', ref_id: 'DSB2024000003', app_id: 'APP2024003', stu_id: 'STU2024003', amount: 10000.00, bank_ac_num: '9182374619283748', bank_ifsc: 'ICIC0003456', status: 'S', value_date: '20241015', utr_num: 'UTR202410150003IN', batch_id: 'BAT2024101' },
  { rec_type: 'D', ref_id: 'DSB2024000004', app_id: 'APP2024014', stu_id: 'STU2024013', amount: 10000.00, bank_ac_num: '9182374619283758', bank_ifsc: 'CORP0003456', status: 'P', value_date: '20241015', utr_num: 'UTR202410150004IN', batch_id: 'BAT2024101' },
  { rec_type: 'D', ref_id: 'DSB2024000005', app_id: 'APP2024015', stu_id: 'STU2024014', amount: 20000.00, bank_ac_num: '9182374619283759', bank_ifsc: 'AXIS0004567', status: 'P', value_date: '20241015', utr_num: 'UTR202410150005IN', batch_id: 'BAT2024101' }
];

export const INITIAL_EXCEPTIONS: ExceptionRecord[] = [
  { rec_num: 8, app_id: 'APP2024008', stu_id: 'STU2024001', code: 'ERR-DUPL', reason: 'Student already applied for scholarship in same batch', severity: 'W' },
  { rec_num: 9, app_id: 'APP2024002', stu_id: 'STU2024008', code: 'ERR-DUPL', reason: 'Duplicate Application ID detected in batch stream', severity: 'W' },
  { rec_num: 10, app_id: 'APP2024010', stu_id: 'STU2024009', code: 'ERR-VALD', reason: 'Bank IFSC code is mandatory and was missing', severity: 'E' },
  { rec_num: 11, app_id: 'APP2024011', stu_id: 'STU2024010', code: 'ERR-VALD', reason: 'CGPA out of valid range 0.00-10.00 (Found: 11.50)', severity: 'E' },
  { rec_num: 12, app_id: 'APP2024012', stu_id: 'STU2024011', code: 'ERR-VALD', reason: 'Attendance out of range 0-100% (Found: 105.00%)', severity: 'E' }
];

export const INITIAL_SUMMARY: BatchSummary = {
  batch_id: 'BAT2024101',
  run_date: '2024-10-15 18:30:00',
  return_code: '0000',
  total_students: 15,
  total_applications: 15,
  eligible_count: 5,
  rejected_count: 10,
  duplicate_count: 2,
  total_disbursement_inr: 75000.00,
  avg_cgpa_eligible: 8.59,
  avg_attendance_eligible: 83.80
};

export const INITIAL_CONFIG: SystemConfig = {
  minCgpa: 7.50,
  minAttendance: 75.00,
  maxAnnualIncome: 250000.00,
  maxArrears: 0,
  slabs: [
    { min_cgpa: 9.00, max_cgpa: 10.00, amount: 20000.00, tier: 'HIGH MERIT TIER 1' },
    { min_cgpa: 8.00, max_cgpa: 8.99, amount: 15000.00, tier: 'MERIT TIER 2' },
    { min_cgpa: 7.50, max_cgpa: 7.99, amount: 10000.00, tier: 'MERIT TIER 3' }
  ],
  zosSubsystem: 'DSN1 (Db2 v12.1 for z/OS)',
  vsamDatasetName: 'USERID.SCHOLAR.VSAM.STUMAST.KSDS',
  db2PlanName: 'SCHOLAR_PLAN'
};

export const INITIAL_JOB_EXECUTIONS: JclJobExecution[] = [
  {
    jobId: 'JOB04821',
    jobName: 'BATELG01',
    submitTime: '2024-10-15 18:30:00',
    completionTime: '2024-10-15 18:30:14',
    returnCode: 'RC 0000',
    status: 'COMPLETED',
    steps: [
      { stepName: 'CLEAN01', program: 'IEFBR14', rc: '0000', description: 'Purge previous execution datasets' },
      { stepName: 'SRTSTEP', program: 'SORT', rc: '0000', description: 'DFSORT Application record sequencing & XSUM' },
      { stepName: 'RUNMAIN', program: 'MAIN0001', rc: '0000', description: 'COBOL Batch Orchestration & Eligibility Engine' },
      { stepName: 'AUDITDB2', program: 'IKJEFT01', rc: '0000', description: 'Db2 persistence & commit step' }
    ],
    sysoutLog: [
      '//BATELG01 JOB (SCHOLAR,BAT),CLASS=A,MSGCLASS=X,NOTIFY=USER01',
      'ICH70001I USER01 LAST ACCESS AT 18:29:45 ON TUESDAY, OCTOBER 15, 2024',
      '$HASP373 BATELG01 STARTED - INIT 1    - CLASS A        - SYS ZOS1',
      'IEF403I BATELG01 - STARTED - TIME=18.30.00',
      'IEF142I BATELG01 CLEAN01 - STEP WAS EXECUTED - COND CODE 0000',
      'IEF142I BATELG01 SRTSTEP - STEP WAS EXECUTED - COND CODE 0000',
      'MAIN0001: SMART SCHOLARSHIP BATCH ENGINE STARTING',
      'MAIN0001: [VSAM KSDS] USERID.SCHOLAR.VSAM.STUMAST.KSDS OPEN RC=00',
      'MAIN0001: PROCESSED 15 APPLICATION RECORDS IN BATCH BAT2024101',
      'MAIN0001: ELIGIBLE AWARDS: 5 | REJECTIONS: 10 | DUPLICATES: 2',
      'MAIN0001: TOTAL FINANCIAL DISBURSEMENT: INR 75,000.00',
      'IEF142I BATELG01 RUNMAIN - STEP WAS EXECUTED - COND CODE 0000',
      'DSN SYSTEM(DSN1) RUN PROGRAM(DB2AUD01) PLAN(SCHOLAR_PLAN) - SUCCESS',
      'IEF142I BATELG01 AUDITDB2 - STEP WAS EXECUTED - COND CODE 0000',
      'IEF404I BATELG01 - ENDED - TIME=18.30.14',
      '$HASP395 BATELG01 ENDED - RC=0000'
    ]
  },
  {
    jobId: 'JOB04820',
    jobName: 'IDCDEF01',
    submitTime: '2024-10-15 18:25:00',
    completionTime: '2024-10-15 18:25:08',
    returnCode: 'RC 0000',
    status: 'COMPLETED',
    steps: [
      { stepName: 'STEP010', program: 'IDCAMS', rc: '0000', description: 'Define VSAM KSDS Cluster' },
      { stepName: 'STEP020', program: 'IDCAMS', rc: '0000', description: 'REPRO Load from sequential student dataset' },
      { stepName: 'STEP030', program: 'IDCAMS', rc: '0000', description: 'VERIFY & PRINT 10 Records' }
    ],
    sysoutLog: [
      '//IDCDEF01 JOB (SCHOLAR,BAT),CLASS=A,MSGCLASS=X',
      'IDCAMS SYSTEM SERVICES - DEFINE CLUSTER USERID.SCHOLAR.VSAM.STUMAST.KSDS',
      'IDC0508I SUCCESSFUL ALLOCATION OF DATA COMPONENT: 5 CYLINDERS',
      'IDC0509I SUCCESSFUL ALLOCATION OF INDEX COMPONENT: 1 CYLINDERS',
      'IDC0001I FUNCTION COMPLETED, HIGHEST CONDITION CODE WAS 0',
      'IDCAMS REPRO - INFILE(INSEQ) OUTDATASET(...) - 15 RECORDS PROCESSED',
      '$HASP395 IDCDEF01 ENDED - RC=0000'
    ]
  },
  {
    jobId: 'JOB04819',
    jobName: 'COMPCOB',
    submitTime: '2024-10-15 18:15:00',
    completionTime: '2024-10-15 18:15:42',
    returnCode: 'RC 0000',
    status: 'COMPLETED',
    steps: [
      { stepName: 'CMPSTU', program: 'IGYCRCTL', rc: '0000', description: 'Compile STU1001 Enterprise COBOL' },
      { stepName: 'CMPSCH', program: 'IGYCRCTL', rc: '0000', description: 'Compile SCH2001 Enterprise COBOL' },
      { stepName: 'CMPDUP', program: 'IGYCRCTL', rc: '0000', description: 'Compile DUP3001 Enterprise COBOL' },
      { stepName: 'CMPDIS', program: 'IGYCRCTL', rc: '0000', description: 'Compile DIS4001 Enterprise COBOL' },
      { stepName: 'CMPRPT', program: 'IGYCRCTL', rc: '0000', description: 'Compile RPT5001 Enterprise COBOL' },
      { stepName: 'CMPMAIN', program: 'IGYCRCTL', rc: '0000', description: 'Compile MAIN0001 Master Controller' },
      { stepName: 'LNKMAIN', program: 'IEWBLINK', rc: '0000', description: 'Binder link-edit into USERID.SCHOLAR.LOADLIB' }
    ],
    sysoutLog: [
      '//COMPCOB JOB (SCHOLAR,BAT),CLASS=A,MSGCLASS=X',
      'IGYCRCTL V6.3: STU1001 COMPILED CLEANLY - 0 ERRORS',
      'IGYCRCTL V6.3: SCH2001 COMPILED CLEANLY - 0 ERRORS',
      'IGYCRCTL V6.3: DUP3001 COMPILED CLEANLY - 0 ERRORS',
      'IGYCRCTL V6.3: DIS4001 COMPILED CLEANLY - 0 ERRORS',
      'IGYCRCTL V6.3: RPT5001 COMPILED CLEANLY - 0 ERRORS',
      'IGYCRCTL V6.3: MAIN0001 COMPILED CLEANLY - 0 ERRORS',
      'IEWBLINK: MODULE MAIN0001 LINKED SUCCESSFULLY INTO LOADLIB',
      '$HASP395 COMPCOB ENDED - RC=0000'
    ]
  }
];
