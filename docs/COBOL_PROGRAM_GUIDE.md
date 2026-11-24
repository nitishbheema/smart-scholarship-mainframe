# COBOL Programs & Architecture Guide

## 1. Program Suite Summary

The application suite consists of 6 core Enterprise COBOL modules and 1 Db2 embedded SQL service:

| Program ID | Type | Primary Function | Called By / Driver |
|---|---|---|---|
| **`MAIN0001`** | Main Controller | Opens datasets, orchestrates batch loop, coordinates subroutines, prints audit summary | JCL `BATELG01` |
| **`STU1001`** | Subprogram | Data integrity validation: ID prefix, CGPA range (0-10), Attendance (0-100), Arrears numeric | `MAIN0001` |
| **`SCH2001`** | Subprogram | Configurable eligibility evaluation engine and award amount slab computation | `MAIN0001` |
| **`DUP3001`** | Subprogram | In-flight batch deduplication and student cycle collision detection | `MAIN0001` |
| **`DIS4001`** | Subprogram | Electronic payment instruction formatter with duplicate payout shielding | `MAIN0001` |
| **`RPT5001`** | Subprogram | Formats 132-column ANSI carriage control print records for mainframe line printers | `MAIN0001` |
| **`DB2AUD01`** | Db2 Subprogram | Embedded SQL program persisting batch execution metrics into `PROCESSING_AUDIT` | JCL Step `AUDITDB2` |

---

## 2. Program Details

### `MAIN0001.cbl` - Master Batch Controller
- **File Control**:
  - `APP-FILE ASSIGN TO APPIN`: Sequential application input feed (`LRECL=120`).
  - `VSAM-STU-FILE ASSIGN TO STUMAST`: Keyed direct indexed access (`ORGANIZATION IS INDEXED, ACCESS MODE IS RANDOM, RECORD KEY IS STU-ID`).
  - `ELIG-FILE ASSIGN TO ELGOUT`: Eligible records output dataset.
  - `REJ-FILE ASSIGN TO REJOUT`: Rejected records output dataset.
  - `DISB-FILE ASSIGN TO DISBOUT`: Payment instructions dataset.
  - `EXC-FILE ASSIGN TO EXCOUT`: Exception audit dataset.
  - `RPT-FILE ASSIGN TO RPTOUT`: Formatted 132-column print dataset (`RECORDING MODE F, RECFM=FBA, LRECL=133`).
- **Processing Loop**:
  Reads `APP-FILE` until `WS-EOF-APP = 'Y'`. Validates each record via `STU1001`, checks duplicates via `DUP3001`, fetches student master record from VSAM via `READ VSAM-STU-FILE`, evaluates rules via `SCH2001`, and generates disbursement records via `DIS4001`.

### `STU1001.cbl` - Student Record Validator
- **Parameters**: `USING SCHOLARSHIP-APP-RECORD, LS-STU-VAL-COMM-AREA`.
- **Validation Rules**:
  - Mandatory field verification: `APP-ID`, `APP-STU-ID`, `APP-SCH-CODE`, `APP-BANK-AC-NUM`, `APP-BANK-IFSC` must not be spaces or low-values.
  - Format verification: `APP-STU-ID` must start with `STU` and trailing 7 characters must be numeric (`STU2024001`). `APP-ID` must start with `APP`.
  - Numeric boundary checks: `APP-CGPA` between `0.00` and `10.00`. `APP-ATTENDANCE` between `0.00` and `100.00`.
- **Return Codes**: `0000` (Success), `0008` (Validation Error), `0012` (Severe missing data).

### `SCH2001.cbl` - Configurable Scholarship Engine
- **Decoupled Business Rules**:
  Uses `WSCONST.cpy` copybook constants. Can be dynamically overridden at runtime via parameter datasets without modifying program logic:
  - `CFG-MIN-CGPA` = `07.50`
  - `CFG-MIN-ATTENDANCE` = `075.00`
  - `CFG-MAX-ANNUAL-INCOME` = `00250000.00`
  - `CFG-MAX-ALLOWED-ARREARS` = `00`
- **Configurable Slabs Table (`CFG-SLAB-TABLE OCCURS 3`)**:
  - Slab 1 (High Merit): CGPA 9.00 to 10.00 &rarr; ₹20,000
  - Slab 2 (Merit Tier 2): CGPA 8.00 to 8.99 &rarr; ₹15,000
  - Slab 3 (Merit Tier 3): CGPA 7.50 to 7.99 &rarr; ₹10,000
- **Rejection Reason Audit Codes**:
  - `REJ-CGPA`: CGPA below 7.50
  - `REJ-ATTN`: Attendance below 75%
  - `REJ-INCOME`: Family income exceeds ₹2,50,000
  - `REJ-ARREAR`: Active arrears present (> 0)
  - `REJ-MULTPL`: Candidate failed 2 or more criteria simultaneously

### `DUP3001.cbl` - Duplicate Application Detector
- Maintains an in-flight hash table (`WS-SEEN-TABLE OCCURS 500 TIMES`).
- Intercepts:
  1. Exact duplicate application IDs (`REJ-DUPAPP`).
  2. Duplicate applications from the same student in the same scholarship scheme cycle (`REJ-DUPSTU`).

### `DIS4001.cbl` - Disbursement Payment Processor
- Generates simulated electronic payment advice in NACHA / APBS standard format.
- Generates unique reference ID: `DSB` + Year + 6-digit sequence number (`DSB2024000001`).
- Generates unique simulated bank transaction number (UTR): `UTR` + YYYYMMDD + sequence + `IN` (`UTR202410150001IN`).
- **Duplicate Disbursement Prevention**: Maintains internal paid records table (`WS-PAID-HISTORY-TABLE`). Blocks any subsequent payment request for an already-disbursed student or application with return code `0008` (`ERR-DUP-DISB`).

### `RPT5001.cbl` - Mainframe Report Generator
- Formats 132-column line printer reports with ANSI carriage control characters in column 1:
  - `'1'` = Page eject / Top of form
  - `' '` = Single space
  - `'0'` = Double space
  - `'-'` = Triple space
- Generates Eligible Students Roster, Rejected Candidates Audit, and Batch Reconciliation Ledger.

### `DB2AUD01.cbl` - Db2 Embedded SQL Audit Service
- Demonstrates embedded SQL on IBM z/OS:
  ```cobol
  EXEC SQL
      INSERT INTO PROCESSING_AUDIT
      (BATCH_ID, JOB_NAME, RECS_READ, RECS_VALID, RECS_ELIGIBLE,
       RECS_REJECTED, RECS_DUPLICATE, TOTAL_DISBURSED_AMT, RETURN_CODE,
       START_TS, END_TS, EXECUTED_BY)
      VALUES
      (:H-AUD-BATCH-ID, :H-AUD-JOB-NAME, :H-AUD-RECS-READ,
       :H-AUD-RECS-VALID, :H-AUD-RECS-ELIG, :H-AUD-RECS-REJ,
       :H-AUD-RECS-DUP, :H-AUD-TOTAL-AMOUNT, :H-AUD-RETURN-CODE,
       CURRENT TIMESTAMP, CURRENT TIMESTAMP, 'ZOSBATCH')
  END-EXEC.
  ```
- Checks `SQLCODE`: On `0`, issues `EXEC SQL COMMIT END-EXEC`; on failure, issues `EXEC SQL ROLLBACK END-EXEC`.
