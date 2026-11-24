import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { pool } from '../database/db';

export async function getStudents(req: Request, res: Response) {
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
      query += ` AND academic_year = $${idx}`;
      params.push(parseInt(year as string, 10));
      idx++;
    }

    if (status) {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += ' ORDER BY student_id ASC';
    const result = await pool.query(query, params);
    return res.json({ students: result.rows, total: result.rows.length });
  } catch (err: any) {
    console.error('getStudents error:', err);
    return res.status(500).json({ error: 'Failed to retrieve students' });
  }
}

export async function getStudentById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM students WHERE student_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json({ student: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve student' });
  }
}

export async function createStudent(req: Request, res: Response) {
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

  if (!student_id || !name || !email || !department || !course) {
    return res.status(400).json({ error: 'Missing mandatory student fields' });
  }

  const numCgpa = parseFloat(cgpa);
  const numAttn = parseFloat(attendance);
  const numIncome = parseFloat(annual_family_income);
  const numArrears = parseInt(active_arrears, 10) || 0;

  if (numCgpa < 0 || numCgpa > 10) {
    return res.status(400).json({ error: 'CGPA must be between 0.00 and 10.00' });
  }
  if (numAttn < 0 || numAttn > 100) {
    return res.status(400).json({ error: 'Attendance must be between 0.00% and 100.00%' });
  }
  if (numIncome < 0) {
    return res.status(400).json({ error: 'Income must be non-negative' });
  }

  try {
    // Check duplicate student_id
    const existing = await pool.query('SELECT student_id FROM students WHERE student_id = $1', [student_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Student with ID ${student_id} already exists` });
    }

    const insertQuery = `
      INSERT INTO students (
        student_id, name, email, department, course, academic_year,
        cgpa, attendance, annual_family_income, active_arrears, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      student_id,
      name,
      email,
      department,
      course,
      parseInt(academic_year, 10) || 1,
      numCgpa,
      numAttn,
      numIncome,
      numArrears,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_CREATE', 'OPERATOR', $1)`,
      [JSON.stringify({ student_id, name, department, cgpa: numCgpa })]
    );

    return res.status(201).json({ message: 'Student created successfully', student: result.rows[0] });
  } catch (err: any) {
    console.error('createStudent error:', err);
    return res.status(500).json({ error: 'Failed to create student record' });
  }
}

export async function updateStudent(req: Request, res: Response) {
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
      return res.status(404).json({ error: 'Student not found' });
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
      name,
      email,
      department,
      course,
      academic_year ? parseInt(academic_year, 10) : null,
      cgpa ? parseFloat(cgpa) : null,
      attendance ? parseFloat(attendance) : null,
      annual_family_income ? parseFloat(annual_family_income) : null,
      active_arrears !== undefined ? parseInt(active_arrears, 10) : null,
      status,
      id,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_UPDATE', 'OPERATOR', $1)`,
      [JSON.stringify({ student_id: id, updatedFields: req.body })]
    );

    return res.json({ message: 'Student updated successfully', student: result.rows[0] });
  } catch (err: any) {
    console.error('updateStudent error:', err);
    return res.status(500).json({ error: 'Failed to update student' });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT student_id, name FROM students WHERE student_id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Soft delete / deactivate with audit controls
    await pool.query('UPDATE students SET status = \'INACTIVE\', updated_at = NOW() WHERE student_id = $1', [id]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('STUDENT_DEACTIVATE', 'OPERATOR', $1)`,
      [JSON.stringify({ student_id: id, status: 'INACTIVE' })]
    );

    return res.json({ message: `Student ${id} deactivated successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to deactivate student' });
  }
}

export async function bulkUploadStudents(req: Request, res: Response) {
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
    let updated = 0;
    let errors: string[] = [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const studentId = row.student_id || row['Student ID'];
        const name = row.name || row['Name'] || row['Full Name'];
        const email = row.email || row['Email'] || `${studentId?.toLowerCase()}@scholarship.edu`;
        const dept = row.department || row['Department'] || 'GEN';
        const course = row.course || row['Course'] || 'Undergraduate Degree';
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
          `, [studentId, name, email, dept, course, year, cgpa, attn, income, arrears]);
          updated++;
        } else {
          await client.query(`
            INSERT INTO students (
              student_id, name, email, department, course, academic_year,
              cgpa, attendance, annual_family_income, active_arrears, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
          `, [studentId, name, email, dept, course, year, cgpa, attn, income, arrears]);
          inserted++;
        }
      }

      await client.query(`
        INSERT INTO audit_logs (action, performed_by, details)
        VALUES ('STUDENT_BULK_UPLOAD', 'OPERATOR', $1)
      `, [JSON.stringify({ total: records.length, inserted, updated, errorsCount: errors.length })]);

      await client.query('COMMIT');
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({
      message: 'Bulk upload completed successfully',
      totalProcessed: records.length,
      inserted,
      updated,
      errors,
    });
  } catch (err: any) {
    console.error('bulkUploadStudents error:', err);
    return res.status(500).json({ error: 'Failed to process bulk student upload: ' + err.message });
  }
}

export async function exportStudentsCsv(req: Request, res: Response) {
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
