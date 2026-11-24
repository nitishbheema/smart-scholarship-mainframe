export type PageType = 
  | 'login'
  | 'dashboard'
  | 'students'
  | 'applications'
  | 'eligibility'
  | 'disbursements'
  | 'batch-history'
  | 'reports'
  | 'config';

export interface UserSession {
  username: string;
  role: 'OPERATOR' | 'ADMIN' | 'AUDITOR';
  isAuthenticated: boolean;
  zosUserId: string;
}

export interface Student {
  stu_id: string;
  name: string;
  dob: string;
  gender: 'M' | 'F' | 'O';
  dept: string;
  year: string;
  sem: string;
  email: string;
  phone: string;
  enroll_date: string;
  status: 'A' | 'S' | 'G';
}

export interface Application {
  app_id: string;
  stu_id: string;
  sch_code: string;
  app_date: string;
  cgpa: number;
  attendance: number;
  income: number;
  arrears: number;
  bank_ac_num: string;
  bank_ifsc: string;
  status?: string;
  is_duplicate?: boolean;
}

export interface EligibilityResult {
  app_id: string;
  stu_id: string;
  stu_name: string;
  dept?: string;
  sch_code: string;
  cgpa: number;
  attendance: number;
  income: number;
  arrears: number;
  status: 'E' | 'R' | 'D' | 'I';
  reason_code: string;
  reason_desc?: string;
  award: number;
  bank_ac_num?: string;
  bank_ifsc?: string;
  batch_id: string;
}

export interface DisbursementRecord {
  rec_type: string;
  ref_id: string;
  app_id: string;
  stu_id: string;
  amount: number;
  bank_ac_num: string;
  bank_ifsc: string;
  status: 'P' | 'S' | 'F' | 'H'; // Pending, Success, Failed, Hold
  value_date: string;
  utr_num: string;
  batch_id: string;
}

export interface ExceptionRecord {
  rec_num: number;
  app_id: string;
  stu_id: string;
  code: string;
  reason: string;
  severity: 'W' | 'E' | 'F';
}

export interface BatchSummary {
  batch_id: string;
  run_date: string;
  return_code: string;
  total_students: number;
  total_applications: number;
  eligible_count: number;
  rejected_count: number;
  duplicate_count: number;
  total_disbursement_inr: number;
  avg_cgpa_eligible: number;
  avg_attendance_eligible: number;
}

export interface SlabsConfig {
  min_cgpa: number;
  max_cgpa: number;
  amount: number;
  tier: string;
}

export interface SystemConfig {
  minCgpa: number;
  minAttendance: number;
  maxAnnualIncome: number;
  maxArrears: number;
  slabs: SlabsConfig[];
  zosSubsystem: string;
  vsamDatasetName: string;
  db2PlanName: string;
}

export interface JclJobExecution {
  jobId: string;
  jobName: string;
  submitTime: string;
  completionTime: string;
  returnCode: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
  steps: {
    stepName: string;
    program: string;
    rc: string;
    description: string;
  }[];
  sysoutLog: string[];
}
