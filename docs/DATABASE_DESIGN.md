# Database Design & Storage Subsystems

## 1. Overview

The data tier of the **Smart Scholarship System** utilizes a hybrid architecture:
- **VSAM Key-Sequenced Data Set (KSDS)**: High-speed, low-overhead indexed direct access for student master demographic records.
- **IBM Db2 for z/OS (Relational Subsystem DSN1)**: Normalized relational tables with primary keys, foreign keys, indexes, check constraints, and transactional consistency.

---

## 2. VSAM KSDS Cluster Specification

- **Cluster Name**: `USERID.SCHOLAR.VSAM.STUMAST.KSDS`
- **Data Component**: `USERID.SCHOLAR.VSAM.STUMAST.KSDS.DATA`
- **Index Component**: `USERID.SCHOLAR.VSAM.STUMAST.KSDS.INDEX`
- **Record Format**: Fixed (150 bytes)
- **Primary Key**: `STU-ID` (Length: 10 bytes, Offset: 0)
- **Freespace**: `(15 10)` (15% CI, 10% CA freespace for splits)
- **Share Options**: `(2 3)` (Read-shared across multiple batch steps, single writer)

### Record Field Layout (`STUREC.cpy`)

| Field Name | COBOL Picture | Length | Start Pos | End Pos | Description |
|---|---|---|---|---|---|
| `STU-ID` | `PIC X(10)` | 10 | 1 | 10 | Primary Key (e.g., `STU2024001`) |
| `STU-NAME` | `PIC X(30)` | 30 | 11 | 40 | Student Full Name |
| `STU-DOB` | `PIC X(08)` | 8 | 41 | 48 | Date of Birth (YYYYMMDD) |
| `STU-GENDER` | `PIC X(01)` | 1 | 49 | 49 | Gender ('M', 'F', 'O') |
| `STU-DEPT` | `PIC X(04)` | 4 | 50 | 53 | Department Code (`CS  `, `IT  `, `ECE `) |
| `STU-YEAR` | `PIC 9(01)` | 1 | 54 | 54 | Year of Study (1 to 4) |
| `STU-SEMESTER` | `PIC 9(02)` | 2 | 55 | 56 | Semester (01 to 08) |
| `STU-EMAIL` | `PIC X(35)` | 35 | 57 | 91 | Institutional Email Address |
| `STU-PHONE` | `PIC X(10)` | 10 | 92 | 101 | Contact Telephone Number |
| `STU-ENROLL-DATE`| `PIC X(08)` | 8 | 102 | 109 | Enrollment Date (YYYYMMDD) |
| `STU-STATUS` | `PIC X(01)` | 1 | 110 | 110 | Status ('A'=Active, 'S'=Suspended, 'G'=Graduated) |
| `STU-FILLER` | `PIC X(40)` | 40 | 111 | 150 | Reserved for future mainframe expansion |

---

## 3. IBM Db2 Relational Schema

```mermaid
erDiagram
    STUDENT_MASTER ||--o{ SCHOLARSHIP_APPLICATION : "submits"
    SCHOLARSHIP_MASTER ||--o{ SCHOLARSHIP_APPLICATION : "offers"
    SCHOLARSHIP_APPLICATION ||--|| ELIGIBILITY_RESULT : "evaluates to"
    SCHOLARSHIP_APPLICATION ||--o| DISBURSEMENT_RECORD : "generates payment"
    PROCESSING_AUDIT ||--o{ ELIGIBILITY_RESULT : "batches"

    STUDENT_MASTER {
        CHAR(10) STU_ID PK
        VARCHAR(30) FIRST_NAME
        VARCHAR(30) LAST_NAME
        DATE DOB
        CHAR(1) GENDER
        CHAR(4) DEPARTMENT
        SMALLINT YEAR_OF_STUDY
        SMALLINT SEMESTER
        VARCHAR(60) EMAIL
        CHAR(10) PHONE
        DATE ENROLL_DATE
        CHAR(1) STATUS
    }

    SCHOLARSHIP_MASTER {
        CHAR(6) SCH_CODE PK
        VARCHAR(60) SCH_NAME
        VARCHAR(255) SCH_DESC
        DECIMAL(4_2) MIN_CGPA
        DECIMAL(5_2) MIN_ATTENDANCE
        DECIMAL(10_2) MAX_ANNUAL_INCOME
        SMALLINT MAX_ACTIVE_ARREARS
        CHAR(1) IS_ACTIVE
    }

    SCHOLARSHIP_APPLICATION {
        CHAR(10) APP_ID PK
        CHAR(10) STU_ID FK
        CHAR(6) SCH_CODE FK
        DATE APP_DATE
        DECIMAL(4_2) CGPA
        DECIMAL(5_2) ATTENDANCE_PCT
        DECIMAL(10_2) FAMILY_INCOME
        SMALLINT ACTIVE_ARREARS
        VARCHAR(18) BANK_AC_NUM
        CHAR(11) BANK_IFSC
        VARCHAR(12) STATUS
    }

    ELIGIBILITY_RESULT {
        INTEGER EVAL_ID PK
        CHAR(10) APP_ID FK
        CHAR(10) STU_ID
        CHAR(6) SCH_CODE
        CHAR(1) STATUS
        VARCHAR(10) REASON_CODE
        DECIMAL(9_2) AWARD_AMOUNT
        CHAR(10) BATCH_ID
        TIMESTAMP PROCESSED_TS
    }

    DISBURSEMENT_RECORD {
        CHAR(12) DISB_REF_ID PK
        CHAR(10) APP_ID FK
        CHAR(10) STU_ID
        DECIMAL(9_2) AMOUNT
        VARCHAR(18) BANK_AC_NUM
        CHAR(11) BANK_IFSC
        VARCHAR(10) STATUS
        VARCHAR(16) UTR_NUMBER
        CHAR(10) BATCH_ID
        DATE VALUE_DATE
    }

    PROCESSING_AUDIT {
        INTEGER AUDIT_ID PK
        CHAR(10) BATCH_ID
        CHAR(8) JOB_NAME
        INTEGER RECS_READ
        INTEGER RECS_VALID
        INTEGER RECS_ELIGIBLE
        INTEGER RECS_REJECTED
        INTEGER RECS_DUPLICATE
        DECIMAL(12_2) TOTAL_DISBURSED_AMT
        SMALLINT RETURN_CODE
        TIMESTAMP START_TS
        TIMESTAMP END_TS
    }
```

---

## 4. Referential Integrity & Constraints

1. **Unique Indexes**:
   - `IX_STU_EMAIL`: Enforces unique email per student.
   - `IX_DISB_APP_UNIQUE`: Enforces that no scholarship application can have more than one disbursement record, mathematically preventing double disbursement at the database layer.
2. **Composite Indexes**:
   - `IX_APP_STU_CYCLE (STU_ID, SCH_CODE)`: Rapid lookup for duplicate application detection.
   - `IX_STU_DEPT (DEPARTMENT, YEAR_OF_STUDY)`: Fast filtering for department award allocations.
3. **Check Constraints**:
   - `CK_APP_CGPA`: `CGPA BETWEEN 0.00 AND 10.00`
   - `CK_APP_ATTN`: `ATTENDANCE_PCT BETWEEN 0.00 AND 100.00`
   - `CK_ELIG_STATUS`: `STATUS IN ('E', 'R', 'D', 'I')`
   - `CK_DISB_STATUS`: `STATUS IN ('PENDING', 'PROCESSED', 'FAILED', 'HOLD')`
