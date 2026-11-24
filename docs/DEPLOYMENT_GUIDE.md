# Mainframe & Frontend Deployment Guide

## 1. Mainframe z/OS Deployment (IBM Z Xplore / Authorized z/OS LPAR)

### Prerequisites
- Access to an authorized IBM z/OS environment (via TSO/ISPF, IBM Z Xplore, or Zowe CLI / Zowe Explorer for VS Code).
- RACF user ID with authority to create datasets under the configured high-level qualifier (`USERID.*`).
- Db2 for z/OS subsystem (`DSN1`) with BIND privileges on collection `SCHOLAR_COLL` and plan `SCHOLAR_PLAN`.

### Step 1: Upload Source Datasets
Using Zowe CLI or FTP:
```bash
# Upload Partitioned Datasets (COBOL Sources and Copybooks)
zowe files upload dir-to-pds mainframe/cobol "USERID.SCHOLAR.COBOL"
zowe files upload dir-to-pds mainframe/copybooks "USERID.SCHOLAR.COPYLIB"
zowe files upload dir-to-pds mainframe/jcl "USERID.SCHOLAR.JCL"

# Upload Sequential Raw Input Datasets
zowe files upload file-to-data-set mainframe/datasets/STUMAST_SEQ.dat "USERID.SCHOLAR.DATA.STUMAST.SEQ"
zowe files upload file-to-data-set sample-data/applications/SCHOLARSHIP_APPLICATIONS.dat "USERID.SCHOLAR.DATA.APPL.RAW"
```

### Step 2: Allocate Storage & Define VSAM KSDS
Submit `ALLOCJOB.jcl` followed by `IDCDEF01.jcl`:
```bash
zowe jobs submit ds "USERID.SCHOLAR.JCL(ALLOCJOB)" --wait-for-active --wait-for-output
zowe jobs submit ds "USERID.SCHOLAR.JCL(IDCDEF01)" --wait-for-active --wait-for-output
```
Verify JES2 Spool: `MAXCC=0000`.

### Step 3: Compile COBOL Modules and Bind Load Modules
Submit `COMPCOB.jcl`:
```bash
zowe jobs submit ds "USERID.SCHOLAR.JCL(COMPCOB)" --wait-for-active --wait-for-output
```
Verify that load module `MAIN0001` exists in `USERID.SCHOLAR.LOADLIB`.

### Step 4: Execute Db2 DDL and Bind Package
Run `CREATE_TABLES.sql` and `SAMPLE_INSERTS.sql` via SPUFI or `DSNTEP2`, then submit `DB2PREP.jcl`:
```bash
zowe jobs submit ds "USERID.SCHOLAR.JCL(DB2PREP)" --wait-for-active --wait-for-output
```

### Step 5: Execute Mainframe Batch Production Pipeline
Submit `BATELG01.jcl`:
```bash
zowe jobs submit ds "USERID.SCHOLAR.JCL(BATELG01)" --wait-for-active --wait-for-output
```
Inspect SYSOUT output in SDSF:
```text
MAIN0001: SMART SCHOLARSHIP BATCH ENGINE EXECUTED
MAIN0001: 5 CANDIDATES APPROVED | 10 REJECTED | 2 DUPLICATES INTERCEPTED
MAIN0001: TOTAL DISBURSED: INR 75,000.00
$HASP395 BATELG01 ENDED - RC=0000
```

---

## 2. Frontend Dashboard Deployment on Vercel

The frontend is an enterprise React 18, Vite, and TypeScript SPA styled with Tailwind CSS.

### Local Verification
```bash
cd dashboard
npm install
npm run build
```
Verify that the `dist/` bundle compiles with 0 errors.

### Deploying to Vercel via CLI
```bash
cd dashboard
npx vercel --prod
```

### Deploying via Vercel Web Dashboard (Git Integration)
1. Push the repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete IBM mainframe scholarship processing system"
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com).
3. Click **Add New Project** and import the GitHub repository.
4. Set **Root Directory** to `dashboard`.
5. Framework Preset: **Vite**.
6. Build Command: `npm run build`.
7. Output Directory: `dist`.
8. Click **Deploy**.
