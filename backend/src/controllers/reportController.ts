import { Request, Response } from 'express';
import { pool } from '../database/db';

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const studentsCount = await pool.query('SELECT COUNT(*) FROM students');
    const schemesCount = await pool.query('SELECT COUNT(*) FROM scholarship_schemes');
    const appsCount = await pool.query('SELECT COUNT(*) FROM scholarship_applications');
    const eligibleCount = await pool.query("SELECT COUNT(*) FROM scholarship_applications WHERE status = 'ELIGIBLE'");
    const rejectedCount = await pool.query("SELECT COUNT(*) FROM scholarship_applications WHERE status = 'REJECTED'");
    const pendingCount = await pool.query("SELECT COUNT(*) FROM scholarship_applications WHERE status IN ('SUBMITTED', 'PENDING_BATCH')");

    const disbTotals = await pool.query(`
      SELECT 
        COALESCE(SUM(award_amount), 0) as total_disbursed,
        COALESCE(SUM(CASE WHEN payment_status = 'SETTLED' THEN award_amount ELSE 0 END), 0) as settled_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN award_amount ELSE 0 END), 0) as pending_amount
      FROM disbursement_records
    `);

    const rejectionsByReason = await pool.query(`
      SELECT reason_code, COUNT(*) as count
      FROM eligibility_results
      WHERE status IN ('R', 'D', 'I')
      GROUP BY reason_code
      ORDER BY count DESC
    `);

    const deptDistribution = await pool.query(`
      SELECT department, COUNT(*) as student_count
      FROM students
      GROUP BY department
      ORDER BY student_count DESC
    `);

    const recentBatches = await pool.query(`
      SELECT * FROM batch_jobs ORDER BY created_at DESC LIMIT 5
    `);

    return res.json({
      summary: {
        totalStudents: parseInt(studentsCount.rows[0].count, 10),
        totalSchemes: parseInt(schemesCount.rows[0].count, 10),
        totalApplications: parseInt(appsCount.rows[0].count, 10),
        eligibleApplications: parseInt(eligibleCount.rows[0].count, 10),
        rejectedApplications: parseInt(rejectedCount.rows[0].count, 10),
        pendingApplications: parseInt(pendingCount.rows[0].count, 10),
        totalDisbursed: parseFloat(disbTotals.rows[0].total_disbursed),
        settledAmount: parseFloat(disbTotals.rows[0].settled_amount),
        pendingDisbursementAmount: parseFloat(disbTotals.rows[0].pending_amount),
        approvalRate: parseInt(appsCount.rows[0].count, 10) > 0
          ? ((parseInt(eligibleCount.rows[0].count, 10) / parseInt(appsCount.rows[0].count, 10)) * 100).toFixed(1)
          : '0.0',
      },
      rejectionsByReason: rejectionsByReason.rows,
      departmentDistribution: deptDistribution.rows,
      recentBatches: recentBatches.rows,
    });
  } catch (err: any) {
    console.error('getDashboardSummary error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dashboard summary' });
  }
}

export async function getEligibilityResults(req: Request, res: Response) {
  try {
    const { batch_id, status, reason_code } = req.query;
    let query = `
      SELECT e.*, s.name as student_name, s.department, s.course, sc.scheme_name
      FROM eligibility_results e
      JOIN students s ON e.student_id = s.student_id
      JOIN scholarship_schemes sc ON e.scheme_code = sc.scheme_code
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (batch_id) {
      query += ` AND e.batch_id = $${idx}`;
      params.push(batch_id);
      idx++;
    }

    if (status && status !== 'ALL') {
      query += ` AND e.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (reason_code && reason_code !== 'ALL') {
      query += ` AND e.reason_code = $${idx}`;
      params.push(reason_code);
      idx++;
    }

    query += ' ORDER BY e.created_at DESC, e.id DESC';
    const result = await pool.query(query, params);
    return res.json({ results: result.rows, total: result.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve eligibility results' });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    return res.json({ logs: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
}
