import { Response } from 'express';
import { parse } from 'csv-parse/sync';
import { pool } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_REGEX = /^[A-Z0-9]{3,20}$/i;

export async function getStudents(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, department, year, status } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (search) {
      query += ` AND (student_id ILIKE $${idx} OR name ILIKE $${idx} OR email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (department && department !== 'ALL') {
      query += ` AND department = $${idx}`;
      params.push(department);
      idx++;
    }

    if (year && year !== 'ALL') {
      const parsedYear = parseInt(year as string, 10);
      if (!isNaN(parsedYear)) {
        query += ` AND academic_year = $${idx}`;
        params.push(parsedYear);
        idx++;
      }
    }

    if (status && status !== 'ALL') {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += ' ORDER BY student_id ASC';
    const result = await pool.query(query, params);
    return res.json({ students: result.rows, total: result.rows.length });
  } catch (err: any) {
    console.error('getStudents error:', err.message || err);
    return res.status(500).json({ error: 'Failed to retrieve students' });
  }
}

export async function getStudentById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Student with ID '${id}' not found` });
    }
    return res.json({ student: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve student record' });
  }
}

export async function createStudent(req: AuthenticatedRequest, res: Response) {
  const {
    student_id,
    name,
    email,
    department,
    course,
    academic_year,
    cgpa,
    attendance,
    annual_family_income,
    active_arrears,
  } = req.body;

  // 1. Mandatory field checks
  if (!student_id || !name || !email || !department || !course) {
    return res.status(400).json({
      error: 'Missing mandatory fields: student_id, name, email, department, and course are required',
    });
  }

  // 2. Format & boundary validation
  const cleanId = String(student_id).trim().toUpperCase();
  if (!STUDENT_ID_REGEX.test(cleanId)) {
    return res.status(400).json({
      error: 'student_id must be 3-20 alphanumeric characters (e.g., STU2024001)',
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  const numYear = parseInt(academic_year, 10);
  if (isNaN(numYear) || numYear < 1 || numYear > 6) {
    return res.status(400).json({ error: 'academic_year must be an integer between 1 and 6' });
  }

  const numCgpa = parseFloat(cgpa);
  if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
    return res.status(400).json({ error: 'CGPA must be a decimal between 0.00 and 10.00' });
  }

  const numAttn = parseFloat(attendance);
  if (isNaN(numAttn) || numAttn < 0 || numAttn > 100) {
    return res.status(400).json({ error: 'Attendance must be a decimal between 0.00% and 100.00%' });
  }

  const numIncome = parseFloat(annual_family_income);
  if (isNaN(numIncome) || numIncome < 0) {
    return res.status(400).json({ error: 'annual_family_income must be a non-negative number' });
  }

  const numArrears = parseInt(active_arrears ?? 0, 10);
  if (isNaN(numArrears) || numArrears < 0) {
    return res.status(400).json({ error: 'active_arrears must be a non-negative integer' });
  }

  try {
    const insertQuery = `
      INSERT INTO students (
        student_id, name, email, department, course, academic_year,
        cgpa, attendance, annual_family_income, active_arrears, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      cleanId,
      String(name).trim(),
      cleanEmail,
      String(department).trim().toUpperCase(),
      String(course).trim(),
      numYear,
      numCgpa,
      numAttn,
      numIncome,
      numArrears,
    ]);

    const actor = req.user?.username || 'SYSTEM';
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_CREATE', $1, $2)`,
      [actor, JSON.stringify({ student_id: cleanId, name, department: department.toUpperCase() })]
    );

    return res.status(201).json({
      message: 'Student record created successfully',
      student: result.rows[0],
    });
  } catch (err: any) {
    // Unique constraint violation (23505)
    if (err.code === '23505') {
      return res.status(409).json({
        error: `A student with ID '${cleanId}' or email '${cleanEmail}' already exists`,
      });
    }
    console.error('createStudent database error:', err.message || err);
    return res.status(500).json({ error: 'Failed to create student record' });
  }
}

export async function updateStudent(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const {
    name,
    email,
    department,
    course,
    academic_year,
    cgpa,
    attendance,
    annual_family_income,
    active_arrears,
    status,
  } = req.body;

  try {
    const check = await pool.query('SELECT * FROM students WHERE student_id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: `Student with ID '${id}' not found` });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (cgpa !== undefined) {
      const nCgpa = parseFloat(cgpa);
      if (isNaN(nCgpa) || nCgpa < 0 || nCgpa > 10) {
        return res.status(400).json({ error: 'CGPA must be between 0.00 and 10.00' });
      }
    }

    if (attendance !== undefined) {
      const nAttn = parseFloat(attendance);
      if (isNaN(nAttn) || nAttn < 0 || nAttn > 100) {
        return res.status(400).json({ error: 'Attendance must be between 0.00% and 100.00%' });
      }
    }

    if (annual_family_income !== undefined) {
      const nInc = parseFloat(annual_family_income);
      if (isNaN(nInc) || nInc < 0) {
        return res.status(400).json({ error: 'annual_family_income must be non-negative' });
      }
    }

    const updateQuery = `
      UPDATE students
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          department = COALESCE($3, department),
          course = COALESCE($4, course),
          academic_year = COALESCE($5, academic_year),
          cgpa = COALESCE($6, cgpa),
          attendance = COALESCE($7, attendance),
          annual_family_income = COALESCE($8, annual_family_income),
          active_arrears = COALESCE($9, active_arrears),
          status = COALESCE($10, status),
          updated_at = NOW()
      WHERE student_id = $11
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name ? String(name).trim() : null,
      email ? String(email).trim().toLowerCase() : null,
      department ? String(department).trim().toUpperCase() : null,
      course ? String(course).trim() : null,
      academic_year !== undefined ? parseInt(academic_year, 10) : null,
      cgpa !== undefined ? parseFloat(cgpa) : null,
      attendance !== undefined ? parseFloat(attendance) : null,
      annual_family_income !== undefined ? parseFloat(annual_family_income) : null,
      active_arrears !== undefined ? parseInt(active_arrears, 10) : null,
      status ? String(status).toUpperCase() : null,
      id,
    ]);

    const actor = req.user?.username || 'SYSTEM';
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_UPDATE', $1, $2)`,
      [actor, JSON.stringify({ student_id: id, updatedFields: req.body })]
    );

    return res.json({ message: 'Student record updated successfully', student: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Another student already uses this email address' });
    }
    console.error('updateStudent error:', err.message || err);
    return res.status(500).json({ error: 'Failed to update student record' });
  }
}

export async function deleteStudent(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT student_id, name FROM students WHERE student_id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: `Student with ID '${id}' not found` });
    }

    // Soft delete / deactivate with audit controls
    await pool.query("UPDATE students SET status = 'INACTIVE', updated_at = NOW() WHERE student_id = $1", [id]);

    const actor = req.user?.username || 'SYSTEM';
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_DEACTIVATE', $1, $2)`,
      [actor, JSON.stringify({ student_id: id, status: 'INACTIVE' })]
    );

    return res.json({ message: `Student '${id}' deactivated successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to deactivate student record' });
  }
}

export async function bulkUploadStudents(req: AuthenticatedRequest, res: Response) {
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
      return res.status(400).json({ error: 'CSV file contains no data rows' });
    }

    // Column Header Validation
    const firstRow = records[0];
    const hasStudentId = 'student_id' in firstRow || 'Student ID' in firstRow || 'STUDENT_ID' in firstRow;
    const hasName = 'name' in firstRow || 'Name' in firstRow || 'Full Name' in firstRow;

    if (!hasStudentId || !hasName) {
      return res.status(400).json({
        error: 'Invalid CSV format: Missing mandatory columns (must include student_id and name)',
      });
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const studentId = (row.student_id || row['Student ID'] || row['STUDENT_ID'] || '').trim().toUpperCase();
        const name = (row.name || row['Name'] || row['Full Name'] || '').trim();
        const email = (row.email || row['Email'] || `${studentId.toLowerCase()}@scholarship.edu`).trim().toLowerCase();
        const dept = (row.department || row['Department'] || 'GEN').trim().toUpperCase();
        const course = (row.course || row['Course'] || 'Undergraduate Degree').trim();
        const year = parseInt(row.academic_year || row['Academic Year'] || '1', 10);
        const cgpa = parseFloat(row.cgpa || row['CGPA'] || '0.0');
        const attn = parseFloat(row.attendance || row['Attendance'] || '0.0');
        const income = parseFloat(row.annual_family_income || row['Annual Family Income'] || '0.0');
        const arrears = parseInt(row.active_arrears || row['Active Arrears'] || '0', 10);

        if (!studentId || !name) {
          errors.push(`Row ${i + 1}: Missing student_id or name`);
          continue;
        }

        const resCheck = await client.query('SELECT student_id FROM students WHERE student_id = $1', [studentId]);
        if (resCheck.rows.length > 0) {
          await client.query(`
            UPDATE students
            SET name = $2, email = $3, department = $4, course = $5, academic_year = $6,
                cgpa = $7, attendance = $8, annual_family_income = $9, active_arrears = $10,
                updated_at = NOW()
            WHERE student_id = $1
          `, [studentId, name, email, dept, course, isNaN(year) ? 1 : year, isNaN(cgpa) ? 0 : cgpa, isNaN(attn) ? 0 : attn, isNaN(income) ? 0 : income, isNaN(arrears) ? 0 : arrears]);
          updated++;
        } else {
          await client.query(`
            INSERT INTO students (
              student_id, name, email, department, course, academic_year,
              cgpa, attendance, annual_family_income, active_arrears, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
          `, [studentId, name, email, dept, course, isNaN(year) ? 1 : year, isNaN(cgpa) ? 0 : cgpa, isNaN(attn) ? 0 : attn, isNaN(income) ? 0 : income, isNaN(arrears) ? 0 : arrears]);
          inserted++;
        }
      }

      const actor = req.user?.username || 'SYSTEM';
      await client.query(`
        INSERT INTO audit_logs (action, performed_by, details)
        VALUES ('STUDENT_BULK_UPLOAD', $1, $2)
      `, [actor, JSON.stringify({ total: records.length, inserted, updated, errorsCount: errors.length })]);

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({
      message: 'Bulk student upload processed successfully',
      totalProcessed: records.length,
      inserted,
      updated,
      errors,
    });
  } catch (err: any) {
    console.error('bulkUploadStudents error:', err.message || err);
    return res.status(500).json({ error: 'Failed to process bulk student upload: ' + err.message });
  }
}

export async function exportStudentsCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY student_id ASC');
    const headers = 'student_id,name,email,department,course,academic_year,cgpa,attendance,annual_family_income,active_arrears,status\n';
    const rows = result.rows
      .map(r => `${r.student_id},"${r.name}","${r.email}",${r.department},"${r.course}",${r.academic_year},${r.cgpa},${r.attendance},${r.annual_family_income},${r.active_arrears},${r.status}`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_master.csv"');
    return res.send(headers + rows);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export students CSV' });
  }
}
