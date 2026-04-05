import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../controllers/categoryController.js';
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema
} from '../validators/categoryValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createCategorySchema), createCategory);
router.get('/', getCategories);
router.patch('/:id', validate(categoryIdParamSchema, 'params'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', validate(categoryIdParamSchema, 'params'), deleteCategory);

export default router;
