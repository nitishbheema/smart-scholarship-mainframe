import { Request, Response } from 'express';
import { pool } from '../database/db';

export async function getSchemes(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM scholarship_schemes ORDER BY scheme_code ASC');
    return res.json({ schemes: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve scholarship schemes' });
  }
}

export async function getSchemeByCode(req: Request, res: Response) {
  const { code } = req.params;
  try {
    const result = await pool.query('SELECT * FROM scholarship_schemes WHERE scheme_code = $1', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scholarship scheme not found' });
    }
    return res.json({ scheme: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve scholarship scheme' });
  }
}

export async function createScheme(req: Request, res: Response) {
  const {
    scheme_code,
    scheme_name,
    description,
    min_cgpa,
    min_attendance,
    max_family_income,
    max_arrears,
    slab_1_min_cgpa,
    slab_1_max_cgpa,
    slab_1_amount,
    slab_2_min_cgpa,
    slab_2_max_cgpa,
    slab_2_amount,
    slab_3_min_cgpa,
    slab_3_max_cgpa,
    slab_3_amount,
    deadline,
    is_active,
  } = req.body;

  if (!scheme_code || !scheme_name) {
    return res.status(400).json({ error: 'scheme_code and scheme_name are required' });
  }

  try {
    const check = await pool.query('SELECT scheme_code FROM scholarship_schemes WHERE scheme_code = $1', [scheme_code]);
    if (check.rows.length > 0) {
      return res.status(409).json({ error: `Scheme with code ${scheme_code} already exists` });
    }

    const insertSql = `
      INSERT INTO scholarship_schemes (
        scheme_code, scheme_name, description,
        min_cgpa, min_attendance, max_family_income, max_arrears,
        slab_1_min_cgpa, slab_1_max_cgpa, slab_1_amount,
        slab_2_min_cgpa, slab_2_max_cgpa, slab_2_amount,
        slab_3_min_cgpa, slab_3_max_cgpa, slab_3_amount,
        deadline, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await pool.query(insertSql, [
      scheme_code,
      scheme_name,
      description || '',
      parseFloat(min_cgpa) || 7.50,
      parseFloat(min_attendance) || 75.00,
      parseFloat(max_family_income) || 250000.00,
      parseInt(max_arrears, 10) || 0,
      parseFloat(slab_1_min_cgpa) || 9.00,
      parseFloat(slab_1_max_cgpa) || 10.00,
      parseFloat(slab_1_amount) || 20000.00,
      parseFloat(slab_2_min_cgpa) || 8.00,
      parseFloat(slab_2_max_cgpa) || 8.99,
      parseFloat(slab_2_amount) || 15000.00,
      parseFloat(slab_3_min_cgpa) || 7.50,
      parseFloat(slab_3_max_cgpa) || 7.99,
      parseFloat(slab_3_amount) || 10000.00,
      deadline || null,
      is_active !== undefined ? is_active : true,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('SCHEME_CREATE', 'ADMIN', $1)`,
      [JSON.stringify({ scheme_code, scheme_name })]
    );

    return res.status(201).json({ message: 'Scheme created successfully', scheme: result.rows[0] });
  } catch (err: any) {
    console.error('createScheme error:', err);
    return res.status(500).json({ error: 'Failed to create scholarship scheme' });
  }
}

export async function updateScheme(req: Request, res: Response) {
  const { code } = req.params;
  const {
    scheme_name,
    description,
    min_cgpa,
    min_attendance,
    max_family_income,
    max_arrears,
    slab_1_min_cgpa,
    slab_1_max_cgpa,
    slab_1_amount,
    slab_2_min_cgpa,
    slab_2_max_cgpa,
    slab_2_amount,
    slab_3_min_cgpa,
    slab_3_max_cgpa,
    slab_3_amount,
    deadline,
    is_active,
  } = req.body;

  try {
    const check = await pool.query('SELECT scheme_code FROM scholarship_schemes WHERE scheme_code = $1', [code]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Scholarship scheme not found' });
    }

    const updateSql = `
      UPDATE scholarship_schemes
      SET scheme_name = COALESCE($1, scheme_name),
          description = COALESCE($2, description),
          min_cgpa = COALESCE($3, min_cgpa),
          min_attendance = COALESCE($4, min_attendance),
          max_family_income = COALESCE($5, max_family_income),
          max_arrears = COALESCE($6, max_arrears),
          slab_1_min_cgpa = COALESCE($7, slab_1_min_cgpa),
          slab_1_max_cgpa = COALESCE($8, slab_1_max_cgpa),
          slab_1_amount = COALESCE($9, slab_1_amount),
          slab_2_min_cgpa = COALESCE($10, slab_2_min_cgpa),
          slab_2_max_cgpa = COALESCE($11, slab_2_max_cgpa),
          slab_2_amount = COALESCE($12, slab_2_amount),
          slab_3_min_cgpa = COALESCE($13, slab_3_min_cgpa),
          slab_3_max_cgpa = COALESCE($14, slab_3_max_cgpa),
          slab_3_amount = COALESCE($15, slab_3_amount),
          deadline = COALESCE($16, deadline),
          is_active = COALESCE($17, is_active),
          updated_at = NOW()
      WHERE scheme_code = $18
      RETURNING *
    `;

    const result = await pool.query(updateSql, [
      scheme_name,
      description,
      min_cgpa !== undefined ? parseFloat(min_cgpa) : null,
      min_attendance !== undefined ? parseFloat(min_attendance) : null,
      max_family_income !== undefined ? parseFloat(max_family_income) : null,
      max_arrears !== undefined ? parseInt(max_arrears, 10) : null,
      slab_1_min_cgpa !== undefined ? parseFloat(slab_1_min_cgpa) : null,
      slab_1_max_cgpa !== undefined ? parseFloat(slab_1_max_cgpa) : null,
      slab_1_amount !== undefined ? parseFloat(slab_1_amount) : null,
      slab_2_min_cgpa !== undefined ? parseFloat(slab_2_min_cgpa) : null,
      slab_2_max_cgpa !== undefined ? parseFloat(slab_2_max_cgpa) : null,
      slab_2_amount !== undefined ? parseFloat(slab_2_amount) : null,
      slab_3_min_cgpa !== undefined ? parseFloat(slab_3_min_cgpa) : null,
      slab_3_max_cgpa !== undefined ? parseFloat(slab_3_max_cgpa) : null,
      slab_3_amount !== undefined ? parseFloat(slab_3_amount) : null,
      deadline,
      is_active,
      code,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('SCHEME_UPDATE', 'ADMIN', $1)`,
      [JSON.stringify({ scheme_code: code, updatedValues: req.body })]
    );

    return res.json({ message: 'Scheme updated successfully', scheme: result.rows[0] });
  } catch (err: any) {
    console.error('updateScheme error:', err);
    return res.status(500).json({ error: 'Failed to update scheme' });
  }
}
