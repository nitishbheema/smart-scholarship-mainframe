import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { pool } from '../database/db';

export async function getApplications(req: Request, res: Response) {
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
    console.error('getApplications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications' });
  }
}

export async function getApplicationById(req: Request, res: Response) {
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
      return res.status(404).json({ error: 'Application not found' });
    }
    return res.json({ application: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve application' });
  }
}

export async function createApplication(req: Request, res: Response) {
  const {
    student_id,
    scheme_code,
    bank_account_no,
    bank_ifsc,
  } = req.body;

  if (!student_id || !scheme_code || !bank_account_no || !bank_ifsc) {
    return res.status(400).json({ error: 'student_id, scheme_code, bank_account_no and bank_ifsc are required' });
  }

  try {
    // 1. Verify student exists
    const stuResult = await pool.query('SELECT * FROM students WHERE student_id = $1', [student_id]);
    if (stuResult.rows.length === 0) {
      return res.status(404).json({ error: `Student ${student_id} not found in student master` });
    }
    const stu = stuResult.rows[0];

    // 2. Verify scheme exists and is active
    const schResult = await pool.query('SELECT * FROM scholarship_schemes WHERE scheme_code = $1', [scheme_code]);
    if (schResult.rows.length === 0) {
      return res.status(404).json({ error: `Scholarship scheme ${scheme_code} not found` });
    }
    if (!schResult.rows[0].is_active) {
      return res.status(400).json({ error: `Scholarship scheme ${scheme_code} is currently inactive` });
    }

    // 3. Check duplicate submission for student + scheme
    const dupCheck = await pool.query(
      'SELECT application_id FROM scholarship_applications WHERE student_id = $1 AND scheme_code = $2',
      [student_id, scheme_code]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        error: `Duplicate application: Student ${student_id} already has application ${dupCheck.rows[0].application_id} submitted for scheme ${scheme_code}`,
      });
    }

    // 4. Generate unique application ID
    const countRes = await pool.query('SELECT COUNT(*) FROM scholarship_applications');
    const seq = parseInt(countRes.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    const applicationId = `APP${year}${seq.toString().padStart(3, '0')}`;

    // 5. Insert application record using snapshot student academic data
    const insertSql = `
      INSERT INTO scholarship_applications (
        application_id, student_id, scheme_code, submission_date,
        cgpa, attendance, annual_family_income, active_arrears,
        bank_account_no, bank_ifsc, status
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, 'SUBMITTED')
      RETURNING *
    `;

    const result = await pool.query(insertSql, [
      applicationId,
      student_id,
      scheme_code,
      stu.cgpa,
      stu.attendance,
      stu.annual_family_income,
      stu.active_arrears,
      bank_account_no.trim(),
      bank_ifsc.trim(),
    ]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('APPLICATION_SUBMIT', 'APPLICANT', $1)`,
      [JSON.stringify({ applicationId, student_id, scheme_code })]
    );

    return res.status(201).json({
      message: 'Application submitted successfully',
      application: result.rows[0],
    });
  } catch (err: any) {
    console.error('createApplication error:', err);
    return res.status(500).json({ error: 'Failed to submit application: ' + err.message });
  }
}

export async function bulkUploadApplications(req: Request, res: Response) {
  try {
    if (!req.file && !req.body.csvData) {
      return res.status(400).json({ error: 'CSV file or csvData string is required' });
    }

    const csvContent = req.file ? req.file.buffer.toString('utf-8') : req.body.csvData;
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let inserted = 0;
    let errors: string[] = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        let appId = row.application_id || row['Application ID'];
        const stuId = row.student_id || row['Student ID'];
        const schCode = row.scheme_code || row['Scheme Code'] || 'MERIT1';
        const bankAcc = row.bank_account_no || row['Bank Account No'] || '9182374619283746';
        const bankIfsc = row.bank_ifsc || row['Bank IFSC'] || 'SBIN0001234';

        if (!stuId) {
          errors.push(`Row ${i + 1}: Missing student_id`);
          continue;
        }

        const stuCheck = await client.query('SELECT * FROM students WHERE student_id = $1', [stuId]);
        if (stuCheck.rows.length === 0) {
          errors.push(`Row ${i + 1}: Student ${stuId} does not exist`);
          continue;
        }
        const stu = stuCheck.rows[0];

        // Check duplicate
        const dup = await client.query(
          'SELECT application_id FROM scholarship_applications WHERE student_id = $1 AND scheme_code = $2',
          [stuId, schCode]
        );
        if (dup.rows.length > 0) {
          errors.push(`Row ${i + 1}: Student ${stuId} already applied under ${dup.rows[0].application_id}`);
          continue;
        }

        if (!appId) {
          const countRes = await client.query('SELECT COUNT(*) FROM scholarship_applications');
          const seq = parseInt(countRes.rows[0].count, 10) + 1 + inserted;
          appId = `APP${new Date().getFullYear()}${seq.toString().padStart(3, '0')}`;
        }

        const cgpa = row.cgpa ? parseFloat(row.cgpa) : stu.cgpa;
        const attn = row.attendance ? parseFloat(row.attendance) : stu.attendance;
        const income = row.annual_family_income ? parseFloat(row.annual_family_income) : stu.annual_family_income;
        const arrears = row.active_arrears !== undefined ? parseInt(row.active_arrears, 10) : stu.active_arrears;

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

      await client.query(`
        INSERT INTO audit_logs (action, performed_by, details)
        VALUES ('APPLICATION_BULK_UPLOAD', 'OPERATOR', $1)
      `, [JSON.stringify({ total: records.length, inserted, errorsCount: errors.length })]);

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({
      message: 'Bulk application submission processed',
      totalRecords: records.length,
      inserted,
      errors,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process bulk applications: ' + err.message });
  }
}
