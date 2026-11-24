import { Request, Response } from 'express';
import { CobolService } from '../services/cobolService';
import { pool } from '../database/db';

export async function executeBatch(req: Request, res: Response) {
  try {
    const { batchId } = req.body;
    const result = await CobolService.executeBatch(batchId);
    return res.json({
      message: 'COBOL Batch processing executed successfully',
      result,
    });
  } catch (err: any) {
    console.error('executeBatch error:', err);
    return res.status(500).json({
      error: 'Batch processing execution failed: ' + err.message,
    });
  }
}

export async function getBatchJobs(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT * FROM batch_jobs ORDER BY created_at DESC');
    return res.json({ jobs: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve batch jobs' });
  }
}

export async function getBatchJobById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const jobRes = await pool.query('SELECT * FROM batch_jobs WHERE batch_id = $1', [id]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: 'Batch job not found' });
    }

    const eligRes = await pool.query(
      `SELECT e.*, s.name as student_name, s.department
       FROM eligibility_results e
       LEFT JOIN students s ON e.student_id = s.student_id
       WHERE e.batch_id = $1
       ORDER BY e.status ASC, e.award_amount DESC`,
      [id]
    );

    const disbRes = await pool.query(
      `SELECT d.*, s.name as student_name
       FROM disbursement_records d
       LEFT JOIN students s ON d.student_id = s.student_id
       WHERE d.batch_id = $1
       ORDER BY d.award_amount DESC`,
      [id]
    );

    return res.json({
      job: jobRes.rows[0],
      eligibilityResults: eligRes.rows,
      disbursements: disbRes.rows,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve batch job details' });
  }
}
