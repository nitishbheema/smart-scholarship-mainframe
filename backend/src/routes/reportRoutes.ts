import { Router } from 'express';
import { getDashboardSummary, getEligibilityResults, getAuditLogs } from '../controllers/reportController';

const router = Router();

router.get('/summary', getDashboardSummary);
router.get('/eligibility', getEligibilityResults);
router.get('/audit-logs', getAuditLogs);

export default router;
