import { Router } from 'express';
import { getDisbursements, settleDisbursement, exportDisbursementsCsv } from '../controllers/disbursementController';

const router = Router();

router.get('/', getDisbursements);
router.get('/export/csv', exportDisbursementsCsv);
router.post('/:id/settle', settleDisbursement);

export default router;
