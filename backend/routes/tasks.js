import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask
} from '../controllers/taskController.js';
import {
  createTaskSchema,
  taskFilterQuerySchema,
  taskIdParamSchema,
  updateTaskSchema
} from '../validators/taskValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createTaskSchema), createTask);
router.get('/', validate(taskFilterQuerySchema, 'query'), getTasks);
router.get('/:id', validate(taskIdParamSchema, 'params'), getTaskById);
router.patch('/:id', validate(taskIdParamSchema, 'params'), validate(updateTaskSchema), updateTask);
router.delete('/:id', validate(taskIdParamSchema, 'params'), deleteTask);

export default router;
