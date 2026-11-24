import { Router } from 'express';
import multer from 'multer';
import {
  getApplications,
  getApplicationById,
  createApplication,
  bulkUploadApplications,
} from '../controllers/applicationController';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.post('/', createApplication);
router.post('/bulk-csv', upload.single('file'), bulkUploadApplications);

export default router;
