# Smart Scholarship Eligibility & Disbursement Processing System
### Hybrid Enterprise IBM Mainframe & Modern Cloud Architecture

[![IBM z/OS](https://img.shields.io/badge/IBM_z%2FOS-Enterprise_Ready-0043ce?logo=ibm&logoColor=white)](https://www.ibm.com/products/zos)
[![GnuCOBOL](https://img.shields.io/badge/GnuCOBOL-v3.1.2_Native_Binary-0f62fe?logo=gnu&logoColor=white)](https://gnucobol.sourceforge.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js / Express](https://img.shields.io/badge/Backend-Node.js_Express_REST_API-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%2B_Vite_%2B_TypeScript-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Acceptance_Tests-20%2F20_Passed-24a148)](tests/integration/test_all_20_scenarios.ts)
[![Security Tests](https://img.shields.io/badge/Security_Tests-10%2F10_Passed-24a148)](tests/integration/test_security_and_api.ts)
[![HTTP Tests](https://img.shields.io/badge/HTTP_RBAC_Tests-10%2F10_Passed-24a148)](tests/integration/test_http_endpoints.ts)

---

## 1. Executive Summary & Transformation

The **Smart Scholarship Eligibility & Disbursement Processing System** is a complete, production-grade application designed for institutional scholarship administration. It bridges authentic **Enterprise Mainframe COBOL** processing with a modern **Node.js/Express REST API**, persistent **PostgreSQL Relational Storage**, and a responsive **React 18 / TypeScript Dashboard**.

### Critical Architecture Highlights
1. **Actual Native COBOL Execution**: The core eligibility evaluation engine is compiled from modular COBOL sources into a native executable (`MAIN0001`) via GnuCOBOL. The backend orchestrates batch jobs by generating fixed-width 120-byte `APPIN` streams and parsing native binary output files (`ELGOUT`, `REJOUT`, `DISBOUT`, `RPTOUT`).
2. **Persistent Relational Database**: All student demographics, scholarship rules, submitted applications, batch execution histories, and disbursement instructions are stored in PostgreSQL.
3. **Dual Mainframe Compatibility**: Source code and datasets remain 100% compliant with IBM Enterprise COBOL for z/OS (fixed columns 8–72, ANSI carriage controls, standard copybooks) and GnuCOBOL 3.1.
4. **End-to-End Verification**: 20 rigorous acceptance scenarios covering high/mid/threshold merit, academic/attendance/financial/arrears rejections, duplicate detection, boundary validation, and duplicate disbursement shielding.
5. **Hardened Production Security**: Strict JWT secret validation (minimum 32 characters, no hardcoded fallbacks), granular Role-Based Access Control (`ADMIN`, `OPERATOR`, `AUDITOR`), atomic sequence ID generation, duplicate batch concurrency blocks, and sensitive data masking.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph UI["Frontend Layer (React 18 + Vite + TypeScript)"]
        DASH["Banking & Operator Dashboard<br/>(Metrics, Student CRUD, Scheme Config, Batch Trigger)"]
    end

    subgraph API["Backend Layer (Node.js + Express REST API)"]
        ROUTER["REST Endpoints (Protected by JWT & RBAC)<br/>/api/students • /api/schemes • /api/applications<br/>/api/batch/execute • /api/disbursements • /api/reports"]
        AUTH["Auth & Role Guards<br/>authenticateToken • requireRole(['ADMIN', 'OPERATOR'])"]
        ORCH["CobolService Orchestrator<br/>- Concurrency Guard (409 Conflict check)<br/>- Fixed-width 120B stream generator<br/>- ChildProcess spawn manager<br/>- Fixed-width parser & sanitizer"]
    end

    subgraph ENGINE["Mainframe Processing Engine (GnuCOBOL / z/OS)"]
        MAIN["MAIN0001 (Master Batch Controller)"]
        STU["STU1001 (Validation Subprogram)"]
        DUP["DUP3001 (Duplicate Detection Subprogram)"]
        SCH["SCH2001 (Eligibility & Slab Engine)"]
        DIS["DIS4001 (Disbursement Subprogram)"]
        RPT["RPT5001 (SYSOUT Report Formatter)"]
    end

    subgraph DATA["Persistence Layer (PostgreSQL 16)"]
        PG[("PostgreSQL Database<br/>users • students • scholarship_schemes<br/>scholarship_applications • batch_jobs<br/>eligibility_results • disbursement_records • audit_logs<br/>app_id_seq • disb_id_seq")]
    end

    DASH -->|HTTP / JSON / Bearer JWT| ROUTER
    ROUTER --> AUTH
    AUTH -->|SQL Pool Queries| PG
    AUTH -->|Trigger Batch| ORCH
    ORCH -->|Fetch Pending Apps| PG
    ORCH -->|Writes APPIN.dat (120B)| MAIN
    MAIN --> STU
    MAIN --> DUP
    MAIN --> SCH
    MAIN --> DIS
    MAIN --> RPT
    MAIN -->|ELGOUT (120B), REJOUT (120B)<br/>DISBOUT (120B), RPTOUT (133B)| ORCH
    ORCH -->|Transactional Commit| PG
```

---

## 3. Production Security & Integrity Controls

### 3.1 Authentication & Role-Based Access Control (RBAC)
- **Token Security**: Signed with HMAC SHA-256 using a strong `JWT_SECRET` (minimum 32 characters required at boot). Zero insecure fallback secrets allowed in production.
- **Initial Session**: Initial dashboard state is strictly unauthenticated. Real login (`/api/auth/login`) issues a cryptographically verified token; logout revokes local session storage.
- **Granular Route Protection**:
  - `ADMIN`: Full access to scheme creation/updates, student modifications, application processing, batch execution, and disbursement settlement.
  - `OPERATOR`: Access to student CRUD, application ingestion, batch execution, and disbursement clearing. Prohibited from altering scholarship scheme criteria.
  - `AUDITOR`: Read-only access to master records, applications, SYSOUT execution spools, compliance audit logs, and analytics. All modification endpoints return `403 Forbidden`.

### 3.2 Concurrency & Ledger Integrity
- **Atomic Application ID Sequence**: Uses PostgreSQL sequence `app_id_seq` (`SELECT nextval('app_id_seq')`) to guarantee collision-free, concurrent submission of 10-byte application IDs (`APP2026101`).
- **Duplicate Batch Execution Shield**: Before spawning `MAIN0001`, the system checks `SELECT batch_id FROM batch_jobs WHERE status = 'RUNNING'`. Any concurrent batch attempt is immediately rejected with HTTP `409 Conflict`.
- **Duplicate Disbursement Shield**: The orchestrator checks if an eligible candidate already possesses an issued or settled disbursement record. Re-disbursement for the same application is blocked.
- **Sensitive PII Masking**: Student bank account numbers are masked (`************1234`) across all public server logs, console stdout, and audit records.
- **Input & Upload Sanitization**: CSV bulk uploads are limited to 2MB via Multer memory storage and validated for mandatory header columns before transaction ingestion.

---

## 4. Environment Variables Specification

| Variable Name | Environment | Required | Default / Description |
|---|---|---|---|
| `NODE_ENV` | Backend | Optional | `development` / `production` / `test` |
| `PORT` | Backend | Optional | `5000` |
| `JWT_SECRET` | Backend | **Mandatory** | Minimum 32-character high-entropy secret key. |
| `DATABASE_URL` | Backend | **Mandatory (Prod)** | Managed PostgreSQL connection string (SSL enabled). |
| `ADMIN_USERNAME` | Backend | Optional | `admin` (Initial administrator username). |
| `ADMIN_PASSWORD` | Backend | **Mandatory (Prod)** | Minimum 8-character password. Never printed in logs. |
| `ADMIN_EMAIL` | Backend | Optional | `admin@scholarship.edu` |
| `VITE_API_BASE_URL` | Frontend | **Mandatory (Prod)** | Deployed backend REST API URL (e.g. `https://smart-scholarship-backend.onrender.com`). |

---

## 5. Mainframe COBOL Subsystem

The application core consists of 6 modular Enterprise COBOL programs and copybooks:

```
mainframe/
├── cobol/
│   ├── MAIN0001.cbl   # Master Batch Controller & Pipeline Orchestration
│   ├── STU1001.cbl    # Student Input Record Validation Subprogram
│   ├── SCH2001.cbl    # Dynamic Eligibility Rules & Slab Evaluation Engine
│   ├── DUP3001.cbl    # Batch Duplicate Application Interceptor
│   ├── DIS4001.cbl    # Electronic Disbursement Instruction Generator
│   └── RPT5001.cbl    # Formatted 132-Column ANSI SYSOUT Report Generator
├── copybooks/
│   ├── SCHAPP.cpy     # 120-byte Application Input Record Layout
│   ├── STUREC.cpy     # 150-byte VSAM Student Master Layout
│   ├── ELIGREC.cpy    # 120-byte Eligibility Result Record Layout
│   ├── DISBREC.cpy    # 120-byte Disbursement Record Layout
│   ├── ERRREC.cpy     # 120-byte Exception Record Layout
│   └── WSCONST.cpy    # Configurable Business Rule Working Storage Constants
```

---

## 6. Verification & Automated Test Suites

Three dedicated verification suites guarantee full test coverage:

### 1. Acceptance Scenarios Suite (`tests/integration/test_all_20_scenarios.ts`)
Executes the native GnuCOBOL binary and verifies persistence across 20 distinct business cases:
- **Scenario 1**: High Merit Tier 1 (CGPA >= 9.00 -> INR 20,000) `[PASS]`
- **Scenario 2**: Mid Merit Tier 2 (CGPA >= 8.00 -> INR 15,000) `[PASS]`
- **Scenario 3**: Threshold Merit Tier 3 (CGPA >= 7.50 -> INR 10,000) `[PASS]`
- **Scenario 4**: Academic Rejection (CGPA < 7.50 -> `REJ-CGPA`) `[PASS]`
- **Scenario 5**: Attendance Rejection (Attendance < 75% -> `REJ-ATTN`) `[PASS]`
- **Scenario 6**: Financial Rejection (Income > 250,000 -> `REJ-INCOME`) `[PASS]`
- **Scenario 7**: Arrears Rejection (Arrears > 0 -> `REJ-ARREAR`) `[PASS]`
- **Scenario 8**: Multiple Failure Criteria (`REJ-MULTPL`) `[PASS]`
- **Scenario 9**: Duplicate Detection Engine (`DUP3001` tracking) `[PASS]`
- **Scenario 10**: Database Duplicate Prevention (`uq_student_scheme`) `[PASS]`
- **Scenario 11**: Student Format Validation (`STU1001`) `[PASS]`
- **Scenario 12**: Mandatory Field Integrity `[PASS]`
- **Scenario 13**: CGPA Out of Range (`REJ-INVDAT`) `[PASS]`
- **Scenario 14**: Attendance Out of Range (`REJ-INVDAT`) `[PASS]`
- **Scenario 15**: Missing Bank IFSC (`REJ-INVDAT`) `[PASS]`
- **Scenario 16**: Disbursement Generated Exclusively for Eligible Candidates `[PASS]`
- **Scenario 17**: Duplicate Disbursement Shielding `[PASS]`
- **Scenario 18**: Formatted 132-Column SYSOUT Audit Report `[PASS]`
- **Scenario 19**: PostgreSQL Relational Persistence `[PASS]`
- **Scenario 20**: Mainframe Condition Return Code (`RC 0004` / `RC 0000`) `[PASS]`

### 2. Security & Concurrency Suite (`tests/integration/test_security_and_api.ts`)
- `Test 1`: Enforces strong `JWT_SECRET` (>= 32 chars).
- `Test 2`: Rejects weak/missing secrets at server startup.
- `Test 3`: Validates RBAC user roles in database (`ADMIN`, `OPERATOR`, `AUDITOR`).
- `Test 4`: Cryptographic JWT signing and payload validation.
- `Test 5`: Rejection of tampered tokens.
- `Test 6`: Atomic `app_id_seq` collision-free incrementation.
- `Test 7`: Duplicate batch execution guard (409 Conflict on running jobs).
- `Test 8`: Sensitive bank account number masking.
- `Test 9`: Duplicate disbursement settlement defense (409 Conflict).
- `Test 10`: Idempotent core scholarship scheme provisioning (`MERIT1`, `TECH02`).

### 3. HTTP Endpoints & RBAC Suite (`tests/integration/test_http_endpoints.ts`)
- Validates 401 Unauthorized on unauthenticated requests.
- Validates 403 Forbidden when AUDITOR attempts data modification.
- Validates 201 Created on authorized ADMIN creation.
- Validates 409 Conflict on duplicate student ID submission.
- Validates public health check (`/api/health`).

---

## 7. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) running on port 5432
- GnuCOBOL (v3.1+)

### 1. Database & Initial Administrator Provisioning
```bash
# In PostgreSQL
CREATE DATABASE scholarship_db;

# Configure backend environment (.env)
cp backend/.env.example backend/.env
# Edit backend/.env to set your JWT_SECRET and ADMIN_PASSWORD

# Run migrations and secure admin initialization
npm --prefix backend run init-admin

# (Optional) Seed 15 benchmark demo students for development
npm --prefix backend run seed:demo
```

### 2. Start Backend REST API
```bash
cd backend
npm install
npm run build
npm start
```
Healthcheck: `http://localhost:5000/api/health`.

### 3. Start Frontend Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Dashboard: `http://localhost:5173`.
Initial administrator credentials:
- Username: `admin`
- Password: (As configured in `ADMIN_PASSWORD` in `backend/.env`)

---

## 8. Cloud & Production Deployment

### 8.1 Docker Multi-Stage Container
The root `Dockerfile` compiles the COBOL binary using Debian bookworm and GnuCOBOL, builds the TypeScript backend, and packages a secure runtime image:
```bash
docker build -t smart-scholarship-app .
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/scholarship_db?sslmode=require" \
  -e JWT_SECRET="your-high-entropy-jwt-secret-minimum-32-chars" \
  -e ADMIN_PASSWORD="your-strong-production-admin-password" \
  smart-scholarship-app
```

### 8.2 Render Web Service Deployment (`render.yaml`)
`render.yaml` declares an infrastructure-as-code blueprint:
1. **Web Service**: Docker runtime executing Node.js REST API + native GnuCOBOL `MAIN0001`.
2. **Managed PostgreSQL**: Persistent database instance with secure SSL connection string.

### 8.3 Vercel Frontend Deployment
- Root Directory: `dashboard/`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_BASE_URL` pointing to the deployed backend URL.

---

## 9. Mainframe Environment Honesty Statement

In accordance with architectural transparency and engineering integrity:
- **Local / Cloud Environment**: The batch processing engine compiles and runs genuine COBOL source files natively via **GnuCOBOL 3.1.2** on Linux/Windows, orchestrating fixed-width sequential datasets through Node.js child processes and storing relational data in PostgreSQL.
- **IBM z/OS Mainframe**: The JCL (`//BATELG01`), VSAM KSDS cluster definitions (`IDCDEF01`), and Db2 DDL scripts (`CREATE_TABLES.sql`) provided in `mainframe/` are Enterprise COBOL and IBM z/OS v2.5 compatible. They represent real, deployable mainframe assets intended for upload to a live z/OS system via Zowe Explorer or IBM Z Xplore.
- **No Fictitious Claims**: Simulated JES2 mainframe job numbers in the demo spool modal are explicitly distinguished from real live executions; actual batch processing runs report real process execution IDs, timestamps, and return codes (`RC 0000`, `RC 0004`).
