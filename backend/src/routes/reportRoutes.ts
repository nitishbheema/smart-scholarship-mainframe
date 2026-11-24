import { Router } from 'express';
import { getDashboardSummary, getEligibilityResults, getAuditLogs } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Audit and reporting routes - all authenticated roles (ADMIN, OPERATOR, AUDITOR)
router.get('/summary', authenticateToken, getDashboardSummary);
router.get('/eligibility', authenticateToken, getEligibilityResults);
router.get('/audit-logs', authenticateToken, getAuditLogs);

export default router;
