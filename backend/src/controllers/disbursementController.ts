import { Response } from 'express';
import { pool } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDisbursements(req: AuthenticatedRequest, res: Response) {
  try {
    const { batch_id, payment_status } = req.query;
    let query = `
      SELECT d.*, s.name as student_name, s.department, a.scheme_code
      FROM disbursement_records d
      JOIN students s ON d.student_id = s.student_id
      LEFT JOIN scholarship_applications a ON d.application_id = a.application_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (batch_id) {
      query += ` AND d.batch_id = $${idx}`;
      params.push(batch_id);
      idx++;
    }

    if (payment_status && payment_status !== 'ALL') {
      query += ` AND d.payment_status = $${idx}`;
      params.push(payment_status);
      idx++;
    }

    query += ' ORDER BY d.created_at DESC, d.disbursement_id ASC';
    const result = await pool.query(query, params);
    return res.json({ disbursements: result.rows, total: result.rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve disbursement records' });
  }
}

export async function settleDisbursement(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { utr_number } = req.body;

  try {
    const check = await pool.query('SELECT * FROM disbursement_records WHERE disbursement_id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: `Disbursement record '${id}' not found` });
    }

    const currentRecord = check.rows[0];

    // Prevent duplicate disbursement settlement
    if (currentRecord.payment_status === 'SETTLED') {
      return res.status(409).json({
        error: `Duplicate settlement rejected: Disbursement '${id}' is already settled with UTR '${currentRecord.utr_number}' on ${currentRecord.payment_date}`,
      });
    }

    const utr = utr_number ? String(utr_number).trim() : `UTR${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const result = await pool.query(`
      UPDATE disbursement_records
      SET payment_status = 'SETTLED',
          payment_date = $1,
          utr_number = $2,
          updated_at = NOW()
      WHERE disbursement_id = $3
      RETURNING *
    `, [dateStr, utr, id]);

    // Mask bank account for audit log
    const rawAcc = currentRecord.bank_account_no || '';
    const maskedAcc = rawAcc.length > 4 ? `****${rawAcc.slice(-4)}` : '****';

    const actor = req.user?.username || 'DISBURSEMENT_OFFICER';
    await pool.query(
      `INSERT INTO audit_logs (action, performed_by, details)
       VALUES ('DISBURSEMENT_SETTLE', $1, $2)`,
      [actor, JSON.stringify({
        disbursement_id: id,
        application_id: currentRecord.application_id,
        student_id: currentRecord.student_id,
        utr,
        amount: currentRecord.award_amount,
        maskedAccount: maskedAcc,
      })]
    );

    return res.json({
      message: 'Disbursement settled successfully',
      disbursement: result.rows[0],
    });
  } catch (err: any) {
    console.error('settleDisbursement error:', err.message || err);
    return res.status(500).json({ error: 'Failed to settle disbursement: ' + err.message });
  }
}

export async function exportDisbursementsCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await pool.query(`
      SELECT d.disbursement_id, d.batch_id, d.application_id, d.student_id,
             s.name as student_name, d.award_amount, d.bank_account_no, d.bank_ifsc,
             d.payment_status, d.payment_date, d.utr_number
      FROM disbursement_records d
      JOIN students s ON d.student_id = s.student_id
      ORDER BY d.disbursement_id ASC
    `);

    const headers = 'disbursement_id,batch_id,application_id,student_id,student_name,award_amount,bank_account_no,bank_ifsc,payment_status,payment_date,utr_number\n';
    const rows = result.rows
      .map(r => `${r.disbursement_id},${r.batch_id},${r.application_id},${r.student_id},"${r.student_name}",${r.award_amount},${r.bank_account_no},${r.bank_ifsc},${r.payment_status},${r.payment_date || ''},${r.utr_number || ''}`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="disbursements_instruction_file.csv"');
    return res.send(headers + rows);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export disbursement CSV' });
  }
}
