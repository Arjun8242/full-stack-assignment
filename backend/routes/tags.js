import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTag,
  deleteTag,
  getTags,
  updateTag
} from '../controllers/tagController.js';
import {
  createTagSchema,
  tagIdParamSchema,
  updateTagSchema
} from '../validators/tagValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createTagSchema), createTag);
router.get('/', getTags);
router.patch('/:id', validate(tagIdParamSchema, 'params'), validate(updateTagSchema), updateTag);
router.delete('/:id', validate(tagIdParamSchema, 'params'), deleteTag);

export default router;
