import { Router } from 'express';
import multer from 'multer';
import {
  getApplications,
  getApplicationById,
  createApplication,
  bulkUploadApplications,
} from '../controllers/applicationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB restriction
});

const router = Router();

// Read operations - all authenticated users
router.get('/', authenticateToken, getApplications);
router.get('/:id', authenticateToken, getApplicationById);

// Application ingestion - ADMIN and OPERATOR
router.post('/', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), createApplication);
router.post('/bulk-csv', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), upload.single('file'), bulkUploadApplications);

export default router;
