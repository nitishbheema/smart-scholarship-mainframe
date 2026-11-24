import { Router } from 'express';
import { executeBatch, getBatchJobs, getBatchJobById } from '../controllers/batchController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Batch job inspection - all authenticated roles
router.get('/jobs', authenticateToken, getBatchJobs);
router.get('/jobs/:id', authenticateToken, getBatchJobById);

// COBOL Batch triggering - ADMIN and OPERATOR only
router.post('/execute', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), executeBatch);

export default router;
