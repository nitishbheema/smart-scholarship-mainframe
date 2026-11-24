import { Router } from 'express';
import { executeBatch, getBatchJobs, getBatchJobById } from '../controllers/batchController';

const router = Router();

router.post('/execute', executeBatch);
router.get('/jobs', getBatchJobs);
router.get('/jobs/:id', getBatchJobById);

export default router;
