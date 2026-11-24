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

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', getStudents);
router.get('/export/csv', exportStudentsCsv);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.post('/bulk-csv', upload.single('file'), bulkUploadStudents);

export default router;
