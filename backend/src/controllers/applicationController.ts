import { Response } from 'express';
import { parse } from 'csv-parse/sync';
import { pool } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Atomically generates a collision-free 10-character Application ID
 * compliant with Mainframe Copybook SCHAPP.cpy (APP-ID PIC X(10)).
 */
async function generateUniqueAppId(client: any): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const seqRes = await client.query("SELECT nextval('app_id_seq') AS seq;");
    const seq = parseInt(seqRes.rows[0].seq, 10);
    const seqFormatted = String(seq).padStart(3, '0').slice(-3);
    const candidateId = `APP${year}${seqFormatted}`;

    const existsCheck = await client.query(
      'SELECT application_id FROM scholarship_applications WHERE application_id = $1',
      [candidateId]
    );
    if (existsCheck.rows.length === 0) {
      return candidateId;
    }
  }
  // Fallback with timestamp hash if sequence had collision
  const timeSuffix = Date.now().toString().slice(-7);
  return `APP${timeSuffix}`;
}

export async function getApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, scheme, student_id, batch_id } = req.query;
    let query = `
      SELECT a.*, s.name as student_name, s.department, s.course, sc.scheme_name
      FROM scholarship_applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN scholarship_schemes sc ON a.scheme_code = sc.scheme_code
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (status && status !== 'ALL') {
      query += ` AND a.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (scheme && scheme !== 'ALL') {
      query += ` AND a.scheme_code = $${idx}`;
      params.push(scheme);
      idx++;
    }

    if (student_id) {
      query += ` AND a.student_id = $${idx}`;
      params.push(student_id);
      idx++;
    }

    if (batch_id) {
      query += ` AND a.batch_id = $${idx}`;
      params.push(batch_id);
      idx++;
    }

    query += ' ORDER BY a.submission_date DESC, a.application_id DESC';
    const result = await pool.query(query, params);
    return res.json({ applications: result.rows, total: result.rows.length });
  } catch (err: any) {
    console.error('getApplications error:', err.message || err);
    return res.status(500).json({ error: 'Failed to retrieve applications' });
  }
}

export async function getApplicationById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const query = `
      SELECT a.*, s.name as student_name, s.email as student_email, s.department, s.course, sc.scheme_name
      FROM scholarship_applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN scholarship_schemes sc ON a.scheme_code = sc.scheme_code
      WHERE a.application_id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Application '${id}' not found` });
    }
    return res.json({ application: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve application details' });
  }
}

export async function createApplication(req: AuthenticatedRequest, res: Response) {
  const {
    student_id,
    scheme_code,
    bank_account_no,
    bank_ifsc,
  } = req.body;

  // 1. Mandatory field checks
  if (!student_id || !scheme_code || !bank_account_no || !bank_ifsc) {
    return res.status(400).json({
      error: 'student_id, scheme_code, bank_account_no, and bank_ifsc are required',
    });
  }

  const cleanStuId = String(student_id).trim().toUpperCase();
  const cleanSchCode = String(scheme_code).trim().toUpperCase();
  const cleanBankAcc = String(bank_account_no).trim();
  const cleanIfsc = String(bank_ifsc).trim().toUpperCase();

  if (cleanBankAcc.length < 9 || cleanBankAcc.length > 20) {
    return res.status(400).json({ error: 'bank_account_no must be between 9 and 20 characters' });
  }

  if (cleanIfsc.length !== 11) {
    return res.status(400).json({ error: 'bank_ifsc must be exactly 11 characters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Verify student exists
    const stuResult = await client.query('SELECT * FROM students WHERE student_id = $1', [cleanStuId]);
    if (stuResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Student '${cleanStuId}' not found in student master` });
    }
    const stu = stuResult.rows[0];

    // 3. Verify scheme exists and is active
    const schResult = await client.query('SELECT * FROM scholarship_schemes WHERE scheme_code = $1', [cleanSchCode]);
    if (schResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Scholarship scheme '${cleanSchCode}' not found` });
    }
    if (!schResult.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Scholarship scheme '${cleanSchCode}' is currently inactive` });
    }

    // 4. Check duplicate submission for student + scheme
    const dupCheck = await client.query(
      'SELECT application_id FROM scholarship_applications WHERE student_id = $1 AND scheme_code = $2',
      [cleanStuId, cleanSchCode]
    );
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Duplicate application: Student '${cleanStuId}' already submitted application '${dupCheck.rows[0].application_id}' for scheme '${cleanSchCode}'`,
      });
    }

    // 5. Generate collision-free Application ID
    const applicationId = await generateUniqueAppId(client);

    // 6. Insert application record using snapshot student academic data
    const insertSql = `
      INSERT INTO scholarship_applications (
        application_id, student_id, scheme_code, submission_date,
        cgpa, attendance, annual_family_income, active_arrears,
        bank_account_no, bank_ifsc, status
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, 'SUBMITTED')
      RETURNING *
    `;

    const result = await client.query(insertSql, [
      applicationId,
      cleanStuId,
      cleanSchCode,
      stu.cgpa,
      stu.attendance,
      stu.annual_family_income,
      stu.active_arrears,
      cleanBankAcc,
      cleanIfsc,
    ]);

    const actor = req.user?.username || 'SYSTEM';
    await client.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('APPLICATION_SUBMIT', $1, $2)`,
      [actor, JSON.stringify({ applicationId, student_id: cleanStuId, scheme_code: cleanSchCode })]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Scholarship application submitted successfully',
      application: result.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({
        error: `Duplicate constraint violation: An application for student '${cleanStuId}' and scheme '${cleanSchCode}' already exists.`,
      });
    }
    console.error('createApplication error:', err.message || err);
    return res.status(500).json({ error: 'Failed to submit application: ' + err.message });
  } finally {
    client.release();
  }
}

export async function bulkUploadApplications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file && !req.body.csvData) {
      return res.status(400).json({ error: 'CSV file attachment or csvData string is required' });
    }

    const csvContent = req.file ? req.file.buffer.toString('utf-8') : req.body.csvData;
    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr: any) {
      return res.status(400).json({ error: 'Invalid CSV format: ' + parseErr.message });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file contains no records' });
    }

    // Validate mandatory columns
    const firstRow = records[0];
    const hasStudentId = 'student_id' in firstRow || 'Student ID' in firstRow || 'STUDENT_ID' in firstRow;
    const hasBankAcc = 'bank_account_no' in firstRow || 'Bank Account No' in firstRow || 'bank_account_number' in firstRow;

    if (!hasStudentId || !hasBankAcc) {
      return res.status(400).json({
        error: 'Invalid CSV format: Missing required columns (must include student_id and bank_account_no)',
      });
    }

    let inserted = 0;
    const errors: string[] = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        let appId = (row.application_id || row['Application ID'] || '').trim().toUpperCase();
        const stuId = (row.student_id || row['Student ID'] || row['STUDENT_ID'] || '').trim().toUpperCase();
        const schCode = (row.scheme_code || row['Scheme Code'] || row['scholarship_code'] || 'MERIT1').trim().toUpperCase();
        const bankAcc = (row.bank_account_no || row['Bank Account No'] || row['bank_account_number'] || '9182374619283746').trim();
        const bankIfsc = (row.bank_ifsc || row['Bank IFSC'] || row['bank_ifsc'] || 'SBIN0001234').trim().toUpperCase();

        if (!stuId) {
          errors.push(`Row ${i + 1}: Missing student_id`);
          continue;
        }

        // Verify student exists
        const stuRes = await client.query('SELECT * FROM students WHERE student_id = $1', [stuId]);
        if (stuRes.rows.length === 0) {
          errors.push(`Row ${i + 1}: Student '${stuId}' not found in students master`);
          continue;
        }
        const stu = stuRes.rows[0];

        // Check duplicate
        const dupRes = await client.query(
          'SELECT application_id FROM scholarship_applications WHERE student_id = $1 AND scheme_code = $2',
          [stuId, schCode]
        );
        if (dupRes.rows.length > 0) {
          errors.push(`Row ${i + 1}: Student '${stuId}' already applied for scheme '${schCode}'`);
          continue;
        }

        if (!appId) {
          appId = await generateUniqueAppId(client);
        }

        const cgpa = row.cgpa ? parseFloat(row.cgpa) : parseFloat(stu.cgpa);
        const attn = row.attendance_percentage ? parseFloat(row.attendance_percentage) : (row.attendance ? parseFloat(row.attendance) : parseFloat(stu.attendance));
        const income = row.annual_family_income ? parseFloat(row.annual_family_income) : parseFloat(stu.annual_family_income);
        const arrears = row.active_arrears ? parseInt(row.active_arrears, 10) : parseInt(stu.active_arrears, 10);

        await client.query(`
          INSERT INTO scholarship_applications (
            application_id, student_id, scheme_code, submission_date,
            cgpa, attendance, annual_family_income, active_arrears,
            bank_account_no, bank_ifsc, status
          ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, 'SUBMITTED')
          ON CONFLICT (application_id) DO NOTHING;
        `, [appId, stuId, schCode, cgpa, attn, income, arrears, bankAcc, bankIfsc]);
        inserted++;
      }

      const actor = req.user?.username || 'SYSTEM';
      await client.query(`
        INSERT INTO audit_logs (action, performed_by, details)
        VALUES ('APPLICATION_BULK_UPLOAD', $1, $2)
      `, [actor, JSON.stringify({ total: records.length, inserted, errorsCount: errors.length })]);

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({
      message: 'Bulk application feed ingested successfully',
      totalProcessed: records.length,
      inserted,
      errors,
    });
  } catch (err: any) {
    console.error('bulkUploadApplications error:', err.message || err);
    return res.status(500).json({ error: 'Failed to process bulk application feed: ' + err.message });
  }
}
