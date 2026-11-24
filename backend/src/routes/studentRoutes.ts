import { Router } from 'express';
import multer from 'multer';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  exportStudentsCsv,
} from '../controllers/studentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB restriction
});

const router = Router();

// Read operations - all authenticated roles (ADMIN, OPERATOR, AUDITOR)
router.get('/', authenticateToken, getStudents);
router.get('/export/csv', authenticateToken, exportStudentsCsv);
router.get('/:id', authenticateToken, getStudentById);

// Modification operations - ADMIN and OPERATOR only
router.post('/', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), createStudent);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), updateStudent);
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), deleteStudent);
router.post('/bulk-csv', authenticateToken, requireRole(['ADMIN', 'OPERATOR']), upload.single('file'), bulkUploadStudents);

export default router;
