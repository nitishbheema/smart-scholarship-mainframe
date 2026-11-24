# JCL Execution & Mainframe Operations Guide

## 1. Job Suite Overview

The JCL suite automates the complete operational lifecycle on IBM z/OS:

| JCL Member | Job Name | Primary Step & Utilities | Description |
|---|---|---|---|
| **`ALLOCJOB.jcl`** | `ALLOCJOB` | `IEFBR14` | Allocates partitioned datasets (PDS) and sequential files |
| **`IDCDEF01.jcl`** | `IDCKSDS0` | `IDCAMS` | Defines VSAM KSDS cluster, allocates CI/CA, REPRO loads student records |
| **`COMPCOB.jcl`** | `COMPCOB` | `IGYCRCTL`, `IEWBLINK` | Compiles subprograms and links `MAIN0001` into `LOADLIB` |
| **`DB2PREP.jcl`** | `DB2PREP` | `DSNHPC`, `IKJEFT01` | Db2 precompile, compile, bind package and plan |
| **`SRTAPP01.jcl`** | `SRTAPP01` | `SORT` (DFSORT) | Sorts application feed by student ID and deduplicates with `SUM FIELDS=NONE` |
| **`BATELG01.jcl`** | `BATELG01` | `IEFBR14`, `MAIN0001`, `IKJEFT01` | Primary production batch pipeline executing eligibility and reporting |
| **`DISPCHK01.jcl`** | `DISPCHK1` | `SORT`, `IDCAMS` | Reconciles generated disbursement payment instructions |

---

## 2. Step-by-Step Execution Sequence

### Stage 1: Dataset Allocation
Submit `ALLOCJOB.jcl` to allocate partitioned libraries and batch files:
```jcl
//STEP010  EXEC PGM=IEFBR14
//COBSRC   DD DSN=USERID.SCHOLAR.COBOL,DISP=(NEW,CATLG,DELETE),SPACE=(CYL,(2,1,10)),DCB=(RECFM=FB,LRECL=80,BLKSIZE=27920)
//COPYLIB  DD DSN=USERID.SCHOLAR.COPYLIB,DISP=(NEW,CATLG,DELETE),SPACE=(CYL,(1,1,10)),DCB=(RECFM=FB,LRECL=80,BLKSIZE=27920)
//LOADLIB  DD DSN=USERID.SCHOLAR.LOADLIB,DISP=(NEW,CATLG,DELETE),SPACE=(CYL,(3,2,10)),DCB=(RECFM=U,BLKSIZE=32760)
```
- **Expected Return Code**: `MAXCC=0000`

### Stage 2: VSAM Cluster Creation & Initial Data Load
Submit `IDCDEF01.jcl` to define the VSAM KSDS and populate from sequential master:
```jcl
//STEP010  EXEC PGM=IDCAMS
  DEFINE CLUSTER (NAME(USERID.SCHOLAR.VSAM.STUMAST.KSDS) -
         INDEXED KEYS(10 0) RECORDSIZE(150 150) FREESPACE(15 10) -
         SHAREOPTIONS(2 3) CYLINDERS(5 2))
//STEP020  EXEC PGM=IDCAMS,COND=(0,NE,STEP010)
  REPRO INFILE(INSEQ) OUTDATASET(USERID.SCHOLAR.VSAM.STUMAST.KSDS)
```
- **Expected Return Code**: `MAXCC=0000`

### Stage 3: COBOL Compilation & Link-Edit
Submit `COMPCOB.jcl` to compile all copybook-dependent programs and bind the executable module:
- Checks condition code after each compilation: `COND=(4,LT,CMPSTU)`
- Binder step `LNKMAIN` combines all object decks into `MAIN0001` in `USERID.SCHOLAR.LOADLIB`.
- **Expected Return Code**: `MAXCC=0000`

### Stage 4: Db2 Precompile and Plan Binding
Submit `DB2PREP.jcl`:
1. `DSNHPC` parses embedded `EXEC SQL` statements in `DB2AUD01.cbl` and produces modified COBOL source and DBRM deck `USERID.SCHOLAR.DBRM(DB2AUD01)`.
2. `IGYCRCTL` compiles modified source.
3. `IEWBLINK` binds executable with Db2 language interface `DSNELI`.
4. `IKJEFT01` binds package in collection `SCHOLAR_COLL` and plan `SCHOLAR_PLAN` in subsystem `DSN1`.
- **Expected Return Code**: `MAXCC=0000`

### Stage 5: Primary Production Batch Execution
Submit `BATELG01.jcl`:
```jcl
//BATELG01 JOB (SCHOLAR,BAT),'SCHOLARSHIP BATCH RUN',CLASS=A,MSGCLASS=X
//CLEAN01  EXEC PGM=IEFBR14
//RUNMAIN  EXEC PGM=MAIN0001
//STEPLIB  DD DSN=USERID.SCHOLAR.LOADLIB,DISP=SHR
//APPIN    DD DSN=USERID.SCHOLAR.DATA.APPL.SORTED,DISP=SHR
//STUMAST  DD DSN=USERID.SCHOLAR.VSAM.STUMAST.KSDS,DISP=SHR
//ELGOUT   DD DSN=USERID.SCHOLAR.DATA.ELIG.APPROVED,DISP=(NEW,CATLG,DELETE),...
//REJOUT   DD DSN=USERID.SCHOLAR.DATA.ELIG.REJECTED,DISP=(NEW,CATLG,DELETE),...
//DISBOUT  DD DSN=USERID.SCHOLAR.DATA.DISB.PAYMENTS,DISP=(NEW,CATLG,DELETE),...
//RPTOUT   DD DSN=USERID.SCHOLAR.REPORT.SYSOUT.ARCHIVE,DISP=(NEW,CATLG,DELETE),...
//AUDITDB2 EXEC PGM=IKJEFT01,COND=(4,LT,RUNMAIN)
```
- **Expected Return Code**: `MAXCC=0000`

---

## 3. JES2 Spool Inspection & Error Recovery

### JES2 Output Commands (TSO / SDSF)
- `ST`: Display status of jobs in JES2 input and output queues.
- `?`: Open job datasets (JESMSGLG, JESJCL, JESYSMSG, SYSOUT, SYSPRINT).
- `SE`: Edit/View held output dataset in full-screen ISPF editor.

### Restart & Recovery Procedures
- **If `RUNMAIN` abends with S0C7 (Data Exception)**:
  Check `EXCOUT` exception log. Verify uncompressed numeric fields in sequential feed `APPIN`. Ensure decimal points are not coded in integer/decimal packed fields.
- **If `RUNMAIN` abends with File Status `35` on `APPIN`**:
  Dataset not found. Verify `SRTAPP01` completed with `RC 0000` and created `USERID.SCHOLAR.DATA.APPL.SORTED`.
- **If `RUNMAIN` reports File Status `97` on `STUMAST`**:
  VSAM dataset was opened after improper previous closure. JCL includes implicit `VERIFY` step in `IDCDEF01` to repair high-used RBA.
