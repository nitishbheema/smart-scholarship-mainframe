import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { pool } from '../database/db';

export interface BatchExecutionResult {
  batchId: string;
  status: 'COMPLETED' | 'FAILED';
  returnCode: string;
  recordsRead: number;
  recordsValid: number;
  recordsEligible: number;
  recordsRejected: number;
  recordsDuplicate: number;
  totalDisbursement: number;
  durationMs: number;
  reportOutput: string;
  consoleLog: string;
}

export class CobolService {
  /**
   * Resolves the compiled native COBOL executable path across environments:
   * 1. Local Windows (MAIN0001.exe)
   * 2. Linux Docker Container (/app/mainframe/bin/MAIN0001)
   * 3. System PATH fallback
   */
  private static getCobolExecutablePath(): string {
    const candidates = [
      // Relative to current working directory
      path.resolve(process.cwd(), 'mainframe/bin/MAIN0001.exe'),
      path.resolve(process.cwd(), 'mainframe/bin/MAIN0001'),
      // Relative to compiled dist/services directory
      path.resolve(__dirname, '../../../mainframe/bin/MAIN0001.exe'),
      path.resolve(__dirname, '../../../mainframe/bin/MAIN0001'),
      path.resolve(__dirname, '../../mainframe/bin/MAIN0001.exe'),
      path.resolve(__dirname, '../../mainframe/bin/MAIN0001'),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    return process.platform === 'win32' ? 'MAIN0001.exe' : 'MAIN0001';
  }

  public static cleanStr(val: any): string {
    if (val === null || val === undefined) return '';
    return String(val).replace(/\0/g, '').trim();
  }

  public static maskBankAccount(acc: string): string {
    const clean = CobolService.cleanStr(acc);
    if (clean.length <= 4) return '****';
    return '*'.repeat(clean.length - 4) + clean.slice(-4);
  }

  private static formatFixedNumber(num: number, integerDigits: number, decimalDigits: number): string {
    const val = Math.round(num * Math.pow(10, decimalDigits));
    const totalDigits = integerDigits + decimalDigits;
    return val.toString().padStart(totalDigits, '0');
  }

  /**
   * Orchestrates the complete batch execution workflow:
   * 1. Prevents concurrent batch execution collisions.
   * 2. Extracts pending applications from PostgreSQL.
   * 3. Formats fixed-width 120-byte APPIN dataset.
   * 4. Spawns compiled GnuCOBOL native binary with isolated DD dataset assignments.
   * 5. Parses ELGOUT (120B), REJOUT (120B), DISBOUT (120B), RPTOUT (133B).
   * 6. Prevents duplicate disbursement instructions.
   * 7. Commits results to PostgreSQL within an ACID transaction.
   */
  public static async executeBatch(customBatchId?: string, executedBy = 'OPERATOR'): Promise<BatchExecutionResult> {
    const startTime = Date.now();

    // 1. Prevent duplicate concurrent batch execution
    const runningCheck = await pool.query("SELECT batch_id, start_time FROM batch_jobs WHERE status = 'RUNNING';");
    if (runningCheck.rows.length > 0) {
      const runningJob = runningCheck.rows[0];
      throw new Error(
        `Batch execution rejected: Batch job '${runningJob.batch_id}' is currently RUNNING ` +
        `(started at ${runningJob.start_time}). Concurrent batch execution is prohibited to maintain ledger integrity.`
      );
    }

    const batchId = customBatchId || `BAT${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 10)}`;

    // Create isolated per-batch temporary working directory
    const workDir = path.resolve(process.cwd(), 'temp_run', batchId);
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    const appInPath = path.join(workDir, 'APPIN.dat');
    const elgOutPath = path.join(workDir, 'ELGOUT.dat');
    const rejOutPath = path.join(workDir, 'REJOUT.dat');
    const disbOutPath = path.join(workDir, 'DISBOUT.dat');
    const excOutPath = path.join(workDir, 'EXCOUT.dat');
    const rptOutPath = path.join(workDir, 'RPTOUT.dat');
    const stuMastPath = path.join(workDir, 'STUMAST.dat');

    // 2. Fetch applications to process from PostgreSQL
    const appsResult = await pool.query(`
      SELECT a.application_id, a.student_id, a.scheme_code, a.submission_date,
             a.cgpa, a.attendance, a.annual_family_income, a.active_arrears,
             a.bank_account_no, a.bank_ifsc
      FROM scholarship_applications a
      WHERE a.status IN ('SUBMITTED', 'PENDING_BATCH')
      ORDER BY a.submission_date ASC, a.application_id ASC
    `);

    const apps = appsResult.rows;
    if (apps.length === 0) {
      throw new Error('No pending scholarship applications found to process.');
    }

    // 3. Format 120-byte fixed-width lines for APPIN (matches SCHAPP.cpy)
    const appLines: string[] = [];
    for (const app of apps) {
      const appId = (app.application_id || '').padEnd(10, ' ').slice(0, 10);
      const stuId = (app.student_id || '').padEnd(10, ' ').slice(0, 10);
      const schCode = (app.scheme_code || '').padEnd(6, ' ').slice(0, 6);

      const subDate = new Date(app.submission_date || Date.now());
      const dateStr = subDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD (8)

      const cgpaStr = CobolService.formatFixedNumber(parseFloat(app.cgpa) || 0, 2, 2); // 4
      const attnStr = CobolService.formatFixedNumber(parseFloat(app.attendance) || 0, 3, 2); // 5
      const incStr = CobolService.formatFixedNumber(parseFloat(app.annual_family_income) || 0, 8, 2); // 10
      const arrsStr = CobolService.formatFixedNumber(parseInt(app.active_arrears, 10) || 0, 2, 0); // 2

      const bankAcc = (app.bank_account_no || '').padEnd(18, ' ').slice(0, 18); // 18
      const bankIfsc = (app.bank_ifsc || '').padEnd(11, ' ').slice(0, 11); // 11
      const filler = ''.padEnd(36, ' '); // 36

      // Exactly 120 bytes
      const line = `${appId}${stuId}${schCode}${dateStr}${cgpaStr}${attnStr}${incStr}${arrsStr}${bankAcc}${bankIfsc}${filler}`;
      appLines.push(line);
    }

    fs.writeFileSync(appInPath, appLines.join('\n') + '\n', 'utf-8');

    // 4. Create initial batch job record in PostgreSQL
    await pool.query(`
      INSERT INTO batch_jobs (batch_id, job_name, status, total_read, start_time, execution_engine)
      VALUES ($1, 'BATELG01', 'RUNNING', $2, NOW(), 'GnuCOBOL Native Binary (MAIN0001)')
      ON CONFLICT (batch_id) DO UPDATE SET status = 'RUNNING', start_time = NOW();
    `, [batchId, apps.length]);

    // 5. Configure environment variables for COBOL execution
    const cobRoot = path.resolve(process.cwd(), 'temp_tools/gnucobol-3.1.2-windows-mingw-x64');
    const envVars: NodeJS.ProcessEnv = {
      ...process.env,
      DD_APPIN: appInPath,
      DD_STUMAST: stuMastPath,
      DD_ELGOUT: elgOutPath,
      DD_REJOUT: rejOutPath,
      DD_DISBOUT: disbOutPath,
      DD_EXCOUT: excOutPath,
      DD_RPTOUT: rptOutPath,
    };

    if (fs.existsSync(cobRoot)) {
      envVars.PATH = `${path.join(cobRoot, 'bin')};${process.env.PATH || ''}`;
      envVars.COB_CONFIG_DIR = path.join(cobRoot, 'share', 'gnucobol', 'config');
      envVars.COB_COPY_DIR = path.join(cobRoot, 'share', 'gnucobol', 'copy');
    }

    const execPath = CobolService.getCobolExecutablePath();

    // 6. Spawn actual native COBOL executable
    const runCobol = (): Promise<{ stdout: string; stderr: string; code: number }> => {
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        const child = spawn(execPath, [], {
          cwd: workDir,
          env: envVars,
        });

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('error', (err) => {
          reject(err);
        });

        child.on('close', (code) => {
          resolve({ stdout, stderr, code: code ?? 0 });
        });
      });
    };

    let cobolResult: { stdout: string; stderr: string; code: number };
    try {
      cobolResult = await runCobol();
    } catch (execErr: any) {
      await pool.query(
        "UPDATE batch_jobs SET status = 'FAILED', return_code = 'RC 0016', end_time = NOW() WHERE batch_id = $1",
        [batchId]
      );
      throw new Error(`Failed to execute native COBOL executable (${execPath}): ${execErr.message}`);
    }

    const { stdout, stderr, code } = cobolResult;
    const durationMs = Date.now() - startTime;
    const returnCode = code === 0 ? 'RC 0000' : code === 4 ? 'RC 0004' : `RC ${code.toString().padStart(4, '0')}`;

    // 7. Read and parse output datasets
    const elgLines = fs.existsSync(elgOutPath)
      ? fs.readFileSync(elgOutPath, 'utf-8').split('\n').filter(l => l.trim().length >= 40)
      : [];
    const rejLines = fs.existsSync(rejOutPath)
      ? fs.readFileSync(rejOutPath, 'utf-8').split('\n').filter(l => l.trim().length >= 40)
      : [];
    const disbLines = fs.existsSync(disbOutPath)
      ? fs.readFileSync(disbOutPath, 'utf-8').split('\n').filter(l => l.trim().length >= 40)
      : [];
    const rptOutput = CobolService.cleanStr(fs.existsSync(rptOutPath)
      ? fs.readFileSync(rptOutPath, 'utf-8')
      : stdout);

    // 8. Parse eligible records
    const eligibleRecords: any[] = [];
    let totalDisb = 0;

    for (const line of elgLines) {
      const appId = CobolService.cleanStr(line.slice(0, 10));
      const stuId = CobolService.cleanStr(line.slice(10, 20));
      const schCode = CobolService.cleanStr(line.slice(20, 26));
      const cgpa = parseFloat(line.slice(26, 30)) / 100;
      const attn = parseFloat(line.slice(30, 35)) / 100;
      const income = parseFloat(line.slice(35, 45)) / 100;
      const arrears = parseInt(line.slice(45, 47), 10);
      const status = CobolService.cleanStr(line.slice(47, 48));
      const reasonCode = CobolService.cleanStr(line.slice(48, 58));
      const award = parseFloat(line.slice(58, 67)) / 100;
      const procDate = CobolService.cleanStr(line.slice(67, 75));
      const procTime = CobolService.cleanStr(line.slice(75, 81));

      totalDisb += award;
      eligibleRecords.push({
        appId, stuId, schCode, cgpa, attn, income, arrears, status, reasonCode, award, procDate, procTime
      });
    }

    // 9. Parse rejected records
    const rejectedRecords: any[] = [];
    let dupCount = 0;

    for (const line of rejLines) {
      const appId = CobolService.cleanStr(line.slice(0, 10));
      const stuId = CobolService.cleanStr(line.slice(10, 20));
      const schCode = CobolService.cleanStr(line.slice(20, 26));
      const cgpa = parseFloat(line.slice(26, 30)) / 100;
      const attn = parseFloat(line.slice(30, 35)) / 100;
      const income = parseFloat(line.slice(35, 45)) / 100;
      const arrears = parseInt(line.slice(45, 47), 10);
      const status = CobolService.cleanStr(line.slice(47, 48));
      const reasonCode = CobolService.cleanStr(line.slice(48, 58));
      const award = 0;
      const procDate = CobolService.cleanStr(line.slice(67, 75));
      const procTime = CobolService.cleanStr(line.slice(75, 81));

      if (status === 'D' || reasonCode.includes('DUP')) {
        dupCount++;
      }

      rejectedRecords.push({
        appId, stuId, schCode, cgpa, attn, income, arrears, status, reasonCode, award, procDate, procTime
      });
    }

    // 10. Parse disbursement instructions with Duplicate Disbursement Prevention
    const disbursementRecords: any[] = [];
    for (const line of disbLines) {
      const rawRefId = CobolService.cleanStr(line.slice(1, 13));
      const appId = CobolService.cleanStr(line.slice(13, 23));
      const stuId = CobolService.cleanStr(line.slice(23, 33));
      const amount = parseFloat(line.slice(33, 42)) / 100;
      const bankAcc = CobolService.cleanStr(line.slice(42, 60));
      const bankIfsc = CobolService.cleanStr(line.slice(60, 71));
      const status = 'PENDING';
      const paymentDate = CobolService.cleanStr(line.slice(72, 80));
      const utrNumber = CobolService.cleanStr(line.slice(80, 96));
      const disbId = `${batchId}_${rawRefId || 'DSB'}_${appId}`;

      disbursementRecords.push({
        disbId, appId, stuId, amount, bankAcc, bankIfsc, status, paymentDate, utrNumber
      });
    }

    // 11. Persist results in PostgreSQL Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update batch_job record
      await client.query(`
        UPDATE batch_jobs
        SET status = 'COMPLETED',
            return_code = $1,
            total_read = $2,
            total_valid = $3,
            total_eligible = $4,
            total_rejected = $5,
            total_duplicates = $6,
            total_disbursement = $7,
            end_time = NOW(),
            sysout_report = $8
        WHERE batch_id = $9
      `, [
        returnCode,
        apps.length,
        eligibleRecords.length + rejectedRecords.filter(r => r.status !== 'I').length,
        eligibleRecords.length,
        rejectedRecords.length,
        dupCount,
        totalDisb,
        rptOutput,
        batchId
      ]);

      // Save eligibility results
      for (const elg of eligibleRecords) {
        await client.query(`
          INSERT INTO eligibility_results (
            batch_id, application_id, student_id, scheme_code,
            cgpa, attendance, annual_family_income, active_arrears,
            status, reason_code, award_amount, processed_date, processed_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          batchId, elg.appId, elg.stuId, elg.schCode,
          elg.cgpa, elg.attn, elg.income, elg.arrears,
          elg.status, elg.reasonCode, elg.award, elg.procDate, elg.procTime
        ]);

        await client.query(`
          UPDATE scholarship_applications
          SET status = 'ELIGIBLE', award_amount = $1, batch_id = $2, updated_at = NOW()
          WHERE application_id = $3
        `, [elg.award, batchId, elg.appId]);
      }

      for (const rej of rejectedRecords) {
        await client.query(`
          INSERT INTO eligibility_results (
            batch_id, application_id, student_id, scheme_code,
            cgpa, attendance, annual_family_income, active_arrears,
            status, reason_code, award_amount, processed_date, processed_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          batchId, rej.appId, rej.stuId, rej.schCode,
          rej.cgpa, rej.attn, rej.income, rej.arrears,
          rej.status, rej.reasonCode, rej.award, rej.procDate, rej.procTime
        ]);

        await client.query(`
          UPDATE scholarship_applications
          SET status = 'REJECTED', rejection_reason = $1, batch_id = $2, updated_at = NOW()
          WHERE application_id = $3
        `, [rej.reasonCode, batchId, rej.appId]);
      }

      // Save disbursement records with duplicate disbursement protection
      for (const d of disbursementRecords) {
        // Check if an existing settled or pending disbursement already exists for this application
        const existingDisb = await client.query(
          'SELECT disbursement_id, payment_status FROM disbursement_records WHERE application_id = $1',
          [d.appId]
        );

        if (existingDisb.rows.length === 0) {
          await client.query(`
            INSERT INTO disbursement_records (
              disbursement_id, batch_id, application_id, student_id,
              award_amount, bank_account_no, bank_ifsc, payment_status,
              payment_date, utr_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (disbursement_id) DO NOTHING;
          `, [
            d.disbId, batchId, d.appId, d.stuId,
            d.amount, d.bankAcc, d.bankIfsc, d.status,
            d.paymentDate, d.utrNumber
          ]);
        }
      }

      // Audit Log with masked account information
      await client.query(`
        INSERT INTO audit_logs (action, performed_by, details)
        VALUES ('BATCH_EXECUTE_COBOL', $1, $2)
      `, [executedBy, JSON.stringify({
        batchId,
        returnCode,
        totalRead: apps.length,
        eligible: eligibleRecords.length,
        rejected: rejectedRecords.length,
        disbursedAmount: totalDisb,
        durationMs
      })]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to commit batch results to database:', err);
      throw err;
    } finally {
      client.release();
    }

    return {
      batchId,
      status: 'COMPLETED',
      returnCode,
      recordsRead: apps.length,
      recordsValid: eligibleRecords.length + rejectedRecords.filter(r => r.status !== 'I').length,
      recordsEligible: eligibleRecords.length,
      recordsRejected: rejectedRecords.length,
      recordsDuplicate: dupCount,
      totalDisbursement: totalDisb,
      durationMs,
      reportOutput: rptOutput,
      consoleLog: stdout + (stderr ? '\n' + stderr : ''),
    };
  }
}
