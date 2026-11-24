import { Router } from 'express';
import { getSchemes, getSchemeByCode, createScheme, updateScheme } from '../controllers/schemeController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Read operations - all authenticated users
router.get('/', authenticateToken, getSchemes);
router.get('/:code', authenticateToken, getSchemeByCode);

// Configuration administration - ADMIN role only
router.post('/', authenticateToken, requireRole(['ADMIN']), createScheme);
router.put('/:code', authenticateToken, requireRole(['ADMIN']), updateScheme);

export default router;
