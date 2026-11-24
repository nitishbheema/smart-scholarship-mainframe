import { Router } from 'express';
import { getDisbursements, settleDisbursement, exportDisbursementsCsv } from '../controllers/disbursementController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Disbursement read & export - all authenticated roles
router.get('/', authenticateToken, getDisbursements);
router.get('/export/csv', authenticateToken, exportDisbursementsCsv);

// Disbursement settlement - ADMIN and OPERATOR only
router.post('/:id/settle', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), settleDisbursement);

export default router;
