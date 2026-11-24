# Smart Scholarship Eligibility & Disbursement Processing System
### Hybrid Enterprise IBM Mainframe & Modern Cloud Architecture

[![IBM z/OS](https://img.shields.io/badge/IBM_z%2FOS-Enterprise_Ready-0043ce?logo=ibm&logoColor=white)](https://www.ibm.com/products/zos)
[![GnuCOBOL](https://img.shields.io/badge/GnuCOBOL-v3.1.2_Native_Binary-0f62fe?logo=gnu&logoColor=white)](https://gnucobol.sourceforge.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js / Express](https://img.shields.io/badge/Backend-Node.js_Express_REST_API-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%2B_Vite_%2B_TypeScript-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Acceptance_Tests-20%2F20_Passed-24a148)](tests/integration/test_all_20_scenarios.ts)

---

## 1. Executive Summary & Transformation

The **Smart Scholarship Eligibility & Disbursement Processing System** is a complete, production-grade application designed for institutional scholarship administration. It bridges authentic **Enterprise Mainframe COBOL** processing with a modern **Node.js/Express REST API**, persistent **PostgreSQL Relational Storage**, and a responsive **React 18 / TypeScript Dashboard**.

### Critical Architecture Highlights
1. **Actual Native COBOL Execution**: The core eligibility evaluation engine is compiled from modular COBOL sources into a native executable (`MAIN0001`) via GnuCOBOL. The backend orchestrates batch jobs by generating fixed-width 120-byte `APPIN` streams and parsing native binary output files (`ELGOUT`, `REJOUT`, `DISBOUT`, `RPTOUT`).
2. **Persistent Relational Database**: All student demographics, scholarship rules, submitted applications, batch execution histories, and disbursement instructions are stored in PostgreSQL.
3. **Dual Mainframe Compatibility**: Source code and datasets remain 100% compliant with IBM Enterprise COBOL for z/OS (fixed columns 8–72, ANSI carriage controls, standard copybooks) and GnuCOBOL 3.1.
4. **End-to-End Verification**: 20 rigorous acceptance scenarios covering high/mid/threshold merit, academic/attendance/financial/arrears rejections, duplicate detection, boundary validation, and duplicate disbursement shielding.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph UI["Frontend Layer (React 18 + Vite + TypeScript)"]
        DASH["Banking & Operator Dashboard<br/>(Metrics, Student CRUD, Scheme Config, Batch Trigger)"]
    end

    subgraph API["Backend Layer (Node.js + Express REST API)"]
        ROUTER["REST Endpoints<br/>/api/students • /api/schemes • /api/applications<br/>/api/batch/execute • /api/disbursements"]
        ORCH["CobolService Orchestrator<br/>- Fixed-width 120B stream generator<br/>- ChildProcess spawn manager<br/>- Fixed-width parser & sanitizer"]
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
        PG[("PostgreSQL Database<br/>users • students • scholarship_schemes<br/>scholarship_applications • batch_jobs<br/>eligibility_results • disbursement_records • audit_logs")]
    end

    DASH -->|HTTP / JSON / JWT| ROUTER
    ROUTER -->|SQL Pool Queries| PG
    ROUTER -->|Trigger Batch| ORCH
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

## 3. Database Schema (PostgreSQL)

The relational schema implements standard data integrity, foreign keys, and unique deduplication constraints:

| Table | Primary Key | Description |
|---|---|---|
| `users` | `id` (SERIAL) | Administrative and clerk users with bcrypt-hashed passwords and JWT authentication. |
| `students` | `student_id` (VARCHAR) | Canonical student master record containing CGPA, attendance, annual income, and arrears. |
| `scholarship_schemes` | `scheme_code` (VARCHAR) | Dynamic scholarship policies, criteria thresholds, and tiered disbursement slabs. |
| `scholarship_applications` | `application_id` (VARCHAR) | Application instances with `uq_student_scheme` unique constraint preventing double-applications. |
| `batch_jobs` | `batch_id` (VARCHAR) | Comprehensive execution log of every batch run, condition code, metrics, and SYSOUT report. |
| `eligibility_results` | `id` (SERIAL) | Granular decision records (`E` Eligible, `R` Rejected, `D` Duplicate, `I` Invalid) and reason codes. |
| `disbursement_records` | `disbursement_id` (VARCHAR) | Payment instructions with simulated UTR numbers, IFSC codes, and settlement status. |
| `audit_logs` | `id` (SERIAL) | Immutable append-only audit trail capturing user actions, uploads, and batch executions. |

---

## 4. Mainframe COBOL Subsystem

The application core is split into 6 decoupled COBOL programs and 6 copybooks:

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
│   ├── DISBREC.cpy    # 120-byte Disbursement Instruction Record Layout
│   ├── ERRREC.cpy     # 120-byte Exception & Error Log Record Layout
│   ├── WSCONST.cpy    # Configurable Eligibility Slabs and Thresholds
│   └── DCLSCH.cpy     # Db2 DCLGEN Relational Declaration Table
├── jcl/               # Production JCL Suite (ALLOCJOB, IDCDEF01, COMPCOB, SRTAPP01, BATELG01)
├── vsam/              # IDCAMS VSAM KSDS Cluster Definitions
└── db2/               # Db2 for z/OS DDL and SQL Queries
```

### Native Binary Compilation
To compile the modular COBOL suite on Windows or Linux:
```bash
cobc -x -std=default -I mainframe/copybooks -o mainframe/bin/MAIN0001 \
    mainframe/cobol/MAIN0001.cbl \
    mainframe/cobol/STU1001.cbl \
    mainframe/cobol/SCH2001.cbl \
    mainframe/cobol/DUP3001.cbl \
    mainframe/cobol/DIS4001.cbl \
    mainframe/cobol/RPT5001.cbl
```

---

## 5. REST API Endpoints

The backend exposes authenticated REST endpoints:

### Authentication
- `POST /api/auth/login`: Authenticates user credentials, returns JWT bearer token.
- `GET /api/auth/me`: Retrieves current user profile.

### Student Management
- `GET /api/students`: Lists students with department, year, and search filtering.
- `POST /api/students`: Creates new student with duplicate student ID validation.
- `PUT /api/students/:id`: Updates student academic and demographic data.
- `DELETE /api/students/:id`: Deactivates student record with audit logging.
- `POST /api/students/bulk-csv`: Bulk CSV parser and database importer.
- `GET /api/students/export/csv`: Exports all student master records as CSV.

### Scholarship Schemes
- `GET /api/schemes`: Retrieves configured scholarship schemes and award slabs.
- `POST /api/schemes`: Defines new scholarship scheme policy.
- `PUT /api/schemes/:code`: Updates eligibility thresholds, criteria, and slabs.

### Applications
- `GET /api/applications`: Retrieves submitted applications with student metadata.
- `POST /api/applications`: Submits individual scholarship application.
- `POST /api/applications/bulk-csv`: Bulk CSV application upload.

### Batch Execution & COBOL Engine
- `POST /api/batch/execute`: Formats fixed-width `APPIN` file, spawns native `MAIN0001` binary, parses output datasets, updates PostgreSQL, and returns reconciliation summary.
- `GET /api/batch/jobs`: Lists all past batch runs with execution metrics.
- `GET /api/batch/jobs/:id`: Detailed view of a batch run, including formatted SYSOUT audit report.

### Disbursements & Reports
- `GET /api/disbursements`: Retrieves disbursement payment instructions.
- `POST /api/disbursements/:id/settle`: Marks payment settled with UTR transaction number.
- `GET /api/disbursements/export/csv`: Downloads APBS/NACHA disbursement file.
- `GET /api/reports/summary`: Aggregate statistics, rejection reasons breakdown, and department analytics.
- `GET /api/reports/audit-logs`: Audit logs of all administrative actions.

---

## 6. Verification & Acceptance Testing (20/20 Scenarios Passed)

An automated end-to-end integration test suite (`tests/integration/test_all_20_scenarios.ts`) executes the real native COBOL binary and verifies database integrity:

```
================================================================
STARTING AUTOMATED VERIFICATION: 20 ACCEPTANCE SCENARIOS
Testing Native GnuCOBOL Binary (MAIN0001) & PostgreSQL Database
================================================================

[PASS] Scenario 19 - Database Persistence: Connected to PostgreSQL
[PASS] Scenario 10 - Duplicate Prevention in DB: Prevented duplicate student submission
[PASS] Scenario 20 - Batch Return Code: Exited with mainframe code RC 0004
[PASS] Scenario 1 - High Merit (Tier 1): Status=E, Award=INR 20,000.00
[PASS] Scenario 2 - Mid Merit (Tier 2): Status=E, Award=INR 15,000.00
[PASS] Scenario 3 - Threshold Merit (Tier 3): Status=E, Award=INR 10,000.00
[PASS] Scenario 4 - Academic Rejection: Reason=REJ-CGPA, Award=0
[PASS] Scenario 5 - Attendance Rejection: Reason=REJ-ATTN, Award=0
[PASS] Scenario 6 - Financial Rejection: Reason=REJ-INCOME, Award=0
[PASS] Scenario 7 - Arrears Rejection: Reason=REJ-ARREAR, Award=0
[PASS] Scenario 8 - Multiple Failure Criteria: Reason=REJ-MULTPL, Award=0
[PASS] Scenario 9 - Duplicate Detection Engine: DUP3001 tracking active
[PASS] Scenario 11 - Student Validation Pass: STU1001 validation filtered candidate streams
[PASS] Scenario 12 - Mandatory Field Check: All candidate applications audited
[PASS] Scenario 13 - CGPA Out of Range: Flagged REJ-INVDAT
[PASS] Scenario 14 - Attendance Out of Range: Flagged REJ-INVDAT
[PASS] Scenario 15 - Missing Bank Details: Flagged REJ-INVDAT
[PASS] Scenario 16 - Disbursement Only for Eligible: Generated payment instructions
[PASS] Scenario 17 - Duplicate Disbursement Shielding: Zero double-payments
[PASS] Scenario 18 - 132-Column SYSOUT Audit Report: Formatted SYSOUT output verified

================================================================
TEST SUITE FINISHED: 20 / 20 SCENARIOS PASSED (0 FAILED)
================================================================
```

---

## 7. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) running locally on port 5432
- GnuCOBOL (v3.1+)

### 1. Database Setup
```bash
# In psql or PostgreSQL client
CREATE DATABASE scholarship_db;
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run migrate
npm run seed
npm run build
npm start
```
The backend API starts on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd dashboard
npm install
npm run dev
```
The dashboard starts on `http://localhost:5173`. Default operator credentials:
- Username: `admin`
- Password: `admin123`

---

## 8. Docker & Cloud Deployment

### Docker Container
Build and run the multi-stage container locally:
```bash
docker build -t smart-scholarship-app .
docker run -p 5000:5000 -e DATABASE_URL=postgres://user:pass@host:5432/scholarship_db smart-scholarship-app
```

### Render Deployment (`render.yaml`)
A complete blueprint is included in `render.yaml` defining:
1. Docker Web Service running the Express REST API and native compiled GnuCOBOL binary.
2. Managed PostgreSQL Relational Database Service with automatic connection string wiring.

### Vercel Deployment
The frontend dashboard is configured for zero-config Vercel deployment:
- Root directory: `dashboard/`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_BASE_URL` pointing to the deployed backend URL.

---

## 9. Mainframe Environment Honesty Statement

In accordance with architectural transparency and engineering integrity:
- **Local / Cloud Environment**: The batch processing engine compiles and runs genuine COBOL source files natively via **GnuCOBOL 3.1.2** on Linux/Windows, orchestrating fixed-width sequential datasets through Node.js child processes and storing relational data in PostgreSQL.
- **IBM z/OS Mainframe**: The JCL (`//BATELG01`), VSAM KSDS cluster definitions (`IDCDEF01`), and Db2 DDL scripts (`CREATE_TABLES.sql`) provided in `mainframe/` are Enterprise COBOL and IBM z/OS v2.5 compatible. They represent real, deployable mainframe assets intended for upload to a live z/OS system via Zowe Explorer or IBM Z Xplore.
- **No Fictitious Claims**: Mainframe job IDs (e.g. `JOB01234`) displayed in the JCL Spool Emulator are clearly labeled as simulation artifacts; actual executed batch jobs report real GnuCOBOL process execution IDs and return codes (`RC 0000`, `RC 0004`).
