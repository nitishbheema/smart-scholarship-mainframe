// Production API Client for Smart Scholarship Backend & COBOL Batch Engine

const isProd = Boolean((import.meta as any).env?.PROD);
const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;

if (isProd && !envBaseUrl) {
  console.error(
    '[CONFIG WARNING] VITE_API_BASE_URL environment variable is not defined for production. ' +
    'Localhost fallback is disabled in production to prevent silent connection failures.'
  );
}

export const API_BASE_URL: string = envBaseUrl || (isProd ? '' : 'http://localhost:5000');

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('scholarship_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('scholarship_token', token);
    } else {
      localStorage.removeItem('scholarship_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getBaseUrl(): string {
    return API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (isProd && !envBaseUrl && !API_BASE_URL) {
      throw new Error(
        'VITE_API_BASE_URL is not configured for this production environment. ' +
        'Please configure VITE_API_BASE_URL in your hosting settings.'
      );
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // --- AUTHENTICATION ---
  async login(username: string, password: string) {
    const data = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  // --- HEALTH & STATUS ---
  async getHealth() {
    return this.request<any>('/api/health');
  }

  // --- DASHBOARD & REPORTS ---
  async getDashboardSummary() {
    return this.request<any>('/api/reports/summary');
  }

  async getEligibilityResults(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/api/reports/eligibility${qs}`);
  }

  async getAuditLogs() {
    return this.request<any>('/api/reports/audit-logs');
  }

  // --- STUDENTS ---
  async getStudents(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/api/students${qs}`);
  }

  async getStudentById(id: string) {
    return this.request<any>(`/api/students/${id}`);
  }

  async createStudent(student: any) {
    return this.request<any>('/api/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: string, student: any) {
    return this.request<any>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id: string) {
    return this.request<any>(`/api/students/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUploadStudents(csvData: string) {
    return this.request<any>('/api/students/bulk-csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // --- SCHOLARSHIP SCHEMES ---
  async getSchemes() {
    return this.request<any>('/api/schemes');
  }

  async getSchemeByCode(code: string) {
    return this.request<any>(`/api/schemes/${code}`);
  }

  async createScheme(scheme: any) {
    return this.request<any>('/api/schemes', {
      method: 'POST',
      body: JSON.stringify(scheme),
    });
  }

  async updateScheme(code: string, scheme: any) {
    return this.request<any>(`/api/schemes/${code}`, {
      method: 'PUT',
      body: JSON.stringify(scheme),
    });
  }

  // --- SCHOLARSHIP APPLICATIONS ---
  async getApplications(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/api/applications${qs}`);
  }

  async getApplicationById(id: string) {
    return this.request<any>(`/api/applications/${id}`);
  }

  async createApplication(application: any) {
    return this.request<any>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async bulkUploadApplications(csvData: string) {
    return this.request<any>('/api/applications/bulk-csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // --- COBOL BATCH EXECUTION ---
  async executeCobolBatch(batchId?: string) {
    return this.request<any>('/api/batch/execute', {
      method: 'POST',
      body: JSON.stringify({ batchId }),
    });
  }

  async getBatchJobs() {
    return this.request<any>('/api/batch/jobs');
  }

  async getBatchJobById(id: string) {
    return this.request<any>(`/api/batch/jobs/${id}`);
  }

  // --- DISBURSEMENTS ---
  async getDisbursements(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/api/disbursements${qs}`);
  }

  async settleDisbursement(id: string, utr?: string) {
    return this.request<any>(`/api/disbursements/${id}/settle`, {
      method: 'POST',
      body: JSON.stringify({ utr_number: utr }),
    });
  }
}

export const api = new ApiService();
