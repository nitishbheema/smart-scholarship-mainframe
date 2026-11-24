import { Router } from 'express';
import { getSchemes, getSchemeByCode, createScheme, updateScheme } from '../controllers/schemeController';

const router = Router();

router.get('/', getSchemes);
router.get('/:code', getSchemeByCode);
router.post('/', createScheme);
router.put('/:code', updateScheme);

export default router;
